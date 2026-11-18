/** The skills in the repository, read when the site is built. */
declare module 'virtual:skills' {
  const skills: {
    /** Its kind's folder, such as `interaction-design`. */
    kind: string;
    /** Its folder's name, which is also its `name`. */
    name: string;
    /** Its `SKILL.md` heading. */
    title: string;
    /** Its `metadata.summary`, or its description without one. */
    summary: string;
    /** Its folder, from the repository's root. */
    path: string;
    /** Its files, from the repository's root. */
    files: string[];
  }[];
  export default skills;
}
