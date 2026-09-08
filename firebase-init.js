import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    onSnapshot,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";


// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBAo7elPGYo4nxR2s0buYUItIN4J2JTyyU",
    authDomain: "building-maintenance-app-b2f7a.firebaseapp.com",
    projectId: "building-maintenance-app-b2f7a",
    storageBucket: "building-maintenance-app-b2f7a.firebasestorage.app",
    messagingSenderId: "1054918024686",
    appId: "1:1054918024686:web:a13fabb4a15a0cbb9342ff"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);


// Simpan ke global agar bisa dipakai script.js
window.firebaseApp = app;
window.firebaseDB = db;
window.firebaseStorage = storage;
window.firebaseAuth = auth;


// Simpan fungsi Firestore ke global
window.firestoreCollection = collection;
window.firestoreGetDocs = getDocs;
window.firestoreOnSnapshot = onSnapshot;
window.firestoreDoc = doc;
window.firestoreGetDoc = getDoc;
window.firestoreSetDoc = setDoc;
window.firestoreUpdateDoc = updateDoc;
window.firestoreAddDoc = addDoc;
window.firestoreRunTransaction = runTransaction;
window.firestoreServerTimestamp = serverTimestamp;
window.firebaseStorageRef = ref;
window.firebaseUploadBytes = uploadBytes;
window.firebaseGetDownloadURL = getDownloadURL;


// Wait for Firebase Auth to restore its persisted session before Firestore reads.
// localStorage.currentUser is UI state only; it is not an authentication token.
onAuthStateChanged(auth, firebaseUser => {
    window.firebaseUser = firebaseUser;
    console.log("🔥 Firebase ready dari firebase-init.js", firebaseUser?.email || "unauthenticated");
    window.dispatchEvent(new CustomEvent("firebaseReady", {
        detail: { user: firebaseUser }
    }));
}, error => {
    console.error("Firebase Auth initialization failed:", error);
    window.firebaseUser = null;
    window.dispatchEvent(new CustomEvent("firebaseReady", {
        detail: { user: null, error }
    }));
});
