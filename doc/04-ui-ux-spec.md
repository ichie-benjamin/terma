# Terma — UI/UX Specification

## Design Philosophy

- **Code editor aesthetic** — Dark by default, monospace typography, minimal chrome.
- **Familiar patterns** — Sidebar tree behaves like VS Code's file explorer.
- **No clutter** — Every pixel serves a purpose. No decorative elements.
- **Keyboard-first** — All actions accessible via keyboard. Mouse is optional.

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Terma                                        ─  □  ✕       │  ← Title bar (native)
├────────────────┬─────────────────────────────────────────────┤
│                │                                             │
│   S I D E B A R│         T E R M I N A L   P A N E L        │
│   (resizable)  │                                             │
│   width: 240px │         Active terminal session             │
│   min: 180px   │         rendered with xterm.js              │
│   max: 400px   │                                             │
│                │                                             │
│                │                                             │
│                │                                             │
│                │                                             │
│                │                                             │
│                │                                             │
├────────────────┴─────────────────────────────────────────────┤
│  queek_backend › artisan serve                               │  ← Status bar
└──────────────────────────────────────────────────────────────┘
```

## Sidebar

### Project Item
```
┌──────────────────┐
│ ▼ ● queek_backend│  ← Color dot + project name
│   ├ artisan   ◉  │  ← Active session (highlighted)
│   ├ horizon      │
│   ├ logs         │
│   └ ＋           │  ← Add session button (subtle, appears on hover)
│                  │
│ ▶ ● gateway     │  ← Collapsed project
│                  │
│ ＋ Add Project   │  ← Always visible at bottom
└──────────────────┘
```

**Interactions:**
| Action | Trigger |
|--------|---------|
| Expand/collapse project | Click project name or arrow |
| Select session | Click session name |
| Rename session | Double-click session name |
| Rename project | Double-click project name |
| Add session | Click + under project |
| Add project | Click "+ Add Project" → native folder picker |
| Delete session | Right-click → "Close Session" |
| Remove project | Right-click → "Remove Project" |
| Reorder session | Drag and drop within project |
| Reorder project | Drag and drop in sidebar |
| Resize sidebar | Drag the divider edge |

### Context Menu (Right-Click)

**On Project:**
```
┌─────────────────────┐
│ New Session          │
│ ─────────────────── │
│ Rename               │
│ Change Color         │
│ Open in Finder       │
│ Copy Path            │
│ ─────────────────── │
│ Remove Project       │
└─────────────────────┘
```

**On Session:**
```
┌─────────────────────┐
│ Rename               │
│ Duplicate            │
│ ─────────────────── │
│ Close Session        │
└─────────────────────┘
```

## Terminal Panel

The main area displays the active terminal session via xterm.js.

**Header bar (top of terminal panel):**
```
┌─────────────────────────────────────────────────────────┐
│  queek_backend › artisan serve          ⚙  Split  ✕    │
└─────────────────────────────────────────────────────────┘
```

- Breadcrumb shows: `project name › session name`
- Settings icon: Opens terminal settings (font size, theme)
- Split button: Future feature (split panes within a session)
- Close button: Closes the session (with confirmation if process running)

**Empty state (no session selected):**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      No session selected                │
│                                                         │
│              Click a session or press Ctrl+N            │
│              to create a new terminal                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Empty state (no projects):**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   Welcome to Terma                      │
│                                                         │
│              Add a project folder to get started        │
│                                                         │
│              [ + Add Project ]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Status Bar

Bottom bar showing current context:

```
┌─────────────────────────────────────────────────────────┐
│  ● queek_backend › artisan serve    zsh    3 sessions   │
└─────────────────────────────────────────────────────────┘
  ↑ color dot    ↑ breadcrumb     ↑ shell  ↑ project total
```

## Keyboard Shortcuts

### Global
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New session in active project |
| `Cmd/Ctrl + Shift + N` | Add new project |
| `Cmd/Ctrl + W` | Close active session |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `Cmd/Ctrl + Q` | Quit app |

### Navigation
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + 1-9` | Switch to session 1-9 (within active project) |
| `Cmd/Ctrl + ↑` | Previous session |
| `Cmd/Ctrl + ↓` | Next session |
| `Cmd/Ctrl + Shift + ↑` | Previous project |
| `Cmd/Ctrl + Shift + ↓` | Next project |
| `Cmd/Ctrl + P` | Quick switch (fuzzy finder popup) |

### Quick Switch (`Cmd/Ctrl + P`)
A VS Code-like command palette for fast session switching:

```
┌─────────────────────────────────────────┐
│  🔍 Search sessions...                  │
├─────────────────────────────────────────┤
│  queek_backend › artisan serve          │
│  queek_backend › horizon                │
│  queek_backend › logs                   │
│  queek-merchant › dev server            │
│  gateway › uvicorn                      │
└─────────────────────────────────────────┘
```

Fuzzy matching on both project and session names.

## Theming

### Dark Theme (Default)
```
Background:        #1E1E2E  (terminal bg)
Sidebar bg:        #181825
Sidebar text:      #CDD6F4
Active session:    #313244  (highlight bg)
Accent:            #89B4FA  (blue)
Status bar bg:     #11111B
Border:            #313244
```

### Light Theme
```
Background:        #EFF1F5
Sidebar bg:        #E6E9EF
Sidebar text:      #4C4F69
Active session:    #CCD0DA
Accent:            #1E66F5
Status bar bg:     #DCE0E8
Border:            #CCD0DA
```

Theme colors follow the [Catppuccin](https://github.com/catppuccin/catppuccin) palette for community familiarity.

## Responsive Behavior

- **Minimum window size**: 600x400px
- **Sidebar collapse**: Below 800px width, sidebar auto-collapses to icons only
- **Font scaling**: Respects system DPI/scaling settings
- **Sidebar resize**: Drag handle between sidebar and terminal panel

## Animations

Minimal and purposeful:
- Sidebar expand/collapse: 150ms ease-out
- Session switch: Instant (no transition — terminals should feel instant)
- Context menu: 100ms fade-in
- Quick switch popup: 100ms slide-down

## Accessibility

- Full keyboard navigation
- Focus indicators on all interactive elements
- High contrast mode support (respects OS setting)
- Screen reader labels on all buttons and interactive elements
- Minimum touch target: 32x32px
