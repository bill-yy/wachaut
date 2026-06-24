

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.BgfkpWAt.js","_app/immutable/chunks/DnWreqMH.js"];
export const stylesheets = ["_app/immutable/assets/0.BCbpdnf1.css"];
export const fonts = [];
