# MD2HTML - Enhanced Markdown to HTML Converter

## 🚀 Features Enhanced by terriyaki

### 🔒 Security & Safety
- **XSS Protection**: HTML sanitization with bleach to prevent cross-site scripting
- **HTTPS Enforcement**: Automatic HTTPS redirect in production (Cloudflare-ready)
- **Content Security Policy**: Comprehensive CSP headers for enhanced security
- **Safe Link Handling**: Automatic `rel="nofollow"` for external links

### 📱 User Experience
- **Instant Preview Toggle**: Enable/disable real-time markdown conversion
- **View Mode Switching**: 
  - Split View (default)
  - Markdown Only 
  - Preview Only
- **Enhanced Debouncing**: Faster response (300ms) for real-time editing
- **Perfect Conversion**: Comprehensive markdown support with safety

### ⚡ Performance & Deployment
- **Cloudflare Ready**: Optimized for Cloudflare Workers/Pages deployment
- **Production HTTPS**: Automatic security headers and HTTPS enforcement
- **Error Handling**: Graceful fallbacks for missing extensions

## 🛠 Installation

### Local Development
```bash
git clone https://github.com/terri-yaki/md2html.git
cd md2html
pip install -r requirements.txt
FLASK_ENV=development FLASK_APP=main.py flask run
```

### Cloudflare Deployment
```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy to Cloudflare Pages
wrangler pages publish . --project-name md2html

# Or deploy to Cloudflare Workers (for API-only)
wrangler deploy
```

## 📖 API Documentation

### Convert Text
```bash
curl -X POST "https://your-domain.com/api" \
  -H "Content-Type: application/json" \
  -d '{
    "markdown_text": "# Hello World\n\nThis is **bold** text.",
    "github_flavored": true,
    "syntax_highlighting": true,
    "include_toc": false
  }'
```

### Upload File
```bash
curl -X POST "https://your-domain.com/api/file" \
  -F "file=@document.md" \
  -F "github_flavored=true" \
  -F "syntax_highlighting=true"
```

## 🔧 Configuration

### Environment Variables
- `FLASK_ENV`: Set to `production` for HTTPS enforcement
- `FLASK_DEBUG`: Set to `false` in production

### Security Headers
The application automatically configures:
- Strict Transport Security (HSTS)
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options

## 🎨 View Modes

1. **Split View**: Side-by-side markdown input and HTML preview
2. **Markdown Only**: Focus on writing without distractions
3. **Preview Only**: Full-screen preview for presentation

## ⚡ Instant Preview

Toggle real-time conversion with the "Instant Preview" checkbox:
- ✅ **Enabled**: Live updates as you type (300ms debounce)
- ❌ **Disabled**: Manual conversion with "Convert" button

## 🛡 Safety Features

- **HTML Sanitization**: Removes potentially dangerous HTML/JavaScript
- **Link Safety**: External links get `rel="nofollow"` automatically
- **XSS Prevention**: Comprehensive input validation and output escaping
- **CSP Protection**: Content Security Policy prevents code injection

## 📝 Supported Markdown

- GitHub Flavored Markdown
- Syntax highlighting for code blocks
- Tables, lists, and task lists
- Footnotes and definitions
- Admonitions and blockquotes
- Math expressions (when available)
- Table of contents generation

## 🚀 Deployment Notes

### Cloudflare Pages
1. Connect your GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set output directory: `.`
4. Deploy!

### Cloudflare Workers
1. Use `wrangler.toml` configuration
2. Deploy with `wrangler deploy`
3. Configure custom domain

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Credits

Enhanced by **terriyaki** with focus on security, user experience, and perfect markdown conversion.

---

© 2025 @terri-yaki - Enhanced MD2HTML with safety and instant preview features.