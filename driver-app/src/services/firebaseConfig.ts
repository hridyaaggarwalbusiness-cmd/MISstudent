// Shared Firebase Web App config - same project (mis-student-6yhtxk) used by
// every app in this school system. This is a public client config (not a
// secret): access is enforced by Firestore/RTDB security rules, not by
// hiding this key.
export const firebaseConfig = {
  apiKey: 'AIzaSyByvK3sAsxbzXGmXWVs3GFObGZEtCpC4Mg',
  authDomain: 'mis-student-6yhtxk.firebaseapp.com',
  projectId: 'mis-student-6yhtxk',
  storageBucket: 'mis-student-6yhtxk.firebasestorage.app',
  messagingSenderId: '199745552461',
  appId: '1:199745552461:web:b3d1a829f1eb451b595c04',
  // Live Bus Tracking's GPS pings live in Realtime Database, not Firestore.
  // This is the exact URL Firebase generated when Realtime Database was
  // enabled (asia-southeast1 region) - confirmed from the console.
  databaseURL: 'https://mis-student-6yhtxk-default-rtdb.asia-southeast1.firebasedatabase.app',
};
