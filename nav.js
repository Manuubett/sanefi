function renderNavbar(activePage) {
  const isActive = (page) => (page === activePage ? "active" : "");
  document.getElementById("navbar-root").innerHTML = `
    <header class="navbar">
      <div class="navbar-inner">
        <a href="index.html" class="brand">
          <svg class="brand-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M24 4 L45 24 H38 V42 H10 V24 H3 Z" fill="var(--pink)"/>
            <rect x="20.5" y="20.5" width="4" height="4" fill="#fff"/>
            <rect x="25.5" y="20.5" width="4" height="4" fill="#fff"/>
            <rect x="20.5" y="25.5" width="4" height="4" fill="#fff"/>
            <rect x="25.5" y="25.5" width="4" height="4" fill="#fff"/>
          </svg>
          <span class="brand-text">
            <span class="brand-name">
              <span class="brand-name-top">Sanefi</span>
              <span class="brand-name-bottom">Consult</span>
            </span>
            <span class="brand-tagline">Real Estate | Property Management | Movers | Cleaners | BnB</span>
          </span>
        </a>
        <nav class="nav-links" id="nav-links">
          <a href="index.html" class="${isActive('home')}">Home</a>
          <a href="properties.html" class="${isActive('browse')}">Browse Properties</a>
          <a href="list-property.html" class="${isActive('list')}">List Property</a>
          <a href="about.html" class="${isActive('about')}">About Us</a>
          <a href="contact.html" class="${isActive('contact')}">Contact</a>
        </nav>
        <div class="nav-actions" id="nav-actions">
          <a href="saved.html" class="nav-action">&#9825; Saved</a>
          <a href="login.html" class="nav-action">&#128100; Login / Sign Up</a>
        </div>
        <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>`;

  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Swap the login link for a "log out" once we know who's signed in.
  auth.onAuthStateChanged((user) => {
    const actions = document.getElementById("nav-actions");
    if (!actions) return;
    if (user) {
      actions.innerHTML = `
        <a href="saved.html" class="nav-action">&#9825; Saved</a>
        <button class="nav-action nav-action-btn" id="logout-btn">Log out (${user.email})</button>`;
      document.getElementById("logout-btn").addEventListener("click", () => auth.signOut());
    } else {
      actions.innerHTML = `
        <a href="saved.html" class="nav-action">&#9825; Saved</a>
        <a href="login.html" class="nav-action">&#128100; Login / Sign Up</a>`;
    }
  });
}
