// One-off migration: copy `posts` and `enquiries` rows from Supabase into Firestore.
// Run manually after Firestore is set up, before cutting the live site over:
//
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/migrate-to-firebase.js
//
// Auth comes from `gcloud auth application-default login` (run once beforehand),
// not a downloaded service account key.

const { createClient } = require('@supabase/supabase-js');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
initializeApp({
  credential: applicationDefault(),
  projectId: 'turquoiseautocentre',
});
const db = getFirestore();

function toTimestamp(value) {
  return value ? Timestamp.fromDate(new Date(value)) : null;
}

async function migratePosts() {
  const { data: posts, error } = await supabase.from('posts').select('*');
  if (error) throw error;

  console.log(`Migrating ${posts.length} posts...`);
  for (const post of posts) {
    await db.collection('posts').doc(String(post.id)).set({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image_url: post.image_url || null,
      category: post.category || null,
      published_at: toTimestamp(post.published_at),
      created_at: toTimestamp(post.created_at),
      updated_at: toTimestamp(post.updated_at),
    });
  }
  console.log('Posts migrated.');
}

async function migrateEnquiries() {
  const { data: enquiries, error } = await supabase.from('enquiries').select('*');
  if (error) throw error;

  console.log(`Migrating ${enquiries.length} enquiries...`);
  for (const enquiry of enquiries) {
    await db.collection('enquiries').add({
      name: enquiry.name,
      email: enquiry.email || null,
      phone: enquiry.phone,
      service: enquiry.service,
      vehicle: enquiry.vehicle || null,
      details: enquiry.details || null,
      created_at: toTimestamp(enquiry.created_at),
      status: enquiry.status || 'pending',
    });
  }
  console.log('Enquiries migrated.');
}

(async () => {
  try {
    await migratePosts();
    await migrateEnquiries();
    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
