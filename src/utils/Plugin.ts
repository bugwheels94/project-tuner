import minimist from 'minimist';
import shell from 'shelljs';

import { asyncSpawn } from './asyncSpawn';
import { Config, ShellTypes } from './util';
import { plugins } from './config';

export interface IProcessFunction {
	type: ShellTypes;
	method: typeof asyncSpawn;
}

// export interface PluginInterface {
//   result?: ReturnType<ReturnType<typeof asyncSpawn>>[];
//   run: (
//     _options: Omit<PluginArguments, 'folders' | 'command'> & { folder: string }
//   ) => ReturnType<ReturnType<typeof asyncSpawn>>;
//   chooseShellMethod: (subcommand: string) => IProcessFunction;
// }

export type PluginArguments = {
	readonly argv: minimist.ParsedArgs;
	readonly folder: string;

	readonly args: string[];
	readonly command: keyof typeof plugins;
	shouldCheckCommandExistence?: boolean;
};
export abstract class BasePluginClass {
	result?: ReturnType<typeof asyncSpawn>;
	promisedResult?: Promise<string | null>;
	_options: PluginArguments;
	constructor(_options: PluginArguments) {
		this._options = _options;
		// super(options);
	}

	checkCommandExist(command: string) {
		if (!shell.which(command)) {
			shell.echo('Sorry, this script requires ' + command);
			shell.exit(1);
		}
	}
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	async run(): Promise<string | null | void> {
		return '';
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
}
