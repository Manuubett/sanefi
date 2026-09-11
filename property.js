
renderNavbar(null);
renderFooter();

const detailRoot = document.getElementById("detail-root");
const id = new URLSearchParams(window.location.search).get("id");

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "Recently";
  return timestamp.toDate().toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function isPhoneNumber(str) {
  return /^[+0-9\s-]{7,}$/.test((str || "").trim());
}

function toWhatsAppNumber(raw) {
  let digits = (raw || "").replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = "254" + digits.slice(1);
  else if (digits.startsWith("7") && digits.length === 9) digits = "254" + digits;
  return digits;
}

function initials(name) {
  return (name || "P O")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

if (!id) {
  detailRoot.innerHTML = `<p class="empty-state">No property specified. <a href="properties.html">Browse all properties</a>.</p>`;
} else {
  db.collection("propertiess").doc(id).get().then((doc) => {
    if (!doc.exists) {
      detailRoot.innerHTML = `<p class="empty-state">That listing wasn't found. <a href="properties.html">Browse all properties</a>.</p>`;
      return;
    }
    const p = doc.data();
    document.getElementById("page-title").textContent = `${p.title} - HomeLink Kenya`;

    const photos = (p.imageUrls && p.imageUrls.length) ? p.imageUrls : ["img/placeholder-property.jpg"];
    const thumbs = photos.length > 1
      ? `<div class="gallery-thumbs">${photos.map((u, i) =>
          `<img src="${u}" alt="" data-index="${i}" class="${i === 0 ? "active" : ""}">`
        ).join("")}</div>`
      : "";
    const price = Number(p.price || 0).toLocaleString("en-KE");

    const contact = p.ownerContact || "";
    const refId = "#" + id.slice(-6).toUpperCase();
    const postedDate = formatDate(p.createdAt);
    const viewCount = Number(p.views || 0);
    const saved = typeof isPropertySaved === "function" && isPropertySaved(id);
    const ownerName = p.ownerName || "Property Owner";

    const callWhatsAppButtons = isPhoneNumber(contact)
      ? `
        <a href="tel:${contact.replace(/\s/g, "")}" class="action-btn btn-call">&#128222; Call</a>
        <a href="https://wa.me/${toWhatsAppNumber(contact)}" target="_blank" rel="noopener" class="action-btn btn-whatsapp">&#128172; WhatsApp</a>`
      : (contact
          ? `<a href="mailto:${contact}" class="action-btn btn-call">&#9993; Email Owner</a>`
          : "");

    detailRoot.innerHTML = `
      <div class="detail-gallery">
        <img src="${photos[0]}" alt="${escapeHTML(p.title || "")}" id="main-photo">
        ${thumbs}
      </div>
      <div class="detail-info">
        <span class="badge">${escapeHTML(p.listingType || "For Rent")}</span>
        <h1>${escapeHTML(p.title || "")}</h1>
        <p class="location">&#128205; ${escapeHTML(p.location || "")}</p>
        <p class="price">KSh ${price} / month</p>

        <div class="detail-actions">
          ${callWhatsAppButtons}
          <button class="action-btn btn-outline ${saved ? "is-saved" : ""}" id="save-btn">
            <span id="save-icon">${saved ? "&#9829;" : "&#9825;"}</span> <span id="save-label">${saved ? "Saved" : "Save"}</span>
          </button>
          <button class="action-btn btn-outline" id="share-btn">&#128257; Share</button>
        </div>

        <div class="detail-meta">
          <span>&#128295; Ref ${refId}</span>
          <span>&#128197; Posted ${postedDate}</span>
          <span>&#128065; <span id="view-count">${viewCount}</span> views</span>
        </div>

        <div class="property-stats detail-stats">
          <span>&#128716; ${p.bedrooms ?? 0} Beds</span>
          <span>&#128703; ${p.bathrooms ?? 0} Baths</span>
          <span>&#128663; ${p.parking ?? 0} Parking</span>
        </div>
        <h3>Description</h3>
        <p>${escapeHTML(p.description || "No description provided.")}</p>

        <div class="agent-card">
          <div class="agent-card-top">
            <div class="agent-avatar">${initials(ownerName)}</div>
            <div>
              <div class="agent-name">${escapeHTML(ownerName)}</div>
              <div class="agent-role">Marketed by</div>
            </div>
          </div>
          <p class="agent-contact-line">&#128222; ${escapeHTML(contact || "Not provided")}</p>
          <p class="agent-contact-line">&#128205; ${escapeHTML(p.county || p.location || "")}</p>
          <span class="report-link" id="report-link">&#9873; Report this listing</span>
        </div>
      </div>`;

    // Gallery: clicking a thumbnail swaps the main photo
    const mainPhoto = document.getElementById("main-photo");
    detailRoot.querySelectorAll(".gallery-thumbs img").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        mainPhoto.src = photos[Number(thumb.dataset.index)];
        detailRoot.querySelectorAll(".gallery-thumbs img").forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
      });
    });

    // Save button
    const saveBtn = document.getElementById("save-btn");
    saveBtn.addEventListener("click", () => {
      const nowSaved = toggleSavedProperty(id);
      saveBtn.classList.toggle("is-saved", nowSaved);
      document.getElementById("save-icon").innerHTML = nowSaved ? "&#9829;" : "&#9825;";
      document.getElementById("save-label").textContent = nowSaved ? "Saved" : "Save";
    });

    // Share button
    document.getElementById("share-btn").addEventListener("click", async () => {
      const shareData = { title: p.title, text: `Check out this listing on Sanefi Consult`, url: window.location.href };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch { /* user cancelled */ }
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href);
          const btn = document.getElementById("share-btn");
          const original = btn.innerHTML;
          btn.innerHTML = "&#10003; Link copied!";
          setTimeout(() => (btn.innerHTML = original), 2000);
        } catch {
          alert(window.location.href);
        }
      }
    });

    // Report link
    document.getElementById("report-link").addEventListener("click", () => {
      window.location.href = `mailto:support@sanefconsult.com?subject=Reporting listing ${refId}&body=Please describe the issue with this listing: ${window.location.href}`;
    });

    // View count: only increment once per browser session per listing.
    const viewedKey = `viewed_${id}`;
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, "1");
      db.collection("propertiess").doc(id).update({
        views: firebase.firestore.FieldValue.increment(1)
      }).then(() => {
        const el = document.getElementById("view-count");
        if (el) el.textContent = viewCount + 1;
      }).catch((err) => console.error("Couldn't update view count:", err));
    }
  }).catch((err) => {
    console.error(err);
    detailRoot.innerHTML = `<p class="empty-state">Couldn't load this property right now.</p>`;
  });
}
