renderNavbar("admin");
renderFooter();

const statusBox = document.getElementById("admin-status");
const listBox = document.getElementById("admin-list");

function formatPrice(price) {
  return "KSh " + Number(price || 0).toLocaleString();
}

function adminRowHTML(id, data) {
  const isFeatured = !!data.featured;
  return `
    <div class="admin-row" data-id="${id}">
      <img class="admin-row-thumb" src="${(data.imageUrls && data.imageUrls[0]) || 'https://placehold.co/90x70?text=No+Image'}" alt="">
      <div class="admin-row-info">
        <strong>${data.title || "Untitled listing"}</strong>
        <span>${data.location || ""} &middot; ${formatPrice(data.price)}</span>
      </div>
      <span class="admin-row-status ${isFeatured ? "is-featured" : ""}">${isFeatured ? "Featured" : "Not featured"}</span>
      <button class="btn-secondary admin-toggle-btn" data-featured="${isFeatured}">
        ${isFeatured ? "Unfeature" : "Feature"}
      </button>
    </div>`;
}

function loadProperties() {
  listBox.innerHTML = `<p class="empty-state">Loading properties&hellip;</p>`;
  db.collection("propertiess")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        listBox.innerHTML = `<p class="empty-state">No properties listed yet.</p>`;
        return;
      }
      listBox.innerHTML = snapshot.docs
        .map((doc) => adminRowHTML(doc.id, doc.data()))
        .join("");
      attachToggleHandlers();
    })
    .catch((err) => {
      console.error(err);
      listBox.innerHTML = `<p class="empty-state">Couldn't load properties: ${err.message}</p>`;
    });
}

function attachToggleHandlers() {
  document.querySelectorAll(".admin-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = btn.closest(".admin-row");
      const id = row.dataset.id;
      const currentlyFeatured = btn.dataset.featured === "true";
      btn.disabled = true;
      btn.textContent = "Saving...";
      try {
        await db.collection("propertiess").doc(id).update({ featured: !currentlyFeatured });
        loadProperties();
      } catch (err) {
        console.error(err);
        alert("Couldn't update this listing: " + err.message);
        btn.disabled = false;
        btn.textContent = currentlyFeatured ? "Unfeature" : "Feature";
      }
    });
  });
}

auth.onAuthStateChanged((user) => {
  if (!user) {
    statusBox.innerHTML = `<p class="empty-state">Please <a href="login.html">log in</a> to access the admin area.</p>`;
    listBox.innerHTML = "";
    return;
  }

  db.collection("admins").doc(user.uid).get().then((adminDoc) => {
    if (!adminDoc.exists) {
      statusBox.innerHTML = `<p class="empty-state">You're signed in as ${user.email}, but this account doesn't have admin access.</p>`;
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