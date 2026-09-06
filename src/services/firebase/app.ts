import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDoqbjpy3pFiuvMCBhxffJH27bHBNaKTTA",
  authDomain: "rapidmedicoco.firebaseapp.com",
  projectId: "rapidmedicoco",
  storageBucket: "rapidmedicoco.firebasestorage.app",
  messagingSenderId: "553213794552",
  appId: "1:553213794552:web:db1bdac54f2a80d791430d",
  measurementId: "G-71EYHYR629",
};

export const app = initializeApp(firebaseConfig);
