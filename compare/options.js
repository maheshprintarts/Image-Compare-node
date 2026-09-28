// Defaults for the compare panel and its pieces. Every one can be overridden
// through props; nothing here is read from the page.

export const COMPARE_DEFAULTS = Object.freeze({
  /** Where the divider starts, in % of the content width. */
  split: 50,
  /** Arrow keys move the split this much; Shift+arrow and Page Up/Down, bigStep. */
  step: 1,
  bigStep: 10,
  /** Label text: "before" on the left of the divider, "after" on the right. */
  labels: Object.freeze({ before: 'Before', after: 'After' }),
  /** Pixels inside the stage edge the grip waits at when the divider is off screen. */
  edge: 24,
  /** A label hides when the divider comes this close to it. */
  labelGap: Object.freeze({ before: 110, after: 120 }),
  /** Zoom limits, in screen pixels per content pixel. */
  minZoom: 0.005,
  maxZoom: 40,
  /** Space left around the content when it is fitted to the stage. */
  fitPadding: 32,
  /** Wheel zoom factor per notch. */
  wheelStep: 1.15,
});

const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);

/** "Compare: original and filled SVG" */
export const defaultAriaLabel = (labels) => `Compare: ${lowerFirst(labels.before)} and ${lowerFirst(labels.after)}`;

/** "50% original, 50% filled SVG" */
export const defaultValueText = (split, labels) =>
  `${Math.round(split)}% ${lowerFirst(labels.before)}, ${Math.round(100 - split)}% ${lowerFirst(labels.after)}`;
