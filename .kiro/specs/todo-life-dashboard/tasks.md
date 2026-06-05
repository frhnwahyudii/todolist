# Implementation Plan: To-Do List Life Dashboard

## Overview

Build a zero-dependency, static single-page application delivered as `index.html`, `css/style.css`, and `js/app.js`. All state is persisted via `localStorage`. The implementation follows a module-per-widget pattern: `Store`, `GreetingModule`, `UserNameModule`, `TimerModule`, `TaskModule`, `LinksModule`, and `ThemeModule` — each with an `init()` function called on `DOMContentLoaded`. Tests live in `tests/unit/` and `tests/property/` and are run with Vitest `--run`.

---

## Tasks

- [x] 1. Set up project structure, test tooling, and base HTML shell
  - Create directory layout: `css/`, `js/`, `tests/unit/`, `tests/property/`
  - Create `index.html` with semantic sections for each widget, link to `css/style.css` and `js/app.js`, and include the FOUC-prevention inline `<script>` in `<head>`
  - Create empty `css/style.css` and `js/app.js` stubs
  - Install Vitest and fast-check as dev dependencies; add `vitest --run` script to `package.json`
  - _Requirements: 10.1, 10.2, 9.3_

- [x] 2. Implement the Store (localStorage adapter)
  - [x] 2.1 Write `Store` with `get`, `set`, and `remove` methods in `js/app.js`
    - `get(key, fallback)` — `JSON.parse` wrapped in try/catch, returns `fallback` on any error
    - `set(key, value)` — `JSON.stringify` + `setItem`, returns `true`/`false`
    - `remove(key)` — `localStorage.removeItem`
    - _Requirements: 10.3_

  - [ ]* 2.2 Write unit tests for Store
    - Test `get` returns fallback when key is absent or value is malformed JSON
    - Test `set` returns `false` when `localStorage.setItem` throws (mock storage full)
    - Test `remove` deletes the key
    - _Requirements: 10.3_

- [x] 3. Implement ThemeModule and FOUC prevention
  - [x] 3.1 Write the inline `<head>` script that reads `dashboard_theme` (or falls back to `prefers-color-scheme`) and adds the `"dark"` class to `<html>` before first paint
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 3.2 Write `ThemeModule` in `js/app.js` with `init()`, `toggle()`, and `_apply(theme)` methods
    - `init()` binds `#theme-toggle` and reads the persisted theme
    - `toggle()` flips theme, persists via `Store.set`, calls `_apply`
    - `_apply(theme)` adds/removes `"dark"` class on `document.documentElement`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 3.3 Write property test for theme toggle involution (Property 26)
    - **Property 26: Theme toggle is an involution**
    - **Validates: Requirements 9.2**

  - [ ]* 3.4 Write unit tests for ThemeModule
    - Test theme applied from `localStorage` on load
    - Test `prefers-color-scheme` fallback when no stored theme
    - Test `toggle()` switches class on `document.documentElement`
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [x] 4. Implement GreetingModule and UserNameModule
  - [x] 4.1 Write pure helper functions `_formatTime(date)`, `_formatDate(date)`, and `_getGreeting(hour)` in `js/app.js`
    - `_formatTime` returns `HH:MM` string
    - `_formatDate` returns human-readable date (e.g., "Monday, 2 June 2025")
    - `_getGreeting` returns one of the four greeting strings based on hour
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 4.2 Write property test for time formatting (Property 1)
    - **Property 1: Greeting time formatting**
    - **Validates: Requirements 1.1**

  - [ ]* 4.3 Write property test for date formatting (Property 2)
    - **Property 2: Greeting date formatting**
    - **Validates: Requirements 1.2**

  - [ ]* 4.4 Write property test for greeting hour-to-message mapping (Property 3)
    - **Property 3: Greeting hour-to-message mapping is exhaustive and correct**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 4.5 Write `GreetingModule` in `js/app.js` with `init()`, `render()`, and `_scheduleNextMinute()`
    - `init()` binds `#greeting-time`, `#greeting-date`, `#greeting-text`; calls `render()` and `_scheduleNextMinute()`
    - `render()` reads current `Date`, reads `User_Name` from `Store`, updates DOM
    - `_scheduleNextMinute()` uses `setTimeout` to next wall-clock `:00` boundary, then `setInterval(60000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 4.6 Write property test for greeting composition with/without name (Property 4)
    - **Property 4: Greeting composition with and without name**
    - **Validates: Requirements 1.7, 1.8**

  - [x] 4.7 Write `UserNameModule` in `js/app.js` with `init()` and `_onSubmit()`
    - `init()` reads `dashboard_user_name` from `Store`, pre-populates `#username-input`
    - `_onSubmit()` validates length ≤ 50, calls `Store.set` or `Store.remove`, triggers `GreetingModule.render()`
    - Shows inline error in `#username-error` for oversized input
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 4.8 Write property test for user name persistence round-trip (Property 5)
    - **Property 5: User name persistence round-trip**
    - **Validates: Requirements 2.2, 2.4**

  - [ ]* 4.9 Write property test for user name length validation (Property 6)
    - **Property 6: User name length validation rejects oversized input**
    - **Validates: Requirements 2.6**

  - [ ]* 4.10 Write unit tests for GreetingModule and UserNameModule
    - Test minute-boundary scheduling fires at the correct wall-clock time
    - Test empty name submission removes key and clears greeting suffix
    - Test pre-population of `#username-input` on load
    - _Requirements: 1.1, 2.3, 2.4, 2.5_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement TimerModule
  - [x] 6.1 Write the pure `_formatTimer(seconds)` function
    - Returns `MM:SS` string with zero-padded components
    - _Requirements: 3.2, 3.3_

  - [ ]* 6.2 Write property test for timer MM:SS display formatting (Property 7)
    - **Property 7: Timer MM:SS display formatting**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 6.3 Write `TimerModule` state machine with `init()`, `start()`, `stop()`, `reset()`, `_tick()`, `_complete()`, `_playBeep()`, `_render()`, and `_setState()`
    - Internal state: `{ state: 'IDLE'|'RUNNING'|'PAUSED', remaining: number, intervalId: null|number }`
    - `_tick()` decrements `remaining`, calls `_complete()` at 0
    - `_complete()` clears interval, shows `#timer-alert`, calls `_playBeep()`
    - `_playBeep()` uses Web Audio API in try/catch — silently skips if unsupported
    - `_render()` updates `#timer-display`, enables/disables `#timer-start` and `#timer-stop`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ]* 6.4 Write property test for timer stop-then-resume (Property 8)
    - **Property 8: Timer stop-then-resume preserves remaining time**
    - **Validates: Requirements 3.4, 3.9**

  - [ ]* 6.5 Write property test for timer reset producing canonical IDLE state (Property 9)
    - **Property 9: Timer reset always produces canonical IDLE state**
    - **Validates: Requirements 3.5**

  - [ ]* 6.6 Write property test for timer control enablement invariants (Property 10)
    - **Property 10: Timer control enablement invariants**
    - **Validates: Requirements 3.7, 3.8**

  - [ ]* 6.7 Write unit tests for TimerModule
    - Test IDLE → RUNNING → PAUSED → IDLE state transition sequence
    - Test completion alert shown and interval cleared at 00:00
    - Test Web Audio failure does not crash the module
    - Test Start button disabled while running
    - _Requirements: 3.1, 3.6, 3.7, 3.8_

- [x] 7. Implement TaskModule
  - [x] 7.1 Write `_createTask(title)` pure factory function and `_formatTaskId()` helper
    - Produces `{ id, title (trimmed), completed: false, createdAt }` objects
    - Uses `crypto.randomUUID()` or `Date.now().toString()` for `id`
    - _Requirements: 4.2_

  - [ ]* 7.2 Write property test for task creation producing correctly shaped objects (Property 11)
    - **Property 11: Task creation produces correctly shaped objects**
    - **Validates: Requirements 4.2**

  - [ ]* 7.3 Write property test for whitespace-only task titles being rejected (Property 12)
    - **Property 12: Whitespace-only task titles are rejected**
    - **Validates: Requirements 4.3**

  - [x] 7.4 Write `TaskModule` with `init()`, `_addTask()`, `_editTask()`, `_deleteTask()`, `_toggleComplete()`, `_setSort()`, `_getSortedTasks()`, `_persist()`, `_render()`, `_renderTask()`, `_enterEditMode()`, and `_exitEditMode()`
    - `init()` reads `dashboard_tasks` and `dashboard_sort_pref` from `Store`, renders list
    - `_persist()` calls `Store.set`; on failure reverts in-memory state, calls `_render()`, shows error in `#task-error`
    - `_render()` rebuilds `#task-list` innerHTML using `_getSortedTasks()`
    - `_renderTask(task)` returns a `<li>` with `data-task-id`, toggle checkbox, title span, edit button, delete button (all with `data-action` attributes)
    - `_getSortedTasks()` returns a sorted copy without mutating the stored array
    - Attach single delegated `click` listener on `#task-list` using `event.target.closest('[data-action]')`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 7.5 Write property test for task list persistence round-trip (Property 13)
    - **Property 13: Task list persistence round-trip**
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 7.6 Write property test for edit mode pre-population (Property 14)
    - **Property 14: Edit mode pre-populates with current title**
    - **Validates: Requirements 5.2**

  - [ ]* 7.7 Write property test for confirmed edit persisting new title (Property 15)
    - **Property 15: Confirmed edit persists new title**
    - **Validates: Requirements 5.3**

  - [ ]* 7.8 Write property test for edit exit without save preserving original title (Property 16)
    - **Property 16: Edit exit without save preserves original title**
    - **Validates: Requirements 5.4, 5.5**

  - [ ]* 7.9 Write property test for completion toggle as an involution (Property 17)
    - **Property 17: Completion toggle is an involution**
    - **Validates: Requirements 6.2**

  - [ ]* 7.10 Write property test for task deletion removing from persisted list (Property 18)
    - **Property 18: Deletion removes task from persisted list**
    - **Validates: Requirements 6.4**

  - [ ]* 7.11 Write property test for sort not mutating stored task order (Property 19)
    - **Property 19: Sort does not mutate stored task order**
    - **Validates: Requirements 7.2**

  - [ ]* 7.12 Write property test for task mutation resetting active non-default sort (Property 20)
    - **Property 20: Task mutation resets active non-default sort**
    - **Validates: Requirements 7.3**

  - [ ]* 7.13 Write property test for sort preference persistence round-trip (Property 21)
    - **Property 21: Sort preference persistence round-trip**
    - **Validates: Requirements 7.4, 7.5**

  - [ ]* 7.14 Write unit tests for TaskModule
    - Test Enter key confirms edit, Escape key cancels edit
    - Test completed task gets strikethrough + opacity-0.6 style
    - Test `localStorage` write failure reverts UI and shows error message
    - Test sort control resets to "Default" after task mutation while non-default sort is active
    - _Requirements: 5.6, 6.2, 6.5, 7.3_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement LinksModule
  - [x] 9.1 Write pure helpers `_normaliseUrl(url)` and `_validateUrl(url)` and `_validateLabel(label)`
    - `_normaliseUrl`: prepends `https://` when no scheme present; returns URL unchanged otherwise
    - `_validateUrl`: checks host contains a dot, TLD ≥ 2 chars, total length ≤ 2048
    - `_validateLabel`: non-empty string, length ≤ 50
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ]* 9.2 Write property test for URL scheme normalisation (Property 22)
    - **Property 22: URL scheme normalisation always produces a scheme-prefixed URL**
    - **Validates: Requirements 8.4**

  - [x] 9.3 Write `LinksModule` with `init()`, `_addLink()`, `_deleteLink()`, `_persist()`, `_render()`, and `_renderLink()`
    - `init()` reads `dashboard_links` from `Store` (falls back to `[]` on error), renders buttons
    - `_addLink(label, url)` validates inputs, normalises URL, creates Link `{ id, label, url }`, enforces 20-link cap
    - `_persist()` calls `Store.set`; on failure reverts and shows error
    - `_render()` rebuilds `#links-list`; disables `#links-form` submit and shows `#links-limit-msg` when count ≥ 20
    - `_renderLink(link)` returns a `<div>` with an `<a>` button (`target="_blank"`) and a delete control with `data-action="delete-link"` and `data-link-id`
    - Attach single delegated `click` listener on `#links-list`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [ ]* 9.4 Write property test for link persistence round-trip (Property 23)
    - **Property 23: Link persistence round-trip**
    - **Validates: Requirements 8.2**

  - [ ]* 9.5 Write property test for link deletion removing from persisted list (Property 24)
    - **Property 24: Link deletion removes from persisted list**
    - **Validates: Requirements 8.7**

  - [ ]* 9.6 Write property test for link count limit invariant (Property 25)
    - **Property 25: Link count limit invariant**
    - **Validates: Requirements 8.9**

  - [ ]* 9.7 Write unit tests for LinksModule
    - Test empty label or empty URL shows inline error
    - Test link button opens correct URL in new tab (`target="_blank"`)
    - Test `localStorage` read failure renders empty link list
    - Test URL without scheme has `https://` prepended before save
    - _Requirements: 8.3, 8.5, 8.8_

- [x] 10. Wire all modules together and apply base CSS
  - [x] 10.1 Wire all `init()` calls inside the `DOMContentLoaded` listener in `js/app.js`
    - Call in order: `ThemeModule.init()`, `GreetingModule.init()`, `UserNameModule.init()`, `TimerModule.init()`, `TaskModule.init()`, `LinksModule.init()`
    - _Requirements: 10.1_

  - [x] 10.2 Write `css/style.css` with responsive grid layout, light and dark palette, widget card styles, and interactive-control base styles
    - Responsive layout: no horizontal scroll, all controls visible from 320 px to 1920 px
    - `.dark` selector on `<html>` switches to dark background/light foreground palette
    - Completed-task style: `text-decoration: line-through; opacity: 0.6` on the title element
    - Ensure WCAG 2.1 minimum contrast ratios (4.5:1 normal text, 3:1 large text) in both themes
    - _Requirements: 6.2, 9.6, 9.7, 9.8, 10.6, 10.7_

  - [ ]* 10.3 Write integration tests for full module wiring
    - Test `DOMContentLoaded` triggers all `init()` functions
    - Test `UserNameModule._onSubmit()` triggers `GreetingModule.render()` and updated greeting appears in DOM
    - _Requirements: 2.2, 1.7_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation before moving to the next module
- Property tests validate universal correctness properties across a large randomised input space; unit tests cover specific examples, edge cases, and DOM integration
- Run tests with: `npx vitest --run`
- `Store` must be defined before any module in `app.js` since all modules depend on it
- `ThemeModule` must be wired first in the `DOMContentLoaded` handler to avoid a flash of unstyled content after the inline script
- `_getSortedTasks()` must never mutate the canonical `tasks` array — always sort a spread copy

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "6.1", "7.1", "9.1"] },
    { "id": 2, "tasks": ["3.3", "3.4", "4.1", "6.2", "7.2", "7.3", "9.2"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "6.3", "7.4", "9.3"] },
    { "id": 4, "tasks": ["4.6", "4.7", "6.4", "6.5", "6.6", "6.7", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10", "7.11", "7.12", "7.13", "9.4", "9.5", "9.6"] },
    { "id": 5, "tasks": ["4.8", "4.9", "4.10", "7.14", "9.7", "10.1"] },
    { "id": 6, "tasks": ["10.2", "10.3"] }
  ]
}
```
