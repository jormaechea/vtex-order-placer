'use strict';

const VtexBase = require('./base');

const endpoints = {
	sendPayment: 'https://{accountName}.vtexpayments.com.br/api/pub/transactions/{orderId}/payments',
	processPayment: 'https://{accountName}.myvtex.com/api/checkout/pub/gatewayCallback/{orderGroup}'
};

module.exports = class VtexPayment extends VtexBase {

	sendPayment(order, simulation, profile) {

		const {
			orderId,
			value,
			paymentData,
			storePreferencesData: { currencyCode }
		} = order;

		const transactionData = paymentData.transactions[0];

		return this.call('POST', endpoints.sendPayment, {
			pathParams: { orderId },
			body: [
				this.parsePayment(value, transactionData, currencyCode, simulation.paymentData, profile)
			]
		});
	}

	processPayment(order, authCookie) {

		const { orderGroup } = order;

		return this.call('POST', endpoints.processPayment, {
			pathParams: { orderGroup },
			headers: {
				Cookie: `Vtex_CHKO_Auth=${authCookie}`
			}
		});
	}

	parsePayment(value, transactionData, currencyCode, paymentData, profile) {

		const paymentSystemId = 401;
		const paymentSystemData = paymentData.paymentSystems.find(({ id }) => id === paymentSystemId);

		const currentDate = new Date();
		const currentMonth = `${currentDate.getMonth() + 1}`.padStart(2, '0');
		const nextYear = `${currentDate.getFullYear() + 1}`.substr(2);

		return {
			paymentSystem: paymentSystemId,
			paymentSystemName: paymentSystemData.name,
			group: paymentSystemData.groupName,
			installments: 1,
			installmentsInterestRate: 0,
			installmentsValue: value,
			value,
			referenceValue: value,
			fields: {
				holderName: 'Order Placer',
				cardNumber: '4111 1111 1111 1111',
				validationCode: '123',
				dueDate: `${currentMonth}/${nextYear}`,
				addressId: profile.availableAddresses[0].addressId
			},
			transaction: {
				id: transactionData.transactionId,
				merchantName: transactionData.merchantName
			},
			currencyCode
		};
	}

};
