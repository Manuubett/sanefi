renderNavbar(null);
renderFooter();

const detailRoot = document.getElementById("detail-root");
const id = new URLSearchParams(window.location.search).get("id");

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
      ? `<div class="gallery-thumbs">${photos.map((u) => `<img src="${u}" alt="">`).join("")}</div>`
      : "";
    const price = Number(p.price || 0).toLocaleString("en-KE");

    detailRoot.innerHTML = `
      <div class="detail-gallery">
        <img src="${photos[0]}" alt="${escapeHTML(p.title || "")}">
        ${thumbs}
      </div>
      <div class="detail-info">
        <span class="badge">${escapeHTML(p.listingType || "For Rent")}</span>
        <h1>${escapeHTML(p.title || "")}</h1>
        <p class="location">&#128205; ${escapeHTML(p.location || "")}</p>
        <p class="price">KSh ${price} / month</p>
        <div class="property-stats detail-stats">
          <span>&#128716; ${p.bedrooms ?? 0} Beds</span>
          <span>&#128703; ${p.bathrooms ?? 0} Baths</span>
          <span>&#128663; ${p.parking ?? 0} Parking</span>
        </div>
        <h3>Description</h3>
        <p>${escapeHTML(p.description || "No description provided.")}</p>
        <div class="contact-box">
          <h4>Interested in this property?</h4>
          <p>Contact: ${escapeHTML(p.ownerContact || "not provided")}</p>
        </div>
      </div>`;
  }).catch((err) => {
    console.error(err);
    detailRoot.innerHTML = `<p class="empty-state">Couldn't load this property right now.</p>`;
  });
}
