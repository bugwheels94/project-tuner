export const swcQuestions = {
	decorators: {
		message: 'Recommended choices have been made, in case you want to change then please choose that option?',
		default: true,
		type: 'checkbox',
		choices: [
			{
				name: 'Dynamic Import',
				value: 'dynamicImport',
				checked: true,
			},
			{
				name: 'Private Methods',
				value: 'privateMethod',
				checked: true,
			},
			{
				name: 'Function Bind',
				value: 'functionBind',
				checked: true,
			},
			{
				name: 'Export object from file syntax(exportDefaultFrom)',
				value: 'exportDefaultFrom',
				checked: true,
			},
			{
				name: 'Export namespace from file syntax(exportNamespaceFrom)',
				value: 'exportNamespaceFrom',
				checked: true,
			},
			{
				name: 'Top Level Await',
				value: 'topLevelAwait',
			},
			{
				name: 'Comment Preservation',
				value: 'preserveAllComments',
			},
			{
				name: 'SWC External Helpers',
				value: 'externalHelpers',
			},
			{
				name: 'Class name Preservation',
				value: 'keepClassNames',
			},
			{
				name: 'Loose Mode',
				value: 'looseMode',
			},
		],
	},
};
