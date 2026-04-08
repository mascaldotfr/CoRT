#!/usr/bin/env python3
"""
Script for generating release tarballs and template release notes.
Meant for CoRT release candidates and stable releases.

Usage:
  python3 create_release.py          # Default: remove preloads, cache-bust, package
  python3 create_release.py --mascal # Apply all optimizations (keep preloads, fuse CSS, minify, gzip, cache-bust)
"""

import argparse
import gzip
import hashlib
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
    result = run_command(["git", "ls-files", "-z"], cwd=source)
    files = [f for f in result.stdout.strip("\0").split("\0") if f]
    
    for file in files:
        src_path = source / file
        dst_path = target / file
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_path, dst_path)


def remove_preload_statements(target: Path) -> None:
    """Remove all <link rel="preload"> statements from HTML files."""
    for html_file in target.rglob("*.html"):
        content = html_file.read_text(encoding="utf-8")
        content = re.sub(r'<link rel="preload"[^>]*>\s*', '', content)
        html_file.write_text(content, encoding="utf-8")


def fuse_css_files(target: Path) -> None:
    """Fuse all CSS files into a single css/style.css."""
    css_dir = target / "css"
    if not css_dir.exists():
        return
    
    main_css = css_dir / "style.css"
    combined = main_css.read_text(encoding="utf-8") if main_css.exists() else ""
    
    other_css = sorted([f for f in css_dir.glob("*.css") if f.name != "style.css"])
    for css_file in other_css:
        combined += f"\n/* {css_file.name} */\n"
        combined += css_file.read_text(encoding="utf-8")
    
    for css_file in css_dir.glob("*.css"):
        css_file.unlink()
    
    main_css.write_text(combined, encoding="utf-8")
    
    for html_file in target.rglob("*.html"):
        content = html_file.read_text(encoding="utf-8")
        def filter_stylesheet(match: re.Match) -> str:
            tag = match.group(0)
            if 'href="css/style.css"' in tag or "href='css/style.css'" in tag or "href=css/style.css" in tag:
                return tag
            return ""
        content = re.sub(r'<link[^>]*rel="stylesheet"[^>]*>', filter_stylesheet, content, flags=re.IGNORECASE)
        html_file.write_text(content, encoding="utf-8")


def update_version_in_menu(target: Path, version: str) -> None:
    """Update the version comment in js/menu.js."""
    menu_file = target / "js" / "menu.js"
    if menu_file.exists():
        content = menu_file.read_text(encoding="utf-8")
        content = re.sub(
            r'(<!--VERSION-->Version: ).+',
            rf'\g<1>{version}',
            content
        )
        menu_file.write_text(content, encoding="utf-8")


def apply_per_file_cache_busting(target: Path) -> None:
    """Compute per-file content hashes and update references in HTML/JS."""
    target_resolved = target.resolve()
    asset_hashes: dict[str, str] = {}
    
    # 1. Compute SHA256 hashes for all CSS/JS files
    for ext in ["*.css", "*.js"]:
        for file in target.rglob(ext):
            rel = file.relative_to(target).as_posix()
            asset_hashes[rel] = hashlib.sha256(file.read_bytes()).hexdigest()[:8]

    # Patterns for HTML src/href attributes and JS import/require strings
    html_pattern = re.compile(
        r'(href|src)\s*=\s*(?P<quote>["\']?)(?P<path>[^"\'>\s]+\.(?:css|js))(?:\?[^"\'>\s]*)?(?P=quote)',
        re.IGNORECASE
    )
    js_pattern = re.compile(
        r'(?P<quote>["\'])(?P<path>[^"\']+\.(?:js|mjs))(?:\?[^"\']*)?(?P=quote)'
    )

    updated_html = 0
    updated_js = 0

    # 2. Update HTML references
    for html_file in target.rglob("*.html"):
        content = html_file.read_text(encoding="utf-8")
        html_dir = html_file.parent
        
        def replace_html(match: re.Match) -> str:
            attr = match.group(1)
            quote = match.group('quote')
            path = match.group('path')
            try:
                resolved = (html_dir / path).resolve()
                rel = resolved.relative_to(target_resolved).as_posix()
            except ValueError:
                return match.group(0)
            
            if rel in asset_hashes:
                return f'{attr}={quote}{path}?{asset_hashes[rel]}{quote}'
            return match.group(0)

        new_content = html_pattern.sub(replace_html, content)
        if new_content != content:
            updated_html += 1
            html_file.write_text(new_content, encoding="utf-8")

    # 3. Update JS references (imports, dynamic imports, require)
    for js_file in target.rglob("*.js"):
        content = js_file.read_text(encoding="utf-8")
        js_dir = js_file.parent
        
        def replace_js(match: re.Match) -> str:
            quote = match.group('quote')
            path = match.group('path')
            try:
                resolved = (js_dir / path).resolve()
                rel = resolved.relative_to(target_resolved).as_posix()
            except ValueError:
                return match.group(0)
            
            if rel in asset_hashes:
                return f"{quote}{path}?{asset_hashes[rel]}{quote}"
            return match.group(0)

        new_content = js_pattern.sub(replace_js, content)
        if new_content != content:
            updated_js += 1
            js_file.write_text(new_content, encoding="utf-8")

    print(f"===> Per-file cache busting applied: {updated_html} HTML, {updated_js} JS files updated.")


def minify_files(target: Path) -> None:
    """Minify CSS, JS, HTML, and JSON files using the minify command."""
    if not check_command("minify"):
        print("ERROR: minify not found, please install it!")
        sys.exit(1)
    
    print("Minifying assets (may be slow)")
    extensions = ["*.css", "*.js", "*.html", "*.json"]
    for ext in extensions:
        for file in target.rglob(ext):
            try:
                run_command(["minify", "-q", "-i", str(file)], check=False)
            except Exception:
                continue


def gzip_files(target: Path) -> None:
    """Create .gz precompressed files for HTML, CSS, JS, and JSON."""
    print("GZIPing assets (may be slow)")
    extensions = ["*.html", "*.css", "*.js", "*.json"]
    for ext in extensions:
        for file in target.rglob(ext):
            gz_path = Path(str(file) + ".gz")
            with open(file, 'rb') as f_in:
                with gzip.open(gz_path, 'wb', compresslevel=9) as f_out:
                    shutil.copyfileobj(f_in, f_out)


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


def parse_arguments() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Generate release tarballs and template release notes for CoRT"
    )
    parser.add_argument(
        "--mascal",
        action="store_true",
        help="Apply all optimizations: keep preloads, fuse CSS, minify assets, and precompress with GZIP"
    )
    return parser.parse_args()


def main() -> None:
    """Main entry point."""
    args = parse_arguments()
    
    if not check_command("composer"):
        print("ERROR: COMPOSER not found, install php-composer!!!")
        sys.exit(1)
    
    # Configuration based on --mascal flag
    if args.mascal:
        print("===> Applying all cort.ovh optims!")
        keep_preload = True
        one_css = True
        do_minify = True
        do_gzip = True
    else:
        keep_preload = False
        one_css = False
        do_minify = False
        do_gzip = False

    try:
        result = run_command(["git", "rev-parse", "--show-toplevel"])
        repo_root = Path(result.stdout.strip())
    except subprocess.CalledProcessError:
        print("ERROR: Not in a git repository!")
        sys.exit(1)
    
    version, previous_version = get_git_tags()
    print(f"===> Found version {version}. Previous one was {previous_version}.")
    
    print("===> Creating staging directory and copying files")
    with tempfile.TemporaryDirectory() as tmpdir:
        target = Path(tmpdir) / f"CoRT-{version}"
        target.mkdir(parents=True)
        
        copy_git_files(repo_root, target)
        
        print("===> Applying source code transformations")
        os.chdir(target)
        
        if not keep_preload:
            print("Removing preloading statements")
            remove_preload_statements(target)
        
        if one_css:
            print("Fusing all CSS files")
            fuse_css_files(target)
            
        print("Updating version string")
        update_version_in_menu(target, version)
        
        # Minify BEFORE cache busting so hashes match delivered content
        if do_minify:
            minify_files(target)
            
        # Apply per-file cache busting based on final transformed content
        print("Applying per-file cache busting")
        apply_per_file_cache_busting(target)
        
        # Gzip AFTER all transformations
        if do_gzip:
            gzip_files(target)
        
        tarball_path = Path("/tmp") / f"CoRT-{version}.tar.gz"
        create_tarball(target, version, tarball_path)
        
        print("Generating release note template...")
        notes_path = generate_release_notes(tarball_path, version, previous_version)
    
    print("===> Cleaning up")
    print(f"===> Tarball generated at {tarball_path}")
    print(f"===> Template release notes generated at {notes_path}")


if __name__ == "__main__":
    main()
