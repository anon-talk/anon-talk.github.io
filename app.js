// =================================================================
// ANONTALK - Main Application Logic (app.js)
// =================================================================

// --- Firebase SDK Imports (Modern v9+ modular syntax) ---
// Import the initialized services from our central file
import { auth, db } from './firebase-init.js';

// Import the specific functions we need for this page
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// Note: 'ref' and 'set' are not used on this page, so they can be removed for efficiency.


// --- Configuration ---
const CORRECT_INIT_KEY = "AUTHORIZE_OPERATOR_ANIRUDH"; // You can change this secret key!

// --- DOM Element References ---
const airlockScreen = document.getElementById('airlock-screen');
const gatewayScreen = document.getElementById('gateway-screen');
const requestAccessButton = document.querySelector('.request-access-button');
const initKeyInput = document.getElementById('gateway-init-key');
const godModeButton = document.querySelector('.gateway-footer__action[type="button"]:nth-of-type(2)'); // A more robust way to select it

// --- Core Application Logic ---

/**
 * The main listener that runs when the page loads.
 * It checks the user's login state and shows the correct screen.
 */
onAuthStateChanged(auth, user => {
    if (user) {
        // --- USER IS LOGGED IN ---
        console.log("Auth state changed: User is LOGGED IN", user.uid);

        // Hide the Airlock screen, show the Gateway screen
        airlockScreen.classList.add('hidden');
        gatewayScreen.classList.remove('hidden');

        // Now that the user is logged in, we can add the event listener for the init key
        initKeyInput.addEventListener('keydown', handleInitKeySubmit);

    } else {
        // --- USER IS NOT LOGGED IN ---
        console.log("Auth state changed: User is LOGGED OUT");

        // Show the Airlock screen, hide the Gateway screen
        airlockScreen.classList.remove('hidden');
        gatewayScreen.classList.add('hidden');
    }
});

/**
 * Handles the click on the initial "Request Access" button.
 * This function redirects the user to the login page.
 */
requestAccessButton.addEventListener('click', () => {
    // We redirect directly to the login page.
    window.location.href = 'login.html';
});

/**
 * Handles the submission of the Initialization Key.
 * This runs when the user presses "Enter" in the input field.
 */
function handleInitKeySubmit(event) {
    if (event.key === 'Enter') {
        const enteredKey = initKeyInput.value.trim();

        if (enteredKey === CORRECT_INIT_KEY) {
            // SUCCESS: The key is correct.
            console.log("Initialization Key correct. Redirecting to chat...");
            // Redirect the user to the main chat page.
            window.location.href = 'chat.html';
        } else {
            // FAILURE: The key is incorrect.
            console.error("Incorrect Initialization Key entered.");
            
            // Add the 'error' class to trigger the animation and red glow
            // Make sure the 'error' class and its @keyframes are defined in your index.html CSS
            initKeyInput.classList.add('error');
            initKeyInput.value = ''; // Clear the input

            // After the animation finishes, remove the class so it can play again
            setTimeout(() => {
                initKeyInput.classList.remove('error');
            }, 500); // This duration must match the animation duration
        }
    }
}
