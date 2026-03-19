# Terma — Project Overview

## What is Terma?

Terma is a lightweight, open-source, project-aware terminal multiplexer. It organizes terminal sessions by project directory, giving developers a tree-based sidebar to manage multiple projects and their associated terminal sessions from a single window.

## The Problem

Modern development workflows involve juggling multiple projects simultaneously — a backend API, a frontend app, a gateway service, infrastructure tools. Each project needs multiple terminal sessions (dev server, queue worker, logs, git, etc.). Current solutions fall short:

- **tmux/zellij**: Powerful but flat — no project-level grouping. Steep learning curve.
- **VS Code terminal**: Project-aware but locked to one workspace. Heavy.
- **iTerm2/Warp/Tabby**: Tabs and panes, but no semantic project organization.
- **Hyper**: Beautiful but slow, no project grouping.

Developers end up with 15+ unorganized tabs across multiple terminal windows, constantly hunting for the right session.

## The Solution

Terma provides a **project-first terminal experience**:

```
┌─────────────────────────────────────────────────────┐
│  Terma                                    _ □ ✕     │
├──────────────┬──────────────────────────────────────┤
│ PROJECTS     │                                      │
│              │  $ php artisan serve                  │
│ ▼ queek_backend │  Laravel development server...     │
│   ├ artisan  │  INFO  Server running on [http://     │
│   ├ horizon  │  127.0.0.1:8000]                     │
│   ├ logs     │                                      │
│   └ + new    │  Press Ctrl+C to stop the server     │
│              │                                      │
│ ▼ queek-merchant │                                  │
│   ├ dev      │                                      │
│   └ + new    │                                      │
│              │                                      │
│ ▶ gateway    │                                      │
│              │                                      │
│ + Add Project│                                      │
│              │                                      │
├──────────────┴──────────────────────────────────────┤
│ queek_backend > artisan                             │
└─────────────────────────────────────────────────────┘
```

## Core Principles

1. **Project-first** — Projects are the top-level concept, not tabs or panes.
2. **Ultra-light** — Sub-10MB binary, low RAM footprint. A terminal manager shouldn't be heavier than the terminal itself.
3. **Zero config** — Add a folder, start typing. No YAML, no dotfiles required.
4. **Fast switching** — Click or keyboard shortcut, instantly in context.
5. **Persistent** — Close the app, reopen it, everything is where you left it (layout + session names, not shell history).
6. **Open source** — MIT licensed, community-driven.

## Target Users

- Full-stack developers running multiple services locally
- DevOps/SRE engineers managing multiple environments
- "Vibe coders" using AI-assisted development across multiple projects
- Anyone who regularly has 5+ terminal tabs open

## Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| App framework | Tauri v2 | ~8MB binary, native webview, Rust backend |
| PTY backend | Rust + `portable-pty` | Battle-tested PTY lib (used by Warp, Zed) |
| Terminal rendering | xterm.js | Industry standard terminal renderer |
| Frontend | React + TypeScript | Largest contributor pool, strong ecosystem |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| State persistence | JSON file | `~/.terma/config.json` — no database needed |

## Non-Goals (v1)

- Not a code editor
- Not an SSH client (could be added later)
- Not a tmux replacement for remote servers
- No AI integration in v1
- No plugin system in v1
