# Turquoise Auto Centre Blog System - Setup & Usage Guide

## 📋 Overview

The blog system provides a complete solution for managing and displaying blog posts with:
- **Responsive frontend** with card-based layout and grid system
- **Node.js/Express backend** API with pagination and filtering
- **Supabase database** for post storage and management
- **Category-based filtering** for organized content discovery
- **Pagination system** for handling large post collections

## 🚀 Quick Start

### 1. Database Setup

#### Create Posts Table
Run this SQL in your Supabase database:

```sql
-- Create posts table for blog
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published_at DESC);
CREATE INDEX IF NOT EXISTS posts_category_idx ON posts (category);

-- Security policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public to read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage posts" ON posts FOR ALL USING (auth.role() = 'authenticated');
```

Or use the migration file:
```bash
# The migration is already created at: supabase/migrations/002_create_posts_table.sql
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
PORT=3001
NODE_ENV=development
```

Or copy from the example:
```bash
cp .env.example .env
```

### 4. Start the Backend Server

```bash
npm start
```

The API server will run on `http://localhost:3001`

### 5. Update Frontend Configuration

In `js/blog.js`, update the API URL if needed:

```javascript
window.blogSystem = new BlogSystem({
  apiUrl: 'http://localhost:3001/api', // Change this to your API URL
  postsPerPage: 10
});
```

## 📚 Adding Sample Posts

Add posts directly to your Supabase database:

```sql
INSERT INTO posts (title, excerpt, content, image_url, category, published_at) VALUES
(
  'Essential Car Maintenance Checklist for Every Driver',
  'Regular maintenance is key to keeping your vehicle running smoothly and safely. Learn about the critical checks every driver should perform regularly to extend vehicle life and prevent costly repairs.',
  'Full article content here...',
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=250&fit=crop',
  'maintenance',
  NOW()
),
(
  'Why Proper Tyre Maintenance Saves Lives',
  'Tyres are your vehicle's only contact with the road. Discover why regular alignment, balancing, and tread checks are crucial for safety, fuel efficiency, and handling performance.',
  'Full article content here...',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
  'tyres',
  NOW()
),
(
  'Understanding Modern Engine Diagnostics',
  'Modern vehicles are equipped with sophisticated onboard computers. Learn how diagnostic scans help identify issues early and prevent major mechanical failures.',
  'Full article content here...',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=250&fit=crop',
  'diagnostics',
  NOW()
);
```

## 🔌 API Endpoints

### Get Posts (with Pagination & Filters)
```
GET /api/posts?page=1&limit=10&category=maintenance

Response:
{
  "posts": [
    {
      "id": 1,
      "title": "Post Title",
      "excerpt": "Post excerpt...",
      "content": "Full content...",
      "image_url": "https://...",
      "category": "maintenance",
      "published_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Query Parameters:**
- `page` (number): Page number, starting from 1 (default: 1)
- `limit` (number): Posts per page, max 100 (default: 10)
- `category` (string, optional): Filter by category

### Get Single Post
```
GET /api/posts/:id

Response:
{
  "post": {
    "id": 1,
    "title": "Post Title",
    "excerpt": "Post excerpt...",
    "content": "Full content...",
    "image_url": "https://...",
    "category": "maintenance",
    "published_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get Categories
```
GET /api/categories

Response:
{
  "categories": ["maintenance", "tyres", "diagnostics", "repair"]
}
```

### Health Check
```
GET /health

Response:
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🎨 Frontend Components

### Blog Section HTML
Located in `index.html`, the blog section includes:
- Category filters
- Blog posts grid
- Pagination controls
- Modal for viewing full posts

### JavaScript Features (blog.js)

#### BlogSystem Class
Main JavaScript class that handles all blog functionality:

```javascript
// Initialize blog system
const blogSystem = new BlogSystem({
  apiUrl: 'http://localhost:3001/api',
  postsPerPage: 10
});

// Load posts
blogSystem.loadPosts(page, category);

// View individual post
blogSystem.viewPost(postId);

// Close post modal
blogSystem.closePostDetail();
```

#### Key Methods
- `loadPosts(page, category)` - Fetch and render posts
- `loadCategories()` - Fetch available categories
- `renderPosts()` - Render blog cards
- `renderPagination()` - Render pagination controls
- `renderCategoryFilters()` - Render category filter buttons
- `viewPost(postId)` - Show post detail modal
- `closePostDetail()` - Close post modal

### CSS Styling (styles.css)

Blog-related CSS classes:
- `.blog-grid` - Grid container for posts
- `.blog-card` - Individual post card
- `.blog-image` - Post image container
- `.blog-content` - Post text content
- `.blog-read-more` - Read more link
- `.blog-filters` - Category filter container
- `.blog-filter-btn` - Individual filter button
- `.blog-pagination` - Pagination container
- `.blog-page-btn` - Pagination button
- `.blog-modal-overlay` - Modal background
- `.blog-modal` - Modal content box
- `.blog-category` - Category badge on post image

## 🔧 Customization

### Change Posts Per Page
In `js/blog.js`:
```javascript
new BlogSystem({
  postsPerPage: 15  // Default is 10
});
```

### Customize Category Filter Display
In `js/blog.js`, modify `renderCategoryFilters()`:
```javascript
renderCategoryFilters() {
  // Add custom category label formatting
  const categoryLabels = {
    'maintenance': '🔧 Maintenance',
    'tyres': '🛞 Tyres',
    // ...
  };
  // Use categoryLabels in rendering
}
```

### Change API Endpoint
In `index.html` blog.js script tag or in `js/blog.js`:
```javascript
window.blogSystem = new BlogSystem({
  apiUrl: 'https://your-production-api.com/api',
  postsPerPage: 10
});
```

## 🚢 Deployment

### Frontend (HTML/CSS/JS)
- Deploy the entire project to any static hosting (Netlify, Vercel, GitHub Pages)
- Update the API URL in `blog.js` to point to your production backend

### Backend (Node.js API)
Deploy to:
- **Heroku** - Simple git-based deployment
- **Railway** - Modern deployment platform
- **Vercel** - Full-stack hosting
- **Digital Ocean** - VPS hosting
- **AWS** - EC2, App Runner, or Elastic Beanstalk

#### Heroku Deployment Example
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key

# Deploy
git push heroku main
```

### Production Considerations
- Use environment variables for all secrets
- Enable HTTPS only
- Set up proper CORS for frontend domain
- Add rate limiting to API endpoints
- Enable database backups
- Use CDN for static assets

## 📱 Responsive Breakpoints

The blog system is fully responsive:
- **Desktop** (1024px+): 3-column grid
- **Tablet** (768px - 1023px): 2-column grid
- **Mobile** (< 768px): 1-column grid

## 🔐 Security

### Database Security
- Row Level Security (RLS) enabled
- Public read access for posts
- Authenticated users only for writing

### API Security
- CORS configured
- Input validation on all endpoints
- Error handling without exposing sensitive info

### Frontend Security
- No sensitive data stored in client-side code
- API credentials stored server-side only

## 🐛 Troubleshooting

### Posts Not Loading
1. Check API server is running: `http://localhost:3001/health`
2. Verify Supabase credentials in `.env`
3. Check browser console for errors
4. Verify posts table exists and has data

### Categories Not Showing
1. Ensure posts have categories assigned
2. Check that categories are not null in database
3. Verify GET /api/categories endpoint returns data

### Images Not Displaying
1. Verify image URLs are accessible and HTTPS
2. Check CORS settings if using external image service
3. Ensure image_url field is populated in database

### API Connection Errors
1. Check API server is running
2. Verify API URL is correct in blog.js
3. Check CORS settings on backend
4. Verify network connectivity

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [REST API Best Practices](https://restfulapi.net/)

## 📄 License

MIT License - See LICENSE file for details