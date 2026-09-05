#!/usr/bin/env python3
# vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 filetype=python:
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

# Change this if you want all optims on your own site
cort_dot_ovh = "https://cort.ovh"

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

def inject_api_preloads(target: Path) -> None:
    """Inject strategic API preloads into specific HTML files to reduce RTT.

    Preloads are only injected when the corresponding localStorage cache
    is not already populated, avoiding unnecessary network requests.
    Skipped on Apple devices due to known browser quirks with fetch preloads.
    """
    preloads = {
        "bosses.html": ("api/bin/bosses/bosses.php", "bosses_api_result_v2"),
        "bz.html": ("api/bin/bz/bz.php", "bz_api_result_v2"),
        "wz.html": ("api/var/wstatus.json", "wz_api_result"),
        "wevents.html": ("api/var/events.json", "wevents_api_result"),
        "wstats.html": ("api/var/stats.json", "wstats_api_result"),
    }

    for filename, (api_url, ls_key) in preloads.items():
        html_file = target / filename
        if not html_file.exists():
            continue

        content = html_file.read_text(encoding="utf-8")

        # The regex checks for Mac (macOS), iPhone, iPad, and iPod (iOS)
        script_tag = (
            f'<script>if(!/Mac|iPhone|iPad|iPod/.test(navigator.userAgent)'
            f'&&!localStorage.getItem("{ls_key}"))'
            f'{{const l=document.createElement("link");'
            f'l.rel="preload";l.href="{api_url}";'
            f'l.as="fetch";l.crossOrigin="anonymous";'
            f'document.head.appendChild(l);}}</script>'
        )

        content = content.replace("</head>", f"{script_tag}\n</head>", 1)
        html_file.write_text(content, encoding="utf-8")

def inject_og_image(target: Path) -> None:
    """Injects the canonical og:image meta tag into all HTML files."""
    og_meta = f"""<meta property="og:image" content="{cort_dot_ovh}/favicon_512.png">"""
    
    for html_file in target.rglob("*.html"):
        content = html_file.read_text(encoding="utf-8")
        
        # 1. Clean up any existing og:image tag to avoid duplicates
        content = re.sub(r'\s*<meta property="og:image"[^>]*>', '', content)
        
        # 2. Insert the tag neatly after the meta charset, or fallback to after <head>
        if '<meta charset="utf-8">' in content:
            content = content.replace(
                '<meta charset="utf-8">', 
                f'<meta charset="utf-8">\n\t\t{og_meta}'
            )
        elif '<head>' in content:
            content = content.replace(
                '<head>', 
                f'<head>\n\t\t{og_meta}'
            )
            
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
    
    # Update HTML references to point only to style.css
    for html_file in target.rglob("*.html"):
        content = html_file.read_text(encoding="utf-8")
        def filter_stylesheet(match: re.Match) -> str:
            tag = match.group(0)
            if 'href="css/style.css"' in tag or "href='css/style.css'" in tag or "href=css/style.css" in tag:
                return tag
            return ""
            
        content = re.sub(r'<link[^>]*rel="stylesheet"[^>]*>', filter_stylesheet, content, flags=re.IGNORECASE)
        html_file.write_text(content, encoding="utf-8")

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

def apply_per_file_cache_busting(target: Path) -> None:
    """Compute per-file content hashes, rename files, and update references in HTML/JS."""
    target_resolved = target.resolve()
    asset_hashes: dict[str, str] = {}

    # 1. Compute SHA256 hashes for all CSS/JS files
    for ext in ["*.css", "*.js"]:
        for file in target.rglob(ext):
            # EXCEPTION: Skip sw.js to avoid breaking service worker registration/update logic
            if file.name == "sw.js":
                continue
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
                hash_val = asset_hashes[rel]
                dir_name = os.path.dirname(path)
                old_name = os.path.basename(path)
                name, ext = os.path.splitext(old_name)
                new_name = f"{name}.{hash_val}{ext}"
                # Preserve relative path prefixes like ./ or ../
                new_path = os.path.join(dir_name, new_name).replace(os.sep, '/')
                return f'{attr}={quote}{new_path}{quote}'
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
                hash_val = asset_hashes[rel]
                dir_name = os.path.dirname(path)
                old_name = os.path.basename(path)
                name, ext = os.path.splitext(old_name)
                new_name = f"{name}.{hash_val}{ext}"
                new_path = os.path.join(dir_name, new_name).replace(os.sep, '/')
                return f"{quote}{new_path}{quote}"
            return match.group(0)

        new_content = js_pattern.sub(replace_js, content)
        if new_content != content:
            updated_js += 1
            js_file.write_text(new_content, encoding="utf-8")

    # 4. Update defer.js prefetch URLs
    defer_file = target / "js" / "defer.js"
    if defer_file.exists():
        content = defer_file.read_text(encoding="utf-8")
        defer_dir = defer_file.parent.resolve()
        modified = False

        def replace_js_url(match: re.Match) -> str:
            nonlocal modified
            quote = match.group(1)
            path = match.group(2)
            
            # Try direct lookup (for root-relative paths like "js/bosses.js")
            if path in asset_hashes:
                modified = True
                hash_val = asset_hashes[path]
                dir_name = os.path.dirname(path)
                old_name = os.path.basename(path)
                name, ext = os.path.splitext(old_name)
                new_name = f"{name}.{hash_val}{ext}"
                new_path = os.path.join(dir_name, new_name).replace(os.sep, '/')
                return f"{quote}{new_path}{quote}"
            
            # Try resolving relative to defer.js location (for "./utils.js" style)
            try:
                abs_path = (defer_dir / path).resolve()
                rel_to_target = abs_path.relative_to(target_resolved).as_posix()
                if rel_to_target in asset_hashes:
                    modified = True
                    hash_val = asset_hashes[rel_to_target]
                    dir_name = os.path.dirname(path)
                    old_name = os.path.basename(path)
                    name, ext = os.path.splitext(old_name)
                    new_name = f"{name}.{hash_val}{ext}"
                    new_path = os.path.join(dir_name, new_name).replace(os.sep, '/')
                    return f"{quote}{new_path}{quote}"
            except ValueError:
                pass
            
            return match.group(0)

        new_content = re.sub(
            r'(["\'])([^"\']+?\.js)\1',
            replace_js_url,
            content
        )
        if modified:
            defer_file.write_text(new_content, encoding="utf-8")

    # 5. Rename files on disk
    for rel, hash_val in asset_hashes.items():
        old_path = target / rel
        if old_path.exists():
            dir_name = os.path.dirname(rel)
            old_name = os.path.basename(rel)
            name, ext = os.path.splitext(old_name)
            new_name = f"{name}.{hash_val}{ext}"
            new_rel = os.path.join(dir_name, new_name).replace(os.sep, '/')
            new_path = target / new_rel
            old_path.rename(new_path)

    print(f"===> Per-file cache busting applied (renamed): {updated_html} HTML, {updated_js} JS files updated.")

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
                # mtime=0 ensures identical output across builds & avoids cache busting
                with gzip.GzipFile(str(gz_path), 'wb', compresslevel=9, mtime=0) as f_out:
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
        do_api_preloads = True
    else:
        keep_preload = False
        one_css = False
        do_minify = False
        do_gzip = False
        do_api_preloads = False

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

        print("Injecting canonical og:image meta tag")
        inject_og_image(target)
        
        if not keep_preload:
            print("Removing preloading statements")
            remove_preload_statements(target)
            
        if do_api_preloads:
            print("Injecting strategic API preloads")
            inject_api_preloads(target)
            
        if one_css:
            print("Fusing all CSS files")
            fuse_css_files(target)
            

        print("Injecting version meta tag")
        inject_version_meta(target, version)

		# Replace eheader.php with eheader.cort.ovh.php
        src_cortovh = Path("api/bin/lib/eheader.cort.ovh.php")
        dst_header = Path("api/bin/lib/eheader.php")

        if src_cortovh.exists():
            print("===> Replacing eheader.php with eheader.cort.ovh.php")
            shutil.copy2(src_cortovh, dst_header)
        else:
            print("WARNING: api/bin/lib/eheader.cort.ovh.php not found. CORS will remain open (*).")

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
