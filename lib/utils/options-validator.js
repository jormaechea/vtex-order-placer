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
	itemsSearchFilter: {
		productId: 'string',
		skuId: 'string',
		referenceId: 'string',
		ean: 'string',
		categoryTree: 'string',
		priceRange: 'string',
		clusterId: 'string'
	},
	minItemsQuantity: 'required|integer|min:1',
	maxItemsQuantity: 'required|integer|min:1',
	customerEmail: 'required|email',
	country: 'required|string|size:3',
	deliveryPostalCode: 'required|string',
	paymentSystemId: 'required|string'
};

module.exports = options => {
	const validator = new Validator(options, validationRules);

	if(validator.passes())
		return;

	return validator.errors.all();
};
