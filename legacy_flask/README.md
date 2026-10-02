# GameKing Website Portal & Platform

A multi-project web platform featuring interactive games, community feeds, and business management tools. Built with a dual-mode architecture: a full-stack **Python Flask** server for local dynamic features and APIs, and an automated **Netlify static pipeline** for production hosting.

---

## 🎮 Featured Applications & Projects

The homepage (`/`) presents an animated pixel-art portal with a 7-circle project grid:

| # | Project | URL / Route | Description & Architecture |
|---|---|---|---|
| **1** | **Tic-Tac-Toe** | `/tictactoe`<br>`/tictactoe.html` | **Interactive Mini-Game**: Single-player vs AI, plus real-time multiplayer with matchmaking queue (`/game/matchmaking/*`), in-memory room pairing, and board synchronization. Canvas background via `tkbackground.js`. |
| **2** | **Before GTA 6** | `/beforegta6`<br>`/beforegta6.html` | **Community Meme Feed**: "We got X before GTA 6". Features category badges (News, Tech, Gadgets, Gaming, etc.), upvoting/downvoting, post creation modal, and simulated social authentication. Backed by persistent SQLite (`gameking.db`). |
| **3** | **Dashy by TNH** | `/dashy`<br>`/dashy.html` | **Internal Operations Dashboard**: Tailored for GameKing business operations in **Pokhara, Nepal**. Zero-framework vanilla stack featuring Nepali Bikram Sambat (BS 2080–2086) calendar, PIN-based staff attendance, weekly shift rosters, bathroom cleaning schedule, vendor ledger (currency in `Rs`), and admin management. |
| **4–7** | **Future Labs** | `#project4` – `#project7` | Reserved placeholder slots in the homepage circular grid for upcoming games and creative tools. |

---

## 🏛️ Repository Architecture

```text
Website Project (GameKing)/
├── app.py                      # Flask server (routes, APIs, SQLite DB models, matchmaking)
├── gameking.db                 # SQLite database for local Flask persistence (git-ignored)
├── netlify_build.py            # Primary build script: compiles Dashy & generates dist/
├── netlify.toml                # Netlify build command, publish directory, and URL rewrites
│
├── templates/                  # Canonical HTML source templates
│   ├── index.html              # Homepage portal with animated background & 7 project circles
│   ├── tictactoe.html          # Tic-Tac-Toe UI, singleplayer/multiplayer panels
│   ├── beforegta6.html         # Before GTA 6 feed UI, submission modal, and category filters
│   └── dashy.html              # Dashy operations dashboard template (built from dashy/)
│
├── static/                     # Canonical website static assets
│   ├── style.css               # Homepage & general portal styling
│   ├── style_tictactoe.css     # Tic-Tac-Toe game styling
│   ├── gtastyle.css            # Before GTA 6 feed and card styling
│   ├── dashy/                  # Bundled Dashy production assets (styles.css, app.js, SVGs)
│   ├── images/                 # Portal icons, logos, sprites, and background artwork
│   └── js/                     # Client scripts:
│       ├── background.js       # p5.js animated pixel landscape, clouds, and sheep
│       ├── tictactoe.js        # Game engine, AI player, and matchmaking client
│       └── tkbackground.js     # Tic-Tac-Toe canvas background
│
├── dashy/                      # Canonical source tree for Dashy by TNH
│   ├── index.html              # Standalone development shell
│   ├── app.js                  # Dashy core application logic and state management
│   ├── build.py                # Dashy bundler (combines modular CSS into deploy/)
│   ├── PROJECT_CONTEXT.md      # In-depth architectural & business context for Dashy
│   ├── assets/                 # Vector icons (including sacred dashy-icon.svg)
│   └── css/                    # Modular domain stylesheets:
│       ├── variables.css       # Design tokens & color variables
│       ├── base.css            # Typography & app shell
│       ├── components.css      # Reusable UI controls, pills, toasts
│       ├── dashboard.css       # Metrics & sales cards
│       ├── attendance.css      # PIN keypad, time qualification, floor status
│       ├── calendar.css        # Nepali BS calendar engine & picker
│       ├── roster.css          # Weekly roster table & shift modals
│       ├── vendors.css         # Vendor ledger, invoice lines, filters
│       ├── user-management.css # Admin credentials & staff configuration
│       └── responsive.css      # Breakpoints & desktop +20% scaling
│
├── dist/                       # GENERATED Netlify build artifact (DO NOT edit directly)
│   ├── index.html
│   ├── tictactoe.html
│   ├── beforegta6.html
│   ├── dashy.html
│   ├── dashy/index.html
│   └── static/...
│
├── LLM_CONTEXT_HANDOFF.txt     # Rapid-recovery context & deployment history for AI assistants
└── README.md                   # This project guide
```

---

## 🚀 How to Run the Project

### Mode 1: Local Full-Stack Development (Recommended)

Runs the complete Python Flask server with all dynamic backend endpoints (multiplayer matchmaking, SQLite persistence, social login, voting):

```powershell
python app.py
```

- **Access URL**: [http://localhost:5000](http://localhost:5000) (or `http://127.0.0.1:5000`)
- **Key Routes**:
  - Homepage: `http://localhost:5000/`
  - Tic-Tac-Toe: `http://localhost:5000/tictactoe` or `/tictactoe.html`
  - Before GTA 6: `http://localhost:5000/beforegta6` or `/beforegta6.html`
  - Dashy: `http://localhost:5000/dashy` or `/dashy.html`
- **Features**: Debug mode active, live SQLite database (`gameking.db`), auto-reloads on Python file edits.

### Mode 2: Local Netlify Static Preview

Simulates the exact static output that Netlify serves in production:

```powershell
# 1. Compile the dist/ artifact
python netlify_build.py

# 2. Serve dist/ with Python's static HTTP server
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

- **Access URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Features**: Tests raw static files, verifying that asset paths (`/static/...`) and page files resolve without the Flask runtime.

---

## 🌐 Production Deployment (Netlify)

This repository is configured for automated continuous deployment via Netlify:

1. **Trigger**: Push commits to the `main` branch:
   ```powershell
   git add -A
   git commit -m "Update feature"
   git push origin main
   ```
2. **Build Execution**: Netlify reads `netlify.toml` and automatically runs:
   ```bash
   python netlify_build.py
   ```
3. **Publish Target**: Netlify serves the generated `dist/` directory.
4. **URL Rewrites**: `netlify.toml` redirects `/tictactoe` → `/tictactoe.html`, `/beforegta6` → `/beforegta6.html`, and `/dashy` → `/dashy.html` with HTTP 200 (seamless clean URLs).

> [!NOTE]
> Netlify is a static host. Backend APIs (`/api/*` and multiplayer `/game/*`) require a running Flask instance. For production multi-device persistence or multiplayer, the Flask backend can be deployed to a cloud provider (e.g. Render, Railway, Fly.io).

---

## 🛠️ Maintenance & Developer Guidelines

Follow these golden rules to avoid regressions:

### 1. Where to Make Edits
- **Pages & HTML**: Edit files in `templates/` (`index.html`, `tictactoe.html`, `beforegta6.html`).
- **Main Portal Assets**: Edit files in `static/` (`style.css`, `js/background.js`, etc.).
- **Dashy Source**: Edit files inside `dashy/` (especially modular CSS in `dashy/css/` and logic in `dashy/app.js`).
- ⚠️ **NEVER edit files in `dist/` or `dashy/deploy/` directly.** They are overwritten every time `netlify_build.py` runs.

### 2. Asset Path Convention
- Always use **root-absolute paths** for assets: `/static/...` (e.g., `<link rel="stylesheet" href="/static/style.css">`).
- ⚠️ **Never use relative paths** like `../static/...`. They break when served under Netlify rewrites and sub-routes.

### 3. Route Synchronization
- In `app.py`, page routes must register both clean URLs and `.html` aliases (e.g., `@app.route('/tictactoe')` and `@app.route('/tictactoe.html')`). This ensures seamless navigation whether running via Flask on port 5000 or a static file server on port 8000.

### 4. Rebuilding Artifacts
- Whenever you modify `templates/`, `static/`, or `dashy/`, run:
  ```powershell
  python netlify_build.py
  ```
  This guarantees `dist/` remains completely synchronized before pushing to `main`.

### 5. Dashy Specific Rules
- **Sacred Asset**: `dashy/assets/dashy-icon.svg` is the master branding icon. **Never overwrite or delete it.**
- **Currency & Locale**: All monetary values must use Nepalese Rupees (**`Rs`**). Dates and calendar logic align with Pokhara / Nepal (`Asia/Kathmandu`).
- **Styles**: Keep CSS modular in `dashy/css/`. Avoid dumping large blocks into `styles.css`.
