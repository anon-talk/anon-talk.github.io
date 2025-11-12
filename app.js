// =================================================================
// ANONTALK - Main Application Logic (app.js) - DEFINITIVE FIX
// This version uses a one-time promise-based auth check on startup
// to eliminate race conditions and ensure the correct screen is always shown.
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
    if (!el) return;
    el.classList.toggle('hidden', el !== screenEl);
    el.setAttribute('aria-hidden', el !== screenEl);
  });
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CODENAMES = ['OPERATOR', 'SPECTRE', 'GHOST', 'ECHO', 'PHANTOM', 'RAVEN', 'NOVA', 'MAVERICK', 'SENTINEL', 'FALCON'];

// --- CORE APPLICATION LOGIC ---

/**
 * NEW: A function that returns a Promise which resolves with the
 * first definitive authentication state from Firebase. This is the key to the fix.
 */
function getInitialAuthState() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // We only want the *first* result, so we immediately unsubscribe.
      resolve(user);   // Resolve the promise with the user object or null.
    });
  });
}

/**
 * The main initialization function for the entire application.
 */
async function initialize() {
  // 1. Wait until we know for sure if a user is logged in or not.
  const user = await getInitialAuthState();

  // 2. Now that we have the answer, hide the loader and show the app container.
  loadingIndicator.classList.add('hidden');
  mainAppContainer.classList.remove('hidden');

  // 3. Route the user to the correct screen based on the definitive auth state.
  if (user) {
    console.log("Initial state: User is LOGGED IN", user.uid);
    await routeUser(user);
  } else {
    console.log("Initial state: User is LOGGED OUT");
    showOnlyScreen(airlockScreen);
  }

  // 4. (Optional but good practice) Attach a persistent listener for real-time logouts.
  onAuthStateChanged(auth, (currentUser) => {
    if (!currentUser) {
      console.log("User logged out in real-time. Returning to Airlock.");
      // You might want to redirect to index.html if they are on another page
      if (window.location.pathname.includes('chat.html')) {
          window.location.href = '/';
      } else {
          showOnlyScreen(airlockScreen);
      }
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
    // Fail-safe to the profile screen to prevent getting stuck
    showOnlyScreen(profileScreen);
    attachRegisterListener();
  }
}

// --- Event Listeners and Handlers ---

requestAccessButton.addEventListener('click', () => {
  // The boot animation is purely cosmetic and gets interrupted by the redirect.
  // The primary action is the redirect itself.
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

function attachRegisterListener() {
  if (registerListenerAttached) return;
  registerListenerAttached = true;
  registerAgentBtn.addEventListener('click', registerAgent);
  realNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') registerAgent();
  });
}

async function registerAgent() {
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user during registration attempt.");
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

// --- Application Start ---
initialize();
