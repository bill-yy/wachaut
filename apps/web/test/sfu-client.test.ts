import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { lastSocket, resetSockets, ackOf } from './fakes/socket-io-client.mjs';
import { reports, resetReports } from './fakes/error-report.mjs';
import {
  transports,
  resetMediasoup,
  setLoadImpl,
  setConsumeImpl,
  makeConsumer,
} from './fakes/mediasoup-client.mjs';
import { SfuClient } from '../src/lib/sfu-client.ts';

// The client puts consumer tracks on a MediaStream, a browser global.
class FakeMediaStream {
  #tracks: unknown[] = [];
  addTrack(track: unknown) {
    this.#tracks.push(track);
  }
  removeTrack(track: unknown) {
    this.#tracks = this.#tracks.filter((t) => t !== track);
  }
  getTracks() {
    return [...this.#tracks];
  }
}
(globalThis as any).MediaStream ??= FakeMediaStream;

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

/**
 * Run `body` and report the rejections nobody caught while it ran. With a
 * listener attached Node does not act on them, so this is the whole check.
 */
async function unhandledRejections(body: () => Promise<void> | void): Promise<unknown[]> {
  const seen: unknown[] = [];
  const listener = (reason: unknown) => seen.push(reason);
  process.on('unhandledRejection', listener);
  try {
    await body();
    await flush();
    return seen;
  } finally {
    process.off('unhandledRejection', listener);
  }
}

const JOIN = ['sala-1', '1234', 'Ana', 'viewer'] as const;
const ANSWER = { rtpCapabilities: { codecs: [] }, peers: [] };
const TRANSPORT = { id: 'transport-1', iceParameters: {}, iceCandidates: [], dtlsParameters: {} };
/** A join that never settles must fail as a timeout, not hang the run. */
const LIMIT = { timeout: 5000 };

/** A connected client whose join-room request is out, waiting for the SFU. */
function joining() {
  const client = new SfuClient('wss://sfu.test');
  const join = client.joinRoom(...JOIN);
  const socket = lastSocket();
  socket.connected = true;
  socket.receive('connect');
  return { client, socket, join };
}

/** The SFU answers the client's latest request of that event. */
function answer(socket: any, event: string, response: unknown) {
  const ack = ackOf(socket.calls(event).at(-1));
  assert.ok(ack, `the client emitted "${event}" with an ack`);
  ack(response);
}

beforeEach(() => {
  resetSockets();
  resetReports();
  resetMediasoup();
});

// ─── The page leaves while the SFU is answering ──────────────────────
// disconnect() drops the socket. Whatever was waiting on the SFU used to
// resume onto that null socket ("Cannot read properties of null (reading
// 'emit')", prod error panel 2026-11) and, from a socket callback, as an
// unhandled rejection nobody saw.

test('join: an answer that arrives after the page left is dropped', LIMIT, async () => {
  const rejections = await unhandledRejections(async () => {
    const { client, socket } = joining();
    const ack = ackOf(socket.calls('join-room')[0]);
    client.disconnect();
    ack(ANSWER);
    await flush();
    assert.equal(socket.calls('rtp-capabilities').length, 0);
  });
  assert.deepEqual(rejections, []);
});

test('join: the page leaving while the device loads is dropped too', LIMIT, async () => {
  let started!: () => void;
  let release!: () => void;
  const loading = new Promise<void>((resolve) => {
    started = resolve;
  });
  setLoadImpl(
    () =>
      new Promise<void>((resolve) => {
        started();
        release = resolve;
      }),
  );

  const rejections = await unhandledRejections(async () => {
    const { client, socket } = joining();
    answer(socket, 'join-room', ANSWER);
    await loading;
    client.disconnect();
    release();
    await flush();
    assert.equal(socket.calls('rtp-capabilities').length, 0);
  });
  assert.deepEqual(rejections, []);
});

test('join: a device that cannot load rejects the join instead of hanging', LIMIT, async () => {
  setLoadImpl(async () => {
    throw new Error('Handshake error');
  });

  const rejections = await unhandledRejections(async () => {
    const { socket, join } = joining();
    answer(socket, 'join-room', ANSWER);
    await assert.rejects(join, /Handshake error/);
  });
  assert.deepEqual(rejections, []);
});

test('consume: the page leaving during the transport round trip builds nothing', LIMIT, async () => {
  const rejections = await unhandledRejections(async () => {
    const { client, socket, join } = joining();
    answer(socket, 'join-room', ANSWER);
    await join;

    const stream = client.consume();
    await flush();
    const ack = ackOf(socket.calls('create-transport').at(-1));
    client.disconnect();
    ack(TRANSPORT);

    // An abandoned setup must not leave a peer connection behind either.
    assert.deepEqual((await stream).getTracks(), []);
    assert.equal(transports.length, 0);
  });
  assert.deepEqual(rejections, []);
});

test('produce: the page leaving during the transport round trip builds nothing', LIMIT, async () => {
  const rejections = await unhandledRejections(async () => {
    const { client, socket, join } = joining();
    answer(socket, 'join-room', ANSWER);
    await join;

    const screen = { getVideoTracks: () => [{}], getAudioTracks: () => [] };
    const producing = client.produce(screen as any);
    await flush();
    const ack = ackOf(socket.calls('create-transport').at(-1));
    client.disconnect();
    ack(TRANSPORT);

    await producing;
    assert.equal(transports.length, 0);
  });
  assert.deepEqual(rejections, []);
});

// ─── Consumers ───────────────────────────────────────────────────────

test('new-consumer: a consumer that cannot be created is reported', LIMIT, async () => {
  setConsumeImpl(() => {
    throw new Error('UnsupportedError: channel count');
  });

  let socket: any;
  const rejections = await unhandledRejections(async () => {
    ({ socket } = await joinedViewer());
    socket.receive('new-consumer', { kind: 'video', consumerId: 'consumer-1' });
    await flush();
  });
  assert.deepEqual(rejections, []);
  assert.equal(reports.length, 1);
  assert.match(String(reports[0].err.message), /channel count/);
  assert.equal(reports[0].ctx.component, 'sfu.consume');
});

test('new-consumer: the track reaches the page once the SFU resumed it', LIMIT, async () => {
  setConsumeImpl(() => makeConsumer('consumer-1', 'video'));

  const { client, socket, stream } = await joinedViewer();
  const ready: unknown[] = [];
  client.on('stream-ready', (s: unknown) => ready.push(s));

  socket.receive('new-consumer', { kind: 'video', consumerId: 'consumer-1' });
  await flush();
  // Paused until the SFU confirms: nothing on the stream before that.
  assert.equal(stream.getTracks().length, 0);
  assert.deepEqual(socket.calls('resume-consumer')[0].args[0], { consumerId: 'consumer-1' });

  answer(socket, 'resume-consumer', { ok: true });
  await flush();
  assert.equal(stream.getTracks().length, 1);
  assert.deepEqual(ready, [stream]);
  assert.equal(reports.length, 0);
});

/** A viewer through its join and up to its receiving transport. */
async function joinedViewer() {
  const { client, socket, join } = joining();
  answer(socket, 'join-room', ANSWER);
  await join;

  const consuming = client.consume();
  await flush();
  answer(socket, 'create-transport', TRANSPORT);
  const stream = (await consuming) as FakeMediaStream;
  assert.equal(transports.length, 1);
  return { client, socket, stream };
}

// ─── The SFU goes away ───────────────────────────────────────────────

test('connect_error: the first join rejects for the page to report; an outage is one warning', LIMIT, async () => {
  // The client logs every connect_error it is handed below; keep the run readable.
  console.error = () => {};
  try {
    const cause = new Error('websocket error');

    // Joining while the SFU is down: the page's catch reports it with room
    // context (host.joinSfu / viewer.connectSfu).
    const { client, socket, join } = joining();
    socket.receive('connect_error', cause);
    await assert.rejects(join, cause);
    assert.equal(reports.length, 0);

    // Joined, then the SFU restarts: socket.io retries every few seconds.
    socket.receive('connect');
    answer(socket, 'join-room', ANSWER);
    await flush();
    socket.receive('connect_error', cause);
    socket.receive('connect_error', cause);
    socket.receive('connect_error', cause);
    assert.equal(reports.length, 1);
    assert.equal(reports[0].ctx.component, 'sfu.socket-connect');
    assert.equal(reports[0].ctx.severity, 'warning');

    // A new outage is a new warning.
    socket.receive('connect');
    answer(socket, 'join-room', ANSWER);
    await flush();
    socket.receive('connect_error', cause);
    assert.equal(reports.length, 2);

    client.disconnect();
  } finally {
    delete console.error;
  }
});
