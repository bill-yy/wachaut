import { a as tick, i as onDestroy } from "../../../../chunks/internal.js";
import { a as derived, d as sanitize_props, f as slot, g as unsubscribe_stores, h as stringify, j as escape_html, k as attr, m as store_get, n as attr_style, p as spread_props, s as ensure_array_like, t as attr_class, x as getContext } from "../../../../chunks/server.js";
import "../../../../chunks/client.js";
import { n as Icon, t as Monitor } from "../../../../chunks/monitor.js";
import { c as Volume_x, d as Send, f as Message_circle, h as Bell_off, l as Smile_plus, m as Bell, n as playChatMessage, o as SfuClient, p as Maximize, r as playHostMuted, s as Triangle_alert, t as isMuted, u as Share_2 } from "../../../../chunks/notificationSounds.js";
import { t as Wifi } from "../../../../chunks/wifi.js";
import { io } from "socket.io-client";
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/activity.svelte
function Activity($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "activity" },
		sanitize_props($$props),
		{
			/**
			* @component @name Activity
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjIgMTJoLTIuNDhhMiAyIDAgMCAwLTEuOTMgMS40NmwtMi4zNSA4LjM2YS4yNS4yNSAwIDAgMS0uNDggMEw5LjI0IDIuMThhLjI1LjI1IDAgMCAwLS40OCAwbC0yLjM1IDguMzZBMiAyIDAgMCAxIDQuNDkgMTJIMiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/activity
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["path", { "d": "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" }]],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/lock.svelte
function Lock($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "lock" },
		sanitize_props($$props),
		{
			/**
			* @component @name Lock
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTEiIHg9IjMiIHk9IjExIiByeD0iMiIgcnk9IjIiIC8+CiAgPHBhdGggZD0iTTcgMTFWN2E1IDUgMCAwIDEgMTAgMHY0IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/lock
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["rect", {
				"width": "18",
				"height": "11",
				"x": "3",
				"y": "11",
				"rx": "2",
				"ry": "2"
			}], ["path", { "d": "M7 11V7a5 5 0 0 1 10 0v4" }]],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/user.svelte
function User($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "user" },
		sanitize_props($$props),
		{
			/**
			* @component @name User
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTkgMjF2LTJhNCA0IDAgMCAwLTQtNEg5YTQgNCAwIDAgMC00IDR2MiIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/user
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["path", { "d": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }], ["circle", {
				"cx": "12",
				"cy": "7",
				"r": "4"
			}]],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/wifi-off.svelte
function Wifi_off($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "wifi-off" },
		sanitize_props($$props),
		{
			/**
			* @component @name WifiOff
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMjBoLjAxIiAvPgogIDxwYXRoIGQ9Ik04LjUgMTYuNDI5YTUgNSAwIDAgMSA3IDAiIC8+CiAgPHBhdGggZD0iTTUgMTIuODU5YTEwIDEwIDAgMCAxIDUuMTctMi42OSIgLz4KICA8cGF0aCBkPSJNMTkgMTIuODU5YTEwIDEwIDAgMCAwLTIuMDA3LTEuNTIzIiAvPgogIDxwYXRoIGQ9Ik0yIDguODJhMTUgMTUgMCAwIDEgNC4xNzctMi42NDMiIC8+CiAgPHBhdGggZD0iTTIyIDguODJhMTUgMTUgMCAwIDAtMTEuMjg4LTMuNzY0IiAvPgogIDxwYXRoIGQ9Im0yIDIgMjAgMjAiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/wifi-off
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [
				["path", { "d": "M12 20h.01" }],
				["path", { "d": "M8.5 16.429a5 5 0 0 1 7 0" }],
				["path", { "d": "M5 12.859a10 10 0 0 1 5.17-2.69" }],
				["path", { "d": "M19 12.859a10 10 0 0 0-2.007-1.523" }],
				["path", { "d": "M2 8.82a15 15 0 0 1 4.177-2.643" }],
				["path", { "d": "M22 8.82a15 15 0 0 0-11.288-3.764" }],
				["path", { "d": "m2 2 20 20" }]
			],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/@sveltejs+kit@2.67.0_@sveltejs+vite-plugin-svelte@7.1.2_svelte@5.56.4_@typescript-eslint+type_ri437dqxveiwbqnnkuhdcv2jt4/node_modules/@sveltejs/kit/src/runtime/app/stores.js
/**
* A function that returns all of the contextual stores. On the server, this must be called during component initialization.
* Only use this if you need to defer store subscription until after the component has mounted, for some reason.
*
* @deprecated Use `$app/state` instead (requires Svelte 5, [see docs for more info](https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated))
*/
var getStores = () => {
	const stores$1 = getContext("__svelte__");
	return {
		/** @type {typeof page} */
		page: { subscribe: stores$1.page.subscribe },
		/** @type {typeof navigating} */
		navigating: { subscribe: stores$1.navigating.subscribe },
		/** @type {typeof updated} */
		updated: stores$1.updated
	};
};
/**
* A readable store whose value contains page data.
*
* On the server, this store can only be subscribed to during component initialization. In the browser, it can be subscribed to at any time.
*
* @deprecated Use `page` from `$app/state` instead (requires Svelte 5, [see docs for more info](https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated))
* @type {import('svelte/store').Readable<import('@sveltejs/kit').Page>}
*/
var page = { subscribe(fn) {
	return getStores().page.subscribe(fn);
} };
//#endregion
//#region src/routes/room/[roomId]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		const roomId = derived(() => store_get($$store_subs ??= {}, "$page", page).params.roomId);
		let status = "idle";
		let errorMessage = "";
		let pin = "";
		let username = "";
		let assignedUsername = "";
		let reconnectAttempt = 0;
		let reconnectTimer = null;
		const USERNAME_STORAGE_KEY = "wachaut.viewer.username";
		let socket = null;
		let sfuClient = null;
		let volume = 100;
		let hostMuted = false;
		let chatMessages = [];
		let chatInput = "";
		let chatOpen = false;
		let shortcutsTimeout = null;
		let connectionStats = {
			resolution: "",
			fps: "",
			bitrate: ""
		};
		let statsInterval = null;
		let lastBytesReceived = 0;
		let lastStatsTime = 0;
		const ALL_EMOTES = [
			"👍",
			"👎",
			"❤️",
			"🔥",
			"👏",
			"😂",
			"🎉",
			"😮",
			"😢",
			"😡",
			"👋",
			"✌️",
			"💪",
			"🙏",
			"⭐",
			"💯",
			"🎯",
			"💡",
			"🎵",
			"☕",
			"🍕",
			"🎂"
		];
		let favoriteEmojis = loadFavorites();
		let animatingReaction = null;
		let floatingReactions = [];
		let reactionCounter = 0;
		let notificationsMuted = isMuted();
		const FAVORITES_KEY = "wachaut.viewer.favorites";
		function loadFavorites() {
			try {
				const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY));
				if (Array.isArray(stored) && stored.length >= 5) return stored.slice(0, 5);
			} catch {}
			return [
				"👍",
				"❤️",
				"🔥",
				"👏",
				"😂"
			];
		}
		let isConnected = derived(() => status === "waiting" || status === "live");
		derived(() => {
			if (status === "live") return "bg-red-500";
			if (isConnected()) return "bg-green-500";
			return "bg-slate-500";
		});
		let connectionQuality = derived(() => {
			const res = connectionStats.resolution || "";
			if (res.includes("1920")) return "buena";
			if (res.includes("1280")) return "regular";
			return "desconocida";
		});
		async function connect() {
			cleanupSocket();
			sfuClient?.disconnect();
			sfuClient = null;
			const cleanedUsername = sanitizeUsername(username);
			username = cleanedUsername;
			if (cleanedUsername.length < 2) {
				errorMessage = "Ingresa un username de al menos 2 caracteres";
				status = "error";
				return;
			}
			if (!pin || pin.length < 4) {
				errorMessage = "Ingresa un PIN válido";
				status = "error";
				return;
			}
			status = "connecting";
			socket = io("wss://api-wachaut.billytech.es", { transports: ["websocket"] });
			socket.on("connect", () => {
				socket.emit("viewer:join", {
					roomId: roomId(),
					pin,
					username: cleanedUsername
				});
				status = "auth";
			});
			socket.on("room:auth-success", () => {
				status = "waiting";
			});
			socket.on("room:auth-failed", (data) => {
				errorMessage = data?.message || "PIN incorrecto";
				status = "error";
				cleanupSocket();
			});
			socket.on("room:error", (data) => {
				errorMessage = data?.message || "Error en la sala";
				status = "error";
				cleanupSocket();
			});
			socket.on("room:joined", (data) => {
				assignedUsername = data?.username || cleanedUsername;
				username = assignedUsername;
				saveUsername(assignedUsername);
				status = "waiting";
				connectSfu(assignedUsername);
			});
			socket.on("chat:history", (data) => {
				if (data?.messages) chatMessages = data.messages.map((msg) => ({
					id: msg.id || Date.now() + Math.random(),
					sender: msg.sender || "Anónimo",
					text: msg.text,
					timestamp: msg.timestamp || (/* @__PURE__ */ new Date()).toISOString()
				}));
			});
			socket.on("chat:message", (msg) => {
				chatMessages = [...chatMessages, {
					id: msg.id || Date.now(),
					sender: msg.sender || "Anónimo",
					text: msg.text,
					timestamp: msg.timestamp || (/* @__PURE__ */ new Date()).toISOString()
				}];
				try {
					playChatMessage();
				} catch {}
			});
			socket.on("reaction:receive", (data) => {
				addFloatingReaction(data.emoji);
			});
			socket.on("host:stopped-sharing", () => {
				sfuClient?.disconnect();
				sfuClient = null;
				stopStatsPolling();
				status = "waiting";
			});
			socket.on("host:muted", () => {
				hostMuted = true;
				try {
					playHostMuted();
				} catch {}
			});
			socket.on("host:unmuted", () => {
				hostMuted = false;
			});
			socket.on("viewer:kicked", (data) => {
				errorMessage = data?.reason || "Has sido expulsado de la sala";
				status = "error";
				cleanupSocket();
			});
			socket.on("host:disconnected", () => {
				errorMessage = "El anfitrión se desconectó";
				status = "error";
				sfuClient?.disconnect();
				sfuClient = null;
				stopStatsPolling();
			});
			socket.on("room:closed", () => {
				errorMessage = "La sala se cerró";
				status = "error";
				sfuClient?.disconnect();
				sfuClient = null;
				stopStatsPolling();
			});
			socket.on("disconnect", () => {
				if (status !== "error") {
					status = "disconnected";
					scheduleReconnect();
				}
			});
		}
		function disconnect() {
			stopStatsPolling();
			cleanupReconnect();
			sfuClient?.disconnect();
			sfuClient = null;
			cleanupSocket();
			status = "idle";
			pin = "";
			assignedUsername = "";
			errorMessage = "";
			connectionStats = {
				resolution: "",
				fps: "",
				bitrate: ""
			};
		}
		function cleanupSocket() {
			if (socket) {
				socket.removeAllListeners();
				socket.disconnect();
				socket = null;
			}
		}
		function scheduleReconnect() {
			if (reconnectAttempt >= 3) {
				status = "error";
				errorMessage = "No se pudo reconectar. Intenta de nuevo.";
				reconnectAttempt = 0;
				return;
			}
			const delay = Math.min(2e3 * Math.pow(2, reconnectAttempt), 8e3);
			reconnectAttempt++;
			console.log(`[viewer] Reconnect attempt ${reconnectAttempt} in ${delay}ms`);
			if (reconnectTimer) clearTimeout(reconnectTimer);
			reconnectTimer = setTimeout(() => {
				connect().catch(() => {});
			}, delay);
		}
		function cleanupReconnect() {
			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
				reconnectTimer = null;
			}
			reconnectAttempt = 0;
		}
		function sanitizeUsername(value) {
			return value.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
		}
		function saveUsername(value) {
			try {
				localStorage.setItem(USERNAME_STORAGE_KEY, value);
			} catch {}
		}
		function addFloatingReaction(emoji) {
			if (!ALL_EMOTES.includes(emoji)) return;
			const id = ++reactionCounter;
			const idx = reactionCounter % 4;
			const reaction = {
				id,
				emoji,
				x: Math.random() * 70 + 10,
				bottom: [
					40,
					120,
					200,
					80
				][idx],
				fontSize: [
					1.4,
					1.8,
					2.2,
					1.6
				][idx],
				xOffset: [
					"0px",
					"-20px",
					"15px",
					"-10px"
				][idx],
				rotation: [
					"-12deg",
					"8deg",
					"-5deg",
					"15deg"
				][idx],
				delay: Math.random() * .2,
				duration: 2.5 + Math.random() * 1,
				createdAt: Date.now()
			};
			floatingReactions = [...floatingReactions, reaction];
			setTimeout(() => {
				floatingReactions = floatingReactions.filter((r) => r.id !== id);
			}, (reaction.duration + reaction.delay) * 1e3 + 200);
		}
		async function connectSfu(displayName) {
			if (sfuClient) return;
			try {
				sfuClient = new SfuClient("wss://sfu-wachaut.billytech.es");
				sfuClient.on("stream-ready", async (stream) => {
					status = "live";
					reconnectAttempt = 0;
					await tick();
					console.error("[viewer] videoEl still null after tick!");
					startStatsPolling();
					showShortcutsOverlay();
					if (window.innerWidth < 768) chatOpen = true;
				});
				sfuClient.on("error", (msg) => {
					console.error("[viewer] SFU error:", msg);
					errorMessage = msg;
					setTimeout(() => {
						errorMessage = "";
					}, 5e3);
				});
				sfuClient.on("disconnected", (reason) => {
					console.log("[viewer] SFU disconnected:", reason);
					if (status === "live") status = "reconnecting";
				});
				await sfuClient.joinRoom(roomId(), pin, displayName, "viewer");
				console.log("[viewer] Joined SFU room, device loaded:", sfuClient.isDeviceLoaded);
				const stream = await sfuClient.consume();
				console.log("[viewer] consume() returned, tracks:", stream?.getTracks().length);
			} catch (err) {
				console.error("[viewer] Failed to connect to SFU:", err);
				errorMessage = "No se pudo conectar al SFU. La calidad puede ser reducida.";
				setTimeout(() => {
					errorMessage = "";
				}, 8e3);
			}
		}
		async function updateStats() {
			if (!sfuClient || status !== "live") return;
			try {
				const stats = await sfuClient.getStats();
				if (!stats) return;
				stats.forEach((report) => {
					if (report.type === "inbound-rtp" && report.kind === "video") {
						connectionStats.resolution = `${report.frameWidth || "?"}x${report.frameHeight || "?"}`;
						connectionStats.fps = `${report.framesPerSecond || "?"}`;
						const now = Date.now();
						const bytesReceived = report.bytesReceived || 0;
						if (lastStatsTime > 0) {
							const elapsed = (now - lastStatsTime) / 1e3;
							const bps = (bytesReceived - lastBytesReceived) * 8 / elapsed;
							if (bps >= 1e6) connectionStats.bitrate = `${(bps / 1e6).toFixed(1)} Mbps`;
							else if (bps >= 1e3) connectionStats.bitrate = `${(bps / 1e3).toFixed(0)} Kbps`;
							else connectionStats.bitrate = `${Math.round(bps)} bps`;
						}
						lastBytesReceived = bytesReceived;
						lastStatsTime = now;
					}
				});
			} catch (err) {
				console.error("Error getting stats:", err);
			}
		}
		function startStatsPolling() {
			stopStatsPolling();
			lastBytesReceived = 0;
			lastStatsTime = 0;
			connectionStats = {
				resolution: "",
				fps: "",
				bitrate: ""
			};
			statsInterval = setInterval(updateStats, 3e3);
		}
		function stopStatsPolling() {
			if (statsInterval) {
				clearInterval(statsInterval);
				statsInterval = null;
			}
		}
		function formatTime(timestamp) {
			return new Date(timestamp).toLocaleTimeString("es-ES", {
				hour: "2-digit",
				minute: "2-digit"
			});
		}
		function showShortcutsOverlay() {
			if (shortcutsTimeout) clearTimeout(shortcutsTimeout);
			shortcutsTimeout = setTimeout(() => {}, 3e3);
		}
		function handleVisibilityChange() {
			if (document.hidden) {
				stopStatsPolling();
				console.log("[viewer] Tab hidden, pausing stats polling");
			} else if (status === "live") {
				startStatsPolling();
				console.log("[viewer] Tab visible, resuming stats polling");
			}
		}
		onDestroy(() => {
			if (shortcutsTimeout) clearTimeout(shortcutsTimeout);
			stopStatsPolling();
			cleanupReconnect();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			disconnect();
		});
		$$renderer.push(`<div class="min-h-screen bg-slate-950 text-slate-100 svelte-gjovul">`);
		if (status !== "live") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<header class="bg-slate-900 border-b border-slate-800 px-4 py-3 shadow-sm svelte-gjovul"><div class="flex items-center gap-2 svelte-gjovul"><div class="flex h-7 w-7 items-center justify-center rounded-lg bg-white svelte-gjovul">`);
			Monitor($$renderer, { class: "h-3.5 w-3.5 text-slate-900" });
			$$renderer.push(`<!----></div> <span class="text-lg font-bold text-white svelte-gjovul">Wachaut</span> <div class="flex-1 svelte-gjovul"></div> <button class="p-2 rounded-lg hover:bg-slate-800 transition-colors svelte-gjovul"${attr("title", notificationsMuted ? "Activar notificaciones" : "Silenciar notificaciones")}>`);
			if (notificationsMuted) {
				$$renderer.push("<!--[0-->");
				Bell_off($$renderer, { class: "w-5 h-5 text-slate-500" });
			} else {
				$$renderer.push("<!--[-1-->");
				Bell($$renderer, { class: "w-5 h-5 text-slate-300" });
			}
			$$renderer.push(`<!--]--></button></div></header> <main class="max-w-5xl mx-auto px-4 py-6 svelte-gjovul">`);
			if (status === "idle") {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="flex items-center justify-center svelte-gjovul" style="min-height: 60vh;"><div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-slate-200 svelte-gjovul"><div class="flex flex-col items-center mb-6 svelte-gjovul"><div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4 svelte-gjovul">`);
				Lock($$renderer, { class: "w-7 h-7 text-slate-600" });
				$$renderer.push(`<!----></div> <h2 class="text-lg font-semibold text-slate-800 svelte-gjovul">Unirse a la sala</h2> <p class="text-sm text-slate-500 mt-1 svelte-gjovul">Ingresa tu nombre y el PIN de acceso</p></div> <label class="block text-xs font-semibold text-slate-500 mb-1.5 svelte-gjovul">Nombre</label> <div class="relative mb-4 svelte-gjovul">`);
				User($$renderer, { class: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" });
				$$renderer.push(`<!----> <input type="text" placeholder="tu-nombre"${attr("value", username)} maxlength="24" autocomplete="username" class="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all svelte-gjovul"/></div> <label class="block text-xs font-semibold text-slate-500 mb-1.5 svelte-gjovul">PIN</label> <input type="text" inputmode="numeric" placeholder="••••••"${attr("value", pin)} maxlength="6" class="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 px-4 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all placeholder:text-slate-300 svelte-gjovul"/> <button${attr("disabled", pin.length < 4 || username.trim().length < 2, true)} class="w-full mt-4 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors svelte-gjovul">Conectar</button></div></div>`);
			} else if (status === "connecting" || status === "auth") {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`<div class="flex items-center justify-center svelte-gjovul" style="min-height: 60vh;"><div class="text-center svelte-gjovul"><div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse svelte-gjovul">`);
				Wifi($$renderer, { class: "w-8 h-8 text-slate-400" });
				$$renderer.push(`<!----></div> <p class="text-slate-600 font-medium svelte-gjovul">${escape_html(status === "connecting" ? "Conectando..." : "Autenticando...")}</p> <p class="text-sm text-slate-400 mt-1 svelte-gjovul">Verificando PIN con el anfitrión</p></div></div>`);
			} else if (status === "waiting") {
				$$renderer.push("<!--[2-->");
				$$renderer.push(`<div class="flex items-center justify-center svelte-gjovul" style="min-height: 60vh;"><div class="text-center svelte-gjovul"><div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 svelte-gjovul">`);
				Monitor($$renderer, { class: "w-10 h-10 text-slate-400" });
				$$renderer.push(`<!----></div> <h2 class="text-lg font-semibold text-slate-700 mb-2 svelte-gjovul">Esperando al anfitrión</h2> <p class="text-sm text-slate-500 mb-6 svelte-gjovul">El anfitrión comenzará a compartir pronto</p> <button class="px-6 py-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium svelte-gjovul">Salir de la sala</button></div></div>`);
			} else if (status === "error") {
				$$renderer.push("<!--[3-->");
				$$renderer.push(`<div class="flex items-center justify-center svelte-gjovul" style="min-height: 60vh;"><div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-200 svelte-gjovul"><div class="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 svelte-gjovul">`);
				Triangle_alert($$renderer, { class: "w-7 h-7 text-red-500" });
				$$renderer.push(`<!----></div> <h2 class="text-lg font-semibold text-slate-800 mb-2 svelte-gjovul">Error</h2> <p class="text-sm text-slate-500 mb-6 svelte-gjovul">${escape_html(errorMessage)}</p> <button class="px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors svelte-gjovul">Intentar de nuevo</button></div></div>`);
			} else if (status === "disconnected") {
				$$renderer.push("<!--[4-->");
				$$renderer.push(`<div class="flex items-center justify-center svelte-gjovul" style="min-height: 60vh;"><div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-200 svelte-gjovul"><div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 svelte-gjovul">`);
				Wifi_off($$renderer, { class: "w-7 h-7 text-slate-400" });
				$$renderer.push(`<!----></div> <h2 class="text-lg font-semibold text-slate-800 mb-2 svelte-gjovul">Desconectado</h2> <p class="text-sm text-slate-500 mb-6 svelte-gjovul">Se perdió la conexión con el servidor</p> <button class="px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors svelte-gjovul">Reconectar</button></div></div>`);
			} else if (status === "reconnecting") {
				$$renderer.push("<!--[5-->");
				$$renderer.push(`<div class="flex items-center justify-center svelte-gjovul" style="min-height: 60vh;"><div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-200 svelte-gjovul"><div class="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse svelte-gjovul">`);
				Wifi($$renderer, { class: "w-7 h-7 text-amber-500" });
				$$renderer.push(`<!----></div> <h2 class="text-lg font-semibold text-slate-800 mb-2 svelte-gjovul">Reconectando...</h2> <p class="text-sm text-slate-500 mb-2 svelte-gjovul">Intento ${escape_html(reconnectAttempt)} de 3</p> <div class="w-full bg-slate-200 rounded-full h-1.5 mb-6 svelte-gjovul"><div class="bg-amber-500 h-1.5 rounded-full transition-all duration-500 svelte-gjovul"${attr_style("", { width: `${stringify(Math.min(reconnectAttempt / 3 * 100, 100))}%` })}></div></div> <button class="px-6 py-3 bg-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-300 transition-colors svelte-gjovul">Cancelar</button></div></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></main>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="flex flex-col md:flex-row h-[calc(100vh-49px)] overflow-hidden svelte-gjovul"><div class="w-full h-[50vh] md:h-auto md:w-auto md:flex-1 relative bg-black group shrink-0 md:shrink svelte-gjovul" role="region" aria-label="Video en vivo"><video autoplay="" muted="" playsinline="" class="w-full h-full object-contain cursor-pointer svelte-gjovul" title="Haz clic para activar audio"></video> <div class="absolute top-3 left-3 flex items-center gap-2 pointer-events-none svelte-gjovul"><div class="flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold svelte-gjovul"><span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse svelte-gjovul"></span> EN VIVO</div> `);
			if (hostMuted) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium animate-[floatUp_0.3s_ease] svelte-gjovul">`);
				Volume_x($$renderer, { class: "w-3 h-3" });
				$$renderer.push(`<!----> Silenciado</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (assignedUsername) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="hidden md:flex items-center gap-1 bg-slate-800/80 backdrop-blur-sm text-slate-300 px-2 py-1 rounded-full text-xs font-medium svelte-gjovul">`);
				User($$renderer, { class: "w-3 h-3" });
				$$renderer.push(`<!----> ${escape_html(assignedUsername)}</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none svelte-gjovul"><div class="flex items-center gap-3 pointer-events-auto svelte-gjovul"><button class="text-white hover:text-white/80 transition-colors p-1 svelte-gjovul"${attr("title", "Activar sonido")}>`);
			$$renderer.push("<!--[0-->");
			Volume_x($$renderer, { class: "w-5 h-5" });
			$$renderer.push(`<!--]--></button> <div class="hidden md:flex items-center gap-2 flex-1 max-w-[160px] svelte-gjovul"><input type="range" min="0" max="100"${attr("value", volume)} class="volume-slider flex-1 svelte-gjovul"${attr("title", `Volumen: ${stringify(volume)}%`)}/> <span class="text-white/60 text-[10px] font-mono w-8 text-right svelte-gjovul">${escape_html(volume)}%</span></div> <div class="flex-1 svelte-gjovul"></div> <button class="text-white/70 hover:text-white transition-colors p-1 svelte-gjovul" title="Compartir enlace">`);
			Share_2($$renderer, { class: "w-4 h-4" });
			$$renderer.push(`<!----></button> <button class="text-white/70 hover:text-white transition-colors p-1 svelte-gjovul"${attr("title", "Pantalla completa")}>`);
			$$renderer.push("<!--[-1-->");
			Maximize($$renderer, { class: "w-5 h-5" });
			$$renderer.push(`<!--]--></button> <button class="text-white/50 hover:text-white/80 transition-colors p-1 text-xs font-mono svelte-gjovul" title="Atajos de teclado">?</button></div></div> <!--[-->`);
			const each_array = ensure_array_like(floatingReactions);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let reaction = each_array[$$index];
				$$renderer.push(`<div class="absolute text-3xl pointer-events-none select-none z-10 svelte-gjovul"${attr_style("", {
					left: `${stringify(reaction.x)}%`,
					bottom: `${stringify(reaction.bottom)}px`,
					"font-size": `${stringify(reaction.fontSize)}rem`,
					transform: `translateX(${stringify(reaction.xOffset)}) rotate(${stringify(reaction.rotation)})`,
					animation: `floatUp ${stringify(reaction.duration)}s ease-out ${stringify(reaction.delay)}s both`
				})}>${escape_html(reaction.emoji)}</div>`);
			}
			$$renderer.push(`<!--]--></div> <aside${attr_class(`w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:w-80 max-md:transition-transform max-md:duration-300 ${chatOpen ? "max-md:translate-x-0" : "max-md:translate-x-full"}`, "svelte-gjovul")}><div class="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 svelte-gjovul"><div class="flex items-center gap-2 svelte-gjovul">`);
			Message_circle($$renderer, { class: "w-4 h-4 text-slate-400" });
			$$renderer.push(`<!----> <span class="text-sm font-semibold text-slate-200 svelte-gjovul">Chat</span> <span class="text-xs text-slate-500 svelte-gjovul">(${escape_html(chatMessages.length)})</span></div> <div class="flex items-center gap-2 svelte-gjovul">`);
			if (connectionStats.resolution) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="flex items-center gap-1 text-[10px] text-slate-500 svelte-gjovul">`);
				Activity($$renderer, { class: "w-3 h-3" });
				$$renderer.push(`<!----> <span${attr_class(`w-1.5 h-1.5 rounded-full ${connectionQuality() === "buena" ? "bg-green-500" : connectionQuality() === "regular" ? "bg-amber-500" : "bg-slate-500"}`, "svelte-gjovul")}></span> <span class="svelte-gjovul">${escape_html(connectionStats.resolution)}</span> `);
				if (connectionStats.bitrate) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="svelte-gjovul">· ${escape_html(connectionStats.bitrate)}</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <button class="p-1.5 rounded-lg hover:bg-slate-800 transition-colors svelte-gjovul"${attr("title", notificationsMuted ? "Activar notificaciones" : "Silenciar notificaciones")}>`);
			if (notificationsMuted) {
				$$renderer.push("<!--[0-->");
				Bell_off($$renderer, { class: "w-4 h-4 text-slate-600" });
			} else {
				$$renderer.push("<!--[-1-->");
				Bell($$renderer, { class: "w-4 h-4 text-slate-400" });
			}
			$$renderer.push(`<!--]--></button></div></div> <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0 svelte-gjovul">`);
			if (chatMessages.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="flex flex-col items-center justify-center h-full text-center svelte-gjovul">`);
				Message_circle($$renderer, { class: "w-8 h-8 text-slate-700 mb-2" });
				$$renderer.push(`<!----> <p class="text-slate-500 text-sm svelte-gjovul">No hay mensajes aún</p> <p class="text-slate-600 text-xs mt-1 svelte-gjovul">Los mensajes aparecerán aquí</p></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <!--[-->`);
			const each_array_1 = ensure_array_like(chatMessages);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let msg = each_array_1[$$index_1];
				$$renderer.push(`<div${attr_class(`flex flex-col ${msg.sender === "Sistema" ? "items-center" : ""}`, "svelte-gjovul")}>`);
				if (msg.sender !== "Sistema") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="flex items-baseline gap-2 svelte-gjovul"><span${attr_class(`text-xs font-semibold ${msg.sender === "Anfitrión" ? "text-amber-400" : "text-slate-300"}`, "svelte-gjovul")}>${escape_html(msg.sender)}</span> <span class="text-slate-600 text-[10px] svelte-gjovul">${escape_html(formatTime(msg.timestamp))}</span></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <p${attr_class(`${msg.sender === "Sistema" ? "text-slate-500 text-xs italic bg-slate-800/50 px-3 py-1 rounded-lg" : msg.sender === "Anfitrión" ? "text-slate-100 text-sm" : "text-slate-300 text-sm"} mt-0.5 break-words`, "svelte-gjovul")}>${escape_html(msg.text)}</p></div>`);
			}
			$$renderer.push(`<!--]--></div> <div class="px-4 py-2 border-t border-slate-800 shrink-0 relative svelte-gjovul"><div class="flex items-center justify-center gap-1.5 svelte-gjovul"><!--[-->`);
			const each_array_2 = ensure_array_like(favoriteEmojis);
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let emoji = each_array_2[$$index_2];
				$$renderer.push(`<button${attr_class(`w-9 h-9 flex items-center justify-center text-lg bg-slate-800/50 rounded-lg hover:bg-slate-700/70 active:scale-90 transition-all duration-150 ${animatingReaction === emoji ? "scale-125 bg-slate-700" : ""}`, "svelte-gjovul")} title="Enviar reacción">${escape_html(emoji)}</button>`);
			}
			$$renderer.push(`<!--]--> <button${attr_class(`w-9 h-9 flex items-center justify-center text-lg bg-slate-800/50 rounded-lg hover:bg-slate-700/70 active:scale-90 transition-all duration-150 text-slate-400`, "svelte-gjovul")} title="Más emojis">`);
			Smile_plus($$renderer, { class: "w-5 h-5" });
			$$renderer.push(`<!----></button></div> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="px-3 py-3 border-t border-slate-800 shrink-0 svelte-gjovul"><div class="flex items-center gap-2 svelte-gjovul"><input type="text" placeholder="Escribe un mensaje..."${attr("value", chatInput)} class="flex-1 bg-slate-800 text-white text-sm px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-slate-500 placeholder:text-slate-500 transition-colors svelte-gjovul"/> <button${attr("disabled", !chatInput.trim(), true)} class="w-9 h-9 bg-slate-700 text-white rounded-lg flex items-center justify-center shrink-0 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors svelte-gjovul">`);
			Send($$renderer, { class: "w-4 h-4" });
			$$renderer.push(`<!----></button></div> <p class="text-[10px] text-slate-600 mt-1.5 px-1 svelte-gjovul">/help para comandos</p></div></aside> <button class="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-800 text-white rounded-full shadow-xl flex items-center justify-center z-40 hover:bg-slate-700 active:scale-95 transition-all svelte-gjovul"${attr("title", chatOpen ? "Cerrar chat" : "Abrir chat")}>`);
			Message_circle($$renderer, { class: "w-6 h-6" });
			$$renderer.push(`<!----> `);
			if (!chatOpen && chatMessages.length > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold svelte-gjovul">${escape_html(chatMessages.length > 9 ? "9+" : chatMessages.length)}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></button> `);
			if (chatOpen) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="md:hidden fixed inset-0 bg-black/50 z-40 svelte-gjovul" role="presentation"></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
