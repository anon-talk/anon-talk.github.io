// =================================================================
// ANONTALK - Main Chat Logic (chat.js) - SEND + RECEIVE (Realtime)
// =================================================================

// --- Firebase SDK Imports ---
// Import the initialized services from our central file.
import { auth, db } from './firebase-init.js';

// Import the specific Firebase functions we need for this page.
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    ref,
    push,
    set,
    serverTimestamp,
    onValue,
    query,
    orderByChild
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- DOM References ---
const messageInput = document.querySelector('.pill-input');
const sendButtons = document.querySelectorAll('.send-btn');
const historyInner = document.querySelector('.history-inner');
const chatHistoryEl = document.querySelector('.chat-history'); // for auto-scrolling

// --- Validation Helpers ---
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
    if (!chatHistoryEl) {
        throw new Error("CRITICAL: Chat history scroller (.chat-history) not found in DOM");
    }
    console.log(`✓ DOM validation passed. Found ${sendButtons.length} send button(s).`);
}

// --- App State ---
let currentUser = null;        // Authenticated user
let messagesUnsubscribe = null; // To detach the DB listener if needed

// --- Initialization ---
function initializeChat(user) {
    currentUser = user;
    console.log(`✓ Welcome, Agent ${user.uid}. The chat is now live.`);

    // Attach click events to all send buttons (desktop + mobile)
    sendButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            console.log(`Send button #${index} clicked`);
            sendMessage();
        });
    });

    // Enter key support in input
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            console.log("Enter key pressed in message input");
            sendMessage();
        }
    });

    // Start realtime listener AFTER auth is confirmed
    startMessagesListener();

    console.log("✓ Chat initialization complete. Event listeners attached.");
}

// --- Send Message ---
function sendMessage() {
    console.log("sendMessage() called");

    if (!currentUser) {
        console.error("❌ SEND FAILED: No user logged in! Auth state lost.");
        return;
    }

    const messageText = messageInput.value.trim();
    if (!messageText) {
        console.warn("⚠ Cannot send empty message");
        return;
    }

    const messageObject = {
        text: messageText,
        uid: currentUser.uid,
        displayName: currentUser.displayName || "Anonymous",
        timestamp: serverTimestamp()
    };

    const messagesRef = ref(db, 'messages');
    const newMessageRef = push(messagesRef);

    set(newMessageRef, messageObject)
        .then(() => {
            console.log("✓ Message sent successfully to Firebase!");
            console.log(`Message saved to: /messages/${newMessageRef.key}`);
            messageInput.value = '';
            messageInput.focus();
        })
        .catch((error) => {
            console.error("❌ FIREBASE ERROR - Failed to send message:", error);
            if (error.code === "PERMISSION_DENIED") {
                console.error("📋 TIP: Check your Firebase Realtime Database security rules for /messages writes.");
            } else if (error.code === "NETWORK_ERROR") {
                console.error("📋 TIP: Network error detected. Check your internet connection.");
            }
        });
}

// --- Receive Messages (Realtime) ---
function startMessagesListener() {
    // If a listener already exists (defensive), detach it first
    if (typeof messagesUnsubscribe === 'function') {
        messagesUnsubscribe();
        messagesUnsubscribe = null;
    }

    const messagesRef = ref(db, 'messages');
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));

    console.log("✓ Subscribing to realtime updates at: /messages (ordered by timestamp)");

    messagesUnsubscribe = onValue(
        messagesQuery,
        (snapshot) => {
            // Clear existing to avoid duplicates
            historyInner.innerHTML = '';

            if (!snapshot.exists()) {
                console.log("ℹ No messages found.");
                autoScrollToBottom();
                return;
            }

            const fragment = document.createDocumentFragment();

            snapshot.forEach((childSnap) => {
                const msg = childSnap.val() || {};
                const key = childSnap.key;
                const article = buildMessageElement(msg, key);
                fragment.appendChild(article);
            });

            historyInner.appendChild(fragment);
            autoScrollToBottom();
        },
        (error) => {
            console.error("❌ Realtime listener error for /messages:", error);
        }
    );
}

// --- UI Helpers ---
function buildMessageElement(message, key) {
    const text = typeof message.text === 'string' ? message.text : '';
    const uid = typeof message.uid === 'string' ? message.uid : '';
    const rawName = typeof message.displayName === 'string' ? message.displayName.trim() : '';
    const displayName = rawName || 'Anonymous';

    const timeString = formatTimestamp(message.timestamp);
    const isOutgoing = !!(currentUser && uid === currentUser.uid);
    const isGod = displayName === 'Anirudh Gupta'; // Admin marker per requirements

    // <article> container
    const article = document.createElement('article');
    article.classList.add('msg');
    if (isOutgoing) article.classList.add('msg--out');
    if (isGod) article.classList.add('msg--god');
    article.setAttribute('aria-label', `Message from ${displayName} at ${timeString}`);
    if (key) article.dataset.key = key;

    // Meta line: </name> // at 3:21pm
    const meta = document.createElement('div');
    meta.className = 'msg__meta';

    // </ + name (+ highlight for non-outgoing) + > // at TIME
    meta.appendChild(document.createTextNode('</'));
    if (!isOutgoing) {
        const nameSpan = document.createElement('span');
        nameSpan.className = 'highlight-accent';
        nameSpan.textContent = displayName;
        meta.appendChild(nameSpan);
    } else {
        meta.appendChild(document.createTextNode(displayName));
    }
    meta.appendChild(document.createTextNode(`> // at ${timeString}`));

    // Text bubble
    const textDiv = document.createElement('div');
    textDiv.className = 'msg__text';
    textDiv.textContent = text; // Safe: no HTML injection

    article.appendChild(meta);
    article.appendChild(textDiv);

    return article;
}

function formatTimestamp(ts) {
    // Handles number (ms), numeric string, or missing
    let ms;
    if (typeof ts === 'number') {
        ms = ts;
    } else if (typeof ts === 'string') {
        const parsed = parseInt(ts, 10);
        ms = Number.isFinite(parsed) ? parsed : Date.now();
    } else if (ts && typeof ts === 'object' && typeof ts.seconds === 'number') {
        // In case a Firestore-like object slips in; fallback safely
        ms = ts.seconds * 1000;
    } else {
        ms = Date.now();
    }

    const d = new Date(ms);
    let t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    // Normalize AM/PM spacing/case -> "3:21pm"
    t = t.replace(/\s?AM/i, 'am').replace(/\s?PM/i, 'pm');
    return t;
}

function autoScrollToBottom() {
    if (!chatHistoryEl) return;
    // Wait until DOM paints, then scroll
    requestAnimationFrame(() => {
        chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    });
}

// --- Auth Guard ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log(`✓ User authenticated: ${user.uid}`);
        try {
            validateDOMElements();
            initializeChat(user);
        } catch (error) {
            console.error("❌ Initialization failed:", error.message);
        }
    } else {
        console.warn("🚨 Auth Guard: Access denied. User is not logged in. Redirecting to login...");
        window.location.replace('login.html');
    }
});

// --- Runtime Error Handlers ---
window.addEventListener('error', (event) => {
    console.error("❌ Uncaught error detected:", event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error("❌ Unhandled promise rejection:", event.reason);
    event.preventDefault();
});
