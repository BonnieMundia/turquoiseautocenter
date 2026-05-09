# Turquoise Auto Centre Blog System

A responsive blog section with Node.js backend and Supabase integration.

## Features

### Frontend
- Responsive blog section with card layout
- Grid system for multiple posts
- Image, title, excerpt, and "Read More" button for each post
- Integrated into existing Turquoise Auto Centre website

### Backend
- Node.js/Express API server
- Supabase database integration
- Pagination support
- Category filtering
- RESTful endpoints

## Setup

### Prerequisites
- Node.js (v14 or higher)
- Supabase account and project

### Installation.

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

3. Run database migrations:
Apply the SQL migrations in `supabase/migrations/` to your Supabase database.

4. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Get Posts
```
GET /api/posts?page=1&limit=10&category=maintenance
```
Returns paginated list of posts with optional category filter.

### Get Single Post
```
GET /api/posts/:id
```
Returns a single post by ID.

### Get Categories
```
GET /api/categories
```
Returns list of available categories.

### Health Check
```
GET /health
```
Returns server status.

## Database Schema

### Posts Table
- `id` (SERIAL PRIMARY KEY)
- `title` (TEXT)
- `excerpt` (TEXT)
- `content` (TEXT)
- `image_url` (TEXT)
- `category` (TEXT)
- `published_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Usage

### Frontend Integration
The blog section is already integrated into `index.html`. To make it dynamic:

1. Update the blog section in `index.html` to fetch posts from the API
2. Add JavaScript to populate the blog cards with real data

### Adding Posts
Posts can be added directly to the Supabase database or through a CMS interface.

## Development

For development with auto-restart:
```bash
npm run dev
```

## Deployment

This can be deployed to any Node.js hosting service (Heroku, Vercel, Railway, etc.) with the appropriate environment variables.