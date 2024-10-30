import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import globby from 'fast-glob';
import json from '@rollup/plugin-json';
import path from 'path';
const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const babelIncludes = ['./src/**/*', './src/*'];
let configs = globby.sync(['./src/index.ts', '!./src/**/*.js']);
// configs = globby.sync(['./src/theme.ts']);
const bundleNpmWorkspacePackages = [];
const bundlePackages = [];
const neverBundlePackages = [];
const shouldBundleLocalFilesTogether = true;
const shouldBundleNodeModulesTogether = false;

const isDevelopment = !!process.env.ROLLUP_WATCH;
const isPackageDependency = (pkg, path, importer = '') => {
	return (
		path.includes('node_modules/' + pkg) ||
		(importer.includes('node_modules/' + pkg) && path.startsWith('.')) ||
		path === pkg
	);
};

/*
	Each Test file will have two inputs one to get bundled.js and one to get test.mjs
*/
// console.log(testBundles);
// process.exit();
const config = (input, { extractDependency, extractTests } = {}) => {
	let output = path.join('./dist', 'es', input.replace('/src', '').replace(/\.(tsx|ts)/, '.js'));
	let format = 'esm';

	// we only compile css files because component themes are stored in them and we need them in final theme
	return {
		input,
		output: {
			file: output,
			// dir: path.join('./dist', 'es', entry.split('/')[2]),
			format,
			banner: input.endsWith('src/index.ts') ? '#!/usr/bin/env node' : undefined,
		},
		onwarn(warning, warn) {
			if (warning.code === 'THIS_IS_UNDEFINED') return;
			warn(warning);
		},
		external(id, second = '') {
			const sanitizedId = id.split('?')[0];
			const isNodeModule = id.includes('node_modules');

			if (sanitizedId.endsWith(input.replace('./', '/'))) {
				return false;
			}
			// No need to pass second because the entry will be stopped
			if (neverBundlePackages.find((pkg) => isPackageDependency(pkg, id))) {
				return true;
			}
			if (bundlePackages.find((pkg) => isPackageDependency(pkg, id, second))) {
				return false;
			}
			if (
				!id.includes('node_modules') &&
				!second.includes('node_modules') &&
				bundleNpmWorkspacePackages.find((pkg) => id.includes('/' + pkg + '/') || second.includes('/' + pkg + '/'))
			) {
				return false;
			}

			if (isNodeModule) {
				return !shouldBundleNodeModulesTogether;
			}

			return !shouldBundleLocalFilesTogether;
		},
		plugins: [
			peerDepsExternal(),
			resolve({
				extensions,
				exportConditions: [!isDevelopment ? 'development' : undefined],
			}),
			commonjs({}),
			babel({
				extensions,
				include: babelIncludes,
				babelHelpers: 'bundled',
			}),
			json(),
		],
	};
};
// export default [...configs.map((file) => config(file)), config('./dist/es/index.js', true)];
export default [
	...configs.map((file) => config(file)),
	// ...testBundles.map((file) =>
	// 	config(file, {
	// 		extractDependency: true,
	// 	})
	// ),
	// ...testBundles.map((file) =>
	// 	config(file, {
	// 		extractTests: true,
	// 	})
	// ),
];
