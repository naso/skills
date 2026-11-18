import read from 'virtual:skills';

export const SITE = 'https://skills.fabio.cv';
export const GITHUB = 'https://github.com/naso/skills';

/** Each kind of skill's name and a line about it, by its folder's name. */
const KINDS: Record<string, { name: string; text: string }> = {
  'interaction-design': {
    name: 'Interaction design',
    text: 'Tracking, resistance, springs and the moments in between. Each skill specifies how an interface behaves, in numbers, and leaves the technology to your project.',
  },
};

export type Skill = (typeof read)[number];

export type Kind = {
  /** Its folder's name. */
  id: string;
  name: string;
  text?: string;
  skills: Skill[];
};

/** The skills, grouped by kind, in the order `KINDS` lists the kinds. */
export const KIND_LIST: Kind[] = (() => {
  const order = Object.keys(KINDS);
  const ids = [...new Set(read.map(({ kind }) => kind))];
  const rank = (id: string) =>
    order.includes(id) ? order.indexOf(id) : order.length;
  return ids
    .sort((a, b) => rank(a) - rank(b))
    .map((id) => ({
      id,
      name:
        KINDS[id]?.name ??
        id.replace(/-/g, ' ').replace(/^./, (first) => first.toUpperCase()),
      text: KINDS[id]?.text,
      skills: read.filter(({ kind }) => kind === id),
    }));
})();

export const SKILLS = KIND_LIST.flatMap(({ skills }) => skills);

/** A prompt that has a coding agent download every skill from the site. */
export const installPrompt = () =>
  `Add these skills to this agent, from ${SITE}. Each skill is a folder of files: download each file into a folder with the skill's name, keeping the file's name, inside the folder this agent loads skills from, such as ~/.claude/skills for Claude Code. ${SKILLS.map(
    ({ name, files }) =>
      `${name}: ${files.map((file) => `${SITE}/${file}`).join(', ')}.`,
  ).join(
    ' ',
  )} Then tell me which skills you added, and whether I need to restart for them to load.`;
