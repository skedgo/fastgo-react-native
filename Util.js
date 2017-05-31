

export default class Util {
	getBetterScore(routingJSON) {
		let result = null;
		this.forEachTrip(routingJSON, (trip => {
			if (result === null || result.score > trip.weightedScore) {
				result = {};
				result.arrive = trip.arrive;
				result.depart = trip.depart;
				result.money = trip.moneyUSDCost;
				result.carbon = trip.carbonCost;
				result.currencySymbol = trip.currencySymbol;
				result.score = trip.weightedScore;
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