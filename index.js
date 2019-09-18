// tooling
import createImporter from './lib/createImporter';
import mergeSourceMaps from './lib/merge-source-maps';
import postcss from 'postcss';

// transform css with sass
export default postcss.plugin('postcss-sass', opts => (root, result) => {
	// postcss configuration
	const postConfig = Object.assign({}, result.opts, requiredPostConfig);

	// postcss results
	const { css: postCSS, map: postMap } = root.toResult(postConfig);

	// include paths
	const includePaths = [].concat(opts && opts.includePaths || []);

	// sass engine to use
	const sassEngine = opts && opts.sass || require('sass');

	const importer = opts && opts.importer || createImporter({ includePaths, result });

	return new Promise(
		// promise sass results
		(resolve, reject) =>
			sassEngine.render(
				// pass options directly into node-sass
				Object.assign({}, opts, requiredSassConfig, {
					file: `${postConfig.from}#sass`,
					outFile: postConfig.from,
					data: postCSS,
					importer,
				}),
				(sassError, sassResult) => sassError ? reject(sassError) : resolve(sassResult)
			)
	).then(({ css: sassCSS, map: sassMap }) =>
		mergeSourceMaps(postMap.toJSON(), JSON.parse(sassMap)).then(prev => {
			// update root to post-node-sass ast
			result.root = postcss.parse(
				sassCSS.toString(),
				Object.assign({}, postConfig, {
					map: { prev },
				})
			);
		})
	);
});

const requiredPostConfig = {
	map: {
		annotation: false,
		inline: false,
		sourcesContent: true,
	},
};

const requiredSassConfig = {
	omitSourceMapUrl: true,
	sourceMap: true,
	sourceMapContents: true,
};
