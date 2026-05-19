import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB3Ofg8v9kqfuS1jKmb7PJ-CfVh_pU5jO4',
  authDomain: 'socobos-ms.firebaseapp.com',
  projectId: 'socobos-ms',
  storageBucket: 'socobos-ms.firebasestorage.app',
  messagingSenderId: '897415312117',
  appId: '1:897415312117:web:628e2cd685a6d30e70cbbc',
  measurementId: 'G-EGY69G09LJ',
};

// Prevent re-initializing on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
