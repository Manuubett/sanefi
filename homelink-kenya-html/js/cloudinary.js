// Uploads a single File straight from the browser to Cloudinary using an
// unsigned upload preset (Settings -> Upload -> Upload presets in your
// Cloudinary dashboard). Returns the hosted photo's secure URL.
async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "homelink-kenya/properties");

  const response = await fetch(url, { method: "POST", body: formData });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Photo upload failed");
  }
  const data = await response.json();
  return data.secure_url;
}

// Uploads every file in a FileList (from an <input type="file" multiple>)
// and returns an array of secure URLs, in order.
async function uploadAllToCloudinary(fileList) {
  const files = Array.from(fileList);
  const urls = [];
  for (const file of files) {
    urls.push(await uploadToCloudinary(file));
  }
  return urls;
}
