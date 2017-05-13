import React, { Component } from 'react';
import { ActivityIndicator, ListView, Text, View } from 'react-native';

export default class FastGo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true
    }
  }

  componentDidMount() {
    return fetch('https://bigbang.skedgo.com/satapp-beta/regions.json?v=2')
      .then((response) => response.json())
      .then((regionsJSON) => {
        let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.setState({
          isLoading: false,
          dataSource: ds.cloneWithRows(getModes(regionsJSON, "AU_NSW_Sydney")),
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

    return (
      <View style={{flex: 1, paddingTop: 20}}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={(rowData) => <Text>{rowData.title} - {rowData.mode}</Text>}
        />
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
  return result;
}
