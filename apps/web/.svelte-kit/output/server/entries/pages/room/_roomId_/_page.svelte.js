import { i as onDestroy } from "../../../../chunks/internal.js";
import { a as derived, d as sanitize_props, f as slot, g as unsubscribe_stores, h as stringify, j as escape_html, k as attr, m as store_get, p as spread_props, s as ensure_array_like, t as attr_class, x as getContext } from "../../../../chunks/server.js";
import "../../../../chunks/client.js";
import { n as Icon, t as Monitor } from "../../../../chunks/monitor.js";
import { n as Send, r as Message_circle, t as Triangle_alert } from "../../../../chunks/triangle-alert.js";
import { t as Wifi } from "../../../../chunks/wifi.js";
import "socket.io-client";
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
		let socket = null;
		let peer = null;
		let chatOpen = false;
		let chatMessages = [];
		let chatInput = "";
		const reactionEmojis = [
			"👍",
			"👎",
			"❓",
			"🎉"
		];
		let animatingReaction = null;
		let connectionLabel = derived(() => () => {
			switch (status) {
				case "idle": return "Desconectado";
				case "connecting": return "Conectando...";
				case "auth": return "Autenticando...";
				case "waiting": return "Esperando transmisión";
				case "live": return "En vivo";
				case "error": return "Error";
				case "disconnected": return "Desconectado";
				default: return "";
			}
		});
		let isConnected = derived(() => status === "waiting" || status === "live");
		let statusColor = derived(() => () => {
			if (status === "live") return "bg-red-500";
			if (isConnected()) return "bg-green-500";
			return "bg-slate-500";
		});
		function disconnect() {
			if (peer) {
				peer.close();
				peer = null;
			}
			cleanupSocket();
			status = "idle";
			pin = "";
			chatMessages = [];
			chatOpen = false;
			errorMessage = "";
		}
		function cleanupSocket() {
			if (socket) {
				socket.removeAllListeners();
				socket.disconnect();
				socket = null;
			}
		}
		function formatTime(timestamp) {
			return new Date(timestamp).toLocaleTimeString("es-ES", {
				hour: "2-digit",
				minute: "2-digit"
			});
		}
		onDestroy(() => {
			disconnect();
		});
		$$renderer.push(`<div class="min-h-screen bg-slate-50"><header class="bg-white border-b border-slate-200 px-4 py-3 shadow-sm"><div class="max-w-5xl mx-auto flex items-center justify-between"><h1 class="text-xl font-bold text-slate-800 tracking-tight">📺 Wachaut</h1> <span class="text-xs text-slate-400">Sala: ${escape_html(roomId())}</span></div></header> <main class="max-w-5xl mx-auto px-4 py-6">`);
		if (status === "idle") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center justify-center" style="min-height: 60vh;"><div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-slate-200"><div class="flex flex-col items-center mb-6"><div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">`);
			Lock($$renderer, { class: "w-7 h-7 text-slate-600" });
			$$renderer.push(`<!----></div> <h2 class="text-lg font-semibold text-slate-800">Unirse a la sala</h2> <p class="text-sm text-slate-500 mt-1">Ingresa el PIN proporcionado por el anfitrión</p></div> <input type="text" inputmode="numeric" placeholder="••••••"${attr("value", pin)} maxlength="6" class="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 px-4 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all placeholder:text-slate-300"/> <button${attr("disabled", pin.length < 4, true)} class="w-full mt-4 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Conectar</button></div></div>`);
		} else if (status === "connecting" || status === "auth") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="flex items-center justify-center" style="min-height: 60vh;"><div class="text-center"><div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">`);
			Wifi($$renderer, { class: "w-8 h-8 text-slate-400" });
			$$renderer.push(`<!----></div> <p class="text-slate-600 font-medium">${escape_html(status === "connecting" ? "Conectando..." : "Autenticando...")}</p> <p class="text-sm text-slate-400 mt-1">Verificando PIN con el anfitrión</p></div></div>`);
		} else if (status === "waiting") {
			$$renderer.push("<!--[2-->");
			$$renderer.push(`<div class="flex items-center justify-center" style="min-height: 60vh;"><div class="text-center"><div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">`);
			Monitor($$renderer, { class: "w-10 h-10 text-slate-400" });
			$$renderer.push(`<!----></div> <h2 class="text-lg font-semibold text-slate-700 mb-2">Esperando al anfitrión</h2> <p class="text-sm text-slate-500 mb-6">El anfitrión comenzará a compartir pronto</p> <button class="px-6 py-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium">Salir de la sala</button></div></div>`);
		} else if (status === "live") {
			$$renderer.push("<!--[3-->");
			$$renderer.push(`<div class="relative"><div class="relative rounded-2xl overflow-hidden bg-black shadow-xl aspect-video" role="region" aria-label="Video en vivo"><video autoplay="" muted="" playsinline="" class="w-full h-full object-contain"></video> <div class="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold"><span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> EN VIVO</div> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="flex items-center justify-center gap-3 mt-4"><!--[-->`);
			const each_array = ensure_array_like(reactionEmojis);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let emoji = each_array[$$index];
				$$renderer.push(`<button${attr_class(`w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 ${animatingReaction === emoji ? "scale-125" : ""}`)} title="Enviar reacción">${escape_html(emoji)}</button>`);
			}
			$$renderer.push(`<!--]--></div> <div class="flex items-center justify-between mt-4 px-2"><div class="flex items-center gap-2 text-sm text-slate-500"><span${attr_class(`w-2 h-2 rounded-full ${stringify(statusColor())}`)}></span> <span>${escape_html(connectionLabel())}</span></div> <button class="px-4 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">Salir</button></div></div>`);
		} else if (status === "error") {
			$$renderer.push("<!--[4-->");
			$$renderer.push(`<div class="flex items-center justify-center" style="min-height: 60vh;"><div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-200"><div class="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">`);
			Triangle_alert($$renderer, { class: "w-7 h-7 text-red-500" });
			$$renderer.push(`<!----></div> <h2 class="text-lg font-semibold text-slate-800 mb-2">Error</h2> <p class="text-sm text-slate-500 mb-6">${escape_html(errorMessage)}</p> <button class="px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors">Intentar de nuevo</button></div></div>`);
		} else if (status === "disconnected") {
			$$renderer.push("<!--[5-->");
			$$renderer.push(`<div class="flex items-center justify-center" style="min-height: 60vh;"><div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-slate-200"><div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">`);
			Wifi_off($$renderer, { class: "w-7 h-7 text-slate-400" });
			$$renderer.push(`<!----></div> <h2 class="text-lg font-semibold text-slate-800 mb-2">Desconectado</h2> <p class="text-sm text-slate-500 mb-6">Se perdió la conexión con el servidor</p> <button class="px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors">Reconectar</button></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></main> `);
		if (status !== "idle" && status !== "connecting" && status !== "auth") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button${attr_class(`fixed bottom-6 right-6 w-12 h-12 bg-slate-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-700 transition-all z-40 ${chatOpen ? "ring-2 ring-slate-400" : ""}`)}${attr("title", chatOpen ? "Cerrar chat" : "Abrir chat")}>`);
			Message_circle($$renderer, { class: "w-5 h-5" });
			$$renderer.push(`<!----> `);
			if (!chatOpen && chatMessages.length > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">${escape_html(chatMessages.length > 9 ? "9+" : chatMessages.length)}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (chatOpen) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-slate-900/95 backdrop-blur-md border-l border-slate-700 flex flex-col"><div class="flex items-center justify-between px-4 py-3 border-b border-slate-700"><div class="flex items-center gap-2">`);
			Message_circle($$renderer, { class: "w-5 h-5 text-slate-300" });
			$$renderer.push(`<!----> <span class="text-white font-semibold text-sm">Chat</span></div> <button class="text-slate-400 hover:text-white transition-colors text-sm">✕</button></div> <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">`);
			if (chatMessages.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<p class="text-slate-500 text-sm text-center mt-10">No hay mensajes aún</p>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <!--[-->`);
			const each_array_1 = ensure_array_like(chatMessages);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let msg = each_array_1[$$index_1];
				$$renderer.push(`<div class="flex flex-col"><div class="flex items-baseline gap-2"><span class="text-slate-300 text-xs font-semibold">${escape_html(msg.sender)}</span> <span class="text-slate-600 text-[10px]">${escape_html(formatTime(msg.timestamp))}</span></div> <p class="text-slate-200 text-sm mt-0.5 break-words">${escape_html(msg.text)}</p></div>`);
			}
			$$renderer.push(`<!--]--></div> <div class="px-4 py-3 border-t border-slate-700"><div class="flex items-center gap-2"><input type="text" placeholder="Escribe un mensaje..."${attr("value", chatInput)} class="flex-1 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-slate-500 placeholder:text-slate-500 transition-colors"/> <button${attr("disabled", !chatInput.trim(), true)} class="w-10 h-10 bg-slate-700 text-white rounded-xl flex items-center justify-center hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">`);
			Send($$renderer, { class: "w-4 h-4" });
			$$renderer.push(`<!----></button></div></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
