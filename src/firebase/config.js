import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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