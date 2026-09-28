import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { afterClip, roundSplit } from './compareLogic.js';
import { CompareHandle } from './CompareHandle.jsx';
import { useContentSize, useSourceUrl, normalizeSource } from './compareSources.js';
import { COMPARE_DEFAULTS } from './options.js';
import { useZoomPan } from './useZoomPan.js';
import './compare.css';

/**
 * A self-contained before/after compare panel: two images or SVGs drawn on
 * top of each other, "before" left of a draggable divider and "after" right
 * of it, on a checkerboard stage that zooms (wheel), pans (drag), fits
 * (double-click) and refits when resized.
 *
 * The panel fills its parent: give the parent (or `style`) a height.
 *
 * The split can be left to the panel (`defaultSplit`) or controlled (`split`
 * + `onSplitChange`). Through a ref: fit(), zoomBy(factor, x?, y?),
 * actualSize(), setSplit(v).
 */
export const ComparePanel = forwardRef(function ComparePanel(
  {
    before,
    after,
    labels = COMPARE_DEFAULTS.labels,
    width,
    height,
    split: controlledSplit,
    defaultSplit = COMPARE_DEFAULTS.split,
    onSplitChange,
    zoomable = true,
    minZoom = COMPARE_DEFAULTS.minZoom,
    maxZoom = COMPARE_DEFAULTS.maxZoom,
    fitPadding = COMPARE_DEFAULTS.fitPadding,
    wheelStep = COMPARE_DEFAULTS.wheelStep,
    onViewChange,
    handle,
    className = '',
    style,
    id,
  },
  ref,
) {
  const stageRef = useRef(null);
  const beforeUrl = useSourceUrl(before);
  const afterUrl = useSourceUrl(after);
  const { size, onNaturalSize } = useContentSize(before, after, width, height);

  const [ownSplit, setOwnSplit] = useState(defaultSplit);
  const split = controlledSplit ?? ownSplit;
  const setSplit = useCallback((v) => {
    const next = roundSplit(v);
    if (controlledSplit === undefined) setOwnSplit(next);
    onSplitChange?.(next);
  }, [controlledSplit, onSplitChange]);

  const view = useZoomPan(stageRef, size, {
    enabled: zoomable && !!size, zoomable, minZoom, maxZoom, fitPadding, wheelStep,
    refitKey: `${beforeUrl}|${afterUrl}`,
  });
  useEffect(() => { onViewChange?.(view.t); }, [view.t]); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({ fit: view.fit, zoomBy: view.zoomBy, actualSize: view.actualSize, setSplit }),
    [view.fit, view.zoomBy, view.actualSize, setSplit]);

  const b = normalizeSource(before);
  const a = normalizeSource(after);
  const stageProps = zoomable ? view.stageProps : {};
  return (
    <div
      id={id}
      ref={stageRef}
      className={`pp-compare-panel${zoomable ? '' : ' pp-compare-panel--fixed'}${view.panning ? ' pp-compare-panel--panning' : ''} ${className}`.trim()}
      style={style}
      {...stageProps}
    >
      {size ? (
        <>
          <div className="pp-compare-panel__canvas" style={{ width: `${size.w}px`, height: `${size.h}px`, transform: view.transform }}>
            {beforeUrl && <img className="pp-compare-panel__layer" alt={b?.alt ?? ''} src={beforeUrl} draggable={false} />}
            {afterUrl && <img className="pp-compare-panel__layer" alt={a?.alt ?? ''} src={afterUrl} draggable={false} style={{ clipPath: afterClip(split) }} />}
          </div>
          <CompareHandle
            {...handle}
            split={split}
            onSplit={setSplit}
            t={view.t}
            size={size}
            stage={view.stageBox}
            stageRef={stageRef}
            labels={labels}
          />
        </>
      ) : (
        // No size given or stated: learn it from the "before" image.
        beforeUrl && <img hidden alt="" src={beforeUrl} onLoad={(e) => onNaturalSize(e.currentTarget)} />
      )}
    </div>
  );
});
