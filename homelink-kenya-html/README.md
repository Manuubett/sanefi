# HomeLink Kenya — Plain HTML Version

No build step, no server, no framework. Plain HTML/CSS/JavaScript, talking
directly to Firebase (Auth + Firestore) and Cloudinary from the browser.

```
Browser (HTML + vanilla JS)
   ├── Firebase JS SDK  ──> Firestore (property data) + Auth (login/signup)
   └── fetch() ──> Cloudinary unsigned upload (property photos)
```

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com -> **Add project**.
2. Enable **Firestore Database** (Build -> Firestore Database -> Create database,
   start in test mode or apply `firestore.rules` below).
3. Enable **Authentication** -> Sign-in method -> **Email/Password**.
4. Register a **Web app**: Project Settings (gear icon) -> "Your apps" -> `</>`
   icon -> follow the prompts. Firebase shows you a `firebaseConfig` object —
   copy it into `js/firebase-config.js`.
5. Deploy `firestore.rules` (Firestore Database -> Rules tab, paste it in and
   publish — or use the Firebase CLI: `firebase deploy --only firestore:rules`).

## 2. Create a Cloudinary account

1. Sign up free at https://cloudinary.com.
2. Copy your **Cloud name** from the Dashboard into `js/firebase-config.js`
   (`CLOUDINARY_CLOUD_NAME`).
3. Create an **unsigned upload preset**: Settings -> Upload -> Upload presets
   -> Add upload preset -> set **Signing Mode** to `Unsigned` -> Save.
   Copy its name into `CLOUDINARY_UPLOAD_PRESET`.
   (Unsigned presets are the standard way to let a browser upload directly
   without exposing your API secret.)

## 3. Run it

No build tools needed — but browsers block Firebase's SDK from `file://`
pages, so serve the folder over local HTTP. Any of these work:

```bash
# Python (already on most machines)
python3 -m http.server 8000

# Node
npx serve .

# VS Code: "Live Server" extension, then Right click index.html -> Open with Live Server
```

Then open http://localhost:8000

## Files

```
index.html            Home page — hero search, featured properties
properties.html        Browse / search page
property.html          Single property detail (property.html?id=xxx)
list-property.html     Add a listing (Cloudinary photo upload + Firestore save)
login.html              Login / sign up

css/style.css           All styling (matches the reference design)

js/firebase-config.js   YOUR Firebase + Cloudinary keys go here
js/nav.js                Shared navbar/footer + login-state UI
js/cloudinary.js         Unsigned photo upload helper
js/property-card.js      Shared "property card" HTML renderer
js/home.js, properties.js, property.js, list-property.js, auth.js
                          Page-specific logic

firestore.rules          Security rules: public read, owner-only write
```

## Notes

- **Search**: Firestore can't do case-insensitive "contains" queries, so the
  location filter on `properties.html` fetches listings and filters
  client-side. Fine for a modest catalog; swap in Algolia or Typesense once
  it grows large.
- **Auth guard**: `list-property.html` disables the submit button until
  `auth.onAuthStateChanged` confirms someone's logged in — that's enforced
  again server-side by `firestore.rules` (`ownerId == request.auth.uid`).
- **"Saved" properties** (heart icon): not wired up yet. Add a
  `savedProperties` collection keyed by `userId` + `propertyId` — rules for
  it are already included in `firestore.rules`.
- **Composite indexes**: if you filter by more than Firestore can do with a
  single field, it'll throw an error in the console with a direct link to
  create the needed index — click it, done.
