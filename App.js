import React, { Component } from 'react';
import { ActivityIndicator, Button, Picker, Text, View, Alert, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';
import TimerMixin from 'react-timer-mixin';

import env from './env.js'
import redImg from './assets/red.png';
import greenImg from './assets/green.png';

import Trip from './Trip.js';
import Places from './Places.js';

export default class FastGo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      selectedMode: 'me_car',
      selectedPlaces: 'starbucks',
      selectedTrip: null,
      currentPosition: env.START_LOCATION,
      modes: [],
      baseURLs: [],
      placesOptions: [],
      places: [],
      message: null,
      region: env.REGION,
      showModeSelector: false,
      showPlaceSelector: false,
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
        (error) => log(JSON.stringify(error)),
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
      );
    } else {
      updateLocation(env.START_LOCATION)
    }

    setInterval(() => {
      if (this.state.selectedTrip !== null) {
        updateTrip(this.state.selectedTrip.updateURL)
        .then((routingJSON) => {
          log(routingJSON);
          if (Object.keys(routingJSON).length === 0)
            return;
          let arrive = getFirstArrive(routingJSON, 0);
          log(arrive);
          let error = null;
          this.setState({'selectedTrip': 
            {'routingJSON': routingJSON, 'updateURL': arrive.updateURL, error}},
            () => log('updatedState'))
        });
      }
    }, 5000);

    return getRegions()
    .then((regionsJSON) => {
      this.setState({
        isLoading: false,
        modes: getModes(regionsJSON, env.REGION_CODE),
        baseURLs: getURLs(regionsJSON, env.REGION_CODE),
      }, function() {
        // do something with new state
      });
    })
    .catch((error) => {
      console.error(error);
    });
  }

  update(places, placesOptions) {
      if (places === undefined) {
        places = this.refs.places.getPlaces();
        placesOptions = this.refs.places.getPlacesOptions();
      } 
      this.setState({places, placesOptions})
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

    let onModePress = () => {
      this.setState({'showModeSelector': !this.state.showModeSelector, 
                     'showPlaceSelector': false,
                     'message': null })
    }
    let onPlacesPress = () => {
      this.setState({'showPlaceSelector': !this.state.showPlaceSelector,
                      'showModeSelector': false,
                      'message': null })
    }
    
    let onGoPress = () => {
      this.setState({'showPlaceSelector': false,'showModeSelector': false, message: 'Computing Trips... '})
      return computeFastestTrip(this.state.baseURLs,
                                this.state.selectedMode, 
                                this.state.places,
                                this.state.currentPosition)
      .then((fastestTrip) => {
        if (fastestTrip.routingJSON === null) {
          this.setState({
              message: 'Error: ' + fastestTrip.error.error 
          })
        } else {
          this.setState({
              message: 'Computed Trips: ' + fastestTrip.routingJSON.segmentTemplates[0].action,
              selectedTrip: fastestTrip
          })
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
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            region={this.state.region}
        >
          {this.state.currentPosition !== null && 
            <MapView.Marker
              title='You are here'
              key='current'
              image={redImg}
              coordinate={this.state.currentPosition}
            />
          }
          <Places 
            selectedPlace={this.state.selectedPlaces}
            currentPosition={this.state.currentPosition}
            places={this.state.places}
            ref='places'
            update={this.update.bind(this)}
          />
          {this.state.places.map(place => (
            <MapView.Marker
              title={place.address}
              key={place.key}
              image={greenImg}
              coordinate={place}
            />
          ))}
          <Trip trip={this.state.selectedTrip}/>
        </MapView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={onModePress}
            style={[styles.bubble, styles.button]}
          >
            <Text>{this.state.selectedMode}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPlacesPress}
            style={[styles.bubble, styles.button]}
          >
            <Text>{this.state.selectedPlaces}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onGoPress}
            style={[styles.bubble, styles.button]}
          >
            <Text>FastGo!</Text>
          </TouchableOpacity>
        </View>
        {this.state.message !== null && 
          <View style={[styles.bubble, styles.message]}>
            <Text style={{ textAlign: 'center' }}>
              {this.state.message}
            </Text>
          </View>
        }
        {this.state.showModeSelector && 
          <Picker
            style={styles.selector}
            selectedValue={this.state.selectedMode}
            onValueChange={(mode) => this.setState({selectedMode: mode})}>
            {modesItems}
          </Picker>
        }
        {this.state.showPlaceSelector && 
          <Picker
            style={styles.selector}
            selectedValue={this.state.selectedPlaces}
            onValueChange={(place) => this.setState({selectedPlaces: place},
                            () => this.update())}>
            {placesItems}
          </Picker>
        }
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
    ...StyleSheet.absoluteFillObject,
    flex: 1, 
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  button: {
    width: 100,
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
    marginTop: 'auto',
  },
  selector: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginTop: 'auto',
  }
});



function getRegions() {
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

function computeFastestTrip(baseURLs, selectedMode, selectedPlaces, currentPosition) {
  let promises = [];
  let now = (Date.now() / 1000) - 10
  selectedPlaces.map((place, i) => {
    promises.push(computeTrip(baseURLs[0], selectedMode, currentPosition, place));
  });
  return Promise.all(promises).then((routingJSONs => {
    let error = null;
    let faster = null;
    let arrive = null;
    routingJSONs.map((routingJSON, i) => {
      if (routingJSON.hasOwnProperty('error')) {
        error = routingJSON
        return
      }

      if (!routingJSON.hasOwnProperty('groups')) {
        return
      }

      newArrive = getFirstArrive(routingJSON, now);
      if (faster == null || arrive.arrive > newArrive.arrive) {
        faster = routingJSON
        arrive = newArrive;
        log("new faster one: " + JSON.stringify(newArrive))
      }
    })
    return {'routingJSON': faster, 'updateURL': arrive.updateURL, error};
  }))
}

function getFirstArrive(routingJSON, now) {
  let result = null;
  forEachTrip(routingJSON, (trip => {
    if (trip.depart <= now) {
      log('found one in the past')
      return;
    }
    if (result === null || result.arrive > trip.arrive) {
      log('found a faster: ' + trip.arrive)
      result = {};
      result.arrive = trip.arrive;
      result.updateURL = trip.updateURL;
    }
  }))
  return result;
}

function computeTrip(baseUrl, selectedMode, fromLoc, toLoc) {
  data = {
    fromLoc: `(${fromLoc.latitude},${fromLoc.longitude})`,
    toLoc: `(${toLoc.latitude},${toLoc.longitude})`,
    mode: selectedMode,
    wp: '(1,1,1,1)',
    v: 11
  }
  let url = baseUrl + '/routing.json'+ 
            `?from=${data.fromLoc}&to=${data.toLoc}&modes=${data.mode}&wp=${data.wp}&v=${data.v}`
  log(url)
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

function getModes(regionsJSON, regionName) {
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

function getURLs(regionsJSON, regionName) {
  let modes = regionsJSON.modes;
  var result = null;
  regionsJSON.regions.map(region => {
    if (region.name.localeCompare(regionName) != 0) 
      return;

    result = region.urls;
  })  
  return result;
}

function updateTrip(updateUrl) {
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

function forEachTrip(routingJSON, callback) {
  routingJSON.groups.map(group => {
    group.trips.map(trip => {
      callback(trip)
    })
  });
}

function log(message) {
  console.log(message)
}


