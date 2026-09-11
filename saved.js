// Saved properties are kept in localStorage as an array of property IDs.
// No login required to save a property, so it works for casual browsers too.
const SAVED_KEY = "sanefi_saved_properties";

function getSavedIds() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function isPropertySaved(id) {
  return getSavedIds().includes(id);
}

function toggleSavedProperty(id) {
  const ids = getSavedIds();
  const idx = ids.indexOf(id);
  let nowSaved;
  if (idx === -1) {
    ids.push(id);
    nowSaved = true;
  } else {
    ids.splice(idx, 1);
    nowSaved = false;
  }
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids));

  // Best-effort sync to Firestore so admins can see aggregate save counts
  // (localStorage alone is only visible to this one browser).
  if (typeof db !== "undefined") {
    db.collection("propertiess").doc(id).update({
      savesCount: firebase.firestore.FieldValue.increment(nowSaved ? 1 : -1)
    }).catch((err) => console.error("Couldn't sync save count:", err));
  }

  return nowSaved;
}

// Call this after inserting any property-card HTML into the page so the
// heart icons inside it actually respond to clicks.
function attachHeartHandlers(root = document) {
  root.querySelectorAll(".heart[data-id]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = el.dataset.id;
      const nowSaved = toggleSavedProperty(id);
      el.classList.toggle("active", nowSaved);
      el.innerHTML = nowSaved ? "&#9829;" : "&#9825;";
    });
  });
}
