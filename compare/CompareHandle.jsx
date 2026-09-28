import { dividerLayout } from './compareLogic.js';
import { COMPARE_DEFAULTS, defaultAriaLabel, defaultValueText } from './options.js';
import { useCompareSlider } from './useCompareSlider.js';
import './compare.css';

/**
 * The compare node: a divider across the content with a round grip in the
 * middle and a label on each side, the way image-comparison sliders work
 * (react-compare-slider, img-comparison-slider).
 *
 * Render it inside the stage (a positioned element), next to - not inside -
 * the zoomed content, so the grip keeps its size at any zoom. It sits at the
 * vertical middle of the part of the content that is on screen, however the
 * view is panned; when zooming takes the divider off to one side, the grip
 * waits at that edge, pointing towards it, and dragging it brings the divider
 * back. Only the line and grip drag; the grip is a keyboard slider
 * (role="slider"): arrows 1 % (Shift 10 %), Page Up/Down 10 %, Home/End.
 *
 * Props: split (0-100), onSplit(next), t (view transform), size (content
 * { w, h }), stage (stage { w, h }), stageRef; optional labels
 * { before, after }, ariaLabel, valueText(split, labels), edge, labelGap,
 * step, bigStep, showLabels, icons { left, right } (class names).
 */
export function CompareHandle({
  split,
  onSplit,
  t,
  size,
  stage,
  stageRef,
  labels = COMPARE_DEFAULTS.labels,
  ariaLabel,
  valueText = defaultValueText,
  edge = COMPARE_DEFAULTS.edge,
  labelGap = COMPARE_DEFAULTS.labelGap,
  step = COMPARE_DEFAULTS.step,
  bigStep = COMPARE_DEFAULTS.bigStep,
  showLabels = true,
  icons = { left: 'fa-solid fa-chevron-left', right: 'fa-solid fa-chevron-right' },
}) {
  const { stripProps, gripProps } = useCompareSlider({ split, onSplit, t, size, stageRef, step, bigStep });
  const d = dividerLayout({ split, t, size, stage, edge, labelGap });
  if (!d) return null; // the content is not on screen at all
  const labelTop = d.top + 12;
  return (
    <>
      {showLabels && (
        <>
          <span className={`pp-compare__label${d.hideBefore ? ' pp-compare__label--hidden' : ''}`} style={{ left: d.left + 12, top: labelTop }}>{labels.before}</span>
          <span className={`pp-compare__label pp-compare__label--end${d.hideAfter ? ' pp-compare__label--hidden' : ''}`} style={{ left: d.right - 12, top: labelTop }}>{labels.after}</span>
        </>
      )}
      <div
        className={`pp-compare${d.off ? ` pp-compare--off pp-compare--off-${d.off}` : ''}`}
        style={{ left: d.gripX, top: d.top, height: d.height }}
        {...stripProps}
      >
        <div className="pp-compare__line" />
        <div
          className="pp-compare__grip"
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel ?? defaultAriaLabel(labels)}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={split}
          aria-valuetext={valueText(split, labels)}
          title={d.off ? `The divider is off to the ${d.off} - drag to bring it here` : 'Drag, or use the arrow keys'}
          style={{ top: d.height / 2 }}
          {...gripProps}
        >
          {d.off !== 'right' && <i className={icons.left} />}
          {d.off !== 'left' && <i className={icons.right} />}
        </div>
      </div>
    </>
  );
}
