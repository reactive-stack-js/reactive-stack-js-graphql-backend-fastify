#!/usr/bin/env node
'use strict';

import {merge, get} from 'lodash';
import * as moment from 'moment';
import * as jsonwebtoken from 'jsonwebtoken';

import jwtTokenTimes from './_f.jwt.token.times';

export const _refresh = (token: any): any => merge(token, jwtTokenTimes());

// TODO: this is a quick hack, one should contact the provider for a new token!
const jwtTokenRefresh = (jwtSecret: string, jwt: string): any => {
	let token = jsonwebtoken.verify(jwt, jwtSecret);

	const now = moment(new Date());
	const refreshAt = moment(get(token, 'refresh_at'));
	if (refreshAt.isBefore(now, 'seconds')) {
		token = _refresh(token);
		jwt = jsonwebtoken.sign(token, jwtSecret);
		return {user: token, jwt};
	}
	return false;
};
export default jwtTokenRefresh;
