import React, { Component } from 'react';
import { ActivityIndicator, Button, Picker, Text, View, Alert, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';
import Polyline from 'polyline';

const baseAPIurl = "https://bigbang.skedgo.com/satapp-beta/";

export default class FastGo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      selectedMode: 'me_car',
      currentPosition: {'latitude': -33.8755296,"longitude": 151.2066007},
      modes: [],
      baseURLs: [],
      selectedPlaces: 'atm',
      places: {
        'mcdonalds' : [],
        'starbucks' : [],
        'atm' : [],
      },
      message: null,
      region: {
        latitude: -33.8755296,
        longitude: 151.2066007,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      polylines: [],
      showModeSelector: false,
      showPlaceSelector: false,
    }
  }


  componentDidMount() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          var currentPosition = {'latitude': -33.8755296,"longitude": 151.2066007};
          // var currentPosition = position.coords;
          position.coords.latitudeDelta = 0.02;
          position.coords.longitudeDelta = 0.02;
          this.setState({currentPosition});
          // this.setState({currentPosition, 'region': position.coords});
        },
        (error) => alert(JSON.stringify(error)),
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
      );
      places = getLocations(this.state.currentPosition, Object.keys(this.state.places));
      this.setState({places});
      log(this.state.places)
      return getRegions()
      .then((regionsJSON) => {
        this.setState({
          isLoading: false,
          modes: getModes(regionsJSON, "AU_NSW_Sydney"),
          baseURLs: getURLs(regionsJSON, "AU_NSW_Sydney"),
        }, function() {
          // do something with new state
        });
      })
      .catch((error) => {
        console.error(error);
      });
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
                                  this.state.places[this.state.selectedPlaces],
                                  this.state.currentPosition)
        .then((fastestTrip) => {
          if (fastestTrip.routingJSON === null) {
            this.setState({
                message: 'Error: ' + fastestTrip.error.error 
            })
          } else {
            this.setState({
                message: 'Computed Trips: ' + fastestTrip.routingJSON.segmentTemplates[0].action,
                polylines: draw(fastestTrip) 
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

    let placesItems = Object.keys(this.state.places).map( (s, i) => {
        return <Picker.Item key={i} value={s} label={s} />
    });

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
              coordinate={this.state.currentPosition}
            />
          }
          {this.state.places[this.state.selectedPlaces].map(place => (
            <MapView.Marker
              title={place.address}
              key={place.key}
              coordinate={place}
            />
          ))}
          <MapView.Polyline
            key="polyline"
            coordinates={this.state.polylines}
            strokeColor="#000"
            fillColor="rgba(255,255,255,0.5)"
            strokeWidth={5}
          />
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
            onValueChange={(place) => this.setState({selectedPlaces: place})}>
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

function getLocations(near, keywords) {
  let promises = new Array();
  let result = {};
  keywords.map(keyword => {
    let type = keyword === 'atm' ? 'atm' : 'restaurant';
    promise = fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${near.latitude},${near.longitude}&radius=5000&type=${type}&keyword=${keyword}&key=AIzaSyCLCOtDsWaH9KSrc5Sees7T11n0k12wtL0`)
      .then(response => response.json())
      .then(response => {
        let places = new Array();
        response.results.map(place => {
          places.push({'latitude':place.geometry.location.lat, 
                       'longitude':place.geometry.location.lng,
                       'address':place.name,
                       'key':place.place_id})
        })
        result[keyword] = places;
      });
    promises.push(promise)
  })
  Promise.all(promises);
  return result;
}

function getRegions() {
  return fetch(baseAPIurl + 'regions.json', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-TripGo-Key': '3ff9fc635afb6187ccf33ccc4610b80a' 
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
    return {'routingJSON': faster, 'temporaryURL': arrive.temporaryURL, error};
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
      result.temporaryURL = trip.temporaryURL;
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
        'X-TripGo-Key': '3ff9fc635afb6187ccf33ccc4610b80a' 
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

function forEachTrip(routingJSON, callback) {
  routingJSON.groups.map(group => {
    group.trips.map(trip => {
      callback(trip)
    })
  });
}

function getSegmentTemplate(templates, hash) {
  let result = null;
  templates.map(template => {
    if (template.hashCode === hash)
      result = template;
  })
  return result;
}

function buildSelectedTrip(routingJSON, seletedTripTemporaryURL) {
  let result = null;
  let segmentTemplates = routingJSON.segmentTemplates;
  forEachTrip(routingJSON, (trip => {
    if (trip.temporaryURL !== seletedTripTemporaryURL)
      return;
    trip.segments.map(segment => {
      segmentTemplate = getSegmentTemplate(segmentTemplates, segment.segmentTemplateHashCode);
      for (var key in segmentTemplate)
        segment[key] = segmentTemplate[key];
    })
    result = trip;
  }));
  return result;
}

function draw(faster) {
  let trip = buildSelectedTrip(faster.routingJSON, faster.temporaryURL);
  log(trip);
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

function log(message) {
  console.log(message)
}


