import path from 'path';

import { writeLogicalText } from '../utils/util';

import Plugin from '.';
import { asyncSpawn } from '../utils/asyncSpawn';
import pkg from 'fs-extra';
import { appendFileSync, chmodSync, writeFileSync, readFileSync } from 'fs';

const { readJSONSync, readJSON, writeJSONSync } = pkg;
export const addPrettier = async function (plugin: Plugin) {
	const { folder } = plugin._options;

	const packageJson = readJSONSync(path.join(folder, 'package.json'));
	try {
		const prettior = (
			await Promise.allSettled([
				Promise.resolve(packageJson).then((file) => {
					if (file.prettier) return;
					throw new Error();
				}),
				readJSON(path.join(folder, '.prettierrc.json')),
				readJSON(path.join(folder, '.prettierrc')),
			])
		).filter((promise) => promise.status === 'fulfilled');
		if (!prettior.length) {
			await asyncSpawn({
				stdio: 'inherit',
				args: ['install', 'prettier', '--save-dev', '--save-exact'],
				command: 'npm',
				folder,
			}).promise;

			writeJSONSync(
				path.join(folder, 'package.json'),
				{
					...readJSONSync(path.join(folder, 'package.json')),
					prettier: {
						singleQuote: true,
						printWidth: 120,
						useTabs: true,
					},
					'lint-staged': {
						'**/*': 'prettier --write --ignore-unknown',
					},
				},
				{
					spaces: 2,
				},
			);

			return;
		}
	} catch (e) {}
	const preCommitHook = path.join(folder, '.git', 'hooks', 'pre-commit');
	try {
		readFileSync(preCommitHook);
	} catch (e) {
		writeFileSync(preCommitHook, '#!/bin/bash');
		chmodSync(preCommitHook, 0o755);
	}
	appendFileSync(
		preCommitHook,
		`\nFILES=$(git diff --cached --name-only --diff-filter=ACMR | sed 's| |\\ |g')
	[ -z "$FILES" ] && exit 0
	
	# Prettify all selected files
	echo "$FILES" | xargs ./node_modules/.bin/prettier --ignore-unknown --write
	
	# Add back the modified/prettified files to staging
	echo "$FILES" | xargs git add
	
	exit 0`,
	);

	// Generate the config manually because package.json config path is incorrect in case of npm workspaces
	return 'Done';
	// do whatever...
};
