// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyAqLV69PAB_2UutDPsPt_-90XNH8QOBNW0",
	authDomain: "ai-travel-planner-75d18.firebaseapp.com",
	projectId: "ai-travel-planner-75d18",
	storageBucket: "ai-travel-planner-75d18.appspot.com",
	messagingSenderId: "152882646633",
	appId: "1:152882646633:web:ec3094f67c6b6110335cf8",
	measurementId: "G-CGPJYT0PQ8"
  };

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);


// firebase login

// firebase init

// "site": "travel-mate",

// firebase deploy --only hosting:travel-mate