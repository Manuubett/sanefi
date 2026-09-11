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
  if (idx === -1) {
    ids.push(id);
  } else {
    ids.splice(idx, 1);
  }
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  return ids.includes(id);
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
