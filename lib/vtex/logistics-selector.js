'use strict';

const prompts = require('prompts');
const moment = require('moment');
const logger = require('lllog')();

const formatWindowForUser = deliveryWindow => {

	const windowStart = moment(deliveryWindow.startDateUtc);
	const windowEnd = moment(deliveryWindow.endDateUtc);
	const date = windowStart.format('dddd DD/MM');

	return `${date} from ${windowStart.format('HH:mm')} to ${windowEnd.format('HH:mm')}`;
};

const prompt = options => prompts(options, {
	onCancel: () => {
		logger.info('Process canceled!');
		process.exit();
	}
});

module.exports = class LogisticsSelector {

	async selectLogisticsForAllitems(logisticsInfo) {

		const allItemsLogistics = [];

		let sameLogisticsForAllItems;

		for(const itemLogistic of logisticsInfo) {

			const { itemIndex } = itemLogistic;

			let itemSelectedLogistics;

			if(itemIndex > 0 && sameLogisticsForAllItems && this.tryToSelectSameLogistics(itemLogistic, allItemsLogistics[0]))
				itemSelectedLogistics = this.tryToSelectSameLogistics(itemLogistic, allItemsLogistics[0]);
			else
				itemSelectedLogistics = await this.promptLogisticsOptions(itemLogistic);

			const { selectedSla, selectedWindow, pickSameLogistic } = itemSelectedLogistics;

			allItemsLogistics.push({
				itemIndex,
				selectedSla: selectedSla.id,
				price: selectedSla.price,
				...(selectedWindow ? { deliveryWindow: selectedWindow } : {})
			});

			if(itemIndex === 0)
				sameLogisticsForAllItems = !!pickSameLogistic;
		}

		return allItemsLogistics;
	}

	async promptLogisticsOptions({ itemIndex, slas }) {

		const slaOptions = slas.map(sla => ({
			title: sla.name,
			value: sla
		}));

		const { selectedSla } = await prompt([{
			type: 'select',
			name: 'selectedSla',
			message: `Choose a SLA to use for item ${itemIndex}?`,
			choices: slaOptions
		}]);

		const { selectedWindow } = selectedSla.availableDeliveryWindows ? await prompt([{
			type: 'select',
			name: 'selectedWindow',
			message: `Choose a delivery windows for item ${itemIndex}`,
			choices: selectedSla.availableDeliveryWindows.map(deliveryWindow => ({
				title: formatWindowForUser(deliveryWindow),
				value: deliveryWindow
			}))
		}]) : null;

		const { pickSameLogistic } = itemIndex === 0 ? await prompt([{
			type: 'toggle',
			name: 'pickSameLogistic',
			message: 'Do you want to use the same SLA for every item?',
			initial: true,
			active: 'yes',
			inactive: 'no'
		}]) : {};

		return {
			selectedSla,
			selectedWindow,
			pickSameLogistic
		};
	}

	tryToSelectSameLogistics({ slas }, firstLogisticChoice) {

		const selectedSla = slas.find(({ id }) => id === firstLogisticChoice.selectedSla);

		if(!selectedSla)
			return;

		const selectedWindow = selectedSla.availableDeliveryWindows
			? selectedSla.availableDeliveryWindows.find(({ startDateUtc, endDateUtc, price }) => {
				return startDateUtc === firstLogisticChoice.deliveryWindow.startDateUtc
					&& endDateUtc === firstLogisticChoice.deliveryWindow.endDateUtc
					&& price === firstLogisticChoice.deliveryWindow.price;
			})
			: null;

		// Check if both have windows or if none of them have
		if(!selectedWindow !== !firstLogisticChoice.deliveryWindow)
			return;

		return {
			selectedSla,
			selectedWindow
		};
	}

};
