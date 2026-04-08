# Contributing to EXOSKELETON

Thank you for your interest in this project! This guide explains how to contribute code, run tests, and follow the project's conventions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Coding Conventions](#coding-conventions)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Architecture Overview](#architecture-overview)

## Code of Conduct

This project adheres to a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### Setup

```bash
git clone https://github.com/Poojan38380/EXOSKELETON-A-Digital-Monograph.git
cd EXOSKELETON-A-Digital-Monograph
npm install
npm run dev
```

The dev server will start at `http://localhost:5173`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and produce a production build |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Development Workflow

1. **Fork** the repository (if you're not a maintainer)
2. **Create a branch** for your change:
   ```bash
   git checkout -b feat/your-feature-name
   # or: bugfix/fix-something
   ```
3. **Make your changes** following the coding conventions
4. **Add tests** for new features or bug fixes
5. **Run tests**: `npm test`
6. **Commit** your changes (pre-commit hooks will verify)
7. **Push** and open a **Pull Request**

## Testing

All new features **must** include tests. See [TESTING.md](./TESTING.md) for the full guide.

### Quick Reference

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:watch -- Foo   # Run only tests matching "Foo"
```

### Test File Location

Tests live in `__tests__/` directories next to the source code:

```
src/components/
├── NavigationRail.tsx
└── __tests__/
    └── NavigationRail.test.tsx
```

### What to Test

| Priority | What | Examples |
|----------|------|----------|
| **Required** | Pure functions, utilities | `layout-engine/`, `utils/` |
| **Required** | React components (behavior) | `components/` |
| **Nice-to-have** | Multi-component flows | Page navigation, theme switching |

Use `renderWithProviders()` from `src/test/utils.tsx` for component tests.

## Coding Conventions

### Language & Tooling

- **TypeScript** — strict mode, no `any` unless absolutely necessary (with comment)
- **React 19** — function components, hooks, no class components
- **No external UI libraries** — the project intentionally keeps dependencies minimal
- **CSS** — plain CSS modules, no CSS-in-JS libraries

### Style

- **2-space indentation**
- **Single quotes** for strings (JS/TS), double quotes for JSX attributes
- **Semicolons** — required
- **Trailing commas** — required (ES2017+)
- **No unused imports, locals, or parameters** — enforced by `tsconfig`

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `NavigationRail.tsx` |
| Modules/Utils | kebab-case | `hex-facet-grid.ts` |
| Tests | `*.test.ts` / `*.test.tsx` | `layout-engine/__tests__/analysis.test.ts` |
| CSS | Same as component | `navigation.css` |

### Architecture

- **Components** in `src/components/` (page-specific in `src/components/pages/`)
- **Context providers** in `src/context/`
- **Layout engine** in `src/layout-engine/` (custom text layout, line-breaking, bidi)
- **Content** in `src/content/` (text, images, data)
- **Styles** in `src/styles/`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body> (optional)
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(compound-eye): add chromatic aberration to magnification
fix(layout): correct line-wrap calculation for inline figures
docs: update TESTING.md with new component patterns
test(nav-rail): add rendering and interaction tests
```

## Pull Requests

When opening a PR:

1. **Title**: follow Conventional Commits format
2. **Description**: explain what changed and why
3. **Screenshots/GIFs**: for visual changes
4. **Tests**: confirm `npm test` passes
5. **Build**: confirm `npm run build` succeeds

A PR template is provided to guide you.

## Architecture Overview

EXOSKELETON is an interactive digital monograph on insect morphology. Key subsystems:

- **Layout Engine** (`src/layout-engine/`) — Custom text layout system with canvas-based measurement, CSS-like line wrapping, bidi text support, and polygon-based obstacle avoidance for images.
- **Compound Eye Cursor** (`src/components/CompoundEyeCursor.tsx`) — Hexagonal facet grid that magnifies text under the cursor with chromatic aberration and barrel distortion.
- **Pheromone Canvas** (`src/components/PheromoneCanvas.tsx`) — Click to drop pheromone trails; moths navigate toward them.
- **Page Theming** (`src/context/PageThemeContext.tsx`) — Per-page accent colors, glow patterns, and pattern overlays.
- **Navigation Rail** (`src/components/NavigationRail.tsx`) — Collapsible sidebar with page thumbnails.

## Questions?

Open an [issue](https://github.com/Poojan38380/EXOSKELETON-A-Digital-Monograph/issues) or start a discussion. We're happy to help!
