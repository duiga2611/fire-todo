import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpJEnIcn-ihJ4MvHJtFVh9aprYARywcxs",
  authDomain: "todo-8b52b.firebaseapp.com",
  databaseURL: "https://todo-8b52b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "todo-8b52b",
  storageBucket: "todo-8b52b.appspot.com",
  messagingSenderId: "579549149996",
  appId: "1:579549149996:web:d7377e6edbb2bf12b94a89",
  measurementId: "G-55SMD9D26J"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
const auth = getAuth();

export { auth, db };
