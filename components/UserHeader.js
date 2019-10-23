import React from "React";
import { View, Text, Alert } from "react-native";
import { AsyncStorage } from "react-native";

_clearSession = clear => {
  // Clear all keys from device storage
  AsyncStorage.clear();
  // Call clear function in parent
  clear(null);
};

export default UserHeader = props => {
  const { userGivenName, triggerLogout, accessTokenExpirationDate } = props;

  // console.log("UserHeader:", userGivenName);

  return (
    <View>
      <Text
        onPress={() => _clearSession(triggerLogout)}
      >{`Hunter: ${userGivenName}\n(Tap To Logout) \nDEBUG: ${accessTokenExpirationDate}`}</Text>
    </View>
  );
};
