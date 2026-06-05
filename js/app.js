// js/app.js — full implementation

// ---------------------------------------------------------------------------
// Store — localStorage adapter
// All modules use Store exclusively; raw localStorage is never used elsewhere.
// ---------------------------------------------------------------------------
const Store = {
  /**
   * Retrieve a value from localStorage and JSON.parse it.
   * Returns `fallback` if the key is absent, the value is malformed JSON,
   * or localStorage throws for any reason.
   *
   * @param {string} key
   * @param {*} fallback - returned on any error (default: null)
   * @returns {*}
   */
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  },

  /**
   * JSON.stringify the value and write it to localStorage.
   * Returns true on success, false if serialisation or storage throws.
   *
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  },

  /**
   * Remove a key from localStorage.
   *
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem(key);
  },
};

// ---------------------------------------------------------------------------
// _formatTimer — pure helper for the Focus Timer display
// ---------------------------------------------------------------------------

/**
 * Format a duration in seconds as a zero-padded MM:SS string.
 *
 * @param {number} seconds - integer in the range [0, 1500]
 * @returns {string} e.g. "25:00", "04:59", "00:00"
 */
function _formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// TimerModule — 25-minute Pomodoro countdown state machine
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
// ---------------------------------------------------------------------------
const TimerModule = {
  /**
   * Internal state for the timer.
   * @type {{ state: 'IDLE'|'RUNNING'|'PAUSED', remaining: number, intervalId: null|number }}
   */
  _state: {
    state: 'IDLE',
    remaining: 1500,
    intervalId: null,
  },

  // DOM element references (cached in init)
  _startBtn: null,
  _stopBtn: null,
  _resetBtn: null,
  _display: null,
  _alert: null,

  /**
   * Bind DOM elements and initialise to IDLE state.
   * Requirements: 3.1
   */
  init() {
    this._startBtn = document.getElementById('timer-start');
    this._stopBtn = document.getElementById('timer-stop');
    this._resetBtn = document.getElementById('timer-reset');
    this._display = document.getElementById('timer-display');
    this._alert = document.getElementById('timer-alert');

    this._state.state = 'IDLE';
    this._state.remaining = 1500;
    this._state.intervalId = null;

    if (this._startBtn) {
      this._startBtn.addEventListener('click', () => TimerModule.start());
    }
    if (this._stopBtn) {
      this._stopBtn.addEventListener('click', () => TimerModule.stop());
    }
    if (this._resetBtn) {
      this._resetBtn.addEventListener('click', () => TimerModule.reset());
    }

    this._render();
  },

  /**
   * Start the countdown from IDLE or PAUSED state.
   * Requirements: 3.2, 3.7, 3.9
   */
  start() {
    if (this._state.state === 'IDLE' || this._state.state === 'PAUSED') {
      this._state.state = 'RUNNING';
      this._state.intervalId = setInterval(() => TimerModule._tick(), 1000);
      this._render();
    }
  },

  /**
   * Pause the countdown while RUNNING, retaining remaining time.
   * Requirements: 3.4, 3.8
   */
  stop() {
    if (this._state.state === 'RUNNING') {
      clearInterval(this._state.intervalId);
      this._state.intervalId = null;
      this._state.state = 'PAUSED';
      this._render();
    }
  },

  /**
   * Stop any countdown and restore to canonical IDLE state (25:00).
   * Requirements: 3.5
   */
  reset() {
    clearInterval(this._state.intervalId);
    this._state.intervalId = null;
    this._state.remaining = 1500;
    this._state.state = 'IDLE';
    if (this._alert) {
      this._alert.textContent = '';
    }
    this._render();
  },

  /**
   * Decrement remaining by 1 each second; trigger _complete() at zero.
   * Requirements: 3.3, 3.6
   */
  _tick() {
    this._state.remaining -= 1;
    this._render();
    if (this._state.remaining === 0) {
      this._complete();
    }
  },

  /**
   * Handle session completion: stop interval, show alert, play beep.
   * Requirements: 3.6
   */
  _complete() {
    clearInterval(this._state.intervalId);
    this._state.intervalId = null;
    this._state.state = 'IDLE';
    if (this._alert) {
      this._alert.textContent = 'Session complete!';
    }
    this._render();
    this._playBeep();
  },

  /**
   * Play a short 0.2s beep using the Web Audio API.
   * Silently skipped if the browser does not support AudioContext.
   * Requirements: 3.6
   */
  _playBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (_) {
      // Silently skip if Web Audio API is unavailable or blocked
    }
  },

  /**
   * Update #timer-display and enable/disable controls based on current state.
   * Requirements: 3.2, 3.7, 3.8
   */
  _render() {
    if (this._display) {
      this._display.textContent = _formatTimer(this._state.remaining);
    }
    const isRunning = this._state.state === 'RUNNING';
    if (this._startBtn) {
      this._startBtn.disabled = isRunning;
    }
    if (this._stopBtn) {
      this._stopBtn.disabled = !isRunning;
    }
  },

  /**
   * Transition to a new state and re-render.
   *
   * @param {'IDLE'|'RUNNING'|'PAUSED'} newState
   */
  _setState(newState) {
    this._state.state = newState;
    this._render();
  },
};

// ---------------------------------------------------------------------------
// ThemeModule — persists and applies the light/dark theme
// ---------------------------------------------------------------------------
const ThemeModule = {
  /** @type {'light'|'dark'} */
  _current: 'light',

  /**
   * Bind the #theme-toggle button, read the persisted theme (or fall back to
   * prefers-color-scheme), and apply the theme immediately.
   */
  init() {
    const btn = document.getElementById('theme-toggle');

    // Determine the initial theme
    let stored = localStorage.getItem('dashboard_theme'); // raw string, not JSON
    if (stored !== 'light' && stored !== 'dark') {
      // No valid stored value — use prefers-color-scheme
      stored = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    this._current = stored;
    this._apply(this._current);

    if (btn) {
      btn.addEventListener('click', () => ThemeModule.toggle());
    }
  },

  /**
   * Flip the current theme (light ↔ dark), persist it, and apply the new class.
   * dashboard_theme is stored as a raw string (not JSON-wrapped) so the inline
   * <head> script can read it with localStorage.getItem without JSON.parse.
   */
  toggle() {
    const newTheme = this._current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('dashboard_theme', newTheme);
    this._current = newTheme;
    this._apply(newTheme);
  },

  /**
   * Add or remove the 'dark' class on <html> and update the toggle button icon.
   *
   * @param {'light'|'dark'} theme
   */
  _apply(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update toggle button icon/label
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      if (theme === 'dark') {
        btn.textContent = '☀️';
        btn.setAttribute('aria-label', 'Switch to light theme');
      } else {
        btn.textContent = '🌙';
        btn.setAttribute('aria-label', 'Switch to dark theme');
      }
    }
  },
};

// ---------------------------------------------------------------------------
// Task helpers — pure factory functions (Requirements: 4.2)
// ---------------------------------------------------------------------------

/**
 * Generate a unique ID string.
 * Uses crypto.randomUUID() when available; falls back to Date.now().toString().
 *
 * @returns {string}
 */
function _formatTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString();
}

/**
 * Create a new Task object from a raw title string.
 * The title is trimmed before being stored.
 *
 * @param {string} title - Raw input from the user (will be trimmed)
 * @returns {{ id: string, title: string, completed: boolean, createdAt: string }}
 */
function _createTask(title) {
  return {
    id: _formatTaskId(),
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// LinksModule pure helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a URL by prepending "https://" when no scheme is present.
 *
 * @param {string} url
 * @returns {string}
 */
function _normaliseUrl(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return 'https://' + url;
}

/**
 * Validate a URL (after normalisation).
 * Rules:
 *   - Total length ≤ 2048 characters
 *   - Host must contain at least one dot
 *   - The TLD (part after the last dot in the host) must be ≥ 2 characters
 *
 * @param {string} url - may or may not have a scheme; normalisation is applied internally
 * @returns {boolean}
 */
function _validateUrl(url) {
  const normalised = _normaliseUrl(url);
  if (normalised.length > 2048) return false;
  try {
    const parsed = new URL(normalised);
    const host = parsed.hostname; // e.g. "example.com", "sub.example.co.uk"
    const dotIndex = host.lastIndexOf('.');
    if (dotIndex === -1) return false; // no dot at all
    const tld = host.slice(dotIndex + 1);
    if (tld.length < 2) return false;
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Validate a link label.
 * Rules:
 *   - Must be a non-empty string
 *   - Length ≤ 50 characters
 *
 * @param {string} label
 * @returns {boolean}
 */
function _validateLabel(label) {
  return typeof label === 'string' && label.length > 0 && label.length <= 50;
}

// ---------------------------------------------------------------------------
// Greeting pure helpers (Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6)
// ---------------------------------------------------------------------------

/**
 * Format a Date object as a zero-padded HH:MM string using local time.
 *
 * @param {Date} date
 * @returns {string} e.g. "09:05", "23:59"
 */
function _formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return hours + ':' + minutes;
}

/**
 * Format a Date object as a human-readable local date string.
 * e.g. "Monday, 2 June 2025"
 *
 * @param {Date} date
 * @returns {string}
 */
function _formatDate(date) {
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return weekday + ', ' + day + ' ' + month + ' ' + year;
}

/**
 * Return a time-of-day greeting string based on the given hour (0–23).
 *
 * - "Good Morning"   when hour ∈ [5, 11]
 * - "Good Afternoon" when hour ∈ [12, 17]
 * - "Good Evening"   when hour ∈ [18, 21]
 * - "Good Night"     when hour ∈ [0, 4] or [22, 23]
 *
 * @param {number} hour - integer in [0, 23]
 * @returns {string}
 */
function _getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 21) return 'Good Evening';
  return 'Good Night';
}

// ---------------------------------------------------------------------------
// GreetingModule — displays time, date, and personalised greeting
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
// ---------------------------------------------------------------------------
const GreetingModule = {
  // DOM element references (cached in init)
  _timeEl: null,
  _dateEl: null,
  _textEl: null,

  /**
   * Bind DOM refs, render immediately, then schedule the first minute refresh.
   * Requirements: 1.1, 1.2
   */
  init() {
    this._timeEl = document.getElementById('greeting-time');
    this._dateEl = document.getElementById('greeting-date');
    this._textEl = document.getElementById('greeting-text');

    this.render();
    this._scheduleNextMinute();
  },

  /**
   * Read the current Date, update all three greeting DOM elements.
   *
   * - #greeting-time  ← _formatTime(now)
   * - #greeting-date  ← _formatDate(now)
   * - #greeting-text  ← _getGreeting(hour) optionally suffixed with ", <name>"
   *
   * User_Name is read directly from localStorage as a raw string
   * (not JSON-wrapped — matching how UserNameModule stores it).
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
   */
  render() {
    const now = new Date();

    if (this._timeEl) {
      this._timeEl.textContent = _formatTime(now);
    }

    if (this._dateEl) {
      this._dateEl.textContent = _formatDate(now);
    }

    if (this._textEl) {
      const greeting = _getGreeting(now.getHours());
      // dashboard_user_name is stored as a raw string (not JSON), so use
      // localStorage.getItem directly rather than Store.get (which JSON-parses).
      const name = localStorage.getItem('dashboard_user_name');
      this._textEl.textContent = (name && name.length > 0)
        ? greeting + ', ' + name
        : greeting;
    }
  },

  /**
   * Schedule a refresh at the next wall-clock minute boundary (:00 seconds).
   * After that first boundary fires, start a regular 60-second interval.
   *
   * This ensures the clock always reads the correct minute regardless of
   * when the page was loaded within a minute.
   * Requirements: 1.1
   */
  _scheduleNextMinute() {
    const now = new Date();
    // Milliseconds remaining until the next full minute
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    setTimeout(() => {
      GreetingModule.render();
      // From here on, re-render once per minute on the :00 boundary
      setInterval(() => GreetingModule.render(), 60000);
    }, msUntilNextMinute);
  },
};

// ---------------------------------------------------------------------------
// UserNameModule — manages the custom display name input
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
// ---------------------------------------------------------------------------
const UserNameModule = {
  // DOM element references (cached in init)
  _input: null,
  _submitBtn: null,
  _errorEl: null,

  /**
   * Read the stored user name from localStorage (raw string, not JSON),
   * pre-populate #username-input, and wire up submit handlers.
   *
   * Requirements: 2.4, 2.5
   */
  init() {
    this._input     = document.getElementById('username-input');
    this._submitBtn = document.getElementById('username-submit');
    this._errorEl   = document.getElementById('username-error');

    // dashboard_user_name is stored as a raw string — use getItem directly,
    // not Store.get (which would JSON.parse and wrap strings in quotes).
    const stored = localStorage.getItem('dashboard_user_name');
    if (this._input) {
      this._input.value = stored !== null ? stored : '';
    }

    // Bind submit button click
    if (this._submitBtn) {
      this._submitBtn.addEventListener('click', () => UserNameModule._onSubmit());
    }

    // Bind Enter key on the input field
    if (this._input) {
      this._input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          UserNameModule._onSubmit();
        }
      });
    }
  },

  /**
   * Validate the current value of #username-input and persist or remove the
   * user name accordingly.
   *
   * Validation rules (Requirements 2.6, 2.2, 2.3):
   *   - length > 50  → show error "Name must be 50 characters or fewer"; return
   *   - trim non-empty (length ≤ 50) → setItem('dashboard_user_name', trimmed value)
   *   - trim empty (length ≤ 50)     → removeItem('dashboard_user_name')
   *
   * After a successful save/remove, clear any error and call GreetingModule.render().
   * Requirements: 2.2, 2.3, 2.6
   */
  _onSubmit() {
    if (!this._input) return;

    const value = this._input.value;

    // Requirement 2.6 — reject oversized input
    if (value.length > 50) {
      if (this._errorEl) {
        this._errorEl.textContent = 'Name must be 50 characters or fewer';
      }
      return;
    }

    // Clear any previous error
    if (this._errorEl) {
      this._errorEl.textContent = '';
    }

    if (value.trim().length > 0) {
      // Requirement 2.2 — persist non-empty trimmed name as a raw string
      localStorage.setItem('dashboard_user_name', value.trim());
    } else {
      // Requirement 2.3 — remove key when input is empty/whitespace
      localStorage.removeItem('dashboard_user_name');
    }

    // Requirement 1.7 / 1.8 — refresh greeting to reflect new name
    GreetingModule.render();
  },
};

// ---------------------------------------------------------------------------
// TaskModule — full CRUD task management with sort support
// Requirements: 4.1–4.5, 5.1–5.6, 6.1–6.5, 7.1–7.5
// ---------------------------------------------------------------------------
const TaskModule = {
  /** @type {{ id: string, title: string, completed: boolean, createdAt: string }[]} */
  tasks: [],

  /** @type {string} — "default" | "alpha" | "status" */
  sortPref: 'default',

  /** @type {string|null} — id of task currently in edit mode */
  editingId: null,

  // DOM element references (set in init)
  _taskList: null,
  _taskInput: null,
  _taskSubmit: null,
  _taskSort: null,
  _taskError: null,

  /**
   * Read persisted state from Store, wire up event listeners, render list.
   */
  init() {
    this._taskList   = document.getElementById('task-list');
    this._taskInput  = document.getElementById('task-input');
    this._taskSubmit = document.getElementById('task-submit');
    this._taskSort   = document.getElementById('task-sort');
    this._taskError  = document.getElementById('task-error');

    // Restore state from localStorage
    this.tasks    = Store.get('dashboard_tasks', []);
    this.sortPref = Store.get('dashboard_sort_pref', 'default') || 'default';

    // Add-task: submit button click
    if (this._taskSubmit) {
      this._taskSubmit.addEventListener('click', () => {
        this._addTask(this._taskInput ? this._taskInput.value : '');
      });
    }

    // Add-task: Enter key on input
    if (this._taskInput) {
      this._taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this._addTask(this._taskInput.value);
        }
      });
    }

    // Sort change
    if (this._taskSort) {
      this._taskSort.addEventListener('change', () => {
        this._setSort(this._taskSort.value);
      });
    }

    // Delegated click listener on the task list container
    if (this._taskList) {
      this._taskList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const li = btn.closest('[data-task-id]');
        if (!li) return;
        const id = li.dataset.taskId;
        switch (btn.dataset.action) {
          case 'toggle': this._toggleComplete(id); break;
          case 'edit':   this._enterEditMode(id);   break;
          case 'delete': this._deleteTask(id);      break;
        }
      });
    }

    this._render();
  },

  /**
   * Add a new task.
   * Validates the title; shows error in #task-error on empty input.
   *
   * @param {string} title
   */
  _addTask(title) {
    if (this._taskError) this._taskError.textContent = '';

    if (!title || title.trim() === '') {
      if (this._taskError) this._taskError.textContent = 'Task title cannot be empty';
      return;
    }

    const task = _createTask(title);
    this.tasks.push(task);
    this._persist();
    this.sortPref = 'default';
    Store.set('dashboard_sort_pref', 'default');
    this._render();

    if (this._taskInput) this._taskInput.value = '';
  },

  /**
   * Update a task's title after an inline edit.
   * If the new title is empty/whitespace, exit edit mode without saving.
   *
   * @param {string} id
   * @param {string} newTitle
   */
  _editTask(id, newTitle) {
    if (!newTitle || newTitle.trim() === '') {
      // Exit edit mode without updating
      this.editingId = null;
      this._render();
      return;
    }

    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    task.title = newTitle.trim();
    this.editingId = null;
    this._persist();
    this.sortPref = 'default';
    Store.set('dashboard_sort_pref', 'default');
    this._render();
  },

  /**
   * Remove a task from the list.
   * Reverts on persist failure.
   *
   * @param {string} id
   */
  _deleteTask(id) {
    const snapshot = this.tasks.slice();
    this.tasks = this.tasks.filter(t => t.id !== id);

    if (!this._persist(snapshot)) return; // revert was already handled in _persist

    this.sortPref = 'default';
    Store.set('dashboard_sort_pref', 'default');
    this._render();
  },

  /**
   * Invert a task's completion status.
   * Reverts on persist failure.
   *
   * @param {string} id
   */
  _toggleComplete(id) {
    const snapshot = this.tasks.slice();
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;

    if (!this._persist(snapshot)) return;

    this.sortPref = 'default';
    Store.set('dashboard_sort_pref', 'default');
    this._render();
  },

  /**
   * Change and persist the sort preference, then re-render.
   *
   * @param {string} option — "default" | "alpha" | "status"
   */
  _setSort(option) {
    this.sortPref = option;
    Store.set('dashboard_sort_pref', option);
    this._render();
  },

  /**
   * Return a sorted copy of the tasks array without mutating the original.
   * "default"  → creation order (original array order)
   * "alpha"    → A–Z by title (case-insensitive)
   * "status"   → incomplete first, then completed
   *
   * @returns {{ id: string, title: string, completed: boolean, createdAt: string }[]}
   */
  _getSortedTasks() {
    const copy = this.tasks.slice();
    if (this.sortPref === 'alpha') {
      copy.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    } else if (this.sortPref === 'status') {
      copy.sort((a, b) => {
        // incomplete (false) before completed (true)
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    }
    // "default" → no-op; original insertion order is preserved by slice()
    return copy;
  },

  /**
   * Persist tasks to localStorage.
   * If a snapshot is provided and Store.set fails, revert to the snapshot,
   * re-render, and show an error message.
   *
   * @param {Array} [snapshot] — previous tasks array to revert to on failure
   * @returns {boolean} — true if persist succeeded, false otherwise
   */
  _persist(snapshot) {
    const ok = Store.set('dashboard_tasks', this.tasks);
    if (!ok) {
      if (snapshot) {
        this.tasks = snapshot;
      }
      this._render();
      if (this._taskError) {
        this._taskError.textContent = 'Could not save changes. Storage may be full.';
      }
      return false;
    }
    return true;
  },

  /**
   * Rebuild the #task-list DOM from the sorted task array.
   * Also syncs #task-sort value to the current sortPref.
   */
  _render() {
    if (!this._taskList) return;

    // Clear existing list
    this._taskList.innerHTML = '';

    const sorted = this._getSortedTasks();
    sorted.forEach(task => {
      this._taskList.appendChild(this._renderTask(task));
    });

    // Sync sort control
    if (this._taskSort) this._taskSort.value = this.sortPref;

    // If a task is in edit mode, re-enter it after re-render
    if (this.editingId) {
      // Re-enter edit mode for the editing task
      const li = this._taskList.querySelector(`[data-task-id="${this.editingId}"]`);
      if (li) this._activateEditInput(li, this.editingId);
    }
  },

  /**
   * Build a <li> element for a single task.
   *
   * @param {{ id: string, title: string, completed: boolean, createdAt: string }} task
   * @returns {HTMLLIElement}
   */
  _renderTask(task) {
    const li = document.createElement('li');
    li.dataset.taskId = task.id;

    // Checkbox toggle
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.dataset.action = 'toggle';
    checkbox.setAttribute('aria-label', `Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`);

    // Title span
    const titleSpan = document.createElement('span');
    titleSpan.classList.add('task-title');
    titleSpan.textContent = task.title;
    if (task.completed) {
      titleSpan.style.textDecoration = 'line-through';
      titleSpan.style.opacity = '0.6';
    }

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.dataset.action = 'edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.title}`);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.title}`);

    li.appendChild(checkbox);
    li.appendChild(titleSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    return li;
  },

  /**
   * Switch a task row into edit mode:
   * replace the title span with a text input pre-populated with the current title.
   *
   * @param {string} id
   */
  _enterEditMode(id) {
    // If already editing another task, exit it without saving first
    if (this.editingId && this.editingId !== id) {
      this._exitEditMode(this.editingId, false);
    }

    this.editingId = id;

    const li = this._taskList
      ? this._taskList.querySelector(`[data-task-id="${id}"]`)
      : null;
    if (!li) return;

    this._activateEditInput(li, id);
  },

  /**
   * Internal helper: replace title span in `li` with an <input> for editing.
   *
   * @param {HTMLLIElement} li
   * @param {string} id
   */
  _activateEditInput(li, id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    const titleSpan = li.querySelector('.task-title');
    if (!titleSpan) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = task.title;
    input.classList.add('task-edit-input');
    input.setAttribute('aria-label', `Edit title for task: ${task.title}`);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._exitEditMode(id, true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this._exitEditMode(id, false);
      }
    });

    // Replace the span with the input
    li.replaceChild(input, titleSpan);
    input.focus();
    // Place cursor at end
    input.setSelectionRange(input.value.length, input.value.length);
  },

  /**
   * Exit edit mode for a task.
   * If save=true and the input value is non-empty, call _editTask to persist.
   * Otherwise restore the original title span.
   *
   * @param {string} id
   * @param {boolean} save
   */
  _exitEditMode(id, save) {
    const li = this._taskList
      ? this._taskList.querySelector(`[data-task-id="${id}"]`)
      : null;

    if (!li) {
      this.editingId = null;
      return;
    }

    const input = li.querySelector('.task-edit-input');
    const newTitle = input ? input.value : '';

    this.editingId = null;

    if (save && newTitle.trim() !== '') {
      // _editTask will call _render() after persisting
      this._editTask(id, newTitle);
    } else {
      // Restore original title span without mutating state
      this._render();
    }
  },
};

// ---------------------------------------------------------------------------
// LinksModule — manage up to 20 quick-link buttons (Requirements: 8.1–8.9)
// ---------------------------------------------------------------------------
const LinksModule = {
  /** @type {{ id: string, label: string, url: string }[]} */
  _state: { links: [] },

  /**
   * Read persisted links from Store and render the list.
   * Falls back to an empty array if nothing is stored or read fails.
   */
  init() {
    const stored = Store.get('dashboard_links', []);
    this._state.links = Array.isArray(stored) ? stored : [];
    this._render();

    // Attach single delegated click listener on #links-list
    const list = document.getElementById('links-list');
    if (list) {
      list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === 'delete-link') {
          const linkId = btn.dataset.linkId;
          if (linkId) LinksModule._deleteLink(linkId);
        }
      });
    }

    // Attach form submit listener
    const form = document.getElementById('links-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const labelInput = document.getElementById('links-label');
        const urlInput = document.getElementById('links-url');
        const label = labelInput ? labelInput.value : '';
        const url = urlInput ? urlInput.value : '';
        LinksModule._addLink(label, url);
      });
    }
  },

  /**
   * Show an error message in #links-error.
   *
   * @param {string} message
   */
  _showError(message) {
    const el = document.getElementById('links-error');
    if (el) el.textContent = message;
  },

  /**
   * Clear the error message in #links-error.
   */
  _clearError() {
    const el = document.getElementById('links-error');
    if (el) el.textContent = '';
  },

  /**
   * Validate, normalise, and add a new link.
   * Enforces the 20-link cap.
   *
   * @param {string} label
   * @param {string} url
   */
  _addLink(label, url) {
    // Validate label
    if (!_validateLabel(label)) {
      this._showError('Label must be 1–50 characters');
      return;
    }

    // Validate URL
    if (!_validateUrl(url)) {
      this._showError('Please enter a valid URL');
      return;
    }

    // Enforce 20-link cap
    if (this._state.links.length >= 20) {
      this._showError('Maximum 20 links reached');
      return;
    }

    this._clearError();

    const normalisedUrl = _normaliseUrl(url);

    /** @type {{ id: string, label: string, url: string }} */
    const link = {
      id: _formatTaskId(),
      label: label.trim(),
      url: normalisedUrl,
    };

    this._state.links.push(link);
    this._persist();
    this._render();

    // Clear input fields
    const labelInput = document.getElementById('links-label');
    const urlInput = document.getElementById('links-url');
    if (labelInput) labelInput.value = '';
    if (urlInput) urlInput.value = '';
  },

  /**
   * Remove a link by id, persist, and re-render.
   * Reverts on persistence failure.
   *
   * @param {string} id
   */
  _deleteLink(id) {
    const snapshot = this._state.links.slice();
    this._state.links = this._state.links.filter((l) => l.id !== id);
    const ok = this._persist();
    if (!ok) {
      this._state.links = snapshot;
    }
    this._render();
  },

  /**
   * Persist links to Store.
   * On failure: reverts in-memory state, re-renders, shows error.
   * Returns true on success, false on failure.
   *
   * @returns {boolean}
   */
  _persist() {
    const snapshot = this._state.links.slice();
    const ok = Store.set('dashboard_links', this._state.links);
    if (!ok) {
      this._state.links = snapshot;
      this._render();
      this._showError('Could not save changes. Storage may be full.');
      return false;
    }
    return true;
  },

  /**
   * Rebuild #links-list from current state.
   * Disables the submit button and shows the limit message when count ≥ 20.
   */
  _render() {
    const list = document.getElementById('links-list');
    if (!list) return;

    // Rebuild list contents
    list.innerHTML = '';
    this._state.links.forEach((link) => {
      list.appendChild(this._renderLink(link));
    });

    // Handle 20-link cap UI
    const form = document.getElementById('links-form');
    const limitMsg = document.getElementById('links-limit-msg');
    const submitBtn = form ? form.querySelector('[type="submit"]') : null;

    if (this._state.links.length >= 20) {
      if (submitBtn) submitBtn.disabled = true;
      if (limitMsg) limitMsg.hidden = false;
    } else {
      if (submitBtn) submitBtn.disabled = false;
      if (limitMsg) limitMsg.hidden = true;
    }
  },

  /**
   * Create and return a <div> element representing a single link.
   * Contains an <a> button and a delete button.
   *
   * @param {{ id: string, label: string, url: string }} link
   * @returns {HTMLDivElement}
   */
  _renderLink(link) {
    const div = document.createElement('div');
    div.setAttribute('role', 'listitem');
    div.dataset.linkId = link.id;

    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.setAttribute('role', 'button');
    anchor.textContent = link.label;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.dataset.action = 'delete-link';
    deleteBtn.dataset.linkId = link.id;
    deleteBtn.setAttribute('aria-label', 'Delete link: ' + link.label);
    deleteBtn.textContent = '✕';

    div.appendChild(anchor);
    div.appendChild(deleteBtn);

    return div;
  },
};

// ---------------------------------------------------------------------------
// DOMContentLoaded — module init calls wired in task 10
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  // ThemeModule must run first to avoid any flash of unstyled content
  // after the inline <head> script (Requirements: 10.1)
  ThemeModule.init();
  GreetingModule.init();
  UserNameModule.init();
  TimerModule.init();
  TaskModule.init();
  LinksModule.init();
});
