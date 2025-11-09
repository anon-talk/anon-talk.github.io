// File: firebase-init.js

// Import Firebase modules (modular SDK v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- Your Firebase project configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyD-vVX8crq-jPCCug1T2KLWvoSlI0odtzs",
  authDomain: "anontalk-f43b3.firebaseapp.com",
  databaseURL: "https://anontalk-f43b3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "anontalk-f43b3",
  storageBucket: "anontalk-f43b3.firebasestorage.app",
  messagingSenderId: "715920696505",
  appId: "1:715920696505:web:9a2bec0afebdbfe9b22768"
};


// --- Initialize the core Firebase app ---
const app = initializeApp(firebaseConfig);

// --- Initialize services ---
export const auth = getAuth(app);

// Explicitly connect to your regional Realtime Database
export const db = getDatabase(
  app,
  "https://anontalk-f43b3-default-rtdb.asia-southeast1.firebasedatabase.app"
);
