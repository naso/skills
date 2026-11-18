# Reference implementation

The spec in [`SKILL.md`](SKILL.md) as one framework-free function and its CSS. Fit the class names, the padding and the gap to the layout; `gutter` is the padding and gap across, which the track leaves out.

## Markup

```html
<div class="split">
  <div class="split-frame">
    <div>First panel</div>
    <div>Second panel</div>
  </div>
  <div class="split-grip" aria-hidden="true"></div>
</div>
```

## CSS

```css
/*
 * The first panel's share of the track, which the grip writes, and the gap
 * after it, which closes with either side.
 */
.split {
  --split: 0.5;
  --seam: min(
    2px,
    var(--split) * (100cqw - 4px),
    (1 - var(--split)) * (100cqw - 4px)
  );
  position: relative;
  container-type: inline-size;
}

.split-frame {
  display: grid;
  grid-template-columns:
    calc(var(--split) * (100% - var(--seam)))
    minmax(0, 1fr);
  column-gap: var(--seam);
  padding: 2px;
}

/* Each side clips what it holds as it narrows, without scrolling. */
.split-frame > * {
  min-width: 0;
  overflow: clip;
}

/* The grip, 10px across the gap and the full height. */
.split-grip {
  position: absolute;
  inset: 0 auto;
  left: calc(
    2px + var(--split) * (100cqw - 4px - var(--seam)) + var(--seam) / 2 - 5px
  );
  width: 10px;
  cursor: col-resize;
  touch-action: none;
}
```

## Script

```ts
type Options = {
  /** The width a side keeps before it starts to resist. */
  min?: number;
  /** How far past `min` the pointer goes before the side closes. */
  close?: number;
  /** How far a resisting side gives at most. */
  give?: number;
  /** The spring's response, in seconds. */
  response?: number;
  /** The frame's padding and gap across, which the track leaves out. */
  gutter?: number;
};

/**
 * Makes `grip` the line between the two panels in `frame`, and writes the
 * first panel's share of the track to `--split` on `root`. Returns a cleanup.
 */
export function resizable(
  grip: HTMLElement,
  frame: HTMLElement,
  root: HTMLElement,
  {
    min = 160,
    close = 80,
    give = 40,
    response = 0.35,
    gutter = 6,
  }: Options = {},
) {
  const stiffness = ((2 * Math.PI) / response) ** 2;
  const damping = (4 * Math.PI) / response;
  // Where the line is going, as the first panel's share of the track, and how
  // far the shown line is from there, which the spring takes to nothing.
  let to = 0.5;
  let off = 0;
  let speed = 0;
  let track = 1;
  // Which side is closed: the first, -1, or the second, 1.
  let closed = 0;
  let grab: number | undefined;
  let last = 0;
  let frameId = 0;

  const show = () =>
    root.style.setProperty('--split', `${Math.min(1, Math.max(0, to + off))}`);

  const tick = (now: number) => {
    const time = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (let step = 0; step < time; step += 0.001) {
      speed -= (stiffness * off + damping * speed) * 0.001;
      off += speed * 0.001;
    }
    if (Math.abs(off) * track < 0.5) off = speed = frameId = 0;
    else frameId = requestAnimationFrame(tick);
    show();
  };

  // Moves where the line is going; the spring carries it from where it is.
  const jump = (next: number) => {
    off = matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : off + to - next;
    to = next;
    if (!frameId) {
      last = performance.now();
      frameId = requestAnimationFrame(tick);
    }
  };

  // A side `wanted` wide: resisting under `min`, and closed `close` past it.
  const ease = (wanted: number) => {
    const over = min - wanted;
    return over <= 0
      ? wanted
      : over > close
        ? 0
        : min - give * (1 - Math.exp(-over / give));
  };

  grip.onpointerdown = (event) => {
    event.preventDefault();
    grip.setPointerCapture(event.pointerId);
    track = frame.clientWidth - gutter;
    grab = event.clientX - to * track;
  };

  grip.onpointermove = (event) => {
    if (grab === undefined) return;
    let wanted = event.clientX - grab;
    if (closed) {
      // The ratchet: pushed past the edge, a closed side stays there, so it
      // opens as soon as the pointer turns back, 1:1 until `min`.
      const past =
        closed < 0 ? Math.min(wanted, 0) : Math.max(wanted - track, 0);
      grab += past;
      wanted -= past;
      if ((closed < 0 ? wanted : track - wanted) < min) {
        to = wanted / track;
        show();
        return;
      }
      closed = 0;
    }
    const first = ease(wanted);
    const second = ease(track - wanted);
    closed = first ? (second ? 0 : 1) : -1;
    if (closed) {
      // It closes with a spring, and opens again from where the pointer is.
      jump(closed < 0 ? 0 : 1);
      grab = event.clientX - to * track;
    } else to = (first === wanted ? track - second : first) / track;
    show();
  };

  grip.onpointerup = grip.onpointercancel = () => {
    if (grab === undefined) return;
    grab = undefined;
    // A side let go short of `min` goes to it, unless it was closed and is
    // still short of where it would close, when it closes again.
    const first = to * track;
    const side = Math.min(first, track - first);
    if (closed && side < min - close) jump(closed < 0 ? 0 : 1);
    else if (side < min) {
      closed = 0;
      jump((first < min ? min : track - min) / track);
    }
  };

  // A double click springs back to halves, opening a closed side.
  grip.ondblclick = () => {
    closed = 0;
    jump(0.5);
  };

  return () => {
    cancelAnimationFrame(frameId);
    grip.onpointerdown = grip.onpointermove = null;
    grip.onpointerup = grip.onpointercancel = grip.ondblclick = null;
  };
}
```

In React, run it from an effect, which also cleans it up:

```tsx
useEffect(() => resizable(grip.current!, frame.current!, root.current!), []);
```

## Panels stacked one above the other

The same with the other axis: `clientY` for `clientX`, `clientHeight` for `clientWidth`, rows for columns, `cqh` for `cqw` with `container-type: size`, and `row-resize` for the cursor.
