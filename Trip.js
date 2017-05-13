import React, { Component } from 'react';
import {View, Dimensions, Text, Image, StyleSheet} from 'react-native';
import MapView from 'react-native-maps';
import Polyline from 'polyline';
import Swiper from 'react-native-swiper'

const { width, height } = Dimensions.get('window');
const swiperHeight = 80;

import env from './env.js'
import redImg from './assets/red.png';
import Util from './Util.js'
import Api from './Api.js'

const util = new Util();
const api = new Api();


export default class Trip extends Component {
	
	constructor(props) {
		super(props);
		this.state = {
			selected: 0
		}
	}

	componentDidMount() {
	    setInterval(() => {
	      if (this.props.trips.length !== 0) {
  			let trip = this.props.trips[this.state.selected];
  			if (trip.updateURL === undefined)
  				return;
	        api.updateTrip(trip.updateURL)
	        .then((routingJSON) => {
	          if (Object.keys(routingJSON).length === 0)
	            return;
	          let arrive = util.getFirstArrive(routingJSON, 0);
	          this.draw({'routingJSON': routingJSON, 
          	          'arrive': arrive.arrive,
			          'depart': arrive.depart,
			          'carbon': arrive.carbon,
			          'money': arrive.money,
			          'currencySymbol': arrive.currencySymbol,
			          'updateURL': arrive.updateURL});
	        });
	      }
	    }, 5000);
	}

	render() {
		if (this.props.trips.length == 0) {
			return (<View/>)
		}

		return (
			<Swiper style={styles.wrapper} 
				height={swiperHeight}
				onMomentumScrollEnd={(e, state, context) => { this.selectTrip(state.index) }}
				dot={<View style={styles.dot} />}
				activeDot={<View style={styles.activeDot} />}
				paginationStyle={styles.paginationStyle}
				loop={false}>
				{this.props.trips.map(trip => (
					<View 
		            	key={trip.place.key}
						style={styles.slide}>
						<Text style={styles.time}>{new Date(trip.depart * 1000).toLocaleTimeString() + ' - ' + new Date(trip.arrive * 1000).toLocaleTimeString()}</Text>
						<Text style={styles.icons}>{trip.place.address}</Text>
						<Text style={styles.line}></Text>
						<Text style={styles.footer}>{trip.currencySymbol}{trip.money} - {trip.carbon}kg CO2</Text>
					</View>
				))}
			</Swiper>);
	}

	selectTrip(index = 0) {
		this.setState(
			{selected: index},
			() => this.props.update(this.draw())
		);
	}

	drawFaster() {
		this.selectTrip();
	}

	draw(faster = this.props.trips[this.state.selected]) {
		let trip = this.buildSelectedTrip(faster.routingJSON, faster.updateURL);

		result = {
			'segments': [],
			'start': null,
			'end': null,
			'stops': []
		};
		let first = true;
		trip.segments.map(segment => {
			if (segment.hasOwnProperty('location')) {
				if (first) {
					result.start = {'key': 'start', 'latitude':segment.location.lat, 'longitude':segment.location.lng};
					first = false;
				}
				return;
			}
			if (first) {
				result.start = {'key': 'start', 'latitude':segment.from.lat, 'longitude':segment.from.lng};
				first = false;
			}
			let segmentWaypoints = new Array();
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
					segmentWaypoints.push(tempLocation);
				}
				if (waypoint.hasOwnProperty('stops')) {
					waypoint.stops.map(stop => {
						result.stops.push({'key': stop.code, 'name': stop.name, 'latitude':stop.lat, 'longitude':stop.lng});
					});
				}
			})
			let color = '#000';
			if (segment.hasOwnProperty('serviceColor')) {
				color = 'rgb(' + segment.serviceColor.red + ',' + segment.serviceColor.green + ',' + segment.serviceColor.blue + ')';
			}
			result.segments.push({'key': segment.segmentTemplateHashCode, 'waypoints': segmentWaypoints, 'color': color});
			result.end = {'key': 'end', 'latitude':segment.to.lat, 'longitude':segment.to.lng};
		})

		return result;
	}

	buildSelectedTrip(routingJSON, seletedTripUpdateURL) {
		let result = null;
		let segmentTemplates = routingJSON.segmentTemplates;
		util.forEachTrip(routingJSON, (trip => {
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

}

const styles = {
  wrapper: {
  	backgroundColor: 'white'
  },

  slide: {
    flex: 1,
    justifyContent: 'center',
  	backgroundColor: 'white'
  },

  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  },


  time: {
    marginTop: 5,
  	paddingVertical: 3,
    marginHorizontal: 10,
    flex: 0.3
  },

  icons: {
  	textAlign: 'center',
    marginHorizontal: 10,
    flex: 0.39
  },

  line: {
    marginHorizontal: 10,
    flex: 0.001,
	borderColor: 'grey',
	borderWidth: 1,
  },

  footer: {
    marginHorizontal: 10,
  	textAlign: 'right',
    marginTop: 5,
    flex: 0.3,
  },

  dot: {
  	backgroundColor: 'rgba(0,0,0,.2)', 
  	width: 5, 
  	height: 5, 
  	borderRadius: 4, 
  	marginLeft: 3, 
  	marginRight: 3, 
  	marginTop: 3, 
  	marginBottom: 3
  },

  activeDot: {
  	backgroundColor: '#000', 
  	width: 8, 
  	height: 8, 
  	borderRadius: 4, 
  	marginLeft: 3, 
  	marginRight: 3, 
  	marginTop: 3, 
  	marginBottom: 3
  },

  paginationStyle: {
	bottom: swiperHeight
  }
}
