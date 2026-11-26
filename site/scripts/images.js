// Draws the share image, `public/og.png`, in headless Chrome from a build of
// `src/draw.tsx`. Run it after changing the site's name, summary or logo:
// `pnpm images`. Set CHROME to Chrome's binary if it is not in the usual
// place.
import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { crc32, deflateSync, inflateSync } from 'node:zlib';
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

/**
 * How much taller than the image the window is. Headless Chrome gives the page
 * less height than its window, 87px less on a Mac, and draws nothing past it,
 * so the image is taken from a taller window and cropped to its height.
 */
const ROOM = 200;

/**
 * Keeps a PNG's top `height` rows. Its rows can be cut without decoding them:
 * each row's filter looks only at the rows above it.
 */
async function crop(file, height) {
  const png = await readFile(file);
  const chunks = [];
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at);
    const type = png.toString('latin1', at + 4, at + 8);
    chunks.push({ type, data: png.subarray(at + 8, at + 8 + length) });
    at += 12 + length;
  }
  const header = Buffer.from(chunks[0].data);
  const width = header.readUInt32BE(0);
  const [depth, color, , , interlace] = header.subarray(8);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[color];
  if (depth !== 8 || interlace || !channels) {
    throw new Error(`${file}: not an 8-bit, non-interlaced PNG`);
  }
  const rows = inflateSync(
    Buffer.concat(
      chunks.filter(({ type }) => type === 'IDAT').map(({ data }) => data),
    ),
  );
  header.writeUInt32BE(height, 4);
  const chunk = (type, data) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, 'latin1');
    data.copy(out, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type, 'latin1'), data]));
    out.writeUInt32BE(crc, 8 + data.length);
    return out;
  };
  await writeFile(
    file,
    Buffer.concat([
      png.subarray(0, 8),
      chunk('IHDR', header),
      chunk(
        'IDAT',
        deflateSync(rows.subarray(0, height * (1 + width * channels))),
      ),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

/** Takes the drawing page for `query` at `width` by `height` into `name`. */
async function draw(name, query, width, height) {
  const file = path.join(out, name);
  await mkdir(path.dirname(file), { recursive: true });
  // Not synchronously: this script serves the page Chrome loads.
  await promisify(execFile)(
    CHROME,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${width},${height + ROOM}`,
      '--virtual-time-budget=5000',
      `--screenshot=${file}`,
      `${origin}/draw.html?${new URLSearchParams(query)}`,
    ],
    { timeout: 60_000 },
  );
  await crop(file, height);
  console.log(name);
}

try {
  await draw('og.png', {}, OG.width, OG.height);
} finally {
  server.close();
  await rm(work, { recursive: true });
}
