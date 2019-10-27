import React from "react";
import { Alert, View, Text } from "react-native";
import { MapView, Font, Permissions } from "expo";

import { ButtonGroup } from "react-native-elements";

import demonHusky from "../assets/images/husky.png";

import { cluesRef, huntersRef } from "../fire";
import Clue from "../components/Clue";
import AuthScreen from "./AuthScreen";

import UserHeader from "../components/UserHeader";

import GDrive from "react-native-google-drive-api-wrapper";
import * as ImagePicker from "expo-image-picker";
import CameraScreen from "./CameraScreen";

import layout from "../constants/Layout";

const RED = "#ff0000";
const BLUE = "#0000ff";

const CRAWL_COLORS = [
  "#45B8AC",
  "#88B04B",
  "#FFDD33",
  "#955251",
  "#013220",
  "#B565A7",
  "#998000",
  "#6B5B95",
  "#FF6F61",
  "#F7CAC9",
];

// Never expected to be used
// If it is it means we have over 10 clue lists
// in which case we have bigger problems
const OVERFLOW_COLOR = "#000000";

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
      userGivenName: null, // Firstname from google auth
      accessToken: null, // Google Token
      refreshToken: null, // refresh Token
      accessTokenExpirationDate: null,
      isLoading: true,
      clues: [],
      hunters: [],
      region: null,
      clueVisibilitySelectedIndex: 0,
      myName: null,
      hasCameraRollPermission: null,
    };
  }

  _logout = () => {
    this.setState({ userGivenName: null });
    this.setState({ accessToken: null });
    this.setState({ refreshToken: null });
    this.setState({ accessTokenExpirationDate: null });
  };

  // AuthScreen calls this on login, rehydrate, or refresh
  _setUser = (
    userGivenName,
    accessToken,
    refreshToken,
    accessTokenExpirationDate
  ) => {
    this.setState({ userGivenName });
    this.setState({ accessToken });
    this.setState({ refreshToken });
    this.setState({ accessTokenExpirationDate });

    GDrive.setAccessToken(accessToken);
    GDrive.init();
  };

  _tokenAboutToExpire() {
    const { accessTokenExpirationDate, refreshToken } = this.state;

    // If we don't have an expirationTime or a way to refresh it yet, break out and return FALSE
    if (!accessTokenExpirationDate || !refreshToken) {
      return false;
    }

    const expiryTime = new Date(accessTokenExpirationDate);
    const thresholdTime = new Date();
    thresholdTime.setMinutes(thresholdTime.getMinutes() - 10);

    console.log("expiryTime", expiryTime);
    console.log("thresholdTime", thresholdTime);

    if (expiryTime.valueOf() < thresholdTime.valueOf()) {
      console.log("token expiring");
      return true;
    } else {
      console.log("token good to go!");
      return false;
    }
  }

  async _requestCameraRollPermission() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    this.setState({ hasCameraRollPermission: status === "granted" });
  }

  render() {
    const {
      userGivenName,
      accessToken,
      accessTokenExpirationDate
    } = this.state;

    const isTokenAboutToExpire = this._tokenAboutToExpire();

    // Auth
    if (!userGivenName || !accessToken || isTokenAboutToExpire) {
      return (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <AuthScreen
            doRefresh={isTokenAboutToExpire}
            setUser={this._setUser}
          />
        </View>
      );
    }

    // Camera Roll Permissions
    if (!this.state.hasCameraRollPermission) {
      this._requestCameraRollPermission();

      return (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text>Requesting Camera Roll Permission...</Text>
        </View>
      );
    }

    // Main App
    return (
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={this.state.region}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {this.renderClues()}
          {this.renderHunters()}
        </MapView>
        <ButtonGroup
          onPress={index =>
            this.setState({ clueVisibilitySelectedIndex: index })
          }
          selectedIndex={this.state.clueVisibilitySelectedIndex}
          buttons={["All", "Completed", "Uncompleted"]}
        />
        {/* Absolute components */}
        <View style={styles.headerStyle}>
          <UserHeader
            triggerLogout={this._logout}
            userGivenName={userGivenName}
            accessTokenExpirationDate={accessTokenExpirationDate}
          />
        </View>
      </View>
    );
  }

  componentDidMount() {
    this.fetchClueData();
    this.fetchHunterData();
    this.setRegion();
    this.setupLocationPosting();
  }

  fetchClueData() {
    cluesRef.on("value", snapshot => {
      let clues = [];
      snapshot.forEach(item => {
        clues.push({ ...item.val(), key: item.key });
      });

      this.setState({ clues });
    });
  }

  fetchHunterData() {
    huntersRef.on("value", snapshot => {
      let hunters = [];
      snapshot.forEach(item => {
        hunters.push({ ...item.val(), name: item.key });
      });

      this.setState({ hunters });
    });
  }

  setRegion() {
    this.getCurrentLocation().then(position => {
      if (position) {
        this.setState({
          region: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
          }
        });
      }
    });
  }

  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  setupLocationPosting() {
    this.uploadLocation(); //Post location on application start as well
    navigator.geolocation.watchPosition(this.uploadLocation);
  }

  uploadLocation = async () => {
    let username = this.state.userGivenName;
    if (username) {
      const currentLocation = await this.getCurrentLocation();
      const hunterInfo = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      };

      huntersRef.child(username).update(hunterInfo);
    }
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
        console.error(
          `Expected a valid clue visibility, got ${clueVisibilitySelectedIndex}`
        );
    }

    const crawlColors = this.makeCrawlColorMap();
    return cluesToShow.map((clue, index) => {
      return (
        <Clue
          clue={clue}
          key={index}
          color={this.clueColor(clue, crawlColors)}
          onCluePress={this.makeOnCluePress(clue)}
        />
      );
    });
  }

  clueColor(clue, crawlColors) {
    if (clue.completed) {
      return BLUE;
    }
    else if (clue.inCrawl) {
      return crawlColors[clue.clueListId]
    }
    return RED;
  }

  makeCrawlColorMap() {
    crawlColors = {};
    crawlClueLists = this.state.clues.filter(c => c.inCrawl).map(c => c.clueListId);
    listIds = Array.from(new Set(crawlClueLists)).sort();
    listIds.forEach((listId, idx) => {
      crawlColors[listId] = idx < CRAWL_COLORS.length ? CRAWL_COLORS[idx] : OVERFLOW_COLOR;
    });

    return crawlColors;
  }

  // Closes over the clue so the clue's press callback will have access to it
  makeOnCluePress = clue => {
    return () => {
      Alert.alert(
        "Change completion",
        "Change this clue's completion?",
        [
          { text: "Take Photo", onPress: () => this.pushCamera(clue) },
          {
            text: "Submit Photo from Camera Roll",
            onPress: () => this.submitFromCameraRoll(clue)
          },
          {
            text: clue.completed ? "Mark Incomplete" : "Mark Complete",
            onPress: () => HomeScreen.toggleComplete(clue)
          },
          {
            text: "Cancel",
            onPress: () => console.log("canceled"),
            style: "cancel"
          }
        ],
        { cancelable: true }
      );
    };
  };

  pushCamera = clue => {
    this.props.navigation.push("Camera", { clue: clue });
  };

  submitFromCameraRoll = async clue => {
    const photo = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      base64: true,
      aspect: [4, 3]
    });

    if (!photo.cancelled) {
      await CameraScreen.uploadToGoogleDrive(photo, clue);
      await CameraScreen.markClueCompleted(clue.key);
    }
  };

  static async toggleComplete(clue) {
    return cluesRef.child(clue.key).update({ completed: !clue.completed });
  }

  renderHunters() {
    return this.state.hunters.map(hunter => {
      const coords = { latitude: hunter.latitude, longitude: hunter.longitude };
      return (
        <MapView.Marker
          key={hunter.name}
          coordinate={coords}
          title={hunter.name}
          image={demonHusky}
        />
      );
    });
  }
}

const styles = {
  headerStyle: { position: "absolute", top: 50, left: 20 }
};
