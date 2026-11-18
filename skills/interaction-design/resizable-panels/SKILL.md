---
name: resizable-panels
description: Resizable panels, how the line between two panels behaves under drag, in any stack — it stays under the pointer, resists near a side's minimum, closes the side past it, opens it freely, and moves on springs. Use when building, fixing or tuning a split view, a draggable divider, or a sidebar that collapses on drag.
metadata:
  summary: How the line between two panels behaves under drag. It stays under the pointer, resists near a minimum, closes past it, opens freely and moves on springs.
---

# Resizable panels

The line between two panels is a direct-manipulation control. It feels right when it stays under the pointer, gives way softly at a side's minimum, shuts the side when you insist, and lets it back out the moment you turn around.

This skill specifies **behaviour**: what the line does under the hand, and in what numbers. It leaves the technology to the project. Build it with what the codebase already uses, whether CSS and a hand-written spring, a motion library, or a native framework; any technique that produces the behaviour is right. Each **One way** note is one route to the behaviour, for the web, and [`REFERENCE.md`](REFERENCE.md) is one whole implementation.

Build to the behaviour below, then run every check in **Verify** under real input. The work is done when every box is ticked on both sides.

## Under the pointer

- The line follows the pointer 1:1 from the first pixel, and each move shows in the same frame.
- Grabbing the line takes it from where it is: it keeps its place under the pointer instead of leaping to it.
- When the line has to **jump** (a side closes, a release sends it to `MIN`, a reset), it springs from where it is shown, catches up with the moving pointer within the spring's settle time, then follows it 1:1 again.
- Grabbing the line mid-spring takes over from where it is going, and the spring finishes under the new drag.

One way: hold the line as `to`, where the pointer puts it, plus `off`, how far the shown line is from there. A jump sets `to` and adds the difference to `off` (`off += oldTo - newTo`), and the spring takes `off` to zero while `to` follows the pointer. A spring on the line's absolute position trails a moving pointer for the rest of the drag. Write the line's position straight to the layout on every move and frame, such as a CSS custom property the columns read, outside the UI framework's render cycle.

## The zones

Each side asks the pointer for a width, `wanted`, out of the **track** (the container's width less its padding and gap). What it gets:

| Zone   | `wanted`               | Shown                                                         |
| ------ | ---------------------- | ------------------------------------------------------------- |
| Free   | `MIN` and up           | `wanted`, 1:1                                                 |
| Resist | `MIN - CLOSE` to `MIN` | `MIN - GIVE * (1 - exp(-over / GIVE))`, `over = MIN - wanted` |
| Closed | under `MIN - CLOSE`    | `0`, by a jump                                                |

Values that felt right: `MIN` 160px, `CLOSE` 80px, `GIVE` 40px. At the close point the side shows about 125px.

- The resistance starts at a slope of 1 and flattens toward `GIVE`, so the drag eases into it with no kink at `MIN`, and eases more the closer it gets to the edge. A constant-ratio rubber band (the iOS `0.55`) kinks where it starts; the exponential curve is the one to match.
- Closing is a jump to the edge, so the spring carries the side shut.
- The panels sit side by side only where the track holds two `MIN`s, so one side resists at a time. Narrower, they stack.

## Opening a closed side

A closed side opens freely, whether it closed before this drag or during it:

- It follows the pointer 1:1 from the edge as soon as the pointer turns back, with no dead zone and no resistance, until it reaches `MIN`. From there the zones apply again.
- Pushing further past the edge changes nothing, and turning back opens the side at once, wherever the turn happens.
- Nothing flickers at the close point, since opening starts from zero.

Mid-drag, the reopened side's edge sits the close distance behind the pointer for the rest of that drag. That offset is the honest record of where it closed.

One way: **ratchet** the grab. When a side closes, rebase the grab so the pointer's current position is the edge; while it is closed, carry the grab along with any pointer travel past the edge.

## Release

| Let go while                    | The side           |
| ------------------------------- | ------------------ |
| Free                            | stays              |
| Resisting                       | jumps to `MIN`     |
| Opening, short of `MIN - CLOSE` | jumps closed again |
| Opening, past `MIN - CLOSE`     | jumps to `MIN`     |
| Closed                          | stays closed       |

The release reuses the close point as its threshold, so there is one distance to learn.

A **double click** on the line jumps to halves and opens a closed side.

## The spring

- **Critically damped**, with a response of about 0.35s: it arrives without overshooting. A side cannot be narrower than zero, so a bounce past the edge would read as a hit.
- **From rest.** A release from resistance is a rubber band let go, and a side closing from its resist zone carries almost no speed.
- **Reduced motion** makes every jump instant.

One way, for a hand-written spring: stiffness `(2π / 0.35)²`, damping `4π / 0.35`, mass 1, stepped on each animation frame in fixed 1ms substeps with the frame's time capped at 50ms, since a stiff spring blows up under frame-sized steps. Settle when the line is within half a pixel. Read the reduced-motion preference at each jump, so it stays current.

## Under the hand

- The drag carries on over embedded content, such as an iframe, and outside the window.
- Dragging across text selects nothing.
- On touch, dragging the line moves the line instead of scrolling the page.
- A press that starts elsewhere and is released over the line leaves the panels as they are.
- The grip is about 10px wide, centred on the gap, the full height. With a side closed it sits at the edge, still within reach.

One way, on the web: `setPointerCapture` and `preventDefault()` on `pointerdown`, `touch-action: none` on the grip, and a release that acts only when a grab is live. Measure the track when the drag starts and keep it for the drag.

## A closed side leaves nothing behind

- Each side clips what it holds as it narrows, and focus inside a narrow side leaves it unscrolled.
- The gap closes with the side.
- Anything drawn for a side outside its box, such as its tab in the frame's corner, goes with the side and is gone at zero. Check the corner with each side closed, zoomed in.

One way, on the web: `overflow: clip` on each side, a gap of `min(gap, first side, second side)`, and decorations clipped at their side's edge.

## Verify

Drive real input in many small moves, such as Playwright's `page.mouse.move` with about 16ms between moves on the web, and sample the line every frame. A two-point drag jumps over the zones. Keep the view visible: a hidden browser tab runs no animation frames, so springs stall.

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
