// One-off: generate a `slug` field for any post that doesn't already have one.
// Run once after deploying the permalink feature:
//
//   node scripts/backfill-slugs.js
//
// Auth comes from `gcloud auth application-default login` (same as migrate-to-firebase.js).

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault(), projectId: 'turquoiseautocentre' });
const db = getFirestore();

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

(async () => {
  const snapshot = await db.collection('posts').get();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const post = doc.data();
    if (post.slug) continue;

    const slug = slugify(post.title);
    await doc.ref.update({ slug });
    console.log(`${doc.id} -> ${slug}`);
    updated++;
  }

  console.log(`Backfilled ${updated} post(s).`);
  process.exit(0);
})();
