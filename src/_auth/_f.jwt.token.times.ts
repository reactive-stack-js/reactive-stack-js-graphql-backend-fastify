#!/usr/bin/env node
'use strict';

import * as moment from 'moment-timezone';

const EXPIRES = 1800; // 30 mins
const _now = (): number => Math.floor(new Date().getTime() / 1000) * 1000;

const jwtTokenTimes = (expiresIn: number = EXPIRES): any => {
	expiresIn = expiresIn * 1000;
	const refreshIn = Math.round(0.8 * expiresIn);
	console.log({expiresIn, refreshIn});
	return {
		token_received_at: _now(),
		expires_in: expiresIn,
		expires_at: _now() + expiresIn,
		expires_at_string: moment.tz(_now() + expiresIn, moment.tz.guess()).format('YYYY/MM/DD HH:mm:ss zz'),
		refresh_in: refreshIn,
		refresh_at: _now() + refreshIn,
		refresh_at_string: moment.tz(_now() + refreshIn, moment.tz.guess()).format('YYYY/MM/DD HH:mm:ss zz')
	};
};
export default jwtTokenTimes;
