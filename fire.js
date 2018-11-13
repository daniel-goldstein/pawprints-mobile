import firebase from 'firebase';
import { FIREBASE_CONFIG } from './properties';

let fire = firebase.initializeApp(FIREBASE_CONFIG);
let rootRef = fire.database().ref();
let cluesRef = rootRef.child('clues');
let huntersRef = rootRef.child('hunters');
let storageRef = fire.storage().ref();

export {
  cluesRef,
  huntersRef,
  storageRef
}