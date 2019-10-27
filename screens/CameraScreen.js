import React from "react";
import { Camera, Permissions } from "expo";
import {
  Platform,
  View,
  ImageBackground,
  StyleSheet,
  Alert,
  CameraRoll
} from "react-native";

import GDrive from "react-native-google-drive-api-wrapper";

import { Button, Icon, Text, Spinner } from "native-base";

import { storageRef, cluesRef } from "../fire";
import layout from "../constants/Layout";
import { parentFolder } from "../properties";

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
      flashMode: Camera.Constants.FlashMode.auto,
      photo: null,
      sending: false
    };
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === "granted" });
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
        <ImageBackground
          style={{
            flex: 1,
            width: layout.window.width,
            height: layout.window.height
          }}
          source={{ uri: `data:image/jpg;base64, ${photo.base64}` }}
        >
          {this.state.sending ? (
            <View>
              <Spinner style={styles.centerScreen} />
            </View>
          ) : (
            undefined
          )}

          <View style={styles.topBar}>
            <View style={styles.topLeftButton}>
              <Button small light transparent onPress={this.cancelPhotoPreview}>
                <Icon name="ios-close-circle" />
              </Button>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.sendButton}>
              <Button
                disabled={this.state.sending}
                rounded
                onPress={() => this.uploadPhotoAndMarkCompleted(photo)}
              >
                <Icon light name="ios-arrow-forward" />
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
        <Camera
          style={{ flex: 1 }}
          type={this.state.type}
          ref={cam => (this.camera = cam)}
          autoFocus={Camera.Constants.AutoFocus.on}
          flashMode={this.state.flashMode}
          zoom={0}
        >
          <View style={styles.topBar}>
            <View style={styles.topLeftButton}>
              <Button small light rounded onPress={this.flipCamera}>
                <Icon name="camera" />
              </Button>
            </View>
            <View style={styles.topRightButton}>
              <Button small light rounded onPress={() => this.setState({flashMode: this.nextFlashMode()})}>
                {this.flashIcon()}
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

  uploadPhotoAndMarkCompleted = async photo => {
    try {
      this.toggleSending();

      console.log(photo.uri);
      CameraRoll.saveToCameraRoll(photo.uri, "photo");

      const clue = this.props.navigation.getParam("clue");
      await CameraScreen.uploadToGoogleDrive(photo, clue);
      await CameraScreen.markClueCompleted(clue.key);

      this.cancelPhotoPreview();
    } catch (e) {
      console.log(e);
      Alert.alert("Oh no! Something went wrong: ", e);
    }
    this.toggleSending();
    // Leave the camera view
    this.props.navigation.goBack();
  };

  toggleSending() {
    this.setState({ sending: !this.state.sending });
  }

  static async uploadToGoogleDrive(photo, clue) {
    if (!GDrive.isInitialized()) {
      throw "Gdrive not initialized. Please Logout.";
    }

    const clueListId = clue.clueListId;
    const clueNum = clue.clueNum;

    // Get the name of the appropriate folder OR create that folder.
    const folder = await GDrive.files.safeCreateFolder({
      name: `${clueListId}`,
      parents: [parentFolder] // The ClueSubmissions Root Folder
    });

    const out = await GDrive.files.createFileMultipart(
      photo.base64,
      "image/png",
      {
        parents: [folder],
        name: `${clueListId}${clueNum}`
      },
      true
    );

    // User feedback on success
    // If we have an out response
    if (out) {
      if (out.status === 200) {
        Alert.alert(`Uploaded ${clueListId}${clueNum}`);
      } else {
        Alert.alert(`Error:  Status code ${out.status}`);
      }
    } else {
      Alert.alert("Error: Nothing Returned");
    }
  }

  static async markClueCompleted(clueKey) {
    return cluesRef.child(clueKey).update({ completed: true });
  }

  cancelPhotoPreview = () => {
    this.setState({ photo: null });
  };

  snapPhoto = async () => {
    // Somehow fixes bug in takePictureAsync that doesn't respond until second tap
    console.log("");

    if (this.camera) {
      let photo = await this.camera.takePictureAsync({ base64: true });

      this.setState({ photo });
    }
  };

  flipCamera = () => {
    this.setState({
      type:
        this.state.type === Camera.Constants.Type.back
          ? Camera.Constants.Type.front
          : Camera.Constants.Type.back
    });
  };

  nextFlashMode = () => {
    switch (this.state.flashMode) {
      case Camera.Constants.FlashMode.on:
        return Camera.Constants.FlashMode.off;
      case Camera.Constants.FlashMode.off:
        return Camera.Constants.FlashMode.auto;
      case Camera.Constants.FlashMode.auto:
        return Camera.Constants.FlashMode.on;
      default:
        Alert.alert("Unknown flash mode");
        return this.state.flashMode;
    }
  };

  flashIcon = () => {
    switch(this.state.flashMode) {
      case Camera.Constants.FlashMode.on:
        return <Icon name="flash"/>;
      case Camera.Constants.FlashMode.off:
        return <Icon name="flash-off"/>;
      case Camera.Constants.FlashMode.auto:
        return <Text>A</Text>;
      default:
        Alert.alert("Unknown flash mode");
        return this.state.flashMode;
    }
  };
}

const styles = StyleSheet.create({
  bottomBar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end" // Sets children at bottom of box
  },

  cameraButton: {
    justifyContent: "center",
    marginBottom: 30
  },

  sendButton: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginRight: 30,
    marginBottom: 30,
    alignSelf: "flex-end"
  },

  topBar: {
    flex: 1,
    flexDirection: "row", //Default for react native is column
    justifyContent: "space-between",
    alignItems: "flex-start"
  },

  topLeftButton: {
    paddingTop: 40,
    paddingLeft: 20
  },

  topRightButton: {
    paddingTop: 40,
    paddingRight: 20
  },

  centerScreen: {
    position: "absolute",
    paddingTop: layout.window.height / 2,
    paddingLeft: layout.window.width / 2
  }
});
