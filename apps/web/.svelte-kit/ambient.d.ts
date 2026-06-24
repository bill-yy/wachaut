
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const USERNAME: string;
	export const ComSpec: string;
	export const CHROME_CRASHPAD_PIPE_NAME: string;
	export const npm_config_node_gyp: string;
	export const npm_package_scripts_check: string;
	export const npm_execpath: string;
	export const NO_PROXY: string;
	export const NODE_ENV: string;
	export const ALLUSERSPROFILE: string;
	export const APPDATA: string;
	export const CommonProgramFiles: string;
	export const npm_package_devDependencies_tailwindcss: string;
	export const CommonProgramW6432: string;
	export const COMPUTERNAME: string;
	export const DriverData: string;
	export const npm_package_devDependencies_autoprefixer: string;
	export const EFC_3552_1592913036: string;
	export const npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
	export const EFC_3552_4126798990: string;
	export const HOMEPATH: string;
	export const npm_package_devDependencies_vite: string;
	export const HERMES_GIT_BASH_PATH: string;
	export const HERMES_HOME: string;
	export const npm_package_dependencies__wachaut_shared_types: string;
	export const HOME: string;
	export const ProgramFiles: string;
	export const npm_config_recursive: string;
	export const npm_package_devDependencies_typescript_eslint: string;
	export const HOMEDRIVE: string;
	export const npm_lifecycle_event: string;
	export const Path: string;
	export const OPENCODE_CLIENT: string;
	export const INIT_CWD: string;
	export const LOCALAPPDATA: string;
	export const LOGONSERVER: string;
	export const NODE: string;
	export const npm_package_private: string;
	export const npm_package_name: string;
	export const NODE_PATH: string;
	export const npm_package_dependencies__sveltejs_adapter_static: string;
	export const npm_command: string;
	export const npm_config_frozen_lockfile: string;
	export const npm_package_type: string;
	export const npm_config_manage_package_manager_versions: string;
	export const npm_config_only_built_dependencies: string;
	export const npm_package_scripts_build: string;
	export const PATHEXT: string;
	export const npm_config_registry: string;
	export const npm_config_user_agent: string;
	export const npm_package_scripts_check_watch: string;
	export const npm_package_devDependencies_svelte_check: string;
	export const npm_package_devDependencies_lucide_svelte: string;
	export const npm_lifecycle_script: string;
	export const npm_node_execpath: string;
	export const npm_package_dependencies_socket_io_client: string;
	export const npm_package_dependencies_svelte: string;
	export const npm_package_devDependencies__sveltejs_adapter_node: string;
	export const npm_package_dependencies_yaml: string;
	export const npm_package_devDependencies_eslint: string;
	export const USERPROFILE: string;
	export const npm_package_devDependencies_eslint_config_prettier: string;
	export const npm_package_devDependencies_eslint_plugin_svelte: string;
	export const USERDOMAIN_ROAMINGPROFILE: string;
	export const npm_package_devDependencies_globals: string;
	export const npm_package_devDependencies_prettier: string;
	export const npm_package_devDependencies_prettier_plugin_svelte: string;
	export const npm_package_devDependencies_prettier_plugin_tailwindcss: string;
	export const npm_package_devDependencies_typescript: string;
	export const npm_package_devDependencies__sveltejs_kit: string;
	export const npm_package_devDependencies__tailwindcss_vite: string;
	export const npm_package_scripts_typecheck: string;
	export const npm_package_devDependencies__types_eslint: string;
	export const npm_package_scripts_dev: string;
	export const npm_package_scripts_format: string;
	export const npm_package_scripts_lint: string;
	export const npm_package_scripts_preview: string;
	export const npm_package_version: string;
	export const NUMBER_OF_PROCESSORS: string;
	export const OneDrive: string;
	export const OPENCODE_DISABLE_EMBEDDED_WEB_UI: string;
	export const OPENCODE_EXPERIMENTAL_FILEWATCHER: string;
	export const OPENCODE_EXPERIMENTAL_ICON_DISCOVERY: string;
	export const POWERSHELL_TELEMETRY_OPTOUT: string;
	export const OPENCODE_SERVER_PASSWORD: string;
	export const OPENCODE_SERVER_USERNAME: string;
	export const OS: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const PROCESSOR_ARCHITECTURE: string;
	export const PROCESSOR_IDENTIFIER: string;
	export const PROCESSOR_LEVEL: string;
	export const PROCESSOR_REVISION: string;
	export const ProgramData: string;
	export const ProgramW6432: string;
	export const PROMPT: string;
	export const PSModulePath: string;
	export const PUBLIC: string;
	export const SESSIONNAME: string;
	export const SystemDrive: string;
	export const SystemRoot: string;
	export const TEMP: string;
	export const TMP: string;
	export const USERDOMAIN: string;
	export const windir: string;
	export const XDG_STATE_HOME: string;
	export const SVELTEKIT_FORK: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		USERNAME: string;
		ComSpec: string;
		CHROME_CRASHPAD_PIPE_NAME: string;
		npm_config_node_gyp: string;
		npm_package_scripts_check: string;
		npm_execpath: string;
		NO_PROXY: string;
		NODE_ENV: string;
		ALLUSERSPROFILE: string;
		APPDATA: string;
		CommonProgramFiles: string;
		npm_package_devDependencies_tailwindcss: string;
		CommonProgramW6432: string;
		COMPUTERNAME: string;
		DriverData: string;
		npm_package_devDependencies_autoprefixer: string;
		EFC_3552_1592913036: string;
		npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
		EFC_3552_4126798990: string;
		HOMEPATH: string;
		npm_package_devDependencies_vite: string;
		HERMES_GIT_BASH_PATH: string;
		HERMES_HOME: string;
		npm_package_dependencies__wachaut_shared_types: string;
		HOME: string;
		ProgramFiles: string;
		npm_config_recursive: string;
		npm_package_devDependencies_typescript_eslint: string;
		HOMEDRIVE: string;
		npm_lifecycle_event: string;
		Path: string;
		OPENCODE_CLIENT: string;
		INIT_CWD: string;
		LOCALAPPDATA: string;
		LOGONSERVER: string;
		NODE: string;
		npm_package_private: string;
		npm_package_name: string;
		NODE_PATH: string;
		npm_package_dependencies__sveltejs_adapter_static: string;
		npm_command: string;
		npm_config_frozen_lockfile: string;
		npm_package_type: string;
		npm_config_manage_package_manager_versions: string;
		npm_config_only_built_dependencies: string;
		npm_package_scripts_build: string;
		PATHEXT: string;
		npm_config_registry: string;
		npm_config_user_agent: string;
		npm_package_scripts_check_watch: string;
		npm_package_devDependencies_svelte_check: string;
		npm_package_devDependencies_lucide_svelte: string;
		npm_lifecycle_script: string;
		npm_node_execpath: string;
		npm_package_dependencies_socket_io_client: string;
		npm_package_dependencies_svelte: string;
		npm_package_devDependencies__sveltejs_adapter_node: string;
		npm_package_dependencies_yaml: string;
		npm_package_devDependencies_eslint: string;
		USERPROFILE: string;
		npm_package_devDependencies_eslint_config_prettier: string;
		npm_package_devDependencies_eslint_plugin_svelte: string;
		USERDOMAIN_ROAMINGPROFILE: string;
		npm_package_devDependencies_globals: string;
		npm_package_devDependencies_prettier: string;
		npm_package_devDependencies_prettier_plugin_svelte: string;
		npm_package_devDependencies_prettier_plugin_tailwindcss: string;
		npm_package_devDependencies_typescript: string;
		npm_package_devDependencies__sveltejs_kit: string;
		npm_package_devDependencies__tailwindcss_vite: string;
		npm_package_scripts_typecheck: string;
		npm_package_devDependencies__types_eslint: string;
		npm_package_scripts_dev: string;
		npm_package_scripts_format: string;
		npm_package_scripts_lint: string;
		npm_package_scripts_preview: string;
		npm_package_version: string;
		NUMBER_OF_PROCESSORS: string;
		OneDrive: string;
		OPENCODE_DISABLE_EMBEDDED_WEB_UI: string;
		OPENCODE_EXPERIMENTAL_FILEWATCHER: string;
		OPENCODE_EXPERIMENTAL_ICON_DISCOVERY: string;
		POWERSHELL_TELEMETRY_OPTOUT: string;
		OPENCODE_SERVER_PASSWORD: string;
		OPENCODE_SERVER_USERNAME: string;
		OS: string;
		PNPM_SCRIPT_SRC_DIR: string;
		PROCESSOR_ARCHITECTURE: string;
		PROCESSOR_IDENTIFIER: string;
		PROCESSOR_LEVEL: string;
		PROCESSOR_REVISION: string;
		ProgramData: string;
		ProgramW6432: string;
		PROMPT: string;
		PSModulePath: string;
		PUBLIC: string;
		SESSIONNAME: string;
		SystemDrive: string;
		SystemRoot: string;
		TEMP: string;
		TMP: string;
		USERDOMAIN: string;
		windir: string;
		XDG_STATE_HOME: string;
		SVELTEKIT_FORK: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
