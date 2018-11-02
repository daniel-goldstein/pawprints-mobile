import React from 'react';
import { Alert } from 'react-native';
import { MapView } from 'expo';

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
      region: null
    };
  }

  render() {
    return (
      <MapView
        style={{ flex: 1 }}
        initialRegion={this.state.region}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {this.renderClues()}
      </MapView>
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
    return this.state.clues.map((clue, index) => {
      return <Clue clue={clue} key={index} onCluePress={this.onCluePress(clue)}/>;
    })
  }

  //Closes over the clue so the clue's press callback will have access to it
  onCluePress = (clue) => {
    const message = clue.completed ?
      `Mark ${clue.title} as incomplete?`:
      `Mark ${clue.title} as completed?`;

    return () => {
      Alert.alert(
        'Complete',
        message,
        [
          {text: 'Mark that clue', onPress: () => this.toggleClueCompleted(clue)},
          {text: 'Cancel', onPress: () => console.log("canceled"), style: 'cancel'}
        ],
        { cancelable: true }
      );
    }
  };

  toggleClueCompleted = (clue) => {
    cluesRef.child(clue.key).update({completed: !clue.completed});
  };
}