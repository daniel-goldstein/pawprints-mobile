import React from "react";
import { MapView } from "expo";

export default class Clue extends React.Component {
  render() {
    const clue = this.props.clue;
    const coords = {
      latitude: clue.latitude,
      longitude: clue.longitude
    };
    const description = clue.completed ? "Completed!" : "Not completed";

    return (
      <MapView.Marker
        key={clue.clueId}
        coordinate={coords}
        title={this.clueDescr(clue)}
        description={description}
        pinColor={this.props.color}
        onCalloutPress={this.props.onCluePress}
      />
    );
  }

  clueDescr(clue) {
    const titleAndId = `${clue.title} (${clue.clueListId}${clue.clueNum})`;

    return clue.inCrawl ? `${titleAndId} (Crawl)` : titleAndId;
  }
}
