# Testing Guide

This document defines the testing conventions, utilities, and workflows for this project. **All new features must include tests.**

## Quick Start

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode (run during development)
npm run test:coverage # Run with coverage report
```

## Testing Philosophy

### What Makes a Good Test

1. **Test external behavior, not implementation details** — test what the user sees/does, not how the code achieves it
2. **Deterministic and independent** — tests should pass/fail consistently, regardless of execution order
3. **One reason to fail** — each test should verify exactly one behavior
4. **Fast** — tests should run in milliseconds
5. **Readable** — tests serve as documentation; they should be easy to understand

### Testing Strategy (Tiered)

| Tier | What | When | Example |
|------|------|------|---------|
| **Unit (required)** | Pure functions, utilities, data transforms | Always | `hex-facet-grid.test.ts` |
| **Component (required)** | React components render & interact correctly | Always | `NavigationRail.test.tsx` |
| **Integration (nice-to-have)** | Multi-component flows | For complex interactions | Page navigation flow |
| **E2E (not yet)** | Full browser automation | Future | — |

### Hybrid Approach

- **Testing Library** for behavior tests (required) — test what users see/do
- **Snapshots** selectively for stable, complex structures (optional) — e.g., `BookShell`, `NavigationRail`

## File Organization

Tests are **colocated** with source code in `__tests__/` directories:

```
src/
├── utils/
│   ├── hex-facet-grid.ts
│   └── __tests__/
│       └── hex-facet-grid.test.ts
├── components/
│   ├── BookShell.tsx
│   └── __tests__/
│       └── BookShell.test.tsx
├── context/
│   ├── LayoutContext.tsx
│   └── __tests__/
│       └── LayoutContext.test.tsx
└── layout-engine/
    ├── line-break.ts
    └── __tests__/
        └── line-break.test.ts
```

**Naming convention:** `*.test.ts` or `*.test.tsx`

## Test Utilities

### Import from `src/test/utils.tsx`

```tsx
import { renderWithProviders, renderWithLayoutContext, renderWithPageTheme } from '../test/utils'
```

#### `renderWithProviders(component, options?)`

Renders a component with **all** application context providers (LayoutContext, PageThemeContext).

```tsx
const result = renderWithProviders(<MyComponent />, {
  pageIndex: 2,
  pageId: 'vision',
})
```

#### `renderWithLayoutContext(component, options?)`

Renders with only LayoutContext. Use when testing layout-specific behavior.

```tsx
const result = renderWithLayoutContext(<MyComponent />, {
  navExpanded: true,
})
```

#### `renderWithPageTheme(component, options?)`

Renders with only PageThemeProvider. Use for theme-dependent components.

```tsx
const result = renderWithPageTheme(<MyComponent />, {
  pageIndex: 3,
  pageId: 'metamorphosis',
})
```

### Import from `src/test/mocks.ts`

```tsx
import { mockPages, mockImageUrls, createMockBookNav, createKeyboardEvent } from '../test/mocks'
```

## Writing Tests

### Unit Tests (Pure Functions)

```tsx
import { describe, it, expect } from 'vitest'
import { myFunction } from '../my-module'

describe('myFunction', () => {
  it('should return expected result for valid input', () => {
    expect(myFunction(42)).toBe(84)
  })

  it('should handle edge cases', () => {
    expect(myFunction(0)).toBe(0)
    expect(myFunction(-1)).toBe(-2)
  })
})
```

**Reference:** `src/utils/__tests__/hex-facet-grid.test.ts` — excellent example of thorough unit testing.

### Component Tests (Behavioral)

```tsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/utils'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should render with expected content', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MyComponent />)
    
    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)
    
    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })
})
```

### Context Provider Tests

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LayoutProvider, useLayout } from '../context/LayoutContext'

describe('LayoutContext', () => {
  it('should provide default layout state', () => {
    function TestConsumer() {
      const { navExpanded } = useLayout()
      return <div>{navExpanded ? 'expanded' : 'collapsed'}</div>
    }

    render(
      <LayoutProvider>
        <TestConsumer />
      </LayoutProvider>
    )

    expect(screen.getByText('collapsed')).toBeInTheDocument()
  })
})
```

### Snapshot Tests (Optional, for stable components)

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BookShell } from '../BookShell'

describe('BookShell', () => {
  it('should render with expected structure', () => {
    const { container } = render(
      <BookShell onPageChange={vi.fn()}>
        {() => <div>Page Content</div>}
      </BookShell>
    )
    expect(container).toMatchSnapshot()
  })
})
```

**Note:** Snapshots should be used sparingly. Only for stable, complex components where structural changes are meaningful.

## Test Priority Order

When adding tests, follow this priority:

1. **Priority 1 — Deep modules** (pure functions, utilities): `layout-engine/*`, `utils/*`, `content/*`, `spread-layout.ts`
2. **Priority 2 — React components** (behavioral): `BookShell`, `NavigationRail`, `MobileNav`, `ScrollReveal`, `PageReveal`
3. **Priority 3 — Context providers** (isolation): `LayoutContext`, `PageThemeContext`, `LayoutDataContext`

## Running Tests

### Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Watch mode — reruns on file changes |
| `npm run test:coverage` | Run with coverage report |
| `npm run test:ui` | Open Vitest UI (if installed) |

### Filter Tests

```bash
# Run only tests matching a pattern
npm run test:watch -- line-break

# Run only tests in a specific directory
npm run test:watch -- layout-engine

# Run only failed tests
npm run test:watch -- --failed
```

## Pre-Commit Hooks

Tests run automatically before each commit via Husky. If tests fail, the commit is rejected.

To bypass hooks temporarily (not recommended):
```bash
git commit --no-verify
```

## CI/CD

All tests run on GitHub Actions for every push and PR. The pipeline **fails** if any test fails.

See `.github/workflows/test.yml` for the workflow configuration.

## Adding Tests for New Features

When a new AI agent or developer adds a feature:

1. **Identify the module** being added/modified
2. **Create test file** in `src/path/to/module/__tests__/module.test.ts`
3. **Write tests** following the patterns above
4. **Run tests** with `npm test` before committing
5. **Commit** — pre-commit hooks will verify

### Agent Testing Prompt Template

When assigning testing work to an AI agent:

```
Task: Add tests for <module/component>

Instructions:
1. Read the source file: src/path/to/module.ts
2. Create test file: src/path/to/__tests__/module.test.ts
3. Write tests following existing patterns (see TESTING.md)
4. Use renderWithProviders() for component tests
5. Test behavior, not implementation details
6. Run npm test to verify all tests pass (including existing ones)
7. Report: number of tests added, coverage area, any issues found
```

## Git Worktree Workflow

When working with multiple AI agents simultaneously, use git worktrees:

```bash
# Create a new worktree for a feature
./scripts/create-worktree.ps1 feature/my-feature

# List worktrees
git worktree list

# Remove a worktree when done
git worktree remove ../exoskeleton-my-feature
```

Each worktree is an isolated checkout on its own branch. Agents can work independently without conflicts.

**Full guide:** See [`.github/docs/GUIDES/worktree-guide.md`](./.github/docs/GUIDES/worktree-guide.md) for complete instructions for both humans and AI agents.
