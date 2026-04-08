# PRD: Testing System & Git Worktree Workflow

## Problem Statement

As a developer working on this project with multiple AI agents simultaneously, I need a robust testing system that prevents new features from breaking existing functionality. Currently, there's only one test file (`hex-facet-grid.test.ts`) and no standardized testing infrastructure, conventions, or CI enforcement. Additionally, I need a git worktree system that allows multiple agents to work on different features in parallel without conflicts.

## Solution

Build a complete testing infrastructure with tiered testing requirements, test utilities, CI enforcement, and a git worktree management system for parallel development.

## User Stories

1. As a developer, I want a pre-commit hook that runs tests, so that broken code never gets committed.
2. As a developer, I want a GitHub Actions workflow that runs tests on every push/PR, so that I know my code works across environments.
3. As an AI agent, I want a `TESTING.md` guide with clear conventions, so that I know exactly how to write tests for new features.
4. As a developer, I want `@testing-library/react` installed and configured, so that I can write behavioral tests for React components.
5. As a developer, I want custom test utilities (`renderWithProviders`, etc.), so that I don't repeat setup code in every test file.
6. As a developer, I want representative tests written for each category (unit, component, context) to prove the system works, so that I can follow the pattern for future tests.
7. As a developer, I want a git worktree management script, so that I can easily create isolated worktrees for different feature branches.
8. As a developer, I want each AI agent working in its own worktree on its own feature branch, so that they don't conflict with each other's changes.
9. As a developer, I want the vitest config updated to use jsdom environment, so that component tests can run properly.
10. As a developer, I want test files colocated with source code in `__tests__/` directories, so that it's obvious when a module lacks tests.
11. As a developer, I want a `npm test:watch` command, so that I can run tests in watch mode during development.
12. As a developer, I want snapshot testing available for stable, complex components like `BookShell`, so that unintended structural changes are caught.
13. As a developer, I want context providers tested in isolation, so that I know the foundation my components rely on is solid.
14. As a developer, I want a clear priority system for what to test (Priority 1: utilities → Priority 2: components → Priority 3: contexts), so that I know what matters most.

## Implementation Decisions

### Testing Stack
- **Test runner:** Vitest (already installed)
- **Component testing:** `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- **Test environment:** jsdom (browser-like environment for component tests)
- **Pre-commit hooks:** Husky + lint-staged
- **CI:** GitHub Actions workflow

### Test File Organization
- Colocate tests with source: `src/module/__tests__/module.test.ts`
- Test file naming: `*.test.ts` or `*.test.tsx`
- Each test file tests one source module

### Test Utilities Structure
- `src/test/setup.ts` — global test setup, vitest matchers, global mocks
- `src/test/utils.tsx` — custom render helpers (`renderWithProviders`, `renderWithLayout`, etc.)
- `src/test/mocks.ts` — mocked modules, data, and external dependencies

### Testing Strategy (Tiered)
- **Unit tests (required):** Pure functions, utilities, data transformations
- **Component tests (required):** React components render correctly, handle props/state
- **Integration tests (nice-to-have):** Multi-component flows (e.g., page navigation)
- **No E2E tests** for now — too heavy for a digital monograph
- **Hybrid approach:** Testing Library for behavior (required) + selective snapshots for stable complex structures (optional)

### Modules to Test (Priority Order)
**Priority 1 — Deep modules (must test):**
- `src/layout-engine/*` — pure functions (line-breaking, bidi, geometry, measurement)
- `src/utils/*` — hex facet grid utilities (already started)
- `src/content/*` — data validation/transforms
- `src/components/spread-layout.ts` — layout calculations

**Priority 2 — React components (behavioral tests):**
- `BookShell`, `NavigationRail`, `MobileNav`, `ScrollReveal`, `PageReveal`
- Page components (lower priority, mostly presentational)

**Priority 3 — Context providers (isolation tests):**
- `LayoutContext`, `PageThemeContext`, `LayoutDataContext`

### Git Worktree Model
- Feature-branch worktrees: each worktree maps to a feature branch
- All worktrees share the same `.git` directory
- Helper scripts for worktree creation/deletion
- Structure:
  ```
  exoskeleton/              (main)
  exoskeleton-<feature>/    (feature/<feature-name>)
  ```

### CI/CD
- GitHub Actions runs `npm test` on every push and PR
- Pipeline fails on test failures
- Pre-commit hook runs changed tests locally before each commit

### Files to Create/Modify
- **Create:** `src/test/setup.ts`, `src/test/utils.tsx`, `src/test/mocks.ts`
- **Create:** `TESTING.md` — comprehensive testing guide for agents
- **Create:** `.github/workflows/test.yml` — CI workflow
- **Create:** `scripts/create-worktree.ps1` — worktree management script (Windows-first)
- **Create:** Representative tests for each category (1 layout-engine, 1 context, 2-3 components)
- **Modify:** `vitest.config.ts` — add jsdom environment, setup file
- **Modify:** `package.json` — add `test:watch` script, install dependencies
- **Modify:** `README.md` — document worktree workflow

## Testing Decisions

### What Makes a Good Test
- Test external behavior, not implementation details
- Test what the user sees/does, not how the code achieves it
- Tests should be deterministic and independent
- Tests should fail for exactly one reason
- Use `describe` blocks to group by function/component
- Use `it` blocks for individual behaviors

### Which Modules Will Be Tested
- All Priority 1 modules (layout engine, utils, content, spread-layout)
- All Priority 2 components (key components + representative page components)
- All Priority 3 context providers

### Prior Art
- `src/utils/__tests__/hex-facet-grid.test.ts` — excellent example of unit testing pure functions with comprehensive edge case coverage

### Representative Tests to Write (Proof of System)
- `src/layout-engine/__tests__/line-break.test.ts` — pure utility function
- `src/layout-engine/__tests__/bidi.test.ts` — pure utility function
- `src/context/__tests__/LayoutContext.test.tsx` — context provider in isolation
- `src/components/__tests__/NavigationRail.test.tsx` — component behavior test
- `src/components/__tests__/MobileNav.test.tsx` — component behavior test
- `src/components/__tests__/BookShell.test.tsx` — snapshot + behavior test

## Out of Scope

- Writing tests for all page components (will follow the pattern established)
- E2E testing with Playwright/Cypress
- Coverage gates/enforcement (can add later)
- Visual regression testing
- Performance testing
- Full 100% code coverage requirement

## Further Notes

- This system is designed to be "testing as a must" — new features from any AI agent must include tests
- The `TESTING.md` file serves as the single source of truth for testing conventions
- Worktree scripts should be Windows-first (`.ps1`) but also provide Unix alternatives (`.sh`)
- Representative tests demonstrate patterns; remaining modules should be tested incrementally per feature
