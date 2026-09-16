renderNavbar("admin");
renderFooter();

const statusBox = document.getElementById("admin-status");
const dashboardStats = document.getElementById("dashboard-stats");
const dashboardTopLists = document.getElementById("dashboard-toplists");
const tabsBox = document.getElementById("admin-tabs");
const listBox = document.getElementById("admin-list");
const searchBox = document.getElementById("admin-search");

const PAGE_SIZE = 25;

let activeTab = "pending";
let currentDocs = [];      // docs currently loaded & rendered for the active tab/search
let lastVisible = null;    // Firestore cursor for "Load More"
let hasMore = false;
let isLoading = false;
let searchTerm = "";
let tabCounts = { pending: 0, approved: 0, rejected: 0, booked: 0, all: 0 };

function formatPrice(price) {
  return "KSh " + Number(price || 0).toLocaleString();
}

function getStatus(doc) {
  return doc.data().status || "pending";
}

function getAvailability(doc) {
  return doc.data().availability || "available";
}

function isBooked(doc) {
  return getAvailability(doc) === "booked";
}

/* ---------------- Row rendering ---------------- */

function adminRowHTML(id, data) {
  const status = data.status || "pending";
  const booked = (data.availability || "available") === "booked";
  const isFeatured = !!data.featured;
  const posterName = data.ownerName || "Unknown poster";
  const posterContact = data.ownerContact || "No contact provided";

  let actionButtons = "";
  if (booked) {
    actionButtons = `<button class="btn-primary admin-action-btn" data-action="unbook">Mark Available</button>`;
  } else if (status === "pending") {
    actionButtons = `
      <button class="btn-primary admin-action-btn" data-action="approve">Approve</button>
      <button class="btn-secondary admin-action-btn" data-action="reject">Reject</button>`;
  } else if (status === "approved") {
    actionButtons = `
      <button class="btn-secondary admin-toggle-btn" data-featured="${isFeatured}">${isFeatured ? "Unfeature" : "Feature"}</button>
      <button class="btn-secondary admin-action-btn" data-action="unpublish">Unpublish</button>
      <button class="btn-secondary admin-action-btn" data-action="book">Mark Booked</button>`;
  } else {
    actionButtons = `<button class="btn-primary admin-action-btn" data-action="approve">Re-approve</button>`;
  }

  actionButtons += `<button class="btn-secondary admin-edit-btn" data-action="edit">Edit</button>`;

  return `
    <div class="admin-row" data-id="${id}">
      <img class="admin-row-thumb" src="${(data.imageUrls && data.imageUrls[0]) || 'https://placehold.co/90x70?text=No+Image'}" alt="">
      <div class="admin-row-info">
        <strong>${escapeHTML(data.title || "Untitled listing")}</strong>
        <span>${escapeHTML(data.location || "")} &middot; ${formatPrice(data.price)}</span>
        <span class="admin-poster">Posted by ${escapeHTML(posterName)} &middot; ${escapeHTML(posterContact)}</span>
      </div>
      <span class="admin-row-status ${booked ? "status-booked" : "status-" + status}">
        ${booked ? "Booked" : (status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending review")}
      </span>
      <div class="admin-row-actions">
        ${actionButtons}
        <button class="admin-delete-btn" data-action="delete" title="Delete permanently">&#128465;</button>
      </div>
    </div>`;
}

/* ---------------- Dashboard: cheap aggregation counts, no full collection read ---------------- */

async function loadDashboardCounts() {
  try {
    const [pendingSnap, rejectedSnap, approvedTotalSnap, bookedSnap] = await Promise.all([
      db.collection("propertiess").where("status", "==", "pending").count().get(),
      db.collection("propertiess").where("status", "==", "rejected").count().get(),
      db.collection("propertiess").where("status", "==", "approved").count().get(),
      db.collection("propertiess").where("availability", "==", "booked").count().get(),
    ]);

    const pending = pendingSnap.data().count;
    const rejected = rejectedSnap.data().count;
    const approvedTotal = approvedTotalSnap.data().count; // includes booked, since booked items keep status "approved"
    const booked = bookedSnap.data().count;
    const approvedNotBooked = Math.max(0, approvedTotal - booked);
    const total = pending + rejected + approvedTotal;

    tabCounts = { pending, approved: approvedNotBooked, rejected, booked, all: total };

    dashboardStats.innerHTML = `
      <div class="stat-card"><div class="stat-number">${total}</div><div class="stat-label">Total Listings</div></div>
      <div class="stat-card"><div class="stat-number">${pending}</div><div class="stat-label">Pending Review</div></div>
      <div class="stat-card"><div class="stat-number">${approvedNotBooked}</div><div class="stat-label">Approved</div></div>
      <div class="stat-card"><div class="stat-number">${booked}</div><div class="stat-label">Booked</div></div>
      <div class="stat-card"><div class="stat-number">${rejected}</div><div class="stat-label">Rejected</div></div>`;
  } catch (err) {
    console.error("Dashboard count error:", err);
    dashboardStats.innerHTML = `<p class="empty-state">Couldn't load dashboard stats: ${err.message}</p>`;
  }
}

/* ---------------- Top lists: small indexed queries instead of scanning everything ---------------- */

async function loadTopLists() {
  const topByField = async (field, label, emptyLabel) => {
    try {
      const snap = await db.collection("propertiess")
        .where(field, ">", 0)
        .orderBy(field, "desc")
        .limit(5)
        .get();
      if (snap.empty) return `<p class="empty-state" style="padding:10px 0;">${emptyLabel}</p>`;
      return snap.docs.map((doc) => `
        <div class="top-list-row">
          <span class="tl-title">${escapeHTML(doc.data().title || "Untitled listing")}</span>
          <span class="tl-count">${Number(doc.data()[field] || 0)} ${label}</span>
        </div>`).join("");
    } catch (err) {
      console.error(`Top list error (${field}):`, err);
      return `<p class="empty-state" style="padding:10px 0;">Couldn't load this list.</p>`;
    }
  };

  const [savedRows, viewedRows] = await Promise.all([
    topByField("savesCount", "saves", "No saves yet."),
    topByField("views", "views", "No views yet."),
  ]);

  dashboardTopLists.innerHTML = `
    <div class="top-list-card">
      <h4>&#10084; Most Saved</h4>
      ${savedRows}
    </div>
    <div class="top-list-card">
      <h4>&#128065; Most Viewed</h4>
      ${viewedRows}
    </div>`;
}

/* ---------------- Tabs ---------------- */

function renderTabs() {
  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "booked", label: "Booked" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" }
  ];
  tabsBox.innerHTML = tabs
    .map((t) => `
      <button class="admin-tab ${activeTab === t.key ? "active" : ""}" data-tab="${t.key}">
        ${t.label} (${tabCounts[t.key] || 0})
      </button>`)
    .join("");

  tabsBox.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab === activeTab) return;
      activeTab = btn.dataset.tab;
      renderTabs();
      resetAndLoadList();
    });
  });
}

/* ---------------- Paginated list ---------------- */

function baseQueryForTab(tab) {
  let ref = db.collection("propertiess");
  if (tab === "pending") ref = ref.where("status", "==", "pending");
  else if (tab === "rejected") ref = ref.where("status", "==", "rejected");
  else if (tab === "approved") ref = ref.where("status", "==", "approved");
  else if (tab === "booked") ref = ref.where("availability", "==", "booked");
  // "all" gets no filter
  return ref.orderBy("createdAt", "desc");
}

function buildQuery() {
  // Search overrides the tab filter and searches by title prefix.
  // Requires a lowercase `titleLower` field on each document (see migration note below).
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    let ref = db.collection("propertiess")
      .orderBy("titleLower")
      .where("titleLower", ">=", term)
      .where("titleLower", "<=", term + "\uf8ff")
      .limit(PAGE_SIZE);
    if (lastVisible) ref = ref.startAfter(lastVisible);
    return ref;
  }

  let ref = baseQueryForTab(activeTab).limit(PAGE_SIZE);
  if (lastVisible) ref = ref.startAfter(lastVisible);
  return ref;
}

async function resetAndLoadList() {
  currentDocs = [];
  lastVisible = null;
  hasMore = false;
  await loadNextPage();
}

async function loadNextPage() {
  if (isLoading) return;
  isLoading = true;

  if (currentDocs.length === 0) {
    listBox.innerHTML = `<p class="empty-state">Loading properties&hellip;</p>`;
  }

  try {
    const snapshot = await buildQuery().get();
    let docs = snapshot.docs;

    // The "approved" tab can include booked items (booked listings keep status "approved"),
    // so filter those out client-side; the Booked tab is where they belong.
    if (activeTab === "approved" && !searchTerm) {
      docs = docs.filter((d) => !isBooked(d));
    }

    hasMore = snapshot.docs.length === PAGE_SIZE;
    lastVisible = snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : lastVisible;
    currentDocs = currentDocs.concat(docs);

    renderList();
  } catch (err) {
    console.error(err);
    if (currentDocs.length === 0) {
      listBox.innerHTML = `<p class="empty-state">Couldn't load properties: ${err.message}</p>
        ${err.message && err.message.includes("index")
          ? `<p class="empty-state" style="font-size:13px;">Firestore needs a composite index for this query — check the browser console for a link to create it automatically.</p>`
          : ""}`;
    }
  } finally {
    isLoading = false;
  }
}

function renderList() {
  if (currentDocs.length === 0) {
    listBox.innerHTML = `<p class="empty-state">No listings ${searchTerm ? "match your search" : "in this category"}.</p>`;
    return;
  }

  const rowsHTML = currentDocs.map((doc) => adminRowHTML(doc.id, doc.data())).join("");
  const loadMoreHTML = hasMore
    ? `<button class="btn-secondary" id="admin-load-more">Load More</button>`
    : "";

  listBox.innerHTML = `${rowsHTML}<div class="admin-load-more-wrap">${loadMoreHTML}</div>`;

  attachActionHandlers();
  attachEditHandlers();

  const loadMoreBtn = document.getElementById("admin-load-more");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      loadMoreBtn.textContent = "Loading...";
      loadMoreBtn.disabled = true;
      loadNextPage();
    });
  }
}

/* ---------------- Search ---------------- */

let searchDebounceTimer = null;
if (searchBox) {
  searchBox.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      searchTerm = searchBox.value.trim();
      resetAndLoadList();
    }, 350);
  });
}

/* ---------------- Row action handlers (approve/reject/book/delete) ---------------- */

function refreshAfterMutation() {
  // Re-pull counts (they may have changed) and reload just the current page from scratch.
  loadDashboardCounts();
  resetAndLoadList();
}

function attachActionHandlers() {
  document.querySelectorAll(".admin-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".admin-row").dataset.id;
      const currentlyFeatured = btn.dataset.featured === "true";
      btn.disabled = true;
      btn.textContent = "Saving...";
      try {
        await db.collection("propertiess").doc(id).update({ featured: !currentlyFeatured });
        refreshAfterMutation();
      } catch (err) {
        console.error(err);
        alert("Couldn't update this listing: " + err.message);
        refreshAfterMutation();
      }
    });
  });

  document.querySelectorAll(".admin-action-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".admin-row").dataset.id;
      const action = btn.dataset.action;
      let update = null;
      if (action === "approve") update = { status: "approved" };
      else if (action === "reject") update = { status: "rejected" };
      else if (action === "unpublish") update = { status: "pending" };
      else if (action === "book") update = { availability: "booked" };
      else if (action === "unbook") update = { availability: "available" };
      if (!update) return;

      btn.disabled = true;
      btn.textContent = "Saving...";
      try {
        await db.collection("propertiess").doc(id).update(update);
        refreshAfterMutation();
      } catch (err) {
        console.error(err);
        alert("Couldn't update this listing: " + err.message);
        refreshAfterMutation();
      }
    });
  });

  document.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = btn.closest(".admin-row");
      const id = row.dataset.id;
      const title = row.querySelector("strong")?.textContent || "this listing";
      if (!confirm(`Delete "${title}" permanently? This can't be undone.`)) return;

      btn.disabled = true;
      try {
        await db.collection("propertiess").doc(id).delete();
        refreshAfterMutation();
      } catch (err) {
        console.error(err);
        alert("Couldn't delete this listing: " + err.message);
        refreshAfterMutation();
      }
    });
  });
}

/* ---------------- Edit Listing Modal ---------------- */

const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
let editingId = null;

function openEditModal(id, data) {
  editingId = id;
  document.getElementById("edit-title").value = data.title || "";
  document.getElementById("edit-location").value = data.location || "";
  document.getElementById("edit-price").value = data.price || "";
  document.getElementById("edit-description").value = data.description || "";
  document.getElementById("edit-imageUrls").value = (data.imageUrls || []).join("\n");
  document.getElementById("edit-ownerName").value = data.ownerName || "";
  document.getElementById("edit-ownerContact").value = data.ownerContact || "";
  editModal.style.display = "flex";
}

function closeEditModal() {
  editModal.style.display = "none";
  editingId = null;
  editForm.reset();
}

document.getElementById("edit-cancel-btn").addEventListener("click", closeEditModal);
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeEditModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && editModal.style.display === "flex") closeEditModal();
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!editingId) return;

  const saveBtn = document.getElementById("edit-save-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const titleValue = document.getElementById("edit-title").value.trim();
  const imageUrls = document.getElementById("edit-imageUrls").value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const update = {
    title: titleValue,
    titleLower: titleValue.toLowerCase(), // keeps search index in sync
    location: document.getElementById("edit-location").value.trim(),
    price: Number(document.getElementById("edit-price").value || 0),
    description: document.getElementById("edit-description").value.trim(),
    imageUrls,
    ownerName: document.getElementById("edit-ownerName").value.trim(),
    ownerContact: document.getElementById("edit-ownerContact").value.trim(),
  };

  try {
    await db.collection("propertiess").doc(editingId).update(update);
    closeEditModal();
    refreshAfterMutation();
  } catch (err) {
    console.error(err);
    alert("Couldn't save changes: " + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
  }
});

function attachEditHandlers() {
  document.querySelectorAll(".admin-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".admin-row");
      const id = row.dataset.id;
      const doc = currentDocs.find((d) => d.id === id);
      if (doc) openEditModal(id, doc.data());
    });
  });
}

/* ---------------- Boot ---------------- */

auth.onAuthStateChanged((user) => {
  if (!user) {
    statusBox.innerHTML = `<p class="empty-state">Please <a href="login.html">log in</a> to access the admin area.</p>`;
    dashboardStats.innerHTML = "";
    dashboardTopLists.innerHTML = "";
    tabsBox.innerHTML = "";
    listBox.innerHTML = "";
    return;
  }

  db.collection("admins").doc(user.uid).get().then((adminDoc) => {
    if (!adminDoc.exists) {
      statusBox.innerHTML = `<p class="empty-state">You're signed in as ${user.email}, but this account doesn't have admin access.</p>`;
      dashboardStats.innerHTML = "";
      dashboardTopLists.innerHTML = "";
      tabsBox.innerHTML = "";
      listBox.innerHTML = "";
      return;
    }
    statusBox.innerHTML = "";
    loadDashboardCounts();
    loadTopLists();
    renderTabs();
    resetAndLoadList();
  }).catch((err) => {
    console.error(err);
    statusBox.innerHTML = `<p class="empty-state">Couldn't verify admin access: ${err.message}</p>`;
  });
});
