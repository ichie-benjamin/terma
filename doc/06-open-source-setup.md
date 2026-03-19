# Terma — Open Source Setup

## Repository Structure

```
terma/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # Lint, test, build on every PR
│   │   ├── release.yml         # Build binaries on tag push
│   │   └── label.yml           # Auto-label PRs by file path
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml      # Structured bug report form
│   │   └── feature_request.yml # Feature request form
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── FUNDING.yml
├── docs/
│   ├── development.md          # Dev setup guide
│   └── architecture.md         # High-level architecture for contributors
├── src-tauri/                  # Rust backend
├── src/                        # React frontend
├── LICENSE                     # MIT
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
└── .editorconfig
```

## README.md Structure

```markdown
# Terma

> A lightweight, project-aware terminal multiplexer.

[Screenshot/GIF demo]

## Why Terma?

One paragraph explaining the problem and solution.

## Features

- Bullet list with screenshots

## Install

### macOS
brew install terma

### Windows
Download from releases

### Linux
Download .deb or .AppImage from releases

## Development

### Prerequisites
- Rust (latest stable)
- Node.js 20+
- pnpm

### Setup
git clone ...
cd terma
pnpm install
pnpm tauri dev

## Contributing

See CONTRIBUTING.md

## License

MIT
```

## CI/CD Pipeline

### ci.yml — On Every PR
```yaml
name: CI
on: [pull_request]
jobs:
  lint-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check

  lint-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cd src-tauri && cargo clippy -- -D warnings
      - run: cd src-tauri && cargo fmt --check

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cd src-tauri && cargo test

  build:
    needs: [lint-frontend, lint-backend, test-frontend, test-backend]
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm tauri build
```

### release.yml — On Tag Push
```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  build-and-release:
    strategy:
      matrix:
        include:
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: macos-latest
            target: x86_64-apple-darwin
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
          - os: windows-latest
            target: x86_64-pc-windows-msvc
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm tauri build --target ${{ matrix.target }}
      - uses: softprops/action-gh-release@v2
        with:
          files: src-tauri/target/${{ matrix.target }}/release/bundle/**/*
```

## Contributing Guidelines (CONTRIBUTING.md)

Key sections:
1. **Development setup** — Prerequisites, clone, install, run
2. **Branch naming** — `feat/`, `fix/`, `docs/`, `refactor/`
3. **Commit convention** — Conventional Commits (`feat:`, `fix:`, `chore:`)
4. **PR process** — Fork → branch → PR → review → merge
5. **Code style** — Rust: `cargo fmt` + `clippy`. React: ESLint + Prettier
6. **Testing** — All PRs must pass CI. New features need tests.
7. **Issue labels** — `good first issue`, `help wanted`, `bug`, `enhancement`

## Good First Issues (Seed List)

To attract initial contributors, create these issues at launch:

1. **"Add tooltip on sidebar project hover showing full path"** — Simple React UI task
2. **"Support fish shell detection"** — Small Rust change in shell detection
3. **"Add Cmd+K to clear terminal"** — Keyboard shortcut addition
4. **"Show session count badge on collapsed project"** — CSS/React task
5. **"Add --version CLI flag"** — Rust CLI arg parsing

## Versioning

- Follow [Semantic Versioning](https://semver.org/)
- Pre-1.0: Minor = features, Patch = fixes
- Post-1.0: Major = breaking, Minor = features, Patch = fixes
- Changelog generated from conventional commits

## Community

- **Discussions**: GitHub Discussions for questions and ideas
- **Issues**: Bug reports and feature requests
- **Discord**: Create a Discord server once community reaches 50+ stars (optional)

## License

MIT License — maximum adoption, minimum friction. Contributors agree via DCO (Developer Certificate of Origin) sign-off in commits.
