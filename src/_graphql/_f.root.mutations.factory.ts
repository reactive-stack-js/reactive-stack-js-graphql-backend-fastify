#!/usr/bin/env node
'use strict';

import * as path from 'path';

import * as _ from 'lodash';
import processFolder from './_f.process.folder';

const _processFile = (root: any, folder: string, file: string): any => {
	const fullPath = path.join(folder, file);
	const mutations = require(fullPath);

	const filename = path.parse(file).name;
	const relPath = './mutations' + _.last(_.split(folder + '/' + file, 'mutations'));

	const wrong = _.filter(_.keys(mutations), (key) => !_.startsWith(key, filename));
	console.log(' - In', relPath, 'RENAMING following mutations:', _.join(wrong, ', '));

	const fixed: any = {};
	const keys = _.keys(mutations);
	_.each(keys, (key) => {
		if (_.startsWith(key, filename)) {
			fixed[key] = mutations[key];
		} else {
			fixed[filename + _.upperFirst(key)] = mutations[key];
		}
	});

	return {...root, ...fixed};
};

const graphQLRootMutationsFactory = (folder: string): any => {
	return processFolder({}, folder, _processFile);
};
export default graphQLRootMutationsFactory;
