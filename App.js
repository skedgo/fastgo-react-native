import React, { Component } from 'react';
import { ActivityIndicator, Button, Picker, Text, View, Alert, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';
import PickerFast from './Picker.js'
import TimerMixin from 'react-timer-mixin';

import env from './env.js'
import redImg from './assets/red.png';
import greenImg from './assets/green.png';
import stopImg from './assets/stop.png';

import Trip from './Trip.js';
import Places from './Places.js';
import Util from './Util.js'
import Api from './Api.js'

const util = new Util();
const api = new Api();

export default class FastGo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      selectedMode: 'pt_pub',
      selectedPlaces: 'mcdonalds',
      currentPosition: env.START_LOCATION,
      modes: [
        {"mode": "pt_pub", "title": "Public Transport"}, 
        {"mode": "me_car", "title": "Car"}, 
        {"mode": "ps_tax", "title": "Taxi"}],
      baseURL: "https://api.tripgo.com/v1/",
      placesOptions: [],
      places: [],
      trips: [],
      trip: null,      
      message: null,
      region: env.REGION,
      nextRegion: null,
    }
  }

  componentDidMount() {
    let updateLocation = (newLocation) => {
      newLocation.latitudeDelta = 0.04;
      newLocation.longitudeDelta = 0.04;
      this.setState({'currentPosition': newLocation, 'region': newLocation});
    }

    if (env.GEOLOCATION_ENABLED) {  
      navigator.geolocation.getCurrentPosition(
        (position) => updateLocation(position.coords),
        (error) => util.log(JSON.stringify(error)),
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
      );
    } else {
      updateLocation(env.START_LOCATION)
    }
    this.setState({isLoading: false});
    console.log("start");    
    return true;
  }

  update(places, placesOptions) {
      if (places === undefined) {
        places = this.refs.places.getPlaces();
        placesOptions = this.refs.places.getPlacesOptions();
      } 
      this.setState({
          places,
          placesOptions, 
          'message': null,
          'trips': [],
          'trip': null},
        () => {this.map.fitToElements(true)})
    }

  updateTrip(trip) {
    this.setState({'trip':trip},
      () => {this.map.fitToElements(true)})

  }

  render() {
    if (this.state.isLoading) {
      return (
        <View style={styles.container}>
          <MapView
            style={styles.map}
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            region={this.state.region}
          />
        </View>
      );
    }
    
    let onGoPress = () => {
      this.setState({'showPlaceSelector': false,'showModeSelector': false, message: 'Computing Trips... '})
      return api.computeFastestTrip(this.state.baseURL,
                                this.state.selectedMode, 
                                this.state.places,
                                this.state.currentPosition)
      .then((fastestTrip) => {
        if (fastestTrip[0].routingJSON === null) {
          this.setState({
              message: 'Error: ' + fastestTrip[0].error.error 
          })
        } else {
          this.setState({
              message: null,
              trips: fastestTrip
          },() => this.refs.trips.drawFaster())
        }
      })
      .catch((error) => {
        console.error(error);
      });
    };

    let modesItems = this.state.modes.map( (s, i) => {
        return <Picker.Item key={i} value={s.mode} label={s.title} />
    });

    let placesItems = this.state.placesOptions.map( (s, i) => {
        return <Picker.Item key={i} value={s} label={s} />
    });

    let getPlaces = (key) => {
      return this.state.places[key];
    }

    return (
      <View style={styles.container}>
        <MapView
            style={styles.map}
            ref={ref => { this.map = ref; }} 
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            initialRegion={this.state.region}
        >
          {this.state.currentPosition !== null && this.state.trip === null && 
            <MapView.Marker
              title='You are here'
              key='current'
              image={redImg}
              coordinate={this.state.currentPosition}
              centerOffset={{'x': 0, 'y': -20}}
            />
          }
          <Places 
            selectedPlace={this.state.selectedPlaces}
            currentPosition={this.state.currentPosition}
            places={this.state.places}
            ref='places'
            update={this.update.bind(this)}
          />
          {this.state.trip === null && this.state.places.map(place => (
            <MapView.Marker
              title={place.address}
              key={place.key}
              image={greenImg}
              coordinate={place}
              centerOffset={{'x': 0, 'y': -20}}
            />
          ))}
          {this.state.trip !== null && this.state.trip.segments.map(segment => (
              <MapView.Polyline
                key={segment.key}
                coordinates={segment.waypoints}
                strokeColor={segment.color}
                fillColor="rgba(255,255,255,0.5)"
                strokeWidth={5}
              />
          ))}
          {this.state.trip !== null && this.state.trip.start !== null && 
              <MapView.Marker
                key={this.state.trip.start.key}
                image={redImg}
                coordinate={this.state.trip.start}
                centerOffset={{'x': 0, 'y': -20}}
              />
          }
          {this.state.trip !== null && this.state.trip.end !== null && 
              <MapView.Marker
                key={this.state.trip.end.key}
                image={greenImg}
                coordinate={this.state.trip.end}
                centerOffset={{'x': 0, 'y': -20}}
              />
          }
          {this.state.trip !== null && this.state.trip.stops.map(stop => (
              <MapView.Marker
                key={stop.key}
                image={stopImg}
                coordinate={stop}
              />
          ))}
        </MapView>
        <View style={styles.buttonContainer}>
          <PickerFast
            items={this.state.modes}
            selectedItem={this.state.selectedMode}
            onValueChange={(mode) => this.setState({selectedMode: mode},
                              () => this.update())}
          />
          <PickerFast
            items={this.state.placesOptions}
            selectedItem={this.state.selectedPlaces}
            onValueChange={(place) => this.setState({selectedPlaces: place},
                              () => this.update())}
          />
          <TouchableOpacity
            onPress={onGoPress}
            style={[styles.bubble, styles.button]}
          >
            <Text>FastGo!</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mapSpace}>
        </View>
        <View style={styles.swiper}>
          <Trip 
            trips={this.state.trips}
            ref='trips'
            update={this.updateTrip.bind(this)}
          />
          {this.state.message !== null && 
            <View style={[styles.bubble, styles.message]}>
              <Text style={{ textAlign: 'center' }}>
                {this.state.message}
              </Text>
            </View>
          }
        </View>
      </View>
    );
  }
}

const { width, height } = Dimensions.get('window');
const SCREEN_WIDTH = width;
const SCREEN_HEIGHT = height;
const ASPECT_RATIO = width / height;

const styles = StyleSheet.create({
  container: {
    flex: 1, 
  },
  buttonContainer: {
    flex: 0.1,
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  mapSpace: {
    flex: 0.75,
    zIndex: -1
  },
  swiper: {
    flex: 0.15,
  },

  bubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  button: {
    flex: 0.33,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    ...StyleSheet.absoluteFillObject,
  },
  message: {
    width: SCREEN_WIDTH,
    alignItems: 'stretch',
    marginTop: 'auto'    
  },
  selector: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginTop: 'auto'    
  }
});



