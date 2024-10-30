import path from 'path';

import { writeJSONFile } from '../utils/util';

import Plugin from '.';
import { asyncSpawn } from '../utils/asyncSpawn';
import { appendFileSync, chmodSync, writeFileSync } from 'fs';
import { readFileSync } from 'fs';

export const addCommitizen = async function (plugin: Plugin) {
	const { folder } = plugin._options;

	writeJSONFile(path.join(folder, '.czrc'), {
		path: 'cz-conventional-changelog',
	});
	const prepareCommitMessage = path.join(folder, '.git', 'hooks', 'prepare-commit-msg');
	try {
		readFileSync(prepareCommitMessage);
	} catch (e) {
		writeFileSync(prepareCommitMessage, '#!/bin/bash');
		chmodSync(prepareCommitMessage, 0o755);
	}
	appendFileSync(prepareCommitMessage, `\nexec < /dev/tty && npx cz --hook || true`);
	return asyncSpawn({
		stdio: 'inherit',
		args: ['commitizen', 'init', 'cz-conventional-changelog', '--save-dev', '--save-exact', '--force'],
		command: 'npx',
		folder,
	}).promise;
};
