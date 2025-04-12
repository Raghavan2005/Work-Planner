// app/firebase-config.ts or lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAf9VhW2ezEWT23_plVnCZ7hKtHspqjsEc",
  authDomain: "work-planner-412dc.firebaseapp.com",
  projectId: "work-planner-412dc",
  storageBucket: "work-planner-412dc.appspot.com",
  messagingSenderId: "348333502070",
  appId: "1:348333502070:web:e0d308b16269ccfb0ef957",
  measurementId: "G-1GGN7WBPPN"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, analytics };        
export const db = getFirestore(app); 
