#!/usr/bin/env node
'use strict';

import * as cron from 'node-cron';
import * as dotenv from 'dotenv';

dotenv.config({path: '.env.local'});

/**
 * 			# ┌────────────── second (optional)
 * 			# │ ┌──────────── minute
 * 			# │ │ ┌────────── hour
 * 			# │ │ │ ┌──────── day of month
 * 			# │ │ │ │ ┌────── month
 * 			# │ │ │ │ │ ┌──── day of week
 * 			# │ │ │ │ │ │
 * 			# │ │ │ │ │ │
 * 			# * * * * * *
 */

cron.schedule(
	'*/5 * * * * *',
	() => {
		console.log('running a task every 5 seconds', new Date());
	},
	{
		scheduled: true
	}
);

// TODO: process workers folder and start them all
