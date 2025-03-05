from flask import Flask, request, jsonify, render_template, send_from_directory
import markdown
import os
import uuid
from asgiref.wsgi import WsgiToAsgi
from flask_talisman import Talisman

app = Flask(__name__, 
    static_folder='static',
    template_folder='templates'
)

# Create directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api', methods=['POST'])
def convert_text():
    try:
        data = request.get_json()
        if not data or 'markdown_text' not in data:
            return jsonify({"error": "Markdown text is required"}), 400

        markdown_text = data.get('markdown_text', '')
        include_toc = data.get('include_toc', False)
        github_flavored = data.get('github_flavored', True)
        syntax_highlighting = data.get('syntax_highlighting', True)

        html = convert_markdown_to_html(
            markdown_text,
            include_toc=include_toc,
            github_flavored=github_flavored,
            syntax_highlighting=syntax_highlighting,
            full_page=False  # Change to True if you need a complete document.
        )

        return jsonify({"html": html})
    except Exception as e:
        import traceback
        print("Error converting markdown:", str(e))
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/file', methods=['POST'])
def convert_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        if not file.filename.endswith(('.md', '.markdown')):
            return jsonify({"error": "File must be a Markdown file"}), 400
        
        # Get form parameters
        include_toc = request.form.get('include_toc', 'false').lower() == 'true'
        github_flavored = request.form.get('github_flavored', 'true').lower() == 'true'
        syntax_highlighting = request.form.get('syntax_highlighting', 'true').lower() == 'true'
        
        # Read file content
        markdown_text = file.read().decode('utf-8')
        
        # Convert to HTML
        html = convert_markdown_to_html(
            markdown_text,
            include_toc,
            github_flavored,
            syntax_highlighting
        )
        
        # Save file for reference (optional)
        file_id = str(uuid.uuid4())
        file_path = f"uploads/{file_id}.md"
        with open(file_path, "w") as f:
            f.write(markdown_text)
        
        return jsonify({
            "html": html,
            "file_id": file_id
        })
    except Exception as e:
        import traceback
        print(f"Error converting file: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def convert_markdown_to_html(
    markdown_text,
    bare_output=True,
    github_flavored=True,
    syntax_highlighting=True,
    math_support=True,
    custom_css="",
    extra_extensions=None,
    include_toc=False,
    full_page=False
):
    import markdown

    # Base set of extensions
    extensions = [
        'fenced_code',
        'tables',
        'attr_list',
        'admonition',
        'footnotes',
        'meta',
        'sane_lists',
        'def_list'
    ]
    extension_configs = {}

    # GitHub-flavored
    if github_flavored and 'extra' not in extensions:
        extensions.append('extra')

    # Syntax highlighting
    if syntax_highlighting and 'codehilite' not in extensions:
        extensions.append('codehilite')
        extension_configs['codehilite'] = {
            'css_class': 'codehilite',
            'linenums': False,
            'guess_lang': False
        }

    # TOC
    if include_toc and 'toc' not in extensions:
        extensions.append('toc')
        extension_configs['toc'] = {
            'title': 'Table of Contents',
            'permalink': True
        }

    # Math
    if math_support and 'mdx_math' not in extensions:
        extensions.append('mdx_math')
        extension_configs['mdx_math'] = {
            'enable_dollar_delimiter': True
        }

    # Extra extensions
    if extra_extensions:
        for ext in extra_extensions:
            if ext not in extensions:
                extensions.append(ext)

    # Convert markdown to HTML
    html_body = markdown.markdown(
        markdown_text,
        extensions=extensions,
        extension_configs=extension_configs,
        output_format='html5'
    )

    # If bare_output is True, just return the user’s raw HTML body
    if bare_output:
        return html_body

    # Otherwise, proceed with your usual styling logic
    base_styles = """
      body {
        margin: 0;
        font-family: sans-serif;
        padding: 1em;
      }
      h1, h2, h3, h4, h5, h6 {
        margin: 0.5em 0;
      }
      p {
        margin: 0.5em 0;
      }
      pre {
        background-color: #f3f3f3;
        padding: 1em;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre-wrap; /* Prevent double-wrapping */
      }
      code {
        font-family: monospace;
      }
      p code, li code, span code {
        background: #eee;
        padding: 0.1em 0.3em;
        border-radius: 3px;
        font-size: 0.95em;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
      }
      th, td {
        border: 1px solid #ccc;
        padding: 8px;
      }
      th {
        background-color: #f5f5f5;
      }
      blockquote {
        border-left: 4px solid #ccc;
        margin: 1em 0;
        padding-left: 1em;
        color: #555;
        font-style: italic;
        background: #f9f9f9;
      }
      hr {
        border: 0;
        border-top: 1px solid #ccc;
        margin: 1em 0;
      }
      /* CodeHilite styling */
      .codehilite {
        background: #f8f8f8;
        border: 1px solid #ccc;
        padding: 0.5em;
        overflow-x: auto;
        font-size: 0.9em;
      }
      .codehilite code {
        background: none;
        border: none;
        padding: 0;
        font-size: inherit;
        color: inherit;
      }
      /* Admonition styling (if used) */
      .admonition {
					border-left: 4px solid #e74c3c;
					background-color: #fdf2f2;
					padding: 0.75em 1em;
					margin: 1em 0;
					font-style: italic;
        }
        .admonition h4 {
					margin-top: 0;
					font-weight: bold;
        }

    """

    if full_page:
        # Wrap in full HTML doc with styles
        final_html = f"<!DOCTYPE html><html> ... {html_body} ...</html>"
    else:
        # Return a fragment with embedded <style>
        final_html = f"<style>{base_styles}</style>\n{html_body}"

    return final_html

@app.route('/api/docs')
def api_docs():
    """API documentation page"""
    return render_template('docs.html')

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory(app.static_folder, filename)

# Create a Flask application instance for Uvicorn
app_instance = app
app_asgi = WsgiToAsgi(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app_asgi, host="0.0.0.0", port=8000, reload=True)