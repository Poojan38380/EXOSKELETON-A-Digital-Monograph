# Git Worktree Guide for Exoskeleton

## What Are Worktrees?

A git worktree is a **separate checkout** of your repository on a different branch. Think of it as having multiple independent copies of your project, all sharing the same git history.

For this project, worktrees enable:
- **Parallel development** — Multiple AI agents work on different features simultaneously without conflicts
- **Isolated testing** — Test a feature without affecting your main work
- **Quick context switching** — Jump between branches without stashing/stopping work

## Quick Reference

| Task | Command |
|------|---------|
| Create worktree | `.\scripts\create-worktree.ps1 feature/my-feature` |
| List worktrees | `git worktree list` |
| Remove worktree | `git worktree remove ../exoskeleton-feature-my-feature` |
| Enter worktree | `cd ../exoskeleton-feature-my-feature` |

---

## For AI Agents

### Your Worktree Identity

When an AI agent is assigned a task, it should:

1. **Create a unique worktree** using a descriptive branch name:
   ```powershell
   .\scripts\create-worktree.ps1 feature/<task-description>
   ```

2. **Work exclusively in that worktree** — do not modify the main checkout

3. **Commit changes** with clear, descriptive messages

4. **Report the branch name** when the task is complete so it can be merged

### Example Agent Workflow

```powershell
# 1. Create worktree for your task
.\scripts\create-worktree.ps1 feature/add-page-animations

# 2. Navigate to it
cd ../exoskeleton-feature-add-page-animations

# 3. Install dependencies (first time only)
npm install

# 4. Do your work — edit files, add features, write tests

# 5. Test your changes
npm test
npm run build

# 6. Commit your changes
git add .
git commit -m "feat: add smooth page turn animations"

# 7. Report completion:
#    "Task complete. Changes pushed to branch: feature/add-page-animations"
#    "Worktree location: ../exoskeleton-feature-add-page-animations"
```

### Agent Rules

1. **NEVER** modify the main worktree (`exoskeleton/`) unless explicitly instructed
2. **ALWAYS** create a worktree for your task
3. **ALWAYS** run `npm test` before reporting completion
4. **NEVER** delete another agent's worktree
5. **ALWAYS** use descriptive branch names (e.g., `fix/nav-scroll-bug`, not `fix-1`)

### Agent Prompt Template

When assigning a task to an AI agent, use this format:

```
Task: <describe what needs to be done>

Instructions:
1. Create a worktree: .\scripts\create-worktree.ps1 feature/<descriptive-name>
2. Work in that worktree: cd ../exoskeleton-feature-<name>
3. Install dependencies: npm install
4. Implement the feature/fix
5. Write tests for new code
6. Run npm test to verify everything passes
7. Report: branch name, what was changed, and any notes for merging
```

### Coordination Between Agents

When multiple agents are working simultaneously:

1. **Agent Coordination Format** — When an agent completes work, report:
   ```
   Task Complete: <brief description>
   Branch: feature/<branch-name>
   Worktree: ../exoskeleton-feature-<name>
   Changes: <list key files/features modified>
   Tests: <number of tests added/passing>
   Notes: <any merge considerations>
   ```

2. **Conflict Avoidance** — Agents should:
   - Communicate which files/modules they're working on
   - Avoid editing the same files simultaneously
   - Use granular, focused commits

---

## For Human Developers

### Creating Worktrees

#### Using the Script (Recommended)

```powershell
# From the main exoskeleton directory
.\scripts\create-worktree.ps1 feature/my-feature
```

The script will:
- Create a worktree at `../exoskeleton-feature-my-feature`
- Create a new branch `feature/my-feature` from current HEAD
- Or use an existing branch if it already exists

#### Manual Creation

```powershell
# Create worktree with a new branch
git worktree add ../exoskeleton-my-feature -b feature/my-feature

# Create worktree from existing branch
git worktree add ../exoskeleton-my-feature feature/my-feature

# Create worktree tracking a remote branch
git worktree add ../exoskeleton-my-feature -b feature/my-feature origin/feature/my-feature
```

### Managing Worktrees

```powershell
# List all worktrees
git worktree list

# See where each worktree is and what branch it's on
# Output: D:/Arthur/WORKSPACE/GOOD ENOUGH/exoskeleton  c7ec6a3 [main]
#         D:/Arthur/WORKSPACE/GOOD ENOUGH/exoskeleton-feature-xyz  abc1234 [feature/xyz]

# Remove a worktree (when task is complete and merged)
git worktree remove ../exoskeleton-feature-xyz

# Force remove if worktree has uncommitted changes (be careful!)
git worktree remove ../exoskeleton-feature-xyz --force
```

### Recommended Workflow

1. **Main worktree** (`exoskeleton/`) — Keep on `main` branch. Use for reference, testing merges, running the stable app.

2. **Feature worktrees** — One per task/agent:
   ```
   exoskeleton/                    ← main (stable)
   exoskeleton-feature-nav/        ← feature/nav-redesign (Agent A)
   exoskeleton-feature-tests/      ← feature/testing-system (Agent B)
   exoskeleton-fix-bug-scroll/     ← fix/scroll-jank (Agent C)
   ```

3. **Merge when ready** — From the main worktree:
   ```powershell
   cd ../exoskeleton
   git pull origin main  # Ensure you're up to date
   git merge feature/nav-redesign
   git push origin main
   ```

4. **Clean up** — Remove worktrees after merging:
   ```powershell
   git worktree remove ../exoskeleton-feature-nav
   git branch -d feature/nav-redesign  # Optional: delete local branch
   ```

---

## Directory Structure

```
D:\Arthur\WORKSPACE\GOOD ENOUGH\
├── exoskeleton/                          ← Main worktree (main branch)
│   ├── src/
│   ├── scripts/
│   │   └── create-worktree.ps1
│   └── ...
│
├── exoskeleton-feature-nav/              ← Feature worktree 1
│   ├── src/
│   └── ...
│
├── exoskeleton-feature-tests/            ← Feature worktree 2
│   ├── src/
│   └── ...
│
└── exoskeleton-fix-scroll/               ← Feature worktree 3
    ├── src/
    └── ...
```

All worktrees share the same `.git` directory in the main `exoskeleton/` folder, so they don't duplicate git history.

---

## Common Scenarios

### Scenario 1: Multiple Agents Working in Parallel

You want three agents working simultaneously:

```powershell
# Agent A: Redesign navigation
.\scripts\create-worktree.ps1 feature/nav-redesign

# Agent B: Add testing
.\scripts\create-worktree.ps1 feature/testing-system

# Agent C: Fix scroll bug
.\scripts\create-worktree.ps1 fix/scroll-jank
```

Each agent works in their own worktree. No conflicts until merge time.

### Scenario 2: Testing a PR Before Merging

```powershell
# Fetch the PR branch
git fetch origin feature/some-pr

# Create worktree from it
git worktree add ../exoskeleton-pr-test -b pr-test origin/feature/some-pr

# Test it
cd ../exoskeleton-pr-test
npm install && npm test && npm run build

# Remove when done
cd ../exoskeleton
git worktree remove ../exoskeleton-pr-test
```

### Scenario 3: Quick Hotfix While Working on a Feature

You're in a feature worktree and need to fix a bug on main:

```powershell
# Don't leave your feature worktree! Create a new one:
cd ../exoskeleton
.\scripts\create-worktree.ps1 hotfix/urgent-fix

# Fix the bug in the new worktree
cd ../exoskeleton-hotfix-urgentfix
# ... make changes, commit, push ...

# Return to your original worktree when done
cd ../exoskeleton-feature-xyz
```

### Scenario 4: Cleaning Up Old Worktrees

```powershell
# See all worktrees
git worktree list

# Remove ones you're done with
git worktree remove ../exoskeleton-feature-old-thing
git worktree remove ../exoskeleton-experiment-xyz

# Prune worktrees that no longer exist on disk
git worktree prune
```

---

## Troubleshooting

### "Worktree already exists"

```powershell
# The directory already exists. Either:
# 1. Use the existing worktree
cd ../exoskeleton-feature-xyz

# 2. Remove it and recreate
git worktree remove ../exoskeleton-feature-xyz
.\scripts\create-worktree.ps1 feature/xyz
```

### "Branch already checked out"

```powershell
# A branch can only be checked out in one worktree at a time.
# List worktrees to see where it's checked out:
git worktree list

# If you need it elsewhere, remove the existing worktree first
git worktree remove ../exoskeleton-feature-xyz
```

### "Cannot delete worktree with uncommitted changes"

```powershell
# Option 1: Commit your changes first
git add . && git commit -m "WIP: save progress"
git worktree remove ../exoskeleton-feature-xyz

# Option 2: Force remove (changes are lost!)
git worktree remove ../exoskeleton-feature-xyz --force

# Option 3: Move the worktree and recreate later
mv ../exoskeleton-feature-xyz ../exoskeleton-feature-xyz-backup
git worktree prune
```

### "npm install fails in worktree"

```powershell
# Each worktree needs its own node_modules
cd ../exoskeleton-feature-xyz
npm install
```

### "Tests fail in worktree but pass in main"

```powershell
# Ensure dependencies are up to date
npm install

# Clear any cached files
rm -rf node_modules/.vite
npm test
```

---

## Best Practices

### Do ✅

- Create a new worktree for each independent task
- Use descriptive branch names (`feature/add-dark-mode`, not `feature-1`)
- Run `npm test` in your worktree before reporting completion
- Remove worktrees after their branches are merged
- Keep the main worktree on `main` branch and clean

### Don't ❌

- Don't modify the main worktree while agents are working
- Don't delete worktrees with uncommitted changes
- Don't check out the same branch in multiple worktrees
- Don't nest worktrees inside each other
- Don't commit half-finished work just to switch tasks (use a worktree instead)

---

## Advanced: Locking Worktrees

Prevent accidental deletion of important worktrees:

```powershell
# Lock a worktree
git worktree lock ../exoskeleton-feature-critical

# Unlock when no longer needed
git worktree unlock ../exoskeleton-feature-critical
```

## Advanced: Bare Repos for Complex Setups

If you need even more isolation (e.g., completely separate checkouts for CI testing):

```powershell
# Create a bare clone
git clone --bare . ../exoskeleton-bare.git

# Clone from the bare
git clone ../exoskeleton-bare.git ../exoskeleton-isolated
```

---

## Git Worktree Commands Reference

| Command | Description |
|---------|-------------|
| `git worktree add <path> <branch>` | Create worktree |
| `git worktree list` | List all worktrees |
| `git worktree remove <path>` | Remove worktree |
| `git worktree prune` | Clean up stale worktree metadata |
| `git worktree lock <path>` | Lock worktree |
| `git worktree unlock <path>` | Unlock worktree |
| `git worktree move <old> <new>` | Rename/move worktree |

---

**Remember:** Worktrees are cheap. Create them freely, use them for isolated work, and remove them when done. They share git history, so they don't waste disk space.
