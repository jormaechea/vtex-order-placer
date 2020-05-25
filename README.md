# vtex-order-placer

[![Build Status](https://travis-ci.org/jormaechea/vtex-order-placer.svg?branch=master)](https://travis-ci.org/jormaechea/vtex-order-placer)
[![Coverage Status](https://coveralls.io/repos/github/jormaechea/vtex-order-placer/badge.svg?branch=master)](https://coveralls.io/github/jormaechea/vtex-order-placer?branch=master)
[![npm version](https://badge.fury.io/js/vtex-order-placer.svg)](https://www.npmjs.com/package/vtex-order-placer)

A package to place orders in VTEX eCommerce

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
  "accountName": "", // The VTEX account name
  "apiKey": "", // A valid API Key for your account
  "apiToken": "", // A valid API Token for your account
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
  "customerEmail": "", // The email of the customer for the order. This must be an existing customer with registered addresses
  "paymentSystemId": null // The payment system ID (Number) that should be used to place the orders
}
```
