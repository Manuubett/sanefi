/*
  ONE-TIME MIGRATION — run this once, then delete it.

  Existing listings don't have a `titleLower` field, so the new admin
  search box won't find them until this backfills it.

  How to run:
  1. Open your live site in the browser and log in as an admin
     (so Firestore security rules allow the writes).
  2. Open the browser DevTools console (F12 → Console tab).
  3. Paste this whole script in and press Enter.
  4. Watch the console log — it will report how many docs it updated.
  5. Re-run it any time in the future is safe (it just re-sets the same field).

  New listings created after admin.js is updated will get `titleLower`
  automatically going forward — this script is only for the backlog.
*/

(async function migrateTitleLower() {
  const snapshot = await db.collection("propertiess").get();
  console.log(`Found ${snapshot.size} listings. Updating...`);

  let updated = 0;
  const batchSize = 400; // stay comfortably under Firestore's 500-write batch limit
  let batch = db.batch();
  let opsInBatch = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const title = data.title || "";
    const titleLower = title.toLowerCase();

    if (data.titleLower === titleLower) continue; // already up to date

    batch.update(doc.ref, { titleLower });
    opsInBatch++;
    updated++;

    if (opsInBatch >= batchSize) {
      await batch.commit();
      console.log(`Committed a batch of ${opsInBatch}...`);
      batch = db.batch();
      opsInBatch = 0;
    }
  }

  if (opsInBatch > 0) {
    await batch.commit();
  }

  console.log(`Done. Updated ${updated} listing(s).`);
})();
