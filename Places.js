import React, { Component } from 'react';
import {View} from 'react-native';
import MapView from 'react-native-maps';

import env from './env.js'
import greenImg from './assets/green.png';


export default class Places extends Component {

	constructor(props) {
		super(props);
		this.state = {
			places: props.places,
		}
	}

	places() {
		return this.state.places;
	}

	render() {
		let place = this.state.places[0];
		return (
        	<MapView.Marker
	              title={place.address}
	              key={place.key}
	              image={greenImg}
	              coordinate={place}
            />
		)
	}

}