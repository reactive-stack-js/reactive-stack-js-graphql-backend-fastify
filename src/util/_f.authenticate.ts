#!/usr/bin/env node
"use strict";
import * as _ from "lodash";

import User from "../models/user";
import jwtTokenTimes from "./_f.jwt.token.times";

const authenticate = async (providerUser: any): Promise<any | null> => {
	if (!providerUser) return null;

	let dbUser = await User.findOne({providerId: providerUser.providerId});
	if (!dbUser) {
		dbUser = new User(providerUser);
		dbUser = await dbUser.save();
	}

	if (!dbUser) return undefined;

	return _.merge(_.pick(dbUser, ["id", "name", "email", "picture", "provider", "providerId"]), jwtTokenTimes());
};
export default authenticate;