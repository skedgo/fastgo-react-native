import React, { Component } from 'react';
import { ActivityIndicator, Button, Picker, Text, View, Alert } from 'react-native';

export default class FastGo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      selectedMode: 'pt_pub',
      modes: [],
      selectedPlaces: 'starbucks',
      places: {
        'mcdonalds' : [{"lat": -33.8755296,"lng": 151.2066007, "address": "600 George St"},
                       {"lat": -33.8730211,"lng": 151.2083184, "address": "Park St & Pitt St"}],
        'starbucks' : [{"lat": -33.8734138,"lng": 151.209559, "address": "Pacific Power Building, 201 Elizabeth St"},
                       {"lat": -33.8723705,"lng": 151.2065248, "address": "Queen Victoria Building, 69/455 George St"}],
      },
      message: 'Selected Mode: ' + 'cy_bic'
    }
  }

  componentDidMount() {
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
        <View style={{flex: 1, paddingTop: 20}}>
          <ActivityIndicator />
        </View>
      );
    }

    let onButtonPress = () => {
      this.setState({message: 'Selected Mode: ' + this.state.selectedMode + 'Selected Place: ' + this.state.selectedPlaces})
        return computeFastestTrip(this.state.selectedMode, this.state.places[this.state.selectedPlaces])
        .then((routingJSON) => {
          if (routingJSON.hasOwnProperty('error')) {
            this.setState({
                message: 'Error: ' + routingJSON.error 
            })
          } else {
            this.setState({
                message: 'Computed Trips: ' + routingJSON.segmentTemplates[0].action 
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
      <View style={{flex: 1, paddingTop: 20}}>
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
        <Button
            onPress={onButtonPress}
            title="FastGo!"
            accessibilityLabel="The fastest trip!"
        />
        <Text>
          {this.state.message}
        </Text>
      </View>
    );
  }
}


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

function computeFastestTrip(selectedMode, selectedPlaces) {
  let promises = [];
  let now = (Date.now() / 1000)
  selectedPlaces.map((place, i) => {
    promises.push(computeTrip(selectedMode, place.lat, place.lng));
  });
  return Promise.all(promises).then((routingJSONs => {
    let faster = null;
    let arrive = null;
    routingJSONs.map((routingJSON, i) => {
      newArrive = getFirstArrive(routingJSON, now);
      if (faster == null || arrive > newArrive) {
        faster = routingJSON
        arrive = newArrive;
        log("new faster one: " + newArrive)
      }
    })
    return faster;
  }))
}

function getFirstArrive(routingJSON, now) {
  let arrive = null;
  routingJSON.groups.map((group => {
    group.trips.map((trip => {
      if (trip.depart <= now) {
        log('found one in the past')
        return;
      }
      if (arrive === null || arrive > trip.arrive) {
        log('found a faster: ' + trip.arrive)
        arrive = trip.arrive;
      }
    }))
  }))
  return arrive;
}

function computeTrip(selectedMode, fromLat, fromLng) {
  data = {
    fromLoc: '(-33.894436,151.110030)',
    toLoc: `(${fromLat},${fromLng})`,
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

function log(message) {
  // console.log(message)
}
