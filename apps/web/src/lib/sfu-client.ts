/**
 * Wachaut SFU Client — wraps mediasoup-client for use in Svelte 5.
 *
 * Usage:
 *   const sfu = new SfuClient('wss://api-sfu-wachaut.billytech.es');
 *   await sfu.joinRoom(roomId, pin, displayName, 'viewer');
 *   const stream = await sfu.consume();
 */

import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

type SfuEvents = {
  connected: () => void;
  disconnected: (reason: string) => void;
  'peer-joined': (data: { peerId: string; displayName: string; role: string }) => void;
  'peer-left': (data: { peerId: string; displayName: string }) => void;
  'stream-ready': (stream: MediaStream) => void;
  error: (message: string) => void;
};

export class SfuClient {
  #socket: Socket | null = null;
  #device: mediasoupClient.Device;
  #sendTransport: mediasoupClient.Transport | null = null;
  #recvTransport: mediasoupClient.Transport | null = null;
  #producer: mediasoupClient.Producer | null = null;
  #consumers: Map<string, mediasoupClient.Consumer> = new Map();
  #url: string;
  #listeners: Map<string, Function[]> = new Map();
  #rtpCapabilities: any = null;

  constructor(url: string) {
    this.#url = url;
    this.#device = new mediasoupClient.Device();
  }

  on(event: string, fn: Function) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    this.#listeners.get(event)!.push(fn);
  }

  off(event: string, fn: Function) {
    const fns = this.#listeners.get(event);
    if (fns) this.#listeners.set(event, fns.filter((f) => f !== fn));
  }

  #emit(event: string, ...args: any[]) {
    this.#listeners.get(event)?.forEach((fn) => fn(...args));
  }

  async joinRoom(
    roomId: string,
    pin: string,
    displayName: string,
    role: 'host' | 'viewer'
  ): Promise<{ rtpCapabilities: any; peers: any[] }> {
    return new Promise((resolve, reject) => {
      this.#socket = io(this.#url, {
        transports: ['websocket'],
      });

      this.#socket.on('connect', () => {
        this.#socket!.emit(
          'join-room',
          { roomId, pin, displayName, role },
          async (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }

            // Load device with router's RTP capabilities
            this.#rtpCapabilities = response.rtpCapabilities;
            await this.#device.load({
              routerRtpCapabilities: response.rtpCapabilities,
            });

            this.#emit('connected');
            resolve(response);
          }
        );
      });

      this.#socket.on('disconnect', (reason) => {
        this.#emit('disconnected', reason);
      });

      this.#socket.on('peer-joined', (data) => {
        this.#emit('peer-joined', data);
      });

      this.#socket.on('peer-left', (data) => {
        this.#emit('peer-left', data);
      });

      this.#socket.on('connect_error', (err) => {
        reject(err);
      });
    });
  }

  async produce(screenStream: MediaStream): Promise<void> {
    if (!this.#device.loaded && this.#rtpCapabilities) {
      await this.#device.load({ routerRtpCapabilities: this.#rtpCapabilities });
    }
    if (!this.#device.loaded) throw new Error('Device not loaded');

    // Create send transport
    const transportParams = await this.#createTransport('prod');
    this.#sendTransport = this.#device.createSendTransport(transportParams);

    this.#sendTransport.on('connect', async ({ dtlsParameters }: any, callback: any) => {
      this.#socket!.emit('connect-transport', {
        transportId: this.#sendTransport!.id,
        dtlsParameters,
      });
      callback();
    });

    this.#sendTransport.on('produce', async ({ kind, rtpParameters, appData }: any, callback: any) => {
      const response = await new Promise<any>((resolve) => {
        this.#socket!.emit(
          'produce',
          {
            transportId: this.#sendTransport!.id,
            kind,
            rtpParameters,
            appData,
          },
          resolve
        );
      });
      callback({ id: response.id });
    });

    // Produce video
    const videoTrack = screenStream.getVideoTracks()[0];
    if (videoTrack) {
      this.#producer = await this.#sendTransport.produce({
        track: videoTrack,
        appData: { mediaTag: 'screen-video' },
        encodings: [
          { maxBitrate: 5_000_000, scaleXResolutionDownBy: 1 },
        ],
        codecOptions: { videoGoogleStartBitrate: 1_000_000 },
      });
    }

    // Produce audio if present
    const audioTrack = screenStream.getAudioTracks()[0];
    if (audioTrack) {
      await this.#sendTransport.produce({
        track: audioTrack,
        appData: { mediaTag: 'screen-audio' },
      });
    }
  }

  async consume(): Promise<MediaStream> {
    if (!this.#device.loaded && this.#rtpCapabilities) {
      await this.#device.load({ routerRtpCapabilities: this.#rtpCapabilities });
    }
    if (!this.#device.loaded) throw new Error('Device not loaded');

    // Create receive transport
    const transportParams = await this.#createTransport('cons');
    this.#recvTransport = this.#device.createRecvTransport(transportParams);

    this.#recvTransport.on('connect', async ({ dtlsParameters }: any, callback: any) => {
      this.#socket!.emit('connect-transport', {
        transportId: this.#recvTransport!.id,
        dtlsParameters,
      });
      callback();
    });

    const stream = new MediaStream();

    this.#socket!.on('new-consumer', async (data: any) => {
      const consumer = await this.#handleNewConsumer(data);
      if (consumer) {
        stream.addTrack(consumer.track);
        this.#emit('stream-ready', stream);
      }
    });

    return stream;
  }

  async #handleNewConsumer(data: any): Promise<mediasoupClient.Consumer | null> {
    if (!this.#recvTransport) return null;

    const consumer = await this.#recvTransport.consume({
      id: data.consumerId,
      producerId: data.producerId,
      kind: data.kind,
      rtpParameters: data.rtpParameters,
    });

    this.#consumers.set(consumer.id, consumer);

    // Resume consumer
    this.#socket!.emit('resume-consumer', { consumerId: consumer.id });

    return consumer;
  }

  async #createTransport(direction: 'prod' | 'cons'): Promise<any> {
    return new Promise((resolve) => {
      this.#socket!.emit('create-transport', { direction }, resolve);
    });
  }

  stopProducing() {
    if (this.#producer) {
      this.#producer.close();
      this.#socket?.emit('close-producer', { producerId: this.#producer.id });
      this.#producer = null;
    }
  }
  /**
   * Get RTC stats from the receive transport's internal PeerConnection.
   * Returns null if no receive transport is active.
   */
  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.#recvTransport) return null;
    try {
      // mediasoup-client stores the PeerConnection on the handler
      const handler = (this.#recvTransport as any)._handler;
      const pc = handler?._pc;
      if (pc && typeof pc.getStats === 'function') {
        return await pc.getStats();
      }
    } catch (err) {
      console.error('[sfu-client] getStats error:', err);
    }
    return null;
  }

  disconnect() {
    this.stopProducing();
    for (const [, consumer] of this.#consumers) consumer.close();
    this.#consumers.clear();
    this.#sendTransport?.close();
    this.#recvTransport?.close();
    this.#socket?.disconnect();
    this.#socket = null;
    this.#listeners.clear();
  }
}
