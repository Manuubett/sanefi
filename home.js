renderNavbar("home");
renderFooter();

const featuredGrid = document.getElementById("featured-grid");

// onSnapshot instead of get(): Firestore serves the local cache instantly
// (fast repeat loads, works offline), then keeps this listener open so
// newly approved/featured listings appear automatically — no manual
// refresh or polling needed.
db.collection("propertiess")
  .where("status", "==", "approved")
  .orderBy("createdAt", "desc")
  .onSnapshot((snapshot) => {
    // Featured + booked filtering happens client-side here (same pattern as
    // properties.js) so both pages share one query shape and only need a
    // single composite index: status + createdAt.
    const docs = snapshot.docs
      .filter((doc) => {
        const p = doc.data();
        return p.featured === true && (p.availability || "available") !== "booked";
      })
      .slice(0, 4);

    if (docs.length === 0) {
      featuredGrid.innerHTML = `<p class="empty-state">No featured listings yet &mdash; be the first to <a href="list-property.html">list a property</a>.</p>`;
      return;
    }
    featuredGrid.innerHTML = docs
      .map((doc) => propertyCardHTML(doc.id, doc.data()))
      .join("");
    attachHeartHandlers(featuredGrid);
  }, (err) => {
    console.error(err);
    const hint = err.code === "failed-precondition"
      ? " (Firestore needs an index for this query — check the browser console for a link to create it.)"
      : "";
    featuredGrid.innerHTML = `<p class="empty-state">Couldn't load properties right now.${hint}</p>`;
  });

// Hero search bar just forwards to the Browse page with the chosen filters.
document.getElementById("hero-search").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const params = new URLSearchParams();
  for (const [key, value] of form.entries()) {
    if (value) params.set(key, value);
  }
  window.location.href = `properties.html?${params.toString()}`;
});
