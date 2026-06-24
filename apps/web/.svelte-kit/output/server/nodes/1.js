

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.C0kmgiA-.js","_app/immutable/chunks/BG_Dq2cs.js","_app/immutable/chunks/Bb2WiXJK.js","_app/immutable/chunks/DxIBFSGb.js"];
export const stylesheets = [];
export const fonts = [];
