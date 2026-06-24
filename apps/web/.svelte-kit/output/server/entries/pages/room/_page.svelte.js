import { s as sanitize_props, a as spread_props, b as slot, o as head, p as store_get, m as escape_html, q as attr, u as unsubscribe_stores } from "../../../chunks/root.js";
import { o as onDestroy, A as Arrow_left, V as Volume_x, a as Volume_2, M as Minimize, b as Maximize } from "../../../chunks/volume-x.js";
import "@sveltejs/kit/internal";
import { w as writable } from "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import "socket.io-client";
import { M as Monitor } from "../../../chunks/monitor.js";
import { I as Icon } from "../../../chunks/Icon.js";
function Check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [["path", { "d": "M20 6 9 17l-5-5" }]];
  Icon($$renderer, spread_props([
    { name: "check" },
    $$sanitized_props,
    {
      /**
       * @component @name Check
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgNiA5IDE3bC01LTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/check
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Circle_stop($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    [
      "rect",
      { "x": "9", "y": "9", "width": "6", "height": "6", "rx": "1" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "circle-stop" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleStop
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cmVjdCB4PSI5IiB5PSI5IiB3aWR0aD0iNiIgaGVpZ2h0PSI2IiByeD0iMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/circle-stop
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Copy($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "rect",
      {
        "width": "14",
        "height": "14",
        "x": "8",
        "y": "8",
        "rx": "2",
        "ry": "2"
      }
    ],
    [
      "path",
      {
        "d": "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "copy" },
    $$sanitized_props,
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
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Share_2($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "18", "cy": "5", "r": "3" }],
    ["circle", { "cx": "6", "cy": "12", "r": "3" }],
    ["circle", { "cx": "18", "cy": "19", "r": "3" }],
    [
      "line",
      { "x1": "8.59", "x2": "15.42", "y1": "13.51", "y2": "17.49" }
    ],
    [
      "line",
      { "x1": "15.41", "x2": "8.59", "y1": "6.51", "y2": "10.49" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "share-2" },
    $$sanitized_props,
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
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Triangle_alert($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "path",
      {
        "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      }
    ],
    ["path", { "d": "M12 9v4" }],
    ["path", { "d": "M12 17h.01" }]
  ];
  Icon($$renderer, spread_props([
    { name: "triangle-alert" },
    $$sanitized_props,
    {
      /**
       * @component @name TriangleAlert
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMjEuNzMgMTgtOC0xNGEyIDIgMCAwIDAtMy40OCAwbC04IDE0QTIgMiAwIDAgMCA0IDIxaDE2YTIgMiAwIDAgMCAxLjczLTMiIC8+CiAgPHBhdGggZD0iTTEyIDl2NCIgLz4KICA8cGF0aCBkPSJNMTIgMTdoLjAxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/triangle-alert
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Users($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { "cx": "9", "cy": "7", "r": "4" }],
    ["path", { "d": "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["path", { "d": "M16 3.13a4 4 0 0 1 0 7.75" }]
  ];
  Icon($$renderer, spread_props([
    { name: "users" },
    $$sanitized_props,
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
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const pin = writable("");
    const isSharing = writable(false);
    const viewerCount = writable(0);
    const copiedPin = writable(false);
    const copiedUrl = writable(false);
    const isMuted = writable(false);
    const isFullscreen = writable(false);
    const error = writable("");
    const roomUrl = writable("");
    const isLoading = writable(true);
    const showLeaveConfirm = writable(false);
    onDestroy(() => {
      stopSharing();
    });
    function stopSharing() {
      isSharing.set(false);
    }
    head("ek3c68", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Sala de Wachaut</title>`);
      });
    });
    if (store_get($$store_subs ??= {}, "$isLoading", isLoading)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<main class="flex min-h-screen flex-col items-center justify-center bg-slate-50"><div class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100"><div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600"></div></div> <p class="text-lg font-semibold text-slate-700">Preparando sala...</p> <p class="mt-2 text-sm text-slate-400">Un momento</p></main>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<main class="flex min-h-screen flex-col bg-slate-50"><header class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl"><div class="mx-auto flex max-w-6xl items-center justify-between"><div class="flex items-center gap-3"><button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700" title="Volver al inicio">`);
      Arrow_left($$renderer2, { class: "h-4 w-4" });
      $$renderer2.push(`<!----></button> <div class="flex items-center gap-2"><div class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800">`);
      Monitor($$renderer2, { class: "h-3.5 w-3.5 text-white" });
      $$renderer2.push(`<!----></div> <span class="font-semibold text-slate-800">Wachaut</span></div></div> <div class="flex items-center gap-3">`);
      if (store_get($$store_subs ??= {}, "$isSharing", isSharing)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"><div class="h-2 w-2 animate-pulse rounded-full bg-red-500"></div> En vivo</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">`);
      Users($$renderer2, { class: "h-3.5 w-3.5" });
      $$renderer2.push(`<!----> <span>${escape_html(store_get($$store_subs ??= {}, "$viewerCount", viewerCount))} espectador${escape_html(store_get($$store_subs ??= {}, "$viewerCount", viewerCount) === 1 ? "" : "es")}</span></div></div></div></header> `);
      if (store_get($$store_subs ??= {}, "$error", error)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mx-4 mt-4 animate-slide-up"><div class="mx-auto flex max-w-6xl items-center gap-3 rounded-xl bg-red-50 px-4 py-3 border border-red-100">`);
        Triangle_alert($$renderer2, { class: "h-4 w-4 flex-shrink-0 text-red-500" });
        $$renderer2.push(`<!----> <p class="text-sm text-red-600">${escape_html(store_get($$store_subs ??= {}, "$error", error))}</p></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="flex flex-1 flex-col lg:flex-row"><div class="flex-1 bg-slate-900 p-4"><div class="relative mx-auto aspect-video max-w-5xl overflow-hidden rounded-2xl bg-slate-800 shadow-2xl">`);
      if (store_get($$store_subs ??= {}, "$isSharing", isSharing)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<video class="h-full w-full" autoplay="" muted="" playsinline=""></video> <div class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 opacity-0 transition-opacity duration-300 hover:opacity-100"><button class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"${attr("title", store_get($$store_subs ??= {}, "$isMuted", isMuted) ? "Activar audio" : "Silenciar audio")}>`);
        if (store_get($$store_subs ??= {}, "$isMuted", isMuted)) {
          $$renderer2.push("<!--[0-->");
          Volume_x($$renderer2, { class: "h-5 w-5" });
        } else {
          $$renderer2.push("<!--[-1-->");
          Volume_2($$renderer2, { class: "h-5 w-5" });
        }
        $$renderer2.push(`<!--]--></button> <button class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"${attr("title", store_get($$store_subs ??= {}, "$isFullscreen", isFullscreen) ? "Salir de pantalla completa" : "Pantalla completa")}>`);
        if (store_get($$store_subs ??= {}, "$isFullscreen", isFullscreen)) {
          $$renderer2.push("<!--[0-->");
          Minimize($$renderer2, { class: "h-5 w-5" });
        } else {
          $$renderer2.push("<!--[-1-->");
          Maximize($$renderer2, { class: "h-5 w-5" });
        }
        $$renderer2.push(`<!--]--></button> <button class="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500/90 px-4 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-red-600" title="Detener compartir">`);
        Circle_stop($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----> <span class="hidden sm:inline">Detener</span></button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="flex h-full flex-col items-center justify-center text-white"><div class="mb-6 flex h-20 w-20 animate-float items-center justify-center rounded-2xl bg-slate-700/50">`);
        Monitor($$renderer2, { class: "h-10 w-10 text-slate-400" });
        $$renderer2.push(`<!----></div> <p class="mb-2 text-xl font-semibold text-slate-300">Tu pantalla aparecerá aquí</p> <p class="mb-6 text-sm text-slate-500">Haz clic para empezar a compartir</p> <button class="btn-primary gap-2 px-6 py-3.5">`);
        Share_2($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----> Compartir pantalla</button></div>`);
      }
      $$renderer2.push(`<!--]--></div></div> <div class="w-full border-l border-slate-200/80 bg-white p-5 lg:w-80"><div class="space-y-5"><div class="card-static"><div class="mb-4 flex items-center gap-2"><div class="h-2 w-2 rounded-full bg-green-500"></div> <h3 class="text-sm font-bold text-slate-800">Información de la sala</h3></div> <div class="mb-4"><label class="mb-1.5 block text-xs font-medium text-slate-500">PIN de acceso</label> <div class="flex items-center gap-2"><code class="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.3em] text-slate-800">${escape_html(store_get($$store_subs ??= {}, "$pin", pin))}</code> <button class="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 transition-colors hover:bg-slate-50" title="Copiar PIN">`);
      if (store_get($$store_subs ??= {}, "$copiedPin", copiedPin)) {
        $$renderer2.push("<!--[0-->");
        Check($$renderer2, { class: "h-5 w-5 text-green-600" });
      } else {
        $$renderer2.push("<!--[-1-->");
        Copy($$renderer2, { class: "h-5 w-5 text-slate-500" });
      }
      $$renderer2.push(`<!--]--></button></div> `);
      if (store_get($$store_subs ??= {}, "$copiedPin", copiedPin)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="mt-1.5 text-xs text-green-600 animate-fade-in">¡PIN copiado!</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div><label class="mb-1.5 block text-xs font-medium text-slate-500">Enlace para compartir</label> <div class="flex items-center gap-2"><input type="text"${attr("value", store_get($$store_subs ??= {}, "$roomUrl", roomUrl))} readonly="" class="input-field flex-1 text-xs"/> <button class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 transition-colors hover:bg-slate-50" title="Copiar enlace">`);
      if (store_get($$store_subs ??= {}, "$copiedUrl", copiedUrl)) {
        $$renderer2.push("<!--[0-->");
        Check($$renderer2, { class: "h-5 w-5 text-green-600" });
      } else {
        $$renderer2.push("<!--[-1-->");
        Copy($$renderer2, { class: "h-5 w-5 text-slate-500" });
      }
      $$renderer2.push(`<!--]--></button></div> `);
      if (store_get($$store_subs ??= {}, "$copiedUrl", copiedUrl)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="mt-1.5 text-xs text-green-600 animate-fade-in">¡Enlace copiado!</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="card-static"><h3 class="mb-3 text-sm font-bold text-slate-800">Acciones</h3> <div class="space-y-2.5">`);
      if (!store_get($$store_subs ??= {}, "$isSharing", isSharing)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="btn-primary w-full gap-2 py-3.5">`);
        Share_2($$renderer2, { class: "h-4 w-4" });
        $$renderer2.push(`<!----> Compartir pantalla</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<button class="btn-danger w-full gap-2 py-3.5">`);
        Circle_stop($$renderer2, { class: "h-4 w-4" });
        $$renderer2.push(`<!----> Detener compartir</button>`);
      }
      $$renderer2.push(`<!--]--> <button class="btn-secondary w-full py-3.5">Cerrar sala</button></div></div> <div class="rounded-xl bg-blue-50 p-4 border border-blue-100"><div class="flex items-start gap-3"><div class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-700">i</div> <div><h4 class="mb-1 text-xs font-bold text-blue-800">Consejo</h4> <p class="text-xs leading-relaxed text-blue-600">Comparte el PIN o el enlace con tus amigos para que se unan a la sala. Máximo 5 espectadores.</p></div></div></div></div></div></div></main> `);
      if (store_get($$store_subs ??= {}, "$showLeaveConfirm", showLeaveConfirm)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"><div class="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scale-in"><div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">`);
        Triangle_alert($$renderer2, { class: "h-6 w-6 text-amber-500" });
        $$renderer2.push(`<!----></div> <h3 class="mb-2 text-lg font-bold text-slate-800">¿Cerrar la sala?</h3> <p class="mb-6 text-sm text-slate-500">`);
        if (store_get($$store_subs ??= {}, "$isSharing", isSharing)) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`Se detendrá la transmisión y los espectadores perderán la conexión.`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`Los espectadores perderán la conexión.`);
        }
        $$renderer2.push(`<!--]--></p> <div class="flex gap-3"><button class="btn-secondary flex-1 py-3">Cancelar</button> <button class="btn-danger flex-1 py-3">Cerrar sala</button></div></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
