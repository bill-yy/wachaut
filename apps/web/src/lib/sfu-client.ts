/**
 * Wachaut SFU Client — wraps mediasoup-client for use in Svelte 5.
 */

import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

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
  #pendingConsumers: Array<any> = [];
  #stream: MediaStream | null = null;

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
        console.log('[sfu] socket connected');
        this.#socket!.emit(
          'join-room',
          { roomId, pin, displayName, role },
          async (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }

            this.#rtpCapabilities = response.rtpCapabilities;
            await this.#device.load({
              routerRtpCapabilities: response.rtpCapabilities,
            });

            console.log('[sfu] device loaded, existing producers:', response.existingProducers?.length || 0);
            this.#emit('connected');
            resolve(response);
          }
        );
      });

      this.#socket.on('disconnect', (reason) => {
        console.log('[sfu] socket disconnected:', reason);
        this.#emit('disconnected', reason);
      });

      this.#socket.on('peer-joined', (data) => {
        this.#emit('peer-joined', data);
      });

      this.#socket.on('peer-left', (data) => {
        this.#emit('peer-left', data);
      });

      this.#socket.on('connect_error', (err) => {
        console.error('[sfu] socket error:', err);
        reject(err);
      });
    });
  }

  async produce(screenStream: MediaStream): Promise<void> {
    if (!this.#device.loaded && this.#rtpCapabilities) {
      await this.#device.load({ routerRtpCapabilities: this.#rtpCapabilities });
    }
    if (!this.#device.loaded) throw new Error('Device not loaded');

    const transportParams = await this.#createTransport('prod');
    this.#sendTransport = this.#device.createSendTransport(transportParams);

    this.#sendTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
      console.log('[sfu] send transport connect event');
      try {
        this.#socket!.emit('connect-transport', {
          transportId: this.#sendTransport!.id,
          dtlsParameters,
        }, (res: any) => {
          if (res?.error) {
            console.error('[sfu] send transport connect error:', res.error);
            errback(new Error(res.error));
          } else {
            console.log('[sfu] send transport connected OK');
            callback();
          }
        });
      } catch (err) {
        errback(err);
      }
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

    // Monitor ICE on send transport
    this.#monitorIce(this.#sendTransport, 'send');

    const videoTrack = screenStream.getVideoTracks()[0];
    if (videoTrack) {
      this.#producer = await this.#sendTransport.produce({
        track: videoTrack,
        appData: { mediaTag: 'screen-video' },
      });
      console.log('[sfu] Video producer created:', this.#producer.id);
    }

    const audioTrack = screenStream.getAudioTracks()[0];
    if (audioTrack) {
      const audioProducer = await this.#sendTransport.produce({
        track: audioTrack,
        appData: { mediaTag: 'screen-audio' },
      });
      console.log('[sfu] Audio producer created:', audioProducer.id);
    }
  }

  #monitorIce(transport: any, label: string) {
    try {
      const handler = transport._handler;
      const pc = handler?._pc;
      if (pc) {
        console.log(`[sfu] ${label} ICE initial state:`, pc.iceConnectionState);
        pc.addEventListener('iceconnectionstatechange', () => {
          console.log(`[sfu] ${label} ICE state:`, pc.iceConnectionState);
        });
        pc.addEventListener('icegatheringstatechange', () => {
          console.log(`[sfu] ${label} ICE gathering:`, pc.iceGatheringState);
        });
        pc.addEventListener('connectionstatechange', () => {
          console.log(`[sfu] ${label} PC state:`, pc.connectionState);
        });
      } else {
        console.log(`[sfu] ${label} PC not found, checking handler...`, !!handler);
      }
    } catch (e) {
      console.error(`[sfu] ${label} ICE monitor error:`, e);
    }
  }

  async consume(): Promise<MediaStream> {
    if (!this.#device.loaded && this.#rtpCapabilities) {
      await this.#device.load({ routerRtpCapabilities: this.#rtpCapabilities });
    }
    if (!this.#device.loaded) throw new Error('Device not loaded');

    this.#stream = new MediaStream();

    // Register new-consumer listener BEFORE creating transport
    this.#socket!.on('new-consumer', async (data: any) => {
      console.log('[sfu] new-consumer received:', data.kind, data.consumerId);
      if (this.#recvTransport) {
        const consumer = await this.#handleNewConsumer(data);
        if (consumer && this.#stream) {
          this.#stream.addTrack(consumer.track);
          this.#emit('stream-ready', this.#stream);
        }
      } else {
        this.#pendingConsumers.push(data);
      }
    });

    // Create receive transport
    const transportParams = await this.#createTransport('cons');
    this.#recvTransport = this.#device.createRecvTransport(transportParams);

    this.#recvTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
      console.log('[sfu] recv transport connect event');
      try {
        this.#socket!.emit('connect-transport', {
          transportId: this.#recvTransport!.id,
          dtlsParameters,
        }, (res: any) => {
          if (res?.error) {
            console.error('[sfu] recv transport connect error:', res.error);
            errback(new Error(res.error));
          } else {
            console.log('[sfu] recv transport connected OK');
            callback();
          }
        });
      } catch (err) {
        errback(err);
      }
    });

    // Monitor ICE on recv transport
    this.#monitorIce(this.#recvTransport, 'recv');

    // Process any consumers that arrived before the transport was ready
    if (this.#pendingConsumers.length > 0) {
      console.log(`[sfu] Processing ${this.#pendingConsumers.length} pending consumers`);
      for (const data of this.#pendingConsumers) {
        const consumer = await this.#handleNewConsumer(data);
        if (consumer && this.#stream) {
          this.#stream.addTrack(consumer.track);
          this.#emit('stream-ready', this.#stream);
        }
      }
      this.#pendingConsumers = [];
    }

    return this.#stream;
  }

  async #handleNewConsumer(data: any): Promise<mediasoupClient.Consumer | null> {
    if (!this.#recvTransport) return null;

    console.log('[sfu] Creating consumer for', data.kind, 'id:', data.consumerId);

    const consumer = await this.#recvTransport.consume({
      id: data.consumerId,
      producerId: data.producerId,
      kind: data.kind,
      rtpParameters: data.rtpParameters,
    });

    this.#consumers.set(consumer.id, consumer);

    console.log('[sfu] Consumer created:', consumer.id, 'kind:', consumer.kind, 'paused:', consumer.paused, 'track state:', consumer.track.readyState, 'track enabled:', consumer.track.enabled);

    // Resume consumer — use callback to wait for server confirmation
    await new Promise<void>((resolve) => {
      this.#socket!.emit('resume-consumer', { consumerId: consumer.id }, (res: any) => {
        console.log('[sfu] Resume result for', consumer.kind, ':', res?.ok ? 'OK' : 'FAILED');
        resolve();
      });
    });

    console.log('[sfu] Consumer after resume - paused:', consumer.paused);

    return consumer;
  }

  async #createTransport(direction: 'prod' | 'cons'): Promise<any> {
    return new Promise((resolve, reject) => {
      this.#socket!.emit('create-transport', { direction }, (res: any) => {
        if (res?.error) {
          console.error('[sfu] create-transport error:', res.error);
          reject(new Error(res.error));
        } else {
          console.log('[sfu] Transport created, direction:', direction, 'iceCandidates:', res.iceCandidates?.length || 0);
          resolve(res);
        }
      });
    });
  }

  stopProducing() {
    if (this.#producer) {
      this.#producer.close();
      this.#socket?.emit('close-producer', { producerId: this.#producer.id });
      this.#producer = null;
    }
  }

  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.#recvTransport) return null;
    try {
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

  get isDeviceLoaded() {
    return this.#device.loaded;
  }

  disconnect() {
    this.stopProducing();
    for (const [, consumer] of this.#consumers) consumer.close();
    this.#consumers.clear();
    this.#pendingConsumers = [];
    this.#sendTransport?.close();
    this.#recvTransport?.close();
    this.#socket?.disconnect();
    this.#socket = null;
    this.#stream = null;
    this.#listeners.clear();
  }
}
