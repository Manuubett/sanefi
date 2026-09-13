renderNavbar(null);
renderFooter();

const statusBox = document.getElementById("superadmin-status");
const panel = document.getElementById("superadmin-panel");
const lockToggle = document.getElementById("lock-toggle");
const lockMessage = document.getElementById("lock-message");
const lockForm = document.getElementById("lock-form");
const successBox = document.getElementById("lock-success");
const errorBox = document.getElementById("lock-error");
const statusText = document.getElementById("lock-status-text");
const statusBadge = document.getElementById("lock-status-badge");

const LOCK_DOC_PATH = "settings/siteLock";

function renderCurrentStatus(data) {
  const locked = !!(data && data.locked);
  statusText.textContent = locked ? "Site is LOCKED" : "Site is live";
  statusBadge.textContent = locked ? "Locked" : "Live";
  statusBadge.className = "admin-row-status " + (locked ? "status-rejected" : "status-approved");
  lockToggle.checked = locked;
  if (data && data.message) lockMessage.value = data.message;
}

// Live-watch the lock doc so the panel reflects reality even if someone
// else (or another tab) changes it while this page is open.
db.doc(LOCK_DOC_PATH).onSnapshot((snap) => {
  renderCurrentStatus(snap.exists ? snap.data() : null);
});

lockForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  successBox.style.display = "none";
  errorBox.style.display = "none";

  try {
    await db.doc(LOCK_DOC_PATH).set({
      locked: lockToggle.checked,
      message: lockMessage.value.trim() || "We're making some updates. Please check back shortly.",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    successBox.style.display = "block";
  } catch (err) {
    console.error(err);
    errorBox.textContent = "Couldn't save: " + err.message;
    errorBox.style.display = "block";
  }
});

auth.onAuthStateChanged((user) => {
  if (!user) {
    statusBox.innerHTML = `<p class="empty-state">Please <a href="login.html">log in</a> to access this page.</p>`;
    panel.style.display = "none";
    return;
  }

  db.collection("superadmins").doc(user.uid).get().then((doc) => {
    if (!doc.exists) {
      statusBox.innerHTML = `<p class="empty-state">You're signed in as ${user.email}, but this account doesn't have developer access.</p>`;
      panel.style.display = "none";
      return;
    }
    statusBox.innerHTML = "";
    panel.style.display = "block";
  }).catch((err) => {
    console.error(err);
    statusBox.innerHTML = `<p class="empty-state">Couldn't verify access: ${err.message}</p>`;
  });
});
