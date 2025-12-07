// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBAo7elPGYo4nxR2s0buYUItIN4J2JTyyU",
    authDomain: "building-maintenance-app-b2f7a.firebaseapp.com",
    projectId: "building-maintenance-app-b2f7a",
    storageBucket: "building-maintenance-app-b2f7a.firebasestorage.app",
    messagingSenderId: "1054918024686",
    appId: "1:1054918024686:web:a13fabb4a15a0cbb9342ff"
};

// Init
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// 🔥 simpan ke global
window.firebaseApp = app;
window.firebaseDB  = db;

console.log("Firebase ready dari firebase-init.js");
