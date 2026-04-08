# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-04-08

### Added

- **Interactive book shell** — 11-page digital monograph on insect morphology with keyboard and touch navigation
- **Custom text layout engine** — Canvas-based text measurement, CSS-like line wrapping, bidi text support, CJK handling, emoji correction, and polygon-based obstacle avoidance for inline images
- **Compound Eye Cursor** — Hexagonal facet grid that magnifies text under the mouse with chromatic aberration and barrel distortion
- **Pheromone & Moth Simulation** — Canvas-based pheromone trail system; drop pheromones by clicking and watch moths navigate toward them
- **Animated SVG Butterfly** — Flies between text anchors on the Wings page and acts as a layout obstacle
- **Scroll-driven animations** — Content reveals on scroll using Intersection Observer
- **Page theming system** — Per-page accent colors, glow patterns, and pattern overlays via React context
- **Collapsible Navigation Rail** — Sidebar with page thumbnails, expandable on hover
- **Mobile bottom navigation** — Responsive navigation bar for screens ≤768px
- **Image lightbox** — Fullscreen image viewer
- **"Obsidian Cabinet" theme** — Dark, luxurious design system with golden accents, modular typography, and texture overlays
- **TypeScript strict mode** — Full type safety across the codebase
- **Test infrastructure** — Vitest, Testing Library, jsdom, GitHub Actions CI, pre-commit hooks with Husky + lint-staged
- **Documentation** — TESTING.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, worktree guides

### Technical Details

- **React 19** with hooks and functional components
- **Vite 7** for development and building
- **Zero external UI dependencies** — only React, React DOM, and test utilities
- **~3,000+ lines** of custom layout engine code across 8 modules
- **75+ tests** across unit, component, and context test suites

[Unreleased]: https://github.com/Poojan38380/EXOSKELETON-A-Digital-Monograph/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Poojan38380/EXOSKELETON-A-Digital-Monograph/releases/tag/v0.1.0
