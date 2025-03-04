import requests

# Convert markdown text to HTML
def convert_markdown(text):
    url = "https://md2html-026e9f635799.herokuapp.com/api"
    payload = {
        "markdown_text": text,
        "include_toc": False,
        "github_flavored": True,
        "syntax_highlighting": True
    }
    response = requests.post(url, json=payload)
    return response.json()["html"]

# Example usage
markdown = "# Hello World\n\nThis is **bold** text."
html = convert_markdown(markdown)
print(html)