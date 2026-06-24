import { f as current_component, a as sanitize_props, b as spread_props, s as slot, h as head, d as store_get, g as escape_html, c as attr, u as unsubscribe_stores, p as pop, e as push } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import { w as writable } from "../../../chunks/index2.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import "socket.io-client";
import { I as Icon, M as Monitor } from "../../../chunks/monitor.js";
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
function Arrow_left($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "m12 19-7-7 7-7" }],
    ["path", { "d": "M19 12H5" }]
  ];
  Icon($$payload, spread_props([
    { name: "arrow-left" },
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
function Check($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [["path", { "d": "M20 6 9 17l-5-5" }]];
  Icon($$payload, spread_props([
    { name: "check" },
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
function Circle_stop($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    [
      "rect",
      {
        "x": "9",
        "y": "9",
        "width": "6",
        "height": "6",
        "rx": "1"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "circle-stop" },
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
function Copy($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
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
  Icon($$payload, spread_props([
    { name: "copy" },
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
function Maximize($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M8 3H5a2 2 0 0 0-2 2v3" }],
    ["path", { "d": "M21 8V5a2 2 0 0 0-2-2h-3" }],
    ["path", { "d": "M3 16v3a2 2 0 0 0 2 2h3" }],
    ["path", { "d": "M16 21h3a2 2 0 0 0 2-2v-3" }]
  ];
  Icon($$payload, spread_props([
    { name: "maximize" },
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
function Minimize($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M8 3v3a2 2 0 0 1-2 2H3" }],
    ["path", { "d": "M21 8h-3a2 2 0 0 1-2-2V3" }],
    ["path", { "d": "M3 16h3a2 2 0 0 1 2 2v3" }],
    ["path", { "d": "M16 21v-3a2 2 0 0 1 2-2h3" }]
  ];
  Icon($$payload, spread_props([
    { name: "minimize" },
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
function Share_2($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["circle", { "cx": "18", "cy": "5", "r": "3" }],
    ["circle", { "cx": "6", "cy": "12", "r": "3" }],
    [
      "circle",
      { "cx": "18", "cy": "19", "r": "3" }
    ],
    [
      "line",
      {
        "x1": "8.59",
        "x2": "15.42",
        "y1": "13.51",
        "y2": "17.49"
      }
    ],
    [
      "line",
      {
        "x1": "15.41",
        "x2": "8.59",
        "y1": "6.51",
        "y2": "10.49"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "share-2" },
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
function Triangle_alert($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
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
  Icon($$payload, spread_props([
    { name: "triangle-alert" },
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
function Users($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      }
    ],
    ["circle", { "cx": "9", "cy": "7", "r": "4" }],
    ["path", { "d": "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["path", { "d": "M16 3.13a4 4 0 0 1 0 7.75" }]
  ];
  Icon($$payload, spread_props([
    { name: "users" },
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
function Volume_2($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
      }
    ],
    ["path", { "d": "M16 9a5 5 0 0 1 0 6" }],
    [
      "path",
      { "d": "M19.364 18.364a9 9 0 0 0 0-12.728" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "volume-2" },
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
function Volume_x($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
      }
    ],
    [
      "line",
      {
        "x1": "22",
        "x2": "16",
        "y1": "9",
        "y2": "15"
      }
    ],
    [
      "line",
      {
        "x1": "16",
        "x2": "22",
        "y1": "9",
        "y2": "15"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "volume-x" },
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
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Sala de Wachaut</title>`;
  });
  if (store_get($$store_subs ??= {}, "$isLoading", isLoading)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex min-h-screen items-center justify-center bg-slate-50"><p class="text-slate-500">Preparando sala...</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<main class="flex min-h-screen flex-col bg-slate-50"><header class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl"><div class="mx-auto flex max-w-6xl items-center justify-between"><div class="flex items-center gap-3"><button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Volver al inicio">`;
    Arrow_left($$payload, { class: "h-4 w-4" });
    $$payload.out += `<!----></button> <div class="flex items-center gap-2"><div class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800">`;
    Monitor($$payload, { class: "h-3.5 w-3.5 text-white" });
    $$payload.out += `<!----></div> <span class="font-semibold text-slate-800">Wachaut</span></div></div> <div class="flex items-center gap-3">`;
    if (store_get($$store_subs ??= {}, "$isSharing", isSharing)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"><div class="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>En vivo</div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">`;
    Users($$payload, { class: "h-3.5 w-3.5" });
    $$payload.out += `<!----> <span>${escape_html(store_get($$store_subs ??= {}, "$viewerCount", viewerCount))} espectador${escape_html(store_get($$store_subs ??= {}, "$viewerCount", viewerCount) === 1 ? "" : "es")}</span></div></div></div></header> `;
    if (store_get($$store_subs ??= {}, "$error", error)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="mx-4 mt-4"><div class="mx-auto flex max-w-6xl items-center gap-3 rounded-xl bg-red-50 px-4 py-3 border border-red-100">`;
      Triangle_alert($$payload, { class: "h-4 w-4 flex-shrink-0 text-red-500" });
      $$payload.out += `<!----><p class="text-sm text-red-600">${escape_html(store_get($$store_subs ??= {}, "$error", error))}</p></div></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="flex flex-1 flex-col lg:flex-row"><div class="flex-1 bg-slate-900 p-4"><div class="relative mx-auto aspect-video max-w-5xl overflow-hidden rounded-2xl bg-slate-800 shadow-2xl">`;
    if (store_get($$store_subs ??= {}, "$isSharing", isSharing)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<video class="h-full w-full" autoplay muted playsinline></video> <div class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 opacity-0 transition-opacity duration-300 hover:opacity-100"><button class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30"${attr("title", store_get($$store_subs ??= {}, "$isMuted", isMuted) ? "Activar audio" : "Silenciar")}>`;
      if (store_get($$store_subs ??= {}, "$isMuted", isMuted)) {
        $$payload.out += "<!--[-->";
        Volume_x($$payload, { class: "h-5 w-5" });
      } else {
        $$payload.out += "<!--[!-->";
        Volume_2($$payload, { class: "h-5 w-5" });
      }
      $$payload.out += `<!--]--></button> <button class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30" title="Pantalla completa">`;
      if (store_get($$store_subs ??= {}, "$isFullscreen", isFullscreen)) {
        $$payload.out += "<!--[-->";
        Minimize($$payload, { class: "h-5 w-5" });
      } else {
        $$payload.out += "<!--[!-->";
        Maximize($$payload, { class: "h-5 w-5" });
      }
      $$payload.out += `<!--]--></button> <button class="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500/90 px-4 text-sm font-medium text-white hover:bg-red-600" title="Detener">`;
      Circle_stop($$payload, { class: "h-5 w-5" });
      $$payload.out += `<!----><span class="hidden sm:inline">Detener</span></button></div>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<div class="flex h-full flex-col items-center justify-center text-white">`;
      Monitor($$payload, { class: "mb-6 h-10 w-10 text-slate-400" });
      $$payload.out += `<!----> <p class="mb-2 text-xl font-semibold text-slate-300">Tu pantalla aparecerá aquí</p> <p class="mb-6 text-sm text-slate-500">Haz clic para empezar a compartir</p> <button class="btn-primary gap-2 px-6 py-3.5">`;
      Share_2($$payload, { class: "h-5 w-5" });
      $$payload.out += `<!---->Compartir pantalla</button></div>`;
    }
    $$payload.out += `<!--]--></div></div> <div class="w-full border-l border-slate-200/80 bg-white p-5 lg:w-80"><div class="space-y-5"><div class="card-static"><div class="mb-4 flex items-center gap-2"><div class="h-2 w-2 rounded-full bg-green-500"></div><h3 class="text-sm font-bold text-slate-800">Información de la sala</h3></div> <div class="mb-4"><label class="mb-1.5 block text-xs font-medium text-slate-500">PIN de acceso</label> <div class="flex items-center gap-2"><code class="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.3em] text-slate-800">${escape_html(store_get($$store_subs ??= {}, "$pin", pin))}</code> <button class="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50" title="Copiar PIN">`;
    if (store_get($$store_subs ??= {}, "$copiedPin", copiedPin)) {
      $$payload.out += "<!--[-->";
      Check($$payload, { class: "h-5 w-5 text-green-600" });
    } else {
      $$payload.out += "<!--[!-->";
      Copy($$payload, { class: "h-5 w-5 text-slate-500" });
    }
    $$payload.out += `<!--]--></button></div> `;
    if (store_get($$store_subs ??= {}, "$copiedPin", copiedPin)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="mt-1.5 text-xs text-green-600">¡PIN copiado!</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div> <div><label class="mb-1.5 block text-xs font-medium text-slate-500">Enlace para compartir</label> <div class="flex items-center gap-2"><input type="text"${attr("value", store_get($$store_subs ??= {}, "$roomUrl", roomUrl))} readonly class="input-field flex-1 text-xs"> <button class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50" title="Copiar enlace">`;
    if (store_get($$store_subs ??= {}, "$copiedUrl", copiedUrl)) {
      $$payload.out += "<!--[-->";
      Check($$payload, { class: "h-5 w-5 text-green-600" });
    } else {
      $$payload.out += "<!--[!-->";
      Copy($$payload, { class: "h-5 w-5 text-slate-500" });
    }
    $$payload.out += `<!--]--></button></div> `;
    if (store_get($$store_subs ??= {}, "$copiedUrl", copiedUrl)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="mt-1.5 text-xs text-green-600">¡Enlace copiado!</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></div> <div class="card-static"><h3 class="mb-3 text-sm font-bold text-slate-800">Acciones</h3> <div class="space-y-2.5">`;
    if (!store_get($$store_subs ??= {}, "$isSharing", isSharing)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button class="btn-primary w-full gap-2 py-3.5">`;
      Share_2($$payload, { class: "h-4 w-4" });
      $$payload.out += `<!---->Compartir pantalla</button>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<button class="btn-danger w-full gap-2 py-3.5">`;
      Circle_stop($$payload, { class: "h-4 w-4" });
      $$payload.out += `<!---->Detener compartir</button>`;
    }
    $$payload.out += `<!--]--> <button class="btn-secondary w-full py-3.5">Cerrar sala</button></div></div> <div class="rounded-xl bg-blue-50 p-4 border border-blue-100"><p class="text-xs leading-relaxed text-blue-600">Comparte el enlace con tus amigos para que se unan. Máximo 5 espectadores.</p></div></div></div></div></main> `;
    if (store_get($$store_subs ??= {}, "$showLeaveConfirm", showLeaveConfirm)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"><div class="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"><h3 class="mb-2 text-lg font-bold text-slate-800">¿Cerrar la sala?</h3> <p class="mb-6 text-sm text-slate-500">Los espectadores perderán la conexión.</p> <div class="flex gap-3"><button class="btn-secondary flex-1 py-3">Cancelar</button> <button class="btn-danger flex-1 py-3">Cerrar sala</button></div></div></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
