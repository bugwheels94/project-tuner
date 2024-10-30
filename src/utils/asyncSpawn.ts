import { ChildProcess, spawn, SpawnOptions } from 'child_process';

import throttle from 'lodash.throttle';

import { Config, globalConfig, writeIndentedText, writeLogicalText, writePermanentText } from './util';
import treeKill from 'tree-kill';

const BATCH_TIME = 500;
type CommonOptions = {
	hideOutputAtEnd?: boolean;
	isRealTime?: boolean;
	shouldRunInCurrentFolder?: boolean;
};

export const asyncSpawn = ({
	command,
	args,
	folder,
	...opts
}: {
	folder: string;
	command: string;
	args: string[];
} & SpawnOptions &
	CommonOptions) => {
	const obj: {
		process?: ChildProcess;
		promise?: Promise<string | undefined>;
		folder: string;
	} = {
		folder,
	};
	const finalOptions = {
		...opts,
	};
	const folderPath = folder;
	if (!finalOptions.shouldRunInCurrentFolder) finalOptions.cwd = folderPath;
	else finalOptions.cwd = process.cwd();

	obj.promise = new Promise(function (resolve, reject) {
		obj.process = spawn(command, args, {
			stdio: ['inherit', 'pipe', 'pipe'],
			...finalOptions,
			env: process.env,
			shell: true,
		});
		if (process.stdin.isTTY) {
			// process.stdin.setRawMode(true);
		}
		// process.stdin.resume();
		if (obj.process?.stdin) process.stdin.pipe(obj.process.stdin);
		const printStream = (buffer: Buffer) => {
			process.stdout.write(buffer);
		};
		obj.process.stdout?.on('data', function (data) {
			printStream(data);
		});
		obj.process.stderr?.on('data', function (data) {
			printStream(data);
		});
		process.on('exit', () => {
			obj.process?.kill();
			if (obj.process?.pid) treeKill(obj.process?.pid);
			// Kill the child process
		});

		writePermanentText('Running', '"' + command + ' ' + args.join(' ') + '"');

		// const temp = (ch: Buffer) => {
		//   console.log('writing', ch);
		//   obj.process.stdin.write(ch);
		// };
		obj.process.on('exit', (code) => {
			if (code === 0 || code === null) {
				resolve('');
			} else {
				const s = `Failed with code ${code}`;
				reject(s);
			}
		});
		obj.process.on('error', (error) => {
			reject(error);
		});
	});

	return obj;
};
