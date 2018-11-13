import React from 'react'
import { Camera, Permissions } from 'expo';
import {
  Platform, View, ImageBackground, StyleSheet, Alert, CameraRoll
} from 'react-native';

import { Button, Icon, Text, Spinner } from 'native-base';

import { storageRef, cluesRef } from "../fire";
import layout from '../constants/Layout';

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
      photo: null,
      sending: false
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
        <ImageBackground style={{flex: 1, width: layout.window.width, height: layout.window.height}}
                         source={{uri: `data:image/jpg;base64, ${photo.base64}`}}>

          {this.state.sending ? <Spinner style={styles.centerScreen}/> : undefined}

          <View style={styles.topBar}>
            <View style={styles.topLeftButton}>
              <Button small light transparent onPress={this.cancelPhotoPreview}>
                <Icon name='ios-close-circle' />
              </Button>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.sendButton}>
              <Button success rounded onPress={() => this.uploadPhotoAndMarkCompleted(photo)}>
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

  uploadPhotoAndMarkCompleted = async (photo) => {
    try {
      this.toggleSending();

      CameraRoll.saveToCameraRoll(photo.uri, 'photo');

      const clue = this.props.navigation.getParam('clue');
      await CameraScreen.uploadToFirebase(photo.uri, clue.clueId);
      await CameraScreen.markClueCompleted(clue.key);

      this.toggleSending();
      this.cancelPhotoPreview();
    } catch (e) {
      console.error(e);
      Alert.alert('Oh no! Something went wrong. Please take another picture');
    }
  };

  toggleSending() {
    this.setState({sending: !this.state.sending});
  }

  static async uploadToFirebase(photoUri, clueId) {
    const photoFromUri = await fetch(photoUri);
    const photoBlob = await photoFromUri.blob();

    return storageRef.child(clueId).put(photoBlob);
  }

  static async markClueCompleted(clueKey) {
    return cluesRef.child(clueKey).update({completed: true});
  }

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
    paddingTop: 40,
    paddingLeft: 20
  },

  centerScreen: {
    position: 'absolute',
    paddingTop: layout.window.height / 2,
    paddingLeft: layout.window.width / 2
  }
});
