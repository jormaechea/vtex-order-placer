'use strict';

const axios = require('axios');

module.exports = class VtexApi {

	constructor({ accountName, apiKey, apiToken }) {
		this.accountName = accountName;
		this.apiKey = apiKey;
		this.apiToken = apiToken;
	}

	call(method, url, {
		headers,
		qs,
		accountInQs,
		body,
		pathParams,
		config: configExtension
	} = {}) {

		const config = {
			method,
			url: this.buildUrl(url, pathParams),
			headers: this.addCommonHeaders(headers, !!body),
			...configExtension
		};

		if(accountInQs)
			qs = { ...qs, an: this.accountName };

		if(qs)
			config.params = qs;

		if(body)
			config.data = body;

		return axios(config);
	}

	buildUrl(url, pathParams) {

		const replacements = {
			...pathParams,
			accountName: this.accountName
		};

		return Object.entries(replacements)
			.reduce((builtUrl, [paramName, paramValue]) => builtUrl.replace(`{${paramName}}`, paramValue), url);
	}

	addCommonHeaders(headers, hasBody) {
		return {
			...headers,
			'X-VTEX-API-AppKey': this.apiKey,
			'X-VTEX-API-AppToken': this.apiToken,
			...(hasBody ? { 'content-type': 'application/json' } : {})
		};
	}

};
