import { __, uniq } from 'ramda';
import { AllAnswers } from '.';
export const generalQuestions = {
	bundler: {
		message: 'Do you want to configure bundler like rollup or webpack for your project?',
		default: false,
	},
	semanticRelease: {
		default: true,
		message: 'Do you want to use semantic-release?',
	},
	commitizen: {
		default: true,
		message: 'Do you want to use commitizen?',
		when: (answers: AllAnswers) => !answers.general.semanticRelease,
	},
	prettier: {
		default: true,
		message: 'Do you want to enable prettier?',
	},
	eslint: {
		default: true,
		message: 'Do you want to enable eslint?',
	},
};
