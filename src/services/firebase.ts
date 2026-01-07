// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Auth RN (persistencia en AsyncStorage) — IMPORTANTE: desde "firebase/auth"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAN-6hd_I2hC6of7If_f_QaW4oQJ2MVclk",
  authDomain: "zonagamer-fade9.firebaseapp.com",
  projectId: "zonagamer-fade9",
  storageBucket: "zonagamer-fade9.firebasestorage.app",
  messagingSenderId: "578528116208",
  appId: "1:578528116208:web:bf1469409815857a8a3135",
  measurementId: "G-R2PBHY1R4K",
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const firestore = db;

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
