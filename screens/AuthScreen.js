import React from "react";
import { Text, View, Platform, Alert, TouchableOpacity } from "react-native";
import { Google } from "expo";
import { AsyncStorage } from "react-native";
import * as AppAuth from "expo-app-auth";
import Constants from "expo-constants";

import {
  expoAppClientIdiOS,
  expoAppClientIdAndroid,
  standaloneClientIdiOS
} from "../properties";

import { AntDesign } from "@expo/vector-icons";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

export default class AuthScreen extends React.Component {
  // Generates a unique oauth refresh config given the client
  generateRefreshConfig = () => {
    const isStandalone = Constants.appOwnership === "standalone";
    const isAndroid = Platform.OS === "android";
    const isIOS = Platform.OS === "ios";

    let determinedClientId = "";

    // iOS standalone
    if (isStandalone && isIOS) {
      determinedClientId = standaloneClientIdiOS;
      console.log("iOS + Standalone");
    }

    // Android expo
    if (!isStandalone && isAndroid) {
      determinedClientId = expoAppClientIdAndroid;
      console.log("Android + Expo");
    }

    // iOS expo
    if (!isStandalone && isIOS) {
      determinedClientId = expoAppClientIdiOS;
      console.log("iOS + Expo");
    }

    if (determinedClientId === "") {
      console.error(
        `no refresh token case for ${Constants.appOwnership} and ${Platform.OS}.`
      );
    }

    // Return the necessary config to call the refresh method
    return {
      issuer: "https://accounts.google.com",
      clientId: determinedClientId,
      scopes: SCOPES
    };
  };

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
    const { setUser, doRefresh } = this.props;

    // Check if we have the user in async storage.
    const maybeUser = await this._retrieveData("userGivenName");
    const maybeAccessToken = await this._retrieveData("accessToken");
    const maybeRefreshToken = await this._retrieveData("refreshToken");
    const maybeAccessTokenExpirationDate = await this._retrieveData(
      "accessTokenExpirationDate"
    );

    // If we actually have a refresh token, and we were told to refresh
    if (maybeRefreshToken && doRefresh) {
      await this.invokeRefresh();
    } else {
      // If we didn't refresh and have something to restore
      if (maybeUser && maybeAccessToken) {
        // Set our user (will trigger HomeScreen refresh)
        setUser(
          maybeUser,
          maybeAccessToken,
          maybeRefreshToken,
          maybeAccessTokenExpirationDate
        );
      }
    }
  };

  getNewToken = async () => {
    // Get the setter from parents
    const { setUser } = this.props;

    // Obtain access token from Expo's Google API
    const { type, accessToken, refreshToken, user } = await Google.logInAsync({
      iosClientId: expoAppClientIdiOS,
      androidClientId: expoAppClientIdAndroid,
      iosStandaloneAppClientId: standaloneClientIdiOS,
      scopes: SCOPES
    });

    if (type === "success") {
      // Store in async data for later.
      await this._storeData("userGivenName", user.givenName);
      await this._storeData("accessToken", accessToken);
      await this._storeData("refreshToken", refreshToken);
      await this._storeData(
        "accessTokenExpirationDate",
        new Date().toISOString()
      );

      // Call parent setUser function
      setUser(
        user.givenName,
        accessToken,
        refreshToken,
        new Date().toISOString()
      );

      console.log(
        "Received new data from login and set for user",
        user.givenName
      );
    } else {
      console.log("Error!"); //TODO handle this.
    }
  };

  invokeRefresh = async () => {
    const { setUser } = this.props;

    // Retrieve the refresh token!

    const maybeRefreshToken = await this._retrieveData("refreshToken");
    const userGivenName = await this._retrieveData("userGivenName");

    // Generate the appropriate OAUTH config given platform
    const rConfig = this.generateRefreshConfig();

    if (maybeRefreshToken) {
      const {
        accessToken,
        accessTokenExpirationDate,
        refreshToken
      } = await AppAuth.refreshAsync(rConfig, maybeRefreshToken);

      console.log(accessTokenExpirationDate);

      // Share with Parent
      setUser(
        userGivenName,
        accessToken,
        refreshToken,
        accessTokenExpirationDate
      );

      // Set our async storage.
      await this._storeData("accessToken", accessToken);
      await this._storeData(
        "accessTokenExpirationDate",
        accessTokenExpirationDate
      );
    } else {
      Alert.alert("No refresh token, please logout and try again!");
    }
  };

  render() {
    return (
      <View style={{ alignItems: "center" }}>
        <TouchableOpacity onPress={() => this.getNewToken()}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <AntDesign name="google" size={70} color="black" />
          </View>
        </TouchableOpacity>
        <Text style={{ paddingTop: 10 }}>version 9</Text>
      </View>
    );
  }
}
