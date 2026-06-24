import { a as sanitize_props, b as spread_props, s as slot, h as head, c as attr, d as store_get, u as unsubscribe_stores, p as pop, e as push } from "../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import { w as writable } from "../../chunks/index2.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
import { I as Icon, M as Monitor } from "../../chunks/monitor.js";
function Arrow_right($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M5 12h14" }],
    ["path", { "d": "m12 5 7 7-7 7" }]
  ];
  Icon($$payload, spread_props([
    { name: "arrow-right" },
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
function Chevron_right($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [["path", { "d": "m9 18 6-6-6-6" }]];
  Icon($$payload, spread_props([
    { name: "chevron-right" },
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
function Globe($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    [
      "path",
      {
        "d": "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"
      }
    ],
    ["path", { "d": "M2 12h20" }]
  ];
  Icon($$payload, spread_props([
    { name: "globe" },
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
function Link_2($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M9 17H7A5 5 0 0 1 7 7h2" }],
    ["path", { "d": "M15 7h2a5 5 0 1 1 0 10h-2" }],
    [
      "line",
      {
        "x1": "8",
        "x2": "16",
        "y1": "12",
        "y2": "12"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "link-2" },
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
function Radio($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      { "d": "M4.9 19.1C1 15.2 1 8.8 4.9 4.9" }
    ],
    [
      "path",
      { "d": "M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" }
    ],
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "2" }
    ],
    [
      "path",
      { "d": "M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" }
    ],
    [
      "path",
      { "d": "M19.1 4.9C23 8.8 23 15.1 19.1 19" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "radio" },
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
function Shield($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "shield" },
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
function Wifi($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M12 20h.01" }],
    ["path", { "d": "M2 8.82a15 15 0 0 1 20 0" }],
    ["path", { "d": "M5 12.859a10 10 0 0 1 14 0" }],
    ["path", { "d": "M8.5 16.429a5 5 0 0 1 7 0" }]
  ];
  Icon($$payload, spread_props([
    { name: "wifi" },
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
function Zap($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "zap" },
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
  const isCreating = writable(false);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Wachaut — Comparte tu pantalla al instante</title>`;
    $$payload2.out += `<meta name="description" content="Comparte tu pantalla con amigos sin registro. Crea una sala, comparte el enlace y listo.">`;
  });
  $$payload.out += `<main class="flex min-h-screen flex-col gradient-hero"><nav class="w-full px-4 py-4"><div class="mx-auto flex max-w-5xl items-center justify-between"><div class="flex items-center gap-2.5"><div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 shadow-lg shadow-slate-800/20">`;
  Monitor($$payload, { class: "h-4.5 w-4.5 text-white" });
  $$payload.out += `<!----></div> <span class="text-lg font-bold text-slate-800">Wachaut</span></div> <div class="flex items-center gap-2"><span class="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600"><span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span> <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span></span> Servicio activo</span></div></div></nav> <section class="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center"><div class="mx-auto max-w-xl animate-slide-up"><div class="mb-6 flex justify-center"><div class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-600">`;
  Wifi($$payload, { class: "h-3.5 w-3.5" });
  $$payload.out += `<!----> Conexión directa P2P</div></div> <h1 class="mb-4 text-5xl font-extrabold tracking-tight text-slate-800 sm:text-6xl">Comparte tu pantalla</h1> <p class="mb-2 text-lg text-slate-500">Sin registro, sin complicaciones. Crea una sala y comparte el enlace.</p> <p class="mb-10 text-sm text-slate-400">Hasta 5 espectadores · Audio incluido · Funciona en cualquier navegador</p> <div class="flex flex-col gap-3 sm:flex-row sm:justify-center"><button${attr("disabled", store_get($$store_subs ??= {}, "$isCreating", isCreating), true)} class="btn-primary gap-2 px-8 py-4 text-base">`;
  if (store_get($$store_subs ??= {}, "$isCreating", isCreating)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div> Creando sala...`;
  } else {
    $$payload.out += "<!--[!-->";
    Radio($$payload, { class: "h-5 w-5" });
    $$payload.out += `<!----> Crear una sala `;
    Chevron_right($$payload, { class: "h-4 w-4" });
    $$payload.out += `<!---->`;
  }
  $$payload.out += `<!--]--></button> <a href="#join" class="btn-secondary gap-2 px-8 py-4 text-base">`;
  Link_2($$payload, { class: "h-5 w-5" });
  $$payload.out += `<!----> Tengo un enlace</a></div> <div id="join" class="mt-10"><div class="card-static mx-auto max-w-md"><div class="flex items-center gap-3 mb-4"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">`;
  Link_2($$payload, { class: "h-5 w-5 text-blue-500" });
  $$payload.out += `<!----></div> <div class="text-left"><p class="text-sm font-semibold text-slate-800">¿Tienes un enlace?</p> <p class="text-xs text-slate-500">Pega el enlace que te ha compartido el anfitrión</p></div></div> <div class="flex gap-2"><input type="text" placeholder="https://wachaut.billytech.es/room/..." class="input-field flex-1 text-sm"> <button class="btn-primary px-5" title="Entrar en la sala">`;
  Arrow_right($$payload, { class: "h-5 w-5" });
  $$payload.out += `<!----></button></div></div></div></div></section> <section class="border-t border-slate-200/60 bg-white/50 px-4 py-16 backdrop-blur-sm"><div class="mx-auto max-w-4xl"><div class="grid gap-6 sm:grid-cols-3"><div class="card text-center"><div class="mb-4 flex justify-center"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">`;
  Zap($$payload, { class: "h-6 w-6 text-amber-500" });
  $$payload.out += `<!----></div></div> <h3 class="mb-2 text-sm font-bold text-slate-800">Sin registro</h3> <p class="text-sm leading-relaxed text-slate-500">Entra y comparte en segundos. Sin cuentas, sin contraseñas, sin formularios.</p></div> <div class="card text-center"><div class="mb-4 flex justify-center"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">`;
  Globe($$payload, { class: "h-6 w-6 text-blue-500" });
  $$payload.out += `<!----></div></div> <h3 class="mb-2 text-sm font-bold text-slate-800">Desde el navegador</h3> <p class="text-sm leading-relaxed text-slate-500">No necesitas instalar nada. Funciona en Chrome, Firefox, Edge y Safari.</p></div> <div class="card text-center"><div class="mb-4 flex justify-center"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">`;
  Shield($$payload, { class: "h-6 w-6 text-emerald-500" });
  $$payload.out += `<!----></div></div> <h3 class="mb-2 text-sm font-bold text-slate-800">Privado y seguro</h3> <p class="text-sm leading-relaxed text-slate-500">Conexión directa entre vosotros. Sin servidores de por medio viendo tu contenido.</p></div></div></div></section> <footer class="border-t border-slate-200/60 bg-white/30 px-4 py-8 text-center backdrop-blur-sm"><p class="text-xs text-slate-400">Wachaut — Comparte tu pantalla con amigos</p></footer></main>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
