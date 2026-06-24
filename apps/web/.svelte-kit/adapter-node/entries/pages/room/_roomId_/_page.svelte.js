import { s as sanitize_props, a as spread_props, b as slot, h as head, c as attr, f as attr_class, e as escape_html } from "../../../../chunks/root.js";
import { o as onDestroy, A as Arrow_left } from "../../../../chunks/arrow-left.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import "socket.io-client";
import { I as Icon } from "../../../../chunks/Icon.js";
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
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let pin = "";
    let isAuthenticating = false;
    let socket = null;
    let peer = null;
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
        $$renderer4.push(`<title>${escape_html("Unirse a sala - Wachaut")}</title>`);
      });
    });
    $$renderer2.push(`<main class="flex min-h-screen flex-col bg-slate-900 svelte-gjovul">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex flex-1 flex-col items-center justify-center px-4 svelte-gjovul"><div class="w-full max-w-sm animate-slide-up svelte-gjovul"><div class="mb-8 text-center svelte-gjovul"><div class="mb-5 flex justify-center svelte-gjovul"><div class="flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-slate-800 shadow-lg svelte-gjovul">`);
      Lock($$renderer2, { class: "h-8 w-8 text-slate-300" });
      $$renderer2.push(`<!----></div></div> <h1 class="text-2xl font-bold text-white svelte-gjovul">Sala protegida</h1> <p class="mt-2 text-sm text-slate-400 svelte-gjovul">Introduce el PIN de 6 dígitos para acceder</p></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="space-y-4 svelte-gjovul"><div class="relative svelte-gjovul"><input name="viewer-pin"${attr("type", "password")} inputmode="numeric" maxlength="6" placeholder="000000"${attr_class(
        `input-field w-full bg-slate-800 border-slate-700 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-slate-500 focus:border-slate-500 focus:ring-slate-500/20 ${""}`,
        "svelte-gjovul"
      )}${attr("value", pin)}/> <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors svelte-gjovul"${attr("title", "Mostrar PIN")}>`);
      {
        $$renderer2.push("<!--[-1-->");
        Eye($$renderer2, { class: "h-5 w-5" });
      }
      $$renderer2.push(`<!--]--></button></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <button${attr("disabled", isAuthenticating, true)} class="btn-primary w-full py-3.5 gap-2 svelte-gjovul">`);
      {
        $$renderer2.push("<!--[-1-->");
        Lock($$renderer2, { class: "h-4 w-4" });
        $$renderer2.push(`<!----> Acceder a la sala`);
      }
      $$renderer2.push(`<!--]--></button> <button class="btn-secondary w-full gap-2 py-3.5 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white svelte-gjovul">`);
      Arrow_left($$renderer2, { class: "h-4 w-4" });
      $$renderer2.push(`<!----> Volver al inicio</button></div></div></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></main>`);
  });
}
export {
  _page as default
};
