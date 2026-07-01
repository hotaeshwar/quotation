import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAKz-UiXlUcgBM4a3y__tSAK7g5BUX6fX8",
  authDomain: "qoutation-16f83.firebaseapp.com",
  projectId: "qoutation-16f83",
  storageBucket: "qoutation-16f83.firebasestorage.app",
  messagingSenderId: "433972823647",
  appId: "1:433972823647:web:e949a61528228ee32d3dea"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
