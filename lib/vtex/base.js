'use strict';

module.exports = class VtexBase {

	constructor(vtexApi, options) {
		this.vtexApi = vtexApi;
		this.options = options;
	}

	call(...args) {
		return this.vtexApi.call(...args);
	}

};
