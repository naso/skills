import type { CSSProperties, ReactNode } from 'react';

import { AddToAgent, Command } from './blocks';
import { Graffiti, graffitiHeight } from './graffiti';
import { SkillsLogo } from './logos';
import { GITHUB, installPrompt } from './skills';

/** What the graffiti by the opening says, before its smiley. */
const GRAFFITI = 'Tasteful';

/** The page: its header, its content and the footer. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      className="page"
      style={{ '--graffiti': `${graffitiHeight(GRAFFITI)}px` } as CSSProperties}
    >
      <div className="edge" aria-hidden>
        <div className="edge-ground" />
        <div className="edge-wide" />
        <div className="edge-sharp" />
        <div className="edge-sharp" />
        <div className="edge-sharp" />
        <div className="edge-sharp" />
      </div>
      <Graffiti text={GRAFFITI} />
      <header className="top">
        <a className="switcher" href="/">
          <SkillsLogo />
          Skills
        </a>
      </header>

      <main>{children}</main>

      <footer>
        <span>
          MIT licence. Hallucinated by <a href="https://fabio.cv">Fabio</a>.
        </span>
        <nav>
          <a href={GITHUB}>GitHub</a>
        </nav>
      </footer>
    </div>
  );
}

/**
 * How to add the skills: a button that copies a prompt for a coding agent,
 * and beside it the command that adds them by hand.
 */
export function Install() {
  return (
    <div className="install">
      <AddToAgent prompt={installPrompt()} />
      <Command code="npx skills add naso/skills" />
    </div>
  );
}
