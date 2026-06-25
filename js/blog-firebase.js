// ══════════════════════════════════════════
// BLOG FUNCTIONALITY - FIREBASE FIRESTORE VERSION
// ══════════════════════════════════════════
// Fetch blog posts directly from Firestore using the public web config.
// Loaded as an ES module (see blog.html) so it can import the Firebase SDK.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  initializeFirestore,
  persistentLocalCache,
  collection,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export class BlogSystemFirebase {
  constructor(config = {}) {
    const app = initializeApp(config);
    // Persistent local cache: repeat visits and brief offline gaps still
    // render the last-seen posts from IndexedDB instead of a blank grid.
    this.db = initializeFirestore(app, { localCache: persistentLocalCache() });
    this.debug = config.debug || false;

    // Blog state
    this.currentPage = 1;
    this.currentCategory = null;
    this.postsPerPage = config.postsPerPage || 10;
    this.posts = [];
    this.totalPages = 1;
    this.categories = [];
    this.searchQuery = '';
    // Cursor (last doc snapshot) needed to fetch the page after the given page number.
    this.pageCursors = { 1: null };
    this.hasNextPage = false;

    // DOM elements
    this.blogGrid = document.querySelector('.blog-grid');
    this.paginationContainer = document.querySelector('.blog-pagination');
    this.filterContainer = document.querySelector('.blog-filters');
    this.searchInput = document.querySelector('.blog-search-input');

    this.log('BlogSystemFirebase initialized with config', config);
    this.init();
  }

  log(message, data) {
    if (this.debug) {
      console.debug(`[Blog] ${message}`, data || '');
    }
  }

  async init() {
    try {
      if (!this.blogGrid || !this.paginationContainer || !this.filterContainer) {
        console.error('[Blog] Error: Required DOM elements not found (.blog-grid, .blog-pagination, .blog-filters)');
        return;
      }

      await this.loadCategories();
      await this.loadPosts(1);
      this.setupEventListeners();

      this.log('Blog system initialized successfully');
    } catch (error) {
      console.error('[Blog] Initialization error:', error);
      this.showError('Failed to initialize blog system');
    }
  }

  showLoading() {
    if (this.blogGrid) {
      this.blogGrid.innerHTML = '<div class="blog-loading"><div class="spinner"></div><p>Loading posts...</p></div>';
    }
  }

  showError(message) {
    if (this.blogGrid) {
      this.blogGrid.innerHTML = `<p class="blog-error" role="alert">⚠️ ${message}</p>`;
    }
  }

  buildPostsQuery(category, cursor) {
    const constraints = [collection(this.db, 'posts')];
    if (category) constraints.push(where('category', '==', category));
    constraints.push(orderBy('published_at', 'desc'));
    if (cursor) constraints.push(startAfter(cursor));
    // Fetch one extra doc so we know whether a next page exists.
    constraints.push(limit(this.postsPerPage + 1));
    return query(...constraints);
  }

  async loadPosts(page = 1, category = null) {
    try {
      // Category changes reset pagination since cursors aren't valid across filters.
      if (category !== this.currentCategory) {
        this.pageCursors = { 1: null };
        page = 1;
      }
      this.currentPage = page;
      this.currentCategory = category;
      this.showLoading();

      const cursor = this.pageCursors[page] ?? null;
      this.log('Fetching posts', { page, category, hasCursor: !!cursor });

      const snapshot = await getDocs(this.buildPostsQuery(category, cursor));
      const docs = snapshot.docs;

      this.hasNextPage = docs.length > this.postsPerPage;
      const pageDocs = docs.slice(0, this.postsPerPage);

      if (this.hasNextPage) {
        this.pageCursors[page + 1] = pageDocs[pageDocs.length - 1];
      }

      this.posts = pageDocs.map((doc) => ({ id: doc.id, ...doc.data() }));
      this.totalPages = this.hasNextPage ? page + 1 : page;

      this.renderPosts();
      this.renderPagination();
    } catch (error) {
      console.error('[Blog] Error loading posts:', error);
      this.showError('Failed to load posts. Please try again later.');
    }
  }

  formatDate(publishedAt) {
    if (!publishedAt) return '';
    const date = typeof publishedAt.toDate === 'function' ? publishedAt.toDate() : new Date(publishedAt);
    return date.toLocaleDateString();
  }

  renderPosts() {
    if (!this.blogGrid) return;

    if (this.posts.length === 0) {
      const message = this.currentCategory
        ? `No posts found in <strong>${this.currentCategory}</strong>. Try a different category.`
        : 'No posts available yet. Check back soon!';
      this.blogGrid.innerHTML = `<div class="blog-empty-state"><p>${message}</p></div>`;
      return;
    }

    this.blogGrid.innerHTML = this.posts.map((post, index) => `
      <div class="blog-card" style="animation: fadeIn 0.5s ease ${index * 0.1}s both;">
        <div class="blog-image">
          <img src="${post.thumbnail_url || post.image_url || 'https://via.placeholder.com/400x250?text=No+Image'}"
               alt="${post.title}"
               onerror="this.src='https://via.placeholder.com/400x250?text=Image+Not+Found'" />
          ${post.category ? `<span class="blog-category">${post.category}</span>` : ''}
        </div>
        <div class="blog-content">
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <a href="/blog/${post.slug || post.id}" class="blog-read-more" onclick="blogSystemFirebase.viewPost('${post.id}'); return false;">
            Read More →
          </a>
        </div>
      </div>
    `).join('');
  }

  renderPagination() {
    if (!this.paginationContainer) return;

    let html = '<div class="blog-pagination-controls" role="navigation" aria-label="Blog pagination" aria-live="polite" aria-atomic="true">';

    if (this.currentPage > 1) {
      html += `<button class="blog-page-btn" onclick="blogSystemFirebase.loadPosts(${this.currentPage - 1}, ${this.currentCategory ? `'${this.currentCategory}'` : 'null'})">← Previous</button>`;
    } else {
      html += '<button class="blog-page-btn" disabled aria-disabled="true">← Previous</button>';
    }

    html += `<span class="blog-page-info">Page <span aria-live="polite">${this.currentPage}</span></span>`;

    if (this.hasNextPage) {
      html += `<button class="blog-page-btn" onclick="blogSystemFirebase.loadPosts(${this.currentPage + 1}, ${this.currentCategory ? `'${this.currentCategory}'` : 'null'})">Next →</button>`;
    } else {
      html += '<button class="blog-page-btn" disabled aria-disabled="true">Next →</button>';
    }

    html += '</div>';
    this.paginationContainer.innerHTML = html;
  }

  async loadCategories() {
    try {
      const snapshot = await getDocs(collection(this.db, 'posts'));
      const all = snapshot.docs.map((doc) => doc.data().category).filter(Boolean);
      this.categories = Array.from(new Set(all)).sort();
      this.renderCategoryFilters();
    } catch (error) {
      console.error('[Blog] Error loading categories:', error);
    }
  }

  renderCategoryFilters() {
    if (!this.filterContainer) return;

    let html = '<div class="blog-filter-buttons">';
    html += '<button class="blog-filter-btn active" onclick="blogSystemFirebase.filterByCategory(null)">All Posts</button>';

    this.categories.forEach((category) => {
      html += `<button class="blog-filter-btn" onclick="blogSystemFirebase.filterByCategory('${category}')">${category}</button>`;
    });

    html += '</div>';
    this.filterContainer.innerHTML = html;
  }

  filterByCategory(category) {
    this.loadPosts(1, category);

    document.querySelectorAll('.blog-filter-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
  }

  viewPost(postId) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      console.error('[Blog] Post not found:', postId);
      return;
    }
    this.showPostDetail(post);
  }

  showPostDetail(post) {
    const modalHTML = `
      <div class="blog-modal-overlay" onclick="blogSystemFirebase.closePostDetail()">
        <div class="blog-modal" onclick="event.stopPropagation()">
          <button class="blog-modal-close" onclick="blogSystemFirebase.closePostDetail()">×</button>
          <div class="blog-modal-content">
            ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="blog-modal-image" />` : ''}
            <h2>${post.title}</h2>
            ${post.category ? `<span class="blog-modal-category">${post.category}</span>` : ''}
            <div class="blog-modal-meta">
              Published: ${this.formatDate(post.published_at)}
            </div>
            <div class="blog-modal-content-text">${post.content || post.excerpt}</div>
          </div>
        </div>
      </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'blog-modal-container';
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
  }

  closePostDetail() {
    const modalContainer = document.getElementById('blog-modal-container');
    if (modalContainer) {
      modalContainer.remove();
    }
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('blog-filter-btn')) {
        document.querySelectorAll('.blog-filter-btn').forEach((btn) => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');
      }
    });

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (query.length === 0) {
          this.searchQuery = '';
          this.renderPosts();
          return;
        }

        this.searchQuery = query.toLowerCase();
        const filtered = this.posts.filter((post) =>
          post.title.toLowerCase().includes(this.searchQuery) ||
          post.excerpt.toLowerCase().includes(this.searchQuery)
        );

        if (filtered.length === 0) {
          this.blogGrid.innerHTML = `<div class="blog-empty-state"><p>No posts match "<strong>${this.searchQuery}</strong>"</p></div>`;
        } else {
          this.blogGrid.innerHTML = filtered.map((post, index) => `
            <div class="blog-card" style="animation: fadeIn 0.5s ease ${index * 0.1}s both;">
              <div class="blog-image">
                <img src="${post.thumbnail_url || post.image_url || 'https://via.placeholder.com/400x250?text=No+Image'}"
                     alt="${post.title}"
                     onerror="this.src='https://via.placeholder.com/400x250?text=Image+Not+Found'" />
                ${post.category ? `<span class="blog-category">${post.category}</span>` : ''}
              </div>
              <div class="blog-content">
                <h3>${post.title}</h3>
                <p>${post.excerpt}</p>
                <a href="/blog/${post.slug || post.id}" class="blog-read-more" onclick="blogSystemFirebase.viewPost('${post.id}'); return false;">
                  Read More →
                </a>
              </div>
            </div>
          `).join('');
        }
      });
    }
  }
}
