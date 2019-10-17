import React from "react";
import { Text, View } from "react-native";
import { Google } from "expo";
import { AsyncStorage } from "react-native";

import { expoAppClientIdiOS } from "../properties";

// TODO: switch clientID with `Constants.appOwnership`

export default class AuthScreen extends React.Component {
  async componentDidMount() {
    // Rehydrate from storage
    await this.initAsync();
  }

  // Helper to access Async Storage
  _storeData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      // Error saving data
      console.err(error);
    }
  };

  // Helper to Retrieve Async Storage
  _retrieveData = async key => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        // We have data!!
        // console.log("Grabbing Data from Async. Found:", value);
        return value;
      }
    } catch (error) {
      // Error retrieving data
      console.log(error);
      return null;
    }
    // Didn't return yet...something wrong.
    return null;
  };

  initAsync = async () => {
    // Get the setter from parents
    const { setUser } = this.props;

    // Check if we have the user in async storage.
    const maybeUser = await this._retrieveData("userGivenName");
    const maybeAccessToken = await this._retrieveData("accessToken");

    if (maybeUser && maybeAccessToken) {
      // console.log("Existing user found in AsyncStore.", maybeUser);
      // Set our user (will trigger HomeScreen refresh)
      setUser(maybeUser, maybeAccessToken);
    }
  };

  getNewToken = async () => {
    // Get the setter from parents
    const { setUser } = this.props;

    // Obtain access token from Expo's Google API
    const { type, accessToken, user } = await Google.logInAsync({
      iosClientId: expoAppClientIdiOS,
      scopes: ["https://www.googleapis.com/auth/drive"]
    });

    if (type === "success") {
      // Store in async data for later.
      await this._storeData("userGivenName", user.givenName);
      await this._storeData("accessToken", accessToken);

      // Call parent setUser function
      setUser(user.givenName, accessToken);

      console.log(
        "Received new data from login and set for user",
        user.givenName
      );
    } else {
      console.log("Error!"); //TODO handle this.
    }
  };

  render() {
    return (
      <View>
        <Text onPress={() => this.getNewToken()}>Tap to Login!</Text>
      </View>
    );
  }
}
