// Draws the share image, `public/og.png`, in headless Chrome from a build of
// `src/draw.tsx`, as mcp-ui-tools.fabio.cv draws its own. Run it after
// changing the site's name, summary or logo: `pnpm images`. Set CHROME to
// Chrome's binary if it is not in the usual place.
import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { build, createServer as createVite } from 'vite';

const CHROME =
  process.env.CHROME ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const root = path.resolve(import.meta.dirname, '..');
const out = process.argv[2] ?? path.join(root, 'public');

// The drawing page, built, and served with the site's public files.
const work = await mkdtemp(path.join(tmpdir(), 'images-'));
await build({
  root,
  mode: 'production',
  logLevel: 'error',
  publicDir: false,
  build: {
    outDir: work,
    emptyOutDir: true,
    lib: {
      entry: path.join(root, 'src/draw.tsx'),
      formats: ['es'],
      fileName: 'draw',
      cssFileName: 'draw',
    },
  },
  // A library build leaves this for a bundler; this one runs as it is.
  define: { 'process.env.NODE_ENV': '"production"' },
});
const scripts = await readdir(work);
await writeFile(
  path.join(work, 'draw.html'),
  `<!doctype html><html><head><meta charset="utf-8">${scripts
    .filter((file) => file.endsWith('.css'))
    .map((file) => `<link rel="stylesheet" href="/${file}">`)
    .join(
      '',
    )}</head><body><div id="root"></div><script type="module" src="/draw.js"></script></body></html>`,
);

// The image's size, from the source. After the build, since Vite's server
// sets Node to development.
const vite = await createVite({
  root,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
});
const { OG } = await vite.ssrLoadModule('/src/images.tsx');
await vite.close();

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
  const file = new URL(req.url, 'http://x').pathname;
  for (const dir of [work, path.join(root, 'public')]) {
    const full = path.join(dir, file);
    if (!full.startsWith(dir)) continue;
    if (!(await stat(full).catch(() => null))?.isFile()) continue;
    res.setHeader('content-type', TYPES[path.extname(file)] ?? 'text/plain');
    return createReadStream(full).pipe(res);
  }
  res.statusCode = 404;
  res.end();
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

/** Takes the drawing page for `query` at `width` by `height` into `name`. */
async function draw(name, query, width, height) {
  await mkdir(path.dirname(path.join(out, name)), { recursive: true });
  // Not synchronously: this script serves the page Chrome loads.
  await promisify(execFile)(
    CHROME,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${width},${height}`,
      '--virtual-time-budget=5000',
      `--screenshot=${path.join(out, name)}`,
      `${origin}/draw.html?${new URLSearchParams(query)}`,
    ],
    { timeout: 60_000 },
  );
  console.log(name);
}

try {
  await draw('og.png', {}, OG.width, OG.height);
} finally {
  server.close();
  await rm(work, { recursive: true });
}
