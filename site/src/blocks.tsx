import { useState } from 'react';
import { Button } from '@fabiocv/ui/button';
import { Check, Copy } from '@fabiocv/ui/icons';

/** Copies `text`, and shows it did for a moment, as ui.fabio.cv's MCP pages. */
function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  return { copied, copy };
}

/**
 * A shell command, coloured as @fabiocv/ui colours code: the program as a
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
  const { copied, copy } = useCopy(code);
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
        {copied ? <Check size={20} /> : <Copy size={20} />}
      </button>
    </div>
  );
}

/** Copies a prompt that has an agent add the skills itself. */
export function AddToAgent({ prompt }: { prompt: string }) {
  const { copied, copy } = useCopy(prompt);
  return (
    <Button
      className="agent"
      trailingIcon={copied ? <Check /> : <Copy />}
      aria-label={copied ? 'Copied' : 'Install with a prompt: copy it'}
      onClick={copy}
    >
      Install with a prompt
    </Button>
  );
}
