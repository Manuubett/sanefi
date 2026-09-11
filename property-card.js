// Renders one property document (Firestore doc data + id) as the card HTML
// used on both the home page's "Featured" grid and the Browse page.
function propertyCardHTML(id, p) {
  const cover = (p.imageUrls && p.imageUrls.length) ? p.imageUrls[0] : "img/placeholder-property.jpg";
  const price = Number(p.price || 0).toLocaleString("en-KE");
  const saved = typeof isPropertySaved === "function" && isPropertySaved(id);
  return `
    <div class="property-card">
      <div class="property-image">
        <img src="${cover}" alt="${escapeHTML(p.title || "")}">
        <span class="badge">${escapeHTML(p.listingType || "For Rent")}</span>
        <span class="heart ${saved ? "active" : ""}" data-id="${id}">${saved ? "&#9829;" : "&#9825;"}</span>
      </div>
      <div class="property-body">
        <h3>${escapeHTML(p.title || "")}</h3>
        <p class="price">KSh ${price} / month</p>
        <p class="location">&#128205; ${escapeHTML(p.location || "")}</p>
        <div class="property-stats">
          <span>&#128716; ${p.bedrooms ?? 0} Beds</span>
          <span>&#128703; ${p.bathrooms ?? 0} Baths</span>
          <span>&#128663; ${p.parking ?? 0} Parking</span>
        </div>
        <a href="property.html?id=${id}" class="btn-primary">View Details</a>
      </div>
    </div>`;
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
