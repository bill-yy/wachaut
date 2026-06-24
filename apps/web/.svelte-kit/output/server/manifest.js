export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.TYBVVbwG.js",app:"_app/immutable/entry/app.C9s-1bMQ.js",imports:["_app/immutable/entry/start.TYBVVbwG.js","_app/immutable/chunks/CVZxsCSz.js","_app/immutable/chunks/DabJgB7n.js","_app/immutable/chunks/C-0eiNrr.js","_app/immutable/chunks/DFkccbxJ.js","_app/immutable/entry/app.C9s-1bMQ.js","_app/immutable/chunks/DabJgB7n.js","_app/immutable/chunks/C-0eiNrr.js","_app/immutable/chunks/DFkccbxJ.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/room",
				pattern: /^\/room\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/room/[roomId]",
				pattern: /^\/room\/([^/]+?)\/?$/,
				params: [{"name":"roomId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
