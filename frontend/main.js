/**
 * MD2HTML Frontend JavaScript
 * Cloudflare Pages compatible version
 * Enhanced by terriyaki for production use
 */

// Configuration
const CONFIG = {
    // In production, this would be your Cloudflare Worker domain
    API_BASE_URL: 'http://localhost:8787', // Updated for local testing
    DEBOUNCE_DELAY: 300,
    MAX_FILE_SIZE: 1024 * 1024 // 1MB
};

// State management
const state = {
    currentHtml: '',
    fileHtml: '',
    instantPreviewEnabled: true
};

// DOM elements
const elements = {
    markdownInput: null,
    htmlPreview: null,
    convertBtn: null,
    copyHtmlBtn: null,
    clearBtn: null,
    fileUploadForm: null,
    fileResult: null,
    fileHtmlPreview: null,
    copyFileHtmlBtn: null,
    downloadHtmlBtn: null,
    viewModeSelect: null,
    instantPreviewToggle: null,
    markdownPanel: null,
    previewPanel: null,
    editorContainer: null,
    apiDocsLink: null
};

/**
 * Initialize DOM elements
 */
function initElements() {
    elements.markdownInput = document.getElementById('markdown-input');
    elements.htmlPreview = document.getElementById('html-preview');
    elements.convertBtn = document.getElementById('convert-btn');
    elements.copyHtmlBtn = document.getElementById('copy-html-btn');
    elements.clearBtn = document.getElementById('clear-btn');
    elements.fileUploadForm = document.getElementById('file-upload-form');
    elements.fileResult = document.getElementById('file-result');
    elements.fileHtmlPreview = document.getElementById('file-html-preview');
    elements.copyFileHtmlBtn = document.getElementById('copy-file-html-btn');
    elements.downloadHtmlBtn = document.getElementById('download-html-btn');
    elements.viewModeSelect = document.getElementById('view-mode');
    elements.instantPreviewToggle = document.getElementById('instant-preview');
    elements.markdownPanel = document.getElementById('markdown-panel');
    elements.previewPanel = document.getElementById('preview-panel');
    elements.editorContainer = document.getElementById('editor-container');
    elements.apiDocsLink = document.getElementById('api-docs-link');
}

/**
 * Convert markdown text to HTML via API
 */
async function convertMarkdown() {
    const markdown = elements.markdownInput.value;
    const previewContainer = elements.htmlPreview;

    // If no markdown is provided, display a placeholder
    if (!markdown) {
        updatePreview('<p class="text-gray-500">HTML preview will appear here...</p>');
        state.currentHtml = '';
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                markdown_text: markdown,
                include_toc: document.getElementById('include-toc').checked,
                github_flavored: document.getElementById('github-flavored').checked,
                syntax_highlighting: document.getElementById('syntax-highlighting').checked
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        if (data && data.html) {
            state.currentHtml = data.html;
            updatePreview(data.html);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error:', error);
        updatePreview(`<p class="text-red-500">Error converting markdown: ${error.message}</p>`);
        state.currentHtml = '';
    }
}

/**
 * Update the preview pane with HTML content
 */
function updatePreview(html) {
    const previewContainer = elements.htmlPreview;
    
    if (previewContainer.tagName.toLowerCase() === 'iframe') {
        const fullHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="./highlight.css">
                <style>
                    /* Enhanced styling for iframe preview */
                    body {
                        margin: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: 1em;
                        background: #ffffff;
                        line-height: 1.6;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        margin: 0.5em 0;
                        color: #1f2937;
                    }
                    p {
                        margin: 0.5em 0;
                    }
                    code {
                        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                        background: #f3f4f6;
                        padding: 0.2em 0.4em;
                        border-radius: 3px;
                        font-size: 0.875em;
                    }
                    pre {
                        background-color: #f9fafb;
                        padding: 1em;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        overflow-x: auto;
                        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                        margin: 0.5em 0;
                    }
                    pre code {
                        background: none;
                        padding: 0;
                        font-size: inherit;
                    }
                    a {
                        color: #2563eb;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                    }
                    ul, ol {
                        margin: 0.5em 0;
                        padding-left: 1.5em;
                    }
                    blockquote {
                        border-left: 4px solid #e5e7eb;
                        margin: 1em 0;
                        padding-left: 1em;
                        color: #6b7280;
                        background: #f9fafb;
                        padding: 1em;
                        border-radius: 0 6px 6px 0;
                    }
                    hr {
                        border: 0;
                        border-top: 1px solid #e5e7eb;
                        margin: 24px 0;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 1em 0;
                    }
                    th, td {
                        border: 1px solid #e5e7eb;
                        padding: 8px 12px;
                        text-align: left;
                    }
                    th {
                        background-color: #f9fafb;
                        font-weight: 600;
                    }
                    .toc {
                        background: #f9fafb;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        padding: 1em;
                        margin: 1em 0;
                    }
                    .toc h4 {
                        margin-top: 0;
                        color: #374151;
                    }
                    .toc ul {
                        margin: 0.5em 0;
                    }
                    .toc a {
                        color: #4b5563;
                    }
                    .text-gray-500 {
                        color: #6b7280;
                    }
                    .text-red-500 {
                        color: #ef4444;
                    }
                </style>
            </head>
            <body>
                ${html}
            </body>
            </html>
        `;
        
        previewContainer.contentDocument.open();
        previewContainer.contentDocument.write(fullHtml);
        previewContainer.contentDocument.close();
    } else {
        previewContainer.innerHTML = html;
    }
}

/**
 * Enhanced view mode switching
 */
function updateViewMode() {
    const mode = elements.viewModeSelect.value;
    
    // Reset classes
    elements.editorContainer.className = 'flex gap-4';
    elements.markdownPanel.className = 'w-full';
    elements.previewPanel.className = 'w-full';
    
    switch(mode) {
        case 'split':
            elements.editorContainer.className = 'flex flex-col md:flex-row gap-4';
            elements.markdownPanel.className = 'w-full md:w-1/2';
            elements.previewPanel.className = 'w-full md:w-1/2';
            elements.markdownPanel.style.display = 'block';
            elements.previewPanel.style.display = 'block';
            break;
        case 'markdown':
            elements.editorContainer.className = 'flex gap-4';
            elements.markdownPanel.className = 'w-full';
            elements.markdownPanel.style.display = 'block';
            elements.previewPanel.style.display = 'none';
            break;
        case 'preview':
            elements.editorContainer.className = 'flex gap-4';
            elements.previewPanel.className = 'w-full';
            elements.markdownPanel.style.display = 'none';
            elements.previewPanel.style.display = 'block';
            break;
    }
}

/**
 * Debounced conversion for instant preview
 */
let debounceTimer;
function debouncedConvert() {
    if (state.instantPreviewEnabled) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(convertMarkdown, CONFIG.DEBOUNCE_DELAY);
    }
}

/**
 * Copy HTML to clipboard
 */
async function copyHtml(html) {
    try {
        await navigator.clipboard.writeText(html);
        showNotification('HTML copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy: ', err);
        showNotification('Failed to copy HTML. Please try again.', 'error');
    }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

/**
 * Handle file upload
 */
async function handleFileUpload(event) {
    event.preventDefault();
    
    const formData = new FormData(elements.fileUploadForm);
    const file = formData.get('file');
    
    if (!file || file.size === 0) {
        showNotification('Please select a file first.', 'error');
        return;
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showNotification('File too large. Maximum size is 1MB.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/file`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (data && data.html) {
            state.fileHtml = data.html;
            elements.fileHtmlPreview.innerHTML = data.html;
            elements.fileResult.classList.remove('hidden');
            showNotification('File converted successfully!', 'success');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error converting file: ' + error.message, 'error');
    }
}

/**
 * Download HTML as file
 */
function downloadHtml(html, filename = 'converted.html') {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Convert button
    elements.convertBtn.addEventListener('click', convertMarkdown);
    
    // Copy HTML button
    elements.copyHtmlBtn.addEventListener('click', () => {
        if (state.currentHtml) {
            copyHtml(state.currentHtml);
        } else {
            showNotification('Please convert markdown to HTML first.', 'error');
        }
    });

    // Clear button
    elements.clearBtn.addEventListener('click', () => {
        elements.markdownInput.value = '';
        updatePreview('<p class="text-gray-500">HTML preview will appear here...</p>');
        state.currentHtml = '';
    });

    // View mode selector
    elements.viewModeSelect.addEventListener('change', updateViewMode);
    
    // Instant preview toggle
    elements.instantPreviewToggle.addEventListener('change', (e) => {
        state.instantPreviewEnabled = e.target.checked;
        if (state.instantPreviewEnabled) {
            convertMarkdown(); // Convert immediately when enabled
        }
    });

    // Auto-convert as you type
    elements.markdownInput.addEventListener('input', debouncedConvert);

    // File upload form
    elements.fileUploadForm.addEventListener('submit', handleFileUpload);

    // Copy file HTML button
    elements.copyFileHtmlBtn.addEventListener('click', () => {
        if (state.fileHtml) {
            copyHtml(state.fileHtml);
        } else {
            showNotification('Please convert a file first.', 'error');
        }
    });

    // Download HTML button
    elements.downloadHtmlBtn.addEventListener('click', () => {
        if (state.fileHtml) {
            downloadHtml(state.fileHtml);
        } else {
            showNotification('Please convert a file first.', 'error');
        }
    });

    // API docs link
    elements.apiDocsLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(`${CONFIG.API_BASE_URL}/api/docs`, '_blank');
    });
}

/**
 * Initialize sample content
 */
function initSampleContent() {
    elements.markdownInput.value = `# Welcome to MD2HTML

This is a **Markdown to HTML** converter running on Cloudflare.

## Features
- Convert Markdown to HTML
- GitHub Flavored Markdown support
- Code syntax highlighting
- Table of contents generation
- Secure HTML sanitization

## Code Example
\`\`\`javascript
function convertMarkdown() {
    console.log("Converting markdown to HTML!");
}
\`\`\`

## Table Example
| Name | Description |
|------|-------------|
| MD2HTML | Markdown to HTML converter |
| Cloudflare | Edge computing platform |

> Try it out by editing this text or uploading your own Markdown file!

### List Example
- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

**Enhanced by terriyaki for Cloudflare deployment** 🚀
`;
}

/**
 * Initialize the application
 */
function init() {
    initElements();
    initEventListeners();
    initSampleContent();
    updateViewMode();
    
    // Initial conversion
    if (state.instantPreviewEnabled) {
        convertMarkdown();
    }
    
    console.log('MD2HTML Frontend initialized successfully!');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}