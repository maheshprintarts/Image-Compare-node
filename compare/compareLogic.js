// Comparison logic: where the divider is, what each key does to it, and how
// the "after" layer is cut. Pure functions - no React, no DOM - so any page
// (or a test) can use them.
//
// Coordinates: `t` is the view transform { zoom, x, y } that puts the content
// on the stage (content pixel p lands at stage pixel t.x + p * t.zoom); `size`
// is the content's own size { w, h } in CSS pixels; `stage` is { w, h }.
// The split is a percentage of the content's width: what lies left of it shows
// "before", what lies right of it shows "after".

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** A split rounded to 0.1 % and kept within 0..100. */
export const roundSplit = (v) => clamp(Math.round(v * 10) / 10, 0, 100);

/** The split under a stage x coordinate (pixels from the stage's left edge). */
export function splitAtStageX(stageX, t, size) {
  return Math.round(clamp(((stageX - t.x) / (size.w * t.zoom)) * 100, 0, 100) * 10) / 10;
}

/**
 * The split a key press moves to, or undefined for a key the slider ignores.
 * Arrows `step` (Shift: `bigStep`), Page Up/Down `bigStep`, Home 0, End 100.
 */
export function splitForKey(key, shiftKey, from, { step = 1, bigStep = 10 } = {}) {
  const by = shiftKey ? bigStep : step;
  const next = {
    ArrowLeft: from - by, ArrowDown: from - by, ArrowRight: from + by, ArrowUp: from + by,
    PageDown: from - bigStep, PageUp: from + bigStep, Home: 0, End: 100,
  }[key];
  return next === undefined ? undefined : roundSplit(next);
}

/** The CSS clip-path that shows the "after" layer right of the divider only. */
export const afterClip = (split) => `inset(0 0 0 ${split}%)`;

/**
 * Where the divider, its grip and the two labels go on the stage.
 *
 * The divider spans the part of the content that is on screen, with the grip
 * at its vertical middle. When the divider is off to one side, the grip waits
 * `edge` pixels inside that edge (`off` says which side). A label is hidden
 * when the divider comes within `labelGap` of it.
 *
 * @returns null when no part of the content is on the stage
 */
export function dividerLayout({ split, t, size, stage, edge = 24, labelGap = { before: 110, after: 120 } }) {
  const contentW = size.w * t.zoom;
  const x = t.x + (split / 100) * contentW;
  const top = Math.max(0, t.y);
  const bottom = Math.min(stage.h, t.y + size.h * t.zoom);
  if (!stage.w || bottom - top < 1) return null;
  const off = x < 0 ? 'left' : x > stage.w ? 'right' : null;
  const gripX = off === 'left' ? edge : off === 'right' ? stage.w - edge : x;
  const left = Math.max(0, t.x);
  const right = Math.min(stage.w, t.x + contentW);
  return {
    x, gripX, off, top, bottom, height: bottom - top, left, right,
    hideBefore: x - left < labelGap.before,
    hideAfter: right - x < labelGap.after,
  };
}
