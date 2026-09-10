renderNavbar(null);
renderFooter();

const authError = document.getElementById("auth-error");

function showError(err) {
  const messages = {
    "auth/email-already-in-use": "That email is already registered. Try logging in instead.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/weak-password": "Password should be at least 6 characters."
  };
  authError.textContent = messages[err.code] || "Something went wrong. Please try again.";
  authError.style.display = "block";
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.style.display = "none";
  const data = new FormData(e.target);
  try {
    await auth.signInWithEmailAndPassword(data.get("email"), data.get("password"));
    window.location.href = "index.html";
  } catch (err) {
    showError(err);
  }
});

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.style.display = "none";
  const data = new FormData(e.target);
  try {
    await auth.createUserWithEmailAndPassword(data.get("email"), data.get("password"));
    window.location.href = "index.html";
  } catch (err) {
    showError(err);
  }
});
