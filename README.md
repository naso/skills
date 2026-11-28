# Skills

[![npm](https://img.shields.io/npm/v/@fabiocv/skills)](https://www.npmjs.com/package/@fabiocv/skills)

Interface, interaction design and UX skills for coding agents, grouped by
kind. Add them to your coding agents with:

```bash
npx @fabiocv/skills
```

| Folder              | What it is                                                                                                                                                                                                                    | To ship a change                                                                                                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`skills/`](skills) | The skills. Each is a folder in `skills/<kind>/`, with its `SKILL.md` and any files it links to, such as a `REFERENCE.md`.                                                                                                    | Push it. The CLI reads this repository, so a new skill needs no new release.                                                                                                                                                                          |
| [`site/`](site)     | The minisite at https://skills.fabio.cv. It lists each skill with its `metadata.summary` and serves its files for the install prompt.                                                                                         | `pnpm install && pnpm run deploy` in `site/`. A new skill shows there only once the site is deployed. `KINDS` in [`site/src/skills.ts`](site/src/skills.ts) sets the order of the kinds, and a kind's name when its folder's name doesn't read right. |
| [`cli/`](cli)       | [`@fabiocv/skills`](https://www.npmjs.com/package/@fabiocv/skills) on npm. `npx @fabiocv/skills` adds the skills to your coding agents by running the [skills CLI](https://github.com/vercel-labs/skills) on this repository. | `npm publish` in `cli/`, only when the CLI itself changes.                                                                                                                                                                                            |

## Interaction design

How an interface behaves under the hand: tracking, resistance, springs and the
moments in between. These skills specify behaviour, in numbers, and leave the
technology to the project: build it with whatever the codebase already uses.

| Skill&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | For                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [`resizable-panels`](skills/interaction-design/resizable-panels/SKILL.md)                                                                                                                                                                 | How the line between two panels behaves under drag: under the pointer, resisting near a minimum, closing past it, opening freely, on springs. |

## Licence

MIT
