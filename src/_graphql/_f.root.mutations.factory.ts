#!/usr/bin/env node
'use strict';

import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';

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

const _processFolder = (root: any, folder: string): any => {
	const fileNames = fs.readdirSync(folder);
	const files = _.filter(fileNames, (fileName) => !fs.lstatSync(path.join(folder, fileName)).isDirectory());
	files.forEach((file) => {
		const ext = path.extname(file);
		if (ext !== '.ts' && ext !== '.js') return;
		root = _processFile(root, folder, file);
	});

	const folders = _.filter(fileNames, (fileName) => fs.lstatSync(path.join(folder, fileName)).isDirectory());
	folders.forEach((subfolder) => {
		root = _processFolder(root, subfolder);
	});

	return root;
};

const graphQLRootMutationsFactory = (folder: string): any => {
	return _processFolder({}, folder);
};
export default graphQLRootMutationsFactory;
