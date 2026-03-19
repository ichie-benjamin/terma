# Terma — Data Models

## Overview

Terma uses a single JSON config file for persistence. No database. The config file stores project layout, session names, and app settings. Shell history and terminal scrollback are NOT persisted.

## Config File Location

```
~/.terma/
├── config.json          # Main config (projects, sessions, settings)
└── themes/              # Custom themes (future)
    └── custom.json
```

## Config Schema

### Root (`config.json`)

```jsonc
{
  "version": 1,
  "projects": [...],
  "settings": {...},
  "window": {...}
}
```

### Project

```typescript
interface Project {
  id: string;           // UUID v4
  name: string;         // Display name (defaults to folder name)
  path: string;         // Absolute path to directory
  sessions: Session[];  // Ordered list of sessions
  collapsed: boolean;   // Sidebar collapse state
  color?: string;       // Optional accent color for visual grouping
  createdAt: string;    // ISO 8601
}
```

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "queek_backend",
  "path": "/Users/benny/Documents/laravel/queek_backend",
  "sessions": [],
  "collapsed": false,
  "color": "#3B82F6",
  "createdAt": "2026-03-19T10:00:00Z"
}
```

### Session

```typescript
interface Session {
  id: string;           // UUID v4
  name: string;         // Display name (user-editable)
  shell?: string;       // Override shell for this session (null = default)
  createdAt: string;    // ISO 8601
}
```

```json
{
  "id": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "name": "artisan serve",
  "shell": null,
  "createdAt": "2026-03-19T10:01:00Z"
}
```

### App Settings

```typescript
interface AppSettings {
  theme: "dark" | "light";
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: "block" | "underline" | "bar";
  cursorBlink: boolean;
  scrollback: number;           // Lines of scrollback buffer (default: 5000)
  defaultShell: string | null;  // null = auto-detect
  sidebarWidth: number;         // pixels
  confirmOnClose: boolean;      // Confirm before closing session with running process
  restoreOnStartup: boolean;    // Re-open last session layout on app start
}
```

```json
{
  "theme": "dark",
  "fontFamily": "JetBrains Mono, Menlo, monospace",
  "fontSize": 14,
  "lineHeight": 1.2,
  "cursorStyle": "block",
  "cursorBlink": true,
  "scrollback": 5000,
  "defaultShell": null,
  "sidebarWidth": 240,
  "confirmOnClose": true,
  "restoreOnStartup": true
}
```

### Window State

```typescript
interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  maximized: boolean;
}
```

## Full Config Example

```json
{
  "version": 1,
  "projects": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "queek_backend",
      "path": "/Users/benny/Documents/laravel/queek_backend",
      "collapsed": false,
      "color": "#3B82F6",
      "createdAt": "2026-03-19T10:00:00Z",
      "sessions": [
        {
          "id": "s001",
          "name": "artisan serve",
          "shell": null,
          "createdAt": "2026-03-19T10:01:00Z"
        },
        {
          "id": "s002",
          "name": "horizon",
          "shell": null,
          "createdAt": "2026-03-19T10:01:30Z"
        },
        {
          "id": "s003",
          "name": "logs",
          "shell": null,
          "createdAt": "2026-03-19T10:02:00Z"
        }
      ]
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "queek-merchant",
      "path": "/Users/benny/Documents/nextjs/queek-merchant",
      "collapsed": false,
      "color": "#10B981",
      "createdAt": "2026-03-19T10:05:00Z",
      "sessions": [
        {
          "id": "s004",
          "name": "dev server",
          "shell": null,
          "createdAt": "2026-03-19T10:05:30Z"
        },
        {
          "id": "s005",
          "name": "build",
          "shell": null,
          "createdAt": "2026-03-19T10:06:00Z"
        }
      ]
    }
  ],
  "settings": {
    "theme": "dark",
    "fontFamily": "JetBrains Mono, Menlo, monospace",
    "fontSize": 14,
    "lineHeight": 1.2,
    "cursorStyle": "block",
    "cursorBlink": true,
    "scrollback": 5000,
    "defaultShell": null,
    "sidebarWidth": 240,
    "confirmOnClose": true,
    "restoreOnStartup": true
  },
  "window": {
    "width": 1200,
    "height": 800,
    "x": 100,
    "y": 100,
    "maximized": false
  }
}
```

## Runtime-Only State (Not Persisted)

These exist only in memory while the app is running:

```typescript
// Rust side — PTY process state
interface RuntimeSession {
  id: string;
  ptyProcess: Child;        // OS process handle
  writer: Writer;           // stdin pipe
  reader: Reader;           // stdout pipe
  isAlive: boolean;
}

// React side — UI state
interface UIState {
  activeSessionId: string | null;
  renaming: string | null;        // Session ID being renamed
  dragging: string | null;        // Session/project ID being dragged
  contextMenu: {                  // Right-click context menu
    x: number;
    y: number;
    targetId: string;
    targetType: "project" | "session";
  } | null;
}
```

## Config Migration Strategy

The `version` field in config.json enables future schema changes:

```rust
fn migrate_config(config: Value) -> Result<Config> {
    let version = config["version"].as_u64().unwrap_or(0);
    match version {
        0 => migrate_v0_to_v1(config),
        1 => serde_json::from_value(config),
        _ => Err("Unknown config version")
    }
}
```

Each major version bump gets a migration function. Old configs are auto-migrated on load.
