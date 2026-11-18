import { createReadStream } from 'node:fs';
import { cp, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

/** The skills, beside the site in the repository. */
const SKILLS = path.resolve(import.meta.dirname, '../skills');

const TYPES: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
};

/** The keys of a `SKILL.md`'s frontmatter, nested ones as `parent.key`. */
function frontmatter(text: string) {
  const block = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const data: Record<string, string> = {};
  let parent = '';
  for (const line of block.split('\n')) {
    const match = line.match(/^(\s*)([\w-]+):\s*(.*)$/);
    if (!match) continue;
    const [, indent, key, value] = match;
    if (!indent) parent = value ? '' : key;
    data[indent && parent ? `${parent}.${key}` : key] = value.replace(
      /^(['"])(.*)\1$/,
      '$2',
    );
  }
  return data;
}

/**
 * Each skill under `skills/<kind>/<name>/`: its heading, its summary (its
 * `metadata.summary`, or its description) and its files, from the
 * repository's root.
 */
async function read() {
  const files = (await readdir(SKILLS, { recursive: true }))
    .filter((file) => !path.basename(file).startsWith('.'))
    .map((file) => `skills/${file.split(path.sep).join('/')}`)
    .sort();
  const skills = [];
  for (const file of files.filter((file) => file.endsWith('/SKILL.md'))) {
    const [, kind, name] = file.split('/');
    const text = await readFile(path.resolve(SKILLS, '..', file), 'utf8');
    const data = frontmatter(text);
    const folder = `skills/${kind}/${name}`;
    skills.push({
      kind,
      name,
      title: text.match(/^# (.+)$/m)?.[1] ?? name,
      summary: data['metadata.summary'] || data.description || '',
      path: folder,
      files: files.filter((other) => other.startsWith(`${folder}/`)),
    });
  }
  return skills;
}

/**
 * The skills, as `virtual:skills`, read from the repository when the site is
 * built. Each skill's files are served at `/skills/`, as the repository has
 * them, so an agent can download them from the site: from the folder while
 * developing, and copied into the build.
 */
function skills(): Plugin {
  const id = 'virtual:skills';
  let ssr = false;
  return {
    name: 'skills',
    configResolved(config) {
      ssr = !!config.build.ssr;
    },
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    async load(source) {
      if (source === `\0${id}`) {
        return `export default ${JSON.stringify(await read())};`;
      }
    },
    configureServer(server) {
      // A change to a skill reloads the page with it.
      server.watcher.add(SKILLS);
      server.watcher.on('all', (_, file) => {
        if (!file.startsWith(SKILLS)) return;
        const module = server.moduleGraph.getModuleById(`\0${id}`);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      });
      server.middlewares.use('/skills', async (req, res, next) => {
        const file = path.join(
          SKILLS,
          decodeURIComponent(req.url!.split('?')[0]),
        );
        const found =
          file.startsWith(SKILLS + path.sep) &&
          (await stat(file).catch(() => undefined))?.isFile();
        if (!found) return next();
        res.setHeader(
          'Content-Type',
          TYPES[path.extname(file)] ?? 'text/plain; charset=utf-8',
        );
        createReadStream(file).pipe(res);
      });
    },
    async writeBundle({ dir }) {
      if (!ssr && dir) {
        await cp(SKILLS, path.join(dir, 'skills'), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  build: {
    // Browsers with `light-dark()`, so it is kept rather than emulated.
    cssTarget: ['chrome123', 'safari17.5', 'firefox120'],
  },
  plugins: [react(), skills()],
});
