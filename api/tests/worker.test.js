/**
 * Tests for MD2HTML Cloudflare Worker
 * Run with: npm test
 */

// Mock Cloudflare Worker environment
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map();
    
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
  }
  
  async json() {
    return JSON.parse(this.body);
  }
  
  async text() {
    return this.body;
  }
};

global.Request = class Request {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new Map();
    this.body = init.body;
    
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
  }
  
  async json() {
    return JSON.parse(this.body);
  }
  
  async text() {
    return this.body;
  }
};

global.URL = require('url').URL;

describe('MD2HTML Worker', () => {
  let worker;
  
  beforeAll(async () => {
    // Import the worker module
    worker = await import('../worker.js');
  });

  describe('API Endpoints', () => {
    test('GET /health returns status ok', async () => {
      const request = new Request('https://worker.dev/health', {
        method: 'GET'
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
    });

    test('POST /api converts markdown to HTML', async () => {
      const markdown = '# Hello World\n\nThis is **bold** text.';
      const request = new Request('https://worker.dev/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown_text: markdown,
          github_flavored: true,
          syntax_highlighting: true,
          include_toc: false
        })
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.html).toContain('<h1>Hello World</h1>');
      expect(data.html).toContain('<strong>bold</strong>');
    });

    test('POST /api requires markdown_text field', async () => {
      const request = new Request('https://worker.dev/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('Markdown text is required');
    });

    test('POST /api handles large input', async () => {
      const largeMarkdown = '# Large Text\n' + 'x'.repeat(2 * 1024 * 1024); // 2MB
      const request = new Request('https://worker.dev/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown_text: largeMarkdown
        })
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('too large');
    });

    test('OPTIONS request returns CORS headers', async () => {
      const request = new Request('https://worker.dev/api', {
        method: 'OPTIONS'
      });
      
      const response = await worker.default.fetch(request, {}, {});
      
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    test('GET /api/docs returns documentation', async () => {
      const request = new Request('https://worker.dev/api/docs', {
        method: 'GET'
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const html = await response.text();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
      expect(html).toContain('MD2HTML API Documentation');
    });

    test('Unknown route returns 404', async () => {
      const request = new Request('https://worker.dev/unknown', {
        method: 'GET'
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Not Found');
    });
  });

  describe('Markdown Conversion Features', () => {
    test('Converts GitHub Flavored Markdown', async () => {
      const markdown = `
# GitHub Features

## Task Lists
- [x] Completed task
- [ ] Incomplete task

## Tables
| Name | Value |
|------|-------|
| Test | 123   |

## Strikethrough
~~deleted text~~
      `;
      
      const request = new Request('https://worker.dev/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown_text: markdown,
          github_flavored: true
        })
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.html).toContain('<table>');
      expect(data.html).toContain('checkbox');
      expect(data.html).toContain('<del>deleted text</del>');
    });

    test('Generates table of contents', async () => {
      const markdown = `
# Main Title
## Section 1
### Subsection
## Section 2
      `;
      
      const request = new Request('https://worker.dev/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown_text: markdown,
          include_toc: true
        })
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.html).toContain('Table of Contents');
      expect(data.html).toContain('toc');
    });

    test('Handles code blocks with syntax highlighting', async () => {
      const markdown = `
\`\`\`javascript
function test() {
  console.log("Hello World");
}
\`\`\`
      `;
      
      const request = new Request('https://worker.dev/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown_text: markdown,
          syntax_highlighting: true
        })
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.html).toContain('<code class="language-javascript">');
      expect(data.html).toContain('function test()');
    });
  });

  describe('Security Features', () => {
    test('Sanitizes malicious HTML input', async () => {
      const markdown = `
# Test
<script>alert('xss')</script>
<img src="x" onerror="alert('xss')">
[Link](javascript:alert('xss'))
      `;
      
      const request = new Request('https://worker.dev/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown_text: markdown
        })
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.html).not.toContain('<script>');
      expect(data.html).not.toContain('onerror');
      expect(data.html).not.toContain('javascript:');
    });

    test('Adds security attributes to external links', async () => {
      const markdown = '[External Link](https://example.com)';
      
      const request = new Request('https://worker.dev/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown_text: markdown
        })
      });
      
      const response = await worker.default.fetch(request, {}, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.html).toContain('rel="nofollow noopener noreferrer"');
    });
  });
});