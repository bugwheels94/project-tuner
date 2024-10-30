// import util from 'util';

import { BasePluginClass, PluginArguments } from '../utils/Plugin';
import { asyncSpawn } from '../utils/asyncSpawn';
import { capitalizeFirstLetter, writeJSONFile, writePermanentText } from '../utils/util';
// const execPromise = util.promisify(exec);
import './prettier';
import https from 'https'; // or 'https' for https:// URLs
import fs from 'fs';
import * as prettier from 'prettier';
import path from 'path';
import Handlebars from 'handlebars';
import { TsConfigResult, getTsconfig } from 'get-tsconfig';
import { readFileSync, writeFileSync, existsSync, copyFile, copyFileSync } from 'fs';
import { askQuestions } from './askQuestions';
import { select } from '@inquirer/prompts';
import pkg from 'fs-extra';
import { bundlerQuestions } from './questions/bundler';
import { AllAnswers } from './questions';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helpers from 'handlebars-helpers';
import { swcQuestions } from './questions/swc';
import { generalQuestions } from './questions/general';
import { addCommitizen } from './commitizen';
import { addSemanticRelease } from './semantic';
import { addPrettier } from './prettier';
import { addEslint } from './eslint';
import { execSync } from 'child_process';
import { features } from 'process';
const { ensureDirSync, readJSONSync, writeJSONSync } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
Handlebars.registerHelper(helpers());
type Selection = { bundler: string; transpiler: string };
type State = {
	selection?: Selection | void;
	answers?: AllAnswers;
};
class Plugin extends BasePluginClass implements BasePluginClass {
	private answers: AllAnswers = {} as AllAnswers;
	constructor(options: PluginArguments) {
		super(options);
		this.checkCommandExist('npm');
	}
	private combinations = [
		{
			bundler: 'rollup',
			transpiler: 'swc',
		},
		{
			bundler: 'rollup',
			transpiler: 'babel',
		},
		{
			bundler: 'rollup',
			transpiler: 'sucrase',
		},
		{
			bundler: 'rollup',
			transpiler: 'typescript',
		},
	];

	static doesRequireFolder(_param: Pick<PluginArguments, 'command'>): boolean {
		return false;
	}
	generateTypescript(features: Record<string, boolean> = {}) {
		const existingTsc = getTsconfig();
		let tscTemplate = Handlebars.compile(
			readFileSync(path.join(__dirname, '..', '..', 'resources', 'tsconfig.json.hbs')).toString(),
		);
		let tsc = JSON.parse(tscTemplate({ tsc: existingTsc, ...this.answers, features })) as TsConfigResult['config'];
		return tsc;
	}
	isTypescriptProject() {
		return this.answers.bundler.fileTypes.includes('ts') || this.answers.bundler.fileTypes.includes('tsx');
	}
	getSuggestions(tsc: TsConfigResult['config']) {
		const eliminationReasons: string[] = [];
		const suggestions = this.combinations
			.filter((combination) => {
				if (!this.isTypescriptProject() && combination.transpiler === 'typescript') return false;
				if (this.answers.bundler.decorators !== '' && combination.transpiler === 'sucrase') {
					eliminationReasons.push('Since you are using decorators so we cannot use Sucrase');
					return false;
				}
				if (combination.transpiler === 'swc') {
					if (tsc.compilerOptions?.esModuleInterop !== true) {
						eliminationReasons.push('Since you have disabled esModuleInterop so we cannot use swc to transpile');
						return false;
					}
					if (this.answers.bundler.decorators === '23-11') {
						eliminationReasons.push(
							'Since you are using swc 23-11 decorator version so we cannot use swc to transpile',
						);
						return false;
					}
				}

				if (tsc.compilerOptions?.isolatedModules !== true && combination.transpiler !== 'typescript') {
					eliminationReasons.push(
						'Since you have not enabled isolatedModules so we can only use typescript to transpile',
					);
					return false;
				}
				return true;
			})
			.map((suggestion) => ({
				name: `${capitalizeFirstLetter(suggestion.bundler)} with ${capitalizeFirstLetter(suggestion.transpiler)}`,
				value: suggestion,
			}));
		if (suggestions.length === 0) return eliminationReasons.join('\n');
		return suggestions;
	}
	createCompleteTsconfigFile(selection: Selection, tsc: TsConfigResult['config'], features: Record<string, boolean>) {
		const sourceDirectory = this.answers.bundler.entryFile.split('/')[0];

		const partialTsConfig = JSON.parse(
			Handlebars.compile(
				readFileSync(
					path.join(__dirname, '..', '..', 'resources', 'tsconfig.json.after-transpiler-decision.hbs'),
				).toString(),
			)({ selection, ...this.answers }),
		);
		const finalData = {
			include: [path.join(sourceDirectory, '**', '*')],
			...tsc,
			compilerOptions: {
				...tsc.compilerOptions,
				...partialTsConfig,
			},
		};
		writeJSONFile(path.join(process.cwd(), 'tsconfig.json'), finalData);
		if (features.react)
			copyFileSync(
				path.join(__dirname, '..', '..', 'resources', 'react.d.ts'),
				path.join(sourceDirectory, 'react.pt.d.ts'),
			);

		return finalData;
	}
	async setupWebApplication() {
		const indexHtmlPath = path.join(process.cwd(), 'public', 'index.html');
		if (!existsSync(indexHtmlPath)) {
			ensureDirSync(path.join(process.cwd(), 'public'));
			const htmlTemplate = Handlebars.compile(
				readFileSync(path.join(__dirname, '..', '..', 'resources', 'index.html.hbs')).toString(),
			);
			const htmlFile = htmlTemplate({});
			writeFileSync(indexHtmlPath, htmlFile);
		}
	}
	async setStartupScripts(folder: string, features: Record<string, boolean>) {
		await asyncSpawn({
			stdio: 'inherit',
			args: ['pkg', 'set', 'scripts.build="project-tuner run build"'],
			command: 'npm',
			folder,
		}).promise;
		if (features.nodeApp) {
			await asyncSpawn({
				stdio: 'inherit',
				args: ['pkg', 'set', 'scripts.start="node dist/index.js"'],
				command: 'npm',
				folder,
			}).promise;
		}

		await asyncSpawn({
			stdio: 'inherit',
			args: [
				'pkg',
				'set',
				`scripts.${this.answers.bundler.purpose === 'library' ? 'build' : 'start'}:watch="project-tuner run ${this.answers.bundler.purpose === 'library' ? 'build' : 'start'}:watch"`,
			],
			command: 'npm',
			folder,
		}).promise;
	}
	async setupRollup(tsc: TsConfigResult['config'], selection: Selection, features: Record<string, boolean>) {
		const devDependencies: string[] = [];
		Handlebars.registerHelper('addDevDeps', function (value: string) {
			devDependencies.push(...value.split(','));
			return '';
		});
		const rollupTemplate = Handlebars.compile(
			readFileSync(path.join(__dirname, '..', '..', 'resources', 'rollup.config.mjs.hbs')).toString(),
		);
		const rollup = await prettier.format(rollupTemplate({ tsc, ...this.answers, features, selection }), {
			parser: 'babel',
		});

		console.log('dependencies to install', devDependencies);
		await asyncSpawn({
			command: 'npm',
			folder: process.cwd(),
			args: ['install', '--save-dev', ...devDependencies],
			stdio: 'inherit',
		}).promise;
		writeFileSync('mesh.rollup.config.mjs', rollup);
	}
	async askTraspilerQuestions(selection: Selection) {
		if (selection.transpiler === 'swc') {
			writePermanentText('Swc Setup', 'You chose Swc! Please tell few more things to configure swc');
			await askQuestions(swcQuestions, this.answers, 'swc');
		}
	}
	saveAnswers(folder: string, state: State) {
		writeJSONFile(path.join(folder, 'project-tuner.config.json'), state);
	}
	async configureBundler(folder: string) {
		let answers = this.answers;
		this.answers = await askQuestions(bundlerQuestions, this.answers, 'bundler');
		const features = {
			commonjs: true,
			nodeResolve: true,
			url: true,
			postcss: this.answers.bundler.fileTypes.includes('.css') || this.answers.bundler.fileTypes.includes('.scss'),
			webApp: this.answers.bundler.purpose === 'application' && this.answers.bundler.targetPlatform === 'web',
			nodeApp: this.answers.bundler.purpose === 'application' && this.answers.bundler.targetPlatform === 'node.js',
			image: this.answers.bundler.targetPlatform === 'web',
			react: this.answers.bundler.fileTypes.includes('.jsx') || this.answers.bundler.fileTypes.includes('.tsx'),
		};
		let tsc = this.generateTypescript(features);
		const suggestions = this.getSuggestions(tsc);
		if (typeof suggestions === 'string') return console.log(suggestions); // means no suggestions
		const selection = await select({
			message: 'Which of the available tools you want to use?',
			choices: suggestions,
		});
		tsc = this.createCompleteTsconfigFile(selection, tsc, features);

		if (answers.bundler.targetPlatform === 'web') {
			await this.setupWebApplication();
		}
		await this.setStartupScripts(folder, features);
		if (selection.bundler === 'rollup') {
			await this.setupRollup(tsc, selection, features);
		}
		return selection;
	}
	async run() {
		const { folder } = this._options;
		const state: State = {};
		try {
			readJSONSync(path.join(folder, 'package.json'));
		} catch (e) {
			console.log('package.json not found. running "npm init"');
			await asyncSpawn({
				command: 'npm',
				args: ['init'],
				folder,
			}).promise;
		}
		try {
			const packageJson = readJSONSync(path.join(folder, 'package.json'));
			if (!packageJson.files) {
				packageJson.files = ['dist'];
			}
			if (!packageJson.type) {
				packageJson.type = 'module';
			}
			writeJSONSync(path.join(folder, 'package.json'), packageJson, {
				spaces: 2,
			});
		} catch (e) {}
		try {
			const result = execSync('git rev-parse --is-inside-work-tree 2>/dev/null', {
				cwd: folder,
			});
			if (result.toString()) {
				console.log('Git repo is initialized');
			}
		} catch (e) {
			console.log('Git repo is not initialized! Initializing git repo');
			execSync('git init');
		}
		try {
			readFileSync(path.join(folder, '.gitignore'));
		} catch (e) {
			const file = fs.createWriteStream(path.join(folder, '.gitignore'));
			await new Promise((resolve, reject) => {
				https.get('https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore', function (response) {
					response.pipe(file);
					file.on('error', reject);

					// after download completed close filestream
					file.on('finish', () => {
						file.close();
						resolve(true);
						console.log('Gitignore file created');
					});
				});
			});
		}
		this.answers = await askQuestions(generalQuestions, this.answers, 'general');
		if (this.answers.general.bundler) {
			state.selection = await this.configureBundler(folder);
		}

		if (this.answers.general.commitizen) {
			await addCommitizen(this);
		}
		if (this.answers.general.semanticRelease) {
			await addSemanticRelease(this);
		}
		if (this.answers.general.prettier) {
			await addPrettier(this);
		}
		if (this.answers.general.eslint) {
			await addEslint(this);
		}
		state.answers = this.answers;
		this.saveAnswers(folder, state);
		return undefined;
	}
}
export default Plugin;
