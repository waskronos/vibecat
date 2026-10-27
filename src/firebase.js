const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyBSc98tqMcvKio7bO3RfpDnkpz88R8uhtM",
  authDomain: "vibecat-d21a2.firebaseapp.com",
  databaseURL: "https://vibecat-d21a2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vibecat-d21a2",
  storageBucket: "vibecat-d21a2.firebasestorage.app",
  messagingSenderId: "20093334213",
  appId: "1:20093334213:web:b6c0559a1470b6f80476ac"
}

const app = initializeApp(firebaseConfig);
module.exports = getDatabase(app);