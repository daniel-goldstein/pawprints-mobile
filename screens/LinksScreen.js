import React from "react";
import {
  FlatList,
  Linking,
  StyleSheet,
  SafeAreaView,
  View,
  Text
} from "react-native";

const DATA = [
  {
    id: "0",
    name: "Google Drive Photo Submissions",
    link:
      "https://drive.google.com/drive/u/2/folders/1XLGlbKDoCtR4B6SVs-JENEcQGxLxNOL5"
  }
];

function Item({ name, link }) {
  console.log(name);
  return (
    <View style={styles.item}>
      <Text onPress={() => Linking.openURL(link)} style={styles.title}>
        {name}
      </Text>
    </View>
  );
}

export default class LinksScreen extends React.Component {
  static navigationOptions = {
    title: "Links"
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={DATA}
          renderItem={({ item }) => <Item name={item.name} link={item.link} />}
          keyExtractor={item => item.id}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fff"
  },
  item: {
    backgroundColor: "#f9c2ff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16
  }
});
