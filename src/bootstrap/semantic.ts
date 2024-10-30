import fs from 'fs';
import path from 'path';

import inquirer from 'inquirer';
import yaml from 'js-yaml';

import { writeJSONFile, writePermanentText } from '../utils/util';

import Plugin from '.';
import { asyncSpawn } from '../utils/asyncSpawn';

export const addSemanticRelease = async function (plugin: Plugin) {
	const { folder } = plugin._options;

	const answers = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'npm',
			message: `Do you want to enable NPM publish plugin for ${folder}`,
		},
		{
			type: 'confirm',
			name: 'exec',
			message: `Do you want to enable exec plugin for ${folder}`,
		},
	]);
	await asyncSpawn({
		stdio: 'inherit',
		args: [
			'install',
			'semantic-release',
			'@semantic-release/github',
			answers.npm ? '@semantic-release/npm' : '',
			answers.exec ? '@semantic-release/exec' : '',
			'--legacy-peer-deps',
			'--save-dev',
		],
		command: 'npm',
		folder,
		hideOutputAtEnd: true,
	}).promise;
	writeJSONFile(path.join(folder, '.releaserc'), {
		plugins: [
			'@semantic-release/commit-analyzer',
			'@semantic-release/release-notes-generator',
			...(answers.npm ? ['@semantic-release/npm'] : []),
			[
				'@semantic-release/github',
				{
					assets: [
						{
							path: 'dist.zip',
						},
					],
				},
			],
			...(answers.exec
				? [
						[
							'@semantic-release/exec',
							{
								publishCmd: 'echo ${nextRelease.version} > .version_semantic_info_workaround',
							},
						],
					]
				: []),
		],
	});
	await fs.promises.mkdir(path.join(folder, '.github', 'workflows'), {
		recursive: true,
	});
	fs.writeFileSync(
		path.join(folder, '.github', 'workflows', 'semantic-release.yaml'),
		yaml.dump({
			name: 'Release',
			on: {
				push: {
					branches: ['master', 'next', 'alpha', 'next-major', 'beta', '*.x'],
				},
			},
			jobs: {
				release: {
					name: 'release',
					'runs-on': 'ubuntu-latest',
					steps: [
						{
							uses: 'actions/checkout@v2',
						},
						{
							uses: 'actions/setup-node@v2',
							with: {
								cache: 'npm',
								'node-version': 16,
								'cache-dependency-path': 'package.json',
							},
						},
						{
							run: 'npm i',
						},
						{
							run: 'npm run build',
						},
						{
							run: 'zip -r dist.zip dist',
						},
						{
							run: 'npx semantic-release',
							env: {
								HUSKY: 0,
								NPM_TOKEN: '${{ secrets.SEMANTIC_RELEASE_BOT_NPM_TOKEN }}',
								GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
							},
						},
					],
				},
			},
		}),
	);
	writePermanentText(folder, 'Successful');
	return 'done';
};
