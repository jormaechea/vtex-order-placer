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

const MAX_SIMULATIONS = 5;

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
	paymentSystemId: null,
	interactiveShipping: false
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

		const hasAvailability = ({ commertialOffer }) => {
			return commertialOffer && !commertialOffer.GetInfoErrorMessage && commertialOffer.AvailableQuantity > 0;
		};

		const skus = searchResult
			.map(({ items }) => items)
			.flat(1)
			.filter(({ modalType, sellers }) => !modalType && sellers.some(hasAvailability));

		if(!skus.length)
			throw new Error('No SKUs were found');

		return skus;
	}

	async fetchUserProfile() {

		const profile = await this.vtexCheckout.getProfile();

		if(!profile.userProfile)
			throw new Error(`Profile for ${this.options.customerEmail} not found`);

		if(!profile.availableAddresses.length)
			throw new Error(`Profile for ${this.options.customerEmail} does not have any address`);

		return profile;
	}

	simulateOrder(availableSkus, userProfile) {

		const { placeDifferentOrders } = this.options;

		if(!placeDifferentOrders && this.simulationPromise)
			return this.simulationPromise;

		this.simulationPromise = this.ensureSimulationWithItems(availableSkus, userProfile);

		return this.simulationPromise;
	}

	async ensureSimulationWithItems(availableSkus, userProfile) {

		const {
			minItemsQuantity,
			maxItemsQuantity
		} = this.options;

		shuffle(availableSkus);

		const itemsQty = Math.round(Math.random() * (maxItemsQuantity - minItemsQuantity)) + minItemsQuantity;

		let simulation;
		let simulationsCount = 0;

		const simulationIsOk = (simulationTest, expectedItemsCount) => {
			return simulationTest.items.length === expectedItemsCount &&
				(!simulationTest.messages || !simulationTest.messages.length);
		};

		do {

			if(simulation && simulation.messages.length)
				this.removeSkusWithIssues(simulation.messages, availableSkus);

			simulationsCount++;
			const items = availableSkus.slice(0, itemsQty);
			simulation = await this.vtexOrderForm.simulate(items, userProfile);
		} while(simulationsCount < MAX_SIMULATIONS && !simulationIsOk(simulation, itemsQty));

		if(!simulationIsOk(simulation, itemsQty)) {
			const cause = `It may be insufficient items in your catalog or a Postal code without delivery options: ${JSON.stringify(simulation.messages)}`;
			throw new Error(`Order cannot be simulated after ${simulationsCount} attempts. ${cause}`);
		}

		return simulation;
	}

	removeSkusWithIssues(messages, skus) {
		messages.forEach(({ fields }) => {
			if(!fields.ean)
				return;

			const indexToRemove = skus.findIndex(({ ean }) => ean === fields.ean);

			if(indexToRemove >= 0)
				skus.splice(indexToRemove, 1);
		});
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

		try {
			const simulation = await this.simulateOrder(availableSkus, userProfile);

			const {
				orderPlaced,
				authToken
			} = await this.vtexCheckout.placeOrder(simulation, userProfile);

			await this.vtexPayment.sendPayment(orderPlaced, simulation, userProfile);

			await this.vtexPayment.processPayment(orderPlaced, authToken);

			return orderPlaced.orderId;
		} catch(err) {
			logger.error(`Failed to place an order: ${err.message}`);
		}
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
