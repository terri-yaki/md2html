/**
 * MD2HTML Cloudflare Worker
 * Converts Markdown to HTML with security and feature parity to Flask version
 * Enhanced by terriyaki for Cloudflare deployment
 */

import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { markedHighlight } from 'marked-highlight';

// Configure marked with extensions
marked.use(gfmHeadingId());

// Highlight.js configuration for syntax highlighting
marked.use(markedHighlight({
  highlight(code, lang) {
    // Simple syntax highlighting without external dependencies
    // In production, you might want to use a more sophisticated highlighting library
    return `<code class="language-${lang || 'text'}">${escapeHtml(code)}</code>`;
  }
}));

// Security: HTML sanitization configuration
const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre',
    'a', 'ul', 'ol', 'li', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'del', 'ins', 'sub', 'sup', 'img', 'div', 'span', 'dl', 'dt', 'dd'
  ],
  allowedAttributes: {
    'a': ['href', 'title', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'pre': ['class'],
    'code': ['class'],
    'div': ['class', 'id'],
    'span': ['class'],
    'h1': ['id'], 'h2': ['id'], 'h3': ['id'], 'h4': ['id'], 'h5': ['id'], 'h6': ['id'],
    'th': ['align'], 'td': ['align']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    'a': function(tagName, attribs) {
      // Add rel="nofollow" to external links for security
      if (attribs.href && (attribs.href.startsWith('http://') || attribs.href.startsWith('https://'))) {
        attribs.rel = 'nofollow noopener noreferrer';
      }
      return {
        tagName: tagName,
        attribs: attribs
      };
    }
  }
};

/**
 * Convert Markdown to HTML with security and feature support
 */
function convertMarkdownToHtml(markdownText, options = {}) {
  const {
    github_flavored = true,
    syntax_highlighting = true,
    include_toc = false,
    bare_output = true
  } = options;

  try {
    // Configure marked options
    const markedOptions = {
      gfm: github_flavored,
      breaks: github_flavored,
      headerIds: include_toc,
      mangle: false,
      sanitize: false // We'll use sanitize-html instead for better control
    };

    // Convert markdown to HTML
    let html = marked(markdownText, markedOptions);

    // Generate Table of Contents if requested
    if (include_toc) {
      const tocHtml = generateTableOfContents(html);
      if (tocHtml) {
        html = tocHtml + html;
      }
    }

    // Sanitize HTML for security
    const cleanHtml = sanitizeHtml(html, sanitizeOptions);

    if (bare_output) {
      return cleanHtml;
    }

    // Add base styles if full page requested
    const baseStyles = `
      <style>
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 1em;
          line-height: 1.6;
        }
        h1, h2, h3, h4, h5, h6 {
          margin: 0.5em 0;
          color: #333;
        }
        p {
          margin: 0.5em 0;
        }
        pre {
          background-color: #f6f8fa;
          padding: 1em;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          overflow-x: auto;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        code {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          background: #f6f8fa;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 85%;
        }
        pre code {
          background: none;
          padding: 0;
          font-size: inherit;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        th, td {
          border: 1px solid #d0d7de;
          padding: 6px 13px;
          text-align: left;
        }
        th {
          background-color: #f6f8fa;
          font-weight: 600;
        }
        blockquote {
          border-left: 4px solid #d0d7de;
          margin: 1em 0;
          padding-left: 1em;
          color: #656d76;
        }
        hr {
          border: 0;
          border-top: 1px solid #d0d7de;
          margin: 24px 0;
        }
        a {
          color: #0969da;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .toc {
          background: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 6px;
          padding: 1em;
          margin: 1em 0;
        }
        .toc h4 {
          margin-top: 0;
        }
      </style>
    `;

    return `${baseStyles}\n${cleanHtml}`;

  } catch (error) {
    console.error('Error converting markdown:', error);
    return `<p style="color: red;">Error converting markdown: ${escapeHtml(error.message)}</p>`;
  }
}

/**
 * Generate Table of Contents from HTML headings
 */
function generateTableOfContents(html) {
  const headingRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[1-6]>/gi;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      id: match[2],
      title: match[3].replace(/<[^>]*>/g, '') // Strip HTML tags
    });
  }

  if (headings.length === 0) {
    return '';
  }

  let toc = '<div class="toc"><h4>Table of Contents</h4><ul>';
  let currentLevel = 1;

  for (const heading of headings) {
    if (heading.level > currentLevel) {
      toc += '<ul>'.repeat(heading.level - currentLevel);
    } else if (heading.level < currentLevel) {
      toc += '</ul>'.repeat(currentLevel - heading.level);
    }
    toc += `<li><a href="#${heading.id}">${heading.title}</a></li>`;
    currentLevel = heading.level;
  }

  toc += '</ul>'.repeat(currentLevel) + '</div>';
  return toc;
}

/**
 * Escape HTML characters
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * CORS headers for API responses
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle OPTIONS preflight requests
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders()
  });
}

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Health check endpoint
    if (path === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders()
        }
      });
    }

    // API endpoint for text conversion
    if (path === '/api' && request.method === 'POST') {
      try {
        const requestData = await request.json();
        
        if (!requestData || typeof requestData.markdown_text !== 'string') {
          return new Response(JSON.stringify({ error: 'Markdown text is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...getCorsHeaders()
            }
          });
        }

        const { markdown_text, include_toc = false, github_flavored = true, syntax_highlighting = true } = requestData;
        
        // Validate input size (prevent abuse)
        if (markdown_text.length > 1024 * 1024) { // 1MB limit
          return new Response(JSON.stringify({ error: 'Markdown text too large (max 1MB)' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...getCorsHeaders()
            }
          });
        }

        const html = convertMarkdownToHtml(markdown_text, {
          include_toc,
          github_flavored,
          syntax_highlighting,
          bare_output: true
        });

        return new Response(JSON.stringify({ html }), {
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders()
          }
        });

      } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Invalid request format' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders()
          }
        });
      }
    }

    // File upload endpoint (simplified - no actual file storage)
    if (path === '/api/file' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file || !file.name.match(/\.(md|markdown)$/i)) {
          return new Response(JSON.stringify({ error: 'Please upload a valid Markdown file (.md or .markdown)' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...getCorsHeaders()
            }
          });
        }

        const markdown_text = await file.text();
        
        // Validate file size
        if (markdown_text.length > 1024 * 1024) { // 1MB limit
          return new Response(JSON.stringify({ error: 'File too large (max 1MB)' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...getCorsHeaders()
            }
          });
        }

        const include_toc = formData.get('include_toc') === 'true';
        const github_flavored = formData.get('github_flavored') !== 'false';
        const syntax_highlighting = formData.get('syntax_highlighting') !== 'false';

        const html = convertMarkdownToHtml(markdown_text, {
          include_toc,
          github_flavored,
          syntax_highlighting,
          bare_output: true
        });

        // Generate a simple file ID for compatibility
        const file_id = Math.random().toString(36).substring(2, 15);

        return new Response(JSON.stringify({ html, file_id }), {
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders()
          }
        });

      } catch (error) {
        console.error('File API Error:', error);
        return new Response(JSON.stringify({ error: 'Error processing file upload' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders()
          }
        });
      }
    }

    // API documentation endpoint
    if (path === '/api/docs' && request.method === 'GET') {
      const docsHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MD2HTML API Documentation</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>MD2HTML API Documentation</h1>
          <h2>Convert Text</h2>
          <p><strong>POST</strong> <code>/api</code></p>
          <pre>
{
  "markdown_text": "# Hello World\\n\\nThis is **bold** text.",
  "include_toc": false,
  "github_flavored": true,
  "syntax_highlighting": true
}
          </pre>
          <h2>Upload File</h2>
          <p><strong>POST</strong> <code>/api/file</code></p>
          <p>Form data with file field and optional boolean parameters.</p>
          <h2>Health Check</h2>
          <p><strong>GET</strong> <code>/health</code></p>
        </body>
        </html>
      `;
      
      return new Response(docsHtml, {
        headers: {
          'Content-Type': 'text/html',
          ...getCorsHeaders()
        }
      });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders()
      }
    });
  }
};