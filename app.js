// =================================================================
// ANONTALK - Main Application Logic (app.js) - PERPLEXITY-INFORMED FIX
// This version correctly handles the `signInWithRedirect` flow by
// explicitly calling `getRedirectResult` on startup.
// =================================================================

// --- Firebase SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
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
const mainAppContainer = document.getElementById('app');
const airlockScreen = document.getElementById('airlock-screen');
const gatewayScreen = document.getElementById('gateway-screen');
const profileScreen = document.getElementById('profile-setup-screen');
const requestAccessButton = document.querySelector('.request-access-button');
const initKeyInput = document.getElementById('gateway-init-key');
const realNameInput = document.getElementById('real-name-input');
const registerAgentBtn = document.getElementById('register-agent-btn');

// --- State Management ---
let initKeyListenerAttached = false;
let registerListenerAttached = false;

// --- UTILITY FUNCTIONS ---
function showOnlyScreen(screenEl) {
  const screens = [airlockScreen, gatewayScreen, profileScreen];
  screens.forEach(el => {
    if (el) el.classList.toggle('hidden', el !== screenEl);
  });
}

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
const CODENAMES = ['OPERATOR', 'SPECTRE', 'GHOST', 'ECHO', 'PHANTOM', 'RAVEN', 'NOVA', 'MAVERICK', 'SENTINEL', 'FALCON'];

// --- CORE APPLICATION LOGIC ---

/**
 * The main initialization function for the entire application.
 */
async function initialize() {
  try {
    // 1. CRITICAL STEP: Actively process the redirect result.
    // This is the "handshake". It will be null if no redirect happened.
    console.log("Checking for redirect result...");
    await getRedirectResult(auth);
    console.log("Redirect result processed.");

  } catch (error) {
    console.error("Error processing redirect result:", error);
  }

  // 2. NOW, we can safely listen for the auth state.
  // This listener will now fire with the correct, post-handshake user state.
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    unsubscribe(); // We only need this initial check once on page load.

    // 3. Hide loader and show the main application content.
    loadingIndicator.classList.add('hidden');
    mainAppContainer.classList.remove('hidden');

    // 4. Route the user based on the definitive state.
    if (user) {
      console.log("Definitive state: User is LOGGED IN", user.uid);
      await routeUser(user);
    } else {
      console.log("Definitive state: User is LOGGED OUT");
      showOnlyScreen(airlockScreen);
    }
  });
}

/**
 * Determines whether to show the profile setup or gateway screen for a logged-in user.
 */
async function routeUser(user) {
  try {
    const userRef = ref(db, `users/${user.uid}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      console.log("Profile found. Showing Gateway.");
      showOnlyScreen(gatewayScreen);
      attachInitKeyListener();
    } else {
      console.log("No profile found. Showing Profile Setup.");
      showOnlyScreen(profileScreen);
      attachRegisterListener();
    }
  } catch (err) {
    console.error("Failed to check user profile:", err);
    showOnlyScreen(profileScreen);
    attachRegisterListener();
  }
}

// --- Event Listeners and Handlers ---
requestAccessButton.addEventListener('click', () => {
  window.location.href = 'login.html';
});

function attachInitKeyListener() {
  if (initKeyListenerAttached) return;
  initKeyListenerAttached = true;
  initKeyInput.addEventListener('keydown', handleInitKeySubmit);
}

function handleInitKeySubmit(event) {
  if (event.key === 'Enter') {
    const enteredKey = initKeyInput.value.trim();
    if (enteredKey === CORRECT_INIT_KEY) {
      window.location.href = 'chat.html';
    } else {
      initKeyInput.classList.add('error');
      initKeyInput.value = '';
      setTimeout(() => initKeyInput.classList.remove('error'), 500);
    }
  }
}

function attachRegisterListener() {
  if (registerListenerAttached) return;
  registerListenerAttached = true;
  registerAgentBtn.addEventListener('click', registerAgent);
  realNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') registerAgent(); });
}

async function registerAgent() {
  const user = auth.currentUser;
  if (!user) { showOnlyScreen(airlockScreen); return; }
  const realName = (realNameInput.value || '').trim();
  if (!realName) {
    realNameInput.classList.add('error');
    setTimeout(() => realNameInput.classList.remove('error'), 500);
    return;
  }
  const agentId = `${CODENAMES[randomInt(0, CODENAMES.length - 1)]}_${randomInt(1, 99)}`;
  const profileData = { realName, agentId, uid: user.uid };
  registerAgentBtn.disabled = true;
  try {
    await set(ref(db, `users/${user.uid}`), profileData);
    showOnlyScreen(gatewayScreen);
    attachInitKeyListener();
  } catch (error) {
    console.error("Failed to save profile:", error);
    registerAgentBtn.disabled = false;
  }
}

// --- Application Start ---
initialize();
