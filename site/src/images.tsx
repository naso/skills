import { useEffect, useRef } from 'react';

import type { ComponentType } from 'react';

import { lettering, rgb } from './graffiti';
import { random, spray } from './spray';
import type { Point } from './spray';

/*
 * The share image `scripts/images.js` draws into `public`, in a browser, as
 * mcp-ui-tools.fabio.cv draws its own.
 */

export const OG = { width: 1200, height: 630 };

/** The room around the image's content, in pixels. */
const INSET = 80;

/** The logo's size, and the room around it for the dust past its edges. */
const LOGO = 112;
const DUST = 16;

/** The name, to the top of an x, the sprayed line, and the slant. */
const NAME = { size: 50, width: 12, tilt: -5 };

/** Where the name's first letter sits, from the top. */
const BASELINE = 355;

/** Room around the name for the spray, and for its drips below. */
const MARGIN = 120;

const SEED = 7;

/**
 * Sprays `logo` through its stencil onto `canvas`: the paint solid but
 * uneven, with a fine dust where it crept under the sheet.
 */
async function stencil(
  canvas: HTMLCanvasElement,
  logo: SVGSVGElement,
  scale: number,
) {
  const W = (LOGO + DUST * 2) * scale;
  canvas.width = canvas.height = W;
  const color = rgb(canvas, 'var(--disabled)');

  // Where the paint goes: the logo on its own, as an image.
  const image = new Image();
  image.src = `data:image/svg+xml,${encodeURIComponent(
    new XMLSerializer().serializeToString(logo),
  )}`;
  await image.decode();
  const cut = document.createElement('canvas');
  cut.width = cut.height = W;
  cut
    .getContext('2d')!
    .drawImage(image, DUST * scale, DUST * scale, LOGO * scale, LOGO * scale);

  // The same, blurred, for how far the dust reaches.
  const reach = document.createElement('canvas');
  reach.width = reach.height = W;
  const blur = reach.getContext('2d')!;
  blur.filter = `blur(${2.4 * scale}px)`;
  blur.drawImage(cut, 0, 0);

  const inside = cut.getContext('2d')!.getImageData(0, 0, W, W).data;
  const near = blur.getImageData(0, 0, W, W).data;
  const rand = random(SEED + 4);

  // Slow lumps in how thick the paint lies.
  const knots = Array.from({ length: 64 * 64 }, () => rand());
  const knot = (x: number, y: number) => knots[(y & 63) * 64 + (x & 63)];
  const lumps = (x: number, y: number) => {
    const gx = (x / W) * 6;
    const gy = (y / W) * 6;
    const i = Math.floor(gx);
    const j = Math.floor(gy);
    const fx = gx - i;
    const fy = gy - j;
    const top = knot(i, j) + (knot(i + 1, j) - knot(i, j)) * fx;
    const bottom = knot(i, j + 1) + (knot(i + 1, j + 1) - knot(i, j + 1)) * fx;
    return top + (bottom - top) * fy;
  };

  const ctx = canvas.getContext('2d')!;
  const out = ctx.createImageData(W, W);
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4;
      const paint = inside[k + 3] / 255;
      const dust = near[k + 3] / 255;
      let alpha = paint * (0.62 + 0.38 * lumps(x, y)) * (0.8 + 0.2 * rand());
      if (paint < 0.5 && rand() < dust * dust * 0.5) {
        alpha = Math.max(alpha, 0.3 + 0.6 * rand());
      }
      out.data.set([...color, Math.round(Math.min(1, alpha) * 255)], k);
    }
  }
  ctx.putImageData(out, 0, 0);
}

/**
 * Sprays the site's name in its hand, and its smiley, onto the two canvases
 * in `box`, and places it. A long name is written smaller to fit.
 */
function name(box: HTMLDivElement, text: string, scale: number) {
  const room = OG.width - INSET * 2;
  let shape = lettering(text, NAME.size, NAME.tilt);
  if (shape.wide > room) {
    shape = lettering(text, (NAME.size * room) / shape.wide, NAME.tilt);
  }
  const { strokes, face, left, top, wide, tall } = shape;
  const w = Math.ceil(wide + MARGIN * 2);
  const h = Math.ceil(tall + MARGIN * 2);
  Object.assign(box.style, {
    width: `${w}px`,
    height: `${h}px`,
    left: `${INSET - MARGIN}px`,
    top: `${BASELINE + top - MARGIN}px`,
  });
  const fitted = (lines: Point[][]) =>
    lines.map((line) =>
      line.map(([x, y]): Point => [x - left + MARGIN, y - top + MARGIN]),
    );
  const [letters, smiley] = box.querySelectorAll('canvas');
  spray(
    letters,
    w,
    h,
    {
      strokes: fitted(strokes),
      width: NAME.width,
      color: rgb(letters, 'var(--spray)'),
      seed: SEED,
    },
    scale,
  );
  spray(
    smiley,
    w,
    h,
    {
      strokes: fitted(face),
      width: NAME.width,
      color: rgb(smiley, 'var(--success)'),
      seed: SEED + 1,
    },
    scale,
  );
}

/**
 * The share image, in dark: the logo sprayed through its stencil, the name
 * sprayed by hand, and the summary.
 */
export function OgImage({
  name: text,
  summary,
  Logo,
}: {
  name: string;
  summary: string;
  Logo: ComponentType<{ size?: number }>;
}) {
  const logo = useRef<HTMLDivElement>(null);
  const paint = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scale = 2;
    name(paint.current!, text, scale);
    const [source, canvas] = logo.current!.children;
    stencil(canvas as HTMLCanvasElement, source as SVGSVGElement, scale);
  }, [text]);

  return (
    <div className="og">
      <div className="og-logo" ref={logo}>
        <Logo size={LOGO} />
        <canvas />
      </div>
      <p>{summary}</p>
      <div className="og-name" ref={paint}>
        <canvas />
        <canvas />
      </div>
    </div>
  );
}

export const imageStyles = `
html, body { margin: 0; overflow: hidden; scrollbar-gutter: auto; }
.og {
  position: relative;
  box-sizing: border-box;
  width: ${OG.width}px;
  height: ${OG.height}px;
  padding: ${INSET}px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--surface);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
}
.og-logo { position: relative; width: ${LOGO}px; height: ${LOGO}px; }
.og-logo svg { display: none; }
.og-logo canvas {
  position: absolute;
  inset: -${DUST}px;
  width: ${LOGO + DUST * 2}px;
  height: ${LOGO + DUST * 2}px;
}
.og p {
  margin: 0;
  max-width: 880px;
  text-wrap: balance;
  color: var(--secondary);
  font-size: 34px;
  line-height: 46px;
}
.og-name { position: absolute; }
.og-name canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
`;
