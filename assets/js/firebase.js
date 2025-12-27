// =======================
// FIREBASE SDK IMPORTS
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

// =======================
// FIREBASE CONFIGURATION
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyCqWIGZcZK-eSBYADas0HcK-vP6M7stROE",
  authDomain: "kelarondogleweb.firebaseapp.com",
  projectId: "kelarondogleweb",
  storageBucket: "kelarondogleweb.firebasestorage.app",
  messagingSenderId: "53900919628",
  appId: "1:53900919628:web:5ebb7dcf15d20cbef885e9",
  measurementId: "G-43WPNP32TM"
};

// =======================
// INITIALIZE FIREBASE
// =======================
const app = initializeApp(firebaseConfig);

// =======================
// EXPORT FIREBASE SERVICES
// =======================
export const auth = getAuth(app);         // Firebase Authentication
export const db = getFirestore(app);      // Firestore Database
export const storage = getStorage(app);   // Firebase Storage

