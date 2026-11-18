/**
 * Spray paint, simulated. A can moves along each stroke and builds up paint
 * out of droplets: packed tight in the core, thinning to a dust at its edge,
 * with a translucent mist around it and a few big spatters thrown further out.
 * Where it lays down more than the wall holds, at the start of a stroke, on a
 * turn or at the foot of an upright, the excess runs down as a thin drip. A
 * seed makes it the same on every load.
 *
 * Played, the can sprays at the pace of a hand, its droplets landing as it
 * passes, and each drip gathers a moment after the paint above it and runs
 * down, slowing until it stops.
 *
 * The paint stays wet: a finger drawn through it picks some up, drags it
 * along and leaves it further on.
 */

export type Point = [x: number, y: number];

export type Spray = {
  /** The can's path for each stroke, in CSS pixels, in the order sprayed. */
  strokes: Point[][];
  /** How wide the solid line is, in CSS pixels. */
  width: number;
  /** The paint, in red, green and blue from 0 to 255. */
  color: [r: number, g: number, b: number];
  seed: number;
  /** Plays the spraying and the drips rather than showing them done. */
  play?: boolean;
  /** When played, how long after the page settles the can starts, in seconds. */
  after?: number;
};

/** A seeded random number from 0 to 1. */
export function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth noise from -1 to 1, one bump about every unit. */
export function noise(rand: () => number) {
  const knots = Array.from({ length: 256 }, () => rand() * 2 - 1);
  return (t: number) => {
    const i = Math.floor(t);
    const f = t - i;
    const a = knots[i & 255];
    const b = knots[(i + 1) & 255];
    return a + (b - a) * f * f * (3 - 2 * f);
  };
}

/** A normally distributed number, by Box–Muller. */
export const gaussian = (rand: () => number) =>
  Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Points every `step` pixels along a polyline, with their distance. */
function resample(line: Point[], step: number) {
  const out: { x: number; y: number; s: number }[] = [];
  let s = 0;
  let carry = 0;
  out.push({ x: line[0][0], y: line[0][1], s: 0 });
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1];
    const [bx, by] = line[i];
    const length = Math.hypot(bx - ax, by - ay);
    let at = step - carry;
    while (at <= length) {
      const t = at / length;
      out.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, s: s + at });
      at += step;
    }
    carry = length - (at - step);
    s += length;
  }
  return out;
}

/** Paint that has run down from a heavy spot. */
type Drip = {
  x: number;
  y: number;
  length: number;
  width: number;
  wander: (t: number) => number;
  /** How big its bead is against its width. */
  bead: number;
  /** When it starts to run, and how long it runs for, in seconds. */
  start: number;
  takes: number;
  /** Whether it has stopped and become part of the paint. */
  set?: boolean;
};

/** How much paint a finger leaves of what it carries, at its middle. */
const LEAVE = 0.3;
/** And how much it picks up of what it passes over. */
const PICK = 0.22;
/** And how much of what it carries the wall soaks up as it goes. */
const SOAK = 0.12;

/** How fast the can moves along a stroke, in its line's widths a second. */
const PACE = 95;

/**
 * Sprays the strokes onto a canvas `cssWidth` by `cssHeight` pixels. Returns
 * how long the can takes, in seconds, a function that stops it playing, and
 * one that drags a finger through the paint.
 */
export function spray(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  { strokes, width, color, seed, play, after = 0 }: Spray,
  scale: number,
) {
  const W = Math.round(cssWidth * scale);
  const H = Math.round(cssHeight * scale);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const rand = random(seed);
  const flutter = noise(rand);
  const breath = noise(rand);

  // All the paint, to find where it drips, and the paint shown so far.
  const paint = new Float32Array(W * H);
  const shown = play ? new Float32Array(W * H) : paint;
  /** How much paint the middle of an even pass leaves. */
  const FULL = 4;
  /** How sharp the edge of the line is: 2 is soft, higher is crisper. */
  const EDGE = 4;

  // The can's cone at a few distances from the wall, as a stamp laid every
  // half pixel: solid in the middle with a short soft edge. Further off, it is
  // wider and lighter.
  const step = 0.5;
  const cones = Array.from({ length: 10 }, (_, i) => {
    const far = 0.7 + i * 0.1;
    const radius = width * 0.5 * far * scale;
    const reach = Math.ceil(radius * 1.6);
    const size = reach * 2 + 1;
    const kernel = new Float32Array(size * size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        kernel[y * size + x] = Math.exp(
          -((Math.hypot(x - reach, y - reach) / radius) ** EDGE) * Math.LN2 * 4,
        );
    let across = 0;
    for (let x = 0; x < size; x++) across += kernel[reach * size + x];
    // Light, as the droplets packed into the core make up the rest.
    const amount = (FULL * 0.7 * step * scale) / across / Math.sqrt(far);
    return { reach, size, kernel, amount };
  });

  const stamp = (
    into: Float32Array,
    cx: number,
    cy: number,
    far: number,
    flow: number,
  ) => {
    const cone = cones[Math.min(9, Math.max(0, Math.round((far - 0.7) * 10)))];
    const { reach, size, kernel } = cone;
    const amount = cone.amount * flow;
    const px = Math.round(cx * scale);
    const py = Math.round(cy * scale);
    const x0 = Math.max(0, px - reach);
    const x1 = Math.min(W - 1, px + reach);
    const y0 = Math.max(0, py - reach);
    const y1 = Math.min(H - 1, py + reach);
    for (let y = y0; y <= y1; y++) {
      const row = (y - py + reach) * size - px + reach;
      const at = y * W;
      for (let x = x0; x <= x1; x++) into[at + x] += kernel[row + x] * amount;
    }
    return reach;
  };

  // A droplet: a small disc, its edge softened by how much of a pixel it covers.
  const droplet = (
    into: Float32Array,
    cx: number,
    cy: number,
    radius: number,
    amount: number,
  ) => {
    const px = cx * scale;
    const py = cy * scale;
    const r = Math.max(0.5, radius * scale);
    const x0 = Math.max(0, Math.floor(px - r - 1));
    const x1 = Math.min(W - 1, Math.ceil(px + r + 1));
    const y0 = Math.max(0, Math.floor(py - r - 1));
    const y1 = Math.min(H - 1, Math.ceil(py + r + 1));
    // A droplet smaller than a pixel paints less of it.
    const thin = Math.min(1, (radius * scale) / 0.5) ** 2;
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
        const cover = Math.min(1, Math.max(0, r + 0.5 - d));
        if (cover > 0) into[y * W + x] += cover * amount * thin;
      }
  };

  // The mist, a quarter the size, spread wide and faint.
  const Q = 4;
  const mW = Math.ceil(W / Q);
  const mH = Math.ceil(H / Q);
  const mist = new Float32Array(mW * mH);
  const haze = play ? new Float32Array(mW * mH) : mist;
  const mSigma = (width * 1.5 * scale) / Q;
  const mReach = Math.ceil(mSigma * 2.5);
  const mStep = 3;
  const mPer = (0.1 * mStep * scale) / Q / (Math.sqrt(2 * Math.PI) * mSigma);
  const fog = (into: Float32Array, cx: number, cy: number, amount: number) => {
    const px = (cx * scale) / Q;
    const py = (cy * scale) / Q;
    const x0 = Math.max(0, Math.floor(px - mReach));
    const x1 = Math.min(mW - 1, Math.ceil(px + mReach));
    const y0 = Math.max(0, Math.floor(py - mReach));
    const y1 = Math.min(mH - 1, Math.ceil(py + mReach));
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++)
        into[y * mW + x] +=
          Math.exp(-((x - px) ** 2 + (y - py) ** 2) / (2 * mSigma * mSigma)) *
          amount;
  };

  // What the can lays down and when, in seconds, to play back in order:
  // stamps and droplets as x, y, size, amount and time, mist without size.
  const stamps: number[] = [];
  const drops: number[] = [];
  const fogs: number[] = [];
  /** Lays a droplet now, and keeps it to land within a moment of `at`. */
  const land = (
    x: number,
    y: number,
    size: number,
    amount: number,
    at: number,
  ) => {
    droplet(paint, x, y, size, amount);
    drops.push(x, y, size, amount, at + rand() * 0.2);
  };
  const speed = PACE * width;
  let time = 0;
  let travelled = 0;
  let last: Point | undefined;
  for (const line of strokes) {
    if (line.length < 2) continue;
    // The hand moves to the next stroke with the nozzle up.
    if (last)
      time +=
        0.06 +
        Math.hypot(line[0][0] - last[0], line[0][1] - last[1]) / speed / 2.5;
    last = line[line.length - 1];
    const points = resample(line, step);
    const length = points[points.length - 1].s;
    // The can often spits a few big drops as it starts.
    if (rand() < 0.3)
      for (let n = 4 + Math.floor(rand() * 8); n > 0; n--) {
        const a = rand() * Math.PI * 2;
        const r = width * (0.6 + Math.abs(gaussian(rand)) * 1.4);
        land(
          points[0].x + Math.cos(a) * r,
          points[0].y + Math.sin(a) * r,
          0.3 + rand() ** 2 * 1.1,
          3,
          time,
        );
      }
    // How sharply the path turns around each point, from 0 to 1.
    const turn = points.map((p, i) => {
      const a = points[Math.max(0, i - 6)];
      const b = points[Math.min(points.length - 1, i + 6)];
      const ux = p.x - a.x;
      const uy = p.y - a.y;
      const vx = b.x - p.x;
      const vy = b.y - p.y;
      const lu = Math.hypot(ux, uy);
      const lv = Math.hypot(vx, vy);
      if (!lu || !lv) return 0;
      return (1 - (ux * vx + uy * vy) / (lu * lv)) / 2;
    });
    // The can starts slow and slows into turns. At the end it either stops,
    // or flicks away, faster and further from the wall.
    const pause = 0.35 + rand() * 0.3;
    const flick = rand() < 0.55;
    const tail = width * (0.8 + rand());
    for (let i = 0; i < points.length; i++) {
      const { x, y, s } = points[i];
      const away = flick ? smoothstep(length - tail, length, s) : 0;
      const pace =
        (pause + (1 - pause) * smoothstep(0, width * 0.9, s)) *
        (flick
          ? 1 + 1.6 * away
          : 0.7 + 0.3 * smoothstep(0, width * 0.5, length - s)) *
        (1 / (1 + 2.2 * turn[i])) *
        (1 + 0.18 * flutter((travelled + s) / 18));
      const flow = 1 / pace;
      time += step / (speed * pace);
      const far = (1 + 0.13 * breath((travelled + s) / 45)) * (1 + 0.5 * away);
      stamp(paint, x, y, far, flow);
      // The droplets land first, and the core fills in behind them.
      stamps.push(x, y, far, flow, time + 0.12);

      // Droplets packed into the core.
      for (let n = Math.floor(flow * step * 24 + rand()); n > 0; n--) {
        const spread = width * far * 0.25;
        land(
          x + gaussian(rand) * spread,
          y + gaussian(rand) * spread,
          0.15 + rand() ** 3 * 0.45,
          0.5 + rand(),
          time,
        );
      }
      // A dust of fine ones off the edge of the cone.
      for (let n = Math.floor(flow * step * 22 + rand()); n > 0; n--) {
        const a = rand() * Math.PI * 2;
        const r = width * far * (0.4 + Math.abs(gaussian(rand)) * 0.25);
        land(
          x + Math.cos(a) * r,
          y + Math.sin(a) * r,
          0.1 + rand() ** 5 * 0.6,
          0.6 + rand() * 1.6,
          time,
        );
      }
      // And now and then a big spatter, thrown further out.
      if (rand() < flow * step * 0.5) {
        const a = rand() * Math.PI * 2;
        const r = width * far * (0.8 + Math.abs(gaussian(rand)) * 1.6);
        land(
          x + Math.cos(a) * r,
          y + Math.sin(a) * r,
          0.3 + rand() ** 2 * 1.1,
          3,
          time,
        );
      }
      if (i % (mStep / step) === 0) {
        fog(mist, x, y, mPer * flow);
        fogs.push(x, y, mPer * flow, time);
      }
    }
    travelled += length + 40;
  }

  // The droplets in the order they land.
  const landing = Array.from(
    { length: drops.length / 5 },
    (_, i) => i * 5,
  ).sort((a, b) => drops[a + 4] - drops[b + 4]);

  // Where paint is heavier than a pass leaves, the excess in each column runs
  // to the foot of the paint and drips from there.
  const drips: Drip[] = [];
  const at = (x: number, y: number) =>
    paint[
      Math.min(H - 1, Math.round(y * scale)) * W +
        Math.min(W - 1, Math.round(x * scale))
    ];
  let gap = 0;
  for (let x = 0; x < cssWidth; x += 0.5) {
    gap -= 0.5;
    let excess = 0;
    let inside = false;
    for (let y = 0; y < cssHeight; y += 0.5) {
      const p = at(x, y);
      if (p > FULL * 0.55) {
        inside = true;
        excess += Math.max(0, p - FULL) * 0.5;
        continue;
      }
      if (!inside) continue;
      inside = false;
      const load = excess;
      excess = 0;
      if (load < 0.6 || gap > 0) continue;
      const chance = Math.min(0.35, load / 40);
      if (rand() > chance) continue;
      gap = width * (0.35 + rand() * 0.5);
      // A drip that runs into paint below ends there, taken into it.
      let below = cssHeight - width;
      for (let next = y; next < cssHeight; next += 0.5)
        if (at(x, next) > FULL * 0.55) {
          below = next + width * 0.5;
          break;
        }
      const reach = Math.min(
        below - y,
        (3 + Math.pow(load, 0.8) * 1.2) * (0.3 + rand() ** 2 * 1.6),
      );
      // It runs once the last pass over its root has laid its paint.
      const root = y - width * 0.3;
      let wet = 0;
      for (let i = 0; i < stamps.length; i += 5)
        if (Math.hypot(stamps[i] - x, stamps[i + 1] - root) < width * 0.8)
          wet = Math.max(wet, stamps[i + 4]);
      const length = Math.max(2, reach);
      drips.push({
        x,
        // Inside the paint, where it is solid.
        y: root,
        length,
        width:
          width *
          (0.13 + Math.min(0.1, Math.sqrt(load) * 0.015)) *
          (0.8 + rand() * 0.4),
        wander: noise(rand),
        bead: 0.5 + rand() * 0.15,
        start: wet + 0.25 + rand() * 0.9,
        takes: 5 + length / 6,
      });
    }
  }

  // Paint sags where it gathers to run, so the edge there is heavy and sharp.
  const sag = (into: Float32Array, drip: Drip) =>
    stamp(into, drip.x, drip.y + width * 0.12, 0.7, 0.9);
  for (const drip of drips) sag(paint, drip);

  // Paint to pixels: the more paint, the less of the page shows through.
  const [r, g, b] = color;
  const image = ctx.createImageData(W, H);
  const data = image.data;
  const develop = (x0: number, y0: number, x1: number, y1: number) => {
    x0 = Math.max(0, Math.floor(x0));
    y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(W - 1, Math.ceil(x1));
    y1 = Math.min(H - 1, Math.ceil(y1));
    for (let y = y0; y <= y1; y++) {
      const my = Math.min(mH - 1.001, y / Q);
      const my0 = Math.floor(my);
      const fy = my - my0;
      for (let x = x0; x <= x1; x++) {
        const mx = Math.min(mW - 1.001, x / Q);
        const mx0 = Math.floor(mx);
        const fx = mx - mx0;
        const m =
          (haze[my0 * mW + mx0] * (1 - fx) + haze[my0 * mW + mx0 + 1] * fx) *
            (1 - fy) +
          (haze[(my0 + 1) * mW + mx0] * (1 - fx) +
            haze[(my0 + 1) * mW + mx0 + 1] * fx) *
            fy;
        const i = y * W + x;
        // A fine grain, as paint lands unevenly where it is thin.
        const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const grain = 1 + (h - Math.floor(h) - 0.5) * 0.35;
        const p = (shown[i] + m) * grain;
        const alpha = 1 - Math.exp(-1.3 * p);
        // Heavier paint sits a touch deeper.
        const deep = 1 - 0.12 * smoothstep(FULL, FULL * 2.5, p);
        data[i * 4] = r * deep;
        data[i * 4 + 1] = g * deep;
        data[i * 4 + 2] = b * deep;
        data[i * 4 + 3] = alpha * 255;
      }
    }
  };

  // The drips, drawn as shapes: a neck that narrows from the paint, a thin
  // run, and a small bead at the foot. Each is drawn as far as it has run.
  const pour = (into: CanvasRenderingContext2D, drip: Drip, length: number) => {
    const { x, y, width: w } = drip;
    const neck = Math.min(length * 0.5, w * 2.2 + width * 0.3);
    const steps = Math.max(4, Math.ceil(length / 1.5));
    const left: Point[] = [];
    const right: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const d = t * length;
      const cx = x + drip.wander(d / 30) * 0.9 * smoothstep(0, 12, d);
      const flare = d < neck ? (1 - d / neck) ** 2 * w * 1.8 : 0;
      const half = (w * (1 - 0.22 * t) + flare) / 2;
      left.push([cx - half, y + d]);
      right.push([cx + half, y + d]);
    }
    const end = left[left.length - 1];
    const footX = end[0] + (right[right.length - 1][0] - end[0]) / 2;
    const bead = w * drip.bead * Math.min(1, 0.55 + length / 30);
    const footY = y + length - bead * 0.2;

    into.fillStyle = `rgb(${r} ${g} ${b})`;
    into.beginPath();
    into.moveTo(...left[0]);
    for (const p of left) into.lineTo(...p);
    for (let i = right.length - 1; i >= 0; i--) into.lineTo(...right[i]);
    into.closePath();
    into.fill();
    into.beginPath();
    into.ellipse(footX, footY, bead, bead * 1.12, 0, 0, Math.PI * 2);
    into.fill();
  };

  // A drip that has stopped joins the paint, so a finger can smear it too:
  // drawn on its own, then read back as the paint that would show as much.
  let stencil: CanvasRenderingContext2D | undefined;
  const set = (drip: Drip) => {
    drip.set = true;
    stencil ??= Object.assign(document.createElement('canvas'), {
      width: W,
      height: H,
    }).getContext('2d', { willReadFrequently: true })!;
    const reach = (drip.width * 2.5 + width * 0.3) * scale;
    const x0 = Math.max(0, Math.floor(drip.x * scale - reach));
    const y0 = Math.max(0, Math.floor(drip.y * scale));
    const x1 = Math.min(W, Math.ceil(drip.x * scale + reach));
    const y1 = Math.min(H, Math.ceil((drip.y + drip.length) * scale + reach));
    if (x1 <= x0 || y1 <= y0) return;
    stencil.clearRect(x0, y0, x1 - x0, y1 - y0);
    stencil.save();
    stencil.scale(scale, scale);
    pour(stencil, drip, drip.length);
    stencil.restore();
    const cover = stencil.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const a = cover[((y - y0) * (x1 - x0) + x - x0) * 4 + 3] / 255;
        if (a > 0) shown[y * W + x] += -Math.log(1 - Math.min(0.995, a)) / 1.3;
      }
    develop(x0, y0, x1, y1);
  };

  /** Draws the paint, and each drip still running as far as it has at `now`. */
  const show = (now: number) => {
    for (const drip of drips)
      if (!drip.set && now - drip.start >= drip.takes) set(drip);
    ctx.putImageData(image, 0, 0);
    ctx.save();
    ctx.scale(scale, scale);
    for (const drip of drips) {
      const ran = now - drip.start;
      if (ran <= 0 || drip.set) continue;
      // Fast at first, slowing as the paint in it thins out.
      const done = 1 - (1 - Math.min(1, ran / drip.takes)) ** 3;
      pour(ctx, drip, Math.max(0.5, drip.length * done));
    }
    ctx.restore();
  };

  // When played, a beat for the page to settle before the can starts.
  const begun = performance.now() + (0.4 + after) * 1000;

  // A finger's tip: the paint it carries, and how unevenly its skin takes it.
  const finger = {
    carry: new Float32Array(),
    ridges: new Float32Array(),
    on: false,
  };

  /**
   * Drags a finger `radius` CSS pixels across from `from` to `to`, or puts it
   * down at `to` without one. Along the way it leaves some of what it carries
   * and picks up some of what it passes, most at its middle. The mist around
   * the paint is too thin to smear.
   */
  const smudge = (from: Point | undefined, to: Point, radius: number) => {
    const R = Math.max(1, Math.round(radius * scale));
    const size = R * 2 + 1;
    if (finger.carry.length !== size * size) {
      finger.carry = new Float32Array(size * size);
      // The skin isn't even, so it drags paint in fine streaks.
      finger.ridges = Float32Array.from(
        { length: size * size },
        () => 0.4 + Math.random() * 1.2,
      );
      finger.on = false;
    }
    if (!from) finger.on = false;
    const [ax, ay] = from ?? to;
    const [bx, bY] = to;
    const steps = Math.max(
      1,
      Math.ceil((Math.hypot(bx - ax, bY - ay) * scale) / Math.max(1, R * 0.25)),
    );
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let s = 0; s <= steps; s++) {
      const cx = Math.round((ax + ((bx - ax) * s) / steps) * scale);
      const cy = Math.round((ay + ((bY - ay) * s) / steps) * scale);
      for (let dy = -R; dy <= R; dy++) {
        const y = cy + dy;
        if (y < 0 || y >= H) continue;
        for (let dx = -R; dx <= R; dx++) {
          const x = cx + dx;
          const d = (dx * dx + dy * dy) / (R * R);
          if (x < 0 || x >= W || d > 1) continue;
          const i = y * W + x;
          const c = (dy + R) * size + dx + R;
          // Put down on fresh paint, it only takes up what is there.
          if (!finger.on) {
            finger.carry[c] = shown[i];
            continue;
          }
          const w = Math.min(1, (1 - d) ** 2 * finger.ridges[c]);
          const here = shown[i];
          const held = finger.carry[c];
          shown[i] = here + (held - here) * LEAVE * w;
          finger.carry[c] = (held + (here - held) * PICK * w) * (1 - SOAK * w);
        }
      }
      finger.on = true;
      x0 = Math.min(x0, cx - R);
      y0 = Math.min(y0, cy - R);
      x1 = Math.max(x1, cx + R);
      y1 = Math.max(y1, cy + R);
    }
    develop(x0, y0, x1, y1);
    show(play ? (performance.now() - begun) / 1000 : Infinity);
  };

  /** Whether there's paint within a few CSS pixels of `at`. */
  const wet = ([x, y]: Point) => {
    const R = Math.round(3 * scale);
    const px = Math.round(x * scale);
    const py = Math.round(y * scale);
    for (let dy = -R; dy <= R; dy++)
      for (let dx = -R; dx <= R; dx++) {
        const i = (py + dy) * W + px + dx;
        const inside = px + dx >= 0 && px + dx < W && py + dy >= 0;
        if (inside && py + dy < H && shown[i] > FULL * 0.15) return true;
      }
    return false;
  };

  if (!play) {
    develop(0, 0, W - 1, H - 1);
    show(Infinity);
    return { takes: time, stop: () => {}, smudge, wet };
  }

  // Played back frame by frame: whatever the can has laid down since the last
  // frame, then the drips as far as they have run.
  const sagged = new Set<Drip>();
  const end = Math.max(time + 0.2, ...drips.map((d) => d.start + d.takes));
  // How far through each list of what the can laid down playback has got.
  let stamped = 0;
  let dropped = 0;
  let misted = 0;
  let frame = 0;
  const tick = () => {
    const now = (performance.now() - begun) / 1000;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const touch = (x: number, y: number, reach: number) => {
      x0 = Math.min(x0, x * scale - reach);
      y0 = Math.min(y0, y * scale - reach);
      x1 = Math.max(x1, x * scale + reach);
      y1 = Math.max(y1, y * scale + reach);
    };
    for (; stamped < stamps.length; stamped += 5) {
      const [x, y, far, flow, at] = stamps.slice(stamped, stamped + 5);
      if (at > now) break;
      touch(x, y, stamp(shown, x, y, far, flow));
    }
    for (; dropped < landing.length; dropped++) {
      const i = landing[dropped];
      const [x, y, size, amount, at] = drops.slice(i, i + 5);
      if (at > now) break;
      droplet(shown, x, y, size, amount);
      touch(x, y, size * scale + 2);
    }
    for (; misted < fogs.length; misted += 4) {
      const [x, y, amount, at] = fogs.slice(misted, misted + 4);
      if (at > now) break;
      fog(haze, x, y, amount);
      touch(x, y, (mReach + 1) * Q);
    }
    for (const drip of drips)
      if (now >= drip.start && !sagged.has(drip)) {
        sagged.add(drip);
        touch(drip.x, drip.y + width * 0.12, sag(shown, drip));
      }
    if (x1 >= x0) develop(x0, y0, x1, y1);
    show(now);
    if (now < end) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return {
    takes: time,
    stop: () => cancelAnimationFrame(frame),
    smudge,
    wet,
  };
}
