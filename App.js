import React, { Component } from 'react';
import { ActivityIndicator, Button, Picker, Text, View, Alert } from 'react-native';

export default class FastGo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      selectedMode: 'cy_bic',
      modes: [],
      message: 'Selected Mode: ' + 'cy_bic'
    }
  }

  componentDidMount() {
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
      .then((response) => response.json())
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
      this.setState({message: 'Selected Mode: ' + this.state.selectedMode})
      data = {
        fromLoc: '(-33.894436,151.110030)',
        toLoc: '(-33.877294,151.208554)',
        mode: this.state.selectedMode,
        wp: '(1,1,1,1)' 
      }
      let url = 'https://bigbang.skedgo.com/satapp-beta/routing.json'+ 
                `?from=${data.fromLoc}&to=${data.toLoc}&modes=${data.mode}&wp=${data.wp}&v=11`
      return fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-TripGo-Key': '3ff9fc635afb6187ccf33ccc4610b80a' 
          }
        })
        .then((response) => response.json())
        .then((routingJSON) => {
          console.log(routingJSON);
          this.setState({
              message: 'Computed Trips: ' + routingJSON.segmentTemplates[0].action 
          }, function() {
            
          });
        })
        .catch((error) => {
          console.error(error);
        });
    };


    let serviceItems = this.state.modes.map( (s, i) => {
        return <Picker.Item key={i} value={s.mode} label={s.title} />
    });

    return (
      <View style={{flex: 1, paddingTop: 20}}>
        <Picker
          selectedValue={this.state.selectedMode}
          onValueChange={(mode) => this.setState({selectedMode: mode})}>
          {serviceItems}
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


function getModes(regionsJSON, regionName) {
  let modes = regionsJSON.modes;
  var result = new Array();
  regionsJSON.regions.forEach(function(region) {
    if (region.name.localeCompare(regionName) == 0) {
      region.modes.forEach(function(mode) {
        modes[mode].mode = mode;
        result.push(modes[mode]);
      });
    }
  });
  // console.log(result);
  return result;
}
