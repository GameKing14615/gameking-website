# GameKing Website

The GameKing website is a Flask project with a static Netlify deployment.

## Repository layout

```text
app.py                 Flask development server and APIs
templates/             HTML source pages
static/                Website CSS, JavaScript, and images
dashy/                 Complete Dashy dashboard source
netlify_build.py       Rebuilds the Netlify dist/ artifact
netlify.toml           Netlify build and route configuration
dist/                  Generated Netlify publish directory
docs/                  Project notes and maintenance documentation
```

Dashy is maintained in `dashy/` and is built automatically by the parent
website build. Do not edit the generated Dashy files in `dist/` directly.

## Local static preview

```powershell
python netlify_build.py
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8000/` for the homepage and
`http://127.0.0.1:8000/dashy/` for Dashy. Netlify also maps `/dashy` to the
Dashy page in production.

## Development notes

- The homepage has a CSS background fallback, so it remains visually usable
  when a browser extension blocks the optional animated background library.
- The homepage animated scene is document-sized and aligned to the footer, so
  the mountain scene scrolls with the page without extending behind the footer.
- `dist/` is generated output and should be rebuilt after source changes.
- `gameking.db` is local Flask runtime data and is intentionally not committed.

## Maintenance rules

- Edit HTML in `templates/`, site assets in `static/`, and Dashy source in
  `dashy/`; do not edit generated files in `dist/` or `dashy/deploy/`.
- Run `python netlify_build.py` after source changes. This rebuilds Dashy through
  `dashy/build.py` and recreates the complete Netlify publish directory.
- Keep the public routes in `netlify.toml` and the `.html` files in `dist/`
  synchronized so both Flask and the Python static preview continue to work.
