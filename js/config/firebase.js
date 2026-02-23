// 🔥 Firebase Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyAJGvTa_gPsUjmvlzIzTt1Nca1uC5Uzn7xs",
    authDomain: "filatest-9a091.firebaseapp.com",
    projectId: "filatest-9a091",
    storageBucket: "filatest-9a091.firebasestorage.app",
    messagingSenderId: "179130030606",
    appId: "1:179130030606:web:013d6d598645abdf6cfa5f",
    measurementId: "G-39HJ2T0XFD"
};

// Firebase initialisieren
let db = null;
let firebaseInitialized = false;

async function initFirebase() {
    if (firebaseInitialized) return db;
    
    // Prüfen ob Firebase geladen ist
    if (typeof firebase === 'undefined') {
        console.error('Firebase nicht geladen! Skript fehlt?');
        throw new Error('Firebase nicht verfügbar');
    }
    
    try {
        console.log('Firebase Initialisierung...');
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        // Verbindung testen
        await db.collection('Filatest').limit(1).get();
        
        firebaseInitialized = true;
        console.log('✅ Firebase verbunden');
        return db;
    } catch (error) {
        console.error('❌ Firebase Fehler:', error);
        throw error;
    }
}

function getDb() {
    if (!db) {
        throw new Error('Firebase nicht initialisiert. Rufen Sie zuerst initFirebase() auf.');
    }
    return db;
}

export { initFirebase, getDb, firebaseConfig };
