renderNavbar("browse");
renderFooter();

const resultsGrid = document.getElementById("results-grid");
const params = new URLSearchParams(window.location.search);

// Pre-fill the filter form from the URL so a shared/bookmarked search works.
document.getElementById("f-location").value = params.get("location") || "";
document.getElementById("f-type").value = params.get("type") || "";
document.getElementById("f-price").value = params.get("maxPrice") || "";

document.getElementById("browse-search").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const p = new URLSearchParams();
  for (const [key, value] of form.entries()) {
    if (value) p.set(key, value);
  }
  window.location.href = `properties.html?${p.toString()}`;
});

function loadResults() {
  const location = (params.get("location") || "").trim().toLowerCase();
  const type = (params.get("type") || "").trim().toLowerCase();
  const maxPrice = params.get("maxPrice") ? Number(params.get("maxPrice")) : null;

  // onSnapshot instead of get(): Firestore serves the local cache instantly
  // on repeat visits, then keeps listening so newly approved listings (or
  // ones an admin just unbooked/unpublished) show up here automatically.
  db.collection("propertiess")
    .where("status", "==", "approved")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      // Firestore has no case-insensitive "contains" search, so location
      // matching happens client-side here. Fine for a few hundred listings;
      // swap in Algolia/Typesense once the catalog grows large.
      const docs = snapshot.docs.filter((doc) => {
        const p = doc.data();
        if ((p.availability || "available") === "booked") return false;

        // Location: check both location and county fields, case-insensitive.
        if (location) {
          const loc = (p.location || "").toLowerCase();
          const county = (p.county || "").toLowerCase();
          if (!loc.includes(location) && !county.includes(location)) return false;
        }

        // Type: case/whitespace-insensitive exact match.
        if (type && (p.type || "").trim().toLowerCase() !== type) return false;

        if (maxPrice !== null && Number(p.price || 0) > maxPrice) return false;
        return true;
      });

      if (docs.length === 0) {
        resultsGrid.innerHTML = `<p class="empty-state">No properties match your search yet. Try widening your filters, or <a href="list-property.html">list the first one</a>.</p>`;
        return;
      }
      resultsGrid.innerHTML = docs.map((doc) => propertyCardHTML(doc.id, doc.data())).join("");
      attachHeartHandlers(resultsGrid);
    }, (err) => {
      console.error(err);
      resultsGrid.innerHTML = `<p class="empty-state">Couldn't load properties right now.</p>`;
    });
}

loadResults();
