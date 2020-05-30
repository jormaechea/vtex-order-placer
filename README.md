<p align="center">
  <img src="https://github.com/jormaechea/vtex-order-placer/raw/master/assets/bot.png" alt="Bot" width="160" />
</p>

<h1 align="center">VTEX Order Placer</h1>


<p align="center">

	<a href="https://www.npmjs.com/package/vtex-order-placer">
		<img src="https://badge.fury.io/js/vtex-order-placer.svg" alt="npm version" />
	</a>

	<a href="https://travis-ci.org/jormaechea/vtex-order-placer">
		<img src="https://travis-ci.org/jormaechea/vtex-order-placer.svg?branch=master" alt="Build status" />
	</a>

	<a href="https://coveralls.io/github/jormaechea/vtex-order-placer?branch=master">
		<img src="https://coveralls.io/repos/github/jormaechea/vtex-order-placer/badge.svg?branch=master" alt="Coverage status" />
	</a>

</p>

<p align="center">
	A package to place orders in VTEX eCommerce
</p>

## Important

This package is still Work in progress. It's API may change until it reaches v1.

## Installation

```sh
npm install vtex-order-placer
```

Or you can also install it globally to use as a CLI command anywhere:

```sh
npm install --global vtex-order-placer
```

Or you can just run it without installing:

```sh
npx vtex-order-placer
```

## Configuration file

The runtime configurations are handled by a `.vtexrc` file, normally created in your project root dir, or in the current directory if running with npx.

This package uses [rc](https://www.npmjs.com/package/rc) to load config file. It will look for it in [this locations](https://www.npmjs.com/package/rc#standards).

You can also pass options by setting env variables or passing cli arguments (see rc documentation for more details).

This are the available configuration options with it's default values:

```
{
  "accountName": "", // REQUIRED. The VTEX account name
  "apiKey": "", // REQUIRED. A valid API Key for your account
  "apiToken": "", // REQUIRED. A valid API Token for your account
  "customerEmail": "", // REQUIRED. The email of the customer for the order. This must be an existing customer with registered addresses
  "paymentSystemId": null, // REQUIRED. The payment system ID (Number) that should be used to place the orders
  "placedOrdersQuantity": 1, // The amount of orders you want to place
  "placedOrdersConcurrency": 1, // The amount of orders that will be placed concurrently
  "placeDifferentOrders": false, // Whether or not every order should be different from each other
  "salesChannel": 1, // The sales channel where orders will be placed
  "seller": "1", // The seller where orders will be placed
  "itemsSearchText": "", // Some text to search products that will be used for placing orders
  "itemsSearchFilter": [] // Filters to search products that will be used for placing orders.
                          // Each element of the array must be an object with two properties: `type` and `value`. `type` can be one of the following: `productId`, `skuId`, `referenceId`, `ean`, `categoryTree`, `priceRange`, `clusterId`
  "minItemsQuantity": 1, // Min quantity of different SKUs that each order must contain
  "maxItemsQuantity": 1, // Max quantity of different SKUs that each order must contain
  "interactiveShipping": false // Indicates if the logistic of each item should be selected by user or automatically
}
```
