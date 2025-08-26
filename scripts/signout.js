#!/usr/bin/env node

/**
 * Quick script to sign out from Firebase
 * Run this to start fresh from the signup screen
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signOut } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBo0CK8SpKEp7f37E_Prja3DHyU8r84Gns",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "ingrd-7c087.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "ingrd-7c087",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "ingrd-7c087.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "859513368147",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:859513368147:web:f4c6ea6f7e08c5cb529a9d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function signOutUser() {
  try {
    await signOut(auth);
    console.log('✅ Successfully signed out from Firebase');
    console.log('🚀 You can now start the app and it will begin at the signup screen');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to sign out:', error.message);
    process.exit(1);
  }
}

signOutUser();