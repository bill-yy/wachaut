/**
 * Wachaut SFU Client — wraps mediasoup-client for use in Svelte 5.
 *
 * mediasoup-client is loaded lazily (dynamic import) so the ~280KB bundle only
 * ships to the host/viewer routes, never to the landing page. The Device is
 * constructed on first use (joinRoom), not in the constructor.
 */

import { io, type Socket } from 'socket.io-client';
import { devlog, devwarn } from './utils/devlog';

// Lazy-loaded mediasoup-client module (assigned on first use).
let mediasoupModule: typeof import('mediasoup-client') | null = null;

export class SfuClient {
  #socket: Socket | null = null;
  #device: any = null;
  #sendTransport: any = null;
  #recvTransport: any = null;
  #producer: any = null;
  #audioProducer: any = null;
  #consumers: Map<string, any> = new Map();
  #url: string;
  #listeners: Map<string, Function[]> = new Map();
  #rtpCapabilities: any = null;
  #pendingConsumers: Array<any> = [];
  #stream: MediaStream | null = null;
  #iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

  constructor(url: string) {
    this.#url = url;
    // Device is created lazily in #ensureDevice() to avoid eager bundle load.
  }

  /** Lazily load mediasoup-client and create the Device on first use. */
  async #ensureDevice(): Promise<any> {
    if (this.#device) return this.#device;
    if (!mediasoupModule) {
      mediasoupModule = await import('mediasoup-client');
    }
    this.#device = new mediasoupModule.Device();
    return this.#device;
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
        devlog('[sfu] socket connected');
        this.#socket!.emit(
          'join-room',
          { roomId, pin, displayName, role },
          async (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }

            this.#rtpCapabilities = response.rtpCapabilities;

            // Read TURN/STUN credentials delivered via Socket.IO (no HTTP endpoint).
            if (Array.isArray(response.iceServers) && response.iceServers.length > 0) {
              this.#iceServers = [...this.#iceServers, ...response.iceServers];
              devlog('[sfu] TURN credentials received via join-room:', response.iceServers.length, 'server(s)');
            }

            const device = await this.#ensureDevice();
            await device.load({
              routerRtpCapabilities: response.rtpCapabilities,
            });

            // Send our RTP capabilities to the SFU for proper codec negotiation.
            const peerCaps = device.rtpCapabilities;
            this.#socket!.emit('rtp-capabilities', { rtpCapabilities: peerCaps });

            devlog('[sfu] device loaded, existing producers:', response.existingProducers?.length || 0);
            this.#emit('connected');
            resolve(response);
          }
        );
      });

      this.#socket.on('disconnect', (reason) => {
        devlog('[sfu] socket disconnected:', reason);
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

  async produce(screenStream: MediaStream, options?: { maxBitrate?: number }): Promise<void> {
    // Scale the SVC layer bitrates relative to the preset's max bitrate.
    // Default (no options) keeps the original 100k / 500k / 2.5M split.
    const maxBitrate = options?.maxBitrate ?? 2_500_000;
    const layerBitrates = [
      Math.round(maxBitrate * 0.04),  // base layer (~4%)
      Math.round(maxBitrate * 0.20),  // mid layer (~20%)
      maxBitrate,                      // top layer (100%)
    ];
    const startBitrate = Math.round(maxBitrate * 0.25); // 25% of max as sane start
    const device = await this.#ensureDevice();
    if (!device.loaded && this.#rtpCapabilities) {
      await device.load({ routerRtpCapabilities: this.#rtpCapabilities });
    }
    if (!device.loaded) throw new Error('Device not loaded');

    const transportParams = await this.#createTransport('prod');
    this.#sendTransport = device.createSendTransport({
      id: transportParams.id,
      iceParameters: transportParams.iceParameters,
      iceCandidates: transportParams.iceCandidates,
      dtlsParameters: transportParams.dtlsParameters,
      iceServers: transportParams.iceServers || this.#iceServers,
      iceTransportPolicy: 'all',
    });

    this.#sendTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
      devlog('[sfu] send transport connect event');
      try {
        this.#socket!.emit('connect-transport', {
          transportId: this.#sendTransport!.id,
          dtlsParameters,
        }, (res: any) => {
          if (res?.error) {
            console.error('[sfu] send transport connect error:', res.error);
            errback(new Error(res.error));
          } else {
            devlog('[sfu] send transport connected OK');
            callback();
          }
        });
      } catch (err) {
        errback(err);
      }
    });

    this.#sendTransport.on('produce', async ({ kind, rtpParameters, appData }: any, callback: any, errback: any) => {
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
      if (response.error) {
        console.error('[sfu] Produce error from server:', response.error);
        errback(new Error(response.error));
        return;
      }
      callback({ id: response.id });
    });

    // Monitor ICE on send transport
    this.#monitorIce(this.#sendTransport, 'send');

    const videoTrack = screenStream.getVideoTracks()[0];
    if (videoTrack) {
      // Try SVC (Scalable Video Coding) for adaptive layer selection.
      // Single encoding entry with scalabilityMode produces multiple layers
      // internally (3 spatial + 3 temporal for S3T3_KEY). The SFU selects
      // which layer each viewer receives via setPreferredLayers.
      const capabilities = device.rtpCapabilities;
      const canSvc = capabilities?.codecs?.some(
        (c: any) => ['video/vp9', 'video/av1'].includes(c.mimeType.toLowerCase())
      );

      if (canSvc) {
        try {
          // Prefer AV1 if available (better screen-share quality), else VP9
          const svcCodec = capabilities.codecs.find((c: any) => c.mimeType.toLowerCase() === 'video/av1')
            ? 'video/AV1'
            : undefined; // let mediasoup pick VP9 by default

          this.#producer = await this.#sendTransport.produce({
            track: videoTrack,
            appData: { mediaTag: 'screen-video' },
            ...(svcCodec ? { codec: svcCodec } : {}),
            codecOptions: {
              videoGoogleStartBitrate: Math.max(startBitrate, 100),
            },
            // Single SVC encoding — 3 spatial + 3 temporal layers internally
            encodings: [
              {
                maxBitrate: layerBitrates[2],
                scalabilityMode: 'S3T3_KEY',
              },
            ],
          });
          devlog('[sfu] Video producer created with SVC:', this.#producer.id, svcCodec || 'VP9');
        } catch (svcErr) {
          devwarn('[sfu] SVC failed, falling back to single encode:', svcErr);
          this.#producer = await this.#sendTransport.produce({
            track: videoTrack,
            appData: { mediaTag: 'screen-video' },
          });
          devlog('[sfu] Video producer created (fallback):', this.#producer.id);
        }
      } else {
        this.#producer = await this.#sendTransport.produce({
          track: videoTrack,
          appData: { mediaTag: 'screen-video' },
        });
        devlog('[sfu] Video producer created (no VP9):', this.#producer.id);
      }
    }

    const audioTrack = screenStream.getAudioTracks()[0];
    if (audioTrack) {
      this.#audioProducer = await this.#sendTransport.produce({
        track: audioTrack,
        appData: { mediaTag: 'screen-audio' },
      });
      devlog('[sfu] Audio producer created:', this.#audioProducer.id);
    }
  }

  #monitorIce(transport: any, label: string) {
    try {
      const handler = transport._handler;
      const pc = handler?._pc;
      if (pc) {
        devlog(`[sfu] ${label} ICE initial state:`, pc.iceConnectionState);
        pc.addEventListener('iceconnectionstatechange', () => {
          devlog(`[sfu] ${label} ICE state:`, pc.iceConnectionState);
        });
        pc.addEventListener('icegatheringstatechange', () => {
          devlog(`[sfu] ${label} ICE gathering:`, pc.iceGatheringState);
        });
        pc.addEventListener('connectionstatechange', () => {
          devlog(`[sfu] ${label} PC state:`, pc.connectionState);
        });
      } else {
        devlog(`[sfu] ${label} PC not found, checking handler...`, !!handler);
      }
    } catch (e) {
      console.error(`[sfu] ${label} ICE monitor error:`, e);
    }
  }

  async consume(): Promise<MediaStream> {
    const device = await this.#ensureDevice();
    if (!device.loaded && this.#rtpCapabilities) {
      await device.load({ routerRtpCapabilities: this.#rtpCapabilities });
    }
    if (!device.loaded) throw new Error('Device not loaded');

    this.#stream = new MediaStream();

    // Register new-consumer listener BEFORE creating transport
    this.#socket!.on('new-consumer', async (data: any) => {
      devlog('[sfu] new-consumer received:', data.kind, data.consumerId);
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
    this.#recvTransport = device.createRecvTransport({
      id: transportParams.id,
      iceParameters: transportParams.iceParameters,
      iceCandidates: transportParams.iceCandidates,
      dtlsParameters: transportParams.dtlsParameters,
      iceServers: transportParams.iceServers || this.#iceServers,
      iceTransportPolicy: 'all',
    });

    this.#recvTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
      devlog('[sfu] recv transport connect event');
      try {
        this.#socket!.emit('connect-transport', {
          transportId: this.#recvTransport!.id,
          dtlsParameters,
        }, (res: any) => {
          if (res?.error) {
            console.error('[sfu] recv transport connect error:', res.error);
            errback(new Error(res.error));
          } else {
            devlog('[sfu] recv transport connected OK');
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
      devlog(`[sfu] Processing ${this.#pendingConsumers.length} pending consumers`);
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

  async #handleNewConsumer(data: any): Promise<any> {
    if (!this.#recvTransport) return null;

    devlog('[sfu] Creating consumer for', data.kind, 'id:', data.consumerId);

    const consumer = await this.#recvTransport.consume({
      id: data.consumerId,
      producerId: data.producerId,
      kind: data.kind,
      rtpParameters: data.rtpParameters,
    });

    this.#consumers.set(consumer.id, consumer);

    // Clean up when the host stops producing or the transport closes.
    consumer.on('producerclose', () => {
      this.#consumers.delete(consumer.id);
      this.#stream?.removeTrack(consumer.track);
      devlog('[sfu] Consumer closed (producerclose):', consumer.id);
    });
    consumer.on('transportclose', () => {
      this.#consumers.delete(consumer.id);
      devlog('[sfu] Consumer closed (transportclose):', consumer.id);
    });

    devlog('[sfu] Consumer created:', consumer.id, 'kind:', consumer.kind, 'paused:', consumer.paused, 'track state:', consumer.track.readyState, 'track enabled:', consumer.track.enabled);

    // Resume consumer — use callback to wait for server confirmation
    await new Promise<void>((resolve) => {
      this.#socket!.emit('resume-consumer', { consumerId: consumer.id }, (res: any) => {
        devlog('[sfu] Resume result for', consumer.kind, ':', res?.ok ? 'OK' : 'FAILED');
        resolve();
      });
    });

    devlog('[sfu] Consumer after resume - paused:', consumer.paused);

    return consumer;
  }

  async #createTransport(direction: 'prod' | 'cons'): Promise<any> {
    return new Promise((resolve, reject) => {
      this.#socket!.emit('create-transport', { direction }, (res: any) => {
        if (res?.error) {
          console.error('[sfu] create-transport error:', res.error);
          reject(new Error(res.error));
        } else {
          devlog('[sfu] Transport created, direction:', direction, 'iceCandidates:', res.iceCandidates?.length || 0);
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
    if (this.#audioProducer) {
      this.#audioProducer.close();
      this.#socket?.emit('close-producer', { producerId: this.#audioProducer.id });
      this.#audioProducer = null;
    }
  }

  async getStats(): Promise<RTCStatsReport | null> {
    // Try recv transport first (viewer), then send transport (host).
    const transport = this.#recvTransport || this.#sendTransport;
    if (!transport) return null;
    try {
      const handler = (transport as any)._handler;
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
    return this.#device?.loaded ?? false;
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
