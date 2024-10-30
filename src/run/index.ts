import pkg from 'fs-extra';
import { BasePluginClass } from '../utils/Plugin';
import { asyncSpawn } from '../utils/asyncSpawn';
import path from 'path';
const { readJSONSync } = pkg;
class Plugin extends BasePluginClass implements BasePluginClass {
	async run() {
		const { folder } = this._options;
		let ptConfig;
		try {
			ptConfig = readJSONSync(path.join(folder, 'project-tuner.config.json'));
		} catch (e) {
			console.log(
				"This project is not configured with project-tuner. Please run 'project-tuner bootstrap' to configure this project.",
			);
		}
		if (this._options.args[0] === 'build') {
			asyncSpawn({
				command: 'npx',
				folder: this._options.folder,
				stdio: 'inherit',
				args: ['rollup', '-c', 'mesh.rollup.config.mjs'],
			});
			asyncSpawn({
				command: 'npx',
				folder: this._options.folder,
				stdio: 'inherit',
				args: ['tsc', '--project', './tsconfig.json'],
			});
		} else if (this._options.args[0] === 'build:watch' || this._options.args[0] === 'start:watch') {
			asyncSpawn({
				command: 'npx',
				folder: this._options.folder,
				stdio: 'inherit',
				args: ['rollup', '-c', 'mesh.rollup.config.mjs', '-w'],
			});
			if (ptConfig.answers.bundler.targetPlatform === 'web') {
				asyncSpawn({
					command: 'web-dev-server',
					args: ['dist', '--watch', '--port', '$PORT', '--hostname', '$HOST', '-root-dir', 'dist'],
					folder: this._options.folder,
					stdio: 'inherit',
				});
			}
			if (ptConfig.answers.bundler.fileTypes.includes('.ts') || ptConfig.answers.bundler.fileTypes.includes('.tsx')) {
				asyncSpawn({
					command: 'npx',
					folder: this._options.folder,
					stdio: 'inherit',
					args: ['tsc', '--watch', '--project', './tsconfig.json'],
				});
			}
		}
	}
}
export default Plugin;
