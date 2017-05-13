'use strict';

var Env = {
	BASE_API_URL: "https://tripgo.skedgo.com/satapp/",
	TRIPGO_API_KEY: "YOUR_TRIPGO_API_KEY",
	GOOGLE_PLACES_API_KEY: "YOUR_GOOGLE_PLACES_API_KEY"

	GEOLOCATION_ENABLED: false,
	START_LOCATION: {'latitude': -33.8755296,"longitude": 151.2066007},
	REGION_CODE: "AU_NSW_Sydney",
	REGION: {
        latitude: -33.8755296,
        longitude: 151.2066007,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
}

module.exports = Env;
