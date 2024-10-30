export const generalQuestions = {
	question: {
		message: '',
		default: '',
		type: 'list',
		choices: [
			{
				name: '',
				value: '',
			},
		],
	},
};
type Whens = Partial<{
	[K in keyof typeof generalQuestions]: (_: {
		[K in keyof typeof generalQuestions]: (_: typeof generalQuestions[K]['default']) => boolean;
	}) => boolean;
}>;

export const whens: Whens = {
	question: (_) => true,
};
