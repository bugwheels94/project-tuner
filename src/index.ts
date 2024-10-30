import minimist from 'minimist';

import { BasePluginClass } from './utils/Plugin';
import { plugins } from './utils/config';
const segregateConfluxArgs = (properArgv: string[]) => {
	return {
		remaining: minimist(properArgv.slice(1)),
		mainCommandOptions: properArgv.slice(1),
		mainCommand: properArgv[0],
	};
};
(async () => {
	const segregated = segregateConfluxArgs(process.argv.slice(2));
	const command = segregated.mainCommand as keyof typeof plugins;

	segregated.remaining._ = segregated.remaining._.slice(0);
	const args = segregated.mainCommandOptions;

	const Plugin = plugins[command];

	const pluginArguments = {
		argv: segregated.remaining,
		folder: process.cwd(),
		args,
		command,
	};
	// process.stdin.resume();

	const r: BasePluginClass = new Plugin({
		...pluginArguments,
	});
	try {
		await r.run();
	} catch (e) {
		console.log('ending', e);
	}
	console.log('a');
	console.log('a');
	console.log('a');
	console.log('a');
})();

export {};
