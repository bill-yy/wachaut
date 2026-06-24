import { h as head, e as escape_html } from "../../../chunks/root.js";
import { o as onDestroy } from "../../../chunks/index-server.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import "socket.io-client";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let state = {
      isSharing: false
    };
    onDestroy(() => {
      stopSharing();
    });
    function stopSharing() {
      state.isSharing = false;
    }
    head("ek3c68", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(state.isSharing ? "Compartiendo pantalla - Wachaut" : "Sala de Wachaut")}</title>`);
      });
    });
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<main class="flex min-h-screen flex-col items-center justify-center bg-slate-50"><div class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100"><div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600"></div></div> <p class="text-lg font-semibold text-slate-700">Preparando sala...</p> <p class="mt-2 text-sm text-slate-400">Un momento</p></main>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
