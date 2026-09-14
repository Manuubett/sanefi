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

// Strips common Markdown formatting so text pasted from AI tools or
// formatted docs (headings, bold/italic, bullet dashes, links, code
// backticks) doesn't show up as raw symbols on a plain-text description.
function stripMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/^#{1,6}\s+/gm, "")                       // ## Heading -> Heading
    .replace(/\*\*(.+?)\*\*/g, "$1")                   // **bold** -> bold
    .replace(/__(.+?)__/g, "$1")                       // __bold__ -> bold
    .replace(/\*(.+?)\*/g, "$1")                       // *italic* -> italic
    .replace(/_(.+?)_/g, "$1")                         // _italic_ -> italic
    .replace(/`([^`]+)`/g, "$1")                       // `code` -> code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")           // [text](url) -> text
    .replace(/^[\*\-]\s+/gm, "\u2022 ")                // - item / * item -> • item
    .replace(/(\S)--(\S)/g, "$1\u2014$2")              // word--word -> word—word
    .replace(/\s--\s/g, " \u2014 ")                    // " -- " -> " — "
    .trim();
}

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
  const isLand = data.get("type") === "Land";

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
      // Residential fields (ignored/zeroed for land listings).
      bedrooms: isLand ? 0 : Number(data.get("bedrooms")) || 0,
      bathrooms: isLand ? 0 : Number(data.get("bathrooms")) || 0,
      parking: isLand ? 0 : Number(data.get("parking")) || 0,
      // Land-specific fields (only meaningful when type === "Land").
      landSize: isLand ? Number(data.get("landSize")) || 0 : null,
      landSizeUnit: isLand ? data.get("landSizeUnit") : null,
      titleDeedVerified: isLand ? data.get("titleDeedVerified") === "yes" : false,
      hasElectricity: isLand ? data.get("hasElectricity") === "yes" : false,
      hasWater: isLand ? data.get("hasWater") === "yes" : false,
      hasAccessRoad: isLand ? data.get("hasAccessRoad") === "yes" : false,
      description: stripMarkdown(data.get("description")),
      ownerName: data.get("ownerName"),
      ownerContact: data.get("ownerContact"),
      imageUrls: imageUrls,
      ownerId: currentUser.uid,
      featured: false,
      status: "pending",
      availability: "available",
      views: 0,
      savesCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    successBox.textContent = "Thanks! Your listing has been submitted and will go live once our team reviews and approves it.";
    successBox.style.display = "block";
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = "Publish Listing";
  } catch (err) {
    console.error(err);
    errorBox.textContent = "Couldn't publish your listing: " + err.message;
    errorBox.style.display = "block";
    submitBtn.disabled = false;
    submitBtn.textContent = "Publish Listing";
  }
});
