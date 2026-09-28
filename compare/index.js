// The reusable before/after compare module.
//
//   import { ComparePanel } from '@/components/compare';
//
// ComparePanel is the whole thing. The pieces it is built from are exported
// too, for a page that already has its own zoomable stage (the Vectorize
// viewer uses them that way).

export { ComparePanel } from './ComparePanel.jsx';
export { CompareHandle } from './CompareHandle.jsx';
export { useCompareSlider } from './useCompareSlider.js';
export { useZoomPan } from './useZoomPan.js';
export { normalizeSource, useSourceUrl, useContentSize, statedSize } from './compareSources.js';
export { afterClip, clamp, dividerLayout, roundSplit, splitAtStageX, splitForKey } from './compareLogic.js';
export { fitTransform, zoomTransform } from './viewTransform.js';
export { COMPARE_DEFAULTS, defaultAriaLabel, defaultValueText } from './options.js';
