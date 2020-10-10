#!/usr/bin/env node
"use strict";

import * as _ from "lodash";
import * as moment from "moment";
import * as jsonwebtoken from "jsonwebtoken";

import jwtTokenTimes from "./_f.jwt.token.times";

export const _refresh = (token: any) => _.merge(token, jwtTokenTimes());

const jwtTokenRefresh = (jwtSecret: string, jwt: any): any => {
	let token = jsonwebtoken.verify(jwt, jwtSecret);

	const now = moment(new Date());
	const refreshAt = moment(_.get(token, "refresh_at"));
	if (refreshAt.isBefore(now, "seconds")) {
		token = _refresh(token);
		jwt = jsonwebtoken.sign(token, jwtSecret);
		return {user: token, jwt};
	}
	return false;
};
export default jwtTokenRefresh;
