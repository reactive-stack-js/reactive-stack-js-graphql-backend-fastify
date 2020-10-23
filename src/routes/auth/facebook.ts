#!/usr/bin/env node
"use strict";

import axios from "axios";

import authenticate from "../../_auth/_f.authenticate";

const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;

let _fbAppAccessToken: string;
const _getFbAppAccessToken = async (): Promise<string> => {
	if (!_fbAppAccessToken) {
		const url = `https://graph.facebook.com/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&grant_type=client_credentials`;
		const response = await axios.get(url);
		_fbAppAccessToken = response.data.access_token;
	}
	return _fbAppAccessToken;
};

const _getUserAccessToken = async (code: string, redirectUri: string): Promise<any> => {
	const url = `https://graph.facebook.com/v5.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${redirectUri}&code=${code}`;
	const response = await axios.get(url);

	const {data} = response;
	if (!!data && !!data.access_token) return data;
	return null;
};

const _getProviderId = async (accessToken: string): Promise<any> => {
	const url = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${_fbAppAccessToken}`;
	const response = await axios.get(url);
	return response.data.data;
};

const _getUserData = async (id: string, accessToken: string): Promise<any> => {
	const url = `https://graph.facebook.com/${id}?fields=email,name,picture,friends&access_token=${accessToken}`;
	const response = await axios.get(url);
	const {data} = response;

	return {
		provider: "facebook",
		providerId: data.id,
		name: data.name,
		email: data.email,
		picture: data.picture.data.url
	};
};

module.exports = {
	method: "POST",
	url: "/auth/facebook",
	handler: async (request: any, reply: any): Promise<void> => {
		await _getFbAppAccessToken();
		const {code, redirect_uri} = request.body;

		const {access_token, expires_in} = await _getUserAccessToken(code, redirect_uri);
		if (access_token) {
			const providerIdData = await _getProviderId(access_token);
			const {user_id} = providerIdData;
			const facebookUser = await _getUserData(user_id, access_token);

			const user = await authenticate(facebookUser, expires_in);
			const jwt = await reply.jwtSign(user);
			return reply.send({jwt, user});
		}

		reply.send({error: "oops"});
	},
};
