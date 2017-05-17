import React, { Component } from 'react';
import { ActivityIndicator, Button, Picker, Text, View, Alert, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';
import polyline from 'polyline';

export default class FastGo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      selectedMode: 'pt_pub',
      currentPosition: null,
      modes: [],
      selectedPlaces: 'starbucks',
      places: {
        'mcdonalds' : [{"latitude": -33.8755296,"longitude": 151.2066007, "address": "600 George St"},
                       {"latitude": -33.8730211,"longitude": 151.2083184, "address": "Park St & Pitt St"}],
        'starbucks' : [{"latitude": -33.8734138,"longitude": 151.209559, "address": "Pacific Power Building, 201 Elizabeth St"},
                       {"latitude": -33.8723705,"longitude": 151.2065248, "address": "Queen Victoria Building, 69/455 George St"}],
      },
      message: 'Selected Mode: ' + 'cy_bic',
      region: {
        latitude: -33.8755296,
        longitude: 151.2066007,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      polylines: [],
    }
  }


  componentDidMount() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          var currentPosition = {'latitude': -33.8595296,"longitude": 151.2086007};
          // var currentPosition = position.coords;
          position.coords.latitudeDelta = 0.02;
          position.coords.longitudeDelta = 0.02;
          this.setState({currentPosition, 'region': position.coords});
        },
        (error) => alert(JSON.stringify(error)),
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
      );
      return getRegions()
      .then((regionsJSON) => {
        this.setState({
          isLoading: false,
          modes: getModes(regionsJSON, "AU_NSW_Sydney"),
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

    let onButtonPress = () => {
      this.setState({message: 'Selected Mode: ' + this.state.selectedMode + 'Selected Place: ' + this.state.selectedPlaces})
        return computeFastestTrip(this.state.selectedMode, 
                                  this.state.places[this.state.selectedPlaces],
                                  this.state.currentPosition)
        .then((fastestTrip) => {
          if (fastestTrip.routingJSON.hasOwnProperty('error')) {
            this.setState({
                message: 'Error: ' + routingJSON.error 
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
              key={place.address}
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
            onPress={onButtonPress}
            style={[styles.bubble, styles.button]}
          >
            <Text>{this.state.selectedMode}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onButtonPress}
            style={[styles.bubble, styles.button]}
          >
            <Text>{this.state.selectedPlaces}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onButtonPress}
            style={[styles.bubble, styles.button]}
          >
            <Text>FastGo!</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.bubble, styles.message]}>
          <Text style={{ textAlign: 'center' }}>
            {this.state.message}
          </Text>
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
    width: 80,
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
    width: 200,
    alignItems: 'stretch',
  },
});

function getRegions() {
  return fetch('https://bigbang.skedgo.com/satapp-beta/regions.json', {
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

function computeFastestTrip(selectedMode, selectedPlaces, currentPosition) {
  let promises = [];
  let now = (Date.now() / 1000) - 10
  selectedPlaces.map((place, i) => {
    promises.push(computeTrip(selectedMode, currentPosition, place));
  });
  return Promise.all(promises).then((routingJSONs => {
    let faster = null;
    let arrive = null;
    routingJSONs.map((routingJSON, i) => {
      if (routingJSON.hasOwnProperty('error')) {
        faster = routingJSON
        return
      }

      newArrive = getFirstArrive(routingJSON, now);
      if (faster == null || arrive.arrive > newArrive.arrive) {
        faster = routingJSON
        arrive = newArrive;
        log("new faster one: " + JSON.stringify(newArrive))
      }
    })
    return {'routingJSON': faster, 'temporaryURL': arrive.temporaryURL};
  }))
}

function getFirstArrive(routingJSON, now) {
  let result = null;
  routingJSON.groups.map((group => {
    group.trips.map((trip => {
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
  }))
  return result;
}

function computeTrip(selectedMode, fromLoc, toLoc) {
  data = {
    fromLoc: `(${fromLoc.latitude},${fromLoc.longitude})`,
    toLoc: `(${toLoc.latitude},${toLoc.longitude})`,
    mode: selectedMode,
    wp: '(1,1,1,1)' 
  }
  let url = 'https://bigbang.skedgo.com/satapp-beta/routing.json'+ 
            `?from=${data.fromLoc}&to=${data.toLoc}&modes=${data.mode}&wp=${data.wp}&v=11`
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

function getSegmentTemplate(templates, hash) {
  let result = null;
  templates.map(template => {
    if (template.hashCode === hash)
      result = template;
  })
  return result;
}

function getSelectedTrip(faster) {
  let result = null;
  forEachTrip(faster.routingJSON, (trip => {
    if (trip.temporaryURL !== faster.temporaryURL)
      return;
    trip.segments.map(segment => {
      segmentTemplate = getSegmentTemplate(faster.routingJSON.segmentTemplates, segment.segmentTemplateHashCode);
      for (var key in segmentTemplate)
        segment[key] = segmentTemplate[key];
    })
    result = trip;
  }));
  return result;
}

function draw(faster) {
  let trip = getSelectedTrip(faster);
  log(trip);
  result = new Array();
  trip.segments.map(segment => {
    result.push({'latitude':segment.from.lat, 'longitude':segment.from.lng});
    waypoints = segment.hasOwnProperty('streets') ? segment.streets : segment.shapes;
    waypoints.map(waypoint => {
      if (waypoint.hasOwnProperty('travelled') && !waypoint.travelled)
        return;
      let steps = polyline.decode(waypoint.encodedWaypoints);
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
  // console.log(message)
}

function forEachTrip(routingJSON, callback) {
  routingJSON.groups.map(group => {
    group.trips.map(trip => {
      callback(trip)
    })
  });
}

/*
        <Picker
          selectedValue={this.state.selectedMode}
          onValueChange={(mode) => this.setState({selectedMode: mode})}>
          {modesItems}
        </Picker>
        <Picker
          selectedValue={this.state.selectedPlaces}
          onValueChange={(place) => this.setState({selectedPlaces: place})}>
          {placesItems}
        </Picker>
        <Text>
          {this.state.message}
        </Text>

        <Button
            style={styles.button}
            onPress={onButtonPress}
            title="FastGo!"
            accessibilityLabel="The fastest trip!"
        />

*/