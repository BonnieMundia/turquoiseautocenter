# Blog System Deployment Guide

This guide covers deployment strategies for the Turquoise Auto Centre blog system with two backend options.

## 📊 Architecture Overview

### Option 1: Node.js API Server
```
Frontend (HTML/CSS/JS)
         ↓
   blog.js (JavaScript)
         ↓
  Node.js Express API
   (server.js)
         ↓
  Supabase Database
  (PostgreSQL)
```

### Option 2: Supabase Edge Functions
```
Frontend (HTML/CSS/JS)
         ↓
blog-supabase.js (JavaScript)
         ↓
Supabase Edge Functions
  (Deno Runtime)
         ↓
Supabase Database
  (PostgreSQL)
```

## 🚀 Deployment Options

### Option 1A: Full-Stack on Heroku (Node.js)

#### Prerequisites
- Heroku account
- Git installed
- Node.js and npm

#### Step 1: Create Heroku App
```bash
heroku login
heroku create turquoise-auto-blog
```

#### Step 2: Add Buildpack
```bash
heroku buildpacks:add heroku/nodejs
```

#### Step 3: Set Environment Variables
```bash
heroku config:set SUPABASE_URL=https://your-project.supabase.co
heroku config:set SUPABASE_ANON_KEY=your_anon_key_here
heroku config:set PORT=3001
```

#### Step 4: Deploy
```bash
git push heroku main
```

#### Step 5: View Logs
```bash
heroku logs --tail
```

#### Verify Deployment
```bash
heroku open
# Should show: {"status":"OK",...}
```

### Option 1B: Node.js on Railway

#### Step 1: Connect Repository
1. Go to [railway.app](https://railway.app)
2. Click "Deploy on Railway" or create new project
3. Select GitHub repository

#### Step 2: Add Environment Variables
In Railway dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PORT` (automatic, usually 3001)

#### Step 3: Deploy
Railway auto-deploys on git push to main branch

### Option 1C: Node.js on DigitalOcean App Platform

#### Step 1: Create DigitalOcean App
```bash
doctl apps create \
  --spec app.yaml \
  --region nyc
```

#### app.yaml Configuration
```yaml
name: turquoise-auto-blog
services:
- name: api
  github:
    repo: yourusername/turquoise-auto
    branch: main
  build_command: npm ci
  run_command: npm start
  envs:
  - key: SUPABASE_URL
    scope: RUN_AND_BUILD_TIME
    value: ${SUPABASE_URL}
  - key: SUPABASE_ANON_KEY
    scope: RUN_AND_BUILD_TIME
    value: ${SUPABASE_ANON_KEY}
```

#### Step 2: Set Secrets
```bash
doctl apps update <app-id> \
  --spec app.yaml \
  --set SUPABASE_URL=<url> \
  --set SUPABASE_ANON_KEY=<key>
```

### Option 2: Supabase Edge Functions (Recommended for Simplicity)

The blog system is already set up to use Supabase Edge Functions. Simply deploy your functions to Supabase:

#### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

#### Step 2: Login to Supabase
```bash
supabase login
```

#### Step 3: Link Project
```bash
supabase link --project-ref your-project-id
```

#### Step 4: Deploy Functions
```bash
supabase functions deploy get-posts-v2
```

#### Step 5: Update Frontend
In `index.html`, use `blog-supabase.js` instead of `blog.js`:

```html
<script src="js/blog-supabase.js"></script>
```

Initialize in a script tag:
```html
<script>
document.addEventListener('DOMContentLoaded', () => {
  window.blogSystemSupabase = new BlogSystemSupabase({
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseKey: 'your_anon_key_here',
    edgeFunctionUrl: 'https://your-project.supabase.co/functions/v1/get-posts-v2',
    postsPerPage: 10
  });
});
</script>
```

## 🌐 Frontend Deployment

### Option A: Netlify

#### Step 1: Connect GitHub
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select your repository

#### Step 2: Configure Build
- Build command: (leave empty or `npm run build` if using build tool)
- Publish directory: `.` (root directory)
- Environment variables: (none needed for frontend)

#### Step 3: Deploy
Netlify auto-deploys on git push

### Option B: Vercel

#### Step 1: Import Project
```bash
vercel
```

#### Step 2: Follow Prompts
- Select project root: `.`
- Accept build settings
- Override with: (none needed)

#### Step 3: Set Environment Variables
Go to project settings → Environment Variables (usually not needed for frontend)

#### Step 4: Deploy
```bash
vercel --prod
```

### Option C: GitHub Pages

#### Step 1: Create Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/turquoise-auto.git
git push -u origin main
```

#### Step 2: Enable GitHub Pages
In repository settings:
- Source: `main` branch
- Folder: `/ (root)`

#### Step 3: Update API URL
In `js/blog.js`:
```javascript
window.blogSystem = new BlogSystem({
  apiUrl: 'https://your-api-domain.com/api',
  postsPerPage: 10
});
```

Or use Supabase Edge Functions (no separate backend needed)

## 📦 Production Checklist

### Backend Setup
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] CORS settings verified
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error logging set up
- [ ] Database backups enabled

### Frontend Setup
- [ ] API URLs updated to production
- [ ] Environment-specific configuration
- [ ] Secrets not hardcoded
- [ ] Assets optimized
- [ ] CDN configured
- [ ] DNS configured
- [ ] SSL certificate installed

### Security
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] SQL injection protection (Supabase handles)
- [ ] XSS prevention (escaping in place)
- [ ] CSRF tokens if form-based
- [ ] Rate limiting enabled
- [ ] Secrets rotated
- [ ] Monitoring and alerting enabled

## 🔍 Monitoring

### Backend Monitoring (Node.js)
```bash
# View logs
heroku logs --tail

# CPU/Memory usage
heroku ps

# Database queries
# Monitor via Supabase dashboard
```

### Error Tracking
Use services like:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **New Relic** - APM

### Setting Up Sentry
```javascript
// In server.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

## 📈 Performance Optimization

### Backend
```javascript
// Add caching headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});

// Add compression
const compression = require('compression');
app.use(compression());
```

### Frontend
- Lazy load images
- Minify CSS/JS
- Use CDN for static assets
- Enable browser caching
- Optimize images

## 🚨 Common Issues

### API Connection Failed
1. Check API server is running
2. Verify API URL is correct
3. Check CORS settings
4. Verify environment variables

### Database Connection Failed
1. Verify Supabase URL and key
2. Check database is online
3. Verify RLS policies
4. Check network connectivity

### Posts Not Displaying
1. Verify posts exist in database
2. Check API response in browser DevTools
3. Verify pagination parameters
4. Check for JavaScript errors

### CORS Errors
1. Update CORS headers in server.js
2. Add frontend domain to allowed origins
3. Verify preflight requests work

## 📞 Support

For issues:
1. Check logs: `heroku logs --tail`
2. Review browser console
3. Check Supabase dashboard
4. Enable debug mode in blog.js

## 🎯 Next Steps

1. **Set up monitoring** - Implement error tracking
2. **Add caching** - Reduce API calls
3. **Optimize images** - Reduce file sizes
4. **Add analytics** - Track user behavior
5. **Implement search** - Allow post search
6. **Add comments** - Enable engagement

## 📚 Resources

- [Heroku Deployment Guide](https://devcenter.heroku.com/articles/deploying-nodejs)
- [Railway Documentation](https://railway.app/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Netlify Deployment](https://docs.netlify.com/)
- [Vercel Deployment](https://vercel.com/docs)