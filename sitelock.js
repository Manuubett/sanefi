// ---------------------------------------------------------------------
// site-lock.js
// Include this on EVERY page, right after your firebase-config.js
// (it needs `db` from firebase.firestore() to already exist).
//
// <script src="firebase-config.js"></script>
// <script src="site-lock.js"></script>
//
// How it works:
// - Watches the document settings/siteLock in Firestore in real time.
// - If { locked: true } is set, a full-screen overlay is injected that
//   blocks clicks, scrolling, and keyboard interaction on the page.
// - The moment an admin flips it back to { locked: false }, the overlay
//   is removed automatically on every open tab/page — no reload needed.
// ---------------------------------------------------------------------

(function () {
  const LOCK_DOC_PATH = "settings/siteLock";
  let overlayEl = null;

  function buildOverlay(message) {
    const overlay = document.createElement("div");
    overlay.id = "site-lock-overlay";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 15, 20, 0.92);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background: #ffffff;
      color: #1a1a1a;
      max-width: 420px;
      width: 100%;
      border-radius: 14px;
      padding: 32px 28px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.35);
    `;

    box.innerHTML = `
      <div style="font-size: 36px; margin-bottom: 12px;">🚧</div>
      <h2 style="margin: 0 0 10px; font-size: 20px;">Site Temporarily Unavailable</h2>
      <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #444;">
        ${message}
      </p>
    `;

    overlay.appendChild(box);
    return overlay;
  }

  function showOverlay(message) {
    if (overlayEl) return; // already showing
    overlayEl = buildOverlay(message || "We're making some updates. Please check back shortly.");
    document.body.appendChild(overlayEl);
    document.body.style.overflow = "hidden";
  }

  function hideOverlay() {
    if (!overlayEl) return;
    overlayEl.remove();
    overlayEl = null;
    document.body.style.overflow = "";
  }

  function startWatching() {
    if (typeof db === "undefined") {
      console.error("site-lock.js: Firestore `db` is not defined yet. Make sure firebase-config.js loads first.");
      return;
    }

    db.doc(LOCK_DOC_PATH).onSnapshot(
      (snap) => {
        const data = snap.exists ? snap.data() : null;
        if (data && data.locked === true) {
          showOverlay(data.message);
        } else {
          hideOverlay();
        }
      },
      (err) => {
        // If rules block read access or offline, fail open (don't lock
        // visitors out just because the check itself failed).
        console.warn("site-lock.js: could not check lock status:", err);
      }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWatching);
  } else {
    startWatching();
  }
})();
