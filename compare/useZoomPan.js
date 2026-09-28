import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fitTransform, zoomTransform } from './viewTransform.js';
import { COMPARE_DEFAULTS } from './options.js';

/**
 * Zoom, pan, fit and resize handling for a stage element holding content of
 * `size` { w, h } CSS pixels.
 *
 * - the content is fitted when it first appears, when `refitKey` changes and
 *   when the stage is resized - until the user zooms or pans by hand; `fit()`
 *   puts it back in that fitted state
 * - wheel zooms at the cursor (unless `zoomable` is false), dragging the stage
 *   pans while `enabled` (spread `stageProps` on the stage), double-click fits
 * - `stageBox` is the stage's current size, kept by a ResizeObserver
 *
 * @param {import('react').RefObject<HTMLElement>} stageRef
 * @param {{ w: number, h: number } | null} size  null while there is nothing to show
 * @param {{ enabled?: boolean, zoomable?: boolean, minZoom?: number, maxZoom?: number, fitPadding?: number,
 *           wheelStep?: number, refitKey?: unknown }} [options]
 */
export function useZoomPan(stageRef, size, options = {}) {
  const {
    enabled = true,
    zoomable = true,
    minZoom = COMPARE_DEFAULTS.minZoom,
    maxZoom = COMPARE_DEFAULTS.maxZoom,
    fitPadding = COMPARE_DEFAULTS.fitPadding,
    wheelStep = COMPARE_DEFAULTS.wheelStep,
    refitKey,
  } = options;
  const [t, setT] = useState({ zoom: 1, x: 0, y: 0 });
  const [stageBox, setStageBox] = useState({ w: 0, h: 0 });
  const fitted = useRef(true);

  const fit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !size) return;
    fitted.current = true;
    setT(fitTransform({ w: stage.clientWidth, h: stage.clientHeight }, size, { pad: fitPadding, minZoom }));
  }, [size?.w, size?.h, fitPadding, minZoom]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Zoom by `factor` about the stage point (cx, cy); the stage centre by default. */
  const zoomBy = useCallback((factor, cx, cy) => {
    const stage = stageRef.current;
    if (!stage || !size) return;
    fitted.current = false;
    setT((p) => zoomTransform(p, factor, cx ?? stage.clientWidth / 2, cy ?? stage.clientHeight / 2, { minZoom, maxZoom }));
  }, [size?.w, size?.h, minZoom, maxZoom]); // eslint-disable-line react-hooks/exhaustive-deps

  /** One content pixel to one CSS pixel. */
  const actualSize = useCallback(() => zoomBy(1 / t.zoom), [zoomBy, t.zoom]);

  // New content is fitted (unless the view was zoomed by hand); so is a resized stage.
  useLayoutEffect(() => { if (fitted.current) fit(); }, [refitKey, fit]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const ro = new ResizeObserver(() => {
      setStageBox({ w: stage.clientWidth, h: stage.clientHeight });
      if (fitted.current) fit();
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, [fit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel zoom at the cursor. Not passive: it has to stop the page scrolling.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !zoomable) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? wheelStep : 1 / wheelStep, e.clientX - r.left, e.clientY - r.top);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [zoomBy, wheelStep, zoomable]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag to pan.
  const drag = useRef(null);
  const [panning, setPanning] = useState(false);
  const onPointerDown = (e) => {
    if (!enabled) return;
    drag.current = { x: e.clientX, y: e.clientY, from: t };
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    fitted.current = false;
    const { from, x, y } = drag.current;
    setT({ zoom: from.zoom, x: from.x + (e.clientX - x), y: from.y + (e.clientY - y) });
  };
  const endPan = () => { drag.current = null; setPanning(false); };

  return {
    t,
    stageBox,
    fit,
    zoomBy,
    actualSize,
    panning,
    /** Spread on the stage element. */
    stageProps: { onPointerDown, onPointerMove, onPointerUp: endPan, onPointerCancel: endPan, onDoubleClick: fit },
    /** The CSS transform that places the content (transform-origin 0 0). */
    transform: `translate(${t.x}px, ${t.y}px) scale(${t.zoom})`,
  };
}
