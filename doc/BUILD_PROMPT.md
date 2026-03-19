# Terma — Build Prompt

Copy everything below the line and paste it as your first message to the AI agent.

---

## Project: Terma — Lightweight Project-Aware Terminal Multiplexer

Build the complete Terma application from scratch. All implementation plans are in the `plans/` directory. **Read ALL plan files before writing any code.**

### Plan Files (read in order)
1. `01-overview.md` — What, why, tech stack, non-goals
2. `02-architecture.md` — System design, components, IPC flow, file structure
3. `03-data-models.md` — Config schema, TypeScript/Rust types, runtime state
4. `04-ui-ux-spec.md` — Layout, interactions, keyboard shortcuts, theming
5. `05-roadmap.json` — Feature roadmap (implement v0.1.0 only)
6. `06-open-source-setup.md` — Repo structure, CI/CD
7. `07-implementation-guide.md` — Phase-by-phase build steps with code snippets

### Execution Rules

1. **Read all plan files first.** They are your source of truth — do not improvise beyond them.
2. **Follow `07-implementation-guide.md` phase by phase.** Do not skip ahead.
3. **Checkpoint = mandatory stop.** Each phase has a checkpoint. Test it. If it fails, fix it before moving on. Never skip a checkpoint.
4. **Do not assume — verify.** If a Tauri v2 API, xterm.js method, or Rust crate function seems right, check the docs. Do not hallucinate APIs.
5. **If stuck, debug — don't skip.** Diagnose root causes. Do not comment out broken code.
6. **Keep it simple.** No extra features, no premature abstractions. Only what the current phase requires.
7. **Commit after each phase.** Clear message (e.g., `feat: phase 2 — PTY backend`).
8. **Final validation.** The project is NOT complete until all of this works:
   - Open the app
   - Add 3 project directories
   - Create multiple named sessions in each
   - Type commands and see output in every session
   - Switch between sessions
   - Close and reopen app with layout restored
   - Keyboard shortcuts work

Start now. Read all plan files, then execute through Phase 1 to last phase.
