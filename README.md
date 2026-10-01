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
- The animated background is viewport-fixed rather than document-sized, which
  prevents a second scaled image from appearing behind the footer while
  scrolling.
- `dist/` is generated output and should be rebuilt after source changes.
