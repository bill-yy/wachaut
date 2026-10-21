/**
 * Wachaut SFU Client — wraps mediasoup-client for use in Svelte 5.
 *
 * mediasoup-client is loaded lazily (dynamic import) so the ~280KB bundle only
 * ships to the host/viewer routes, never to the landing page. The Device is
 * constructed on first use (joinRoom), not in the constructor.
 */

import { io, type Socket } from "socket.io-client";
import { devlog, devwarn } from "./utils/devlog";
import { captureClientError } from "./error-report";

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
  /** SFU host-claim secret (received on room creation, re-sent on reconnect). */
  #hostSecret = "";
  #listeners: Map<string, Function[]> = new Map();
  #rtpCapabilities: any = null;
  #pendingConsumers: Array<any> = [];
  #stream: MediaStream | null = null;
  #iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
  /** Video mode negotiated with the SFU at join time (SFU_VIDEO_MODE env). */
  #videoMode: "vp8-single" | "vp8-simulcast" | "vp9-svc" = "vp8-single";
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

  /** Video mode negotiated with the SFU ("vp8-single" until the SFU says otherwise). */
  get videoMode(): "vp8-single" | "vp8-simulcast" | "vp9-svc" {
    return this.#videoMode;
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

  /** Report an SFU-level failure to the error tracker with room context. */
  #report(err: unknown, component: string, severity: "error" | "warning" = "error") {
    captureClientError(err, {
      component: `sfu.${component}`,
      roomId: this.#joinParams?.roomId,
      severity,
    });
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
          // hostSecret (received from the SFU on first join) proves this
          // socket's owner created the room — required to reclaim the host
          // slot on reconnect. Viewers never have one.
          { roomId, pin, displayName, role, hostSecret: this.#hostSecret || undefined },
          async (response: any) => {
            if (response.error) {
              if (firstJoin) reject(new Error(response.error));
              else this.#emit("error", `Re-join failed: ${response.error}`);
              return;
            }

            if (response.hostSecret) this.#hostSecret = response.hostSecret;
            this.#rtpCapabilities = response.rtpCapabilities;
            // Video mode negotiated per deployment (SFU_VIDEO_MODE): the
            // produce() call below shapes its encodings accordingly.
            this.#videoMode = response.videoMode || "vp8-single";

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

      this.#socket.on("consumer-layers", (data) => {
        this.#emit("consumer-layers", data);
      });

      this.#socket.on("connect_error", (err) => {
        console.error("[sfu] socket error:", err);
        this.#report(err, "socket-connect");
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
                this.#report(new Error(String(res.error)), "send-transport-connect");
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
          this.#report(new Error(String(response.error)), "produce");
          errback(new Error(response.error));
          return;
        }
        callback({ id: response.id });
      },
    );

    this.#monitorIce(this.#sendTransport, "send");

    // ── Video producer ─────────────────────────────────────────────────
    // Encoding shape is negotiated with the SFU (SFU_VIDEO_MODE):
    //  - "vp8-single"    — proven default: one VP8 encode, bitrate from preset.
    //  - "vp8-simulcast" — three VP8 encodings (¼, ½, full): the VALIDATED
    //                      layered path (spike 2026-10-21: media flows E2E).
    //  - "vp9-svc"       — one VP9 encode with L3T3 SVC layers. MEASUREDED
    //                      DEAD on current Chromium (155/156 Win, headless,
    //                      headed and system Chrome): the encoder produces
    //                      0 bytes / 0 frames, silently, while VP9 without
    //                      scalabilityMode encodes fine. Kept behind the
    //                      server flag for re-testing on future Chrome, but
    //                      NOT enabled anywhere.
    // The pre-sprint "VP9 stalled ICE" note was this same encoder stall seen
    // through a black screen, not an ICE problem (a codec cannot stall ICE).
    const videoTrack = screenStream.getVideoTracks()[0];
    if (videoTrack) {
      let encodings: Array<Record<string, unknown>> | undefined;
      let codec: any;
      if (this.#videoMode === "vp9-svc") {
        // Router codec parameters propagate into the device caps at load()
        // and from there into the sender's VP9 fmtp — and x-google-* entries
        // there stop Chromium's VP9 encoder from ever starting (0 bytes /
        // 0 frames, zero errors; found during the SVC spike, 2026-10-21).
        // Sanitize the local caps before producing. (The router-side source
        // of these knobs is also removed for the next SFU image.)
        try {
          for (const c of this.#device?.rtpCapabilities?.codecs ?? []) {
            if (String(c.mimeType).toLowerCase() === "video/vp9" && c.parameters) {
              for (const k of Object.keys(c.parameters)) {
                if (k.startsWith("x-google-")) delete c.parameters[k];
              }
            }
          }
        } catch {
          /* caps sanitation is best-effort */
        }
        encodings = [{ scalabilityMode: "L3T3", maxBitrate }];
        codec = this.#findCodec("video/VP9");
      } else if (this.#videoMode === "vp8-simulcast") {
        encodings = [
          { maxBitrate: Math.round(maxBitrate / 4), scaleResolutionDownBy: 4 },
          { maxBitrate: Math.round(maxBitrate / 2), scaleResolutionDownBy: 2 },
          { maxBitrate, scaleResolutionDownBy: 1 },
        ];
        // Pin VP8: without an explicit codec the browser sends its default
        // (AV1 on current Chrome), which mediasoup rejects for simulcast.
        codec = this.#findCodec("video/VP8");
      }
      // Legacy Google bitrate knobs only on the proven VP8 path: they end
      // up baked into the sender's codec fmtp line, which is fine for VP8
      // but non-standard noise for the layered codecs. Layered modes carry
      // their bitrate per encoding instead.
      const googleCodecOptions =
        this.#videoMode === "vp8-single"
          ? {
              codecOptions: {
                videoGoogleStartBitrate: Math.max(startBitrate, 100),
                videoGoogleMaxBitrate: maxBitrate,
              },
            }
          : {};
      this.#producer = await this.#sendTransport.produce({
        track: videoTrack,
        appData: { mediaTag: "screen-video" },
        ...(encodings ? { encodings } : {}),
        ...(codec ? { codec } : {}),
        ...googleCodecOptions,
      });
      devlog(
        `[sfu] Video producer created (${this.#videoMode}${encodings ? ", layered" : ""}):`,
        this.#producer.id,
      );
    }

    const audioTrack = screenStream.getAudioTracks()[0];
    if (audioTrack) {
      this.#audioProducer = await this.#sendTransport.produce({
        track: audioTrack,
        appData: { mediaTag: "screen-audio" },
        // Tab audio is stereo content: enable stereo + DTX (matches the
        // router-level Opus parameters).
        codecOptions: {
          opusStereo: true,
          opusDtx: true,
        },
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
          this.#report(new Error(`ICE failed (${label} transport)`), "ice-failed", "warning");
          try {
            pc.restartIce();
          } catch (e) {
            console.error(`[sfu] ${label} restartIce error:`, e);
            this.#report(e, `ice-restart-${label}`);
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
        this.#report(err, "turn-refresh", "warning");
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
                this.#report(new Error(String(res.error)), "recv-transport-connect");
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
          this.#report(new Error(String(res.error)), `create-transport-${direction}`);
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

  /**
   * Resolve a router codec (e.g. "video/VP9") from the device's negotiated
   * capabilities for explicit codec selection in produce(). Undefined keeps
   * the browser default (VP8).
   */
  #findCodec(mimeType: string): any {
    try {
      const device = this.#device;
      if (!device?.loaded) return undefined;
      return (
        device.rtpCapabilities.codecs.find(
          (c: any) => String(c.mimeType).toLowerCase() === mimeType.toLowerCase(),
        ) ?? undefined
      );
    } catch {
      return undefined;
    }
  }

  /**
   * Viewer-side layer preference (only meaningful on layered producers —
   * SVC/simulcast). The SFU clamps to the available layers; layer changes
   * arrive back via the "consumer-layers" event.
   */
  setPreferredLayers(consumerId: string, spatialLayer: number, temporalLayer: number): void {
    this.#socket?.emit("viewer:set-preferred-layers", { consumerId, spatialLayer, temporalLayer });
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
