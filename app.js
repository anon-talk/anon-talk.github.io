// =================================================================
// ANONTALK - Main Application Logic (app.js) with Profile Setup
// FIXED: Now handles initial auth load state correctly.
// =================================================================

// --- Firebase SDK Imports (Modern v9+ modular syntax) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyD-vVX8crq-jPCCug1T2KLWvoSlI0odtzs",
    authDomain: "anontalk-f43b3.firebaseapp.com",
    projectId: "anontalk-f43b3",
    storageBucket: "anontalk-f43b3.firebasestorage.app",
    messagingSenderId: "715920696505",
    appId: "1:715920696505:web:9a2bec0afebdbfe9b22768"
};

// --- Initialize Firebase and Services ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- Configuration ---
const CORRECT_INIT_KEY = "AUTHORIZE_OPERATOR_ANIRUDH";

// --- DOM Element References ---
const loadingIndicator = document.getElementById('loading-indicator'); // <-- FIX: Reference to the new loader
const airlockScreen = document.getElementById('airlock-screen');
const gatewayScreen = document.getElementById('gateway-screen');
const profileScreen = document.getElementById('profile-setup-screen');

const requestAccessButton = document.querySelector('.request-access-button');
const initKeyInput = document.getElementById('gateway-init-key');

const realNameInput = document.getElementById('real-name-input');
const registerAgentBtn = document.getElementById('register-agent-btn');

const godModeButton = document.querySelector('.gateway-footer__action[type="button"]:nth-of-type(2)');

// --- Utility Functions ---

/**
 * Shows only the specified screen, hiding all others and the loading indicator.
 */
function showOnlyScreen(screenEl) {
  // <-- FIX: Hide the loading indicator whenever a screen is shown
  if (loadingIndicator) {
    loadingIndicator.classList.add('hidden');
  }

  const screens = [airlockScreen, gatewayScreen, profileScreen];
  screens.forEach(el => {
    if (!el) return;
    const show = el === screenEl;
    el.classList.toggle('hidden', !show);
    el.setAttribute('aria-hidden', show ? 'false' : 'true');
  });
}

/**
 * Generates a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Available codenames for agent ID generation
 */
const CODENAMES = [
  'OPERATOR', 'SPECTRE', 'GHOST', 'ECHO', 'PHANTOM',
  'RAVEN', 'NOVA', 'MAVERICK', 'SENTINEL', 'FALCON'
];

// --- State Management (prevents duplicate listeners) ---
let initKeyListenerAttached = false;
let registerListenerAttached = false;

// --- Authentication Flow ---

/**
 * Main authentication listener
 * Routes users to appropriate screen based on auth state and profile status
 */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Auth state changed: User is LOGGED IN", user.uid);

    try {
      const userRef = ref(db, `users/${user.uid}`);
      const snap = await get(userRef);

      if (snap.exists()) {
        // Profile exists -> proceed to Gateway
        console.log("Profile found for user:", user.uid);
        showOnlyScreen(gatewayScreen);
        attachInitKeyListener();
      } else {
        // No profile -> force profile setup
        console.log("No profile found. Redirecting to profile setup.");
        showOnlyScreen(profileScreen);
        attachRegisterListener();
      }
    } catch (err) {
      console.error("Failed to check user profile:", err);
      // Fail-safe: send to profile setup to avoid blocking
      showOnlyScreen(profileScreen);
      attachRegisterListener();
    }
  } else {
    console.log("Auth state changed: User is LOGGED OUT");
    showOnlyScreen(airlockScreen);
  }
});

// --- Request Access Flow ---

/**
 * Handles the "Request Access" button on Airlock screen
 * Redirects to login page
 */
requestAccessButton.addEventListener('click', () => {
  window.location.href = 'login.html';
});

// --- Gateway: Initialization Key ---

/**
 * Attaches the init key listener (once only)
 */
function attachInitKeyListener() {
  if (initKeyListenerAttached) return;
  initKeyListenerAttached = true;

  initKeyInput.addEventListener('keydown', handleInitKeySubmit);
}

/**
 * Handles initialization key submission
 * Validates key and redirects to chat on success
 */
function handleInitKeySubmit(event) {
  if (event.key === 'Enter') {
    const enteredKey = initKeyInput.value.trim();

    if (enteredKey === CORRECT_INIT_KEY) {
      console.log("Initialization Key correct. Redirecting to chat...");
      window.location.href = 'chat.html';
    } else {
      console.error("Incorrect Initialization Key entered.");
      initKeyInput.classList.add('error');
      initKeyInput.value = '';
      setTimeout(() => initKeyInput.classList.remove('error'), 500);
    }
  }
}

// --- Profile Setup: Register Agent ---

/**
 * Attaches the register button listener (once only)
 */
function attachRegisterListener() {
  if (registerListenerAttached) return;
  registerListenerAttached = true;

  registerAgentBtn.addEventListener('click', registerAgent);
}

/**
 * Handles profile registration
 * Creates user profile with real name and generated agent ID
 */
async function registerAgent() {
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user. Cannot register profile.");
    showOnlyScreen(airlockScreen);
    return;
  }

  const realName = (realNameInput.value || '').trim();
  if (!realName) {
    realNameInput.classList.add('error');
    setTimeout(() => realNameInput.classList.remove('error'), 500);
    return;
  }

  // Generate Agent ID like OPERATOR_7
  const codename = CODENAMES[randomInt(0, CODENAMES.length - 1)];
  const number = randomInt(1, 99);
  const agentId = `${codename}_${number}`;

  const profileData = {
    realName,
    agentId,
    uid: user.uid
  };

  // Disable button during save to avoid double submissions
  registerAgentBtn.disabled = true;

  try {
    await set(ref(db, `users/${user.uid}`), profileData);
    console.log("Profile created successfully:", profileData);

    // Transition to Gateway
    showOnlyScreen(gatewayScreen);
    attachInitKeyListener();
  } catch (error) {
    console.error("Failed to save profile:", error);
    // Re-enable to try again
    registerAgentBtn.disabled = false;
  }
}
