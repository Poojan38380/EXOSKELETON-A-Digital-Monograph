# Exoskeleton

A digital monograph exploring entomology through interactive design and typography.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Testing

This project uses **Vitest** + **Testing Library** for testing. All new features must include tests.

- **Test guide:** See [`TESTING.md`](./TESTING.md) for testing conventions and patterns
- **Test utilities:** `src/test/utils.tsx`, `src/test/mocks.ts`
- **Existing tests:** `src/**/__tests__/*.test.tsx`

## Git Worktrees (Parallel Development)

This project supports multiple AI agents working simultaneously via git worktrees:

```powershell
# Create a worktree for a feature
.\scripts\create-worktree.ps1 feature/my-feature

# List worktrees
git worktree list
```

- **Full guide:** See [`docs/GUIDES/worktree-guide.md`](./docs/GUIDES/worktree-guide.md) for complete instructions for both humans and AI agents

## Project Structure

```
src/
├── components/          # React components
│   ├── pages/          # Page-specific components
│   └── __tests__/      # Component tests
├── context/            # React context providers
│   └── __tests__/      # Context tests
├── content/            # Text content and data
├── layout-engine/      # Text layout algorithms
│   └── __tests__/      # Layout engine tests
├── utils/              # Utility functions
│   └── __tests__/      # Utility tests
├── test/               # Test utilities and setup
└── styles/             # CSS styles
```

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool and dev server
- **Vitest** — Test runner
- **Testing Library** — Component testing

## Documentation

- [`TESTING.md`](./TESTING.md) — Testing guide and conventions
- [`docs/GUIDES/worktree-guide.md`](./docs/GUIDES/worktree-guide.md) — Git worktree guide
- [`docs/PLANS/`](./docs/PLANS/) — Product requirements and plans
- [`docs/TODOS/`](./docs/TODOS/) — Task lists and backlogs
