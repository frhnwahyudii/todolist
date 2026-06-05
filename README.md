# Life Dashboard

A zero-dependency, static single-page productivity dashboard. No framework, no build step, no server — just open `index.html` in any modern browser and start using it.

---

## What it does

Life Dashboard combines five widgets into a single page that persists everything to `localStorage`:

| Widget | What you get |
|---|---|
| **Greeting** | Current time (updates every minute on the wall-clock boundary), today's date, and a time-of-day greeting — personalised with your name |
| **Focus Timer** | 25-minute Pomodoro countdown with Start / Stop / Reset controls and a Web Audio beep when the session ends |
| **Task List** | Add, edit inline, complete, delete, and sort tasks (creation order, A–Z, or incomplete-first) |
| **Quick Links** | Save up to 20 shortcut buttons that open your favourite URLs in a new tab |
| **Theme Toggle** | Light and dark mode, persisted across visits, with FOUC prevention via an inline `<head>` script |

---

## Live demo

Open `index.html` directly in your browser — no server required.

```
# Clone the repo
git clone https://github.com/frhnwahyudii/CodingCamp-1June26-FarhanWahyudi.git
cd todo-life-dashboard

# Open the dashboard
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

---

## Project structure

```
todo-life-dashboard/
├── index.html              # Single HTML shell — all widget markup + FOUC script
├── css/
│   └── style.css           # Full styles: CSS variables, responsive grid, light/dark palettes
├── js/
│   └── app.js              # All JavaScript: Store + 6 modules + DOMContentLoaded wiring
├── tests/
│   ├── unit/
│   │   ├── store.test.js           # 14 tests — localStorage adapter
│   │   ├── timer.test.js           # 15 tests — MM:SS formatter
│   │   └── links.helpers.test.js   # 27 tests — URL normalisation & validation
│   └── property/               # Reserved for property-based tests (fast-check)
├── package.json
└── vitest.config.js
```

---

## Architecture

The entire application lives in three files. `js/app.js` follows a **module-per-widget** pattern — each module is a plain object with an `init()` function called on `DOMContentLoaded`.

```
DOMContentLoaded
  ├── ThemeModule.init()       ← first, prevents flash of unstyled content
  ├── GreetingModule.init()
  ├── UserNameModule.init()
  ├── TimerModule.init()
  ├── TaskModule.init()
  └── LinksModule.init()
```

### Modules

| Module | Responsibility |
|---|---|
| `Store` | Thin localStorage wrapper — `get`, `set`, `remove` with try/catch on every call |
| `ThemeModule` | Reads persisted theme, toggles `dark` class on `<html>`, persists preference |
| `GreetingModule` | Renders time/date/greeting; re-renders on the next wall-clock minute boundary |
| `UserNameModule` | Persists display name as a raw string (not JSON-encoded); triggers `GreetingModule.render()` |
| `TimerModule` | IDLE → RUNNING → PAUSED state machine; Web Audio API beep on completion |
| `TaskModule` | Full CRUD + sort; event delegation on `#task-list`; optimistic update with revert-on-fail |
| `LinksModule` | Up to 20 links; normalises URLs; event delegation on `#links-list`; revert-on-fail |

### State management

Each module owns its in-memory state. The shared contract is the `Store`:

1. On `init()` — read from `Store`, populate state, call `_render()`
2. On user action — mutate state, call `_persist()`, call `_render()`
3. On `_persist()` failure — revert to snapshot, call `_render()`, show error message

### localStorage schema

| Key | Type | Set by |
|---|---|---|
| `dashboard_user_name` | raw string | `UserNameModule` |
| `dashboard_theme` | raw string (`"light"` \| `"dark"`) | `ThemeModule` |
| `dashboard_tasks` | JSON array of Task objects | `TaskModule` |
| `dashboard_sort_pref` | raw string (`"default"` \| `"alpha"` \| `"status"`) | `TaskModule` |
| `dashboard_links` | JSON array of Link objects | `LinksModule` |

`dashboard_user_name` and `dashboard_theme` are stored as raw strings so the inline `<head>` FOUC-prevention script can read them with `localStorage.getItem` without a JSON parse.

---

## CSS design

`css/style.css` uses **CSS custom properties** for the entire colour palette, making light/dark switching a single class change on `<html>`.

```css
/* Light palette — :root */
--bg: #f5f5f5;  --surface: #ffffff;  --text: #1a1a1a;
--accent: #4a6cf7;  --error: #c0392b;

/* Dark palette — html.dark */
--bg: #0f0f0f;  --surface: #1e1e1e;  --text: #f0f0f0;
--accent: #6b8cff;  --error: #e74c3c;
```

The layout is a **CSS Grid** that adapts to the viewport:

| Breakpoint | Columns |
|---|---|
| 320px – 767px | 1 column |
| 768px – 1199px | 2 columns |
| 1200px – 1920px | 3 columns |

WCAG 2.1 contrast ratios: `#1a1a1a` on `#ffffff` ≈ **16.7 : 1** (light theme), `#f0f0f0` on `#1e1e1e` ≈ **9.5 : 1** (dark theme) — both exceed the 4.5 : 1 minimum for normal text.

---

## Running the tests

The test suite covers the pure-function core (Store, timer formatter, URL helpers) with 56 unit tests.

```bash
npm install       # installs Vitest + fast-check (dev only)
npm test          # runs vitest --run
```

```
 ✓ tests/unit/store.test.js         (14 tests)
 ✓ tests/unit/timer.test.js         (15 tests)
 ✓ tests/unit/links.helpers.test.js (27 tests)

 Test Files  3 passed (3)
      Tests  56 passed (56)
```

The `tests/property/` directory is scaffolded for **property-based tests** using [fast-check](https://fast-check.dev/). The design document defines 26 formal correctness properties (formatter invariants, state machine rules, round-trip persistence, sort immutability, etc.) ready to be encoded as property tests.

---

## Key technical decisions

**No frameworks, no build step.** The entire runtime is three files. You can drop the folder anywhere — a USB drive, an S3 bucket, a GitHub Pages site — and it works.

**Optimistic update with revert.** Every mutation writes to localStorage immediately. If the write fails (e.g. storage quota exceeded), the module reverts its in-memory state and re-renders, so the UI is never out of sync with what's actually persisted.

**Wall-clock minute alignment.** The greeting clock fires at the next `:00` boundary (`setTimeout` to the next full minute, then `setInterval(60000)`), so it always shows the correct minute regardless of when the page loaded.

**FOUC prevention.** An inline `<script>` in `<head>` — before the stylesheet — applies the `dark` class to `<html>` synchronously on every page load, preventing a flash of the wrong theme.

**Single delegated listener per list.** `TaskModule` and `LinksModule` attach one `click` listener to their container element and use `event.target.closest('[data-action]')` to route events. No listeners are re-attached on re-render.

---

## Browser support

Chrome, Firefox, Edge, and Safari — latest stable release. Requires support for:
- `localStorage`
- CSS Grid
- `crypto.randomUUID()` (with `Date.now()` fallback)
- Web Audio API (gracefully skipped if unavailable)
- `prefers-color-scheme` media query

---

## License

MIT
