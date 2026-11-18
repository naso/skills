import { Collapsible } from '@base-ui/react/collapsible';
import type { CSSProperties, ReactNode } from 'react';

import { AddToAgent, Code } from './blocks';
import { Graffiti, graffitiHeight } from './graffiti';
import { SkillsLogo } from './logos';
import { GITHUB, installPrompt } from './skills';

/** What the graffiti by the opening says, before its smiley. */
const GRAFFITI = 'Tasteful';

/** The arrow beside a section's toggle, which turns over when open. */
function Chevron() {
  return (
    <svg
      className="chevron"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  );
}

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
          Hallucinated by <a href="https://fabio.cv">Fabio</a>.
        </span>
        <nav>
          <a href={GITHUB}>GitHub</a>
        </nav>
      </footer>
    </div>
  );
}

/**
 * How to add the skills: a button that copies a prompt for a coding agent.
 * Manually opens the command that installs them from the repository.
 */
export function Install() {
  return (
    <div className="clients">
      <Collapsible.Root>
        <div className="installs">
          <AddToAgent prompt={installPrompt()} />
          <Collapsible.Trigger className="manual">
            Manually
            <Chevron />
          </Collapsible.Trigger>
        </div>
        {/* Find in page opens it to show a match. */}
        <Collapsible.Panel className="clients manual-panel" hiddenUntilFound>
          <Code name="Terminal" code="npx skills add naso/skills" />
          <p>
            It asks which skills to add, and to which agents. They go in the
            current project; add <code>-g</code> for every project.
          </p>
        </Collapsible.Panel>
      </Collapsible.Root>
    </div>
  );
}
