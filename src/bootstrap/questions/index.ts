import { bundlerQuestions } from './bundler';
import { swcQuestions } from './swc';
import { generalQuestions } from './general';

export type AllAnswers = {
	general: {
		[K in keyof typeof generalQuestions]: (typeof generalQuestions)[K]['default'];
	};
	bundler: {
		[K in keyof typeof bundlerQuestions]: (typeof bundlerQuestions)[K]['default'];
	};
	swc: {
		[K in keyof typeof swcQuestions]: (typeof swcQuestions)[K]['default'];
	};
};
export type AllQuestions = typeof generalQuestions | typeof swcQuestions | typeof bundlerQuestions;
