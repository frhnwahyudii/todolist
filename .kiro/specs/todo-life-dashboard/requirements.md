# Requirements Document

## Introduction

The To-Do List Life Dashboard is a static, single-page web application built with HTML, CSS, and Vanilla JavaScript. It serves as a personal productivity hub that combines a contextual greeting, a focus (Pomodoro-style) timer, a task management list, and a quick-access link panel — all persisted client-side via localStorage. The application targets individuals who want a lightweight, zero-dependency daily dashboard accessible directly from a browser without any backend or installation.

## Glossary

- **Dashboard**: The single-page application rendered by `index.html`.
- **Greeting_Widget**: The UI section displaying the current time, date, and a personalised greeting message.
- **Focus_Timer**: The countdown timer widget supporting 25-minute work sessions.
- **Task_List**: The to-do list widget that manages the user's tasks.
- **Task**: A single to-do item with a title, a completion status, and a creation timestamp.
- **Quick_Links**: The widget displaying user-defined shortcut buttons that open URLs in a new browser tab.
- **Link**: A single quick-link entry with a label and a URL.
- **Theme**: The visual colour scheme of the Dashboard, either "light" or "dark".
- **localStorage**: The browser-native Web Storage API used for all client-side persistence.
- **User_Name**: The custom display name entered by the user, stored in localStorage.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a personalised greeting based on the time of day, so that the Dashboard immediately orients me and feels personal.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in HH:MM format, updated on each wall-clock minute boundary (i.e., when the system clock advances to a new minute, not on a fixed 60-second interval from page load).
2. THE Greeting_Widget SHALL display the current local date in a human-readable format (e.g., "Monday, 2 June 2025").
3. IF the local hour is between 05:00 and 11:59, THEN THE Greeting_Widget SHALL display the greeting "Good Morning".
4. IF the local hour is between 12:00 and 17:59, THEN THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. IF the local hour is between 18:00 and 21:59, THEN THE Greeting_Widget SHALL display the greeting "Good Evening".
6. IF the local hour is between 22:00 and 04:59, THEN THE Greeting_Widget SHALL display the greeting "Good Night".
7. WHEN a User_Name that is a non-empty string of at most 50 characters is stored in localStorage, THE Greeting_Widget SHALL append the User_Name to the greeting message (e.g., "Good Morning, Alex").
8. WHEN no User_Name is stored in localStorage, THE Greeting_Widget SHALL display the greeting without a name suffix.

---

### Requirement 2: Custom User Name

**User Story:** As a user, I want to set and update my display name, so that the Dashboard greets me personally on every visit.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input control that allows the user to enter or edit their User_Name, accepting a maximum of 50 characters.
2. WHEN the user submits a non-empty User_Name, THE Dashboard SHALL persist the User_Name to localStorage under the key "dashboard_user_name".
3. WHEN the user submits an empty string as User_Name, THE Dashboard SHALL remove the "dashboard_user_name" key from localStorage and display the greeting without a name.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the User_Name from localStorage and pre-populate the name input control with the stored value.
5. WHEN no User_Name is stored in localStorage, THE Dashboard SHALL display empty placeholder text "Enter your name" in the name input control.
6. IF the user enters a User_Name exceeding 50 characters, THE Dashboard SHALL not accept the input and SHALL display an inline validation message.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can time focused work sessions without leaving the Dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus_Timer SHALL initialise with a countdown duration of 25 minutes (1500 seconds) and an IDLE state, regardless of any prior timer activity.
2. WHEN the user activates the Start control while the timer is in IDLE state, THE Focus_Timer SHALL begin counting down in one-second decrements and display the remaining time in MM:SS format.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown (whether in RUNNING or PAUSED state) and restore the display to 25:00, transitioning the timer to IDLE state.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically, display a visible in-page alert message (e.g., "Session complete!"), and SHALL play a short audio beep using the Web Audio API if the browser supports it.
7. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the Start control to prevent duplicate intervals.
8. WHILE the Focus_Timer is paused or reset, THE Focus_Timer SHALL disable the Stop control.
9. WHEN the user activates the Start control while the timer is in PAUSED state, THE Focus_Timer SHALL resume counting down from the retained remaining time.

---

### Requirement 4: To-Do List — Add Tasks

**User Story:** As a user, I want to add new tasks to my list, so that I can track what I need to do.

#### Acceptance Criteria

1. THE Task_List SHALL provide a text input and a submission control for creating new Tasks.
2. WHEN the user submits a non-empty task title, THE Task_List SHALL create a new Task object with the following structure: `{ id: <uuid or timestamp string>, title: <string>, completed: false, createdAt: <ISO 8601 timestamp string> }`.
3. WHEN the user submits an empty or whitespace-only task title, THE Task_List SHALL not create a Task and SHALL display an inline validation message with the text "Task title cannot be empty".
4. WHEN a new Task is created, THE Task_List SHALL persist all Tasks to localStorage immediately.
5. WHEN the Dashboard loads, THE Task_List SHALL read all stored Tasks from localStorage and render them in the list.

---

### Requirement 5: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit existing task titles inline, so that I can correct or update tasks without deleting and re-creating them.

#### Acceptance Criteria

1. THE Task_List SHALL provide an edit control for each rendered Task.
2. WHEN the user activates the edit control for a Task, THE Task_List SHALL replace the task title display with an editable text input pre-populated with the current title.
3. WHEN the user confirms the edit with a non-empty value, THE Task_List SHALL update the Task title, re-render the Task in the list, and persist the updated Tasks to localStorage.
4. WHEN the user confirms the edit with an empty or whitespace-only value (i.e., the value after trimming leading and trailing whitespace has length 0), THE Task_List SHALL not update the Task, SHALL exit edit mode, and SHALL restore the original title display.
5. WHEN the user cancels the edit (e.g., presses Escape), THE Task_List SHALL exit edit mode, discard changes, and restore the original title display.
6. WHEN the user is in edit mode for a Task, pressing Enter SHALL confirm the edit.

---

### Requirement 6: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can maintain an accurate and clean task list.

#### Acceptance Criteria

1. THE Task_List SHALL provide a completion toggle control (e.g., checkbox) for each rendered Task.
2. WHEN the user toggles the completion control for a Task, THE Task_List SHALL invert the Task's completion status, apply a visual "completed" style consisting of text-decoration strikethrough and reduced opacity (0.6) on the task title element, and persist the updated Tasks to localStorage.
3. THE Task_List SHALL provide a delete control for each rendered Task.
4. WHEN the user activates the delete control for a Task, THE Task_List SHALL remove the Task from the list without displaying a confirmation dialog, re-render the list, and persist the updated Tasks to localStorage. THE Task_List SHALL only remove Tasks in response to an explicit user action.
5. IF localStorage write fails when toggling completion or deleting a Task, THE Task_List SHALL revert the UI change and display an error message.

---

### Requirement 7: To-Do List — Sort Tasks

**User Story:** As a user, I want to sort my task list by different criteria, so that I can quickly find or prioritise tasks.

#### Acceptance Criteria

1. THE Task_List SHALL provide a sort control offering at minimum the following sort options: "Default (creation order)", "Alphabetical (A–Z)", "Status (incomplete first)".
2. WHEN the user selects a sort option, THE Task_List SHALL re-render the list in the selected order without altering the underlying stored data.
3. WHEN the user marks a task complete, edits a task title, adds a new task, or deletes a task while a non-default sort order is active, THE Task_List SHALL reset the sort control to "Default (creation order)" and re-render the list in creation order.
4. WHEN the Dashboard loads AND a sort preference is stored in localStorage, THE Task_List SHALL apply the stored sort preference. IF no sort preference is stored in localStorage, THE Task_List SHALL use "Default (creation order)".
5. WHEN the user selects a sort option, THE Task_List SHALL persist the selected sort preference to localStorage.

---

### Requirement 8: Quick Links — Manage Links

**User Story:** As a user, I want to add and remove shortcut buttons to my favourite websites, so that I can open them quickly from the Dashboard.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL provide a form with a label input and a URL input for adding new Links.
2. WHEN the user submits the form with a non-empty label (maximum 50 characters) and a valid URL (containing a host with at least one dot and a TLD of at least 2 characters, maximum 2048 characters), THE Quick_Links widget SHALL create a new Link, render a corresponding button, and persist all Links to localStorage.
3. WHEN the user submits the form with an empty label or an empty URL field, THE Quick_Links widget SHALL not create a Link and SHALL display an inline validation message.
4. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Quick_Links widget SHALL prepend "https://" to the URL before saving.
5. WHEN the user activates a Link button, THE Dashboard SHALL open the associated URL in a new browser tab.
6. THE Quick_Links widget SHALL provide a delete control for each rendered Link button.
7. WHEN the user activates the delete control for a Link, THE Quick_Links widget SHALL remove the Link, re-render the widget, and persist the updated Links to localStorage.
8. WHEN the Dashboard loads, THE Quick_Links widget SHALL read all stored Links from localStorage and render the corresponding buttons. IF localStorage read fails, THE Quick_Links widget SHALL render with an empty link list.
9. THE Quick_Links widget SHALL support a maximum of 20 Links. WHEN the limit is reached, THE submission control SHALL be disabled and a message "Maximum 20 links reached" SHALL be displayed.

---

### Requirement 9: Light / Dark Mode Toggle

**User Story:** As a user, I want to switch between a light and dark colour scheme, so that the Dashboard is comfortable to use in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme toggle control visible at all times.
2. WHEN the user activates the Theme toggle, THE Dashboard SHALL switch the active Theme between "light" and "dark" and persist the selected Theme to localStorage.
3. WHEN the Dashboard loads, THE Dashboard SHALL read the stored Theme from localStorage and apply the theme class to the root `<html>` element before the first visible paint, achieved via an inline `<script>` in `<head>`, to prevent a flash of unstyled content.
4. WHEN no Theme is stored in localStorage, THE Dashboard SHALL apply the Theme that matches the browser's `prefers-color-scheme` media query value.
5. IF localStorage read fails on load, THE Dashboard SHALL fall back to the `prefers-color-scheme` value.
6. WHILE the "dark" Theme is active, THE Dashboard SHALL apply a dark background and light foreground colour palette to all widgets.
7. IF CSS fails to apply the "dark" palette, THE Dashboard SHALL leave the stored theme state unchanged.
8. WHILE the "light" Theme is active, THE Dashboard SHALL apply a light background and dark foreground colour palette to all widgets.
9. IF CSS fails to apply the "light" palette, THE Dashboard SHALL leave the stored theme state unchanged.

---

### Requirement 10: Technical and Non-Functional Constraints

**User Story:** As a developer, I want the Dashboard to be built with plain HTML, CSS, and Vanilla JavaScript only, so that it runs in any modern browser with no build step, no dependencies, and no backend.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented as a single `index.html` file at the project root, one CSS file at `css/style.css`, and one JavaScript file at `js/app.js`, with no other `.html`, `.css`, or `.js` source files; static assets such as images, icons, and fonts are permitted.
2. THE Dashboard SHALL not include or reference any external JavaScript frameworks, CSS frameworks, or third-party libraries.
3. THE Dashboard SHALL use only the localStorage Web Storage API for all data persistence; no cookies, IndexedDB, sessionStorage, or server calls SHALL be used for persistence.
4. THE Dashboard SHALL render and function correctly in the latest stable release of Chrome, Firefox, Edge, and Safari available at the time of delivery.
5. THE Dashboard SHALL complete initial render (measured to the DOMContentLoaded event) within 2 seconds on a standard desktop connection (minimum 10 Mbps) with no network requests beyond loading its own static files.
6. THE Dashboard SHALL use a responsive layout that, on viewport widths from 320 px to 1920 px, displays no horizontal scrollbar, no overlapping content, and all interactive controls fully visible and tappable.
7. THE Dashboard SHALL maintain sufficient colour contrast in both Theme variants: normal text SHALL meet a minimum contrast ratio of 4.5:1 and large text SHALL meet a minimum contrast ratio of 3:1, as calculated using the WCAG 2.1 relative-luminance formula.
