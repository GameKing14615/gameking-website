"""
Dashy Build Script
==================
Builds the Dashy source tree for the GameKing website's Netlify deployment.

Usage:
    python build.py

Output:
    deploy/
        dashy.html              <- copy to GameKing/templates/dashy.html
        static/dashy/
            styles.css           <- copy to GameKing/static/dashy/styles.css
            app.js               <- copy to GameKing/static/dashy/app.js
            dashy-icon.svg       <- copy to GameKing/static/dashy/dashy-icon.svg

The parent GameKing ``netlify_build.py`` invokes this script, then copies
``deploy/dashy.html`` and ``deploy/static/dashy/`` into the final ``dist/``
artifact. The source under ``dashy/`` is therefore the canonical Dashy copy.
"""

import shutil
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEPLOY = ROOT / "deploy"
STATIC_OUT = DEPLOY / "static" / "dashy"

# Source files
DASHY_HTML = ROOT / "dashy.html"        # formatted HTML (created by reformat step)
FALLBACK_HTML = ROOT / "index.html"     # fallback if dashy.html doesn't exist yet
STYLES_CSS = ROOT / "styles.css"
APP_JS = ROOT / "app.js"
ICON_SVG = ROOT / "assets" / "dashy-icon.svg"
FILTER_SVG = ROOT / "assets" / "icon-filter.svg"


def clean_deploy():
    """Remove and recreate the deploy directory."""
    if DEPLOY.exists():
        shutil.rmtree(DEPLOY)
    DEPLOY.mkdir(parents=True, exist_ok=True)
    STATIC_OUT.mkdir(parents=True, exist_ok=True)


def rewrite_html_paths(html_content: str) -> str:
    """
    Rewrite asset paths in the HTML to use absolute /static/dashy/ paths
    so they work correctly on Netlify.
    """
    replacements = [
        # CSS
        (r'href="styles\.css[^"]*"', 'href="/static/dashy/styles.css"'),
        # JS
        (r'src="app\.js"', 'src="/static/dashy/app.js"'),
        # Icon
        (r'src="assets/dashy-icon\.svg"', 'src="/static/dashy/dashy-icon.svg"'),
        # Already-absolute paths from dashy.html (update if present)
        (r'href="/static/dashy/styles\.css[^"]*"', 'href="/static/dashy/styles.css"'),
        (r'src="/static/dashy/app\.js"', 'src="/static/dashy/app.js"'),
        (r'src="/static/dashy/dashy-icon\.svg"', 'src="/static/dashy/dashy-icon.svg"'),
    ]
    for pattern, replacement in replacements:
        html_content = re.sub(pattern, replacement, html_content)

    # Remove manifest link (not needed on Netlify)
    html_content = re.sub(r'<link\s+rel="manifest"[^>]*>\s*\n?', '', html_content)

    return html_content


def build_html():
    """Copy and rewrite the HTML file for deployment."""
    source = DASHY_HTML if DASHY_HTML.exists() else FALLBACK_HTML
    html_content = source.read_text(encoding="utf-8")
    html_content = rewrite_html_paths(html_content)
    (DEPLOY / "dashy.html").write_text(html_content, encoding="utf-8")
    print(f"  HTML: {source.name} -> deploy/dashy.html")


def build_css():
    """Bundle all CSS modules into a single production stylesheet."""
    css_dir = ROOT / "css"
    if css_dir.exists():
        css_order = [
            "variables.css",
            "base.css",
            "components.css",
            "dashboard.css",
            "attendance.css",
            "calendar.css",
            "roster.css",
            "vendors.css",
            "user-management.css",
            "responsive.css"
        ]
        bundled = []
        for name in css_order:
            f = css_dir / name
            if f.exists():
                bundled.append(f"/* === {name} === */\n" + f.read_text(encoding="utf-8"))
        (STATIC_OUT / "styles.css").write_text("\n\n".join(bundled), encoding="utf-8")
        print(f"  CSS:  10 modules -> deploy/static/dashy/styles.css (bundled)")
    else:
        shutil.copy2(STYLES_CSS, STATIC_OUT / "styles.css")
        print(f"  CSS:  styles.css -> deploy/static/dashy/styles.css")


def build_js():
    """Copy the JavaScript."""
    js_content = APP_JS.read_text(encoding="utf-8")
    js_content = js_content.replace("'assets/icon-filter.svg'", "'/static/dashy/icon-filter.svg'")
    (STATIC_OUT / "app.js").write_text(js_content, encoding="utf-8")
    print(f"  JS:   app.js -> deploy/static/dashy/app.js")


def build_assets():
    """Copy static assets (icon, etc.)."""
    if ICON_SVG.exists():
        shutil.copy2(ICON_SVG, STATIC_OUT / "dashy-icon.svg")
        print(f"  SVG:  dashy-icon.svg -> deploy/static/dashy/dashy-icon.svg")
    if FILTER_SVG.exists():
        shutil.copy2(FILTER_SVG, STATIC_OUT / "icon-filter.svg")
        print(f"  SVG:  icon-filter.svg -> deploy/static/dashy/icon-filter.svg")


def verify():
    """Verify all expected files exist in deploy."""
    expected = [
        DEPLOY / "dashy.html",
        STATIC_OUT / "styles.css",
        STATIC_OUT / "app.js",
    ]
    missing = [str(f) for f in expected if not f.exists()]
    if missing:
        print(f"\n  [!] Missing files: {missing}")
        return False
    print(f"\n  [OK] All files present in deploy/")
    return True


if __name__ == "__main__":
    print("Dashy Build Script")
    print("=" * 40)
    clean_deploy()
    build_html()
    build_css()
    build_js()
    build_assets()
    ok = verify()

    print()
    if ok:
        print("Dashy artifacts are ready for the parent GameKing Netlify build.")
    else:
        print("Build had issues. Check the output above.")
