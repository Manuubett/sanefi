renderNavbar("admin");
renderFooter();

const statusBox = document.getElementById("admin-status");
const dashboardStats = document.getElementById("dashboard-stats");
const dashboardTopLists = document.getElementById("dashboard-toplists");
const tabsBox = document.getElementById("admin-tabs");
const listBox = document.getElementById("admin-list");
const adsListBox = document.getElementById("ads-list");

let allDocs = [];
let activeTab = "pending";
const editingPhotos = new Map();

function formatPrice(price) {
  return "KSh " + Number(price || 0).toLocaleString();
}
function getStatus(doc) { return doc.data().status || "pending"; }
function getAvailability(doc) { return doc.data().availability || "available"; }
function isBooked(doc) { return getAvailability(doc) === "booked"; }

function escapeAttr(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Only allow http(s), tel and mailto links. "wa.me/254..." gets https:// added.
// Blocks javascript:, data: and other unsafe schemes.
function normalizeLink(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (/^(https?:|tel:|mailto:)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.\-]*:/i.test(u)) return "";
  return "https://" + u.replace(/^\/+/, "");
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
  actionButtons += `<button class="btn-secondary admin-edit-btn" data-action="edit">Edit</button>`;

  const photos = data.imageUrls && data.imageUrls.length ? data.imageUrls : [];
  editingPhotos.set(id, photos.slice());
  const coverUrl = data.coverImageUrl && photos.includes(data.coverImageUrl) ? data.coverImageUrl : photos[0];
  const coverPickerHTML = photos.length > 1
    ? `<div class="cover-picker" data-id="${id}">
        ${photos.map((url) => `<img src="${url}" class="cover-picker-thumb ${url === coverUrl ? "active" : ""}" data-url="${url}" title="${url === coverUrl ? "Current cover" : "Click to set as cover"}">`).join("")}
      </div>`
    : "";

  const photoThumbsHTML = photos.map((url) => `
      <div class="edit-photo-thumb-wrap" data-url="${escapeAttr(url)}">
        <img src="${url}" class="edit-photo-thumb">
        <button type="button" class="edit-photo-remove">&times;</button>
      </div>`).join("");

  return `
    <div class="admin-row-wrapper" data-id="${id}">
      <div class="admin-row" data-id="${id}">
        <img class="admin-row-thumb" src="${coverUrl || 'https://placehold.co/90x70?text=No+Image'}" alt="">
        <div class="admin-row-info">
          <strong>${escapeHTML(data.title || "Untitled listing")}</strong>
          <span>${escapeHTML(data.location || "")} &middot; ${formatPrice(data.price)}</span>
          <span class="admin-poster">Posted by ${escapeHTML(posterName)} &middot; ${escapeHTML(posterContact)}</span>
          ${coverPickerHTML}
        </div>
        <span class="admin-row-status ${booked ? "status-booked" : "status-" + status}">
          ${booked ? "Booked" : (status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending review")}
        </span>
        <div class="admin-row-actions">
          ${actionButtons}
          <button class="admin-delete-btn" data-action="delete" title="Delete permanently">&#128465;</button>
        </div>
      </div>

      <div class="edit-panel" id="edit-panel-${id}" style="display:none;">
        <form class="listing-form edit-inline-form" data-id="${id}">
          <div class="form-row">
            <label>Title <input type="text" class="edit-title" value="${escapeAttr(data.title || "")}" required></label>
            <label>Location <input type="text" class="edit-location" value="${escapeAttr(data.location || "")}"></label>
          </div>
          <div class="form-row">
            <label>Price (KSh) <input type="number" class="edit-price" min="0" value="${data.price || 0}"></label>
            <label>Poster Name <input type="text" class="edit-ownerName" value="${escapeAttr(data.ownerName || "")}"></label>
          </div>
          <label class="full-width">Poster Contact <input type="text" class="edit-ownerContact" value="${escapeAttr(data.ownerContact || "")}"></label>
          <label class="full-width">Description <textarea class="edit-description" rows="3">${escapeHTML(data.description || "")}</textarea></label>
          <div class="full-width">
            <label>Photos</label>
            <div class="edit-photo-grid" id="edit-photos-${id}">${photoThumbsHTML}</div>
            <input type="file" class="edit-photo-input" accept="image/*" multiple style="margin-top:8px;">
            <small>Click &times; on a photo to remove it. Add new ones with the file picker above.</small>
          </div>
          <div style="display:flex; gap:8px; margin-top:6px;">
            <button type="submit" class="btn-primary" style="width:auto; padding:10px 20px;">Save Changes</button>
            <button type="button" class="btn-secondary edit-cancel-btn" style="width:auto; padding:10px 20px;">Cancel</button>
          </div>
        </form>
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

  // sidebar badge: number of listings waiting for review
  const pendingBadge = document.getElementById("nav-pending-badge");
  if (pendingBadge) {
    pendingBadge.textContent = counts.pending;
    pendingBadge.style.display = counts.pending ? "inline-block" : "none";
  }

  const topByField = (field, label, emptyLabel) => {
    const sorted = [...allDocs]
      .filter((doc) => Number(doc.data()[field] || 0) > 0)
      .sort((a, b) => Number(b.data()[field] || 0) - Number(a.data()[field] || 0))
      .slice(0, 5);
    return sorted.length
      ? sorted.map((doc) => `
          <div class="top-list-row">
            <span class="tl-title">${escapeHTML(doc.data().title || "Untitled listing")}</span>
            <span class="tl-count">${Number(doc.data()[field] || 0)} ${label}</span>
          </div>`).join("")
      : `<p class="empty-state" style="padding:10px 0;">${emptyLabel}</p>`;
  };

  dashboardTopLists.innerHTML = `
    <div class="top-list-card"><h4>&#10084; Most Saved</h4>${topByField("savesCount", "saves", "No saves yet.")}</div>
    <div class="top-list-card"><h4>&#128065; Most Viewed</h4>${topByField("views", "views", "No views yet.")}</div>`;
}

function renderTabs() {
  const counts = { pending: 0, approved: 0, rejected: 0, booked: 0 };
  allDocs.forEach((doc) => {
    if (isBooked(doc)) counts.booked++;
    else if (counts[getStatus(doc)] !== undefined) counts[getStatus(doc)]++;
  });
  const tabs = [
    { key: "pending", label: "Pending" }, { key: "approved", label: "Approved" },
    { key: "booked", label: "Booked" }, { key: "rejected", label: "Rejected" }, { key: "all", label: "All" }
  ];
  tabsBox.innerHTML = tabs.map((t) => `
      <button class="admin-tab ${activeTab === t.key ? "active" : ""}" data-tab="${t.key}">
        ${t.label}${t.key !== "all" ? ` (${counts[t.key] || 0})` : ` (${allDocs.length})`}
      </button>`).join("");

  tabsBox.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => { activeTab = btn.dataset.tab; renderTabs(); renderList(); });
  });
}

function renderList() {
  const filtered = allDocs.filter((doc) => {
    if (activeTab === "all") return true;
    if (activeTab === "booked") return isBooked(doc);
    if (isBooked(doc)) return false;
    return getStatus(doc) === activeTab;
  });

  if (filtered.length === 0) {
    listBox.innerHTML = `<p class="empty-state">No listings in this category.</p>`;
    return;
  }
  listBox.innerHTML = filtered.map((doc) => adminRowHTML(doc.id, doc.data())).join("");
  attachActionHandlers();
  attachEditHandlers();
}

function loadProperties() {
  listBox.innerHTML = `<p class="empty-state">Loading properties&hellip;</p>`;
  db.collection("propertiess").orderBy("createdAt", "desc").get()
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

// NOTE: every selector below is scoped to listBox so these handlers never
// attach to buttons that belong to the adverts list (which share class names).
function attachActionHandlers() {
  listBox.querySelectorAll(".admin-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".admin-row").dataset.id;
      const currentlyFeatured = btn.dataset.featured === "true";
      btn.disabled = true; btn.textContent = "Saving...";
      try { await db.collection("propertiess").doc(id).update({ featured: !currentlyFeatured }); loadProperties(); }
      catch (err) { alert("Couldn't update this listing: " + err.message); loadProperties(); }
    });
  });

  listBox.querySelectorAll(".admin-action-btn").forEach((btn) => {
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
      btn.disabled = true; btn.textContent = "Saving...";
      try { await db.collection("propertiess").doc(id).update(update); loadProperties(); }
      catch (err) { alert("Couldn't update this listing: " + err.message); loadProperties(); }
    });
  });

  listBox.querySelectorAll(".cover-picker-thumb").forEach((thumb) => {
    thumb.addEventListener("click", async () => {
      const id = thumb.closest(".cover-picker").dataset.id;
      const url = thumb.dataset.url;
      try { await db.collection("propertiess").doc(id).update({ coverImageUrl: url }); loadProperties(); }
      catch (err) { alert("Couldn't set cover photo: " + err.message); }
    });
  });

  listBox.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = btn.closest(".admin-row");
      const id = row.dataset.id;
      const title = row.querySelector("strong")?.textContent || "this listing";
      if (!confirm(`Delete "${title}" permanently? This can't be undone.`)) return;
      btn.disabled = true;
      try { await db.collection("propertiess").doc(id).delete(); loadProperties(); }
      catch (err) { alert("Couldn't delete this listing: " + err.message); loadProperties(); }
    });
  });
}

function removePhotoFromWorkingSet(wrapEl) {
  const grid = wrapEl.closest(".edit-photo-grid");
  const id = grid.id.replace("edit-photos-", "");
  const url = wrapEl.dataset.url;
  const arr = editingPhotos.get(id) || [];
  const idx = arr.indexOf(url);
  if (idx !== -1) arr.splice(idx, 1);
  wrapEl.remove();
}

function buildPhotoThumbEl(url) {
  const wrap = document.createElement("div");
  wrap.className = "edit-photo-thumb-wrap";
  wrap.dataset.url = url;
  wrap.innerHTML = `<img src="${url}" class="edit-photo-thumb"><button type="button" class="edit-photo-remove">&times;</button>`;
  wrap.querySelector(".edit-photo-remove").addEventListener("click", () => removePhotoFromWorkingSet(wrap));
  return wrap;
}

function attachEditHandlers() {
  listBox.querySelectorAll(".edit-photo-remove").forEach((btn) => {
    btn.addEventListener("click", () => removePhotoFromWorkingSet(btn.closest(".edit-photo-thumb-wrap")));
  });

  listBox.querySelectorAll(".edit-photo-input").forEach((input) => {
    input.addEventListener("change", async () => {
      const files = input.files;
      if (!files || !files.length) return;
      const grid = input.closest(".edit-panel").querySelector(".edit-photo-grid");
      const id = grid.id.replace("edit-photos-", "");
      input.disabled = true;
      try {
        const urls = await uploadAllToCloudinary(files);
        const arr = editingPhotos.get(id) || [];
        urls.forEach((url) => { arr.push(url); grid.appendChild(buildPhotoThumbEl(url)); });
        editingPhotos.set(id, arr);
      } catch (err) {
        alert("Couldn't upload photos: " + err.message);
      } finally {
        input.disabled = false; input.value = "";
      }
    });
  });

  listBox.querySelectorAll(".admin-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.closest(".admin-row").dataset.id;
      const panel = document.getElementById(`edit-panel-${id}`);
      if (!panel) return;
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
  });

  listBox.querySelectorAll(".edit-cancel-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.closest(".edit-panel");
      if (panel) panel.style.display = "none";
    });
  });

  listBox.querySelectorAll(".edit-inline-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = form.dataset.id;
      const saveBtn = form.querySelector('button[type="submit"]');
      saveBtn.disabled = true; saveBtn.textContent = "Saving...";

      const imageUrls = editingPhotos.get(id) || [];
      const update = {
        title: form.querySelector(".edit-title").value.trim(),
        location: form.querySelector(".edit-location").value.trim(),
        price: Number(form.querySelector(".edit-price").value || 0),
        description: form.querySelector(".edit-description").value.trim(),
        imageUrls,
        ownerName: form.querySelector(".edit-ownerName").value.trim(),
        ownerContact: form.querySelector(".edit-ownerContact").value.trim()
      };

      try { await db.collection("propertiess").doc(id).update(update); loadProperties(); }
      catch (err) {
        alert("Couldn't save changes: " + err.message);
        saveBtn.disabled = false; saveBtn.textContent = "Save Changes";
      }
    });
  });
}

/* ================= ADS MANAGEMENT ================= */

let adsWorkingImage = null; // Cloudinary URL staged for the "add ad" form

function adRowHTML(id, data) {
  const active = data.active !== false;
  return `
    <div class="ad-row" data-id="${id}">
      <img class="ad-row-thumb" src="${escapeAttr(data.imageUrl) || 'https://placehold.co/90x60?text=No+Image'}" alt="">
      <div class="ad-row-info">
        <strong>${escapeHTML(data.caption || "Untitled advert")}</strong>
        <span class="ad-placement-pill">${data.placement === "popup" ? "Popup" : "Banner"}</span>
        ${data.link ? `<span>Links to: ${escapeHTML(data.link)}</span>` : ""}
      </div>
      <span class="ad-active-pill ${active ? "is-active" : "is-inactive"}">${active ? "Active" : "Inactive"}</span>
      <div class="admin-row-actions">
        <button class="btn-secondary ad-toggle-btn" data-id="${id}" data-active="${active}" style="width:auto; padding:8px 16px;">${active ? "Deactivate" : "Activate"}</button>
        <button class="admin-delete-btn" data-id="${id}" data-action="delete-ad" title="Delete permanently">&#128465;</button>
      </div>
    </div>`;
}

function loadAds() {
  if (!adsListBox) return;
  adsListBox.innerHTML = `<p class="empty-state">Loading adverts&hellip;</p>`;
  db.collection("ads").orderBy("createdAt", "desc").get()
    .then((snapshot) => {
      if (snapshot.empty) {
        adsListBox.innerHTML = `<p class="empty-state">No adverts yet &mdash; add one below.</p>`;
        return;
      }
      adsListBox.innerHTML = snapshot.docs.map((doc) => adRowHTML(doc.id, doc.data())).join("");
      attachAdHandlers();
    })
    .catch((err) => {
      console.error(err);
      adsListBox.innerHTML = `<p class="empty-state">Couldn't load adverts: ${err.message}</p>`;
    });
}

function attachAdHandlers() {
  adsListBox.querySelectorAll(".ad-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const currentlyActive = btn.dataset.active === "true";
      btn.disabled = true;
      try { await db.collection("ads").doc(id).update({ active: !currentlyActive }); loadAds(); }
      catch (err) { alert("Couldn't update advert: " + err.message); btn.disabled = false; }
    });
  });

  adsListBox.querySelectorAll('[data-action="delete-ad"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this advert permanently?")) return;
      const id = btn.dataset.id;
      btn.disabled = true;
      try { await db.collection("ads").doc(id).delete(); loadAds(); }
      catch (err) { alert("Couldn't delete advert: " + err.message); btn.disabled = false; }
    });
  });
}

function setupAdForm() {
  const fileInput = document.getElementById("ad-image-input");
  const preview = document.getElementById("ad-image-preview");
  const form = document.getElementById("ad-form");
  if (!fileInput || !form) return;

  fileInput.addEventListener("change", async () => {
    const files = fileInput.files;
    if (!files || !files.length) return;
    preview.textContent = "Uploading...";
    try {
      const urls = await uploadAllToCloudinary(files);
      adsWorkingImage = urls[0];
      preview.innerHTML = `<img src="${escapeAttr(adsWorkingImage)}" style="height:70px; border-radius:6px; margin-top:8px;">`;
    } catch (err) {
      preview.textContent = "Upload failed: " + err.message;
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!adsWorkingImage) {
      alert("Please upload an image for the advert first.");
      return;
    }
    const data = new FormData(form);
    const rawLink = String(data.get("link") || "").trim();
    const link = normalizeLink(rawLink);
    if (rawLink && !link) {
      alert("That link isn't allowed. Please use a normal web address, e.g. https://example.com or wa.me/2547XXXXXXXX");
      return;
    }

    const saveBtn = form.querySelector('button[type="submit"]');
    saveBtn.disabled = true; saveBtn.textContent = "Saving...";

    try {
      await db.collection("ads").add({
        imageUrl: adsWorkingImage,
        caption: data.get("caption") || "",
        link,
        placement: data.get("placement"),
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      form.reset();
      preview.innerHTML = "";
      adsWorkingImage = null;
      loadAds();
    } catch (err) {
      alert("Couldn't save advert: " + err.message);
    } finally {
      saveBtn.disabled = false; saveBtn.textContent = "Add Advert";
    }
  });
}

/* ==================================================== */

auth.onAuthStateChanged((user) => {
  if (!user) {
    statusBox.innerHTML = `<p class="empty-state">Please <a href="login.html">log in</a> to access the admin area.</p>`;
    dashboardStats.innerHTML = ""; dashboardTopLists.innerHTML = ""; tabsBox.innerHTML = ""; listBox.innerHTML = "";
    if (adsListBox) adsListBox.innerHTML = "";
    return;
  }

  db.collection("admins").doc(user.uid).get().then((adminDoc) => {
    if (!adminDoc.exists) {
      statusBox.innerHTML = `<p class="empty-state">You're signed in as ${user.email}, but this account doesn't have admin access.</p>`;
      dashboardStats.innerHTML = ""; dashboardTopLists.innerHTML = ""; tabsBox.innerHTML = ""; listBox.innerHTML = "";
      if (adsListBox) adsListBox.innerHTML = "";
      return;
    }
    statusBox.innerHTML = "";
    loadProperties();
    loadAds();
    setupAdForm();
  }).catch((err) => {
    console.error(err);
    statusBox.innerHTML = `<p class="empty-state">Couldn't verify admin access: ${err.message}</p>`;
  });
});
