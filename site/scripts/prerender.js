// Renders the page into index.html, so it shows before its script runs, and
// the favicon from the logo.
import { readFile, rm, writeFile } from 'node:fs/promises';

const { render, favicon, SITE } = await import('../dist-server/server.js');
const template = await readFile('dist/index.html', 'utf8');
const { meta, html } = render();

// Functions, so a `$` in the page is not read as a pattern.
const page = template
  .replace(/<!--meta-->[\s\S]*<!--\/meta-->/, () => meta)
  .replace('<!--app-->', () => html);
await writeFile('dist/index.html', page);

await writeFile('dist/favicon.svg', favicon());
await writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc></url>
</urlset>
`,
);
await rm('dist-server', { recursive: true });
