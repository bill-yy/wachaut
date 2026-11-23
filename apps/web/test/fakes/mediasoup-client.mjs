/**
 * Stand-in for mediasoup-client: a Device whose load() the test steers, and
 * transports that only record what the SFU client does with them.
 */
const defaultLoad = async () => {};
const defaultConsume = () => makeConsumer('consumer-1', 'video');
const defaultProduce = () => makeProducer('producer-1', 'video');

let loadImpl = defaultLoad;
let consumeImpl = defaultConsume;
let produceImpl = defaultProduce;

/** Every transport the client created, oldest first. */
export const transports = [];

export function setLoadImpl(fn) {
  loadImpl = fn;
}

export function setConsumeImpl(fn) {
  consumeImpl = fn;
}

export function resetMediasoup() {
  loadImpl = defaultLoad;
  consumeImpl = defaultConsume;
  produceImpl = defaultProduce;
  transports.length = 0;
}

export function makeConsumer(id, kind) {
  return makeEndpoint(id, kind);
}

export function makeProducer(id, kind) {
  return makeEndpoint(id, kind);
}

function makeEndpoint(id, kind) {
  return {
    id,
    kind,
    track: { id: `${id}-track` },
    paused: true,
    closed: false,
    on() {},
    close() {
      this.closed = true;
    },
  };
}

export class Device {
  loaded = false;
  rtpCapabilities = { codecs: [] };

  async load() {
    await loadImpl();
    this.loaded = true;
  }

  createSendTransport(params) {
    return new FakeTransport('send', params);
  }

  createRecvTransport(params) {
    return new FakeTransport('recv', params);
  }
}

class FakeTransport {
  direction;
  id;
  closed = false;
  #handlers = new Map();

  constructor(direction, { id }) {
    this.direction = direction;
    this.id = id;
    transports.push(this);
  }

  on(event, fn) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, []);
    this.#handlers.get(event).push(fn);
    return this;
  }

  close() {
    this.closed = true;
  }

  /** The SFU answers the transport's request. */
  request(event, payload) {
    for (const fn of this.#handlers.get(event) ?? []) fn(payload, () => {}, () => {});
  }

  async produce() {
    return produceImpl();
  }

  async consume() {
    return consumeImpl();
  }
}
