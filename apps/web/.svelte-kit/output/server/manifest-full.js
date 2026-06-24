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
		client: {start:"_app/immutable/entry/start.Ct_AXvY0.js",app:"_app/immutable/entry/app.f6cye3bF.js",imports:["_app/immutable/entry/start.Ct_AXvY0.js","_app/immutable/chunks/Dvd_w-bh.js","_app/immutable/chunks/CXGzX6Dr.js","_app/immutable/chunks/P1yts1hL.js","_app/immutable/chunks/CzgSnn1B.js","_app/immutable/chunks/CyHeUPdP.js","_app/immutable/entry/app.f6cye3bF.js","_app/immutable/chunks/CXGzX6Dr.js","_app/immutable/chunks/P1yts1hL.js","_app/immutable/chunks/CzgSnn1B.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
