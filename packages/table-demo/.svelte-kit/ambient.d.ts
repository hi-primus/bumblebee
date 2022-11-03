
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), this module cannot be imported into public-facing code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const ALLUSERSPROFILE: string;
	export const ANDROID_HOME: string;
	export const APPDATA: string;
	export const BOOST_ROOT: string;
	export const ChocolateyInstall: string;
	export const ChocolateyLastPathUpdate: string;
	export const CHROME_CRASHPAD_PIPE_NAME: string;
	export const COLORTERM: string;
	export const CommonProgramFiles: string;
	export const CommonProgramW6432: string;
	export const COMPUTERNAME: string;
	export const ComSpec: string;
	export const CONDA_DEFAULT_ENV: string;
	export const CONDA_EXE: string;
	export const CONDA_PREFIX: string;
	export const CONDA_PROMPT_MODIFIER: string;
	export const CONDA_PYTHON_EXE: string;
	export const CONDA_SHLVL: string;
	export const DokanLibrary1: string;
	export const DokanLibrary1_LibraryPath_x64: string;
	export const DokanLibrary1_LibraryPath_x86: string;
	export const DriverData: string;
	export const FPS_BROWSER_APP_PROFILE_STRING: string;
	export const FPS_BROWSER_USER_PROFILE_STRING: string;
	export const GIT_ASKPASS: string;
	export const GOPATH: string;
	export const HOMEDRIVE: string;
	export const HOMEPATH: string;
	export const INIT_CWD: string;
	export const JAVA_HOME: string;
	export const LANG: string;
	export const LOCALAPPDATA: string;
	export const LOGONSERVER: string;
	export const NODE: string;
	export const npm_config_argv: string;
	export const npm_config_bin_links: string;
	export const npm_config_engine_strict: string;
	export const npm_config_ignore_optional: string;
	export const npm_config_ignore_scripts: string;
	export const npm_config_init_license: string;
	export const npm_config_init_version: string;
	export const npm_config_registry: string;
	export const npm_config_save_prefix: string;
	export const npm_config_strict_ssl: string;
	export const npm_config_user_agent: string;
	export const npm_config_version_commit_hooks: string;
	export const npm_config_version_git_message: string;
	export const npm_config_version_git_sign: string;
	export const npm_config_version_git_tag: string;
	export const npm_config_version_tag_prefix: string;
	export const npm_execpath: string;
	export const npm_lifecycle_event: string;
	export const npm_lifecycle_script: string;
	export const npm_node_execpath: string;
	export const npm_package_bin_svelte_kit: string;
	export const npm_package_dependencies_cookie: string;
	export const npm_package_dependencies_devalue: string;
	export const npm_package_dependencies_kleur: string;
	export const npm_package_dependencies_magic_string: string;
	export const npm_package_dependencies_mime: string;
	export const npm_package_dependencies_sade: string;
	export const npm_package_dependencies_set_cookie_parser: string;
	export const npm_package_dependencies_sirv: string;
	export const npm_package_dependencies_tiny_glob: string;
	export const npm_package_dependencies_undici: string;
	export const npm_package_dependencies__sveltejs_vite_plugin_svelte: string;
	export const npm_package_dependencies__types_cookie: string;
	export const npm_package_description: string;
	export const npm_package_devDependencies_marked: string;
	export const npm_package_devDependencies_rollup: string;
	export const npm_package_devDependencies_svelte: string;
	export const npm_package_devDependencies_svelte_preprocess: string;
	export const npm_package_devDependencies_typescript: string;
	export const npm_package_devDependencies_uvu: string;
	export const npm_package_devDependencies_vite: string;
	export const npm_package_devDependencies__playwright_test: string;
	export const npm_package_devDependencies__types_connect: string;
	export const npm_package_devDependencies__types_marked: string;
	export const npm_package_devDependencies__types_mime: string;
	export const npm_package_devDependencies__types_node: string;
	export const npm_package_devDependencies__types_sade: string;
	export const npm_package_devDependencies__types_set_cookie_parser: string;
	export const npm_package_engines_node: string;
	export const npm_package_exports___hooks_import: string;
	export const npm_package_exports___import: string;
	export const npm_package_exports___node_import: string;
	export const npm_package_exports___node_polyfills_import: string;
	export const npm_package_exports___package_json: string;
	export const npm_package_exports___types: string;
	export const npm_package_exports___vite_import: string;
	export const npm_package_files_0: string;
	export const npm_package_files_1: string;
	export const npm_package_files_2: string;
	export const npm_package_files_3: string;
	export const npm_package_files_4: string;
	export const npm_package_files_5: string;
	export const npm_package_files_6: string;
	export const npm_package_files_7: string;
	export const npm_package_homepage: string;
	export const npm_package_license: string;
	export const npm_package_name: string;
	export const npm_package_peerDependencies_svelte: string;
	export const npm_package_peerDependencies_vite: string;
	export const npm_package_readmeFilename: string;
	export const npm_package_repository_directory: string;
	export const npm_package_repository_type: string;
	export const npm_package_repository_url: string;
	export const npm_package_scripts_build: string;
	export const npm_package_scripts_check: string;
	export const npm_package_scripts_check_all: string;
	export const npm_package_scripts_format: string;
	export const npm_package_scripts_lint: string;
	export const npm_package_scripts_postinstall: string;
	export const npm_package_scripts_test: string;
	export const npm_package_scripts_test_integration: string;
	export const npm_package_scripts_test_unit: string;
	export const npm_package_scripts_types: string;
	export const npm_package_type: string;
	export const npm_package_types: string;
	export const npm_package_version: string;
	export const NUMBER_OF_PROCESSORS: string;
	export const NVM_HOME: string;
	export const NVM_SYMLINK: string;
	export const OneDrive: string;
	export const OneDriveConsumer: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const OS: string;
	export const Path: string;
	export const PATHEXT: string;
	export const PROCESSOR_ARCHITECTURE: string;
	export const PROCESSOR_IDENTIFIER: string;
	export const PROCESSOR_LEVEL: string;
	export const PROCESSOR_REVISION: string;
	export const ProgramData: string;
	export const ProgramFiles: string;
	export const ProgramW6432: string;
	export const PROMPT: string;
	export const PSModulePath: string;
	export const PUBLIC: string;
	export const SESSIONNAME: string;
	export const SystemDrive: string;
	export const SystemRoot: string;
	export const TEMP: string;
	export const TERM_PROGRAM: string;
	export const TERM_PROGRAM_VERSION: string;
	export const TMP: string;
	export const USERDOMAIN: string;
	export const USERDOMAIN_ROAMINGPROFILE: string;
	export const USERNAME: string;
	export const USERPROFILE: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const windir: string;
	export const _CONDA_EXE: string;
	export const _CONDA_ROOT: string;
}

/**
 * Similar to [`$env/static/private`](https://kit.svelte.dev/docs/modules#$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {

}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) (or running [`vite preview`](https://kit.svelte.dev/docs/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env).
 * 
 * This module cannot be imported into public-facing code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		ALLUSERSPROFILE: string;
		ANDROID_HOME: string;
		APPDATA: string;
		BOOST_ROOT: string;
		ChocolateyInstall: string;
		ChocolateyLastPathUpdate: string;
		CHROME_CRASHPAD_PIPE_NAME: string;
		COLORTERM: string;
		CommonProgramFiles: string;
		CommonProgramW6432: string;
		COMPUTERNAME: string;
		ComSpec: string;
		CONDA_DEFAULT_ENV: string;
		CONDA_EXE: string;
		CONDA_PREFIX: string;
		CONDA_PROMPT_MODIFIER: string;
		CONDA_PYTHON_EXE: string;
		CONDA_SHLVL: string;
		DokanLibrary1: string;
		DokanLibrary1_LibraryPath_x64: string;
		DokanLibrary1_LibraryPath_x86: string;
		DriverData: string;
		FPS_BROWSER_APP_PROFILE_STRING: string;
		FPS_BROWSER_USER_PROFILE_STRING: string;
		GIT_ASKPASS: string;
		GOPATH: string;
		HOMEDRIVE: string;
		HOMEPATH: string;
		INIT_CWD: string;
		JAVA_HOME: string;
		LANG: string;
		LOCALAPPDATA: string;
		LOGONSERVER: string;
		NODE: string;
		npm_config_argv: string;
		npm_config_bin_links: string;
		npm_config_engine_strict: string;
		npm_config_ignore_optional: string;
		npm_config_ignore_scripts: string;
		npm_config_init_license: string;
		npm_config_init_version: string;
		npm_config_registry: string;
		npm_config_save_prefix: string;
		npm_config_strict_ssl: string;
		npm_config_user_agent: string;
		npm_config_version_commit_hooks: string;
		npm_config_version_git_message: string;
		npm_config_version_git_sign: string;
		npm_config_version_git_tag: string;
		npm_config_version_tag_prefix: string;
		npm_execpath: string;
		npm_lifecycle_event: string;
		npm_lifecycle_script: string;
		npm_node_execpath: string;
		npm_package_bin_svelte_kit: string;
		npm_package_dependencies_cookie: string;
		npm_package_dependencies_devalue: string;
		npm_package_dependencies_kleur: string;
		npm_package_dependencies_magic_string: string;
		npm_package_dependencies_mime: string;
		npm_package_dependencies_sade: string;
		npm_package_dependencies_set_cookie_parser: string;
		npm_package_dependencies_sirv: string;
		npm_package_dependencies_tiny_glob: string;
		npm_package_dependencies_undici: string;
		npm_package_dependencies__sveltejs_vite_plugin_svelte: string;
		npm_package_dependencies__types_cookie: string;
		npm_package_description: string;
		npm_package_devDependencies_marked: string;
		npm_package_devDependencies_rollup: string;
		npm_package_devDependencies_svelte: string;
		npm_package_devDependencies_svelte_preprocess: string;
		npm_package_devDependencies_typescript: string;
		npm_package_devDependencies_uvu: string;
		npm_package_devDependencies_vite: string;
		npm_package_devDependencies__playwright_test: string;
		npm_package_devDependencies__types_connect: string;
		npm_package_devDependencies__types_marked: string;
		npm_package_devDependencies__types_mime: string;
		npm_package_devDependencies__types_node: string;
		npm_package_devDependencies__types_sade: string;
		npm_package_devDependencies__types_set_cookie_parser: string;
		npm_package_engines_node: string;
		npm_package_exports___hooks_import: string;
		npm_package_exports___import: string;
		npm_package_exports___node_import: string;
		npm_package_exports___node_polyfills_import: string;
		npm_package_exports___package_json: string;
		npm_package_exports___types: string;
		npm_package_exports___vite_import: string;
		npm_package_files_0: string;
		npm_package_files_1: string;
		npm_package_files_2: string;
		npm_package_files_3: string;
		npm_package_files_4: string;
		npm_package_files_5: string;
		npm_package_files_6: string;
		npm_package_files_7: string;
		npm_package_homepage: string;
		npm_package_license: string;
		npm_package_name: string;
		npm_package_peerDependencies_svelte: string;
		npm_package_peerDependencies_vite: string;
		npm_package_readmeFilename: string;
		npm_package_repository_directory: string;
		npm_package_repository_type: string;
		npm_package_repository_url: string;
		npm_package_scripts_build: string;
		npm_package_scripts_check: string;
		npm_package_scripts_check_all: string;
		npm_package_scripts_format: string;
		npm_package_scripts_lint: string;
		npm_package_scripts_postinstall: string;
		npm_package_scripts_test: string;
		npm_package_scripts_test_integration: string;
		npm_package_scripts_test_unit: string;
		npm_package_scripts_types: string;
		npm_package_type: string;
		npm_package_types: string;
		npm_package_version: string;
		NUMBER_OF_PROCESSORS: string;
		NVM_HOME: string;
		NVM_SYMLINK: string;
		OneDrive: string;
		OneDriveConsumer: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		OS: string;
		Path: string;
		PATHEXT: string;
		PROCESSOR_ARCHITECTURE: string;
		PROCESSOR_IDENTIFIER: string;
		PROCESSOR_LEVEL: string;
		PROCESSOR_REVISION: string;
		ProgramData: string;
		ProgramFiles: string;
		ProgramW6432: string;
		PROMPT: string;
		PSModulePath: string;
		PUBLIC: string;
		SESSIONNAME: string;
		SystemDrive: string;
		SystemRoot: string;
		TEMP: string;
		TERM_PROGRAM: string;
		TERM_PROGRAM_VERSION: string;
		TMP: string;
		USERDOMAIN: string;
		USERDOMAIN_ROAMINGPROFILE: string;
		USERNAME: string;
		USERPROFILE: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		VSCODE_GIT_IPC_HANDLE: string;
		windir: string;
		_CONDA_EXE: string;
		_CONDA_ROOT: string;
		[key: string]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: string]: string | undefined;
	}
}
