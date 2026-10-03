(function () {
  const TITLES = { overview: "Overview", listings: "Listings", ads: "Adverts" };
  const links = document.querySelectorAll("[data-panel]");
  const sidebar = document.getElementById("admin-sidebar");
  const overlay = document.getElementById("admin-overlay");
  const titleEl = document.getElementById("admin-mobilebar-title");

  function openMenu() { sidebar.classList.add("open"); overlay.classList.add("open"); }
  function closeMenu() { sidebar.classList.remove("open"); overlay.classList.remove("open"); }

  function show(name) {
    if (!TITLES[name]) name = "overview";
    document.querySelectorAll(".admin-panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + name));
    links.forEach((l) => l.classList.toggle("active", l.dataset.panel === name));
    if (titleEl) titleEl.textContent = TITLES[name];
    try { localStorage.setItem("adminPanel", name); } catch (e) {}
    history.replaceState(null, "", "#" + name);
    closeMenu();
    window.scrollTo({ top: 0 });
  }

  links.forEach((l) => l.addEventListener("click", (e) => { e.preventDefault(); show(l.dataset.panel); }));
  document.getElementById("admin-menu-btn").addEventListener("click", openMenu);
  document.getElementById("admin-sidebar-close").addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  window.addEventListener("hashchange", () => show(location.hash.replace("#", "")));

  const logout = document.getElementById("admin-logout");
  if (logout) {
    logout.addEventListener("click", () => {
      if (typeof auth === "undefined") { location.href = "index.html"; return; }
      auth.signOut().then(() => { location.href = "index.html"; });
    });
  }

  // open the section in the link (#ads), else the last one used, else Overview
  let start = location.hash.replace("#", "");
  if (!TITLES[start]) { try { start = localStorage.getItem("adminPanel"); } catch (e) {} }
  show(start);
})();
