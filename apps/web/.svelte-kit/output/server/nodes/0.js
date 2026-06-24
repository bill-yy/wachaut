

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.DrIzzw3q.js","_app/immutable/chunks/CXfXt3CU.js"];
export const stylesheets = ["_app/immutable/assets/0.B6hHsAqR.css"];
export const fonts = [];
