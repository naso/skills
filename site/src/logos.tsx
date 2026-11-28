import { useId } from 'react';
import type { ReactNode } from 'react';

/*
 * The logos are stencils, as on ui.fabio.cv/mcp/: a grey rounded square
 * of paint, sprayed through a sheet. What the paint leaves bare is the sheet's
 * islands, the shapes that sat on the ground before, and the bridges that
 * hold them to the rest of the sheet, 1.2 units wide. Where it is bare,
 * whatever is behind shows.
 */

/** How wide a bridge is, in the logo's 32 units. */
const BRIDGE = 1.2;

/** A bridge from `(x1, y1)` to `(x2, y2)`, across or down. */
function Bridge({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const across = y1 === y2;
  return (
    <rect
      x={across ? Math.min(x1, x2) : x1 - BRIDGE / 2}
      y={across ? y1 - BRIDGE / 2 : Math.min(y1, y2)}
      width={across ? Math.abs(x2 - x1) : BRIDGE}
      height={across ? BRIDGE : Math.abs(y2 - y1)}
    />
  );
}

/** The paint, with `children` drawn in black where it is left bare. */
function Stencil({ size, children }: { size: number; children: ReactNode }) {
  const id = `stencil${useId().replace(/[^\w-]/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <mask id={id}>
        <rect width="32" height="32" fill="#fff" />
        <g fill="#000">{children}</g>
      </mask>
      <rect
        className="ground"
        width="32"
        height="32"
        rx="8"
        fill="var(--color-foreground-disabled)"
        mask={`url(#${id})`}
      />
    </svg>
  );
}

/** Skills: a list of three, each bar held at both sides. */
export function SkillsLogo({ size = 20 }: { size?: number }) {
  return (
    <Stencil size={size}>
      {[6.5, 13.5, 20.5].map((top) => (
        <g key={top}>
          <rect x="5" y={top} width="22" height="5" rx="2.5" />
          <Bridge from={[-1, top + 2.5]} to={[6, top + 2.5]} />
          <Bridge from={[26, top + 2.5]} to={[33, top + 2.5]} />
        </g>
      ))}
    </Stencil>
  );
}
