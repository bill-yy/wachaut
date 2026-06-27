import { d as sanitize_props, f as slot, p as spread_props } from "./server.js";
import { n as Icon } from "./monitor.js";
import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/bell-off.svelte
function Bell_off($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "bell-off" },
		sanitize_props($$props),
		{
			/**
			* @component @name BellOff
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOC43IDNBNiA2IDAgMCAxIDE4IDhhMjEuMyAyMS4zIDAgMCAwIC42IDUiIC8+CiAgPHBhdGggZD0iTTE3IDE3SDNzMy0yIDMtOWE0LjY3IDQuNjcgMCAwIDEgLjMtMS43IiAvPgogIDxwYXRoIGQ9Ik0xMC4zIDIxYTEuOTQgMS45NCAwIDAgMCAzLjQgMCIgLz4KICA8cGF0aCBkPSJtMiAyIDIwIDIwIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/bell-off
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [
				["path", { "d": "M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" }],
				["path", { "d": "M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" }],
				["path", { "d": "M10.3 21a1.94 1.94 0 0 0 3.4 0" }],
				["path", { "d": "m2 2 20 20" }]
			],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/bell.svelte
function Bell($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "bell" },
		sanitize_props($$props),
		{
			/**
			* @component @name Bell
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNiA4YTYgNiAwIDAgMSAxMiAwYzAgNyAzIDkgMyA5SDNzMy0yIDMtOSIgLz4KICA8cGF0aCBkPSJNMTAuMyAyMWExLjk0IDEuOTQgMCAwIDAgMy40IDAiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/bell
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["path", { "d": "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }], ["path", { "d": "M10.3 21a1.94 1.94 0 0 0 3.4 0" }]],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/maximize.svelte
function Maximize($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "maximize" },
		sanitize_props($$props),
		{
			/**
			* @component @name Maximize
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOCAzSDVhMiAyIDAgMCAwLTIgMnYzIiAvPgogIDxwYXRoIGQ9Ik0yMSA4VjVhMiAyIDAgMCAwLTItMmgtMyIgLz4KICA8cGF0aCBkPSJNMyAxNnYzYTIgMiAwIDAgMCAyIDJoMyIgLz4KICA8cGF0aCBkPSJNMTYgMjFoM2EyIDIgMCAwIDAgMi0ydi0zIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/maximize
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [
				["path", { "d": "M8 3H5a2 2 0 0 0-2 2v3" }],
				["path", { "d": "M21 8V5a2 2 0 0 0-2-2h-3" }],
				["path", { "d": "M3 16v3a2 2 0 0 0 2 2h3" }],
				["path", { "d": "M16 21h3a2 2 0 0 0 2-2v-3" }]
			],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/message-circle.svelte
function Message_circle($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "message-circle" },
		sanitize_props($$props),
		{
			/**
			* @component @name MessageCircle
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNy45IDIwQTkgOSAwIDEgMCA0IDE2LjFMMiAyMloiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/message-circle
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["path", { "d": "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" }]],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/send.svelte
function Send($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "send" },
		sanitize_props($$props),
		{
			/**
			* @component @name Send
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTQuNTM2IDIxLjY4NmEuNS41IDAgMCAwIC45MzctLjAyNGw2LjUtMTlhLjQ5Ni40OTYgMCAwIDAtLjYzNS0uNjM1bC0xOSA2LjVhLjUuNSAwIDAgMC0uMDI0LjkzN2w3LjkzIDMuMThhMiAyIDAgMCAxIDEuMTEyIDEuMTF6IiAvPgogIDxwYXRoIGQ9Im0yMS44NTQgMi4xNDctMTAuOTQgMTAuOTM5IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/send
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["path", { "d": "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" }], ["path", { "d": "m21.854 2.147-10.94 10.939" }]],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/share-2.svelte
function Share_2($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "share-2" },
		sanitize_props($$props),
		{
			/**
			* @component @name Share2
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxOCIgY3k9IjUiIHI9IjMiIC8+CiAgPGNpcmNsZSBjeD0iNiIgY3k9IjEyIiByPSIzIiAvPgogIDxjaXJjbGUgY3g9IjE4IiBjeT0iMTkiIHI9IjMiIC8+CiAgPGxpbmUgeDE9IjguNTkiIHgyPSIxNS40MiIgeTE9IjEzLjUxIiB5Mj0iMTcuNDkiIC8+CiAgPGxpbmUgeDE9IjE1LjQxIiB4Mj0iOC41OSIgeTE9IjYuNTEiIHkyPSIxMC40OSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/share-2
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [
				["circle", {
					"cx": "18",
					"cy": "5",
					"r": "3"
				}],
				["circle", {
					"cx": "6",
					"cy": "12",
					"r": "3"
				}],
				["circle", {
					"cx": "18",
					"cy": "19",
					"r": "3"
				}],
				["line", {
					"x1": "8.59",
					"x2": "15.42",
					"y1": "13.51",
					"y2": "17.49"
				}],
				["line", {
					"x1": "15.41",
					"x2": "8.59",
					"y1": "6.51",
					"y2": "10.49"
				}]
			],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/smile-plus.svelte
function Smile_plus($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "smile-plus" },
		sanitize_props($$props),
		{
			/**
			* @component @name SmilePlus
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjIgMTF2MWExMCAxMCAwIDEgMS05LTEwIiAvPgogIDxwYXRoIGQ9Ik04IDE0czEuNSAyIDQgMiA0LTIgNC0yIiAvPgogIDxsaW5lIHgxPSI5IiB4Mj0iOS4wMSIgeTE9IjkiIHkyPSI5IiAvPgogIDxsaW5lIHgxPSIxNSIgeDI9IjE1LjAxIiB5MT0iOSIgeTI9IjkiIC8+CiAgPHBhdGggZD0iTTE2IDVoNiIgLz4KICA8cGF0aCBkPSJNMTkgMnY2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/smile-plus
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [
				["path", { "d": "M22 11v1a10 10 0 1 1-9-10" }],
				["path", { "d": "M8 14s1.5 2 4 2 4-2 4-2" }],
				["line", {
					"x1": "9",
					"x2": "9.01",
					"y1": "9",
					"y2": "9"
				}],
				["line", {
					"x1": "15",
					"x2": "15.01",
					"y1": "9",
					"y2": "9"
				}],
				["path", { "d": "M16 5h6" }],
				["path", { "d": "M19 2v6" }]
			],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/volume-x.svelte
function Volume_x($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "volume-x" },
		sanitize_props($$props),
		{
			/**
			* @component @name VolumeX
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTEgNC43MDJhLjcwNS43MDUgMCAwIDAtMS4yMDMtLjQ5OEw2LjQxMyA3LjU4N0ExLjQgMS40IDAgMCAxIDUuNDE2IDhIM2ExIDEgMCAwIDAtMSAxdjZhMSAxIDAgMCAwIDEgMWgyLjQxNmExLjQgMS40IDAgMCAxIC45OTcuNDEzbDMuMzgzIDMuMzg0QS43MDUuNzA1IDAgMCAwIDExIDE5LjI5OHoiIC8+CiAgPGxpbmUgeDE9IjIyIiB4Mj0iMTYiIHkxPSI5IiB5Mj0iMTUiIC8+CiAgPGxpbmUgeDE9IjE2IiB4Mj0iMjIiIHkxPSI5IiB5Mj0iMTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/volume-x
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [
				["path", { "d": "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }],
				["line", {
					"x1": "22",
					"x2": "16",
					"y1": "9",
					"y2": "15"
				}],
				["line", {
					"x1": "16",
					"x2": "22",
					"y1": "9",
					"y2": "15"
				}]
			],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/triangle-alert.svelte
function Triangle_alert($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "triangle-alert" },
		sanitize_props($$props),
		{
			/**
			* @component @name TriangleAlert
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMjEuNzMgMTgtOC0xNGEyIDIgMCAwIDAtMy40OCAwbC04IDE0QTIgMiAwIDAgMCA0IDIxaDE2YTIgMiAwIDAgMCAxLjczLTMiIC8+CiAgPHBhdGggZD0iTTEyIDl2NCIgLz4KICA8cGF0aCBkPSJNMTIgMTdoLjAxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/triangle-alert
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [
				["path", { "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }],
				["path", { "d": "M12 9v4" }],
				["path", { "d": "M12 17h.01" }]
			],
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				slot($$renderer, $$props, "default", {}, null);
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}
	]));
}
//#endregion
//#region src/lib/sfu-client.ts
/**
* Wachaut SFU Client — wraps mediasoup-client for use in Svelte 5.
*/
var SfuClient = class {
	#socket = null;
	#device;
	#sendTransport = null;
	#recvTransport = null;
	#producer = null;
	#consumers = /* @__PURE__ */ new Map();
	#url;
	#listeners = /* @__PURE__ */ new Map();
	#rtpCapabilities = null;
	#pendingConsumers = [];
	#stream = null;
	constructor(url) {
		this.#url = url;
		this.#device = new mediasoupClient.Device();
	}
	on(event, fn) {
		if (!this.#listeners.has(event)) this.#listeners.set(event, []);
		this.#listeners.get(event).push(fn);
	}
	off(event, fn) {
		const fns = this.#listeners.get(event);
		if (fns) this.#listeners.set(event, fns.filter((f) => f !== fn));
	}
	#emit(event, ...args) {
		this.#listeners.get(event)?.forEach((fn) => fn(...args));
	}
	async joinRoom(roomId, pin, displayName, role) {
		return new Promise((resolve, reject) => {
			this.#socket = io(this.#url, { transports: ["websocket"] });
			this.#socket.on("connect", () => {
				console.log("[sfu] socket connected");
				this.#socket.emit("join-room", {
					roomId,
					pin,
					displayName,
					role
				}, async (response) => {
					if (response.error) {
						reject(new Error(response.error));
						return;
					}
					this.#rtpCapabilities = response.rtpCapabilities;
					await this.#device.load({ routerRtpCapabilities: response.rtpCapabilities });
					console.log("[sfu] device loaded, existing producers:", response.existingProducers?.length || 0);
					this.#emit("connected");
					resolve(response);
				});
			});
			this.#socket.on("disconnect", (reason) => {
				console.log("[sfu] socket disconnected:", reason);
				this.#emit("disconnected", reason);
			});
			this.#socket.on("peer-joined", (data) => {
				this.#emit("peer-joined", data);
			});
			this.#socket.on("peer-left", (data) => {
				this.#emit("peer-left", data);
			});
			this.#socket.on("connect_error", (err) => {
				console.error("[sfu] socket error:", err);
				reject(err);
			});
		});
	}
	async produce(screenStream) {
		if (!this.#device.loaded && this.#rtpCapabilities) await this.#device.load({ routerRtpCapabilities: this.#rtpCapabilities });
		if (!this.#device.loaded) throw new Error("Device not loaded");
		const transportParams = await this.#createTransport("prod");
		this.#sendTransport = this.#device.createSendTransport(transportParams);
		this.#sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
			console.log("[sfu] send transport connect event");
			try {
				this.#socket.emit("connect-transport", {
					transportId: this.#sendTransport.id,
					dtlsParameters
				}, (res) => {
					if (res?.error) {
						console.error("[sfu] send transport connect error:", res.error);
						errback(new Error(res.error));
					} else {
						console.log("[sfu] send transport connected OK");
						callback();
					}
				});
			} catch (err) {
				errback(err);
			}
		});
		this.#sendTransport.on("produce", async ({ kind, rtpParameters, appData }, callback) => {
			callback({ id: (await new Promise((resolve) => {
				this.#socket.emit("produce", {
					transportId: this.#sendTransport.id,
					kind,
					rtpParameters,
					appData
				}, resolve);
			})).id });
		});
		const videoTrack = screenStream.getVideoTracks()[0];
		if (videoTrack) this.#producer = await this.#sendTransport.produce({
			track: videoTrack,
			appData: { mediaTag: "screen-video" },
			encodings: [{
				maxBitrate: 5e6,
				scaleXResolutionDownBy: 1
			}],
			codecOptions: { videoGoogleStartBitrate: 1e6 }
		});
		const audioTrack = screenStream.getAudioTracks()[0];
		if (audioTrack) await this.#sendTransport.produce({
			track: audioTrack,
			appData: { mediaTag: "screen-audio" }
		});
	}
	async consume() {
		if (!this.#device.loaded && this.#rtpCapabilities) await this.#device.load({ routerRtpCapabilities: this.#rtpCapabilities });
		if (!this.#device.loaded) throw new Error("Device not loaded");
		this.#stream = new MediaStream();
		this.#socket.on("new-consumer", async (data) => {
			console.log("[sfu] new-consumer received:", data.kind, data.consumerId);
			if (this.#recvTransport) {
				const consumer = await this.#handleNewConsumer(data);
				if (consumer && this.#stream) {
					this.#stream.addTrack(consumer.track);
					this.#emit("stream-ready", this.#stream);
				}
			} else this.#pendingConsumers.push(data);
		});
		const transportParams = await this.#createTransport("cons");
		this.#recvTransport = this.#device.createRecvTransport(transportParams);
		this.#recvTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
			console.log("[sfu] recv transport connect event");
			try {
				this.#socket.emit("connect-transport", {
					transportId: this.#recvTransport.id,
					dtlsParameters
				}, (res) => {
					if (res?.error) {
						console.error("[sfu] recv transport connect error:", res.error);
						errback(new Error(res.error));
					} else {
						console.log("[sfu] recv transport connected OK");
						callback();
					}
				});
			} catch (err) {
				errback(err);
			}
		});
		const pc = this.#recvTransport._handler?._pc;
		if (pc) {
			pc.oniceconnectionstatechange = () => {
				console.log("[sfu] ICE state:", pc.iceConnectionState);
			};
			pc.onconnectionstatechange = () => {
				console.log("[sfu] PC connection state:", pc.connectionState);
			};
		}
		if (this.#pendingConsumers.length > 0) {
			console.log(`[sfu] Processing ${this.#pendingConsumers.length} pending consumers`);
			for (const data of this.#pendingConsumers) {
				const consumer = await this.#handleNewConsumer(data);
				if (consumer && this.#stream) {
					this.#stream.addTrack(consumer.track);
					this.#emit("stream-ready", this.#stream);
				}
			}
			this.#pendingConsumers = [];
		}
		return this.#stream;
	}
	async #handleNewConsumer(data) {
		if (!this.#recvTransport) return null;
		console.log("[sfu] Creating consumer for", data.kind, "id:", data.consumerId);
		const consumer = await this.#recvTransport.consume({
			id: data.consumerId,
			producerId: data.producerId,
			kind: data.kind,
			rtpParameters: data.rtpParameters
		});
		this.#consumers.set(consumer.id, consumer);
		console.log("[sfu] Consumer created:", consumer.id, "kind:", consumer.kind, "paused:", consumer.paused, "track state:", consumer.track.readyState, "track enabled:", consumer.track.enabled);
		await new Promise((resolve) => {
			this.#socket.emit("resume-consumer", { consumerId: consumer.id }, (res) => {
				console.log("[sfu] Resume result for", consumer.kind, ":", res?.ok ? "OK" : "FAILED");
				resolve();
			});
		});
		console.log("[sfu] Consumer after resume - paused:", consumer.paused);
		return consumer;
	}
	async #createTransport(direction) {
		return new Promise((resolve, reject) => {
			this.#socket.emit("create-transport", { direction }, (res) => {
				if (res?.error) {
					console.error("[sfu] create-transport error:", res.error);
					reject(new Error(res.error));
				} else {
					console.log("[sfu] Transport created, direction:", direction, "iceCandidates:", res.iceCandidates?.length || 0);
					resolve(res);
				}
			});
		});
	}
	stopProducing() {
		if (this.#producer) {
			this.#producer.close();
			this.#socket?.emit("close-producer", { producerId: this.#producer.id });
			this.#producer = null;
		}
	}
	async getStats() {
		if (!this.#recvTransport) return null;
		try {
			const pc = this.#recvTransport._handler?._pc;
			if (pc && typeof pc.getStats === "function") return await pc.getStats();
		} catch (err) {
			console.error("[sfu-client] getStats error:", err);
		}
		return null;
	}
	get isDeviceLoaded() {
		return this.#device.loaded;
	}
	disconnect() {
		this.stopProducing();
		for (const [, consumer] of this.#consumers) consumer.close();
		this.#consumers.clear();
		this.#pendingConsumers = [];
		this.#sendTransport?.close();
		this.#recvTransport?.close();
		this.#socket?.disconnect();
		this.#socket = null;
		this.#stream = null;
		this.#listeners.clear();
	}
};
//#endregion
//#region src/lib/notificationSounds.js
/**
* Web Audio API notification sounds for Wachaut.
* No external files needed — all tones are generated procedurally.
*/
var audioCtx = null;
var NOTIFICATIONS_STORAGE_KEY = "wachaut.notifications.muted";
var NOTIFICATIONS_VOLUME_KEY = "wachaut.notifications.volume";
function getCtx() {
	if (!audioCtx) try {
		audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	} catch {
		return null;
	}
	return audioCtx;
}
function isMuted() {
	try {
		return localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) === "true";
	} catch {
		return false;
	}
}
function getVolume() {
	try {
		const v = localStorage.getItem(NOTIFICATIONS_VOLUME_KEY);
		return v !== null ? parseFloat(v) : .3;
	} catch {
		return .3;
	}
}
/**
* Play a two-tone beep.
* @param {number} freq1 - First frequency (Hz)
* @param {number} freq2 - Second frequency (Hz)
* @param {number} duration - Duration of each tone (seconds)
*/
function playTonePair(freq1, freq2, duration = .08) {
	if (isMuted()) return;
	const ctx = getCtx();
	if (!ctx) return;
	const vol = getVolume();
	const now = ctx.currentTime;
	const osc1 = ctx.createOscillator();
	const gain1 = ctx.createGain();
	osc1.frequency.value = freq1;
	osc1.type = "sine";
	gain1.gain.setValueAtTime(vol * .5, now);
	gain1.gain.exponentialRampToValueAtTime(.001, now + duration);
	osc1.connect(gain1);
	gain1.connect(ctx.destination);
	osc1.start(now);
	osc1.stop(now + duration);
	const osc2 = ctx.createOscillator();
	const gain2 = ctx.createGain();
	osc2.frequency.value = freq2;
	osc2.type = "sine";
	gain2.gain.setValueAtTime(vol * .5, now + duration);
	gain2.gain.exponentialRampToValueAtTime(.001, now + duration * 2);
	osc2.connect(gain2);
	gain2.connect(ctx.destination);
	osc2.start(now + duration);
	osc2.stop(now + duration * 2);
}
/**
* Viewer join — short ascending two-tone beep (high pitch)
*/
function playViewerJoin() {
	playTonePair(880, 1100, .07);
}
/**
* Viewer leave — short descending two-tone beep (lower pitch)
*/
function playViewerLeave() {
	playTonePair(660, 440, .07);
}
/**
* Host muted — single low tone
*/
function playHostMuted() {
	if (isMuted()) return;
	const ctx = getCtx();
	if (!ctx) return;
	const vol = getVolume();
	const now = ctx.currentTime;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.frequency.value = 330;
	osc.type = "sine";
	gain.gain.setValueAtTime(vol * .4, now);
	gain.gain.exponentialRampToValueAtTime(.001, now + .2);
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start(now);
	osc.stop(now + .2);
}
/**
* New chat message — very subtle soft click/tap
*/
function playChatMessage() {
	if (isMuted()) return;
	const ctx = getCtx();
	if (!ctx) return;
	const vol = getVolume();
	const now = ctx.currentTime;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.frequency.value = 1200;
	osc.type = "sine";
	gain.gain.setValueAtTime(vol * .15, now);
	gain.gain.exponentialRampToValueAtTime(.001, now + .04);
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start(now);
	osc.stop(now + .05);
}
//#endregion
export { playViewerLeave as a, Volume_x as c, Send as d, Message_circle as f, Bell_off as h, playViewerJoin as i, Smile_plus as l, Bell as m, playChatMessage as n, SfuClient as o, Maximize as p, playHostMuted as r, Triangle_alert as s, isMuted as t, Share_2 as u };
