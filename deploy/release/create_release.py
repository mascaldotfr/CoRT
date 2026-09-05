#!/usr/bin/env python3
"""
Script for generating release tarballs and template release notes.
Meant for CoRT release candidates and stable releases.
Usage:
python3 create_release.py          # Default: remove preloads, cache-bust, package
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

def check_command(cmd: str) -> bool:
    """Check if a command is available in PATH."""
    return shutil.which(cmd) is not None

def run_command(cmd: list[str], cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess:
    """Run a shell command and return the result."""
    return subprocess.run(
            cmd,
            cwd=cwd,
            check=check,
            capture_output=True,
            text=True
            )

def get_git_tags() -> tuple[str, str]:
    """Get the latest tag and the previous stable tag (x.y.z format)."""
    result = run_command(["git", "tag", "--sort=-creatordate"])
    all_tags = [t for t in result.stdout.strip().split("\n") if t]
    if not all_tags:
        return "v0.0.0", "v0.0.0"

    latest_tag = all_tags[0]

    # Find previous stable tag
    stable_tags = [t for t in all_tags if re.match(r"^\d+\.\d+\.\d+$", t)]
    if len(stable_tags) >= 2:
       previous_tag = stable_tags[1]
    elif stable_tags:
        previous_tag = stable_tags[0]
    else:
        previous_tag = all_tags[1] if len(all_tags) > 1 else all_tags[0]

    return latest_tag, previous_tag


def copy_git_files(source: Path, target: Path) -> None:
    """Copy all git-tracked files to target directory preserving structure."""
    print(source)
    result = run_command(["git", "ls-files", "-z"], cwd=source)
    files = [f for f in result.stdout.strip("\0").split("\0") if f]

    for file in files:
        src_path = source / file
        dst_path = target / file
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_path, dst_path)

def inject_version_meta(target: Path, version: str) -> None:
    """Inject the build version as a meta tag in all HTML files."""
    meta_tag = f'<meta name="cort-version" content="{version}">'

    for html_file in target.rglob("*.html"):
        content = html_file.read_text(encoding="utf-8")

        # Clean up any existing tag to avoid duplicates on re-runs
        content = re.sub(r'\s*<meta name="cort-version"[^>]*>', '', content)

        # Inject neatly after the charset meta tag
        if '<meta charset="utf-8">' in content:
            content = content.replace(
                    '<meta charset="utf-8">',
                    f'<meta charset="utf-8">\n\t\t{meta_tag}'
                    )
        elif '<head>' in content:
            content = content.replace(
                    '<head>',
                    f'<head>\n\t\t{meta_tag}'
                    )

        html_file.write_text(content, encoding="utf-8")

def create_tarball(source: Path, version: str, output_path: Path) -> None:
    """Create the release tarball with composer dependencies."""
    print("Installing composer dependencies...")
    run_command(
            ["composer", "install", "--no-dev", "--optimize-autoloader"],
            cwd=source
            )

    print(f"Generating tarball: {output_path}")
    tar_cmd = [
            "tar", "-czf", str(output_path),
            "--transform", f"s,^,CoRT-{version}/,",
            "."
            ]
    run_command(tar_cmd, cwd=source)

def generate_release_notes(output_path: Path, version: str, previous_version: str) -> Path:
    """Generate the release notes template file."""
    notes_path = Path(str(output_path) + ".release_notes.md")
    content = f"""## Main highlights
### Next release
No schedule.

## About
See  https://codeberg.org/mascal/CoRT/src/branch/main/deploy to deploy it

To setup CoRT on managed webhosting or integrating it on your own server, use **CoRT-{version}.tar.gz** instead of the source code.

### Changelog
**Full Changelog**: https://codeberg.org/mascal/CoRT/compare/{previous_version}...{version}
"""
    notes_path.write_text(content, encoding="utf-8")
    return notes_path

def main() -> None:
    """Main entry point."""

    if not check_command("composer"):
        print("ERROR: COMPOSER not found, install php-composer!!!")
        sys.exit(1)

    try:
        result = run_command(["git", "rev-parse", "--show-toplevel"])
        repo_root = Path(result.stdout.strip())
    except subprocess.CalledProcessError:
        print("ERROR: Not in a git repository!")
        sys.exit(1)

    latest_version, previous_version = get_git_tags()
    print(f"===> Found version {latest_version}")

    print("===> Creating staging directory and copying files")
    with tempfile.TemporaryDirectory() as tmpdir:
        target = Path(tmpdir) / f"CoRT-{latest_version}"
        target.mkdir(parents=True)

        copy_git_files(repo_root, target)

        print("===> Applying source code transformations")
        os.chdir(target)

        print("Injecting version meta tag")
        inject_version_meta(target, latest_version)

        tarball_path = Path("/tmp") / f"CoRT-{latest_version}.tar.gz"
        create_tarball(target, latest_version, tarball_path)

        print("Generating release note template...")
        notes_path = generate_release_notes(tarball_path, latest_version, previous_version)

        print("===> Cleaning up")
        print(f"===> Tarball generated at {tarball_path}")
        print(f"===> Template release notes generated at {notes_path}")

if __name__ == "__main__":
    main()


# vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 filetype=python:
