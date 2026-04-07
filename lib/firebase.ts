import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB6piM64zmmiwLy5E8xra8ZWMn0-68cfrY",
  authDomain: "vectorstock-pro.firebaseapp.com",
  projectId: "vectorstock-pro",
  storageBucket: "vectorstock-pro.firebasestorage.app",
  messagingSenderId: "352409755784",
  appId: "1:352409755784:web:d8ad61a091d4fe08b57f3d"
};

// Next.js mein baar baar initialize hone se bachane ke liye hum check karte hain
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Authentication, Database aur Storage ko export kar rahe hain
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
