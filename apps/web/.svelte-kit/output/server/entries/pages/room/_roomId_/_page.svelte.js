import { q as getContext, g as escape_html, d as store_get, u as unsubscribe_stores, p as pop, e as push } from "../../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  $$payload.out += `<div class="flex min-h-screen items-center justify-center"><h1>Viewer: ${escape_html(store_get($$store_subs ??= {}, "$page", page).params.roomId)}</h1></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
