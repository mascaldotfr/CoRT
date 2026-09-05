import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { gzipSync } from 'node:zlib';
import fs from 'fs';

const require = createRequire(import.meta.url);
const { minify } = require('html-minifier-terser');
const __dirname = dirname(fileURLToPath(import.meta.url));

// Absolute path to your 'CoRT' directory (where source files live)
const rootDir = resolve(__dirname, '../../');

// Absolute path to your output directory (where built files should go)
const outDir = resolve(__dirname, 'dist');

// Static assets
const assetsToCopy = [
	'api', 'data', 'sw.js', 'manifest.1.json',
	'favicon.png', 'favicon.svg', 'favicon_512.png'
];

// API preloads
const api_preloads = {
	"bosses.html": { url: "api/bin/bosses/bosses.php", key: "bosses_api_result_v2" },
	"bz.html": { url: "api/bin/bz/bz.php", key: "bz_api_result_v2" },
	"wz.html": { url: "api/var/wstatus.json", key: "wz_api_result" },
	"wevents.html": { url: "api/var/events.json", key: "wevents_api_result" },
	"wstats.html": { url: "api/var/stats.json", key: "wstats_api_result" }
};

// static preloads that can't be put in HTML because otherwise Vite rename them and it's useless
const static_preloads = {
	"index.html": '<link rel="preload" href="data/trainer/1.35.19/trainerdata.json?epoch=1" as="fetch" />'
}


// --- GET GIT VERSION ---
function getGitVersion() {
	try {
		return execSync('git describe --tags --abbrev=0', { stdio: 'pipe' }).toString().trim();
	} catch (e) {
		return 'devel+local';
	}
}

// --- CUSTOM HTML MINIFICATION PLUGIN ---
function minifyHtmlPlugin() {
	return {
		name: 'minify-html',
		async transformIndexHtml(html) {
			try {
				return await minify(html, {
					collapseWhitespace: true,
					removeComments: true,
					removeAttributeQuotes: true,
					minifyCSS: true,
					minifyJS: true,
				});
			} catch (err) {
				console.warn('HTML minification failed:', err);
				return html;
			}
		}
	};
}

// --- CUSTOM PLUGIN FOR VERSION INJECTION ---
function injectVersionPlugin() {
	const version = getGitVersion();
	return {
		name: 'inject-version',
		transformIndexHtml(html) {
			return html.replace(
				new RegExp('<head(\\s[^>]*)?>', 'i'),
				`<head$1>\n    <meta name="cort-version" content="${version}">`
			);
		}
	};
}

// --- CUSTOM PLUGIN FOR STATIC ASSETS ---
function copyStaticAssets() {
	return {
		name: 'copy-static-assets',
		writeBundle() {
			const copyRecursive = (src, dest) => {
				if (!fs.existsSync(src)) {
					console.warn(`Source not found, skipping: ${src}`);
					return;
				}
				const stats = fs.statSync(src);
				if (stats.isDirectory()) {
					fs.mkdirSync(dest, { recursive: true });
					fs.readdirSync(src).forEach((child) => {
						copyRecursive(resolve(src, child), resolve(dest, child));
					});
				} else {
					fs.copyFileSync(src, dest);
				}
			};

			console.log('\nCopying static assets to dist/...');
			assetsToCopy.forEach(asset => {
				// Source is in CoRT (rootDir), Destination is cort.ovh/dist (outDir)
				copyRecursive(resolve(rootDir, asset), resolve(outDir, asset));
				console.log(`Copied ${asset}`);
			});

			const createSymlink = (target, symPath) => {
				const linkPath = resolve(outDir, symPath);
				if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
				try {
					fs.symlinkSync(target, linkPath);
					console.log(`Created symlink: ${symPath} -> ${target}`);
				} catch (e) {
					console.warn(`Failed to create symlink ${symPath}:`, e.message);
				}
			};

			createSymlink('index.html', 'beta.html');
			createSymlink('favicon.png', 'favicon.ico');
			createSymlink('favicon.png', 'favicon.1.png');
			console.log('Symlinks recreated\n');
		}
	};
}


// --- PLUGIN FOR GZIP PRE-COMPRESSION ---
function gzipPlugin() {
	return {
		name: 'gzip-compression',
		apply: 'build',
		closeBundle() {
			const extensions = ['.html', '.js', '.css', '.json'];
			const outDir = resolve(__dirname, 'dist');
			const skipDirs = ['api']; // Directories to exclude from compression

			const gzipRecursive = (dir) => {
				const files = fs.readdirSync(dir);
				for (const file of files) {
					const fullPath = resolve(dir, file);
					const stats = fs.statSync(fullPath);

					if (stats.isDirectory()) {
						// Skip excluded directories
						if (skipDirs.includes(file)) {
							console.log(`Skipping directory: ${file}`);
							continue;
						}
						gzipRecursive(fullPath);
					}
					// Compress if the extension matches and it's not already a .gz file
					else if (extensions.some(ext => file.endsWith(ext)) && !file.endsWith('.gz')) {
						const content = fs.readFileSync(fullPath);
						// Maximum compression (level 9)
						const compressed = gzipSync(content, { level: 9 });
						fs.writeFileSync(`${fullPath}.gz`, compressed);

						console.log(`Gzipped: ${file}.gz`);
					}
				}
			};

			if (fs.existsSync(outDir)) {
				console.log('\nCompressing assets with gzip (level 9)...');
				gzipRecursive(outDir);
				console.log('Compression done\n');
			}
		}
	};
}

// --- PLUGIN FOR INJECTING API PRELOADS ---
function injectApiPreloadsPlugin() {
	return {
		name: 'inject-api-preloads',
		apply: 'build',
		closeBundle() {
			const outDir = resolve(__dirname, 'dist');

			for (const [filename, { url, key }] of Object.entries(api_preloads)) {
				const htmlFile = resolve(outDir, filename);

				// Skip if the HTML file doesn't exist
				if (!fs.existsSync(htmlFile)) continue;

				let content = fs.readFileSync(htmlFile, 'utf8');

				const scriptTag = (
					`<script>if(!/Mac|iPhone|iPad|iPod/.test(navigator.userAgent)` +
					`&&!localStorage.getItem("${key}"))` +
					`{const l=document.createElement("link");` +
					`l.rel="preload";l.href="${url}";` +
					`l.as="fetch";l.crossOrigin="anonymous";` +
					`document.head.appendChild(l);}</script>`
				);

				content = content.replace('<head>', `<head>${scriptTag}`);

				fs.writeFileSync(htmlFile, content, 'utf8');
				console.log(`Injected API preload into ${filename}`);
			}
		}
	};
}

// --- SIMPLE <HEAD> injection ---
function injectCustomHead(filename, contentToInsert) {
    return {
        name: `inject-custom-preload-${filename}`,
        apply: 'build',
        transformIndexHtml(html, ctx) {
            // Si le fichier HTML en cours de traitement correspond, on injecte
            if (ctx.filename.endsWith(filename)) {
                return html.replace('<head>', `<head>${contentToInsert}`);
            }
            return html;
        }
    };
}


// --- VITE CONFIGURATION ---
export default defineConfig({
	root: rootDir,       // Read source files from CoRT
	base: './',
	assetsDir: '',
	plugins: [
		injectVersionPlugin(),
		minifyHtmlPlugin(),
		copyStaticAssets(),
		injectApiPreloadsPlugin(),
		injectCustomHead("index.html", static_preloads["index.html"]),
		gzipPlugin()
	],
	build: {
		outDir: outDir,  // Explicitly output to cort.ovh/dist
		emptyOutDir: true, // Clean the dist folder before each build
		commonjsOptions: {
			transformMixedEsModules: true,
			include: ["/js/libs/", "/node_modules/"]
		},
		rollupOptions: {
			onwarn(warning, warn) {
				if (warning.code === 'COMMONJS_VARIABLE_IN_ESM' && warning.id?.includes('lz-string')) {
					return;
				}
				warn(warning);
			},
			input: {
				// Read HTML files from CoRT
				index: resolve(rootDir, 'index.html'),
				bosses: resolve(rootDir, 'bosses.html'),
				bz: resolve(rootDir, 'bz.html'),
				converter: resolve(rootDir, 'converter.html'),
				quests: resolve(rootDir, 'quests.html'),
				tests: resolve(rootDir, 'tests.html'),
				tstats: resolve(rootDir, 'tstats.html'),
				wz: resolve(rootDir, 'wz.html'),
				wevents: resolve(rootDir, 'wevents.html'),
				wstats: resolve(rootDir, 'wstats.html'),
			},
			output: {
				entryFileNames: 'js/[name]-[hash].js',
				chunkFileNames: 'js/chunks/[name]-[hash].js',
				assetFileNames: (assetInfo) => {
					if (assetInfo.name && assetInfo.name.endsWith('.css')) {
						return 'css/[name]-[hash][extname]';
					}
					return '[name]-[hash][extname]';
				}
			}
		}
	}
});
