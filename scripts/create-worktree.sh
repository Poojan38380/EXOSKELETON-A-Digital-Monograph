#!/usr/bin/env bash
# Worktree Management Script for Exoskeleton
# Usage: ./scripts/create-worktree.sh <branch-name>
# Example: ./scripts/create-worktree.sh feature/testing-system

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

err() {
    echo -e "${RED}[ERROR]${NC} $1"
}

if [ $# -ne 1 ]; then
    err "Usage: $0 <branch-name>"
    err "Example: $0 feature/testing-system"
    exit 1
fi

BRANCH_NAME="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKTREE_DIR="$ROOT_DIR-$(echo "$BRANCH_NAME" | sed 's|[/\\]|-|g')"

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    err "Not a git repository. Please run this from the Exoskeleton directory."
    exit 1
fi

# Check if branch name is valid
if [[ ! "$BRANCH_NAME" =~ ^[a-zA-Z0-9/_-]+$ ]]; then
    err "Invalid branch name. Use only alphanumeric characters, slashes, hyphens, and underscores."
    exit 1
fi

# Check if worktree already exists
if [ -d "$WORKTREE_DIR" ]; then
    err "Worktree already exists at: $WORKTREE_DIR"
    info "To remove it, run: git worktree remove '$WORKTREE_DIR'"
    exit 1
fi

# Check if branch exists remotely or locally
BRANCH_EXISTS_LOCALLY=$(git branch --list "$BRANCH_NAME")
BRANCH_EXISTS_REMOTELY=$(git branch -r --list "origin/$BRANCH_NAME")

if [ -n "$BRANCH_EXISTS_LOCALLY" ]; then
    # Branch exists locally, create worktree from it
    info "Branch '$BRANCH_NAME' exists locally. Creating worktree..."
    git worktree add "$WORKTREE_DIR" "$BRANCH_NAME"
elif [ -n "$BRANCH_EXISTS_REMOTELY" ]; then
    # Branch exists on remote, create worktree tracking it
    info "Branch '$BRANCH_NAME' exists on remote. Creating worktree..."
    git worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME" "origin/$BRANCH_NAME"
else
    # Branch doesn't exist, create new branch from current HEAD
    warn "Branch '$BRANCH_NAME' doesn't exist. Creating new branch from current HEAD."
    git worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME" HEAD
fi

info "Worktree created successfully!"
echo ""
info "Worktree location: $WORKTREE_DIR"
info "Branch: $BRANCH_NAME"
echo ""
info "To use the worktree:"
info "  cd '$WORKTREE_DIR'"
info "  npm install"
info "  npm run dev"
echo ""
info "To list all worktrees:"
info "  git worktree list"
echo ""
info "To remove the worktree when done:"
info "  git worktree remove '$WORKTREE_DIR'"
info "  git branch -d $BRANCH_NAME  # (if you want to delete the branch)"
