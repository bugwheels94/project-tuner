import { __, uniq } from 'ramda';
import { AllAnswers } from '.';
import globby from 'fast-glob';
import path from 'path';
export const bundlerQuestions = {
	decorators: {
		message: 'Is this project using decorators Typescript feature?',
		default: '',
		choices: [
			{
				name: 'Not using decorators',
				value: '',
			},
			{
				name: 'legacy',
				value: 'legacy',
			},
			{
				name: 'Stage 3',
				value: 'stage3',
			},
			{
				name: 'Latest',
				value: '23-11',
			},
		],
	},
	purpose: {
		message: 'What is the purpose for this project?',
		default: 'application',
		choices: [
			{
				name: 'Application (Node.js or Web)',
				value: 'application',
			},
			{
				name: 'Library',
				value: 'library',
			},
		],
	},
	targetPlatform: {
		// loop over it and generate multiple configs for this
		message: 'What is the target platform for this project?',
		default: 'web',
		required: true,
		when: (answers: AllAnswers) => answers.bundler.purpose === 'application',
		choices: [
			{
				name: 'Web',
				value: 'web',
			},
			{
				name: 'Node.js',
				value: 'node.js',
			},
		],
	},
	entryFile: {
		message: (answers: AllAnswers) => {
			return 'Please enter your entry file for source code';
		},
		default: 'src/index.ts',
		type: 'input',
	},
	fileTypes: {
		required: true,
		message: 'What are the file types in the project?',
		default: ['ts', 'tsx', 'css', 'images'],
		type: 'checkbox',
		pageSize: 15,
		choices: async (answers: AllAnswers) => {
			const files = await globby(path.join(answers.bundler.entryFile, '..', '**/*.*'));
			const presentExtensions = uniq(files.map((file) => file.match(/\..+$/)?.[0]).filter(Boolean));

			return presentExtensions
				.map((value) => ({
					value,
					name: value,
					checked: true,
				}))
				.concat(
					['.js', '.ts', '.tsx', '.jsx', '.css', '.scss', '.less', '.json', '.png', '.jpg', '.gif', '.svg', '.webp']
						.filter((extension) => {
							return !presentExtensions.includes(extension);
						})
						.map((value) => ({ name: value, value, checked: false })),
				);
		},
	},
};
