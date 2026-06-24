import { b as slot } from "../../chunks/index.js";
function _layout($$payload, $$props) {
  $$payload.out += `<div><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></div>`;
}
export {
  _layout as default
};
