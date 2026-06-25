// ══════════════════════════════════════════
// ADMIN PANEL — posts CRUD + enquiry status, gated by Firebase Auth.
// ══════════════════════════════════════════

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

function showToast(type, title, message, duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon" aria-hidden="true"></i>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-visible')));
  setTimeout(() => toast.remove(), duration);
}

// ── Auth gate ──
const loginView = document.getElementById('admin-login');
const appView = document.getElementById('admin-app');

document.getElementById('admin-login-btn').addEventListener('click', async () => {
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    showToast('error', 'Sign in failed', error.message);
  }
});

document.getElementById('admin-logout-btn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    loadPosts();
    loadEnquiries();
    loadStats();
  } else {
    loginView.classList.remove('hidden');
    appView.classList.add('hidden');
  }
});

// ── Tabs ──
document.querySelectorAll('.admin-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ── Posts ──
const postForm = document.getElementById('post-form');
const postIdField = document.getElementById('post-id');
const postFormHeading = document.getElementById('post-form-heading');
const postCancelBtn = document.getElementById('post-cancel-btn');

function resetPostForm() {
  postForm.reset();
  postIdField.value = '';
  postFormHeading.textContent = 'New Post';
  postCancelBtn.classList.add('hidden');
}

postCancelBtn.addEventListener('click', resetPostForm);

async function uploadPostImage(file) {
  const fileName = `${Date.now()}-${file.name}`;
  const fullPath = `post-images/${fileName}`;
  await uploadBytes(ref(storage, fullPath), file);

  const bucket = FIREBASE_CONFIG.storageBucket;
  const encode = (p) => encodeURIComponent(p);
  return {
    image_url: `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encode(fullPath)}?alt=media`,
    thumbnail_url: `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encode(`post-images/thumbnails/${fileName}`)}?alt=media`,
  };
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = postIdField.value;
  const title = document.getElementById('post-title').value.trim();
  const excerpt = document.getElementById('post-excerpt').value.trim();
  const category = document.getElementById('post-category').value.trim();
  const content = document.getElementById('post-content').value.trim();
  const imageFile = document.getElementById('post-image').files[0];

  const data = {
    title,
    excerpt,
    category: category || null,
    content,
    updated_at: Timestamp.now(),
  };

  try {
    if (imageFile) {
      const { image_url, thumbnail_url } = await uploadPostImage(imageFile);
      data.image_url = image_url;
      data.thumbnail_url = thumbnail_url;
    }

    if (id) {
      // Slug stays fixed once set, so already-shared links never break.
      await updateDoc(doc(db, 'posts', id), data);
      showToast('success', 'Post updated', title);
    } else {
      data.slug = slugify(title);
      data.published_at = Timestamp.now();
      data.created_at = Timestamp.now();
      await addDoc(collection(db, 'posts'), data);
      showToast('success', 'Post created', title);
    }

    resetPostForm();
    loadPosts();
  } catch (error) {
    showToast('error', 'Save failed', error.message);
  }
});

function editPost(post) {
  postIdField.value = post.id;
  document.getElementById('post-title').value = post.title || '';
  document.getElementById('post-excerpt').value = post.excerpt || '';
  document.getElementById('post-category').value = post.category || '';
  document.getElementById('post-content').value = post.content || '';
  postFormHeading.textContent = `Editing: ${post.title}`;
  postCancelBtn.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deletePost(id, title) {
  if (!confirm(`Delete post "${title}"? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, 'posts', id));
    showToast('success', 'Post deleted', title);
    loadPosts();
  } catch (error) {
    showToast('error', 'Delete failed', error.message);
  }
}

async function loadPosts() {
  const list = document.getElementById('posts-list');
  list.innerHTML = '<p>Loading...</p>';

  const snap = await getDocs(query(collection(db, 'posts'), orderBy('published_at', 'desc')));
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (posts.length === 0) {
    list.innerHTML = '<p>No posts yet.</p>';
    return;
  }

  list.innerHTML = '';
  posts.forEach((post) => {
    const row = document.createElement('div');
    row.className = 'admin-post-row';
    row.innerHTML = `
      <img src="${post.thumbnail_url || post.image_url || ''}" alt="" />
      <div class="grow">
        <strong>${post.title}</strong><br />
        <small>${post.category || 'Uncategorized'}</small>
      </div>
      <button class="btn-primary edit-btn">Edit</button>
      <button class="btn-primary delete-btn">Delete</button>
    `;
    row.querySelector('.edit-btn').addEventListener('click', () => editPost(post));
    row.querySelector('.delete-btn').addEventListener('click', () => deletePost(post.id, post.title));
    list.appendChild(row);
  });
}

// ── Enquiries ──
async function updateEnquiryStatus(id, status) {
  try {
    await updateDoc(doc(db, 'enquiries', id), { status });
    showToast('success', 'Status updated', status);
  } catch (error) {
    showToast('error', 'Update failed', error.message);
  }
}

async function loadEnquiries() {
  const list = document.getElementById('enquiries-list');
  list.innerHTML = '<p>Loading...</p>';

  const snap = await getDocs(query(collection(db, 'enquiries'), orderBy('created_at', 'desc')));
  const enquiries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (enquiries.length === 0) {
    list.innerHTML = '<p>No enquiries yet.</p>';
    return;
  }

  list.innerHTML = '';
  enquiries.forEach((enquiry) => {
    const row = document.createElement('div');
    row.className = 'admin-enquiry-row';
    row.innerHTML = `
      <div class="grow">
        <strong>${enquiry.name}</strong> — ${enquiry.service}<br />
        <small>${enquiry.phone}${enquiry.email ? ' · ' + enquiry.email : ''}</small><br />
        <small>${enquiry.vehicle || ''} ${enquiry.details ? '— ' + enquiry.details : ''}</small>
      </div>
      <select class="status-select">
        ${['pending', 'contacted', 'completed', 'cancelled']
          .map((s) => `<option value="${s}" ${s === enquiry.status ? 'selected' : ''}>${s}</option>`)
          .join('')}
      </select>
    `;
    row.querySelector('.status-select').addEventListener('change', (e) => {
      updateEnquiryStatus(enquiry.id, e.target.value);
    });
    list.appendChild(row);
  });
}

// ── Stats ──
async function loadStats() {
  const list = document.getElementById('stats-list');
  list.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

  const snap = await getDocs(query(collection(db, 'posts'), orderBy('published_at', 'desc')));
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (posts.length === 0) {
    list.innerHTML = '<tr><td colspan="4">No posts yet.</td></tr>';
    return;
  }

  list.innerHTML = posts.map((post) => {
    const published = post.published_at?.toDate ? post.published_at.toDate().toLocaleDateString() : '';
    return `
      <tr>
        <td>${post.title}</td>
        <td>${post.views || 0}</td>
        <td>${post.shares || 0}</td>
        <td>${published}</td>
      </tr>
    `;
  }).join('');
}
