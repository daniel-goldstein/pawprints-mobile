import React from 'react';
import { Alert, View } from 'react-native';
import { MapView } from 'expo';

import { Button, Text } from 'native-base';

import { cluesRef } from "../fire";
import Clue from "../components/Clue";

// Controls initial zoom of the map
const LATITUDE_DELTA = 0.06;
const LONGITUDE_DELTA = 0.06;

const SHOW_CLUES = {
  ALL: 'show-clues-all',
  COMPLETED: 'show-clues-completed',
  UNCOMPLETED: 'show-clues-uncompleted'
};

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
      showClues: SHOW_CLUES.ALL
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
        <Button>
        </Button>
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
    const showClues = this.state.showClues;
    let cluesToShow = [];

    switch (showClues) {
      case SHOW_CLUES.ALL:
        cluesToShow = allClues;
        break;
      case SHOW_CLUES.COMPLETED:
        cluesToShow = allClues.filter(clue => clue.completed);
        break;
      case SHOW_CLUES.UNCOMPLETED:
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