renderNavbar("admin");
renderFooter();

const statusBox = document.getElementById("admin-status");
const dashboardStats = document.getElementById("dashboard-stats");
const dashboardTopLists = document.getElementById("dashboard-toplists");
const tabsBox = document.getElementById("admin-tabs");
const listBox = document.getElementById("admin-list");

let allDocs = [];
let activeTab = "pending";

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

function statusLabel(doc) {
  if (isBooked(doc)) return "Booked";
  const status = getStatus(doc);
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending review";
}

function statusClass(doc) {
  if (isBooked(doc)) return "status-booked";
  return "status-" + getStatus(doc);
}

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

function renderDashboard() {
  const total = allDocs.length;
  const counts = { pending: 0, approved: 0, rejected: 0, booked: 0 };
  allDocs.forEach((doc) => {
    if (isBooked(doc)) counts.booked++;
    else if (counts[getStatus(doc)] !== undefined) counts[getStatus(doc)]++;
  });

  dashboardStats.innerHTML = `
    <div class="stat-card"><div class="stat-number">${total}</div><div class="stat-label">Total Listings</div></div>
    <div class="stat-card"><div class="stat-number">${counts.pending}</div><div class="stat-label">Pending Review</div></div>
    <div class="stat-card"><div class="stat-number">${counts.approved}</div><div class="stat-label">Approved</div></div>
    <div class="stat-card"><div class="stat-number">${counts.booked}</div><div class="stat-label">Booked</div></div>
    <div class="stat-card"><div class="stat-number">${counts.rejected}</div><div class="stat-label">Rejected</div></div>`;

  const topByField = (field, label, emptyLabel) => {
    const sorted = [...allDocs]
      .filter((doc) => Number(doc.data()[field] || 0) > 0)
      .sort((a, b) => Number(b.data()[field] || 0) - Number(a.data()[field] || 0))
      .slice(0, 5);
    const rows = sorted.length
      ? sorted.map((doc) => `
          <div class="top-list-row">
            <span class="tl-title">${escapeHTML(doc.data().title || "Untitled listing")}</span>
            <span class="tl-count">${Number(doc.data()[field] || 0)} ${label}</span>
          </div>`).join("")
      : `<p class="empty-state" style="padding:10px 0;">${emptyLabel}</p>`;
    return rows;
  };

  dashboardTopLists.innerHTML = `
    <div class="top-list-card">
      <h4>&#10084; Most Saved</h4>
      ${topByField("savesCount", "saves", "No saves yet.")}
    </div>
    <div class="top-list-card">
      <h4>&#128065; Most Viewed</h4>
      ${topByField("views", "views", "No views yet.")}
    </div>`;
}

function renderTabs() {
  const counts = { pending: 0, approved: 0, rejected: 0, booked: 0 };
  allDocs.forEach((doc) => {
    if (isBooked(doc)) counts.booked++;
    else if (counts[getStatus(doc)] !== undefined) counts[getStatus(doc)]++;
  });
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
        ${t.label}${t.key !== "all" ? ` (${counts[t.key] || 0})` : ` (${allDocs.length})`}
      </button>`)
    .join("");

  tabsBox.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      renderTabs();
      renderList();
    });
  });
}

function renderList() {
  const filtered = allDocs.filter((doc) => {
    if (activeTab === "all") return true;
    if (activeTab === "booked") return isBooked(doc);
    if (isBooked(doc)) return false; // booked items only live in the Booked tab
    return getStatus(doc) === activeTab;
  });

  if (filtered.length === 0) {
    listBox.innerHTML = `<p class="empty-state">No listings in this category.</p>`;
    return;
  }
  listBox.innerHTML = filtered.map((doc) => adminRowHTML(doc.id, doc.data())).join("");
  attachActionHandlers();
}

function loadProperties() {
  listBox.innerHTML = `<p class="empty-state">Loading properties&hellip;</p>`;
  db.collection("propertiess")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {
      allDocs = snapshot.docs;
      renderDashboard();
      renderTabs();
      renderList();
    })
    .catch((err) => {
      console.error(err);
      listBox.innerHTML = `<p class="empty-state">Couldn't load properties: ${err.message}</p>`;
    });
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
        loadProperties();
      } catch (err) {
        console.error(err);
        alert("Couldn't update this listing: " + err.message);
        loadProperties();
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
        loadProperties();
      } catch (err) {
        console.error(err);
        alert("Couldn't update this listing: " + err.message);
        loadProperties();
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
        loadProperties();
      } catch (err) {
        console.error(err);
        alert("Couldn't delete this listing: " + err.message);
        loadProperties();
      }
    });
  });
}

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
    loadProperties();
  }).catch((err) => {
    console.error(err);
    statusBox.innerHTML = `<p class="empty-state">Couldn't verify admin access: ${err.message}</p>`;
  });
});
