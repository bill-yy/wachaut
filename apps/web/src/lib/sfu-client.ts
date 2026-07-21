/**
 * Wachaut SFU Client — wraps mediasoup-client for use in Svelte 5.
 *
 * mediasoup-client is loaded lazily (dynamic import) so the ~280KB bundle only
 * ships to the host/viewer routes, never to the landing page. The Device is
 * constructed on first use (joinRoom), not in the constructor.
 */

import { io, type Socket } from "socket.io-client";
import { devlog, devwarn } from "./utils/devlog";

// Lazy-loaded mediasoup-client module (assigned on first use).
let mediasoupModule: typeof import("mediasoup-client") | null = null;

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
  #iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
  /** Stashed join params so we can re-emit join-room on every reconnect. */
  #joinParams: {
    roomId: string;
    pin: string;
    displayName: string;
    role: "host" | "viewer";
  } | null = null;
  /**
   * Interval that refreshes TURN credentials before they expire. Without this,
   * viewers behind symmetric NAT/firewalls lose their relay path at the
   * TURN_EXPIRY_SECONDS mark (default 30 min) and the transport dies.
   */
  #turnRefreshTimer: ReturnType<typeof setInterval> | null = null;
  /** MS between TURN refresh ticks. Defaults to 25 min (well under 30 min expiry). */
  static TURN_REFRESH_INTERVAL_MS = 25 * 60 * 1000;

  constructor(url: string) {
    this.#url = url;
    // Device is created lazily in #ensureDevice() to avoid eager bundle load.
  }

  /** Lazily load mediasoup-client and create the Device on first use. */
  async #ensureDevice(): Promise<any> {
    if (this.#device) return this.#device;
    if (!mediasoupModule) {
      mediasoupModule = await import("mediasoup-client");
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
    if (fns)
      this.#listeners.set(
        event,
        fns.filter((f) => f !== fn),
      );
  }

  #emit(event: string, ...args: any[]) {
    this.#listeners.get(event)?.forEach((fn) => fn(...args));
  }

  async joinRoom(
    roomId: string,
    pin: string,
    displayName: string,
    role: "host" | "viewer",
  ): Promise<{ rtpCapabilities: any; peers: any[] }> {
    return new Promise((resolve, reject) => {
      this.#socket = io(this.#url, {
        transports: ["websocket"],
      });
      // Stash params so we can re-emit join-room on every reconnect (Socket.IO
      // auto-reconnect fires `connect` again, but the original promise is
      // already settled — we still need the SFU to re-add us to the room).
      this.#joinParams = { roomId, pin, displayName, role };
      let firstJoin = true;

      const sendJoin = () => {
        if (!this.#socket || !this.#joinParams) return;
        const { roomId, pin, displayName, role } = this.#joinParams;
        this.#socket.emit(
          "join-room",
          { roomId, pin, displayName, role },
          async (response: any) => {
            if (response.error) {
              if (firstJoin) reject(new Error(response.error));
              else this.#emit("error", `Re-join failed: ${response.error}`);
              return;
            }

            this.#rtpCapabilities = response.rtpCapabilities;

            // Read TURN/STUN credentials delivered via Socket.IO (no HTTP endpoint).
            if (
              Array.isArray(response.iceServers) &&
              response.iceServers.length > 0
            ) {
              // Replace (don't accumulate) TURN entries on reconnect to avoid
              // duplicates; keep STUN entries.
              const stun = this.#iceServers.filter((s) => !s.username);
              this.#iceServers = [...stun, ...response.iceServers];
              devlog(
                "[sfu] TURN credentials received via join-room:",
                response.iceServers.length,
                "server(s)",
              );
              // Start periodic refresh so creds never expire mid-broadcast.
              this.#startTurnRefresh();
            }

            const device = await this.#ensureDevice();
            if (!device.loaded) {
              await device.load({
                routerRtpCapabilities: response.rtpCapabilities,
              });
            }

            // Send our RTP capabilities to the SFU for proper codec negotiation.
            const peerCaps = device.rtpCapabilities;
            this.#socket!.emit("rtp-capabilities", {
              rtpCapabilities: peerCaps,
            });

            if (firstJoin) {
              devlog(
                "[sfu] device loaded, existing producers:",
                response.existingProducers?.length || 0,
              );
              this.#emit("connected");
              firstJoin = false;
              resolve(response);
            } else {
              // Reconnect: tell the host page so it can re-produce if its
              // producers were closed during the outage.
              devlog("[sfu] re-join completed");
              this.#emit("reconnected", response);
            }
          },
        );
      };

      this.#socket.on("connect", () => {
        devlog("[sfu] socket connected");
        sendJoin();
      });

      this.#socket.on("disconnect", (reason) => {
        devlog("[sfu] socket disconnected:", reason);
        this.#emit("disconnected", reason);
      });

      this.#socket.on("peer-joined", (data) => {
        this.#emit("peer-joined", data);
      });

      this.#socket.on("peer-left", (data) => {
        this.#emit("peer-left", data);
      });

      this.#socket.on("connect_error", (err) => {
        console.error("[sfu] socket error:", err);
        // Only reject the initial join promise; on later reconnect attempts
        // socket.io will keep retrying and emit `connect` again.
        if (firstJoin) reject(err);
      });
    });
  }

  async produce(
    screenStream: MediaStream,
    options?: { maxBitrate?: number },
  ): Promise<void> {
    const maxBitrate = options?.maxBitrate ?? 2_500_000;
    const startBitrate = Math.round(maxBitrate * 0.25);
    const device = await this.#ensureDevice();
    if (!device.loaded && this.#rtpCapabilities) {
      await device.load({ routerRtpCapabilities: this.#rtpCapabilities });
    }
    if (!device.loaded) throw new Error("Device not loaded");

    const transportParams = await this.#createTransport("prod");
    this.#sendTransport = device.createSendTransport({
      id: transportParams.id,
      iceParameters: transportParams.iceParameters,
      iceCandidates: transportParams.iceCandidates,
      dtlsParameters: transportParams.dtlsParameters,
      iceServers: transportParams.iceServers || this.#iceServers,
      iceTransportPolicy: "all",
    });

    this.#sendTransport.on(
      "connect",
      async ({ dtlsParameters }: any, callback: any, errback: any) => {
        devlog("[sfu] send transport connect event");
        try {
          this.#socket!.emit(
            "connect-transport",
            {
              transportId: this.#sendTransport!.id,
              dtlsParameters,
            },
            (res: any) => {
              if (res?.error) {
                console.error("[sfu] send transport connect error:", res.error);
                errback(new Error(res.error));
              } else {
                devlog("[sfu] send transport connected OK");
                callback();
              }
            },
          );
        } catch (err) {
          errback(err);
        }
      },
    );

    this.#sendTransport.on(
      "produce",
      async (
        { kind, rtpParameters, appData }: any,
        callback: any,
        errback: any,
      ) => {
        devlog("[sfu] produce event for kind:", kind);
        const response = await new Promise<any>((resolve) => {
          this.#socket!.emit(
            "produce",
            {
              transportId: this.#sendTransport!.id,
              kind,
              rtpParameters,
              appData,
            },
            resolve,
          );
        });
        if (response.error) {
          console.error("[sfu] Produce error from server:", response.error);
          errback(new Error(response.error));
          return;
        }
        callback({ id: response.id });
      },
    );

    this.#monitorIce(this.#sendTransport, "send");

    // ── Video producer — single encode, default codec ───────────────────
    // Uses Chrome's default codec (VP8). VP9 was tested but caused the same
    // ICE stall as SVC — the transport never connects. VP8 single encode is
    // the only configuration confirmed working end-to-end in production.
    // Quality is controlled via maxBitrate from the preset.
    const videoTrack = screenStream.getVideoTracks()[0];
    if (videoTrack) {
      this.#producer = await this.#sendTransport.produce({
        track: videoTrack,
        appData: { mediaTag: "screen-video" },
        codecOptions: {
          videoGoogleStartBitrate: Math.max(startBitrate, 100),
          videoGoogleMaxBitrate: maxBitrate,
        },
      });
      devlog("[sfu] Video producer created:", this.#producer.id);
    }

    const audioTrack = screenStream.getAudioTracks()[0];
    if (audioTrack) {
      this.#audioProducer = await this.#sendTransport.produce({
        track: audioTrack,
        appData: { mediaTag: "screen-audio" },
      });
      devlog("[sfu] Audio producer created:", this.#audioProducer.id);
    }
  }

  #monitorIce(transport: any, label: string) {
    try {
      const handler = transport._handler;
      const pc = handler?._pc;
      if (!pc) {
        devlog(`[sfu] ${label} PC not found, checking handler...`, !!handler);
        return;
      }
      devlog(`[sfu] ${label} ICE initial state:`, pc.iceConnectionState);

      // If ICE stays "disconnected" for more than 10s we force an ICE restart
      // — this recovers from transient network blips (WiFi handoff, brief
      // packet loss, mobile network switch) without recreating the transport.
      let disconnectedSince: number | null = null;
      const DISCONNECT_RESTART_MS = 10_000;

      pc.addEventListener("iceconnectionstatechange", () => {
        const state = pc.iceConnectionState;
        devlog(`[sfu] ${label} ICE state:`, state);
        if (state === "failed") {
          console.error(`[sfu] ${label} ICE FAILED — forcing restartIce`);
          try {
            pc.restartIce();
          } catch (e) {
            console.error(`[sfu] ${label} restartIce error:`, e);
          }
          disconnectedSince = null;
        } else if (state === "disconnected") {
          if (disconnectedSince === null) disconnectedSince = Date.now();
          // Arm a restart if we stay disconnected too long.
          setTimeout(() => {
            if (
              pc.iceConnectionState === "disconnected" &&
              disconnectedSince !== null &&
              Date.now() - disconnectedSince >= DISCONNECT_RESTART_MS
            ) {
              console.warn(
                `[sfu] ${label} ICE disconnected >${DISCONNECT_RESTART_MS}ms — forcing restartIce`,
              );
              try {
                pc.restartIce();
              } catch (e) {
                console.error(`[sfu] ${label} restartIce error:`, e);
              }
              disconnectedSince = null;
            }
          }, DISCONNECT_RESTART_MS + 100);
        } else {
          // connected / completed / closed — clear the watchdog.
          disconnectedSince = null;
        }
      });
      pc.addEventListener("icegatheringstatechange", () => {
        devlog(`[sfu] ${label} ICE gathering:`, pc.iceGatheringState);
      });
      pc.addEventListener("connectionstatechange", () => {
        devlog(`[sfu] ${label} PC state:`, pc.connectionState);
      });
    } catch (e) {
      console.error(`[sfu] ${label} ICE monitor error:`, e);
    }
  }

  /**
   * Periodically refresh TURN credentials before they expire. Updates the
   * underlying RTCPeerConnections via setConfiguration so the new allocation
   * is used for the next ICE gathering (no transport rebuild required).
   */
  #startTurnRefresh() {
    if (this.#turnRefreshTimer) return; // already running
    this.#turnRefreshTimer = setInterval(() => {
      this.#refreshTurnCredentials().catch((err) => {
        console.error("[sfu] TURN refresh failed:", err);
      });
    }, SfuClient.TURN_REFRESH_INTERVAL_MS);
  }

  async #refreshTurnCredentials(): Promise<void> {
    if (!this.#socket) return;
    const res = await new Promise<any>((resolve) => {
      this.#socket!.emit("refresh-ice-servers", {}, resolve);
    });
    if (!res || !Array.isArray(res.iceServers) || res.iceServers.length === 0)
      return;
    // Replace any existing TURN entry with the fresh ones (keep STUN).
    const stun = this.#iceServers.filter((s) => !s.username);
    this.#iceServers = [...stun, ...res.iceServers];
    devlog(
      "[sfu] TURN credentials refreshed:",
      res.iceServers.length,
      "server(s)",
    );
    // Push the new config to any live PC so the next ICE restart uses it.
    for (const transport of [this.#sendTransport, this.#recvTransport]) {
      try {
        const pc = transport?._handler?._pc;
        if (pc && typeof pc.setConfiguration === "function") {
          pc.setConfiguration({ iceServers: this.#iceServers });
        }
      } catch (e) {
        console.error("[sfu] setConfiguration failed during TURN refresh:", e);
      }
    }
  }

  async consume(): Promise<MediaStream> {
    const device = await this.#ensureDevice();
    if (!device.loaded && this.#rtpCapabilities) {
      await device.load({ routerRtpCapabilities: this.#rtpCapabilities });
    }
    if (!device.loaded) throw new Error("Device not loaded");

    this.#stream = new MediaStream();

    // Register new-consumer listener BEFORE creating transport
    this.#socket!.on("new-consumer", async (data: any) => {
      devlog("[sfu] new-consumer received:", data.kind, data.consumerId);
      if (this.#recvTransport) {
        const consumer = await this.#handleNewConsumer(data);
        if (consumer && this.#stream) {
          this.#stream.addTrack(consumer.track);
          this.#emit("stream-ready", this.#stream);
        }
      } else {
        this.#pendingConsumers.push(data);
      }
    });

    // Create receive transport
    const transportParams = await this.#createTransport("cons");
    this.#recvTransport = device.createRecvTransport({
      id: transportParams.id,
      iceParameters: transportParams.iceParameters,
      iceCandidates: transportParams.iceCandidates,
      dtlsParameters: transportParams.dtlsParameters,
      iceServers: transportParams.iceServers || this.#iceServers,
      iceTransportPolicy: "all",
    });

    this.#recvTransport.on(
      "connect",
      async ({ dtlsParameters }: any, callback: any, errback: any) => {
        devlog("[sfu] recv transport connect event");
        try {
          this.#socket!.emit(
            "connect-transport",
            {
              transportId: this.#recvTransport!.id,
              dtlsParameters,
            },
            (res: any) => {
              if (res?.error) {
                console.error("[sfu] recv transport connect error:", res.error);
                errback(new Error(res.error));
              } else {
                devlog("[sfu] recv transport connected OK");
                callback();
              }
            },
          );
        } catch (err) {
          errback(err);
        }
      },
    );

    // Monitor ICE on recv transport
    this.#monitorIce(this.#recvTransport, "recv");

    // Process any consumers that arrived before the transport was ready
    if (this.#pendingConsumers.length > 0) {
      devlog(
        `[sfu] Processing ${this.#pendingConsumers.length} pending consumers`,
      );
      for (const data of this.#pendingConsumers) {
        const consumer = await this.#handleNewConsumer(data);
        if (consumer && this.#stream) {
          this.#stream.addTrack(consumer.track);
          this.#emit("stream-ready", this.#stream);
        }
      }
      this.#pendingConsumers = [];
    }

    return this.#stream;
  }

  async #handleNewConsumer(data: any): Promise<any> {
    if (!this.#recvTransport) return null;

    devlog("[sfu] Creating consumer for", data.kind, "id:", data.consumerId);

    const consumer = await this.#recvTransport.consume({
      id: data.consumerId,
      producerId: data.producerId,
      kind: data.kind,
      rtpParameters: data.rtpParameters,
    });

    this.#consumers.set(consumer.id, consumer);

    // Clean up when the host stops producing or the transport closes.
    consumer.on("producerclose", () => {
      this.#consumers.delete(consumer.id);
      this.#stream?.removeTrack(consumer.track);
      devlog("[sfu] Consumer closed (producerclose):", consumer.id);
    });
    consumer.on("transportclose", () => {
      this.#consumers.delete(consumer.id);
      devlog("[sfu] Consumer closed (transportclose):", consumer.id);
    });

    devlog(
      "[sfu] Consumer created:",
      consumer.id,
      "kind:",
      consumer.kind,
      "paused:",
      consumer.paused,
      "track state:",
      consumer.track.readyState,
      "track enabled:",
      consumer.track.enabled,
    );

    // Resume consumer — use callback to wait for server confirmation
    await new Promise<void>((resolve) => {
      this.#socket!.emit(
        "resume-consumer",
        { consumerId: consumer.id },
        (res: any) => {
          devlog(
            "[sfu] Resume result for",
            consumer.kind,
            ":",
            res?.ok ? "OK" : "FAILED",
          );
          resolve();
        },
      );
    });

    devlog("[sfu] Consumer after resume - paused:", consumer.paused);

    return consumer;
  }

  async #createTransport(direction: "prod" | "cons"): Promise<any> {
    return new Promise((resolve, reject) => {
      this.#socket!.emit("create-transport", { direction }, (res: any) => {
        if (res?.error) {
          console.error("[sfu] create-transport error:", res.error);
          reject(new Error(res.error));
        } else {
          devlog(
            "[sfu] Transport created, direction:",
            direction,
            "iceCandidates:",
            res.iceCandidates?.length || 0,
          );
          resolve(res);
        }
      });
    });
  }

  /**
   * Dynamically adjust the video producer's max bitrate without rebuilding
   * the transport. Used by the health monitor to reduce quality when the
   * connection degrades and restore it when it recovers.
   */
  setMaxBitrate(bitrate: number): void {
    if (!this.#producer) return;
    try {
      this.#producer.setMaxBitrate(bitrate);
      devlog("[sfu] Producer bitrate set to", bitrate);
    } catch (err) {
      console.error("[sfu] Failed to set bitrate:", err);
    }
  }

  stopProducing() {
    if (this.#producer) {
      this.#producer.close();
      this.#socket?.emit("close-producer", { producerId: this.#producer.id });
      this.#producer = null;
    }
    if (this.#audioProducer) {
      this.#audioProducer.close();
      this.#socket?.emit("close-producer", {
        producerId: this.#audioProducer.id,
      });
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
      if (pc && typeof pc.getStats === "function") {
        return await pc.getStats();
      }
    } catch (err) {
      console.error("[sfu-client] getStats error:", err);
    }
    return null;
  }

  get isDeviceLoaded() {
    return this.#device?.loaded ?? false;
  }

  disconnect() {
    if (this.#turnRefreshTimer) {
      clearInterval(this.#turnRefreshTimer);
      this.#turnRefreshTimer = null;
    }
    this.#joinParams = null;
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
