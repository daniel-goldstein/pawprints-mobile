import React from 'react'
import { Camera, Permissions } from 'expo';
import { Platform, View, Text, TouchableOpacity, Dimensions, ImageBackground, StyleSheet} from 'react-native';

import { Button, Icon } from 'native-base';

import { storageRef, cluesRef } from "../fire";


const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default class CameraScreen extends React.Component {

    static navigationOptions = {
        header: null,
        tabBarVisible: false
    };

  constructor(props) {
    super(props);

    this.state = {
      hasCameraPermission: null,
      type: Camera.Constants.Type.front,
      photo: null
    };
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  // automatically re-renders if state is changed
  render() {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (!hasCameraPermission) {
      return <Text>No access to camera</Text>;
    } else if (this.state.photo !== null) {
      return (

        <View>

            <ImageBackground style={{width: screenWidth,
                                    height: screenHeight}}
                             source={{uri: `data:image/jpg;base64, ${this.state.photo.base64}`}}>

                <View style={styles.topBar}>
                    <TouchableOpacity
                                      onPress={() => this.setState({ photo: null })}>
                        <Icon name='ios-close-circle' />
                    </TouchableOpacity>
                </View>
                <View style={styles.bottomBar}>
                    <Button success iconRight
                            onPress={() => {this.snap(); this.setState({photo: null})}}>
                        <Icon name='ios-arrow-forward' />
                    </Button>
                </View>
            </ImageBackground>
        </View>
      );
    } else {
      return (
        <View style={{ flex: 1 }}>
          <Camera style={{ flex: 1 }}
                  type={this.state.type}
                  ref={ cam => this.camera = cam }>
            <View style={{
                flex: 1,
                backgroundColor: 'transparent',
                flexDirection: 'row',
              }}>
                <Button danger onPress={() => this.props.navigation.pop()}
                                style={{height: 30,
                                        width: 30}}>
                </Button>
              <TouchableOpacity
                style={{
                  flex: 0.1,
                  alignSelf: 'flex-end',
                  alignItems: 'center',
                }}
                onPress={() => {
                  this.setState({
                    type: this.state.type === Camera.Constants.Type.back
                      ? Camera.Constants.Type.front
                      : Camera.Constants.Type.back,
                  });
                }}>
                <Text
                  style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>
                  {' '}Flip{' '}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 0.1,
                  alignSelf: 'flex-end',
                  alignItems: 'center',
                }}
                onPress={this.snap}
                >
                <Text
                  style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>
                  {' '}Capture{' '}
                </Text>
              </TouchableOpacity>
            </View>
          </Camera>
        </View>

      );
    }
  }


  snap = async () => {

    if (this.camera) {

      let photo = await this.camera.takePictureAsync({base64: true});
      this.setState({ photo });

      const photoFromUri = await fetch(photo.uri);
      const photoBlob = await photoFromUri.blob();

      storageRef.child('asdf').put(photoBlob);
      cluesRef.child(this.props.clue.key).update({completed: !this.props.clue.completed})

    }
  }
}

const styles = StyleSheet.create({

        MainContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },

        topBar: {
            display: 'flex',
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'flex-start'
        },

        bottomBar: {
            display: 'flex',
            flex: 1,
            justifyContent: 'flex-end',
            alignItems: 'flex-end'
        },

        topLeftButton: {
            paddingTop: ( Platform.OS === 'ios' ) ? 40 : 0,
            paddingLeft: 10
        },

        bottomView: {
            width: '20%',
            height: '20%',
            paddingBottom: 100,
            backgroundColor: '#FF9800',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            bottom: 0,
            right: 0
        },

        textStyle: {
            color: '#fff',
            fontSize: 22
        }

});
