const loose = true;

const config = {
	assumptions: { setPublicClassFields: true },
	presets: [
		[
			'@babel/preset-env',
			{
				loose,
				targets: {
					chrome: 80,
				},
				modules: false,
				exclude: ['@babel/plugin-transform-regenerator'],
			},
		],
		'@babel/preset-typescript',
	],
	plugins: [
		[
			'const-enum',
			{
				transform: 'constObject',
			},
		],
	].filter(Boolean),
};
export default config;
