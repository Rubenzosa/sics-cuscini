import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
// Un upload/operazione fallito su Storage altrimenti ritenta per 2 minuti prima
// di dare errore: l'utente resta col pulsante "Carico..." bloccato. Falliamo in
// fretta così l'errore (es. Storage non configurato) si vede subito.
storage.maxUploadRetryTime = 10000;
storage.maxOperationRetryTime = 10000;