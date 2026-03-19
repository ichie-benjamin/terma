# Terma — Architecture

## System Architecture

```
┌──────────────────────────────────────────────────┐
│                   Tauri Shell                     │
│  ┌─────────────────────┬────────────────────────┐ │
│  │   React Frontend    │    Rust Backend        │ │
│  │                     │                        │ │
│  │  ┌──────────────┐   │  ┌──────────────────┐  │ │
│  │  │   Sidebar    │   │  │  PTY Manager     │  │ │
│  │  │  (Project    │   │  │  (portable-pty)  │  │ │
│  │  │   Tree)      │   │  │                  │  │ │
│  │  ├──────────────┤   │  ├──────────────────┤  │ │
│  │  │  Terminal    │◄──┼──┤  Session Store   │  │ │
│  │  │  Panel       │   │  │  (HashMap)       │  │ │
│  │  │  (xterm.js)  │   │  │                  │  │ │
│  │  ├──────────────┤   │  ├──────────────────┤  │ │
│  │  │  State       │   │  │  Config Manager  │  │ │
│  │  │  (Context)   │   │  │  (~/.terma/)     │  │ │
│  │  └──────────────┘   │  └──────────────────┘  │ │
│  │         ▲           │          ▲              │ │
│  │         │    Tauri IPC         │              │ │
│  │         └───────────┼──────────┘              │ │
│  └─────────────────────┴────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Rust Backend (Tauri Core)

#### PTY Manager (`src-tauri/src/pty.rs`)
Responsible for creating and managing pseudo-terminal processes.

```rust
// Core responsibilities:
// - Spawn shell processes per session (bash/zsh/fish/powershell)
// - Read/write to PTY file descriptors
// - Handle resize events
// - Clean up on session close

struct PtySession {
    id: String,
    project_id: String,
    child: Box<dyn portable_pty::Child>,
    writer: Box<dyn Write + Send>,
    reader: Box<dyn Read + Send>,
}

struct PtyManager {
    sessions: HashMap<String, PtySession>,
}
```

**Key Tauri Commands:**
```rust
#[tauri::command]
fn create_session(project_id: &str, cwd: &str) -> Result<String, String>

#[tauri::command]
fn write_to_session(session_id: &str, data: &str) -> Result<(), String>

#[tauri::command]
fn resize_session(session_id: &str, cols: u16, rows: u16) -> Result<(), String>

#[tauri::command]
fn close_session(session_id: &str) -> Result<(), String>
```

**Data flow (PTY → Frontend):**
- Rust reads from PTY in a background thread
- Emits Tauri events: `terminal-output-{session_id}`
- React listens via `listen()` and feeds data to xterm.js

**Data flow (Frontend → PTY):**
- User types in xterm.js
- `onData` callback invokes `write_to_session` Tauri command
- Rust writes bytes to PTY writer

#### Session Store (`src-tauri/src/store.rs`)
In-memory HashMap of active PTY sessions, keyed by session ID (UUID).

#### Config Manager (`src-tauri/src/config.rs`)
Reads/writes `~/.terma/config.json` for persistent state.

```rust
struct Config {
    projects: Vec<ProjectConfig>,
    settings: AppSettings,
}

struct ProjectConfig {
    id: String,
    name: String,
    path: String,
    sessions: Vec<SessionConfig>,
    collapsed: bool,
}

struct SessionConfig {
    id: String,
    name: String,
    // Shell history is NOT persisted — only layout/names
}

struct AppSettings {
    theme: String,           // "dark" | "light"
    font_size: u16,          // default: 14
    font_family: String,     // default: "JetBrains Mono"
    sidebar_width: u16,      // default: 240
    default_shell: Option<String>,  // None = detect system default
}
```

### 2. React Frontend

#### Component Tree
```
<App>
├── <Sidebar>
│   ├── <ProjectList>
│   │   ├── <ProjectItem>           (collapsible project group)
│   │   │   ├── <SessionItem>       (clickable session)
│   │   │   └── <AddSessionButton>  (+ new session)
│   │   └── ...
│   └── <AddProjectButton>         (+ Add Project)
├── <TerminalPanel>
│   ├── <TerminalHeader>           (project > session name, actions)
│   └── <TerminalView>             (xterm.js instance)
└── <StatusBar>                    (current project > session info)
```

#### State Management
React Context with `useReducer` — no external state library needed for this scale.

```typescript
interface AppState {
  projects: Project[];
  activeSessionId: string | null;
  sidebarWidth: number;
  settings: AppSettings;
}

type Action =
  | { type: 'ADD_PROJECT'; payload: { name: string; path: string } }
  | { type: 'REMOVE_PROJECT'; payload: { projectId: string } }
  | { type: 'ADD_SESSION'; payload: { projectId: string; name: string } }
  | { type: 'REMOVE_SESSION'; payload: { sessionId: string } }
  | { type: 'RENAME_SESSION'; payload: { sessionId: string; name: string } }
  | { type: 'SET_ACTIVE_SESSION'; payload: { sessionId: string } }
  | { type: 'TOGGLE_PROJECT'; payload: { projectId: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'REORDER_SESSION'; payload: { sessionId: string; newIndex: number } }
  | { type: 'REORDER_PROJECT'; payload: { projectId: string; newIndex: number } };
```

### 3. IPC Communication

```
Frontend (React)          Tauri IPC           Backend (Rust)
─────────────────         ─────────           ──────────────
User types key    ──invoke──►  write_to_session()  ──► PTY stdin
                  ◄──event───  terminal-output-{id} ◄── PTY stdout
Create session    ──invoke──►  create_session()     ──► spawn shell
Resize terminal   ──invoke──►  resize_session()     ──► PTY resize
Close session     ──invoke──►  close_session()      ──► kill process
```

### 4. File Structure

```
terma/
├── src-tauri/                    # Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs               # Tauri app entry
│       ├── pty.rs                # PTY manager
│       ├── config.rs             # Config read/write
│       ├── commands.rs           # Tauri command handlers
│       └── lib.rs                # Module declarations
├── src/                          # React frontend
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   ├── components/
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ProjectItem.tsx
│   │   │   ├── SessionItem.tsx
│   │   │   └── AddButton.tsx
│   │   ├── Terminal/
│   │   │   ├── TerminalPanel.tsx
│   │   │   ├── TerminalView.tsx  # xterm.js wrapper
│   │   │   └── TerminalHeader.tsx
│   │   └── StatusBar.tsx
│   ├── context/
│   │   ├── AppContext.tsx
│   │   └── reducer.ts
│   ├── hooks/
│   │   ├── useTerminal.ts        # xterm.js lifecycle
│   │   ├── usePty.ts             # Tauri IPC for PTY
│   │   └── useConfig.ts          # Config persistence
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css           # Tailwind + xterm overrides
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── index.html
├── LICENSE                       # MIT
├── README.md
├── CONTRIBUTING.md
└── .github/
    ├── workflows/
    │   ├── ci.yml                # Lint + build + test
    │   └── release.yml           # Auto-build binaries
    └── ISSUE_TEMPLATE/
        ├── bug_report.md
        └── feature_request.md
```

## Performance Considerations

1. **xterm.js instances**: Only mount the active terminal. Keep others in memory (PTY running) but don't render them. This prevents DOM bloat with 20+ terminals.
2. **PTY output buffering**: Buffer rapid output (e.g., `cat` of a large file) and flush to frontend in batches to prevent IPC flooding.
3. **Config writes**: Debounce config saves (500ms) — don't write to disk on every sidebar interaction.
4. **Sidebar rendering**: Virtualize project/session list if >50 items (unlikely but safe).

## Security

- PTY processes run with the user's permissions (same as any terminal).
- No network access in v1 — purely local.
- Config file stores only layout data, never credentials or shell history.
- Tauri's security model restricts frontend capabilities via `tauri.conf.json` allowlist.
