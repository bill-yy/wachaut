import { i as onDestroy } from "../../../../chunks/internal.js";
import { D as attr, d as slot, f as spread_props, i as derived, m as unsubscribe_stores, p as store_get, s as head, u as sanitize_props, y as getContext } from "../../../../chunks/server.js";
import "../../../../chunks/client.js";
import { n as Icon, t as Monitor } from "../../../../chunks/monitor.js";
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
		let pinInput = "";
		derived(() => store_get($$store_subs ??= {}, "$page", page).params.roomId);
		onDestroy(() => {});
		head("gjovul", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Wachaut — Entrando a sala</title>`);
			});
		});
		$$renderer.push(`<main class="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4"><div class="mb-8 flex items-center gap-2.5"><div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 shadow-lg shadow-slate-800/20">`);
		Monitor($$renderer, { class: "h-4.5 w-4.5 text-white" });
		$$renderer.push(`<!----></div> <span class="text-lg font-bold text-slate-800">Wachaut</span></div> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="w-full max-w-sm animate-slide-up"><div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><div class="mb-6 flex justify-center"><div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">`);
		Lock($$renderer, { class: "h-6 w-6 text-slate-600" });
		$$renderer.push(`<!----></div></div> <h1 class="mb-2 text-center text-xl font-bold text-slate-800">Entrar a la sala</h1> <p class="mb-6 text-center text-sm text-slate-500">Introduce el PIN que te ha dado el anfitrión</p> <form class="space-y-4"><input type="text" inputmode="numeric" maxlength="6" placeholder="PIN de 6 dígitos"${attr("value", pinInput)} class="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-center font-mono text-2xl font-bold tracking-[0.4em] text-slate-800 placeholder:text-slate-300 placeholder:tracking-[0.2em] placeholder:font-normal focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-500/10" autofocus=""/> <button type="submit"${attr("disabled", true, true)} class="btn-primary w-full py-3.5">Entrar a la sala</button></form></div> <p class="mt-4 text-center text-xs text-slate-400">Máximo 5 espectadores · Conexión directa P2P</p></div>`);
		$$renderer.push(`<!--]--></main>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
