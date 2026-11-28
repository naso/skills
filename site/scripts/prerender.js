// Renders the pages into index.html and 404.html, so they show before their
// script runs, and the favicon from the logo.
import { readFile, rm, writeFile } from 'node:fs/promises';

const { render, notFound, favicon, SITE } = await import(
  '../dist-server/server.js',
);
const template = await readFile('dist/index.html', 'utf8');

// Functions, so a `$` in the page is not read as a pattern.
const fill = ({ meta, html }, root = '<div id="root">') =>
  template
    .replace(/<!--meta-->[\s\S]*<!--\/meta-->/, () => meta)
    .replace('<div id="root">', () => root)
    .replace('<!--app-->', () => html);

await writeFile('dist/index.html', fill(render()));
// What any other path answers with, as skedrick.fabio.cv's.
await writeFile(
  'dist/404.html',
  fill(notFound(), '<div id="root" data-page="not-found">'),
);

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
