import { d as sanitize_props, f as spread_props, c as slot, h as head, s as store_get, e as escape_html, a as attr, i as stringify, u as unsubscribe_stores, p as pop, b as push } from "../../../../chunks/index.js";
import { I as Icon, o as onDestroy, A as Arrow_left, V as Volume_x, a as Volume_2, M as Minimize, b as Maximize } from "../../../../chunks/volume-x.js";
import "@sveltejs/kit/internal";
import { w as writable } from "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import "socket.io-client";
function Circle_alert($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    [
      "line",
      {
        "x1": "12",
        "x2": "12",
        "y1": "8",
        "y2": "12"
      }
    ],
    [
      "line",
      {
        "x1": "12",
        "x2": "12.01",
        "y1": "16",
        "y2": "16"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "circle-alert" },
    $$sanitized_props,
    {
      iconNode,
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
function Eye_off($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
      }
    ],
    [
      "path",
      { "d": "M14.084 14.158a3 3 0 0 1-4.242-4.242" }
    ],
    [
      "path",
      {
        "d": "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
      }
    ],
    ["path", { "d": "m2 2 20 20" }]
  ];
  Icon($$payload, spread_props([
    { name: "eye-off" },
    $$sanitized_props,
    {
      iconNode,
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
function Eye($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
      }
    ],
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "3" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "eye" },
    $$sanitized_props,
    {
      iconNode,
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
function Loader_circle($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      { "d": "M21 12a9 9 0 1 1-6.219-8.56" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "loader-circle" },
    $$sanitized_props,
    {
      iconNode,
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
function Lock($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
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
  Icon($$payload, spread_props([
    { name: "lock" },
    $$sanitized_props,
    {
      iconNode,
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
function Wifi_off($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M12 20h.01" }],
    ["path", { "d": "M8.5 16.429a5 5 0 0 1 7 0" }],
    [
      "path",
      { "d": "M5 12.859a10 10 0 0 1 5.17-2.69" }
    ],
    [
      "path",
      { "d": "M19 12.859a10 10 0 0 0-2.007-1.523" }
    ],
    [
      "path",
      { "d": "M2 8.82a15 15 0 0 1 4.177-2.643" }
    ],
    [
      "path",
      { "d": "M22 8.82a15 15 0 0 0-11.288-3.764" }
    ],
    ["path", { "d": "m2 2 20 20" }]
  ];
  Icon($$payload, spread_props([
    { name: "wifi-off" },
    $$sanitized_props,
    {
      iconNode,
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
function _page($$payload, $$props) {
  push();
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
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Unirse a sala - Wachaut</title>`;
  });
  $$payload.out += `<main class="flex min-h-screen flex-col bg-slate-900 svelte-s09den">`;
  if (!store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated) && !store_get($$store_subs ??= {}, "$isConnecting", isConnecting) && !store_get($$store_subs ??= {}, "$isConnected", isConnected)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex flex-1 flex-col items-center justify-center px-4 svelte-s09den"><div class="w-full max-w-sm animate-slide-up svelte-s09den"><div class="mb-8 text-center svelte-s09den"><div class="mb-5 flex justify-center svelte-s09den"><div class="flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-slate-800 shadow-lg svelte-s09den">`;
    Lock($$payload, { class: "h-8 w-8 text-slate-300" });
    $$payload.out += `<!----></div></div> <h1 class="text-2xl font-bold text-white svelte-s09den">Sala protegida</h1> <p class="mt-2 text-sm text-slate-400 svelte-s09den">Introduce el PIN de 6 dígitos para acceder</p></div> `;
    if (store_get($$store_subs ??= {}, "$error", error)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="mb-4 flex items-center gap-2 rounded-xl bg-red-50/10 px-4 py-3 text-sm text-red-400 border border-red-500/20 svelte-s09den">`;
      Circle_alert($$payload, { class: "h-4 w-4 flex-shrink-0" });
      $$payload.out += `<!----> ${escape_html(store_get($$store_subs ??= {}, "$error", error))}</div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="space-y-4 svelte-s09den"><div class="relative svelte-s09den"><input name="viewer-pin"${attr("type", store_get($$store_subs ??= {}, "$showPin", showPin) ? "text" : "password")} inputmode="numeric" maxlength="6" placeholder="000000"${attr("class", `input-field w-full bg-slate-800 border-slate-700 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-slate-500 focus:border-slate-500 focus:ring-slate-500/20 ${stringify(store_get($$store_subs ??= {}, "$pinError", pinError) ? "border-red-400 focus:border-red-400 focus:ring-red-500/20" : "")} svelte-s09den`)}${attr("value", store_get($$store_subs ??= {}, "$pin", pin))}> <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors svelte-s09den"${attr("title", store_get($$store_subs ??= {}, "$showPin", showPin) ? "Ocultar PIN" : "Mostrar PIN")}>`;
    if (store_get($$store_subs ??= {}, "$showPin", showPin)) {
      $$payload.out += "<!--[-->";
      Eye_off($$payload, { class: "h-5 w-5" });
    } else {
      $$payload.out += "<!--[!-->";
      Eye($$payload, { class: "h-5 w-5" });
    }
    $$payload.out += `<!--]--></button></div> `;
    if (store_get($$store_subs ??= {}, "$pinError", pinError)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="text-xs text-red-400 svelte-s09den">${escape_html(store_get($$store_subs ??= {}, "$pinError", pinError))}</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <button${attr("disabled", store_get($$store_subs ??= {}, "$isAuthenticating", isAuthenticating), true)} class="btn-primary w-full py-3.5 gap-2 svelte-s09den">`;
    if (store_get($$store_subs ??= {}, "$isAuthenticating", isAuthenticating)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white svelte-s09den"></div> Verificando...`;
    } else {
      $$payload.out += "<!--[!-->";
      Lock($$payload, { class: "h-4 w-4" });
      $$payload.out += `<!----> Acceder a la sala`;
    }
    $$payload.out += `<!--]--></button> <button class="btn-secondary w-full gap-2 py-3.5 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white svelte-s09den">`;
    Arrow_left($$payload, { class: "h-4 w-4" });
    $$payload.out += `<!----> Volver al inicio</button></div></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (store_get($$store_subs ??= {}, "$isAuthenticating", isAuthenticating) || store_get($$store_subs ??= {}, "$isConnecting", isConnecting)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex flex-1 flex-col items-center justify-center animate-fade-in svelte-s09den"><div class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 svelte-s09den">`;
    Loader_circle($$payload, { class: "h-8 w-8 animate-spin text-slate-300" });
    $$payload.out += `<!----></div> <p class="text-lg font-semibold text-white svelte-s09den">`;
    if (store_get($$store_subs ??= {}, "$isAuthenticating", isAuthenticating)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `Verificando PIN...`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `Conectando...`;
    }
    $$payload.out += `<!--]--></p> <p class="mt-2 text-sm text-slate-400 svelte-s09den">`;
    if (store_get($$store_subs ??= {}, "$isAuthenticating", isAuthenticating)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `Comprobando credenciales de la sala`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `Estableciendo conexión segura`;
    }
    $$payload.out += `<!--]--></p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (store_get($$store_subs ??= {}, "$isConnected", isConnected)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="relative flex flex-1 items-center justify-center animate-fade-in svelte-s09den">`;
    if (store_get($$store_subs ??= {}, "$hostDisconnected", hostDisconnected)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm svelte-s09den"><div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 svelte-s09den">`;
      Wifi_off($$payload, { class: "h-8 w-8 text-slate-400" });
      $$payload.out += `<!----></div> <p class="text-xl font-semibold text-white svelte-s09den">El anfitrión se ha desconectado</p> <p class="mt-2 text-sm text-slate-400 svelte-s09den">Esperando reconexión...</p> <div class="mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-slate-800 svelte-s09den"><div class="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded-full bg-blue-500 svelte-s09den"></div></div></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <video class="h-full w-full object-contain svelte-s09den" autoplay playsinline></video> <div class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 opacity-0 transition-opacity duration-300 hover:opacity-100 svelte-s09den"><button class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 svelte-s09den"${attr("title", store_get($$store_subs ??= {}, "$isMuted", isMuted) ? "Activar audio" : "Silenciar")}>`;
    if (store_get($$store_subs ??= {}, "$isMuted", isMuted)) {
      $$payload.out += "<!--[-->";
      Volume_x($$payload, { class: "h-5 w-5" });
    } else {
      $$payload.out += "<!--[!-->";
      Volume_2($$payload, { class: "h-5 w-5" });
    }
    $$payload.out += `<!--]--></button> <button class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 svelte-s09den"${attr("title", store_get($$store_subs ??= {}, "$isFullscreen", isFullscreen) ? "Salir de pantalla completa" : "Pantalla completa")}>`;
    if (store_get($$store_subs ??= {}, "$isFullscreen", isFullscreen)) {
      $$payload.out += "<!--[-->";
      Minimize($$payload, { class: "h-5 w-5" });
    } else {
      $$payload.out += "<!--[!-->";
      Maximize($$payload, { class: "h-5 w-5" });
    }
    $$payload.out += `<!--]--></button> <button class="flex h-11 items-center justify-center gap-2 rounded-xl bg-white/20 px-5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 svelte-s09den">Salir de la sala</button></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></main>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
