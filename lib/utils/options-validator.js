'use strict';

const Validator = require('validatorjs');

const validationRules = {
	accountName: 'required|string',
	apiKey: 'required|string',
	apiToken: 'required|string',
	placedOrdersQuantity: 'required|integer|min:1',
	placedOrdersConcurrency: 'required|integer|min:1',
	placeDifferentOrders: 'boolean',
	salesChannel: 'required|integer|min:1',
	seller: 'required|string',
	itemsSearchText: 'string',
	'itemsSearchFilter.*.type': 'required|string',
	'itemsSearchFilter.*.value': 'required',
	minItemsQuantity: 'required|integer|min:1',
	maxItemsQuantity: 'required|integer|min:1',
	customerEmail: 'required|email',
	paymentSystemId: 'required|integer|min:1'
};

module.exports = options => {
	const validator = new Validator(options, validationRules);

	if(validator.passes())
		return;

	return validator.errors.all();
};
