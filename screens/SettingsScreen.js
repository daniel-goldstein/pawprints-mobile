import React from 'react';
import { View, Text } from 'react-native';

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'Useless',
  };

  render() {
    return (
      <View>
        <Text>Do we need a third tab is the question</Text>
      </View>
    );
  }
}
