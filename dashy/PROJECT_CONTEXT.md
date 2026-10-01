# Dashy by TNH — Project Context & Developer Handover Guide

> **To the Next LLM / AI Assistant:**  
> Read this document thoroughly before writing any code. It contains the business vision, design aesthetics, architectural rules, data schemas, deployment pipeline, and past lessons for **Dashy by TNH**. Adhere strictly to these principles.

---

## 1. Executive Summary & Core Identity

- **Project Name:** `Dashy by TNH` (often called **Dashy**)
- **Business:** Internal operations and business management dashboard for **GameKing** (entertainment, recreation, cafe/kitchen, and venue operations).
- **Location:** **Pokhara, Nepal** (all dates, local times, and currency must reflect Pokhara / Nepal context).
- **Currency:** Nepalese Rupees (**`Rs`**). Never use British Pounds (`£`) or US Dollars (`$`).
- **Core Motto:** *"Easy to use and intuitive is like the motto of this project."* The UI must be highly visual, spacious, modern, and readable without squinting.
- **Default Greeting:** `Good morning, TNH 😀` (or `Good morning, [AdminName] 😀` when admin is authenticated).

---

## 2. Technical Stack & Deployment Constraints

> [!IMPORTANT]
> **Strict Zero-Framework Vanilla Policy:**  
> - Pure **Vanilla HTML, CSS, and JavaScript**.
> - **NO** Node.js build step, NO Webpack, NO Vite, NO React, NO npm dependencies.
> - The application must run directly via Python's built-in HTTP server: `python -m http.server 5500`.

### Deployment Target
- **Hosting:** Static deployment on **Netlify** as part of the main GameKing website repository (`D:\Python\Website Project (GameKing)`).
- **Build Pipeline:** `python build.py`
  - Formats `dashy.html` and rewrites asset URLs to `/static/dashy/...`.
  - Bundles all modular CSS files in `css/` into `deploy/static/dashy/styles.css`.
  - Copies `app.js` into `deploy/static/dashy/app.js`.
  - Copies `assets/dashy-icon.svg` into `deploy/static/dashy/dashy-icon.svg`.
  - Output directory is `deploy/`.
- **Git Branch:** `main` (Remote: `https://github.com/GameKing14615/Internal-Dash-board-Project.git`).

---

## 3. Modular Codebase Architecture (Token-Efficient)

To prevent AI model sluggishness and save tokens, the CSS has been modularized into domain-specific files under `css/`. **When working on a specific feature, only read or edit that specific file!**

```
Internal Dash board Project/
├── index.html                 # Main development HTML shell
├── styles.css                 # Master @import loader for development (17 lines)
├── app.js                     # Core application script (feature modules and event handlers)
├── build.py                   # Netlify bundler & deployment script
├── PROJECT_CONTEXT.md         # This master context document
├── assets/                    # All app icons and graphics
│   ├── dashy-icon.svg         # DO NOT TOUCH! Master branding squircle icon
│   └── icon-*.svg             # 16 custom squircle vector icons (192x192)
└── css/                       # Modular CSS stylesheets (< 500 lines each)
    ├── variables.css          # Color tokens, fonts, theme variables
    ├── base.css               # Reset, typography, app shell (topbar, sidebar)
    ├── components.css         # Buttons, time-pills, custom selects, avatars, toasts
    ├── dashboard.css          # Metrics cards, sales chart, attendance expand
    ├── attendance.css         # PIN keypad, action cards, floor status, user header
    ├── calendar.css           # Nepali BS calendar panel, toolbar, month picker
    ├── roster.css             # Weekly roster table, cells, shift modals, animations
    ├── vendors.css            # Vendors placeholder, help guide, system logs
    ├── user-management.css    # Admin user management table and edit user modal
    └── responsive.css         # Mobile/tablet breakpoints + 20% desktop zoom rules
```

---

## 4. Key Domain Features & Implementation Details

### A. Staff Attendance Login & Live Floor Status
- **Authentication:** 4-digit PIN keypad (defaults: `1111` for Alex, `2222` for Sarah, `3333` for Marcus, `4444` for Elena).
- **PIN Panel Design:** Luminous sky-blue gradient (`linear-gradient(140deg, #1e6fa8 0%, #298cd4 45%, #4fc3f7 100%)`) with frosted-glass keypad buttons.
- **Authenticated Header:** When a user logs in, their avatar icon, name, and role appear in the **center at the very top inside the PIN panel** (`.pin-user-header`).
- **Back Button:** Circular translucent back button positioned in the **top-right** corner (`top: 16px; right: 16px;`).
- **Finish / Switch Employee Button:** Green button (`#10b981`, `.finish-session-green`) at the **bottom-right** inside the PIN panel. It only appears when a staff member is logged in and viewing the 4 action cards.
- **Action Cards:** 4 large colored cards:
  - `Clock in` / `Resume shift` (Emerald green `#10b981`)
  - `Break` (Amber orange `#f59e0b`)
  - `Clock out` (Red `#ef4444`)
  - `Request leave` (Purple `#8b5cf6`, opens WhatsApp form)
- **Live Floor Status Badges:** Uses `.time-pill` badges matching Dashboard attendance:
  - **Clocked In:** Green pill (`.time-pill.in`, e.g. `08:42 · In`)
  - **On Break:** Amber pill (`.time-pill.break`, `On Break`)
  - **Off Shift:** Red pill (`.time-pill.out`, `Off Shift`) with neutral style commented out in CSS.

### B. Weekly Roster System
- **Cycle:** Sunday to Saturday weekly columns.
- **Toolbar:** Centered week display and navigation (`display: grid; grid-template-columns: 1fr auto 1fr;`).
- **Swipe Animations:** When changing weeks, the roster table slides smoothly with CSS keyframes (`slide-out-left/right`, `slide-in-left/right`).
- **Cell Styling:** Clean rounded shift cards with NO ugly white cell borders (`.roster-cell { border: none !important; }`).
- **Shift Actions:** Shift assignment modals, templates, Draft mode vs. Final Publish mode.

### C. Nepali Bikram Sambat (BS) Calendar
- **Engine:** Accurate BS ↔ Gregorian conversion tables verified for **2080 through 2086** (`bsMonthLengths`, `bsYearStarts`, `bsYearData`).
- **Sync:** Synced with Pokhara / Kathmandu timezone (`Asia/Kathmandu`).
- **Features:** Dual month/year header (Nepali BS + Gregorian equivalent), interactive month/year picker modal, day dots.

### D. Sales Overview
- **Chart:** Responsive SVG line chart with hover tooltips and dynamic scaling.
- **Dropdown Filter:** Range selector (`Today`, `Last 7 days`, `This month`).
- **Custom Arrow:** Dropdown uses a custom vector chevron SVG positioned 14px from the right border with generous padding (`padding-right: 36px`) so it never touches the edge.

### E. User Management (Admin Only)
- **Visibility:** Unlocked ONLY when admin is logged in (`isAdmin === true`, admin password: `admin`).
- **Capabilities:** Admin can add new staff, remove users, edit display names, update 4-digit PINs, change roles, assign avatar icons, and grant admin privileges.
- **Theme-Consistent Modal:** The "Account Type" dropdown in the Edit User modal has custom option styling matching `--surface` and `--ink` in both light and dark modes.

---

## 5. Visual Design Language & Aesthetics

1. **Desktop Scale (+20% Readability):**  
   The application uses `@media (min-width: 1025px)` in `css/responsive.css` to scale up typography, padding, avatars, and buttons by roughly 20%. This ensures the webapp has comfortable, spacious readability at 100% browser zoom without feeling cramped.
2. **Color Palette:**
   - Dark Theme (Default): Deep navy surface (`#152230`), subtle borders (`#223447`), crisp off-white text (`#f1f5f9`).
   - Primary Accent: Neon Teal (`#34d399` / `#72d6ba`).
   - Secondary Accents: Rich Blue (`#0284c7`), Amber (`#fbbf24`), Rose (`#f43f5e`), Violet (`#8b5cf6`).
3. **SVG Icons:**
   - Stored in `assets/`.
   - **`dashy-icon.svg` is sacred — NEVER overwrite or modify it.**
   - All other icons (`icon-*.svg`) are 192x192 rounded squircles (`rx="48"`) with vibrant 45° diagonal gradients and clean, thick white vector line art (`~12px` stroke weight).

---

## 6. Current Implementation Status & Remaining MVP Roadmap

The current `main` branch is a working static MVP, not the earlier placeholder prototype. The following areas are implemented and should be preserved during deployment:

| Area | Current status |
|---|---|
| **Attendance and calendar** | PIN-based staff sessions, Clock in/Break/Clock out actions, configurable Instant/Seconds/Minutes attendance qualification, Nepali calendar icons, Kathmandu-local dates, and admin attendance overrides are implemented. |
| **Weekly roster** | Draft editing, shift templates, drag-and-drop assignment, drag-to-delete overlay, week navigation, swipe animation, publish workflow, multi-week local persistence, staff-facing hiding of Weekly Total, and publication-date display are implemented. |
| **Bathroom cleaning schedule** | Separate weekly schedule, independent navigation and swipe animation, admin drag-and-drop editor, table-to-table movement, drag-to-delete overlay, draft/publish workflow, and published staff view are implemented. |
| **Vendor ledger** | Vendor CRUD, vendor colors and inline editing, invoice-level rows with expandable item lines, filters, payments, notes, totals, chart toggle, three-month retention, themed filter SVG, and user-resizable persisted columns are implemented. |
| **Documentation** | The beginner Help Guide and detailed System Log are included in the app and must remain synchronized with behavior. |

The remaining work before or after a first production release is:

| Priority | Feature area | Remaining work |
|---|---|---|
| **High** | **Attendance event history** | The current `attendanceLog` records clock-in timestamps and qualification state, while the staff object holds the current status. Add a durable event stream for clock-in, break, resume, and clock-out events plus daily-hours calculations if payroll-grade reporting is required. |
| **Medium** | **Real sales ledger** | Sales charts and dashboard sales cards still use in-code demo series. Add an admin sales-entry workflow for cash, card, and digital-wallet totals in `Rs` before treating sales figures as business records. |
| **Medium** | **Destructive-action confirmations** | Vendor and bill deletion use browser confirmation dialogs. Add theme-consistent custom confirmations for Clear Draft, roster/cleaning Publish, Delete User, and any other irreversible action. |
| **Medium** | **Server-backed persistence and authorization** | The app currently stores operational data in browser `localStorage` and client-side admin gates. For multi-device or production use, move persistence and authorization to a trusted backend; do not treat the client-side password as security. |
| **Low** | **Deployment integration** | Keep the merged `dashy/` source tree and the parent GameKing Netlify build synchronized when making future changes. |

### Important deployment readiness items

Before publishing a release, complete this checklist:

1. From the GameKing website repository, run:
   ```bash
   python dashy/format_html.py
   python dashy/build.py
   python -m py_compile netlify_build.py dashy/build.py
   git diff --check
   ```
2. Netlify runs `python netlify_build.py`, which invokes `dashy/build.py` and copies its output into `dist/`. Verify:
   - `dist/dashy.html`
   - `dist/static/dashy/app.js`
   - `dist/static/dashy/styles.css`
   - `dist/static/dashy/dashy-icon.svg`
   - `dist/static/dashy/icon-filter.svg`
3. Test locally with:
   ```bash
   python -m http.server 5500 --bind 127.0.0.1
   ```
   Open `http://127.0.0.1:5500/index.html` and check the browser console for errors.
4. Exercise both permission modes:
   - Staff: PIN login, attendance, published roster, published cleaning schedule, and no Weekly Total column.
   - Admin: roster/cleaning draft editing, drag-and-drop, delete overlays, publish actions, vendor editing, attendance overrides, and User Management.
5. Confirm browser-local data behavior is acceptable for the release. Clearing site data, changing browser profiles, or using another device does not migrate records.
6. Deploy a preview before production and test the hosted `/dashy` URL directly; a successful local server does not prove the Netlify integration is configured.

---

## 7. Golden Rules for Developers & AI Models

1. **Never break the generated deployment output:** Netlify expects `dist/dashy.html`, `dist/static/dashy/styles.css`, and `dist/static/dashy/app.js`, plus the referenced SVG assets. Always run `python netlify_build.py` after making changes.
2. **Keep edits modular:** When editing styles, modify the specific file in `css/` (e.g. `css/attendance.css`). Do NOT paste massive chunks back into `styles.css`.
3. **Never touch `dashy-icon.svg`:** The user loves this icon; it is the visual benchmark for the entire project.
4. **Test locally before claiming completion:** Local server runs on `http://127.0.0.1:5500`. Verify the server returns the app, the browser console is clean, and both staff and admin flows work.
5. **Always preserve comments and docstrings:** Maintain code readability and architecture documentation across turns.
