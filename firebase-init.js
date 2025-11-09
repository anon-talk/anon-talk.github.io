// File: firebase-init.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD-vVX8crq-jPCCug1T2KLWvoSlI0odtzs",
    authDomain: "anontalk-f43b3.firebaseapp.com",
    projectId: "anontalk-f43b3",
    storageBucket: "anontalk-f43b3.firebasestorage.app",
    messagingSenderId: "715920696505",
    appId: "1:715920696505:web:9a2bec0afebdbfe9b22768"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services for other files to use
export const auth = getAuth(app);
export const db = getDatabase(app);
