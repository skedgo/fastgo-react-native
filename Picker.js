import React, { Component } from 'react';
import { Modal, Platform, Picker, Text, View, Dimensions, StyleSheet, TouchableOpacity, TouchableHighlight } from 'react-native';


export default class PickerFast extends Component {

	constructor(props) {
	    super(props);
	    this.state = {
	    	showSelector: false,
	    	selectedItem: props.selectedItem
	    }
	}

	update() {
		this.props.onValueChange(this.state.selectedItem);
	}

	render() {

    	let switchShow = () => {
    		this.setState({'showSelector': !this.state.showSelector})
	    }

    	let close = () => {
    		switchShow();
    		this.update();
	    }

	    let items = this.props.items.map( (s, i) => {
	    	if (s.hasOwnProperty('mode'))
		        return <Picker.Item key={i} value={s.mode} label={s.title} />
	    	else
    		    return <Picker.Item key={i} value={s} label={s} />
	    });

	    if (Platform.OS === 'ios') {
	    	return (
				<TouchableOpacity
					onPress={switchShow}
					style={styles.button}
				>
					<Text>{this.state.selectedItem}</Text>
					<Modal
			          // animationType={"slide"}
			          transparent={false}
			          visible={this.state.showSelector}
			          >
			         <View style={{marginTop: 22}}>
			          <View>
			            <Picker
			              style={styles.selector}
			              selectedValue={this.state.selectedItem}
			              onValueChange={(item) => this.setState({selectedItem: item})}>
			            	{items}
			            </Picker>

			            <TouchableHighlight onPress={close} style={styles.closeButton}>
			              <Text>Close</Text>
			            </TouchableHighlight>
			          </View>
			         </View>
			        </Modal>
				</TouchableOpacity>
        	)
	    } else {
			return  (
	          <View style={styles.button}>
	            <TouchableOpacity>
	              <Text>{this.state.selectedItem}</Text>
	            </TouchableOpacity>
	            <Picker
	              style={styles.picker}
	              selectedValue={this.state.selectedItem}
	              onValueChange={(item) => this.setState({selectedItem: item},
	                              () => this.update())}>
	            	{items}
	            </Picker>
	          </View>
		    )
	    }
	}

}

const { width, height } = Dimensions.get('window');
const SCREEN_WIDTH = width;
const SCREEN_HEIGHT = height;
const ASPECT_RATIO = width / height;

const styles = StyleSheet.create({

  button: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 0,
    flex: 0.33,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  picker: {
  	position: 'absolute', 
  	top: 0, 
  	width: 100, 
  	height: 100 
  },
  selector: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginTop: 'auto'    
  },
  closeButton: {
    alignItems: 'center',
  }

});


