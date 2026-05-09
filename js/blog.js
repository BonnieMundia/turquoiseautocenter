// ══════════════════════════════════════════
// BLOG FUNCTIONALITY
// ══════════════════════════════════════════

class BlogSystem {
  constructor(config = {}) {
    // API configuration
    this.apiUrl = config.apiUrl || 'https://usencbuaumsgmitvlznt.supabase.co/functions/v1/get-posts-v2';
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
    
    // Blog states
    this.currentPage = 1;
    this.currentCategory = null;
    this.postsPerPage = config.postsPerPage || 10;
    this.posts = [];
    this.totalPages = 0;
    this.categories = [];
    
    // DOM elements
    this.blogGrid = document.querySelector('.blog-grid');
    this.paginationContainer = document.querySelector('.blog-pagination');
    this.filterContainer = document.querySelector('.blog-filters');
    
    this.init();
  }

  async init() {
    try {
      // Load categories
      await this.loadCategories();
      
      // Load initial posts
      await this.loadPosts(1);
      
      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Blog system initialization error:', error);
    }
  }

  async loadPosts(page = 1, category = null) {
    try {
      this.currentPage = page;
      this.currentCategory = category;

      // Build API URL with query parameters
      let url = `${this.apiUrl}/posts?page=${page}&limit=${this.postsPerPage}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }

      // Fetch posts from API
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      this.posts = data.posts || [];
      this.totalPages = data.pagination.totalPages || 1;

      // Render posts
      this.renderPosts();

      // Render pagination
      this.renderPagination();
    } catch (error) {
      console.error('Error loading posts:', error);
      if (this.blogGrid) {
        this.blogGrid.innerHTML = '<p class="blog-error">Failed to load posts. Please try again later.</p>';
      }
    }
  }

  renderPosts() {
    if (!this.blogGrid) return;

    if (this.posts.length === 0) {
      this.blogGrid.innerHTML = '<p class="blog-no-posts">No posts available.</p>';
      return;
    }

    this.blogGrid.innerHTML = this.posts.map(post => `
      <div class="blog-card reveal reveal-up">
        <div class="blog-image">
          <img src="${post.image_url || 'https://via.placeholder.com/400x250?text=No+Image'}" 
               alt="${post.title}" 
               onerror="this.src='https://via.placeholder.com/400x250?text=Image+Not+Found'" />
          ${post.category ? `<span class="blog-category">${post.category}</span>` : ''}
        </div>
        <div class="blog-content">
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <a href="#blog-detail-${post.id}" class="blog-read-more" onclick="blogSystem.viewPost(${post.id}); return false;">
            Read More →
          </a>
        </div>
      </div>
    `).join('');
  }

  renderPagination() {
    if (!this.paginationContainer) return;

    let html = '<div class="blog-pagination-controls">';

    // Previous button
    if (this.currentPage > 1) {
      html += `<button class="blog-page-btn" onclick="blogSystem.loadPosts(${this.currentPage - 1}, ${this.currentCategory ? `'${this.currentCategory}'` : 'null'})">← Previous</button>`;
    } else {
      html += '<button class="blog-page-btn" disabled>← Previous</button>';
    }

    // Page info
    html += `<span class="blog-page-info">Page ${this.currentPage} of ${this.totalPages}</span>`;

    // Next button
    if (this.currentPage < this.totalPages) {
      html += `<button class="blog-page-btn" onclick="blogSystem.loadPosts(${this.currentPage + 1}, ${this.currentCategory ? `'${this.currentCategory}'` : 'null'})">Next →</button>`;
    } else {
      html += '<button class="blog-page-btn" disabled>Next →</button>';
    }

    html += '</div>';
    this.paginationContainer.innerHTML = html;
  }

  async loadCategories() {
    try {
      const response = await fetch(`${this.apiUrl}/categories`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      this.categories = data.categories || [];

      // Render category filters
      this.renderCategoryFilters();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  renderCategoryFilters() {
    if (!this.filterContainer) return;

    let html = '<div class="blog-filter-buttons">';
    html += '<button class="blog-filter-btn active" onclick="blogSystem.loadPosts(1, null)">All Posts</button>';

    this.categories.forEach(category => {
      html += `<button class="blog-filter-btn" onclick="blogSystem.loadPosts(1, '${category}')">${category}</button>`;
    });

    html += '</div>';
    this.filterContainer.innerHTML = html;
  }

  async viewPost(postId) {
    try {
      const response = await fetch(`${this.apiUrl}/posts/${postId}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const post = data.post;

      // Create modal or navigate to detail page
      this.showPostDetail(post);
    } catch (error) {
      console.error('Error loading post:', error);
      alert('Failed to load post.');
    }
  }

  showPostDetail(post) {
    // Create modal content
    const modalHTML = `
      <div class="blog-modal-overlay" onclick="blogSystem.closePostDetail()">
        <div class="blog-modal" onclick="event.stopPropagation()">
          <button class="blog-modal-close" onclick="blogSystem.closePostDetail()">×</button>
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
    // Listen for category filter button clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('blog-filter-btn')) {
        document.querySelectorAll('.blog-filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');
      }
    });
  }
}

// Initialize blog system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if blog grid exists
  if (document.querySelector('.blog-grid')) {
    window.blogSystem = new BlogSystem({
      apiUrl: 'http://localhost:3001/api', // Update to your API URL
      postsPerPage: 10
    });
  }
});