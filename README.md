# Skills

Interface, interaction design and UX skills for coding agents, grouped by
kind. Each is a folder in `skills/<kind>/`, with its `SKILL.md`.

[`site/`](site) is the minisite at https://skills.fabio.cv. It lists each
skill with its `metadata.summary` and serves its files for the install prompt,
so a new skill shows there once the site is built and deployed:
`pnpm install && pnpm run deploy` in `site/`.

[`cli/`](cli) is [`@fabiocv/skills`](https://www.npmjs.com/package/@fabiocv/skills) on npm, which adds the skills to your coding
agents with `npx @fabiocv/skills`. It runs the
[skills CLI](https://github.com/vercel-labs/skills) on this repository, so a
new skill needs no new release: only a change to the CLI itself does, with
`npm publish` in `cli/`.

## Interaction design

How an interface behaves under the hand: tracking, resistance, springs and the
moments in between. These skills specify behaviour, in numbers, and leave the
technology to the project: build it with whatever the codebase already uses.

| Skill&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | For                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [`resizable-panels`](skills/interaction-design/resizable-panels/SKILL.md)                                                                                                                                                                 | How the line between two panels behaves under drag: under the pointer, resisting near a minimum, closing past it, opening freely, on springs. |

## Licence

MIT
