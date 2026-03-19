# Terma

A lightweight, project-aware terminal multiplexer built with Tauri v2, React, and xterm.js.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, xterm.js
- **Backend**: Rust, Tauri v2, portable-pty
- **Build**: Vite 7, pnpm

## Commands

```bash
pnpm tauri dev        # Run in development mode
pnpm tauri build      # Build for production (outputs .app and .dmg)
pnpm build            # TypeScript check + Vite build (frontend only)
npx tsc --noEmit      # Type check without emitting
```

## Architecture

### Frontend (`src/`)

- `App.tsx` — Root layout: sidebar + terminal panel + status bar + quick switch overlay
- `context/AppContext.tsx` — React Context + useReducer for global state
- `context/reducer.ts` — State reducer (projects, sessions, sidebar, settings)
- `types/index.ts` — TypeScript interfaces (Project, Session, AppState, Action)

**Components:**
- `Sidebar/Sidebar.tsx` — Explorer panel with filter, project tree, add folder
- `Sidebar/ProjectItem.tsx` — Collapsible folder with session list
- `Sidebar/SessionItem.tsx` — Clickable session with terminal icon
- `Terminal/TerminalPanel.tsx` — Container with header + terminal views (rounded top-left corner)
- `Terminal/TerminalHeader.tsx` — Breadcrumb (project > session) with close button
- `Terminal/TerminalView.tsx` — xterm.js wrapper, one per session, show/hide via CSS (not mount/unmount)
- `StatusBar.tsx` — Bottom bar with project dot, active session name, session count
- `QuickSwitch.tsx` — Cmd+P fuzzy finder modal

**Hooks:**
- `usePty.ts` — Wraps Tauri IPC calls for PTY operations
- `useConfig.ts` — Loads config on mount, re-creates PTY sessions, debounced save (500ms)
- `useKeyboardShortcuts.ts` — Global keyboard handler (Cmd+N/W/B/P, Cmd+1-9, Cmd+arrows)

### Backend (`src-tauri/src/`)

- `lib.rs` — Registers PtyManager state, all commands, dialog plugin
- `pty.rs` — PtyManager with HashMap<String, PtySession>, spawn/write/resize/close
- `commands.rs` — 6 Tauri commands: create_session, write_to_session, resize_session, close_session, load_config, save_config
- `config.rs` — Config structs, load/save to `~/.terma/config.json`

### Styling (`src/styles/globals.css`)

- Tailwind v4 with `@tailwindcss/vite` plugin
- VS Code Dark+ color scheme via CSS custom properties
- All custom styles in `@layer base` to work with Tailwind's layer system
- Thin 5px scrollbars for sidebar and terminal

## Key Patterns

- **Terminal lifecycle**: Show/hide via `display: block/none`, never unmount — keeps PTY alive
- **Session restoration**: On app restart, `useConfig` re-creates PTY processes for all saved sessions
- **PTY I/O**: Reader thread emits Tauri events (`terminal-output-{sessionId}`), frontend listens via `@tauri-apps/api/event`
- **Shell**: Detects `$SHELL` env var, launches as login shell (`-l`), removes `PREFIX` env var for nvm compatibility
- **Config**: Persisted to `~/.terma/config.json`, debounced 500ms save on state change

## Conventions

- Session names default to lowercase (`session 1`, `session 2`)
- Folder names display as bold uppercase in the sidebar
- All buttons must have `cursor: pointer` (set globally in CSS)
- Use `pnpm` (not npm/yarn) for all package operations
