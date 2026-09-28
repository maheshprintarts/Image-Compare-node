import { useRef } from 'react';
import { splitAtStageX, splitForKey } from './compareLogic.js';
import { COMPARE_DEFAULTS } from './options.js';

/**
 * Slider interaction for the compare divider: pointer dragging and the
 * keyboard. Returns props for the drag strip and for the grip.
 *
 * - pressing the strip moves the divider under the pointer and captures the
 *   pointer, so the drag keeps going outside it; the press does not reach the
 *   stage (which would pan) and focuses the grip
 * - keys: arrows `step` (Shift `bigStep`), Page Up/Down `bigStep`, Home, End;
 *   handled keys do not reach the page's own shortcuts
 */
export function useCompareSlider({ split, onSplit, t, size, stageRef, step = COMPARE_DEFAULTS.step, bigStep = COMPARE_DEFAULTS.bigStep }) {
  const dragging = useRef(false);
  const gripRef = useRef(null);
  const latest = useRef(split); // key presses faster than a render build on each other
  latest.current = split;

  const at = (clientX) => splitAtStageX(clientX - stageRef.current.getBoundingClientRect().left, t, size);
  const onPointerDown = (e) => {
    e.stopPropagation(); // the stage would start a pan
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    gripRef.current?.focus({ preventScroll: true });
    dragging.current = true;
    onSplit(at(e.clientX));
  };
  const onPointerMove = (e) => { if (dragging.current) onSplit(at(e.clientX)); };
  const endDrag = () => { dragging.current = false; };
  const onKeyDown = (e) => {
    const next = splitForKey(e.key, e.shiftKey, latest.current, { step, bigStep });
    if (next === undefined) return;
    e.preventDefault();
    e.stopPropagation(); // not the page's own shortcuts
    latest.current = next;
    onSplit(next);
  };

  return {
    stripProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onDoubleClick: (e) => e.stopPropagation(), // the stage would fit
    },
    gripProps: { ref: gripRef, onKeyDown },
  };
}
