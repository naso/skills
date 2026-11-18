import { useEffect, useRef } from 'react';

import { GLYPHS, X_HEIGHT } from './hand';
import { random, spray } from './spray';
import type { Point } from './spray';

/** Rounds a polyline's corners by cutting each one twice, after Chaikin. */
function round(line: Point[]) {
  for (let pass = 0; pass < 2; pass++) {
    const out: Point[] = [line[0]];
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, ay] = line[i];
      const [bx, by] = line[i + 1];
      out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
      out.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    out.push(line[line.length - 1]);
    line = out;
  }
  return line;
}

/**
 * The can's path for text in the hand, `size` pixels to the top of an x, as a
 * person writes it: each letter turned, sized and set a little off its
 * neighbours, and each line under the last. Also where the last line ends.
 */
function write(text: string, size: number, seed: number) {
  const rand = random(seed);
  const k = size / X_HEIGHT;
  const strokes: Point[][] = [];
  let pen = 0;
  let baseline = 0;
  for (const char of text) {
    if (char === '\n') {
      pen = rand() * 0.6 * X_HEIGHT;
      baseline += size * 2.7;
      continue;
    }
    const [advance, data] = GLYPHS[char] ?? GLYPHS[' '];
    const turn = ((rand() - 0.5) * 8 * Math.PI) / 180;
    const grow = 0.93 + rand() * 0.14;
    const lift = (rand() - 0.5) * 0.08 * size;
    const middle = advance / 2;
    for (const part of data ? data.split(';') : []) {
      const n = part.split(' ').map(Number);
      const line: Point[] = [];
      for (let i = 0; i < n.length; i += 2) {
        const x = (n[i] - middle) * grow;
        const y = -n[i + 1] * grow;
        line.push([
          (x * Math.cos(turn) - y * Math.sin(turn) + middle + pen) * k,
          (x * Math.sin(turn) + y * Math.cos(turn)) * k + lift + baseline,
        ]);
      }
      strokes.push(round(line));
    }
    // Wider apart than the font, for a line thicker than its pen.
    pen += advance * (0.96 + rand() * 0.06) + 0.25 * X_HEIGHT;
  }
  return { strokes, end: [pen * k, baseline] as Point };
}

/**
 * A smiley written as text, `:)`, `size` pixels to the top of an x and
 * sitting on a baseline at `at` like a letter: two dabs of the can, then the
 * bracket in one sweep.
 */
function smiley([x, y]: Point, size: number, seed: number) {
  const rand = random(seed);
  const dab = (dy: number): Point[] => [
    [x, y - dy * size],
    [x + size * 0.04, y - dy * size + size * 0.06],
  ];
  // The bracket bows to the right through an arc of a circle centred to its
  // left, from a little above the x to a little below the baseline.
  const top = y - size * 1.25;
  const bottom = y + size * 0.3;
  const half = (bottom - top) / 2;
  const r = half * 1.4;
  const reach = Math.asin(half / r);
  const cx = x + size * 0.5 + size * 0.4 - r;
  const cy = (top + bottom) / 2;
  const bracket: Point[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = -reach + (2 * reach * i) / 12;
    const out = 1 + (rand() - 0.5) * 0.03;
    bracket.push([cx + Math.cos(a) * r * out, cy + Math.sin(a) * r * out]);
  }
  return [dab(0.8), dab(0.12), round(bracket)];
}

/** Turns strokes about the origin, negative degrees to rise to the right. */
const slant = (strokes: Point[][], tilt: number) => {
  const a = (tilt * Math.PI) / 180;
  return strokes.map((line) =>
    line.map(([x, y]): Point => [
      x * Math.cos(a) - y * Math.sin(a),
      x * Math.sin(a) + y * Math.cos(a),
    ]),
  );
};

/** Room below the letters for the drips. */
const DRIPS = 160;

/** The letters, to the top of an x, and the sprayed line, in pixels. */
const SIZE = 28;
const WIDTH = 7;

/** The slant, in degrees, negative to rise to the right. */
const TILT = -6;

const SEED = 7;

/** The paint, and the smiley's, as CSS colours that follow the theme. */
const COLOR = 'var(--spray)';
const SMILE = 'var(--success)';

/** Room around the letters for the spray, and for paint smeared out of them. */
const MARGIN = 80;

/** The least room between the end of the opening's text and the letters. */
const GAP = 8;

/** How far right of the middle of the room beside the opening it sits. */
const NUDGE = 24;

/**
 * Narrower than this, it sits above the opening instead, in the room the
 * stylesheet makes there: keep the two the same.
 */
const NARROW = '(max-width: 879px)';

/**
 * Above the opening, the room under the header and over its text, each side
 * of the letters, as the stylesheet makes it.
 */
const ABOVE = 30;

/** How long the hand pauses to swap cans before the smiley, in seconds. */
const SWAP = 0.7;

/** The tip of the finger the pointer drags through the wet paint, in pixels. */
const FINGER = 10;

/** How far a press may move and still count as a click, in pixels. */
const STILL = 4;

/**
 * The can's paths for text in the hand, `size` pixels to the top of an x and
 * slanted `tilt` degrees, and for its smiley, and the room they take.
 */
export function lettering(text: string, size = SIZE, tilt = TILT) {
  const { strokes: letters, end } = write(text, size, SEED);
  const strokes = slant(letters, tilt);
  const face = slant(
    smiley([end[0] + size * 1.3, end[1]], size, SEED + 1),
    tilt,
  );
  const points = [...strokes, ...face].flat();
  const left = Math.min(...points.map(([x]) => x));
  const top = Math.min(...points.map(([, y]) => y));
  const wide = Math.max(...points.map(([x]) => x)) - left;
  const tall = Math.max(...points.map(([, y]) => y)) - top;
  return { strokes, face, left, top, wide, tall };
}

/** How tall the letters of `text` stand, for the room made for them. */
export const graffitiHeight = (text: string) => Math.ceil(lettering(text).tall);

/** A CSS colour, such as a custom property, as red, green and blue. */
export function rgb(canvas: HTMLCanvasElement, color: string) {
  canvas.style.color = color;
  const probe = document.createElement('canvas');
  probe.width = probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = getComputedStyle(canvas).color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b] as [number, number, number];
}

/**
 * Graffiti sprayed over the page by its opening's text, with `\n` between
 * lines, and a smiley after the last line in a second colour. It sprays itself
 * in and drips, and scrolls with the page, under the header.
 *
 * On a wide window it sits a little right of the middle of the room right of
 * the opening, at its full size, and hides where it won't fit. On a narrow one it sits in the middle of the room made above the
 * opening.
 *
 * The paint stays wet: pressed on and dragged, a mouse or pen smears it.
 */
export function Graffiti({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wall = ref.current!;
    const box = wall.firstElementChild as HTMLDivElement;
    const [canvas, second] = box.querySelectorAll('canvas');
    const { strokes, face, left, top, wide, tall } = lettering(text);
    const stops: (() => void)[] = [];
    const stop = () => stops.splice(0).forEach((stop) => stop());
    let layers: ReturnType<typeof spray>[] = [];

    /**
     * Sprays the letters, with room for the spray, then the smiley in its own
     * colour once the hand has swapped cans.
     */
    const paint = (play: boolean) => {
      stop();
      const w = Math.ceil(wide + MARGIN * 2);
      const h = Math.ceil(tall + MARGIN + Math.max(MARGIN, DRIPS));
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
      const fitted = (lines: Point[][]) =>
        lines.map((line) =>
          line.map(([x, y]): Point => [x - left + MARGIN, y - top + MARGIN]),
        );
      const scale = Math.min(2, devicePixelRatio);
      const first = spray(
        canvas,
        w,
        h,
        {
          strokes: fitted(strokes),
          width: WIDTH,
          color: rgb(canvas, COLOR),
          seed: SEED,
          play,
        },
        scale,
      );
      const then = spray(
        second,
        w,
        h,
        {
          strokes: fitted(face),
          width: WIDTH,
          color: rgb(second, SMILE),
          seed: SEED + 1,
          play,
          after: first.takes + SWAP,
        },
        scale,
      );
      stops.push(first.stop, then.stop);
      layers = [first, then];
    };

    const page = wall.parentElement!;
    const content = page.querySelector('main')!;
    const lead = page.querySelector('.lead');
    const words = document.createRange();
    if (lead) words.selectNodeContents(lead);
    const narrow = matchMedia(NARROW);
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let painted = false;
    const place = () => {
      const lines = lead ? [...words.getClientRects()] : [];
      if (!lines.length) return void (wall.hidden = true);
      const origin = wall.getBoundingClientRect();
      const column = content.getBoundingClientRect();
      const opening = lead!.getBoundingClientRect();
      const above = narrow.matches;
      // Across the column above the opening, or from the opening's right edge,
      // which its max width keeps the same on every page, to the column's.
      const from = above ? column.left : opening.right + GAP;
      const room = column.right - from;
      // Beside the opening it keeps its size, and hides where it won't fit.
      const fit = above ? Math.min(1, room / wide) : 1;
      wall.hidden = !above && room < wide + NUDGE;
      if (wall.hidden) return;
      // Sprayed in the first time it shows.
      if (!painted) paint(!still.matches);
      painted = true;
      const x = from + (room - wide * fit) / 2 + (above ? 0 : NUDGE);
      const y = above
        ? opening.top - ABOVE - tall * fit
        : (opening.top + opening.bottom - tall * fit) / 2;
      // Never above the page, where a reload would scroll to its top.
      const at = Math.max(0, y - origin.top - MARGIN * fit);
      box.style.transform = `scale(${fit})`;
      box.style.left = `${x - MARGIN * fit - origin.left}px`;
      box.style.top = `${at}px`;
      wall.style.height = `${Math.ceil(at + box.offsetHeight * fit)}px`;
    };
    place();

    // A mouse or pen pressed on the paint drags a finger through it until it
    // lets go, in the paint's own pixels, whatever it is scaled to. Pressed
    // anywhere else, or by touch, the page behaves as it always does.
    const local = (event: PointerEvent): Point => {
      const rect = box.getBoundingClientRect();
      const fit = rect.width / box.offsetWidth;
      return [
        (event.clientX - rect.left) / fit,
        (event.clientY - rect.top) / fit,
      ];
    };
    let last: Point | undefined;
    let start: Point | undefined;
    let moved = false;
    const press = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      if (still.matches || wall.hidden) return;
      const at = local(event);
      if (!layers.some((layer) => layer.wet(at))) return;
      // It holds the paint, not the text or the link under it.
      event.preventDefault();
      for (const layer of layers) layer.smudge(undefined, at, FINGER);
      last = at;
      start = [event.clientX, event.clientY];
      moved = false;
    };
    const drag = (event: PointerEvent) => {
      if (!last || !start) return;
      if (!(event.buttons & 1)) return release();
      const at = local(event);
      for (const layer of layers) layer.smudge(last, at, FINGER);
      last = at;
      const far = Math.hypot(
        event.clientX - start[0],
        event.clientY - start[1],
      );
      moved ||= far > STILL;
    };
    // A smear that ends on a link doesn't follow it.
    const swallow = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const release = () => {
      if (last && moved) {
        window.addEventListener('click', swallow, {
          capture: true,
          once: true,
        });
        setTimeout(() => window.removeEventListener('click', swallow, true));
      }
      last = start = undefined;
    };
    const hold = (event: Event) => last && event.preventDefault();

    // The paint changes with the theme, if its colour does.
    const theme = matchMedia('(prefers-color-scheme: dark)');
    const repaint = () => painted && paint(false);
    window.addEventListener('resize', place);
    window.addEventListener('pointerdown', press);
    window.addEventListener('pointermove', drag);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    document.addEventListener('selectstart', hold);
    document.addEventListener('dragstart', hold);
    theme.addEventListener('change', repaint);
    return () => {
      stop();
      window.removeEventListener('resize', place);
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('pointermove', drag);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      document.removeEventListener('selectstart', hold);
      document.removeEventListener('dragstart', hold);
      theme.removeEventListener('change', repaint);
    };
  }, [text]);

  return (
    <div
      ref={ref}
      className="graffiti"
      role="img"
      aria-label={text.replace(/\n/g, ' ')}
    >
      <div>
        <canvas />
        <canvas />
      </div>
    </div>
  );
}
