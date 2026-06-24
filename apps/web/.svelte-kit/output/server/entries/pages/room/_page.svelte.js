import "../../../chunks/internal.js";
import { d as sanitize_props, f as slot, h as stringify, j as escape_html, k as attr, n as attr_style, p as spread_props, s as ensure_array_like, t as attr_class } from "../../../chunks/server.js";
import { n as Icon, t as Monitor } from "../../../chunks/monitor.js";
import { t as Link_2 } from "../../../chunks/navigation.js";
import { n as Send, r as Message_circle, t as Triangle_alert } from "../../../chunks/triangle-alert.js";
import { io } from "socket.io-client";
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/arrow-left.svelte
function Arrow_left($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "arrow-left" },
		sanitize_props($$props),
		{
			/**
			* @component @name ArrowLeft
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTIgMTktNy03IDctNyIgLz4KICA8cGF0aCBkPSJNMTkgMTJINSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/arrow-left
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["path", { "d": "m12 19-7-7 7-7" }], ["path", { "d": "M19 12H5" }]],
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/copy.svelte
function Copy($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "copy" },
		sanitize_props($$props),
		{
			/**
			* @component @name Copy
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHg9IjgiIHk9IjgiIHJ4PSIyIiByeT0iMiIgLz4KICA8cGF0aCBkPSJNNCAxNmMtMS4xIDAtMi0uOS0yLTJWNGMwLTEuMS45LTIgMi0yaDEwYzEuMSAwIDIgLjkgMiAyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/copy
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["rect", {
				"width": "14",
				"height": "14",
				"x": "8",
				"y": "8",
				"rx": "2",
				"ry": "2"
			}], ["path", { "d": "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]],
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/eye.svelte
function Eye($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "eye" },
		sanitize_props($$props),
		{
			/**
			* @component @name Eye
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMi4wNjIgMTIuMzQ4YTEgMSAwIDAgMSAwLS42OTYgMTAuNzUgMTAuNzUgMCAwIDEgMTkuODc2IDAgMSAxIDAgMCAxIDAgLjY5NiAxMC43NSAxMC43NSAwIDAgMS0xOS44NzYgMCIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/eye
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["path", { "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }], ["circle", {
				"cx": "12",
				"cy": "12",
				"r": "3"
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/share-2.svelte
function Share_2($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "share-2" },
		sanitize_props($$props),
		{
			/**
			* @component @name Share2
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxOCIgY3k9IjUiIHI9IjMiIC8+CiAgPGNpcmNsZSBjeD0iNiIgY3k9IjEyIiByPSIzIiAvPgogIDxjaXJjbGUgY3g9IjE4IiBjeT0iMTkiIHI9IjMiIC8+CiAgPGxpbmUgeDE9IjguNTkiIHgyPSIxNS40MiIgeTE9IjEzLjUxIiB5Mj0iMTcuNDkiIC8+CiAgPGxpbmUgeDE9IjE1LjQxIiB4Mj0iOC41OSIgeTE9IjYuNTEiIHkyPSIxMC40OSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/share-2
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [
				["circle", {
					"cx": "18",
					"cy": "5",
					"r": "3"
				}],
				["circle", {
					"cx": "6",
					"cy": "12",
					"r": "3"
				}],
				["circle", {
					"cx": "18",
					"cy": "19",
					"r": "3"
				}],
				["line", {
					"x1": "8.59",
					"x2": "15.42",
					"y1": "13.51",
					"y2": "17.49"
				}],
				["line", {
					"x1": "15.41",
					"x2": "8.59",
					"y1": "6.51",
					"y2": "10.49"
				}]
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/users.svelte
function Users($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "users" },
		sanitize_props($$props),
		{
			/**
			* @component @name Users
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTYgMjF2LTJhNCA0IDAgMCAwLTQtNEg2YTQgNCAwIDAgMC00IDR2MiIgLz4KICA8Y2lyY2xlIGN4PSI5IiBjeT0iNyIgcj0iNCIgLz4KICA8cGF0aCBkPSJNMjIgMjF2LTJhNCA0IDAgMCAwLTMtMy44NyIgLz4KICA8cGF0aCBkPSJNMTYgMy4xM2E0IDQgMCAwIDEgMCA3Ljc1IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/users
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [
				["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
				["circle", {
					"cx": "9",
					"cy": "7",
					"r": "4"
				}],
				["path", { "d": "M22 21v-2a4 4 0 0 0-3-3.87" }],
				["path", { "d": "M16 3.13a4 4 0 0 1 0 7.75" }]
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
//#region src/routes/room/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let socket = null;
		let viewerCount = 0;
		let error = "";
		let loading = true;
		let peers = /* @__PURE__ */ new Map();
		let chatMessages = [];
		let chatInput = "";
		let activeReactions = /* @__PURE__ */ new Map();
		let reactionIdCounter = 0;
		const roomId = crypto.randomUUID();
		const pin = String(Math.floor(1e5 + Math.random() * 9e5));
		const roomUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}`;
		function addReaction(emoji) {
			const id = ++reactionIdCounter;
			const newReaction = {
				id,
				emoji,
				x: Math.random() * 80 + 10,
				createdAt: Date.now()
			};
			activeReactions = new Map(activeReactions).set(id, newReaction);
			setTimeout(() => {
				activeReactions = new Map(activeReactions);
				activeReactions.delete(id);
			}, 3e3);
		}
		function initSocket() {
			socket = io("wss://api-wachaut.billytech.es", { transports: ["websocket"] });
			socket.on("connect", () => {
				socket.emit("host:create-room", {
					roomId,
					pin
				});
				setTimeout(() => {
					loading = false;
				}, 800);
			});
			socket.on("disconnect", () => {});
			socket.on("error", (err) => {
				error = typeof err === "string" ? err : err.message || "Error de conexión";
				setTimeout(() => {
					error = "";
				}, 5e3);
			});
			socket.on("viewer:joined", (data) => {
				viewerCount = viewerCount + 1;
				if (data.viewerId) createPeerConnection(data.viewerId);
			});
			socket.on("viewer:left", (data) => {
				viewerCount = Math.max(0, viewerCount - 1);
				if (data.viewerId) {
					const pc = peers.get(data.viewerId);
					if (pc) {
						pc.close();
						peers.delete(data.viewerId);
					}
				}
			});
			socket.on("viewer:signal", async (data) => {
				const pc = peers.get(data.viewerId);
				if (!pc) return;
				if (data.signal.type === "answer") await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
				else if (data.signal.candidate) await pc.addIceCandidate(new RTCIceCandidate(data.signal));
			});
			socket.on("chat:history", (data) => {
				if (data?.messages) chatMessages = data.messages.map((m) => ({
					...m,
					timestamp: new Date(m.timestamp || Date.now())
				}));
			});
			socket.on("chat:message", (msg) => {
				chatMessages = [...chatMessages, {
					...msg,
					timestamp: new Date(msg.timestamp || Date.now())
				}];
			});
			socket.on("reaction:receive", (data) => {
				addReaction(data.emoji);
			});
		}
		const iceServers = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
		async function createPeerConnection(viewerId) {
			if (peers.has(viewerId)) return;
			const pc = new RTCPeerConnection({ iceServers });
			pc.onicecandidate = (event) => {
				if (event.candidate) socket.emit("host:signal", {
					viewerId,
					signal: event.candidate
				});
			};
			pc.onconnectionstatechange = () => {
				if (pc.connectionState === "failed") {
					pc.close();
					peers.delete(viewerId);
				}
			};
			peers.set(viewerId, pc);
		}
		initSocket();
		if (loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm transition-opacity duration-500 svelte-ek3c68"><div class="text-center svelte-ek3c68"><div class="relative mb-6 svelte-ek3c68"><div class="w-16 h-16 border-4 border-slate-600 border-t-red-500 rounded-full animate-spin mx-auto svelte-ek3c68"></div> `);
			Eye($$renderer, { class: "w-7 h-7 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" });
			$$renderer.push(`<!----></div> <h2 class="text-xl font-semibold text-white mb-2 svelte-ek3c68">Preparando sala...</h2> <p class="text-slate-400 text-sm svelte-ek3c68">Creando sala segura para tu transmisión</p></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (error) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg animate-[fadeIn_0.3s_ease] svelte-ek3c68">`);
			Triangle_alert($$renderer, { class: "w-4 h-4" });
			$$renderer.push(`<!----> <span class="text-sm font-medium svelte-ek3c68">${escape_html(error)}</span></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="min-h-screen bg-slate-50 flex flex-col svelte-ek3c68"><header class="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 svelte-ek3c68"><div class="flex items-center gap-3 svelte-ek3c68"><button class="p-2 hover:bg-slate-100 rounded-xl active:scale-95 transition-all svelte-ek3c68" title="Volver">`);
		Arrow_left($$renderer, { class: "w-5 h-5 text-slate-600" });
		$$renderer.push(`<!----></button> <div class="flex items-center gap-2 svelte-ek3c68">`);
		Monitor($$renderer, { class: "w-6 h-6 text-slate-800" });
		$$renderer.push(`<!----> <span class="font-bold text-slate-800 text-lg tracking-tight svelte-ek3c68">Wachaut</span></div></div> <div class="flex items-center gap-3 svelte-ek3c68">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full svelte-ek3c68">`);
		Users($$renderer, { class: "w-4 h-4 text-slate-500" });
		$$renderer.push(`<!----> <span class="text-slate-700 text-sm font-medium svelte-ek3c68">${escape_html(viewerCount)}</span></div> <button class="relative p-2 hover:bg-slate-100 rounded-xl active:scale-95 transition-all svelte-ek3c68" title="Chat">`);
		Message_circle($$renderer, { class: "w-5 h-5 text-slate-600" });
		$$renderer.push(`<!----> `);
		if (chatMessages.length > 0 && true) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center svelte-ek3c68"><span class="text-[10px] text-white font-bold svelte-ek3c68">${escape_html(chatMessages.length > 9 ? "9+" : chatMessages.length)}</span></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></button></div></header> <div class="flex-1 flex overflow-hidden svelte-ek3c68"><div class="flex-1 relative svelte-ek3c68" id="video-container">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<div class="w-full h-full flex flex-col items-center justify-center bg-slate-100 svelte-ek3c68"><div class="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 svelte-ek3c68">`);
		Monitor($$renderer, { class: "w-10 h-10 text-slate-400" });
		$$renderer.push(`<!----></div> <h3 class="text-slate-600 font-semibold mb-1 svelte-ek3c68">Sin transmisión</h3> <p class="text-slate-400 text-sm svelte-ek3c68">Comparte tu pantalla para comenzar</p></div>`);
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <!--[-->`);
		const each_array = ensure_array_like([...activeReactions.values()]);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let reaction = each_array[$$index];
			$$renderer.push(`<div class="absolute text-4xl pointer-events-none select-none svelte-ek3c68"${attr_style(`left: ${stringify(reaction.x)}%; bottom: 80px; animation: floatUp 3s ease-out forwards;`)}>${escape_html(reaction.emoji)}</div>`);
		}
		$$renderer.push(`<!--]--></div> <aside class="w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden svelte-ek3c68"><div class="p-4 border-b border-slate-100 space-y-3 svelte-ek3c68"><h3 class="font-semibold text-slate-800 text-sm uppercase tracking-wider svelte-ek3c68">Información de sala</h3> <div class="bg-slate-50 rounded-xl p-3 svelte-ek3c68"><div class="flex items-center justify-between mb-1 svelte-ek3c68"><span class="text-xs text-slate-500 font-medium svelte-ek3c68">PIN de acceso</span> <button class="p-1 hover:bg-slate-200 rounded-lg active:scale-95 transition-all svelte-ek3c68" title="Copiar PIN">`);
		$$renderer.push("<!--[-1-->");
		Copy($$renderer, { class: "w-3.5 h-3.5 text-slate-400" });
		$$renderer.push(`<!--]--></button></div> <p class="text-2xl font-mono font-bold text-slate-800 tracking-[0.2em] svelte-ek3c68">${escape_html(pin)}</p></div> <div class="bg-slate-50 rounded-xl p-3 svelte-ek3c68"><div class="flex items-center justify-between mb-1 svelte-ek3c68"><span class="text-xs text-slate-500 font-medium svelte-ek3c68">Enlace de sala</span> <button class="p-1 hover:bg-slate-200 rounded-lg active:scale-95 transition-all svelte-ek3c68" title="Copiar enlace">`);
		$$renderer.push("<!--[-1-->");
		Link_2($$renderer, { class: "w-3.5 h-3.5 text-slate-400" });
		$$renderer.push(`<!--]--></button></div> <p class="text-xs text-slate-600 truncate font-mono svelte-ek3c68">${escape_html(roomUrl)}</p></div></div> <div class="p-4 border-b border-slate-100 space-y-2 svelte-ek3c68">`);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<button class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl font-medium text-sm hover:bg-slate-700 active:scale-95 transition-all svelte-ek3c68">`);
		Share_2($$renderer, { class: "w-4 h-4" });
		$$renderer.push(`<!----> Compartir pantalla</button>`);
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-200 active:scale-95 transition-all svelte-ek3c68">`);
		Arrow_left($$renderer, { class: "w-4 h-4" });
		$$renderer.push(`<!----> Cerrar sala</button></div> <div class="flex-1 flex flex-col overflow-hidden min-h-0 svelte-ek3c68"><div class="px-4 py-3 flex items-center justify-between border-b border-slate-100 svelte-ek3c68"><div class="flex items-center gap-2 svelte-ek3c68">`);
		Message_circle($$renderer, { class: "w-4 h-4 text-slate-500" });
		$$renderer.push(`<!----> <span class="text-sm font-semibold text-slate-700 svelte-ek3c68">Chat</span> <span class="text-xs text-slate-400 svelte-ek3c68">(${escape_html(chatMessages.length)})</span></div></div> <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 svelte-ek3c68">`);
		if (chatMessages.length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex flex-col items-center justify-center h-full text-center py-8 svelte-ek3c68">`);
			Message_circle($$renderer, { class: "w-8 h-8 text-slate-300 mb-2" });
			$$renderer.push(`<!----> <p class="text-slate-400 text-sm svelte-ek3c68">Aún no hay mensajes</p> <p class="text-slate-300 text-xs mt-1 svelte-ek3c68">Los mensajes de los espectadores aparecerán aquí</p></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--[-->`);
			const each_array_2 = ensure_array_like(chatMessages);
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let msg = each_array_2[$$index_2];
				$$renderer.push(`<div${attr_class(`flex flex-col ${msg.sender === "Anfitrión" ? "items-end" : "items-start"}`, "svelte-ek3c68")}><div class="flex items-center gap-1.5 mb-0.5 svelte-ek3c68"><span${attr_class(`text-[10px] font-semibold ${msg.sender === "Anfitrión" ? "text-slate-600" : "text-blue-500"}`, "svelte-ek3c68")}>${escape_html(msg.sender)}</span> <span class="text-[10px] text-slate-300 svelte-ek3c68">${escape_html(msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString("es-ES", {
					hour: "2-digit",
					minute: "2-digit"
				}) : "")}</span></div> <div${attr_class(`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${msg.sender === "Anfitrión" ? "bg-slate-800 text-white rounded-br-md" : "bg-slate-100 text-slate-700 rounded-bl-md"}`, "svelte-ek3c68")}>${escape_html(msg.text)}</div></div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div> <div class="p-3 border-t border-slate-100 svelte-ek3c68"><div class="flex items-center gap-2 svelte-ek3c68"><input type="text"${attr("value", chatInput)} placeholder="Escribe un mensaje..." maxlength="500" class="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all svelte-ek3c68"/> <button${attr("disabled", !chatInput.trim(), true)} class="p-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed svelte-ek3c68" title="Enviar mensaje">`);
		Send($$renderer, { class: "w-4 h-4" });
		$$renderer.push(`<!----></button></div> <div class="flex items-center justify-between mt-1.5 svelte-ek3c68"><span class="text-[10px] text-slate-400 svelte-ek3c68">${escape_html(0)}/500</span> <span class="text-[10px] text-slate-400 svelte-ek3c68">Enter para enviar</span></div></div></div></aside></div></div>`);
	});
}
//#endregion
export { _page as default };
