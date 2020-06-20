'use strict';

const VtexBase = require('./base');
const LogisticsSelector = require('./logistics-selector');

const endpoints = {
	getProfile: 'http://{accountName}.myvtex.com/api/checkout/pub/profiles?email={email}',
	placeOrder: 'http://{accountName}.myvtex.com/api/checkout/pub/orders'
};

module.exports = class VtexCheckout extends VtexBase {

	constructor(...args) {
		super(...args);
		this.logisticsSelector = new LogisticsSelector();
	}

	async getProfile() {
		const { data } = await this.call('GET', endpoints.getProfile, {
			pathParams: {
				email: this.options.customerEmail
			}
		});

		return data;
	}

	async placeOrder(simulation, profile) {

		const order = {
			items: this.parseOrderItems(simulation.items),
			clientProfileData: this.parseClientProfile(profile.userProfile),
			shippingData: {
				id: 'shippingData',
				address: this.parseShippingAddress(profile.availableAddresses),
				logisticsInfo: await this.parseLogisticsInfo(simulation.logisticsInfo)
			}
		};

		order.paymentData = this.parsePayments(simulation.paymentData, order);

		const { data, headers } = await this.call('PUT', endpoints.placeOrder, {
			body: order
		});

		return {
			orderPlaced: data.orders[0],
			authToken: this.parseAuthToken(headers)
		};
	}

	parseAuthToken(headers) {
		const authCookie = headers['set-cookie'].find(cookie => cookie.startsWith('Vtex_CHKO_Auth'));
		return authCookie
			.split(';')[0]
			.split('=')
			.slice(1)
			.join('');
	}

	parseOrderItems(items) {
		return items.map(({
			id,
			quantity,
			seller,
			price,
			sellingPrice,
			rewardValue,
			offerings,
			priceTags,
			isGift
		}) => ({
			id,
			quantity,
			seller,
			price,
			sellingPrice,
			rewardValue,
			offerings,
			priceTags,
			isGift: !!isGift
		}));
	}

	parseClientProfile({ email }) {
		return {
			email
		};
	}

	parseShippingAddress(availableAddresses) {
		return availableAddresses[0];
	}

	parseLogisticsInfo(logisticsInfo) {

		const { interactiveShipping } = this.options;

		if(interactiveShipping)
			return this.logisticsSelector.selectLogisticsForAllitems(logisticsInfo);

		let orderSlaId;

		return logisticsInfo.map(({
			itemIndex,
			slas
		}) => {

			const sla = orderSlaId ? slas.find(({ id }) => id === orderSlaId) : slas[0];
			if(!orderSlaId)
				orderSlaId = sla.id;

			const deliveryWindow = sla.availableDeliveryWindows && sla.availableDeliveryWindows.length ? sla.availableDeliveryWindows[0] : null;

			return {
				itemIndex,
				selectedSla: sla.id,
				price: sla.price,
				...(deliveryWindow ? { deliveryWindow } : {})
			};
		});
	}

	parsePayments(paymentData, { items, shippingData }) {

		const { paymentSystemId } = this.options;

		let value = items.reduce((acum, { sellingPrice }) => acum + sellingPrice, 0);
		value = shippingData.logisticsInfo.reduce((acum, { price, deliveryWindow }) => {
			return acum + price + ((deliveryWindow && deliveryWindow.price) || 0);
		}, value);

		return {
			id: 'paymentData',
			payments: [{
				paymentSystem: paymentSystemId,
				value,
				referenceValue: value,
				installments: 1
			}]
		};
	}

};
