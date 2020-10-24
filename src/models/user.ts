#!/usr/bin/env node
'use strict';

import {model, Schema} from 'mongoose';

export const UserSchema = new Schema(
	{
		provider: {type: String, required: true},
		providerId: {type: String, required: true},
		name: {type: String, required: true},
		email: {type: String, required: true},
		picture: {type: String, required: true}
	},
	{
		timestamps: true,
		versionKey: false
	}
);
const User = model('User', UserSchema, 'users');
export default User;
