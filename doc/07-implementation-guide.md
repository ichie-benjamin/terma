# Terma — Implementation Guide

## Build Order

This is the recommended order for implementing Terma. Each phase builds on the previous one and results in a testable milestone.

---

## Phase 1: Scaffold (Day 1)

### Step 1: Initialize Tauri v2 + React project
```bash
# Install Tauri CLI
cargo install create-tauri-app
# Scaffold with React + TypeScript
cargo create-tauri-app terma --template react-ts
cd terma
pnpm install
```

### Step 2: Add core dependencies

**Frontend (package.json):**
```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.x",
    "@xterm/xterm": "^5.x",
    "@xterm/addon-fit": "^0.10.x",
    "@xterm/addon-web-links": "^0.11.x",
    "@xterm/addon-webgl": "^0.18.x"
  },
  "devDependencies": {
    "tailwindcss": "^4.x",
    "@tailwindcss/vite": "^4.x",
    "vitest": "^3.x",
    "@testing-library/react": "^16.x"
  }
}
```

**Backend (Cargo.toml):**
```toml
[dependencies]
tauri = { version = "2", features = ["all"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
portable-pty = "0.8"
dirs = "6"
```

### Step 3: Set up Tailwind CSS
Configure Tailwind v4 with the Vite plugin. Set up base styles and dark theme variables.

**Milestone**: App opens with a blank window. `pnpm tauri dev` works.

---

## Phase 2: PTY Backend (Days 2–3)

### Step 1: PTY Manager module

Create `src-tauri/src/pty.rs`:

```rust
use portable_pty::{CommandBuilder, PtySize, native_pty_system};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub struct PtySession {
    pub id: String,
    pub project_id: String,
    writer: Box<dyn std::io::Write + Send>,
    pair: portable_pty::PtyPair,
    child: Box<dyn portable_pty::Child + Send + Sync>,
}

pub struct PtyManager {
    sessions: Arc<Mutex<HashMap<String, PtySession>>>,
}

impl PtyManager {
    pub fn new() -> Self { ... }
    pub fn create_session(&self, project_id: &str, cwd: &str, shell: Option<&str>) -> Result<String, String> { ... }
    pub fn write(&self, session_id: &str, data: &[u8]) -> Result<(), String> { ... }
    pub fn resize(&self, session_id: &str, cols: u16, rows: u16) -> Result<(), String> { ... }
    pub fn close(&self, session_id: &str) -> Result<(), String> { ... }
}
```

### Step 2: Tauri commands

Create `src-tauri/src/commands.rs`:

```rust
#[tauri::command]
async fn create_session(
    state: State<'_, PtyManager>,
    app: AppHandle,
    project_id: String,
    cwd: String,
) -> Result<String, String> {
    let session_id = state.create_session(&project_id, &cwd, None)?;

    // Spawn reader thread that emits events
    let reader = state.get_reader(&session_id)?;
    let sid = session_id.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    app.emit(&format!("terminal-output-{}", sid), data).ok();
                }
                Err(_) => break,
            }
        }
    });

    Ok(session_id)
}

#[tauri::command]
async fn write_to_session(state: State<'_, PtyManager>, session_id: String, data: String) -> Result<(), String> { ... }

#[tauri::command]
async fn resize_session(state: State<'_, PtyManager>, session_id: String, cols: u16, rows: u16) -> Result<(), String> { ... }

#[tauri::command]
async fn close_session(state: State<'_, PtyManager>, session_id: String) -> Result<(), String> { ... }
```

### Step 3: Register with Tauri

In `main.rs`:
```rust
fn main() {
    tauri::Builder::default()
        .manage(PtyManager::new())
        .invoke_handler(tauri::generate_handler![
            create_session,
            write_to_session,
            resize_session,
            close_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Milestone**: Can spawn a shell from React, type commands, see output. Single hardcoded terminal.

---

## Phase 3: Terminal Frontend (Days 3–4)

### Step 1: xterm.js wrapper component

`src/components/Terminal/TerminalView.tsx`:

```typescript
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface Props {
  sessionId: string;
  isActive: boolean;
}

export function TerminalView({ sessionId, isActive }: Props) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      theme: { background: '#1E1E2E' },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(termRef.current);
    fit.fit();

    // User input → PTY
    term.onData((data) => {
      invoke('write_to_session', { sessionId, data });
    });

    // PTY output → terminal
    const unlisten = listen<string>(`terminal-output-${sessionId}`, (event) => {
      term.write(event.payload);
    });

    // Handle resize
    const observer = new ResizeObserver(() => fit.fit());
    observer.observe(termRef.current);

    term.onResize(({ cols, rows }) => {
      invoke('resize_session', { sessionId, cols, rows });
    });

    xtermRef.current = term;

    return () => {
      unlisten.then((fn) => fn());
      observer.disconnect();
      term.dispose();
    };
  }, [sessionId]);

  return (
    <div
      ref={termRef}
      className={isActive ? 'block h-full' : 'hidden'}
    />
  );
}
```

### Step 2: Terminal panel with header

**Milestone**: Fully working terminal in the app. Can type, see output, resize.

---

## Phase 4: Sidebar + Project Management (Days 4–6)

### Step 1: State context

`src/context/AppContext.tsx` — React Context + useReducer with the full AppState and Action types from architecture doc.

### Step 2: Sidebar components

Build the component tree:
- `Sidebar.tsx` — Container with project list and add button
- `ProjectItem.tsx` — Collapsible project with session list
- `SessionItem.tsx` — Clickable session with rename (double-click)
- `AddButton.tsx` — Styled "+" button

### Step 3: Add project flow

1. User clicks "+ Add Project"
2. Tauri native folder dialog opens (`@tauri-apps/plugin-dialog`)
3. Selected path creates a new Project in state
4. First session auto-created under the project

### Step 4: Multi-session management

- Clicking "+" under a project creates a new session (spawns PTY in project dir)
- Clicking a session switches the active terminal
- xterm.js instances are kept alive but hidden (`display: none`) for inactive sessions

**Milestone**: Can add projects, create sessions, switch between them. Core app is functional.

---

## Phase 5: Persistence (Days 6–7)

### Step 1: Config manager in Rust

`src-tauri/src/config.rs`:
- `load_config()` — Read `~/.terma/config.json`, create with defaults if missing
- `save_config()` — Write current state to config file
- Config migration support via `version` field

### Step 2: Tauri commands for config
```rust
#[tauri::command]
fn load_config() -> Result<Config, String> { ... }

#[tauri::command]
fn save_config(config: Config) -> Result<(), String> { ... }
```

### Step 3: Frontend persistence hook

`src/hooks/useConfig.ts`:
- Load config on app start → hydrate React state
- Debounced save (500ms) on any state change
- On launch with `restoreOnStartup: true`, re-create sessions from saved layout

**Milestone**: Close the app, reopen it, project tree is restored.

---

## Phase 6: Keyboard Shortcuts + Status Bar (Day 7–8)

### Step 1: Global shortcut handler

Register keyboard shortcuts via `useEffect` on `document.addEventListener('keydown', ...)`. Map shortcuts to dispatch actions.

### Step 2: Status bar component

Simple bar showing: color dot, project > session breadcrumb, shell name, session count.

### Step 3: Quick switch (Cmd+P)

Modal overlay with text input. Fuzzy match across `project.name + session.name`. Arrow keys to navigate, Enter to select.

**Milestone**: Full keyboard navigation. v0.1.0 feature-complete.

---

## Phase 7: Polish + Release Prep (Days 8–10)

1. Context menus (right-click on project/session)
2. Confirm dialog on close with running process
3. Window state persistence (size, position)
4. Dark theme finalization
5. App icon design
6. README with screenshots/GIF
7. CI pipeline setup
8. First GitHub release with built binaries

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PTY library | `portable-pty` | Cross-platform, used by Warp & Zed, maintained |
| Terminal renderer | xterm.js | Industry standard, used by VS Code, Hyper, Tabby |
| State management | React Context | App state is small (~20 fields), no need for Redux/Zustand |
| Package manager | pnpm | Fastest, disk-efficient, standard for Tauri projects |
| ID generation | UUID v4 | Simple, no collisions, no sequential leaks |
| Config format | JSON | Human-readable, no dependencies, easy migration |
| Styling | Tailwind CSS v4 | Utility-first, small output, fast dev iteration |

## Testing Strategy

### Rust (src-tauri/)
- **Unit tests**: Config serialization/deserialization, ID generation
- **Integration tests**: PTY spawn, write, read, resize, kill
- Run with: `cargo test`

### React (src/)
- **Component tests**: Sidebar rendering, session switching, rename flow
- **Hook tests**: useConfig, usePty mock behavior
- Run with: `pnpm test` (vitest)

### Manual Testing Checklist (Pre-Release)
- [ ] Add 3 projects with 5+ sessions each
- [ ] Switch between sessions rapidly
- [ ] Rename sessions and projects
- [ ] Close sessions (with and without running processes)
- [ ] Remove projects
- [ ] Close and reopen app — layout persists
- [ ] Run long-output commands (stress test PTY → xterm.js pipe)
- [ ] Resize window and sidebar
- [ ] Test all keyboard shortcuts
- [ ] Test on macOS, Windows, Linux
