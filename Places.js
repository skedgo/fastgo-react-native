import React, { Component } from 'react';
import {View} from 'react-native';
import MapView from 'react-native-maps';

import env from './env.js'
import greenImg from './assets/green.png';

export default class Places extends Component {

	constructor(props) {
		super(props);
		this.state = {
			places: [
				'mcdonalds',
				'starbucks',
				'atm']
		}

	    this.getLocations(this.props.currentPosition, this.state.places);
	}

	render() {
		return (<View/>)
	}

	getLocations(near, keywords) {
		keywords.map(keyword => {
			let type = keyword === 'atm' ? 'atm' : 'restaurant';
			let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`+
					`?location=${near.latitude},${near.longitude}&radius=5000&type=${type}&keyword=${keyword}&key=${env.GOOGLE_PLACES_API_KEY}`;
			fetch(url)
			.then(response => response.json())
			.then(response => {
				let places = new Array();
				response.results.map(place => {
					places.push({'latitude':place.geometry.location.lat, 
						'longitude':place.geometry.location.lng,
						'address':place.name,
						'key':place.place_id})
				})
				let newState = {};
				newState[keyword] = places;
				let update = keyword === this.props.selectedPlace;
				this.setState(newState, function() {
					if (update)
						this.props.update(places, this.state.places);
				});
			});
		})
	}

	getPlaces() {
		return this.state[this.props.selectedPlace];
	}

	getPlacesOptions() {
		return this.state.places;
	}
}