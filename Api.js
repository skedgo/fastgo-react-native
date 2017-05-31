
import env from './env.js'
import Util from './Util.js'

const util = new Util();

export default class Api {
	getRegions() {
		return fetch(env.BASE_API_URL + 'regions.json', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-TripGo-Key': env.TRIPGO_API_KEY 
			},
			body: JSON.stringify({
				v: '2',
			})
		})
		.then((response) => response.json());
	}

	computeFastestTrip(baseURLs, selectedMode, selectedPlaces, currentPosition) {
		let promises = [];
		let result = [];
		selectedPlaces.map((place, i) => {
			promises.push(
				this.computeTrip(baseURLs[0], selectedMode, currentPosition, place)
				.then((routingJSON => {
					if (routingJSON.hasOwnProperty('error')) {
						util.log(routingJSON);
						return
					}

					if (!routingJSON.hasOwnProperty('groups')) {
						return
					}

					representativeTrip = util.getBetterScore(routingJSON);

					result.push({
						'routingJSON': routingJSON, 
						'updateURL': representativeTrip.updateURL, 
						'arrive': representativeTrip.arrive,
						'depart': representativeTrip.depart,
						'carbon': representativeTrip.carbon,
						'money': representativeTrip.money,
						'currencySymbol': representativeTrip.currencySymbol,
						'place': place
					})
				}))
				);
		});
		return Promise.all(promises).then(() => {
			return result.sort((a, b) => {
				return a.arrive-b.arrive;
			});
		});
	}

	computeTrip(baseUrl, selectedMode, fromLoc, toLoc) {
		data = {
			fromLoc: `(${fromLoc.latitude},${fromLoc.longitude})`,
			toLoc: `(${toLoc.latitude},${toLoc.longitude})`,
			mode: selectedMode,
			wp: '(1,1,1,1)',
			v: 11,
			includeStops: true
		}
		let url = baseUrl + '/routing.json'+ 
		`?from=${data.fromLoc}&to=${data.toLoc}&modes=${data.mode}&wp=${data.wp}&v=${data.v}&includeStops=${data.includeStops}`
		return fetch(url, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-TripGo-Key': env.TRIPGO_API_KEY 
			}
		})
		.then((response) => response.json())
	}

	getModes(regionsJSON, regionName) {
		let modes = regionsJSON.modes;
		var result = new Array();
		regionsJSON.regions.map(region => {
			if (region.name.localeCompare(regionName) != 0) 
				return;

			region.modes.map(mode => {
				modes[mode].mode = mode;
				result.push(modes[mode]);
			});
		})  
		return result;
	}

	getURLs(regionsJSON, regionName) {
		let modes = regionsJSON.modes;
		var result = null;
		regionsJSON.regions.map(region => {
			if (region.name.localeCompare(regionName) != 0) 
				return;

			result = region.urls;
		})  
		return result;
	}

	updateTrip(updateUrl) {
	  let url = updateUrl + '&v=11';
	  return fetch(url, {
	      method: 'GET',
	      headers: {
	        'Accept': 'application/json',
	        'X-TripGo-Key': env.TRIPGO_API_KEY
	      }
	    })
	    .then((response) => {
	      return response.json()
	      .catch(err => {
	        return {};
	      });;
	    })
	}


}