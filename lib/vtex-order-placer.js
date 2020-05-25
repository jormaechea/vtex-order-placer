'use strict';

const logger = require('lllog')();

const VtexOrderPlacerError = require('./vtex-order-placer-error');
const OptionsValidator = require('./utils/options-validator');

const { shuffle } = require('./utils/array');

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
	itemsSearchFilter: [],
	minItemsQuantity: 1,
	maxItemsQuantity: 1,
	// Customer options
	customerEmail: '',
	// Payment options
	paymentSystemId: null
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
		this.vtexPayment = new VtexPayment(vtexApi, this.options);
		this.vtexOrderForm = new VtexOrderForm(vtexApi, this.options);
		this.vtexCatalog = new VtexCatalog(vtexApi, this.options);
		this.vtexCheckout = new VtexCheckout(vtexApi, this.options);

		logger.info('Fetching catalog and customer data...');
		const [
			availableSkus,
			userProfile
		] = await Promise.all([
			this.fetchCatalog(),
			this.fetchUserProfile()
		]);

		logger.info('All good! Let\'s create the orders...');
		await this.placeOrders(availableSkus, userProfile);
	}

	validateOptions() {
		const validationResult = OptionsValidator(this.options);

		if(validationResult)
			throw new VtexOrderPlacerError(JSON.stringify(validationResult));
	}

	async fetchCatalog() {
		const searchResult = await this.vtexCatalog.searchSkus();

		return searchResult.map(({ items }) => items[0]);
	}

	fetchUserProfile() {
		return this.vtexCheckout.getProfile();
	}

	simulateOrder(availableSkus, userProfile) {
		const {
			placeDifferentOrders,
			minItemsQuantity,
			maxItemsQuantity
		} = this.options;

		if(!placeDifferentOrders && this.simulationPromise)
			return this.simulationPromise;

		const itemsQty = Math.round(Math.random() * (maxItemsQuantity - minItemsQuantity)) + minItemsQuantity;
		shuffle(availableSkus);
		this.simulationPromise = this.vtexOrderForm.simulate(availableSkus.slice(0, itemsQty), userProfile);

		return this.simulationPromise;
	}

	async placeOrders(availableSkus, userProfile) {
		const {
			placedOrdersQuantity,
			placedOrdersConcurrency
		} = this.options;

		let remainingplacedOrdersCount = placedOrdersQuantity;

		while(remainingplacedOrdersCount > 0) {

			const ordersToPlace = Math.min(remainingplacedOrdersCount, placedOrdersConcurrency);
			logger.info(`Placing ${ordersToPlace} orders...`);
			const orderIds = await this.placeConcurrentOrders(availableSkus, userProfile, ordersToPlace);
			logger.info('Done!');
			this.addPlacedOrders(orderIds);

			remainingplacedOrdersCount -= ordersToPlace;
		}
	}

	placeConcurrentOrders(availableSkus, userProfile, quantity) {

		const promises = [];

		for(let i = 0; i < quantity; i++)
			promises.push(this.placeAndFulfilOrder(availableSkus, userProfile));

		return Promise.all(promises);
	}

	async placeAndFulfilOrder(availableSkus, userProfile) {

		const simulation = await this.simulateOrder(availableSkus, userProfile);

		const {
			orderPlaced,
			authToken
		} = await this.vtexCheckout.placeOrder(simulation, userProfile);

		await this.vtexPayment.sendPayment(orderPlaced, simulation, userProfile);

		await this.vtexPayment.processPayment(orderPlaced, authToken);

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
