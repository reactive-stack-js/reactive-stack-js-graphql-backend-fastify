#!/usr/bin/env node
'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {filter} from 'lodash';
import * as cron from 'node-cron';

export type CronJobType = {
	cronExpression: string;
	job: () => void;
	options: any;
};

const initiateCronjobs = (folder: string): void => {
	const fileNames = fs.readdirSync(folder);
	const files = filter(fileNames, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	files.forEach((file: string) => {
		const absoluteFilePath = path.join(folder, file);
		const cronjob: CronJobType = require(absoluteFilePath).default;
		const {cronExpression, job, options} = cronjob;
		cron.schedule(cronExpression, job, options);
	});

	const folders = filter(fileNames, (name: string) => fs.lstatSync(path.join(folder, name)).isDirectory());
	folders.forEach((sub: string) => initiateCronjobs(path.join(folder, sub)));
};
export default initiateCronjobs;
