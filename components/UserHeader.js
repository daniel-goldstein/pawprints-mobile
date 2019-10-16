import React from "React";
import { View, Text } from "react-native";
import { AsyncStorage } from "react-native";

_clearSession = clear => {
  // Clear all keys from device storage
  AsyncStorage.clear();
  // Call clear function in parent
  clear(null);
};

export default UserHeader = props => {
  const { userGivenName, triggerLogout } = props;

  console.log("UserHeader:", userGivenName);

  return (
    <View>
      <Text
        onPress={() => _clearSession(triggerLogout)}
      >{`Welcome Back ${userGivenName}`}</Text>
    </View>
  );
};
