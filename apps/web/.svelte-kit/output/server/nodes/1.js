

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.7XqPKznN.js","_app/immutable/chunks/DT-l7Ym4.js","_app/immutable/chunks/B3zxBmJq.js","_app/immutable/chunks/CHna-VuH.js"];
export const stylesheets = [];
export const fonts = [];
