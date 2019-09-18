import { dirname, resolve as pathResolve } from 'path';
import sassResolve from '@csstools/sass-import-resolve';

export default function createImporter({ includePaths, result }) {
	// sass resolve cache
	const cache = {};

	return function importer(id, parentId, done) {
		// resolve the absolute parent
		const parent = pathResolve(parentId);

		// cwds is the list of all directories to search
		const cwds = [dirname(parent)]
			.concat(includePaths)
			.map(includePath => pathResolve(includePath));

		cwds
			.reduce(
				// resolve the first available files
				(promise, cwd) => promise.catch(() => sassResolve(id, { cwd, cache, readFile: true })),
				Promise.reject()
			)
			.then(
				({ file, contents }) => {
					// push the dependency to watch tasks
					result.messages.push({ type: 'dependency', file, parent });

					// pass the file and contents back to sass
					done({ file, contents });
				},
				importerError => {
					// otherwise, pass the error
					done(importerError);
				}
			);
	};
}
