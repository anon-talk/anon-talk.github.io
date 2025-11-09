// =================================================================
// ANONTALK - Main Chat Logic (chat.js)
// =================================================================

// --- Firebase SDK Imports ---
// Import the initialized services from our central file.
import { auth, db } from './firebase-init.js';

// Import the specific Firebase functions we need for this page.
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, onValue, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- DOM References ---
const messageInput = document.querySelector('.pill-input');
// Use a more specific selector to avoid conflicts with desktop/mobile versions
const sendButtons = document.querySelectorAll('.send-btn, .composer-buttons .send-btn');
const historyInner = document.querySelector('.history-inner');

// --- Main App Logic ---

let currentUser = null; // Variable to hold the current user info

/**
 * This function will run ONLY if the user is successfully authenticated.
 * All of our main chat logic will go inside here.
 * @param {object} user - The authenticated user object from Firebase.
 */
function initializeChat(user) {
    currentUser = user;
    console.log(`Welcome, Agent ${user.uid}. The chat is now live.`);
    
    // Add click event to all send buttons
    sendButtons.forEach(button => {
        button.addEventListener('click', sendMessage);
    });

    // Add Enter key support for input field
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // TODO: Add the "receive messages" listener here.
}

// --- Send Message Function ---
function sendMessage() {
    if (!currentUser) {
        console.error("No user logged in!");
        return;
    }
    
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        console.warn("Cannot send empty message");
        return;
    }
    
    const messageObject = {
        text: messageText,
        uid: currentUser.uid,
        displayName: currentUser.displayName || "Anonymous", // This will be replaced by our Agent ID later
        timestamp: serverTimestamp()
    };
    
    const messagesRef = ref(db, 'messages');
    
    const newMessageRef = push(messagesRef);
    set(newMessageRef, messageObject)
        .then(() => {
            console.log("Message sent successfully!");
            messageInput.value = ''; // Clear input field
        })
        .catch((error) => {
            console.error("Error sending message:", error);
        });
}

// --- Auth Guard ---
onAuthStateChanged(auth, user => {
    if (user) {
        // --- USER IS LOGGED IN ---
        initializeChat(user);
    } else {
        // --- USER IS NOT LOGGED IN ---
        console.warn("Auth Guard: Access denied. User is not logged in. Redirecting...");
        window.location.replace('index.html');
    }
});
