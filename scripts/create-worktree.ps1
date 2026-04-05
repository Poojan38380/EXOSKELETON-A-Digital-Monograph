# Worktree Management Script for Exoskeleton
# Usage: .\scripts\create-worktree.ps1 <branch-name>
# Example: .\scripts\create-worktree.ps1 feature/testing-system

param(
    [Parameter(Mandatory = $true)]
    [string]$BranchName
)

# Configuration
$RootDir = Split-Path -Parent $PSScriptRoot
$BaseName = Split-Path -Leaf $RootDir
$WorktreeDir = "$RootDir-$( $BranchName -replace '[/\\]', '-' )"

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Reset = "`e[0m"

function Write-Info {
    param([string]$Message)
    Write-Host "${Green}[INFO]${Reset} $Message"
}

function Write-Warn {
    param([string]$Message)
    Write-Host "${Yellow}[WARN]${Reset} $Message"
}

function Write-Err {
    param([string]$Message)
    Write-Host "${Red}[ERROR]${Reset} $Message"
}

# Check if we're in a git repository
if (!(git rev-parse --is-inside-work-tree 2>$null)) {
    Write-Err "Not a git repository. Please run this from the Exoskeleton directory."
    exit 1
}

# Check if branch name is valid
if ($BranchName -match '^[a-zA-Z0-9/_-]+$') {
    Write-Info "Creating worktree for branch: $BranchName"
} else {
    Write-Err "Invalid branch name. Use only alphanumeric characters, slashes, hyphens, and underscores."
    exit 1
}

# Check if worktree already exists
if (Test-Path $WorktreeDir) {
    Write-Err "Worktree already exists at: $WorktreeDir"
    Write-Info "To remove it, run: git worktree remove '$WorktreeDir'"
    exit 1
}

# Check if branch exists remotely or locally
$BranchExistsLocally = git branch --list $BranchName
$BranchExistsRemotely = git branch -r --list "origin/$BranchName"

if ($BranchExistsLocally) {
    # Branch exists locally, create worktree from it
    Write-Info "Branch '$BranchName' exists locally. Creating worktree..."
    git worktree add $WorktreeDir $BranchName
} elseif ($BranchExistsRemotely) {
    # Branch exists on remote, create worktree tracking it
    Write-Info "Branch '$BranchName' exists on remote. Creating worktree..."
    git worktree add $WorktreeDir -b $BranchName origin/$BranchName
} else {
    # Branch doesn't exist, create new branch from current HEAD
    Write-Warn "Branch '$BranchName' doesn't exist. Creating new branch from current HEAD."
    git worktree add $WorktreeDir -b $BranchName HEAD
}

if ($LASTEXITCODE -eq 0) {
    Write-Info "Worktree created successfully!"
    Write-Info ""
    Write-Info "Worktree location: $WorktreeDir"
    Write-Info "Branch: $BranchName"
    Write-Info ""
    Write-Info "To use the worktree:"
    Write-Info "  cd '$WorktreeDir'"
    Write-Info "  npm install"
    Write-Info "  npm run dev"
    Write-Info ""
    Write-Info "To list all worktrees:"
    Write-Info "  git worktree list"
    Write-Info ""
    Write-Info "To remove the worktree when done:"
    Write-Info "  git worktree remove '$WorktreeDir'"
    Write-Info "  git branch -d $BranchName  # (if you want to delete the branch)"
} else {
    Write-Err "Failed to create worktree. Check git output above."
    exit 1
}
