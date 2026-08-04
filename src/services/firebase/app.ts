import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDoqbjpy3pFiuvMCBhxffJH27bHBNaKTTA",
  authDomain: "rapidmedi.firebaseapp.com",
  projectId: "rapidmedi",
  storageBucket: "rapidmedi.firebasestorage.app",
  messagingSenderId: "553213794552",
  appId: "1:553213794552:web:db1bdac54f2a80d791430d",
  measurementId: "G-71EYHYR629",
};

export const app = initializeApp(firebaseConfig);
