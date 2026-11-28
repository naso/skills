#!/usr/bin/env node
// `npx @fabiocv/skills` adds the skills to your coding agents. It runs the
// skills CLI (skills.sh) on this repository, so it asks the same questions,
// takes the same options, such as `-y` or `--skill`, and `npx skills update`
// keeps the skills current from GitHub.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = 'naso/skills';

const cli = fileURLToPath(import.meta.resolve('skills/bin/cli.mjs'));
const child = spawn(
  process.execPath,
  [cli, 'add', REPO, ...process.argv.slice(2)],
  { stdio: 'inherit' },
);
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
