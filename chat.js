// =================================================================
// ANONTALK - Main Chat Logic (chat.js) - CORRECTED & PRODUCTION-READY
// =================================================================

// --- Firebase SDK Imports ---
// Import the initialized services from our central file.
import { auth, db } from './firebase-init.js';

// Import the specific Firebase functions we need for this page.
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- DOM References ---
// FIX #1: Use more specific, robust selectors that work across all viewport sizes
const messageInput = document.querySelector('.pill-input');
const sendButtons = document.querySelectorAll('.send-btn'); // Simplified: just select all send buttons
const historyInner = document.querySelector('.history-inner');

// --- Validation Helpers ---
/**
 * Validates that all required DOM elements are present
 * @throws {Error} if any critical DOM element is missing
 */
function validateDOMElements() {
    if (!messageInput) {
        throw new Error("CRITICAL: Message input element (.pill-input) not found in DOM");
    }
    if (!sendButtons || sendButtons.length === 0) {
        throw new Error("CRITICAL: Send button elements (.send-btn) not found in DOM");
    }
    if (!historyInner) {
        throw new Error("CRITICAL: History container (.history-inner) not found in DOM");
    }
    console.log(`✓ DOM validation passed. Found ${sendButtons.length} send button(s).`);
}

// --- Main App Logic ---
let currentUser = null; // Variable to hold the current user info

/**
 * This function will run ONLY if the user is successfully authenticated.
 * All of our main chat logic will go inside here.
 * @param {object} user - The authenticated user object from Firebase.
 */
function initializeChat(user) {
    currentUser = user;
    console.log(`✓ Welcome, Agent ${user.uid}. The chat is now live.`);
    
    // FIX #2: Attach click event listeners to ALL send buttons
    // This ensures that both desktop and mobile buttons work regardless of visibility state
    sendButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            console.log(`Send button #${index} clicked`);
            sendMessage();
        });
    });

    // FIX #3: Add Enter key support for input field
    // Support both Enter (13) and soft-Enter (when key === 'Enter')
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline insertion
            console.log("Enter key pressed in message input");
            sendMessage();
        }
    });

    console.log("✓ Chat initialization complete. Event listeners attached.");
}

// --- Send Message Function ---
/**
 * Sends a message to the Firebase Realtime Database
 * FIX #4: Comprehensive error handling and validation
 */
function sendMessage() {
    console.log("sendMessage() called");

    // FIX #5: Validate that user is authenticated before attempting to send
    if (!currentUser) {
        console.error("❌ SEND FAILED: No user logged in! Auth state lost.");
        return;
    }
    
    console.log(`Current user UID: ${currentUser.uid}`);

    // FIX #6: Get and validate message text
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        console.warn("⚠ Cannot send empty message");
        return;
    }
    
    console.log(`Message text length: ${messageText.length} characters`);

    // FIX #7: Create message object with all required fields
    // All fields must be present for proper database structure
    const messageObject = {
        text: messageText,
        uid: currentUser.uid,
        displayName: currentUser.displayName || "Anonymous",
        timestamp: serverTimestamp() // This is crucial - must use serverTimestamp() not Date.now()
    };
    
    console.log("Message object created:", {
        text: messageObject.text.substring(0, 50) + (messageObject.text.length > 50 ? "..." : ""),
        uid: messageObject.uid,
        displayName: messageObject.displayName,
        timestamp: "serverTimestamp()"
    });

    // FIX #8: Get reference to the messages path in the database
    // Ensure this path matches your Firebase Realtime Database structure
    const messagesRef = ref(db, 'messages');
    console.log("Messages ref created for path: /messages");
    
    // FIX #9: Use push() to create a new unique message ID, then set the data
    // This is the correct way to add data to a list in the Realtime Database
    const newMessageRef = push(messagesRef);
    console.log(`New message reference created with auto-generated ID`);
    
    // FIX #10: Call set() with comprehensive error handling
    set(newMessageRef, messageObject)
        .then(() => {
            console.log("✓ Message sent successfully to Firebase!");
            console.log(`Message saved to: /messages/${newMessageRef.key}`);
            
            // Clear input field ONLY on successful submission
            messageInput.value = '';
            messageInput.focus(); // Optionally refocus for better UX
            
            console.log("✓ Input field cleared. Ready for next message.");
        })
        .catch((error) => {
            console.error("❌ FIREBASE ERROR - Failed to send message:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            
            // FIX #11: Provide specific error guidance based on error code
            if (error.code === "PERMISSION_DENIED") {
                console.error("📋 TIP: Check your Firebase Realtime Database security rules.");
                console.error("Rule must allow authenticated users to write to /messages path.");
            } else if (error.code === "NETWORK_ERROR") {
                console.error("📋 TIP: Network error detected. Check your internet connection.");
            } else {
                console.error("📋 TIP: Check the Firebase Console for more details.");
            }
        });
}

// --- Auth Guard ---
/**
 * Listen for authentication state changes
 * This ensures the chat only functions when the user is authenticated
 */
onAuthStateChanged(auth, (user) => {
    if (user) {
        // --- USER IS LOGGED IN ---
        console.log(`✓ User authenticated: ${user.uid}`);
        
        try {
            validateDOMElements();
            initializeChat(user);
        } catch (error) {
            console.error("❌ Initialization failed:", error.message);
        }
    } else {
        // --- USER IS NOT LOGGED IN ---
        console.warn("🚨 Auth Guard: Access denied. User is not logged in. Redirecting to login...");
        window.location.replace('login.html'); // Redirect to login page
    }
});

// --- Runtime Error Handler ---
/**
 * Global error handler for uncaught errors
 * This helps catch any silent failures that might occur
 */
window.addEventListener('error', (event) => {
    console.error("❌ Uncaught error detected:", event.error);
});

/**
 * Handle unhandled promise rejections
 * Critical for catching Firebase promise errors
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error("❌ Unhandled promise rejection:", event.reason);
    event.preventDefault();
});
