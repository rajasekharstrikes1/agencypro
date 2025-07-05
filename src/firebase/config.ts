import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAWM2jJRSZ-gkzkg4jDePwfXRXpdLjgen4",
  authDomain: "agencypro-4782b.firebaseapp.com",
  projectId: "agencypro-4782b",
  storageBucket: "agencypro-4782b.firebasestorage.app",
  messagingSenderId: "29049252547",
  appId: "1:29049252547:web:843c8c2940fd442b0fd076"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;