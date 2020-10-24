#!/usr/bin/env node
'use strict';

import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';

const processFolder = (root: any, folder: string, fileProcessor: Function): any => {
	const fileNames = fs.readdirSync(folder);
	const files = _.filter(fileNames, (fileName) => !fs.lstatSync(path.join(folder, fileName)).isDirectory());
	files.forEach((file) => {
		const ext = path.extname(file);
		if (ext !== '.ts' && ext !== '.js') return;
		root = fileProcessor(root, folder, file);
	});

	const folders = _.filter(fileNames, (fileName) => fs.lstatSync(path.join(folder, fileName)).isDirectory());
	folders.forEach((subfolder) => {
		root = processFolder(root, subfolder, fileProcessor);
	});

	return root;
};
export default processFolder;
