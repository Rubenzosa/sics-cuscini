import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBzef1HAZxzAbATMrUG1y7D1FPcCFZq_2Q",
  authDomain: "sics-cuscini.firebaseapp.com",
  projectId: "sics-cuscini",
  storageBucket: "sics-cuscini.firebasestorage.app",
  messagingSenderId: "983341615235",
  appId: "1:983341615235:web:312cea01e7bee7852a73b6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Login anonimo: le regole Firestore/Storage richiedono request.auth != null.
// La sessione viene mantenuta in localStorage, quindi al secondo accesso
// onAuthStateChanged restituisce subito l'utente senza una nuova signIn.
export const authReady = new Promise((resolve, reject) => {
  const unsub = onAuthStateChanged(
    auth,
    (user) => {
      if (user) {
        unsub();
        resolve(user);
        return;
      }
      signInAnonymously(auth).catch((err) => {
        unsub();
        reject(err);
      });
    },
    (err) => {
      unsub();
      reject(err);
    }
  );
});