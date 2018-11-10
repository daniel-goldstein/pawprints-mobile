import React from 'react';
import { Alert, View } from 'react-native';
import { MapView } from 'expo';

import { ButtonGroup } from 'react-native-elements';

import { cluesRef } from "../fire";
import Clue from "../components/Clue";

// Controls initial zoom of the map
const LATITUDE_DELTA = 0.06;
const LONGITUDE_DELTA = 0.06;

export default class HomeScreen extends React.Component {
  static navigationOptions = {
    header: null // Removes the navigation header
  };

  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      clues: [],
      region: null,
      clueVisibilitySelectedIndex: 0
    };
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={this.state.region}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {this.renderClues()}
        </MapView>
        <ButtonGroup
          onPress={(index) => this.setState({clueVisibilitySelectedIndex: index})}
          selectedIndex={this.state.clueVisibilitySelectedIndex}
          buttons={['All', 'Completed', 'Uncompleted']}
        />
      </View>
    )
  }

  componentDidMount() {
    this.fetchClueData();
    this.setRegion();
  }

  fetchClueData() {
    cluesRef.on('value', snapshot => {
      let clues = [];
      snapshot.forEach(item => {
        clues.push({ ...item.val(), key: item.key });
      });

      this.setState({ clues })
    });
  };

  setRegion() {
    this.getCurrentLocation().then(position => {
      if (position) {
        this.setState({
          region: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          },
        });
      }
    });
  };

  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  renderClues() {
    const allClues = this.state.clues;
    const clueVisibilitySelectedIndex = this.state.clueVisibilitySelectedIndex;
    let cluesToShow = [];

    switch (clueVisibilitySelectedIndex) {
      case 0: // All
        cluesToShow = allClues;
        break;
      case 1: // Completed
        cluesToShow = allClues.filter(clue => clue.completed);
        break;
      case 2: // Uncompleted
        cluesToShow = allClues.filter(clue => !clue.completed);
        break;
      default:
        console.error(`Expected a valid SHOW_CLUE variant, got ${showClues}`);
    }

    return cluesToShow.map((clue, index) => {
      return <Clue clue={clue} key={index} onCluePress={this.makeOnCluePress(clue)}/>;
    })
  }

  // Closes over the clue so the clue's press callback will have access to it
  makeOnCluePress = (clue) => {
    return () => {
      if (!clue.completed) {
        Alert.alert(
          'Complete',
          'Complete this clue by taking a picture?',
          [
            {text: 'Send it', onPress: () => this.pushCamera(clue)},
            {text: 'Cancel', onPress: () => console.log("canceled"), style: 'cancel'}
          ],
          {cancelable: true}
        );
      }
    }
  };

  pushCamera = (clue) => {
    this.props.navigation.push('Camera', {clue: clue});
  };
}