---
name: resizable-panels
description: Resizable panels, the drag interaction of the line between two panels — it stays under the pointer, resists near a side's minimum, closes the side past it, opens it freely, and moves on springs. Use when building, fixing or tuning a split view, a draggable divider, or a sidebar that collapses on drag.
---

# Resizable panels

The line between two panels is a direct-manipulation control. It feels right when it stays under the pointer, gives way softly at a side's minimum, shuts the side when you insist, and lets it back out the moment you turn around. This skill is that interaction: the zones, the springs and the pointer handling. Layout and styling follow the codebase.

Build it to the spec below, then run every check in **Verify** under real input. The work is done when every box is ticked on both sides.

## The model

One number drives the layout: `split`, the first side's share of the **track** (the container's width less its padding and gap). Hold it as two parts:

- `to`, where the pointer puts the line once the zones below have shaped it.
- `off`, how far the shown line is from `to`. A spring takes it to zero.

The line is shown at `to + off`, clamped to `[0, 1]`. A pointer move sets `to`. A **jump** (a side closes, a release goes to `MIN`, a reset) sets `to` and adds the difference to `off`, `off += oldTo - newTo`, so the shown line stays where it is and the spring carries it from there. This is an **offset spring**: after a jump the line catches up with the moving pointer within the spring's settle time, then follows it 1:1 again. A spring on the line's absolute position trails a moving pointer for the rest of the drag.

Write `split` to a CSS custom property on every move and frame, and let CSS lay out the columns from it. The UI framework stays out of the drag: no state, no re-render.

## The zones

Each side asks for a width, `wanted`, from the pointer. What it gets:

| Zone   | `wanted`               | Shown                                                         |
| ------ | ---------------------- | ------------------------------------------------------------- |
| Free   | `MIN` and up           | `wanted`, 1:1                                                 |
| Resist | `MIN - CLOSE` to `MIN` | `MIN - GIVE * (1 - exp(-over / GIVE))`, `over = MIN - wanted` |
| Closed | under `MIN - CLOSE`    | `0`, by a jump                                                |

Values that felt right: `MIN` 160px, `CLOSE` 80px, `GIVE` 40px. At the close point the side shows about 125px.

- The resist curve leaves `MIN` at a slope of 1 and flattens toward `GIVE`, so the drag eases into resistance with no kink at `MIN`, and eases more the closer it gets to the edge. A constant-ratio rubber band (the iOS `0.55`) has a kink where it starts; use the exponential.
- Closing is a jump to the edge, so the spring carries the side shut.
- Keep the side-by-side layout to widths where the track holds two `MIN`s, so only one side resists at a time. Narrower, stack the panels.

## Opening a closed side

A closed side opens freely, whether it closed before this drag or during it:

- It follows the pointer 1:1 from the edge as soon as the pointer turns back, with no dead zone and no resistance, until it reaches `MIN`. From there the zones apply again.
- **Ratchet** the grab. When a side closes mid-drag, rebase the grab so the pointer's current position is the edge: `grab = clientX - to * track`. While the side is closed, pointer travel past the edge moves the grab along with it (`grab += past`). Turning back then opens the side at once, wherever the turn happens.
- The ratchet makes hysteresis at the close point unnecessary: nothing can flicker, since opening starts from zero.

Mid-drag, the reopened side's edge sits the close distance behind the pointer for the rest of that drag. That offset is the honest record of where it closed.

## Release

| Let go while                    | The side           |
| ------------------------------- | ------------------ |
| Free                            | stays              |
| Resisting                       | jumps to `MIN`     |
| Opening, short of `MIN - CLOSE` | jumps closed again |
| Opening, past `MIN - CLOSE`     | jumps to `MIN`     |
| Closed                          | stays closed       |

The release reuses the close point as its threshold, so there is one distance to learn.

A **double click** on the line jumps to halves and clears the closed state.

## The spring

- **Critically damped**, response about 0.35s: stiffness `(2π / 0.35)²`, damping `4π / 0.35`, mass 1. A side cannot be narrower than zero, so an overshoot past the edge reads as a hit; critical damping arrives without one.
- **From rest.** A release from resistance is a rubber band let go, and a side closing from its resist zone carries almost no speed.
- **Integrate** on `requestAnimationFrame` in fixed 1ms substeps, with the frame's time capped at 50ms: a stiff spring blows up under frame-sized Euler steps. Stop when `|off| * track < 0.5px`.
- **Interruptible.** A grab mid-spring is taken relative to `to`, so the spring keeps running underneath the new drag.
- **Reduced motion** sets `off = 0` on every jump. Read `matchMedia('(prefers-reduced-motion: reduce)')` at the jump, so it stays current and the code mounts in test DOMs that lack `matchMedia`.

## Pointer handling

- `setPointerCapture` on `pointerdown`, so the drag carries on over iframes and outside the window.
- `preventDefault()` on `pointerdown`, so a drag across text selects nothing.
- `touch-action: none` on the grip, so touch drags the line instead of scrolling.
- Grab relative to the line, `grab = clientX - to * track`, so the line keeps its place under the pointer instead of leaping to it.
- Measure the track on `pointerdown` and keep it for the drag.
- Act on `pointerup` only when a grab is live: a press elsewhere released over the grip leaves the panels as they are.
- A grip about 10px wide, centred on the gap, full height. With a side closed it sits at the edge, still within reach.

## A closed side leaves nothing behind

- Each side clips what it holds as it narrows. `overflow: clip` clips without making a scroll container, so focus inside a narrow side cannot scroll it.
- The gap closes with the side: `min(gap, first side, second side)`.
- Anything drawn for a side outside its box, such as its tab in the frame's corner, is clipped at that side's edge and is gone at zero. Check the corner with each side closed, zoomed in.

## Verify

Drive a real mouse in many small moves, such as Playwright's `page.mouse.move` with about 16ms between moves, and sample `split` every frame. A two-point drag jumps over the zones. Keep the page in a visible tab: a hidden one runs no `requestAnimationFrame`, so springs stall.

On both sides:

- [ ] Free: the line moves 1:1 with the pointer.
- [ ] Resist: the width eases below `MIN`, leaving it smoothly.
- [ ] Close: past the close point the side springs to zero without bouncing.
- [ ] Mid-drag close, then turn back: the side opens 1:1 from the turn.
- [ ] Mid-drag close, push past the edge, turn back: it opens at once.
- [ ] From a side closed before the drag: it opens 1:1 from the edge.
- [ ] Every row of the release table.
- [ ] Double click from free and from each side closed: halves.
- [ ] Press outside the grip, release over it: nothing moves.
- [ ] No text selected after any drag.
- [ ] Reduced motion: every jump is instant.
- [ ] Each side closed, zoomed in, light and dark: no strip of its tab or gap at the edge.
- [ ] At rest, the panels render as they did before the line existed.

## Reference

[`REFERENCE.md`](REFERENCE.md) has a complete implementation of this spec, framework-free, with its CSS. Start from it and fit it to the layout.
