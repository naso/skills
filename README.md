# Skills

Interface, interaction design and UX skills for coding agents, grouped by
kind. Each is a folder in `skills/<kind>/`, with its `SKILL.md`.

[`site/`](site) is the minisite at https://skills.fabio.cv. It lists each
skill with its `metadata.summary` and serves its files for the install prompt,
so a new skill shows there once the site is built and deployed:
`pnpm install && pnpm run deploy` in `site/`.

## Interaction design

How an interface behaves under the hand: tracking, resistance, springs and the
moments in between. These skills specify behaviour, in numbers, and leave the
technology to the project: build it with whatever the codebase already uses.

| Skill&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | For                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [`resizable-panels`](skills/interaction-design/resizable-panels/SKILL.md)                                                                                                                                                                 | How the line between two panels behaves under drag: under the pointer, resisting near a minimum, closing past it, opening freely, on springs. |
