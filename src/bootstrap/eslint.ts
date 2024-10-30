import Plugin from '.';
import { asyncSpawn } from '../utils/asyncSpawn';

export const addEslint = async function (plugin: Plugin) {
	const { folder } = plugin._options;

	await asyncSpawn({
		stdio: 'inherit',
		args: ['init', '@eslint/config'],
		command: 'npm',
		folder,
	}).promise;

	// Detect existing prettier

	// Generate the config manually because package.json config path is incorrect in case of npm workspaces
	return 'Done';
	// do whatever...
};
