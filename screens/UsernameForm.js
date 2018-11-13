import React from 'react';
import { View, Modal } from 'react-native';
import { FormLabel, FormInput, Button } from 'react-native-elements';

export default class UsernameForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: ""
    };
  }

  handleChange = (newUsername) => {
    this.setState({ username : newUsername });
  };

  render() {
    return (
      <Modal
        animationType="slide"
        visible={true}>

        <View style={{flex: 8, flexDirection: "column",
          justifyContent: "center", alignItems: "flex-start"}}>
          <FormLabel>
            Enter your username:
          </FormLabel>
          <FormInput value={this.state.username}
                     autoCapitalize="none"
                     placeholder="Username"
                     onChangeText={this.handleChange} />
          <Button title="Submit"
                  disabled={this.state.username === ""}
                  onPress={() => this.props.submitUsername(this.state.username)}/>
        </View>
      </Modal>
    );
  }
}