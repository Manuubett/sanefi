function renderFooter() {
  const year = new Date().getFullYear();
  document.getElementById("footer-root").innerHTML = `
    <footer class="site-footer">
      <div class="footer-main">
        <div class="footer-col">
          <h4>Sanefi Consult</h4>
          <p class="footer-note">Helping you find rental houses, apartments and bedsitters from trusted landlords and agents across Kenya.</p>
          <div class="social-icons">
            <a href="#" aria-label="Facebook">FB</a>
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="X / Twitter">X</a>
            <a href="#" aria-label="WhatsApp">WA</a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Quick Links</h4>
          <a href="index.html">Home</a>
          <a href="properties.html">Browse Properties</a>
          <a href="list-property.html">List Property</a>
          <a href="about.html">About Us</a>
          <a href="contact.html">Contact</a>
        </div>
        <div class="footer-col">
          <h4>Services</h4>
          <a href="properties.html?type=Apartment">Apartments</a>
          <a href="properties.html?type=House">Houses</a>
          <a href="properties.html?type=Bedsitter">Bedsitters</a>
          <a href="contact.html">Property Management</a>
          <a href="contact.html">Movers &amp; Cleaners</a>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <a href="contact.html">Contact Us</a>
          <a href="login.html">Login / Sign Up</a>
          <a href="saved.html">Saved Properties</a>
        </div>
        <div class="footer-col">
          <h4>Stay Updated</h4>
          <p class="footer-note">Get new listings and offers straight to your inbox.</p>
          <form class="subscribe-form" id="footer-subscribe-form">
            <input type="email" placeholder="Your email address" required>
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>
      <div class="dev-credit">
        <img src="deh-logo.png" alt="Deh Emanuel's Solutions" class="dev-credit-logo" onerror="this.style.display='none'">
        <div class="dev-credit-text">
          <span class="dev-credit-label">Website designed &amp; maintained by</span>
          <a href="https://deh-emanuels-solutions.bett.website/" target="_blank" rel="noopener" class="dev-credit-name">Deh Emanuel's Solutions</a>
          <span class="dev-credit-tagline">Smart Systems. Better Schools. Stronger Businesses.</span>
        </div>
        <a href="https://deh-emanuels-solutions.bett.website/" target="_blank" rel="noopener" class="dev-credit-btn">Visit Website &rarr;</a>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${year} Sanefi Consult. All rights reserved.</span>
        <div class="footer-legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>`;

  const subscribeForm = document.getElementById("footer-subscribe-form");
  if (subscribeForm) {
    subscribeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      subscribeForm.innerHTML = `<span style="color:#fff;font-size:13px;">Thanks for subscribing!</span>`;
    });
  }
}
