'use strict';

const VtexBase = require('./base');

const endpoints = {
	simulate: 'https://{accountName}.myvtex.com/api/checkout/pub/orderforms/simulation'
};

module.exports = class VtexOrderForm extends VtexBase {

	async simulate(items) {

		const { data } = await this.call('POST', endpoints.simulate, {
			qs: {
				sc: this.options.salesChannel
			},
			body: {
				items: items.map(({ itemId: id }) => ({
					id,
					quantity: 1,
					seller: this.options.seller
				})),
				postalCode: this.options.deliveryPostalCode,
				country: this.options.country
			}
		});

		return data;
	}

};
