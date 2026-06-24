import { s as store_get, u as unsubscribe_stores, p as pop, a as push } from "../../../chunks/index.js";
import { w as writable } from "../../../chunks/index2.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const roomId = writable("");
  const pin = writable("");
  const isLoading = writable(true);
  if (store_get($$store_subs ??= {}, "$isLoading", isLoading)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex min-h-screen items-center justify-center"><p>Cargando...</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="flex min-h-screen items-center justify-center"><h1>Sala: ${escape_html(store_get($$store_subs ??= {}, "$roomId", roomId))}</h1> <p>PIN: ${escape_html(store_get($$store_subs ??= {}, "$pin", pin))}</p></div>`;
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
