# MD2HTML Deployment Guide

## Overview

MD2HTML has been transformed from a Flask-based application to a Cloudflare-compatible framework with the following architecture:

- **Backend**: Cloudflare Workers (JavaScript/TypeScript)
- **Frontend**: Cloudflare Pages (Static HTML/CSS/JS)
- **Build Tool**: Vite for frontend bundling

## Directory Structure

```
/md2html
├── api/                    # Cloudflare Workers backend
│   ├── worker.js          # Main Worker script
│   ├── package.json       # Worker dependencies
│   └── wrangler.toml      # Worker configuration
├── frontend/              # Cloudflare Pages frontend
│   ├── index.html         # Main HTML file
│   ├── main.js           # Frontend JavaScript
│   ├── styles.css        # Custom CSS
│   ├── highlight.css     # Syntax highlighting styles
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite build configuration
├── legacy/               # Original Flask files (preserved)
│   ├── main.py
│   ├── templates/
│   └── static/
└── README.md
```

## Prerequisites

1. **Node.js** (v18 or later)
2. **Wrangler CLI** (Cloudflare Workers CLI)
3. **Cloudflare account** with Workers and Pages enabled

### Installation

```bash
# Install Node.js dependencies
npm install -g wrangler

# Install API dependencies
cd api
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

## Deployment Instructions

### 1. Deploy Cloudflare Workers API

```bash
cd api

# Login to Cloudflare (if not already logged in)
wrangler login

# Deploy to production
wrangler deploy

# Or deploy to staging
wrangler deploy --env staging
```

The API will be available at: `https://md2html-api.<your-subdomain>.workers.dev`

### 2. Deploy Cloudflare Pages Frontend

#### Option A: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to Cloudflare Dashboard → Pages
3. Create a new project
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/` (or leave empty)

#### Option B: Direct Upload

```bash
cd frontend

# Build the frontend
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name md2html-frontend
```

### 3. Configure API Endpoint

After deploying both services:

1. Update `frontend/main.js`:
   ```javascript
   const CONFIG = {
       API_BASE_URL: 'https://md2html-api.<your-subdomain>.workers.dev',
       // ... other config
   };
   ```

2. Redeploy the frontend with the updated API URL.

## Environment Configuration

### Worker Environment Variables

Set these in your `api/wrangler.toml` or Cloudflare Dashboard:

```toml
[vars]
ENVIRONMENT = "production"
MAX_FILE_SIZE = "1048576"  # 1MB in bytes
```

### Custom Domain Setup

#### For the API (Workers):
1. Go to Workers → md2html-api → Triggers
2. Add custom domain: `api.yourdomain.com`

#### For the Frontend (Pages):
1. Go to Pages → md2html-frontend → Custom domains
2. Add custom domain: `yourdomain.com`

## API Endpoints

The API maintains compatibility with the original Flask version:

### Convert Text
```http
POST /api
Content-Type: application/json

{
  "markdown_text": "# Hello World\n\nThis is **bold** text.",
  "include_toc": false,
  "github_flavored": true,
  "syntax_highlighting": true
}
```

### Upload File
```http
POST /api/file
Content-Type: multipart/form-data

file: [markdown file]
include_toc: true/false
github_flavored: true/false
syntax_highlighting: true/false
```

### Health Check
```http
GET /health
```

### API Documentation
```http
GET /api/docs
```

## Development

### Local Development

#### Backend (API)
```bash
cd api
npm run dev
# API available at http://localhost:8787
```

#### Frontend
```bash
cd frontend
npm run dev
# Frontend available at http://localhost:3000
```

Make sure to update the API_BASE_URL in `frontend/main.js` to point to your local API during development:

```javascript
API_BASE_URL: 'http://localhost:8787'
```

## Security Features

The application maintains all security features from the original Flask version:

- **HTML Sanitization**: Uses `sanitize-html` library
- **XSS Prevention**: Comprehensive input validation and output escaping
- **CORS Protection**: Configurable CORS headers
- **Rate Limiting**: Inherits Cloudflare's built-in rate limiting
- **File Size Limits**: 1MB maximum file/input size
- **Safe Link Handling**: External links get `rel="nofollow noopener noreferrer"`

## Performance Optimizations

- **Edge Computing**: Runs on Cloudflare's global network
- **Minimal Dependencies**: Optimized bundle sizes
- **Caching**: Leverages Cloudflare's caching layer
- **CDN**: Static assets served from CDN

## Monitoring and Logging

- **Worker Analytics**: Available in Cloudflare Dashboard
- **Pages Analytics**: Built-in web analytics
- **Error Tracking**: Console logs available in Wrangler and Dashboard
- **Custom Metrics**: Can be added using Cloudflare Analytics Engine

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure API includes proper CORS headers
2. **Build Failures**: Check Node.js version and dependencies
3. **API Timeouts**: Workers have a 30-second CPU time limit
4. **Large Files**: Respect the 1MB file size limit

### Debug Commands

```bash
# Check Worker logs
wrangler tail

# Test API locally
curl -X POST http://localhost:8787/api \
  -H "Content-Type: application/json" \
  -d '{"markdown_text": "# Test"}'

# Build frontend in development mode
cd frontend && npm run build -- --mode development
```

## Migration Notes

The new Cloudflare-compatible version maintains:
- ✅ All original API endpoints and functionality
- ✅ Security features and HTML sanitization
- ✅ GitHub Flavored Markdown support
- ✅ Syntax highlighting
- ✅ Table of contents generation
- ✅ File upload capabilities
- ✅ Enhanced UI with view modes and instant preview

## Cost Considerations

- **Workers**: 100,000 requests/day free tier
- **Pages**: Unlimited static requests on free tier
- **Bandwidth**: Generous free tier limits
- **Custom Domains**: Free with Cloudflare

## Support and Maintenance

For issues and updates:
1. Check Cloudflare status page
2. Review Worker logs in dashboard
3. Monitor Pages deployment logs
4. Update dependencies regularly

---

**Enhanced by terriyaki for Cloudflare deployment** 🚀