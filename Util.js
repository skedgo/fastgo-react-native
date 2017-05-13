

export default class Util {
	getFirstArrive(routingJSON, now) {
		let result = null;
		this.forEachTrip(routingJSON, (trip => {
			if (trip.depart <= now) {
				this.log('found one in the past')
				return;
			}
			if (result === null || result.arrive > trip.arrive) {
				this.log('found a faster: ' + JSON.stringify(trip.arrive));
				result = {};
				result.arrive = trip.arrive;
				result.depart = trip.depart;
				result.money = trip.moneyUSDCost;
				result.carbon = trip.carbonCost;
				result.currencySymbol = trip.currencySymbol;
				result.updateURL = trip.updateURL;
			}
		}))
		return result;
	}

	forEachTrip(routingJSON, callback) {
		routingJSON.groups.map(group => {
			group.trips.map(trip => {
				callback(trip)
			})
		});
	}

	log(message) {
		console.log(message)
	}

}