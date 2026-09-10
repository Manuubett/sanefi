// ---------------------------------------------------------------------
// Fill these in with your own project's values, then every page works.
// ---------------------------------------------------------------------

// Firebase Console -> Project Settings -> General -> "Your apps" -> Web app
// (Firebase creates this whole object for you when you register a web app)
 const firebaseConfig = {
    apiKey: "AIzaSyDQZpVnVANO9_sD5FTIqZs5hwITNJ6fphw",
    authDomain: "politics-d1e10.firebaseapp.com",
    projectId: "politics-d1e10",
    storageBucket: "politics-d1e10.firebasestorage.app",
    messagingSenderId: "998592187669",
    appId: "1:998592187669:web:3ecf8051b5e1e9437fed1c",
    measurementId: "G-N6PSXMB98Y"
  };

// Cloudinary Dashboard -> your cloud name (top of the page)
const CLOUDINARY_CLOUD_NAME = "ff5x5t40";

// Settings -> Upload -> Upload presets -> Add upload preset -> Signing mode: Unsigned
// (unsigned = safe to use straight from the browser, no API secret needed here)
const CLOUDINARY_UPLOAD_PRESET = "sanefilink";

// ---------------------------------------------------------------------
// Init — shared by every page. Uses the Firebase compat SDKs (loaded via
// <script> tags in each HTML file) so no bundler/build step is needed.
// ---------------------------------------------------------------------
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
