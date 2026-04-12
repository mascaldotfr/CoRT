# CoRT Release Builder

A Python utility for automating the generation of production-ready release tarballs and template release notes for the **CoRT** project. 

This script handles asset optimization, content-based cache busting, dependency installation, and packaging in a single, reliable command.

## 📖 Overview & Origin
This script is a modern, vibecoded, **Python rewrite** of the original `old.create_release` shell script. It preserves the original workflow and intent while significantly improving:
- **Reliability:** Robust error handling, proper path resolution, and safe temporary directory management.
- **Minification Safety:** Advanced regex patterns that correctly handle both quoted and unquoted HTML/JS attributes (common after aggressive minification).
- **Cache Busting:** Replaced single-version cache busting with **per-file SHA-256 content hashing** for optimal browser caching.
- **Maintainability:** Clean, modular Python code with type hints, explicit encoding, and comprehensive logging.

## 🚀 Features
- 🔍 Automatic version detection from Git tags (`x.y.z` format)
- 🧹 Optional removal of `<link rel="preload">` statements
- 📦 CSS fusion into a single `css/style.css`
- 🔐 **Per-file cache busting** using SHA-256 hashes (computed *after* transformations)
- 🗜️ Asset minification (HTML, CSS, JS, JSON)
- 📦 GZIP precompression (`.file.gz` generation)
- 🐘 Automatic `composer install` for PHP dependencies
- 📝 Automatic release notes template generation with Codeberg changelog links

## 📋 Prerequisites
Ensure the following tools are installed and available in your `$PATH`:

### Core Requirements
- **Python 3.9+** (uses modern syntax like `list[str]` and `Path.removeprefix()`)
- **Git** (for tag detection and file tracking)
- **PHP Composer** (required for dependency resolution)
- **`tar` & `gzip`** (standard on Linux/macOS; included in most minimal Unix environments)

### Optional (External) Dependencies
- **`minify` CLI tool** *(required only when using `--mascal`)*
  - Used for minifying HTML, CSS, JS, and JSON assets.
  - Recommended: [tdewolff/minify](https://github.com/tdewolff/minify) (Go-based, fast, and cross-platform)
  - ⚠️ **Note:** The Debian 13 repository version is outdated and may fail. Install a recent release manually or via `go install github.com/tdewolff/minify/cmd/minify@latest`.

## 🛠️ Usage
Run the script from anywhere within your CoRT Git repository. It will automatically locate the repository root.

```bash
# Release mode: removes preloads, applies per-file cache busting, packages release
python3 create_release.py

# cort.ovh mode: enables all optimizations (CSS fusion, minification, GZIP, keeps preloads)
python3 create_release.py --mascal
```

## 🔄 Build Pipeline
When executed, the script follows this exact sequence to ensure hashes match the final delivered assets:
1. Detects the latest Git tag and previous stable version
2. Creates a temporary staging directory and copies all Git-tracked files
3. Applies transformations (preload removal, CSS fusion, version string update)
4. Minifies assets (if `--mascal` is used)
5. Computes SHA-256 hashes for all `.css` and `.js` files
6. Injects cache-busting query strings into HTML & JS references
7. Generates `.gz` precompressed files (if `--mascal` is used)
8. Runs `composer install --no-dev`
9. Packages everything into a `.tar.gz` archive
10. Generates a Markdown release notes template

## 📤 Output Files
All generated files are placed in `/tmp/`:
- `CoRT-<version>.tar.gz` → Production-ready release archive
- `CoRT-<version>.tar.gz.release_notes.md` → Changelog template ready for GitHub/Codeberg releases

## ⚠️ Notes & Known Limitations
- The script assumes a standard web project structure with `html/`, `css/`, `js/`, and `composer.json` at the repository root.
- Cache busting only targets `.css` and `.js` references. Images, fonts, and other static assets are left unchanged.
- If a file is referenced via a complex bundler path, absolute URL, or dynamic string concatenation, it will be skipped to prevent accidental corruption.

## 📜 License
Distributed under the same terms as the original CoRT project.
