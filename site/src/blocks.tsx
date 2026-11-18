import { useState } from 'react';

const COPY = 'M8 7.5h7.5v8H8zM12 4.5H4.5v8';
const CHECK = 'M5 10.5l3 3 7-7';

/** Copies `text` to the clipboard, and shows a check for a moment after. */
function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  return [copied, copy] as const;
}

function CopyIcon({
  copied,
  className,
}: {
  copied: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={copied ? CHECK : COPY} />
    </svg>
  );
}

/**
 * A shell command, coloured as the site colours code: the program as a
 * keyword, and a repository, such as `owner/name`, as a string.
 */
function Shell({ command }: { command: string }) {
  return command.split(/( )/).map((word, index) =>
    index === 0 ? (
      <span key={index} className="code-keyword">
        {word}
      </span>
    ) : word.includes('/') ? (
      <span key={index} className="code-string">
        {word}
      </span>
    ) : (
      word
    ),
  );
}

/** A command to run by hand, with a button that copies it. */
export function Command({ code }: { code: string }) {
  const [copied, copy] = useCopy(code);
  return (
    <div className="command">
      <code>
        <Shell command={code} />
      </code>
      <button
        type="button"
        aria-label={copied ? 'Copied' : 'Copy the command'}
        onClick={copy}
      >
        <CopyIcon copied={copied} />
      </button>
    </div>
  );
}

/** Copies a prompt that has an agent add the skills itself. */
export function AddToAgent({ prompt }: { prompt: string }) {
  const [copied, copy] = useCopy(prompt);
  return (
    <button
      type="button"
      className="agent"
      aria-label={copied ? 'Copied' : 'Install with a prompt: copy it'}
      onClick={copy}
    >
      Install with a prompt
      <CopyIcon copied={copied} className="agent-copy" />
    </button>
  );
}
