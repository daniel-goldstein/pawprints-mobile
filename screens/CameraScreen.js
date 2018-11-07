import React from 'react'
import { Camera, Permissions } from 'expo';
import {
  Platform, View, Dimensions, ImageBackground, StyleSheet, Alert
} from 'react-native';

import { Button, Icon, Text } from 'native-base';

import { storageRef, cluesRef } from "../fire";


const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default class CameraScreen extends React.Component {
    static navigationOptions = {
        header: null,
        tabBarVisible: false
    };

  constructor(props) {
    super(props);

    this.state = {
      hasCameraPermission: null,
      type: Camera.Constants.Type.front,
      photo: null
    };
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  // automatically re-renders if state is changed
  render() {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (!hasCameraPermission) {
      return <Text>No access to camera</Text>;
    } else if (this.state.photo !== null) {
      return this.renderPhotoPreview();
    } else {
      return this.renderCameraScreen();
    }
  }

  renderPhotoPreview() {
    const photo = this.state.photo;

    return (
      <View style={{ flex: 1 }}>
        <ImageBackground style={{flex: 1, width: screenWidth, height: screenHeight}}
                         source={{uri: `data:image/jpg;base64, ${photo.base64}`}}>

          <View style={styles.topBar}>
            <View style={styles.topLeftButton}>
              <Button small light transparent onPress={this.cancelPhotoPreview}>
                <Icon name='ios-close-circle' />
              </Button>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.sendButton}>
              <Button success rounded onPress={() => this.uploadPhoto(photo)}>
                <Icon light name='ios-arrow-forward' />
              </Button>
            </View>
          </View>

        </ImageBackground>
      </View>
    );
  }

  renderCameraScreen() {
    return (
      <View style={{ flex: 1 }}>
        <Camera style={{ flex: 1 }}
                type={this.state.type}
                ref={ cam => this.camera = cam }>

          <View style={styles.topBar}>
            <View style={styles.topLeftButton}>
              <Button small light rounded onPress={this.flipCamera}>
                <Icon name="camera" />
              </Button>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.cameraButton}>
              <Button large warning rounded onPress={this.snapPhoto}>
                <Text>Say T-Time!</Text>
              </Button>
            </View>
          </View>

        </Camera>
      </View>
    );
  }

  uploadPhoto = async (photo) => {
    const photoFromUri = await fetch(photo.uri);
    const photoBlob = await photoFromUri.blob();

    //Upload photo to firebase
    storageRef.child('asdf').put(photoBlob);


    let clue = this.props.navigation.getParam('clue');
    // Set the clue to completed
    cluesRef.child(clue.key).update({completed: true});

    //Get rid of the photo from state
    this.cancelPhotoPreview();
  };

  cancelPhotoPreview = () => {
    this.setState({photo: null});
  };

  snapPhoto = async () => {
    if (this.camera) {
      let photo = await this.camera.takePictureAsync({base64: true});

      this.setState({ photo });
    }
  };

  flipCamera = () => {
    this.setState({
      type: this.state.type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back,
    });
  };
}

const styles = StyleSheet.create({
  MainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end' // Sets children at bottom of box
  },

  cameraButton: {
    justifyContent: 'center',
    marginBottom: 30
  },

  sendButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginRight: 30,
    marginBottom: 30,
    alignSelf: 'flex-end'
  },

  topBar: {
    flex: 1,
    flexDirection: 'row', //Default for react native is column
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },

  topLeftButton: {
    paddingTop: ( Platform.OS === 'ios' ) ? 40 : 0,
    paddingLeft: 20
  },
});
