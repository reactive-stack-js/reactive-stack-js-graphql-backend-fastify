#!/usr/bin/env node
'use strict';

import * as _ from "lodash";
import * as moment from "moment";
import * as jsonwebtoken from "jsonwebtoken";

import {refresh} from "../util/_f.authenticate";

const jwtRefresh = (jwtSecret: string, jwt: any): any => {
	let user = jsonwebtoken.verify(jwt, jwtSecret);

	const now = moment(new Date());
	const refreshAt = moment(_.get(user, 'refresh_at'));
	if (refreshAt.isBefore(now, 'seconds')) {
		user = refresh(user);
		jwt = jsonwebtoken.sign(user, jwtSecret);
		return {user, jwt};
	}
	return false;
};
export default jwtRefresh;
