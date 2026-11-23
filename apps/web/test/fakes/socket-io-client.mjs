/**
 * Stand-in for socket.io-client. Every io() call hands out a fake socket that
 * records what the client emits; the test plays the SFU: it decides when (and
 * whether) each ack is answered and delivers events in the order it wants.
 * Nothing here is asynchronous.
 */
const sockets = [];

export function io() {
  const socket = new FakeSocket();
  sockets.push(socket);
  return socket;
}

/** The socket of the most recently created SfuClient. */
export function lastSocket() {
  return sockets.at(-1);
}

export function resetSockets() {
  sockets.length = 0;
}

/** The ack callback of a recorded emit (its last argument), if it has one. */
export function ackOf(call) {
  const last = call?.args.at(-1);
  return typeof last === 'function' ? last : undefined;
}

export class FakeSocket {
  connected = false;
  #handlers = new Map();
  /** Every emit, in order: { event, args } — ack callback included. */
  sent = [];

  on(event, fn) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, []);
    this.#handlers.get(event).push(fn);
    return this;
  }

  emit(event, ...args) {
    this.sent.push({ event, args });
    return this;
  }

  disconnect() {
    this.connected = false;
    return this;
  }

  /** The SFU delivers an event. */
  receive(event, ...args) {
    for (const fn of this.#handlers.get(event) ?? []) fn(...args);
  }

  /** The emits of one event, oldest first. */
  calls(event) {
    return this.sent.filter((s) => s.event === event);
  }
}
