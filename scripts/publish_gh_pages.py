#!/usr/bin/env python3
"""Automate publishing the Next.js static export to the gh-pages branch.

The script mirrors the manual worktree + robocopy flow documented previously but uses
cross-platform Python utilities so it works on macOS, Linux, and Windows alike.

Example:
    python scripts/publish_gh_pages.py --message "Refresh static export"
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BUILD_DIR = REPO_ROOT / "frontend" / "out"
WORKTREE_DIR = REPO_ROOT.parent / f"{REPO_ROOT.name}-gh-pages"


def run(command: list[str], cwd: Path) -> None:
    """Run a shell command with error handling."""
    subprocess.run(command, cwd=cwd, check=True)


def branch_exists(ref: str) -> bool:
    """Return whether a local or remote git ref exists."""
    return subprocess.run(
        ["git", "rev-parse", "--verify", "--quiet", ref],
        cwd=REPO_ROOT,
    ).returncode == 0


def add_pages_worktree(target: Path) -> None:
    """Create a gh-pages worktree from local/remote branch, or orphan it on first deploy."""
    subprocess.run(["git", "fetch", "origin", "gh-pages"], cwd=REPO_ROOT)
    if branch_exists("refs/heads/gh-pages"):
        run(["git", "worktree", "add", "-f", str(target), "gh-pages"], cwd=REPO_ROOT)
        return
    if branch_exists("refs/remotes/origin/gh-pages"):
        run(["git", "worktree", "add", "-f", "-b", "gh-pages", str(target), "origin/gh-pages"], cwd=REPO_ROOT)
        return

    run(["git", "worktree", "add", "-f", "--detach", str(target), "HEAD"], cwd=REPO_ROOT)
    run(["git", "checkout", "--orphan", "gh-pages"], cwd=target)


def ensure_build_exists() -> None:
    """Validate that `frontend/out` exists before publishing.

    Users must run `npm run build` in the frontend before executing this script.
    """
    if not BUILD_DIR.exists():
        raise FileNotFoundError(
            f"Build artifacts not found at {BUILD_DIR}. Run `npm run build` first."
        )


def clear_worktree(target: Path) -> None:
    """Remove everything except the `.git` folder inside the worktree."""
    for entry in target.iterdir():
        if entry.name == ".git":
            continue
        if entry.is_dir():
            shutil.rmtree(entry)
        else:
            entry.unlink()


def copy_export(target: Path) -> None:
    """Copy the Next.js export and create the `.nojekyll` marker."""
    shutil.copytree(BUILD_DIR, target, dirs_exist_ok=True)
    (target / ".nojekyll").touch()


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--message",
        default="Refresh static export",
        help="Commit message to use on the gh-pages branch.",
    )
    parser.add_argument(
        "--skip-push",
        action="store_true",
        help="Prepare the worktree and commit but skip `git push`.",
    )
    return parser.parse_args()


def main() -> int:
    """Entrypoint for publishing to gh-pages."""
    ensure_build_exists()
    args = parse_args()

    add_pages_worktree(WORKTREE_DIR)
    try:
        clear_worktree(WORKTREE_DIR)
        copy_export(WORKTREE_DIR)
        run(["git", "add", "-A"], cwd=WORKTREE_DIR)
        diff = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=WORKTREE_DIR)
        if diff.returncode == 0:
            print("No changes to publish; gh-pages is already up to date.")
            return 0
        run(["git", "commit", "-m", args.message], cwd=WORKTREE_DIR)
        if not args.skip_push:
            run(["git", "push", "origin", "gh-pages"], cwd=WORKTREE_DIR)
    finally:
        run(["git", "worktree", "remove", str(WORKTREE_DIR)], cwd=REPO_ROOT)

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except FileNotFoundError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
    except subprocess.CalledProcessError as error:
        print(f"Command failed: {' '.join(error.cmd)}", file=sys.stderr)
        raise SystemExit(error.returncode)
