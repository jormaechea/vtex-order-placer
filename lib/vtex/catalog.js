'use strict';

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
				...this.buildFilterQuery(this.options.itemsSearchFilter || {})
			}
		});

		return data;
	}

	buildFilterQuery({
		productId,
		skuId,
		referenceId,
		ean,
		categoryTree,
		priceRange,
		clusterId
	}) {

		if(productId)
			return { fq: `productId:${productId}` };

		if(skuId)
			return { fq: `skuId:${skuId}` };

		if(referenceId)
			return { fq: `alternateIds_RefId:${referenceId}` };

		if(ean)
			return { fq: `alternateIds_Ean:${ean}` };

		if(categoryTree)
			return { fq: `C:${categoryTree}` };

		if(priceRange && priceRange.length === 2)
			return { fq: `P:[${priceRange[0]} TO ${priceRange[1]}]` };

		if(clusterId)
			return { fq: `productClusterIds:${clusterId}` };
	}

};
