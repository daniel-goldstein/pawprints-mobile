import React from "react";
import { MapView } from "expo";

const RED = '#ff0000';
const BLUE = '#0000ff';

export default class Clue extends React.Component {

  render() {
    const clue = this.props.clue;

    const coords = {
      latitude: clue.latitude,
      longitude: clue.longitude
    };
    const description = clue.completed ? "Completed!" : "Not completed";
    const color = clue.completed ? BLUE : RED;

    return (
      <MapView.Marker
        key={clue.clueNumber}
        coordinate={coords}
        title={clue.title}
        description={description}
        pinColor={color}
        onCalloutPress={this.props.onCluePress}
      />
    );
  }
}
