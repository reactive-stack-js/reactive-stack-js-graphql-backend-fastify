#!/usr/bin/env node
"use strict";
import * as moment from "moment-timezone";

const EXPIRES = 1800000;	// 30 mins
const REFRESH = 1200000;	// 20 mins

const _now = (): number => Math.floor(new Date().getTime() / 1000) * 1000;

const jwtTokenTimes = (): any => ({
	token_received_at: _now(),
	expires_in: EXPIRES,
	expires_at: _now() + EXPIRES,
	expires_at_string: moment.tz(_now() + EXPIRES, moment.tz.guess()).format("YYYY/MM/DD HH:mm:ss zz"),
	refresh_in: REFRESH,
	refresh_at: _now() + REFRESH,
	refresh_at_string: moment.tz(_now() + REFRESH, moment.tz.guess()).format("YYYY/MM/DD HH:mm:ss zz"),
});
export default jwtTokenTimes;