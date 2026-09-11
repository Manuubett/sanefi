renderNavbar("home");
renderFooter();

const featuredGrid = document.getElementById("featured-grid");

db.collection("propertiess")
  .where("status", "==", "approved")
  .where("featured", "==", true)
  .orderBy("createdAt", "desc")
  .limit(4)
  .get()
  .then((snapshot) => {
    if (snapshot.empty) {
      featuredGrid.innerHTML = `<p class="empty-state">No featured listings yet &mdash; be the first to <a href="list-property.html">list a property</a>.</p>`;
      return;
    }
    featuredGrid.innerHTML = snapshot.docs
      .map((doc) => propertyCardHTML(doc.id, doc.data()))
      .join("");
    attachHeartHandlers(featuredGrid);
  })
  .catch((err) => {
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
