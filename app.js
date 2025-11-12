// =================================================================
// ANONTALK - Main Application Logic (app.js) - FINAL FIX
// Solves the "black screen" issue by revealing the main app container
// only after authentication is confirmed.
// =================================================================

// --- Firebase SDK Imports ---
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
const loadingIndicator = document.getElementById('loading-indicator');
const mainAppContainer = document.getElementById('app'); // <-- NEW: Reference to the main container
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
 * Shows only the specified screen, hiding all others.
 * This function now assumes the main app container is already visible.
 */
function showOnlyScreen(screenEl) {
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

const CODENAMES = ['OPERATOR', 'SPECTRE', 'GHOST', 'ECHO', 'PHANTOM', 'RAVEN', 'NOVA', 'MAVERICK', 'SENTINEL', 'FALCON'];

// --- State Management ---
let initKeyListenerAttached = false;
let registerListenerAttached = false;

// --- Authentication Flow ---

/**
 * Main authentication listener. This is the entry point of the app logic.
 */
onAuthStateChanged(auth, async (user) => {
  // First, hide the main loading indicator and reveal the application container.
  // This happens once the very first auth check is complete.
  loadingIndicator.classList.add('hidden');
  mainAppContainer.classList.remove('hidden');

  if (user) {
    console.log("Auth state changed: User is LOGGED IN", user.uid);
    try {
      const userRef = ref(db, `users/${user.uid}`);
      const snap = await get(userRef);

      if (snap.exists()) {
        console.log("Profile found for user:", user.uid);
        showOnlyScreen(gatewayScreen);
        attachInitKeyListener();
      } else {
        console.log("No profile found. Redirecting to profile setup.");
        showOnlyScreen(profileScreen);
        attachRegisterListener();
      }
    } catch (err) {
      console.error("Failed to check user profile:", err);
      showOnlyScreen(profileScreen);
      attachRegisterListener();
    }
  } else {
    console.log("Auth state changed: User is LOGGED OUT");
    showOnlyScreen(airlockScreen);
  }
});

// --- Request Access Flow ---
requestAccessButton.addEventListener('click', () => {
  window.location.href = 'login.html';
});

// --- Gateway: Initialization Key ---
function attachInitKeyListener() {
  if (initKeyListenerAttached) return;
  initKeyListenerAttached = true;
  initKeyInput.addEventListener('keydown', handleInitKeySubmit);
}

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
function attachRegisterListener() {
  if (registerListenerAttached) return;
  registerListenerAttached = true;
  registerAgentBtn.addEventListener('click', registerAgent);
}

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
  const codename = CODENAMES[randomInt(0, CODENAMES.length - 1)];
  const number = randomInt(1, 99);
  const agentId = `${codename}_${number}`;
  const profileData = { realName, agentId, uid: user.uid };
  registerAgentBtn.disabled = true;

  try {
    await set(ref(db, `users/${user.uid}`), profileData);
    console.log("Profile created successfully:", profileData);
    showOnlyScreen(gatewayScreen);
    attachInitKeyListener();
  } catch (error) {
    console.error("Failed to save profile:", error);
    registerAgentBtn.disabled = false;
  }
}
