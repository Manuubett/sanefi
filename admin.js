renderNavbar("admin");
renderFooter();

const statusBox = document.getElementById("admin-status");
const tabsBox = document.getElementById("admin-tabs");
const listBox = document.getElementById("admin-list");

let allDocs = [];
let activeTab = "pending";

function formatPrice(price) {
  return "KSh " + Number(price || 0).toLocaleString();
}

function statusLabel(status) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending review";
}

function adminRowHTML(id, data) {
  const status = data.status || "pending";
  const isFeatured = !!data.featured;
  const posterName = data.ownerName || "Unknown poster";
  const posterContact = data.ownerContact || "No contact provided";

  let actionButtons = "";
  if (status === "pending") {
    actionButtons = `
      <button class="btn-primary admin-action-btn" data-action="approve">Approve</button>
      <button class="btn-secondary admin-action-btn" data-action="reject">Reject</button>`;
  } else if (status === "approved") {
    actionButtons = `
      <button class="btn-secondary admin-toggle-btn" data-featured="${isFeatured}">${isFeatured ? "Unfeature" : "Feature"}</button>
      <button class="btn-secondary admin-action-btn" data-action="unpublish">Unpublish</button>`;
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
      <span class="admin-row-status status-${status}">${statusLabel(status)}</span>
      <div class="admin-row-actions">
        ${actionButtons}
        <button class="admin-delete-btn" data-action="delete" title="Delete permanently">&#128465;</button>
      </div>
    </div>`;
}

function renderTabs() {
  const counts = { pending: 0, approved: 0, rejected: 0 };
  allDocs.forEach((doc) => {
    const status = doc.data().status || "pending";
    if (counts[status] !== undefined) counts[status]++;
  });
  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
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
  const filtered = activeTab === "all"
    ? allDocs
    : allDocs.filter((doc) => (doc.data().status || "pending") === activeTab);

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
      const statusUpdate =
        action === "approve" ? "approved" :
        action === "reject" ? "rejected" :
        action === "unpublish" ? "pending" : null;
      if (!statusUpdate) return;

      btn.disabled = true;
      btn.textContent = "Saving...";
      try {
        await db.collection("propertiess").doc(id).update({ status: statusUpdate });
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
    tabsBox.innerHTML = "";
    listBox.innerHTML = "";
    return;
  }

  db.collection("admins").doc(user.uid).get().then((adminDoc) => {
    if (!adminDoc.exists) {
      statusBox.innerHTML = `<p class="empty-state">You're signed in as ${user.email}, but this account doesn't have admin access.</p>`;
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
