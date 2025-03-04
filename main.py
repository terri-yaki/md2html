from flask import Flask, request, jsonify, render_template, send_from_directory
import markdown
import os
import uuid
from asgiref.wsgi import WsgiToAsgi

app = Flask(__name__, 
    static_folder='static',
    template_folder='templates'
)

# Create directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)

# Create a simple CSS file for code highlighting
with open("static/highlight.css", "w") as f:
    f.write("""
    .codehilite {
        background-color: #f8f8f8;
        padding: 1rem;
        border-radius: 0.375rem;
        overflow-x: auto;
    }
    .codehilite pre {
        margin: 0;
    }
    .codehilite .hll { background-color: #ffffcc }
    .codehilite .c { color: #408080; font-style: italic } /* Comment */
    .codehilite .k { color: #008000; font-weight: bold } /* Keyword */
    .codehilite .o { color: #666666 } /* Operator */
    .codehilite .cm { color: #408080; font-style: italic } /* Comment.Multiline */
    .codehilite .cp { color: #BC7A00 } /* Comment.Preproc */
    .codehilite .c1 { color: #408080; font-style: italic } /* Comment.Single */
    .codehilite .cs { color: #408080; font-style: italic } /* Comment.Special */
    .codehilite .gd { color: #A00000 } /* Generic.Deleted */
    .codehilite .ge { font-style: italic } /* Generic.Emph */
    .codehilite .gr { color: #FF0000 } /* Generic.Error */
    .codehilite .gh { color: #000080; font-weight: bold } /* Generic.Heading */
    .codehilite .gi { color: #00A000 } /* Generic.Inserted */
    .codehilite .go { color: #888888 } /* Generic.Output */
    .codehilite .gp { color: #000080; font-weight: bold } /* Generic.Prompt */
    .codehilite .gs { font-weight: bold } /* Generic.Strong */
    .codehilite .gu { color: #800080; font-weight: bold } /* Generic.Subheading */
    .codehilite .gt { color: #0044DD } /* Generic.Traceback */
    .codehilite .kc { color: #008000; font-weight: bold } /* Keyword.Constant */
    .codehilite .kd { color: #008000; font-weight: bold } /* Keyword.Declaration */
    .codehilite .kn { color: #008000; font-weight: bold } /* Keyword.Namespace */
    .codehilite .kp { color: #008000 } /* Keyword.Pseudo */
    .codehilite .kr { color: #008000; font-weight: bold } /* Keyword.Reserved */
    .codehilite .kt { color: #B00040 } /* Keyword.Type */
    .codehilite .m { color: #666666 } /* Literal.Number */
    .codehilite .s { color: #BA2121 } /* Literal.String */
    .codehilite .na { color: #7D9029 } /* Name.Attribute */
    .codehilite .nb { color: #008000 } /* Name.Builtin */
    .codehilite .nc { color: #0000FF; font-weight: bold } /* Name.Class */
    .codehilite .no { color: #880000 } /* Name.Constant */
    .codehilite .nd { color: #AA22FF } /* Name.Decorator */
    .codehilite .ni { color: #999999; font-weight: bold } /* Name.Entity */
    .codehilite .ne { color: #D2413A; font-weight: bold } /* Name.Exception */
    .codehilite .nf { color: #0000FF } /* Name.Function */
    .codehilite .nl { color: #A0A000 } /* Name.Label */
    .codehilite .nn { color: #0000FF; font-weight: bold } /* Name.Namespace */
    .codehilite .nt { color: #008000; font-weight: bold } /* Name.Tag */
    .codehilite .nv { color: #19177C } /* Name.Variable */
    .codehilite .ow { color: #AA22FF; font-weight: bold } /* Operator.Word */
    .codehilite .w { color: #bbbbbb } /* Text.Whitespace */
    .codehilite .mb { color: #666666 } /* Literal.Number.Bin */
    .codehilite .mf { color: #666666 } /* Literal.Number.Float */
    .codehilite .mh { color: #666666 } /* Literal.Number.Hex */
    .codehilite .mi { color: #666666 } /* Literal.Number.Integer */
    .codehilite .mo { color: #666666 } /* Literal.Number.Oct */
    .codehilite .sa { color: #BA2121 } /* Literal.String.Affix */
    .codehilite .sb { color: #BA2121 } /* Literal.String.Backtick */
    .codehilite .sc { color: #BA2121 } /* Literal.String.Char */
    .codehilite .dl { color: #BA2121 } /* Literal.String.Delimiter */
    .codehilite .sd { color: #BA2121; font-style: italic } /* Literal.String.Doc */
    .codehilite .s2 { color: #BA2121 } /* Literal.String.Double */
    .codehilite .se { color: #BB6622; font-weight: bold } /* Literal.String.Escape */
    .codehilite .sh { color: #BA2121 } /* Literal.String.Heredoc */
    .codehilite .si { color: #BB6688; font-weight: bold } /* Literal.String.Interpol */
    .codehilite .sx { color: #008000 } /* Literal.String.Other */
    .codehilite .sr { color: #BB6688 } /* Literal.String.Regex */
    .codehilite .s1 { color: #BA2121 } /* Literal.String.Single */
    .codehilite .ss { color: #19177C } /* Literal.String.Symbol */
    .codehilite .bp { color: #008000 } /* Name.Builtin.Pseudo */
    .codehilite .fm { color: #0000FF } /* Name.Function.Magic */
    .codehilite .vc { color: #19177C } /* Name.Variable.Class */
    .codehilite .vg { color: #19177C } /* Name.Variable.Global */
    .codehilite .vi { color: #19177C } /* Name.Variable.Instance */
    .codehilite .vm { color: #19177C } /* Name.Variable.Magic */
    .codehilite .il { color: #666666 } /* Literal.Number.Integer.Long */
    """)

@app.route('/')
def home():
    """Render the home page"""
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


@app.route('/convert/file', methods=['POST'])
def convert_file():
    """Convert markdown file to HTML"""
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
    include_toc=False,
    github_flavored=True,
    syntax_highlighting=True,
    math_support=True,
    custom_css="",
    extra_extensions=None,
    full_page=False
):
    """
    Convert Markdown text to HTML with support for:
      - Headings, paragraphs, emphasis, and inline code.
      - Links, images.
      - Unordered/ordered lists and task lists.
      - Blockquotes and nested blockquotes.
      - Fenced code blocks (with codehilite) that are wrapped only once.
      - Tables and horizontal rules.
      - Inline HTML.
      - Footnotes, admonitions, attribute lists, and definition lists.
      - Math expressions using $...$ (inline) and $$...$$ (display), rendered via MathJax.
      - Custom CSS and metadata.
      - All extra block elements.
      
    Parameters:
      markdown_text (str): The Markdown content.
      include_toc (bool): If True, include a table of contents.
      github_flavored (bool): If True, add the 'extra' extension for GitHub-flavored Markdown.
      syntax_highlighting (bool): If True, enable code highlighting using codehilite.
      math_support (bool): If True, enable math support using python-markdown-math.
      custom_css (str): Additional CSS to inject.
      extra_extensions (list): Extra Markdown extensions to include.
      full_page (bool): If True, returns a complete HTML document; otherwise, returns an HTML fragment.
      
    Returns:
      str: The final HTML.
    """
    import markdown

    # Base extensions for a broad set of features.
    extensions = [
        'fenced_code',    # For code fences.
        'tables',         # Table support.
        'attr_list',      # Allow attribute lists.
        'admonition',     # For admonition blocks.
        'footnotes',      # For footnotes.
        'meta',           # Metadata.
        'sane_lists',     # Better list handling.
        'def_list'        # Definition lists.
    ]
    extension_configs = {}

    # GitHub-flavored Markdown: 'extra' bundles many features.
    if github_flavored:
        if 'extra' not in extensions:
            extensions.append('extra')
    else:
        if 'extra' in extensions:
            extensions.remove('extra')

    # Enable syntax highlighting.
    if syntax_highlighting:
        if 'codehilite' not in extensions:
            extensions.append('codehilite')
        extension_configs['codehilite'] = {
            'css_class': 'codehilite',
            'linenums': False,
            'guess_lang': False
        }
    
    # Include TOC if requested.
    if include_toc:
        if 'toc' not in extensions:
            extensions.append('toc')
        extension_configs['toc'] = {
            'title': 'Table of Contents',
            'permalink': True
        }

    # Enable math support.
    if math_support:
        if 'mdx_math' not in extensions:
            extensions.append('mdx_math')
        extension_configs['mdx_math'] = {
            'enable_dollar_delimiter': True  # Allow both inline ($...$) and display ($$...$$) math.
        }

    # Append any extra extensions.
    if extra_extensions:
        for ext in extra_extensions:
            if ext not in extensions:
                extensions.append(ext)

    # Convert the Markdown to HTML.
    html_body = markdown.markdown(
        markdown_text,
        extensions=extensions,
        extension_configs=extension_configs,
        output_format='html5'
    )

    # Base CSS styles for the preview document.
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
        padding: 0.5em;
        background: #fdf2f2;
        margin: 1em 0;
      }
    """
    # Append custom CSS if provided.
    if custom_css:
        base_styles += custom_css

    # Include MathJax if math support is enabled and we're returning a full document.
    mathjax_script = ""
    if math_support and full_page:
        mathjax_script = (
            '<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js" '
            'integrity="sha512-6cjeKuL8NKM4U0Wm8v3O0B3WPhjEjdwbFcPUkR+hvJH/7Yum1pdI+tPmL4paAs/nuoM7U6VIRUzBiDwxu5RJsg==" '
            'crossorigin="anonymous"></script>'
        )

    # Build final HTML.
    if full_page:
        final_html = (
            "<!DOCTYPE html>\n"
            "<html lang='en'>\n"
            "<head>\n"
            "    <meta charset='UTF-8'>\n"
            "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n"
            "    <title>Converted Markdown</title>\n"
            f"    <link rel='stylesheet' href='/static/highlight.css'>\n"
            f"    <style>{base_styles}</style>\n"
            f"    {mathjax_script}\n"
            "</head>\n"
            "<body>\n"
            f"    {html_body}\n"
            "</body>\n"
            "</html>"
        )
    else:
        final_html = f"<style>{base_styles}</style>\n" + html_body;

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