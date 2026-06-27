import { i as onDestroy } from "../../../chunks/internal.js";
import { d as sanitize_props, f as slot, h as stringify, j as escape_html, k as attr, n as attr_style, p as spread_props, s as ensure_array_like, t as attr_class } from "../../../chunks/server.js";
import { n as Icon, t as Monitor } from "../../../chunks/monitor.js";
import { a as playViewerLeave, c as Volume_x, d as Send, f as Message_circle, h as Bell_off, i as playViewerJoin, l as Smile_plus, m as Bell, n as playChatMessage, o as SfuClient, p as Maximize, s as Triangle_alert, t as isMuted, u as Share_2 } from "../../../chunks/notificationSounds.js";
import { n as Shield, r as Link_2, t as Users } from "../../../chunks/navigation.js";
import { io } from "socket.io-client";
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/arrow-left.svelte
function Arrow_left($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "arrow-left" },
		sanitize_props($$props),
		{
			/**
			* @component @name ArrowLeft
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTIgMTktNy03IDctNyIgLz4KICA8cGF0aCBkPSJNMTkgMTJINSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/arrow-left
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["path", { "d": "m12 19-7-7 7-7" }], ["path", { "d": "M19 12H5" }]],
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/circle.svelte
function Circle($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "circle" },
		sanitize_props($$props),
		{
			/**
			* @component @name Circle
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/circle
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["circle", {
				"cx": "12",
				"cy": "12",
				"r": "10"
			}]],
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/copy.svelte
function Copy($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "copy" },
		sanitize_props($$props),
		{
			/**
			* @component @name Copy
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHg9IjgiIHk9IjgiIHJ4PSIyIiByeT0iMiIgLz4KICA8cGF0aCBkPSJNNCAxNmMtMS4xIDAtMi0uOS0yLTJWNGMwLTEuMS45LTIgMi0yaDEwYzEuMSAwIDIgLjkgMiAyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/copy
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["rect", {
				"width": "14",
				"height": "14",
				"x": "8",
				"y": "8",
				"rx": "2",
				"ry": "2"
			}], ["path", { "d": "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]],
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/eye.svelte
function Eye($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "eye" },
		sanitize_props($$props),
		{
			/**
			* @component @name Eye
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMi4wNjIgMTIuMzQ4YTEgMSAwIDAgMSAwLS42OTYgMTAuNzUgMTAuNzUgMCAwIDEgMTkuODc2IDAgMSAxIDAgMCAxIDAgLjY5NiAxMC43NSAxMC43NSAwIDAgMS0xOS44NzYgMCIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/eye
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["path", { "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }], ["circle", {
				"cx": "12",
				"cy": "12",
				"r": "3"
			}]],
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/settings.svelte
function Settings($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "settings" },
		sanitize_props($$props),
		{
			/**
			* @component @name Settings
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIuMjIgMmgtLjQ0YTIgMiAwIDAgMC0yIDJ2LjE4YTIgMiAwIDAgMS0xIDEuNzNsLS40My4yNWEyIDIgMCAwIDEtMiAwbC0uMTUtLjA4YTIgMiAwIDAgMC0yLjczLjczbC0uMjIuMzhhMiAyIDAgMCAwIC43MyAyLjczbC4xNS4xYTIgMiAwIDAgMSAxIDEuNzJ2LjUxYTIgMiAwIDAgMS0xIDEuNzRsLS4xNS4wOWEyIDIgMCAwIDAtLjczIDIuNzNsLjIyLjM4YTIgMiAwIDAgMCAyLjczLjczbC4xNS0uMDhhMiAyIDAgMCAxIDIgMGwuNDMuMjVhMiAyIDAgMCAxIDEgMS43M1YyMGEyIDIgMCAwIDAgMiAyaC40NGEyIDIgMCAwIDAgMi0ydi0uMThhMiAyIDAgMCAxIDEtMS43M2wuNDMtLjI1YTIgMiAwIDAgMSAyIDBsLjE1LjA4YTIgMiAwIDAgMCAyLjczLS43M2wuMjItLjM5YTIgMiAwIDAgMC0uNzMtMi43M2wtLjE1LS4wOGEyIDIgMCAwIDEtMS0xLjc0di0uNWEyIDIgMCAwIDEgMS0xLjc0bC4xNS0uMDlhMiAyIDAgMCAwIC43My0yLjczbC0uMjItLjM4YTIgMiAwIDAgMC0yLjczLS43M2wtLjE1LjA4YTIgMiAwIDAgMS0yIDBsLS40My0uMjVhMiAyIDAgMCAxLTEtMS43M1Y0YTIgMiAwIDAgMC0yLTJ6IiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/settings
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["path", { "d": "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }], ["circle", {
				"cx": "12",
				"cy": "12",
				"r": "3"
			}]],
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/square.svelte
function Square($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "square" },
		sanitize_props($$props),
		{
			/**
			* @component @name Square
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/square
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["rect", {
				"width": "18",
				"height": "18",
				"x": "3",
				"y": "3",
				"rx": "2"
			}]],
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/terminal.svelte
function Terminal($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "terminal" },
		sanitize_props($$props),
		{
			/**
			* @component @name Terminal
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cG9seWxpbmUgcG9pbnRzPSI0IDE3IDEwIDExIDQgNSIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIyMCIgeTE9IjE5IiB5Mj0iMTkiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/terminal
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["polyline", { "points": "4 17 10 11 4 5" }], ["line", {
				"x1": "12",
				"x2": "20",
				"y1": "19",
				"y2": "19"
			}]],
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/volume-2.svelte
function Volume_2($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "volume-2" },
		sanitize_props($$props),
		{
			/**
			* @component @name Volume2
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTEgNC43MDJhLjcwNS43MDUgMCAwIDAtMS4yMDMtLjQ5OEw2LjQxMyA3LjU4N0ExLjQgMS40IDAgMCAxIDUuNDE2IDhIM2ExIDEgMCAwIDAtMSAxdjZhMSAxIDAgMCAwIDEgMWgyLjQxNmExLjQgMS40IDAgMCAxIC45OTcuNDEzbDMuMzgzIDMuMzg0QS43MDUuNzA1IDAgMCAwIDExIDE5LjI5OHoiIC8+CiAgPHBhdGggZD0iTTE2IDlhNSA1IDAgMCAxIDAgNiIgLz4KICA8cGF0aCBkPSJNMTkuMzY0IDE4LjM2NGE5IDkgMCAwIDAgMC0xMi43MjgiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/volume-2
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [
				["path", { "d": "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }],
				["path", { "d": "M16 9a5 5 0 0 1 0 6" }],
				["path", { "d": "M19.364 18.364a9 9 0 0 0 0-12.728" }]
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
//#region ../../node_modules/.pnpm/lucide-svelte@0.460.1_svelte@5.56.4_@typescript-eslint+types@8.62.0_/node_modules/lucide-svelte/dist/icons/circle-stop.svelte
function Circle_stop($$renderer, $$props) {
	/**
	* @license lucide-svelte v0.460.1 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	Icon($$renderer, spread_props([
		{ name: "circle-stop" },
		sanitize_props($$props),
		{
			/**
			* @component @name CircleStop
			* @description Lucide SVG icon component, renders SVG Element with children.
			*
			* @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cmVjdCB4PSI5IiB5PSI5IiB3aWR0aD0iNiIgaGVpZ2h0PSI2IiByeD0iMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/circle-stop
			* @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			*
			* @param {Object} props - Lucide icons props and any valid SVG attribute
			* @returns {FunctionalComponent} Svelte component
			*
			*/
			iconNode: [["circle", {
				"cx": "12",
				"cy": "12",
				"r": "10"
			}], ["rect", {
				"x": "9",
				"y": "9",
				"width": "6",
				"height": "6",
				"rx": "1"
			}]],
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
//#region src/routes/room/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let socket = null;
		let connected = false;
		let isSharing = false;
		let isMuted$1 = false;
		let viewerCount = 0;
		let error = "";
		let loading = true;
		let peers = /* @__PURE__ */ new Map();
		let localStream = null;
		let sfuClient = null;
		let chatMessages = [];
		let chatInput = "";
		let activeReactions = /* @__PURE__ */ new Map();
		let reactionIdCounter = 0;
		let tabHidden = false;
		function handleVisibilityChange() {
			tabHidden = document.hidden;
			if (tabHidden) {
				if (qualityMonitorInterval) {
					clearInterval(qualityMonitorInterval);
					qualityMonitorInterval = null;
				}
			} else if (isSharing && autoAdaptQuality) startQualityMonitor();
		}
		if (typeof document !== "undefined") document.addEventListener("visibilitychange", handleVisibilityChange);
		function cleanup() {
			if (celebrationTimeout) clearTimeout(celebrationTimeout);
			stopSharing();
			if (sfuClient) {
				sfuClient.disconnect();
				sfuClient = null;
			}
			if (socket) {
				socket.emit("host:close-room", { roomId });
				socket.disconnect();
			}
			if (typeof document !== "undefined") document.removeEventListener("visibilitychange", handleVisibilityChange);
			if (typeof window !== "undefined") window.removeEventListener("beforeunload", cleanup);
		}
		onDestroy(cleanup);
		if (typeof window !== "undefined") window.addEventListener("beforeunload", cleanup);
		[
			{
				label: "Reacciones",
				emojis: [
					"👍",
					"👎",
					"❤️",
					"🔥",
					"👏",
					"😂",
					"🎉",
					"😮",
					"😢",
					"😡"
				]
			},
			{
				label: "Gestos",
				emojis: [
					"👋",
					"✌️",
					"💪",
					"🙏"
				]
			},
			{
				label: "Objetos",
				emojis: [
					"⭐",
					"💯",
					"🎯",
					"💡",
					"🎵"
				]
			},
			{
				label: "Comida",
				emojis: [
					"☕",
					"🍕",
					"🎂"
				]
			}
		].flatMap((c) => c.emojis);
		const HOST_FAVORITES_KEY = "wachaut.host.favorites";
		let favoriteEmojis = loadHostFavorites();
		function loadHostFavorites() {
			try {
				const stored = JSON.parse(localStorage.getItem(HOST_FAVORITES_KEY));
				if (Array.isArray(stored) && stored.length >= 5) return stored.slice(0, 5);
			} catch {}
			return [
				"👍",
				"❤️",
				"🔥",
				"👏",
				"😂"
			];
		}
		let notificationsMuted = isMuted();
		let celebrationTimeout = null;
		let showFirstViewerCelebration = false;
		let confettiParticles = [];
		let isRecording = false;
		let recordingDuration = 0;
		let recordingInterval = null;
		let qualityPreset = "normal";
		const presets = {
			low: {
				label: "Liviano",
				resolution: {
					width: 1280,
					height: 720
				},
				fps: 15,
				bitrate: 1e6,
				desc: "Ideal para conexiones lentas"
			},
			normal: {
				label: "Normal",
				resolution: {
					width: 1920,
					height: 1080
				},
				fps: 30,
				bitrate: 25e5,
				desc: "Uso general"
			},
			high: {
				label: "Alta calidad",
				resolution: {
					width: 1920,
					height: 1080
				},
				fps: 60,
				bitrate: 5e6,
				desc: "Gaming y diseño"
			}
		};
		let autoAdaptQuality = true;
		let qualityMonitorInterval = null;
		const roomId = crypto.randomUUID();
		function generatePin() {
			const arr = /* @__PURE__ */ new Uint32Array(1);
			crypto.getRandomValues(arr);
			return String(1e5 + arr[0] % 9e5);
		}
		const pin = generatePin();
		const roomUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}`;
		function addReaction(emoji) {
			const id = ++reactionIdCounter;
			const idx = reactionIdCounter % 4;
			const newReaction = {
				id,
				emoji,
				x: Math.random() * 70 + 10,
				bottom: [
					40,
					120,
					200,
					80
				][idx],
				fontSize: [
					1.6,
					2,
					2.5,
					1.8
				][idx],
				xOffset: [
					"0px",
					"-20px",
					"15px",
					"-10px"
				][idx],
				rotation: [
					"-12deg",
					"8deg",
					"-5deg",
					"15deg"
				][idx],
				delay: Math.random() * .2,
				duration: 2.5 + Math.random() * 1,
				createdAt: Date.now()
			};
			activeReactions = new Map(activeReactions).set(id, newReaction);
			setTimeout(() => {
				activeReactions = new Map(activeReactions);
				activeReactions.delete(id);
			}, (newReaction.duration + newReaction.delay) * 1e3 + 200);
		}
		function formatDuration(s) {
			return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
		}
		function stopRecording() {
			isRecording = false;
			clearInterval(recordingInterval);
			recordingInterval = null;
		}
		function addSystemMessage(text) {
			chatMessages = [...chatMessages, {
				id: `system-${Date.now()}-${Math.random()}`,
				sender: "Sistema",
				text,
				timestamp: /* @__PURE__ */ new Date()
			}];
		}
		function initSocket() {
			socket = io("wss://api-wachaut.billytech.es", { transports: ["websocket"] });
			socket.on("connect_error", (err) => {
				error = "No se pudo conectar al servidor. Verifica tu conexión.";
				loading = false;
				setTimeout(() => {
					error = "";
				}, 5e3);
			});
			socket.on("connect", () => {
				connected = true;
				socket.emit("host:create-room", {
					roomId,
					pin
				});
				sfuClient = new SfuClient("wss://sfu-wachaut.billytech.es");
				sfuClient.on("error", (msg) => {
					console.error("[sfu]", msg);
				});
				sfuClient.on("peer-joined", (data) => {
					console.log("[sfu] peer-joined:", data);
				});
				sfuClient.on("peer-left", (data) => {
					console.log("[sfu] peer-left:", data);
				});
				sfuClient.joinRoom(roomId, pin, "Anfitrión", "host").then(() => {
					console.log("[sfu] joined room");
				}).catch((err) => {
					console.error("[sfu] join failed:", err);
				});
				setTimeout(() => {
					loading = false;
				}, 800);
			});
			socket.on("disconnect", () => {
				connected = false;
			});
			socket.on("error", (err) => {
				error = typeof err === "string" ? err : err.message || "Error de conexión";
				setTimeout(() => {
					error = "";
				}, 5e3);
			});
			socket.on("viewer:joined", (data) => {
				const wasEmpty = viewerCount === 0;
				viewerCount = viewerCount + 1;
				if (data.username) addSystemMessage(`${data.username} se unio a la sala.`);
				try {
					playViewerJoin();
				} catch {}
				if (data.viewerId) createPeerConnection(data.viewerId);
				if (wasEmpty) triggerFirstViewerCelebration();
			});
			socket.on("viewer:left", (data) => {
				viewerCount = Math.max(0, viewerCount - 1);
				if (data.username) addSystemMessage(`${data.username} salio de la sala.`);
				try {
					playViewerLeave();
				} catch {}
				if (data.viewerId) peers.delete(data.viewerId);
			});
			socket.on("chat:history", (data) => {
				if (data?.messages) chatMessages = data.messages.map((m) => ({
					...m,
					timestamp: new Date(m.timestamp || Date.now())
				}));
			});
			socket.on("chat:message", (msg) => {
				chatMessages = [...chatMessages, {
					...msg,
					timestamp: new Date(msg.timestamp || Date.now())
				}];
				try {
					playChatMessage();
				} catch {}
			});
			socket.on("reaction:receive", (data) => {
				addReaction(data.emoji);
			});
			socket.on("host:viewers-list", (data) => {
				if (data?.viewers) data.viewers;
			});
			socket.on("host:kick-failed", (data) => {
				addSystemMessage(data?.message || "No se pudo expulsar al espectador.");
			});
		}
		function createPeerConnection(viewerId) {
			if (peers.has(viewerId)) return;
			peers.set(viewerId, null);
		}
		function stopSharing() {
			if (isRecording) stopRecording();
			stopQualityMonitor();
			if (localStream) {
				localStream.getTracks().forEach((t) => t.stop());
				localStream = null;
			}
			isSharing = false;
			isMuted$1 = false;
			peers = /* @__PURE__ */ new Map();
			if (sfuClient) {
				sfuClient.stopProducing();
				sfuClient.disconnect();
				sfuClient = null;
			}
			if (socket && connected) socket.emit("host:stop-sharing", { roomId });
		}
		async function checkConnectionQuality() {}
		function startQualityMonitor() {
			if (qualityMonitorInterval) return;
			qualityMonitorInterval = setInterval(checkConnectionQuality, 1e3);
		}
		function stopQualityMonitor() {
			if (qualityMonitorInterval) {
				clearInterval(qualityMonitorInterval);
				qualityMonitorInterval = null;
			}
		}
		function triggerFirstViewerCelebration() {
			showFirstViewerCelebration = true;
			const colors = [
				"#ef4444",
				"#f59e0b",
				"#10b981",
				"#3b82f6",
				"#8b5cf6",
				"#ec4899",
				"#06b6d4"
			];
			const emojis = [
				"🎉",
				"🎊",
				"✨",
				"🥳",
				"👋",
				"🙌"
			];
			const particles = [];
			for (let i = 0; i < 40; i++) particles.push({
				id: i,
				x: Math.random() * 100,
				delay: Math.random() * .5,
				duration: 1.5 + Math.random() * 1.5,
				rotation: Math.random() * 360,
				size: 6 + Math.random() * 10,
				color: colors[Math.floor(Math.random() * colors.length)],
				type: Math.random() > .3 ? "rect" : "emoji",
				emoji: emojis[Math.floor(Math.random() * emojis.length)],
				borderRadius: Math.random() > .5 ? "50%" : "2px"
			});
			confettiParticles = particles;
			celebrationTimeout = setTimeout(() => {
				showFirstViewerCelebration = false;
				confettiParticles = [];
			}, 3500);
		}
		initSocket();
		if (loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm transition-opacity duration-500 svelte-ek3c68"><div class="text-center svelte-ek3c68"><div class="relative mb-6 svelte-ek3c68"><div class="w-16 h-16 border-4 border-slate-600 border-t-red-500 rounded-full animate-spin mx-auto svelte-ek3c68"></div> `);
			Eye($$renderer, { class: "w-7 h-7 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" });
			$$renderer.push(`<!----></div> <h2 class="text-xl font-semibold text-white mb-2 svelte-ek3c68">Preparando sala...</h2> <p class="text-slate-400 text-sm svelte-ek3c68">Creando sala segura para tu transmisión</p></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (error) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg animate-[fadeIn_0.3s_ease] svelte-ek3c68">`);
			Triangle_alert($$renderer, { class: "w-4 h-4" });
			$$renderer.push(`<!----> <span class="text-sm font-medium svelte-ek3c68">${escape_html(error)}</span></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (showFirstViewerCelebration) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="fixed inset-0 z-[60] pointer-events-none animate-[fadeIn_0.3s_ease] svelte-ek3c68"><!--[-->`);
			const each_array = ensure_array_like(confettiParticles);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let p = each_array[$$index];
				$$renderer.push(`<div class="absolute svelte-ek3c68"${attr_style(` left: ${stringify(p.x)}%; top: -20px; width: ${stringify(p.size)}px; height: ${stringify(p.size)}px; background: ${stringify(p.type === "rect" ? p.color : "transparent")}; border-radius: ${stringify(p.borderRadius)}; animation: confettiFall ${stringify(p.duration)}s ease-in ${stringify(p.delay)}s forwards; opacity: 0; transform: rotate(${stringify(p.rotation)}deg); font-size: ${stringify(p.size * 1.5)}px; line-height: 1; `)}>`);
				if (p.type === "emoji") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`${escape_html(p.emoji)}`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--> <div class="fixed inset-0 flex items-center justify-center svelte-ek3c68"><div class="bg-white/95 backdrop-blur-md rounded-3xl px-8 py-6 shadow-2xl border border-slate-200 text-center animate-[celebrationPop_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)] svelte-ek3c68"><div class="text-5xl mb-3 svelte-ek3c68">🎉</div> <h2 class="text-xl font-bold text-slate-800 mb-1 svelte-ek3c68">¡Primer espectador!</h2> <p class="text-sm text-slate-500 svelte-ek3c68">Alguien está viendo tu pantalla</p> <div class="mt-3 flex items-center justify-center gap-1.5 svelte-ek3c68"><div class="w-2 h-2 bg-green-500 rounded-full animate-pulse svelte-ek3c68"></div> <span class="text-xs text-green-600 font-medium svelte-ek3c68">En vivo</span></div></div></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="min-h-screen bg-slate-50 flex flex-col svelte-ek3c68"><header class="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 svelte-ek3c68"><div class="flex items-center gap-3 svelte-ek3c68"><button class="p-2 hover:bg-slate-100 rounded-xl active:scale-95 transition-all svelte-ek3c68" title="Volver">`);
		Arrow_left($$renderer, { class: "w-5 h-5 text-slate-600" });
		$$renderer.push(`<!----></button> <div class="flex items-center gap-2 svelte-ek3c68">`);
		Monitor($$renderer, { class: "w-6 h-6 text-slate-800" });
		$$renderer.push(`<!----> <span class="font-bold text-slate-800 text-lg tracking-tight svelte-ek3c68">Wachaut</span></div></div> <div class="flex items-center gap-3 svelte-ek3c68">`);
		if (isSharing) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full animate-[fadeIn_0.3s_ease] svelte-ek3c68"><div class="w-2 h-2 bg-red-500 rounded-full animate-pulse svelte-ek3c68"></div> <span class="text-red-600 text-sm font-semibold svelte-ek3c68">EN VIVO</span></div> <div class="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-full svelte-ek3c68"${attr("title", "Conexión estable")}><div${attr_class(`w-2 h-2 rounded-full bg-green-500`, "svelte-ek3c68")}></div> <span${attr_class(`text-xs font-medium text-green-600`, "svelte-ek3c68")}>${escape_html("Estable")}</span></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 active:scale-95 transition-all svelte-ek3c68" title="Ver espectadores">`);
		Users($$renderer, { class: "w-4 h-4 text-slate-500" });
		$$renderer.push(`<!----> <span class="text-slate-700 text-sm font-medium svelte-ek3c68">${escape_html(viewerCount)}</span></button> <button class="p-2 hover:bg-slate-100 rounded-xl active:scale-95 transition-all svelte-ek3c68"${attr("title", notificationsMuted ? "Activar notificaciones" : "Silenciar notificaciones")}>`);
		if (notificationsMuted) {
			$$renderer.push("<!--[0-->");
			Bell_off($$renderer, { class: "w-5 h-5 text-slate-400" });
		} else {
			$$renderer.push("<!--[-1-->");
			Bell($$renderer, { class: "w-5 h-5 text-slate-600" });
		}
		$$renderer.push(`<!--]--></button> <button class="relative p-2 hover:bg-slate-100 rounded-xl active:scale-95 transition-all svelte-ek3c68" title="Chat">`);
		Message_circle($$renderer, { class: "w-5 h-5 text-slate-600" });
		$$renderer.push(`<!----> `);
		if (chatMessages.length > 0 && true) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center svelte-ek3c68"><span class="text-[10px] text-white font-bold svelte-ek3c68">${escape_html(chatMessages.length > 9 ? "9+" : chatMessages.length)}</span></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></button></div></header> <div class="flex-1 flex overflow-hidden svelte-ek3c68"><div class="flex-1 relative svelte-ek3c68" id="video-container">`);
		if (isSharing && localStream) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<video autoplay="" playsinline="" muted="" class="w-full h-full object-contain bg-slate-900 svelte-ek3c68"></video>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="w-full h-full flex flex-col items-center justify-center bg-slate-100 svelte-ek3c68"><div class="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 svelte-ek3c68">`);
			Monitor($$renderer, { class: "w-10 h-10 text-slate-400" });
			$$renderer.push(`<!----></div> <h3 class="text-slate-600 font-semibold mb-1 svelte-ek3c68">Sin transmisión</h3> <p class="text-slate-400 text-sm svelte-ek3c68">Comparte tu pantalla para comenzar</p></div>`);
		}
		$$renderer.push(`<!--]--> `);
		if (isSharing) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 svelte-ek3c68"><button class="p-2.5 rounded-xl hover:bg-white/20 active:scale-95 transition-all svelte-ek3c68"${attr("title", isMuted$1 ? "Activar audio" : "Silenciar audio")}>`);
			if (isMuted$1) {
				$$renderer.push("<!--[0-->");
				Volume_x($$renderer, { class: "w-5 h-5 text-red-400" });
			} else {
				$$renderer.push("<!--[-1-->");
				Volume_2($$renderer, { class: "w-5 h-5 text-white" });
			}
			$$renderer.push(`<!--]--></button> <button class="p-2.5 rounded-xl hover:bg-white/20 active:scale-95 transition-all svelte-ek3c68"${attr("title", "Pantalla completa")}>`);
			$$renderer.push("<!--[-1-->");
			Maximize($$renderer, { class: "w-5 h-5 text-white" });
			$$renderer.push(`<!--]--></button> `);
			if (isRecording) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button class="p-2.5 bg-red-500/80 rounded-xl hover:bg-red-500 active:scale-95 transition-all flex items-center gap-1.5 svelte-ek3c68" title="Detener grabación"><div class="w-2.5 h-2.5 bg-red-400 rounded-full animate-[pulseRecord_1s_ease-in-out_infinite] svelte-ek3c68"></div> <span class="text-red-300 text-xs font-medium svelte-ek3c68">${escape_html(formatDuration(recordingDuration))}</span></button>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<button class="p-2.5 rounded-xl hover:bg-white/20 active:scale-95 transition-all svelte-ek3c68" title="Grabar sesión">`);
				Circle($$renderer, { class: "w-5 h-5 text-red-400" });
				$$renderer.push(`<!----></button>`);
			}
			$$renderer.push(`<!--]--> <button class="p-2.5 bg-red-500/80 rounded-xl hover:bg-red-500 active:scale-95 transition-all svelte-ek3c68" title="Detener compartición">`);
			Circle_stop($$renderer, { class: "w-5 h-5 text-white" });
			$$renderer.push(`<!----></button></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <!--[-->`);
		const each_array_2 = ensure_array_like([...activeReactions.values()]);
		for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
			let reaction = each_array_2[$$index_2];
			$$renderer.push(`<div class="absolute text-4xl pointer-events-none select-none z-10 svelte-ek3c68"${attr_style("", {
				left: `${stringify(reaction.x)}%`,
				bottom: `${stringify(reaction.bottom)}px`,
				"font-size": `${stringify(reaction.fontSize)}rem`,
				transform: `translateX(${stringify(reaction.xOffset)}) rotate(${stringify(reaction.rotation)})`,
				animation: `floatUp ${stringify(reaction.duration)}s ease-out ${stringify(reaction.delay)}s both`
			})}>${escape_html(reaction.emoji)}</div>`);
		}
		$$renderer.push(`<!--]--></div> <aside class="w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden svelte-ek3c68"><div class="p-4 border-b border-slate-100 space-y-3 svelte-ek3c68"><h3 class="font-semibold text-slate-800 text-sm uppercase tracking-wider svelte-ek3c68">Información de sala</h3> <div class="bg-slate-50 rounded-xl p-3 svelte-ek3c68"><div class="flex items-center justify-between mb-1 svelte-ek3c68"><span class="text-xs text-slate-500 font-medium svelte-ek3c68">PIN de acceso</span> <button class="p-1 hover:bg-slate-200 rounded-lg active:scale-95 transition-all svelte-ek3c68" title="Copiar PIN">`);
		$$renderer.push("<!--[-1-->");
		Copy($$renderer, { class: "w-3.5 h-3.5 text-slate-400" });
		$$renderer.push(`<!--]--></button></div> <p class="text-2xl font-mono font-bold text-slate-800 tracking-[0.2em] svelte-ek3c68">${escape_html(pin)}</p></div> <div class="bg-slate-50 rounded-xl p-3 svelte-ek3c68"><div class="flex items-center justify-between mb-1 svelte-ek3c68"><span class="text-xs text-slate-500 font-medium svelte-ek3c68">Enlace de sala</span> <button class="p-1 hover:bg-slate-200 rounded-lg active:scale-95 transition-all svelte-ek3c68" title="Copiar enlace">`);
		$$renderer.push("<!--[-1-->");
		Link_2($$renderer, { class: "w-3.5 h-3.5 text-slate-400" });
		$$renderer.push(`<!--]--></button></div> <p class="text-xs text-slate-600 truncate font-mono svelte-ek3c68">${escape_html(roomUrl)}</p></div></div> <div class="p-4 border-b border-slate-100 space-y-2 svelte-ek3c68">`);
		if (!isSharing) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 active:scale-95 transition-all svelte-ek3c68">`);
			Settings($$renderer, { class: "w-4 h-4" });
			$$renderer.push(`<!----> Configurar calidad <span class="text-xs text-slate-400 ml-auto svelte-ek3c68">${escape_html(presets[qualityPreset].label)}</span></button> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <button class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl font-medium text-sm hover:bg-slate-700 active:scale-95 transition-all svelte-ek3c68">`);
			Share_2($$renderer, { class: "w-4 h-4" });
			$$renderer.push(`<!----> Compartir pantalla</button>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<button class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600 active:scale-95 transition-all svelte-ek3c68">`);
			Circle_stop($$renderer, { class: "w-4 h-4" });
			$$renderer.push(`<!----> Detener transmisión</button>`);
		}
		$$renderer.push(`<!--]--> `);
		if (isSharing) {
			$$renderer.push("<!--[0-->");
			if (isRecording) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600 active:scale-95 transition-all svelte-ek3c68">`);
				Square($$renderer, { class: "w-4 h-4" });
				$$renderer.push(`<!----> <div class="w-2 h-2 bg-white rounded-full animate-[pulseRecord_1s_ease-in-out_infinite] svelte-ek3c68"></div> Detener grabación <span class="text-red-200 text-xs svelte-ek3c68">${escape_html(formatDuration(recordingDuration))}</span></button>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<button class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 active:scale-95 transition-all svelte-ek3c68">`);
				Circle($$renderer, { class: "w-4 h-4 text-red-500" });
				$$renderer.push(`<!----> Grabar sesión</button>`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (isSharing) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="relative pt-2 svelte-ek3c68"><div class="flex items-center justify-center gap-2 svelte-ek3c68"><!--[-->`);
			const each_array_4 = ensure_array_like(favoriteEmojis);
			for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
				let emoji = each_array_4[$$index_4];
				$$renderer.push(`<button class="w-10 h-10 flex items-center justify-center text-xl bg-slate-100 rounded-xl hover:bg-slate-200 active:scale-90 transition-all svelte-ek3c68" title="Enviar reacción">${escape_html(emoji)}</button>`);
			}
			$$renderer.push(`<!--]--> <button${attr_class(`w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-200 active:scale-90 transition-all bg-slate-100 text-slate-500`, "svelte-ek3c68")} title="Más emojis">`);
			Smile_plus($$renderer, { class: "w-5 h-5" });
			$$renderer.push(`<!----></button></div> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-200 active:scale-95 transition-all svelte-ek3c68">`);
		Arrow_left($$renderer, { class: "w-4 h-4" });
		$$renderer.push(`<!----> Cerrar sala</button></div> <div class="flex-1 flex flex-col overflow-hidden min-h-0 svelte-ek3c68"><div class="px-4 py-3 flex items-center justify-between border-b border-slate-100 svelte-ek3c68"><div class="flex items-center gap-2 svelte-ek3c68">`);
		Message_circle($$renderer, { class: "w-4 h-4 text-slate-500" });
		$$renderer.push(`<!----> <span class="text-sm font-semibold text-slate-700 svelte-ek3c68">Chat</span> <span class="text-xs text-slate-400 svelte-ek3c68">(${escape_html(chatMessages.length)})</span></div> <div class="flex items-center gap-1 svelte-ek3c68">`);
		Terminal($$renderer, { class: "w-3 h-3 text-slate-400" });
		$$renderer.push(`<!----> <span class="text-[10px] text-slate-400 svelte-ek3c68">/help</span></div></div> <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 svelte-ek3c68">`);
		if (chatMessages.length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex flex-col items-center justify-center h-full text-center py-8 svelte-ek3c68">`);
			Message_circle($$renderer, { class: "w-8 h-8 text-slate-300 mb-2" });
			$$renderer.push(`<!----> <p class="text-slate-400 text-sm svelte-ek3c68">Aún no hay mensajes</p> <p class="text-slate-300 text-xs mt-1 svelte-ek3c68">Los mensajes de los espectadores aparecerán aquí</p></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--[-->`);
			const each_array_7 = ensure_array_like(chatMessages);
			for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
				let msg = each_array_7[$$index_7];
				$$renderer.push(`<div${attr_class(`flex flex-col ${msg.sender === "Anfitrión" ? "items-end" : msg.sender === "Sistema" ? "items-center" : "items-start"}`, "svelte-ek3c68")}><div class="flex items-center gap-1.5 mb-0.5 svelte-ek3c68">`);
				if (msg.sender === "Sistema") {
					$$renderer.push("<!--[0-->");
					Shield($$renderer, { class: "w-3 h-3 text-slate-400" });
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <span${attr_class(`text-[10px] font-semibold ${msg.sender === "Anfitrión" ? "text-slate-600" : msg.sender === "Sistema" ? "text-slate-400" : "text-blue-500"}`, "svelte-ek3c68")}>${escape_html(msg.sender)}</span> <span class="text-[10px] text-slate-300 svelte-ek3c68">${escape_html(msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString("es-ES", {
					hour: "2-digit",
					minute: "2-digit"
				}) : "")}</span></div> <div${attr_class(`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${msg.sender === "Anfitrión" ? "bg-slate-800 text-white rounded-br-md" : msg.sender === "Sistema" ? "bg-slate-100 text-slate-500 text-xs italic rounded-xl" : "bg-slate-100 text-slate-700 rounded-bl-md"}`, "svelte-ek3c68")}>${escape_html(msg.text)}</div></div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div> <div class="p-3 border-t border-slate-100 svelte-ek3c68"><div class="flex items-center gap-2 svelte-ek3c68"><input type="text"${attr("value", chatInput)} placeholder="Escribe un mensaje o /comando..." maxlength="500" class="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all svelte-ek3c68"/> <button${attr("disabled", !chatInput.trim(), true)} class="p-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed svelte-ek3c68" title="Enviar mensaje">`);
		Send($$renderer, { class: "w-4 h-4" });
		$$renderer.push(`<!----></button></div> <div class="flex items-center justify-between mt-1.5 svelte-ek3c68"><span class="text-[10px] text-slate-400 svelte-ek3c68">${escape_html(0)}/500</span> <span class="text-[10px] text-slate-400 svelte-ek3c68">/help para comandos</span></div></div></div></aside></div></div>`);
	});
}
//#endregion
export { _page as default };
