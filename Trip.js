import React, { Component } from 'react';
import {View} from 'react-native';
import MapView from 'react-native-maps';
import Polyline from 'polyline';

import env from './env.js'
import redImg from './assets/red.png';


export default class Trip extends Component {
	
	constructor(props) {
		super(props);
	}

	render() {
		if (this.props.trip === null)
			return <View/>
		return (
			<MapView.Polyline
			key="polyline"
			coordinates={this.draw(this.props.trip)}
			strokeColor="#000"
			fillColor="rgba(255,255,255,0.5)"
			strokeWidth={5}
			/>
		);
	}


	draw(faster) {
		let trip = this.buildSelectedTrip(faster.routingJSON, faster.updateURL);
		this.log(trip);
		result = new Array();
		trip.segments.map(segment => {
			if (segment.hasOwnProperty('location')) {
				result.push({'latitude':segment.location.lat, 'longitude':segment.location.lng});
				return;
			}
			result.push({'latitude':segment.from.lat, 'longitude':segment.from.lng});
			waypoints = segment.hasOwnProperty('streets') ? segment.streets : segment.shapes;
			waypoints.map(waypoint => {
				if (waypoint.hasOwnProperty('travelled') && !waypoint.travelled)
					return;
				let steps = Polyline.decode(waypoint.encodedWaypoints);
				for (let i=0; i < steps.length; i++) {
					let tempLocation = {
						latitude : steps[i][0],
						longitude : steps[i][1]
					}
					result.push(tempLocation);
				}
			})
			result.push({'latitude':segment.to.lat, 'longitude':segment.to.lng});
		})
		return result;
	}

	buildSelectedTrip(routingJSON, seletedTripUpdateURL) {
		let result = null;
		let segmentTemplates = routingJSON.segmentTemplates;
		this.forEachTrip(routingJSON, (trip => {
			if (trip.updateURL !== seletedTripUpdateURL)
				return;
			trip.segments.map(segment => {
				segmentTemplate = this.getSegmentTemplate(segmentTemplates, segment.segmentTemplateHashCode);
				for (var key in segmentTemplate)
					segment[key] = segmentTemplate[key];
			})
			result = trip;
		}));
		return result;
	}

	getSegmentTemplate(templates, hash) {
		let result = null;
		templates.map(template => {
			if (template.hashCode === hash)
				result = template;
		})
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
