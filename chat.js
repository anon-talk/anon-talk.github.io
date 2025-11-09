// --- Firebase SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, onValue, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyD-vVX8crq-jPCCug1T2KLWvoSlI0odtzs",
    authDomain: "anontalk-f43b3.firebaseapp.com",
    projectId: "anontalk-f43b3",
    storageBucket: "anontalk-f43b3.firebasestorage.app",
    messagingSenderId: "715920696505",
    appId: "1:715920696505:web:9a2bec0afebdbfe9b22768"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- DOM References ---
const messageInput = document.querySelector('.pill-input');
const sendButtons = document.querySelectorAll('.send-btn');

// --- Send Message Function ---
function sendMessage() {
    // Get current user
    const user = auth.currentUser;
    
    if (!user) {
        console.error("No user logged in!");
        return;
    }
    
    // Get message text
    const messageText = messageInput.value.trim();
    
    // Validate message is not empty
    if (!messageText) {
        console.warn("Cannot send empty message");
        return;
    }
    
    // Create message object
    const messageObject = {
        text: messageText,
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        timestamp: serverTimestamp()
    };
    
    // Get reference to messages in database
    const messagesRef = ref(db, 'messages');
    
    // Push new message to database
    const newMessageRef = push(messagesRef);
    set(newMessageRef, messageObject)
        .then(() => {
            console.log("Message sent successfully!");
            // Clear input field
            messageInput.value = '';
        })
        .catch((error) => {
            console.error("Error sending message:", error);
        });
}

// --- Event Listeners ---
// Add click event to all send buttons (desktop and mobile)
sendButtons.forEach(button => {
    button.addEventListener('click', sendMessage);
});

// Add Enter key support for input field
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// --- Auth Guard ---
onAuthStateChanged(auth, user => {
    if (user) {
        // User is logged in, allow them to see the page.
        console.log("Auth Guard: Access granted for user", user.uid);
        // Chat is ready - event listeners are already set up above
    } else {
        // User is NOT logged in.
        console.warn("Auth Guard: Access denied. Redirecting to login.");
        // Redirect them back to the landing page.
        window.location.replace('index.html');
    }
});
