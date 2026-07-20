export const firebaseConfig = {
  apiKey: 'AIzaSyByvK3sAsxbzXGmXWVs3GFObGZEtCpC4Mg',
  authDomain: 'mis-student-6yhtxk.firebaseapp.com',
  projectId: 'mis-student-6yhtxk',
  storageBucket: 'mis-student-6yhtxk.firebasestorage.app',
  messagingSenderId: '199745552461',
  appId: '1:199745552461:web:b3d1a829f1eb451b595c04',
  // Live Bus Tracking's GPS pings live in Realtime Database, not Firestore.
  // Firebase only generates this URL once RTDB is enabled in the console
  // (Build > Realtime Database > Create Database) - if that was done in a
  // region other than us-central1, replace this with the exact URL shown
  // there (it'll look like https://PROJECT_ID-default-rtdb.REGION.firebasedatabase.app).
  databaseURL: 'https://mis-student-6yhtxk-default-rtdb.firebaseio.com',
};
