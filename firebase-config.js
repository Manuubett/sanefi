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

// Offline persistence: Firestore caches query results in the browser
// (IndexedDB), so repeat visits read from the local cache instead of
// hitting the network every time, and listings still show up if the
// connection drops. Combined with onSnapshot() listeners on the pages
// that list properties, this also means changes made in the admin panel
// (approvals, new listings, etc.) show up automatically without a
// manual page reload.
db.enablePersistence().catch((err) => {
  if (err.code === "failed-precondition") {
    // Happens if multiple tabs are open at once — persistence can only
    // run in one tab. The app still works, just without the local cache.
    console.warn("Firestore persistence disabled: multiple tabs open.");
  } else if (err.code === "unimplemented") {
    // Current browser doesn't support the features needed for persistence.
    console.warn("Firestore persistence not supported in this browser.");
  } else {
    console.warn("Firestore persistence could not be enabled:", err);
  }
});
