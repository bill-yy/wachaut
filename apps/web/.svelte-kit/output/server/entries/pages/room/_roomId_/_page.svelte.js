import { s as sanitize_props, a as spread_props, b as slot, o as head, p as store_get, m as escape_html, q as attr, t as attr_class, u as unsubscribe_stores } from "../../../../chunks/root.js";
import { o as onDestroy, A as Arrow_left, V as Volume_x, a as Volume_2, M as Minimize, b as Maximize } from "../../../../chunks/volume-x.js";
import "@sveltejs/kit/internal";
import { w as writable } from "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import "socket.io-client";
import { I as Icon } from "../../../../chunks/Icon.js";
function Circle_alert($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["line", { "x1": "12", "x2": "12", "y1": "8", "y2": "12" }],
    [
      "line",
      { "x1": "12", "x2": "12.01", "y1": "16", "y2": "16" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "circle-alert" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleAlert
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIxMiIgeTE9IjgiIHkyPSIxMiIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIxMi4wMSIgeTE9IjE2IiB5Mj0iMTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/circle-alert
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
function Eye_off($$renderer, $$props) {
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
        "d": "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
      }
    ],
    ["path", { "d": "M14.084 14.158a3 3 0 0 1-4.242-4.242" }],
    [
      "path",
      {
        "d": "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
      }
    ],
    ["path", { "d": "m2 2 20 20" }]
  ];
  Icon($$renderer, spread_props([
    { name: "eye-off" },
    $$sanitized_props,
    {
      /**
       * @component @name EyeOff
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAuNzMzIDUuMDc2YTEwLjc0NCAxMC43NDQgMCAwIDEgMTEuMjA1IDYuNTc1IDEgMSAwIDAgMSAwIC42OTYgMTAuNzQ3IDEwLjc0NyAwIDAgMS0xLjQ0NCAyLjQ5IiAvPgogIDxwYXRoIGQ9Ik0xNC4wODQgMTQuMTU4YTMgMyAwIDAgMS00LjI0Mi00LjI0MiIgLz4KICA8cGF0aCBkPSJNMTcuNDc5IDE3LjQ5OWExMC43NSAxMC43NSAwIDAgMS0xNS40MTctNS4xNTEgMSAxIDAgMCAxIDAtLjY5NiAxMC43NSAxMC43NSAwIDAgMSA0LjQ0Ni01LjE0MyIgLz4KICA8cGF0aCBkPSJtMiAyIDIwIDIwIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/eye-off
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
function Eye($$renderer, $$props) {
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
        "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
      }
    ],
    ["circle", { "cx": "12", "cy": "12", "r": "3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "eye" },
    $$sanitized_props,
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
function Loader_circle($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [["path", { "d": "M21 12a9 9 0 1 1-6.219-8.56" }]];
  Icon($$renderer, spread_props([
    { name: "loader-circle" },
    $$sanitized_props,
    {
      /**
       * @component @name LoaderCircle
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEgMTJhOSA5IDAgMSAxLTYuMjE5LTguNTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/loader-circle
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
function Lock($$renderer, $$props) {
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
        "width": "18",
        "height": "11",
        "x": "3",
        "y": "11",
        "rx": "2",
        "ry": "2"
      }
    ],
    ["path", { "d": "M7 11V7a5 5 0 0 1 10 0v4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "lock" },
    $$sanitized_props,
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
function Wifi_off($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.460.1 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M12 20h.01" }],
    ["path", { "d": "M8.5 16.429a5 5 0 0 1 7 0" }],
    ["path", { "d": "M5 12.859a10 10 0 0 1 5.17-2.69" }],
    ["path", { "d": "M19 12.859a10 10 0 0 0-2.007-1.523" }],
    ["path", { "d": "M2 8.82a15 15 0 0 1 4.177-2.643" }],
    ["path", { "d": "M22 8.82a15 15 0 0 0-11.288-3.764" }],
    ["path", { "d": "m2 2 20 20" }]
  ];
  Icon($$renderer, spread_props([
    { name: "wifi-off" },
    $$sanitized_props,
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
    const isConnected = writable(false);
    const isConnecting = writable(false);
    const isAuthenticating = writable(false);
    const error = writable("");
    let socket = null;
    let peer = null;
    const isMuted = writable(false);
    const isFullscreen = writable(false);
    const hostDisconnected = writable(false);
    const pinError = writable("");
    const showPin = writable(false);
    const isAuthenticated = writable(false);
    onDestroy(() => {
      cleanup();
    });
    function cleanup() {
      peer?.close();
      peer = null;
      socket?.disconnect();
      socket = null;
    }
    head("gjovul", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Unirse a sala - Wachaut</title>`);
      });
    });
    $$renderer2.push(`<main class="flex min-h-screen flex-col bg-slate-900 svelte-gjovul">`);
    if (!store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated) && !store_get($$store_subs ??= {}, "$isConnecting", isConnecting) && !store_get($$store_subs ??= {}, "$isConnected", isConnected)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex flex-1 flex-col items-center justify-center px-4 svelte-gjovul"><div class="w-full max-w-sm animate-slide-up svelte-gjovul"><div class="mb-8 text-center svelte-gjovul"><div class="mb-5 flex justify-center svelte-gjovul"><div class="flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-slate-800 shadow-lg svelte-gjovul">`);
      Lock($$renderer2, { class: "h-8 w-8 text-slate-300" });
      $$renderer2.push(`<!----></div></div> <h1 class="text-2xl font-bold text-white svelte-gjovul">Sala protegida</h1> <p class="mt-2 text-sm text-slate-400 svelte-gjovul">Introduce el PIN de 6 dígitos para acceder</p></div> `);
      if (store_get($$store_subs ??= {}, "$error", error)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mb-4 flex items-center gap-2 rounded-xl bg-red-50/10 px-4 py-3 text-sm text-red-400 border border-red-500/20 svelte-gjovul">`);
        Circle_alert($$renderer2, { class: "h-4 w-4 flex-shrink-0" });
        $$renderer2.push(`<!----> ${escape_html(store_get($$store_subs ??= {}, "$error", error))}</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="space-y-4 svelte-gjovul"><div class="relative svelte-gjovul"><input name="viewer-pin"${attr("type", store_get($$store_subs ??= {}, "$showPin", showPin) ? "text" : "password")} inputmode="numeric" maxlength="6" placeholder="000000"${attr_class(
        `input-field w-full bg-slate-800 border-slate-700 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-slate-500 focus:border-slate-500 focus:ring-slate-500/20 ${store_get($$store_subs ??= {}, "$pinError", pinError) ? "border-red-400 focus:border-red-400 focus:ring-red-500/20" : ""}`,
        "svelte-gjovul"
      )}${attr("value", store_get($$store_subs ??= {}, "$pin", pin))}/> <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors svelte-gjovul"${attr("title", store_get($$store_subs ??= {}, "$showPin", showPin) ? "Ocultar PIN" : "Mostrar PIN")}>`);
      if (store_get($$store_subs ??= {}, "$showPin", showPin)) {
        $$renderer2.push("<!--[0-->");
        Eye_off($$renderer2, { class: "h-5 w-5" });
      } else {
        $$renderer2.push("<!--[-1-->");
        Eye($$renderer2, { class: "h-5 w-5" });
      }
      $$renderer2.push(`<!--]--></button></div> `);
      if (store_get($$store_subs ??= {}, "$pinError", pinError)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="text-xs text-red-400 svelte-gjovul">${escape_html(store_get($$store_subs ??= {}, "$pinError", pinError))}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <button${attr("disabled", store_get($$store_subs ??= {}, "$isAuthenticating", isAuthenticating), true)} class="btn-primary w-full py-3.5 gap-2 svelte-gjovul">`);
      if (store_get($$store_subs ??= {}, "$isAuthenticating", isAuthenticating)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white svelte-gjovul"></div> Verificando...`);
      } else {
        $$renderer2.push("<!--[-1-->");
        Lock($$renderer2, { class: "h-4 w-4" });
        $$renderer2.push(`<!----> Acceder a la sala`);
      }
      $$renderer2.push(`<!--]--></button> <button class="btn-secondary w-full gap-2 py-3.5 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white svelte-gjovul">`);
      Arrow_left($$renderer2, { class: "h-4 w-4" });
      $$renderer2.push(`<!----> Volver al inicio</button></div></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (store_get($$store_subs ??= {}, "$isAuthenticating", isAuthenticating) || store_get($$store_subs ??= {}, "$isConnecting", isConnecting)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex flex-1 flex-col items-center justify-center animate-fade-in svelte-gjovul"><div class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 svelte-gjovul">`);
      Loader_circle($$renderer2, { class: "h-8 w-8 animate-spin text-slate-300" });
      $$renderer2.push(`<!----></div> <p class="text-lg font-semibold text-white svelte-gjovul">`);
      if (store_get($$store_subs ??= {}, "$isAuthenticating", isAuthenticating)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`Verificando PIN...`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`Conectando...`);
      }
      $$renderer2.push(`<!--]--></p> <p class="mt-2 text-sm text-slate-400 svelte-gjovul">`);
      if (store_get($$store_subs ??= {}, "$isAuthenticating", isAuthenticating)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`Comprobando credenciales de la sala`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`Estableciendo conexión segura`);
      }
      $$renderer2.push(`<!--]--></p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (store_get($$store_subs ??= {}, "$isConnected", isConnected)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="relative flex flex-1 items-center justify-center animate-fade-in svelte-gjovul">`);
      if (store_get($$store_subs ??= {}, "$hostDisconnected", hostDisconnected)) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm svelte-gjovul"><div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 svelte-gjovul">`);
        Wifi_off($$renderer2, { class: "h-8 w-8 text-slate-400" });
        $$renderer2.push(`<!----></div> <p class="text-xl font-semibold text-white svelte-gjovul">El anfitrión se ha desconectado</p> <p class="mt-2 text-sm text-slate-400 svelte-gjovul">Esperando reconexión...</p> <div class="mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-slate-800 svelte-gjovul"><div class="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded-full bg-blue-500 svelte-gjovul"></div></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <video class="h-full w-full object-contain svelte-gjovul" autoplay="" playsinline=""></video> <div class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 opacity-0 transition-opacity duration-300 hover:opacity-100 svelte-gjovul"><button class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 svelte-gjovul"${attr("title", store_get($$store_subs ??= {}, "$isMuted", isMuted) ? "Activar audio" : "Silenciar")}>`);
      if (store_get($$store_subs ??= {}, "$isMuted", isMuted)) {
        $$renderer2.push("<!--[0-->");
        Volume_x($$renderer2, { class: "h-5 w-5" });
      } else {
        $$renderer2.push("<!--[-1-->");
        Volume_2($$renderer2, { class: "h-5 w-5" });
      }
      $$renderer2.push(`<!--]--></button> <button class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 svelte-gjovul"${attr("title", store_get($$store_subs ??= {}, "$isFullscreen", isFullscreen) ? "Salir de pantalla completa" : "Pantalla completa")}>`);
      if (store_get($$store_subs ??= {}, "$isFullscreen", isFullscreen)) {
        $$renderer2.push("<!--[0-->");
        Minimize($$renderer2, { class: "h-5 w-5" });
      } else {
        $$renderer2.push("<!--[-1-->");
        Maximize($$renderer2, { class: "h-5 w-5" });
      }
      $$renderer2.push(`<!--]--></button> <button class="flex h-11 items-center justify-center gap-2 rounded-xl bg-white/20 px-5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 svelte-gjovul">Salir de la sala</button></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></main>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
