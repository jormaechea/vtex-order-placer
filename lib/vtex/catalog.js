'use strict';

const { stringify } = require('qs');

const VtexBase = require('./base');

const endpoints = {
	search: 'https://{accountName}.myvtex.com/api/catalog_system/pub/products/search/'
};

module.exports = class VtexCatalog extends VtexBase {

	async searchSkus() {
		const { data } = await this.call('GET', endpoints.search, {
			qs: {
				sc: this.options.salesChannel,
				ft: this.options.itemsSearchText,
				...this.buildFilterQuery()
			},
			config: {
				paramsSerializer(parameters) {
					return stringify(parameters, { arrayFormat: 'repeat' });
				}
			}
		});

		return data;
	}

	buildFilterQuery() {

		const {
			salesChannel,
			itemsSearchFilter
		} = this.options;

		const typeMapping = {
			referenceId: 'alternateIds_RefId',
			ean: 'alternateIds_Ean',
			categoryTree: 'C',
			priceRange: 'P',
			clusterId: 'productClusterIds'
		};

		const fq = itemsSearchFilter.concat({
			type: `isAvailablePerSalesChannel_${salesChannel}`,
			value: '1'
		}).map(({ type, value }) => {
			const filterName = typeMapping[type] || type;

			if(type === 'priceRange')
				value = `[${value[0]} TO ${value[1]}]`;

			return `${filterName}:${value}`;
		});

		return { fq };
	}

};
