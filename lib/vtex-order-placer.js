'use strict';

const logger = require('lllog')();

const VtexOrderPlacerError = require('./vtex-order-placer-error');
const OptionsValidator = require('./utils/options-validator');

const VtexApi = require('./vtex/api');
const VtexCatalog = require('./vtex/catalog');
const VtexCheckout = require('./vtex/checkout');
const VtexOrderForm = require('./vtex/order-form');
const VtexPayment = require('./vtex/payment');

const defaultOptions = {
	// Account options
	accountName: '',
	apiKey: '',
	apiToken: '',
	// Orders options
	placedOrdersQuantity: 1,
	placedOrdersConcurrency: 1,
	placeDifferentOrders: false,
	salesChannel: 1,
	seller: '1',
	// Items options
	itemsSearchText: '',
	itemsSearchFilter: {
		productId: null,
		skuId: null,
		referenceId: null,
		ean: null,
		categoryTree: null,
		priceRange: null,
		clusterId: null
	},
	minItemsQuantity: 1,
	maxItemsQuantity: 1,
	// Customer options
	customerEmail: '',
	// Shipping options
	country: 'ARG',
	deliveryPostalCode: '',
	// Payment options
	paymentSystemId: ''
};

class VtexOrderPlacer {

	constructor(options) {
		this._options = {
			...defaultOptions,
			...options
		};

		this.placedOrders = [];
	}

	get options() {
		return this._options;
	}

	async process() {

		logger.info('Validating options...');
		this.validateOptions();
		logger.info('Ok, we\'re good to go!');

		this.promptProcessConfiguration();

		const vtexApi = new VtexApi(this.options);

		logger.info('Fetching catalog and customer data...');
		const [
			availableSkus,
			userProfile
		] = await Promise.all([
			this.fetchCatalog(vtexApi),
			this.fetchUserProfile(vtexApi)
		]);

		logger.info('Simulating orderform...');
		const simulation = await this.simulateOrder(vtexApi, availableSkus, userProfile);

		logger.info('All good! Let\'s create the orders...');
		await this.placeOrders(vtexApi, simulation, userProfile);
	}

	validateOptions() {
		const validationResult = OptionsValidator(this.options);

		if(validationResult)
			throw new VtexOrderPlacerError(JSON.stringify(validationResult));
	}

	async fetchCatalog(vtexApi) {
		const vtexCatalog = new VtexCatalog(vtexApi, this.options);
		const searchResult = await vtexCatalog.searchSkus();

		return searchResult.map(({ items }) => items[0]);
	}

	fetchUserProfile(vtexApi) {
		const vtexCheckout = new VtexCheckout(vtexApi, this.options);
		return vtexCheckout.getProfile();
	}

	simulateOrder(vtexApi, availableSkus) {
		const vtexOrderForm = new VtexOrderForm(vtexApi, this.options);

		const {
			minItemsQuantity,
			maxItemsQuantity
		} = this.options;

		const itemsQty = Math.round(Math.random() * (maxItemsQuantity - minItemsQuantity)) + minItemsQuantity;

		return vtexOrderForm.simulate(availableSkus.slice(0, itemsQty));
	}

	async placeOrders(vtexApi, simulation, userProfile) {
		const checkout = new VtexCheckout(vtexApi, this.options);
		const payment = new VtexPayment(vtexApi, this.options);

		const {
			placedOrdersQuantity,
			placedOrdersConcurrency
		} = this.options;

		let remainingplacedOrdersCount = placedOrdersQuantity;

		while(remainingplacedOrdersCount > 0) {

			const ordersToPlace = Math.min(remainingplacedOrdersCount, placedOrdersConcurrency);
			logger.info(`Placing ${ordersToPlace} orders...`);
			const orderIds = await this.placeConcurrentOrders(checkout, payment, simulation, userProfile, ordersToPlace);
			logger.info('Done!');
			this.addPlacedOrders(orderIds);

			remainingplacedOrdersCount -= ordersToPlace;
		}
	}

	placeConcurrentOrders(checkout, payment, simulation, userProfile, quantity) {

		const promises = [];

		for(let i = 0; i < quantity; i++)
			promises.push(this.placeAndFulfilOrder(checkout, payment, simulation, userProfile));

		return Promise.all(promises);
	}

	async placeAndFulfilOrder(checkout, payment, simulation, userProfile) {
		const {
			orderPlaced,
			authToken
		} = await checkout.placeOrder(simulation, userProfile);

		await payment.sendPayment(orderPlaced, simulation, userProfile);

		await payment.processPayment(orderPlaced, authToken);

		return orderPlaced.orderId;
	}

	addPlacedOrders(orderIds) {
		this.placedOrders.push(...orderIds);
	}

	promptProcessConfiguration() {

		const {
			accountName,
			placedOrdersQuantity,
			minItemsQuantity,
			maxItemsQuantity
		} = this.options;

		const itemsQuantityMessage = minItemsQuantity === maxItemsQuantity ? `${minItemsQuantity}` : `${minItemsQuantity} to ${maxItemsQuantity}`;

		logger.info(`Processing for VTEX account ${accountName}`);
		logger.info(`Will create ${placedOrdersQuantity} orders of ${itemsQuantityMessage} items each.`);
	}

	printReport() {
		logger.info(`${this.placedOrders.length} orders placed!`);
		this.placedOrders.map(orderId => logger.info(orderId));
	}

}

module.exports = VtexOrderPlacer;
