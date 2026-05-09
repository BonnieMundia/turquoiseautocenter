// ══════════════════════════════════════════
// BLOG FUNCTIONALITY - SUPABASE REST API VERSION
// ══════════════════════════════════════════
// Fetch blog posts directly from Supabase using the public anon key

class BlogSystemSupabase {
  constructor(config = {}) {
    // Supabase configuration
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
    this.debug = config.debug || false;

    // Blog state
    this.currentPage = 1;
    this.currentCategory = null;
    this.postsPerPage = config.postsPerPage || 10;
    this.posts = [];
    this.totalPages = 0;
    this.categories = [];
    this.searchQuery = '';
    this.cache = new Map(); // Simple caching
    
    // DOM elements
    this.blogGrid = document.querySelector('.blog-grid');
    this.paginationContainer = document.querySelector('.blog-pagination');
    this.filterContainer = document.querySelector('.blog-filters');
    this.searchInput = document.querySelector('.blog-search-input');
    
    this.log('BlogSystemSupabase initialized with config', config);
    this.init();
  }

  log(message, data) {
    if (this.debug) {
      console.debug(`[Blog] ${message}`, data || '');
    }
  }

  async init() {
    try {
      // Validate required DOM elements
      if (!this.blogGrid || !this.paginationContainer || !this.filterContainer) {
        console.error('[Blog] Error: Required DOM elements not found (.blog-grid, .blog-pagination, .blog-filters)');
        return;
      }

      // Load categories
      await this.loadCategories();
      
      // Load initial posts
      await this.loadPosts(1);
      
      // Set up event listeners
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

  async loadPosts(page = 1, category = null) {
    try {
      this.currentPage = page;
      this.currentCategory = category;
      this.showLoading();

      const offset = (page - 1) * this.postsPerPage;
      let url = `${this.supabaseUrl}/rest/v1/posts?select=*&order=published_at.desc&limit=${this.postsPerPage}&offset=${offset}`;
      if (category) {
        url += `&category=eq.${encodeURIComponent(category)}`;
      }

      // Check cache
      const cacheKey = `posts_${page}_${category}`;
      if (this.cache.has(cacheKey)) {
        this.log('Using cached posts', { cacheKey });
        const cached = this.cache.get(cacheKey);
        this.posts = cached.posts;
        this.totalPages = cached.totalPages;
        this.renderPosts();
        this.renderPagination();
        return;
      }

      this.log('Fetching posts', { page, category, offset });

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'count=exact'
        }
      });

      this.log('Posts response received', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Blog] API Error:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const contentRange = response.headers.get('content-range');
      const total = contentRange ? parseInt(contentRange.split('/')[1], 10) : data.length;
      this.totalPages = Math.max(1, Math.ceil(total / this.postsPerPage));
      this.posts = data || [];

      // Cache the result
      this.cache.set(cacheKey, { posts: this.posts, totalPages: this.totalPages });

      this.renderPosts();
      this.renderPagination();
    } catch (error) {
      console.error('[Blog] Error loading posts:', error);
      this.showError('Failed to load posts. Please try again later.');
    }
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

    this.log('Rendering posts', { count: this.posts.length });

    this.blogGrid.innerHTML = this.posts.map((post, index) => `
      <div class="blog-card" style="animation: fadeIn 0.5s ease ${index * 0.1}s both;">
        <div class="blog-image">
          <img src="${post.image_url || 'https://via.placeholder.com/400x250?text=No+Image'}" 
               alt="${post.title}" 
               onerror="this.src='https://via.placeholder.com/400x250?text=Image+Not+Found'" />
          ${post.category ? `<span class="blog-category">${post.category}</span>` : ''}
        </div>
        <div class="blog-content">
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <a href="#blog-detail-${post.id}" class="blog-read-more" onclick="blogSystemSupabase.viewPost(${post.id}); return false;">
            Read More →
          </a>
        </div>
      </div>
    `).join('');

    this.log('Posts rendered successfully');
  }

  renderPagination() {
    if (!this.paginationContainer) return;

    let html = '<div class="blog-pagination-controls" role="navigation" aria-label="Blog pagination" aria-live="polite" aria-atomic="true">';

    // Previous button
    if (this.currentPage > 1) {
      html += `<button class="blog-page-btn" onclick="blogSystemSupabase.loadPosts(${this.currentPage - 1}, ${this.currentCategory ? `'${this.currentCategory}'` : 'null'})">← Previous</button>`;
    } else {
      html += '<button class="blog-page-btn" disabled aria-disabled="true">← Previous</button>';
    }

    // Page info
    html += `<span class="blog-page-info">Page <span aria-live="polite">${this.currentPage}</span> of ${this.totalPages}</span>`;

    // Next button
    if (this.currentPage < this.totalPages) {
      html += `<button class="blog-page-btn" onclick="blogSystemSupabase.loadPosts(${this.currentPage + 1}, ${this.currentCategory ? `'${this.currentCategory}'` : 'null'})">Next →</button>`;
    } else {
      html += '<button class="blog-page-btn" disabled aria-disabled="true">Next →</button>';
    }

    html += '</div>';
    this.paginationContainer.innerHTML = html;
  }

  async loadCategories() {
    try {
      const categoryUrl = `${this.supabaseUrl}/rest/v1/posts?select=category&order=category.asc`;
      this.log('Fetching categories', { categoryUrl });

      const response = await fetch(categoryUrl, {
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      this.log('Categories response received', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Blog] Categories API Error:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this.log('Categories data received', { count: data.length, samples: data.slice(0, 3) });
      
      // Extract unique categories from all posts
      this.categories = Array.from(new Set(data.map(post => post.category).filter(Boolean))).sort();
      this.log('Extracted categories', { categories: this.categories });

      this.renderCategoryFilters();
    } catch (error) {
      console.error('[Blog] Error loading categories:', error);
    }
  }

  renderCategoryFilters() {
    if (!this.filterContainer) return;

    let html = '<div class="blog-filter-buttons">';
    html += '<button class="blog-filter-btn active" onclick="blogSystemSupabase.filterByCategory(null)">All Posts</button>';

    this.categories.forEach(category => {
      html += `<button class="blog-filter-btn" onclick="blogSystemSupabase.filterByCategory('${category}')">${category}</button>`;
    });

    html += '</div>';
    this.filterContainer.innerHTML = html;
  }

  filterByCategory(category) {
    this.currentCategory = category;
    // Reset to page 1 when category changes
    this.loadPosts(1, category);
    
    // Update active button state
    document.querySelectorAll('.blog-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
  }

  async viewPost(postId) {
    try {
      // Find post in already loaded posts
      const post = this.posts.find(p => p.id === postId);
      
      if (!post) {
        throw new Error('Post not found');
      }

      // Show post detail
      this.showPostDetail(post);
    } catch (error) {
      console.error('Error loading post:', error);
      alert('Failed to load post.');
    }
  }

  showPostDetail(post) {
    // Create modal content
    const modalHTML = `
      <div class="blog-modal-overlay" onclick="blogSystemSupabase.closePostDetail()">
        <div class="blog-modal" onclick="event.stopPropagation()">
          <button class="blog-modal-close" onclick="blogSystemSupabase.closePostDetail()">×</button>
          <div class="blog-modal-content">
            ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="blog-modal-image" />` : ''}
            <h2>${post.title}</h2>
            ${post.category ? `<span class="blog-modal-category">${post.category}</span>` : ''}
            <div class="blog-modal-meta">
              Published: ${new Date(post.published_at).toLocaleDateString()}
            </div>
            <div class="blog-modal-content-text">${post.content || post.excerpt}</div>
          </div>
        </div>
      </div>
    `;

    // Insert modal into page
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
    // Listen for category filter button clicks (handled by filterByCategory now)
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('blog-filter-btn')) {
        document.querySelectorAll('.blog-filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');
      }
    });

    // Search functionality
    if (this.searchInput) {
      let searchTimeout;
      this.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        // Filter posts locally based on search
        if (query.length === 0) {
          this.searchQuery = '';
          this.renderPosts();
        } else {
          this.searchQuery = query.toLowerCase();
          const filtered = this.posts.filter(post => 
            post.title.toLowerCase().includes(this.searchQuery) ||
            post.excerpt.toLowerCase().includes(this.searchQuery)
          );
          
          this.log('Search results', { query: this.searchQuery, count: filtered.length });
          
          if (filtered.length === 0) {
            this.blogGrid.innerHTML = `<div class="blog-empty-state"><p>No posts match "<strong>${this.searchQuery}</strong>"</p></div>`;
          } else {
            this.blogGrid.innerHTML = filtered.map((post, index) => `
              <div class="blog-card" style="animation: fadeIn 0.5s ease ${index * 0.1}s both;">
                <div class="blog-image">
                  <img src="${post.image_url || 'https://via.placeholder.com/400x250?text=No+Image'}" 
                       alt="${post.title}" 
                       onerror="this.src='https://via.placeholder.com/400x250?text=Image+Not+Found'" />
                  ${post.category ? `<span class="blog-category">${post.category}</span>` : ''}
                </div>
                <div class="blog-content">
                  <h3>${post.title}</h3>
                  <p>${post.excerpt}</p>
                  <a href="#blog-detail-${post.id}" class="blog-read-more" onclick="blogSystemSupabase.viewPost(${post.id}); return false;">
                    Read More →
                  </a>
                </div>
              </div>
            `).join('');
          }
        }
      });
    }
  }
}

// Initialize blog system when DOM is ready (if using Supabase version)
// document.addEventListener('DOMContentLoaded', () => {
//   if (document.querySelector('.blog-grid')) {
//     window.blogSystemSupabase = new BlogSystemSupabase({
//       supabaseUrl: 'https://your-project.supabase.co',
//       supabaseKey: 'your_anon_key_here',
//       edgeFunctionUrl: 'https://your-project.supabase.co/functions/v1/get-posts-v2',
//       postsPerPage: 10
//     });
//   }
// });