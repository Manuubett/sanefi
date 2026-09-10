renderNavbar("list");
renderFooter();

const form = document.getElementById("listing-form");
const submitBtn = document.getElementById("submit-btn");
const errorBox = document.getElementById("form-error");
const successBox = document.getElementById("form-success");
const signedOutNotice = document.getElementById("signed-out-notice");

let currentUser = null;
auth.onAuthStateChanged((user) => {
  currentUser = user;
  signedOutNotice.style.display = user ? "none" : "block";
  submitBtn.disabled = !user;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.style.display = "none";
  successBox.style.display = "none";

  if (!currentUser) {
    errorBox.textContent = "Please log in first.";
    errorBox.style.display = "block";
    return;
  }

  const data = new FormData(form);
  const photos = document.getElementById("photos-input").files;

  submitBtn.disabled = true;
  submitBtn.textContent = photos.length ? "Uploading photos..." : "Publishing...";

  try {
    const imageUrls = photos.length ? await uploadAllToCloudinary(photos) : [];

    submitBtn.textContent = "Publishing...";

    const docRef = await db.collection("propertiess").add({
      title: data.get("title"),
      listingType: data.get("listingType"),
      type: data.get("type"),
      price: Number(data.get("price")),
      location: data.get("location"),
      county: data.get("county"),
      bedrooms: Number(data.get("bedrooms")) || 0,
      bathrooms: Number(data.get("bathrooms")) || 0,
      parking: Number(data.get("parking")) || 0,
      description: data.get("description"),
      ownerContact: data.get("ownerContact"),
      imageUrls: imageUrls,
      ownerId: currentUser.uid,
      featured: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    window.location.href = `property.html?id=${docRef.id}`;
  } catch (err) {
    console.error(err);
    errorBox.textContent = "Couldn't publish your listing: " + err.message;
    errorBox.style.display = "block";
    submitBtn.disabled = false;
    submitBtn.textContent = "Publish Listing";
  }
});