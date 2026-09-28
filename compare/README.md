# Compare panel

A before/after compare panel for images and SVGs. It is the same slider the
Vectorize viewer uses in its Compare view. The viewer is built from these
same pieces.

```jsx
import { ComparePanel } from '@/components/compare';

<div style={{ height: 600 }}>
  <ComparePanel before="/scan.png" after={{ svg: svgText }} labels={{ before: 'Original', after: 'Filled SVG' }} />
</div>
```

"Before" is drawn left of the divider and "after" right of it. The two are
drawn on top of each other at the same size. You can drag the grip or use the
keyboard to move the divider. The wheel zooms at the cursor, dragging the
image pans it, and a double-click fits it. The panel refits when its box is
resized. It fills its parent, so the parent (or `style`) sets its height.

Requirements:

- React 18 or later.
- The `@` alias pointing at `web/src`, for `@/lib/svg.js`.
- Font Awesome (solid) loaded on the page for the grip's chevrons, or pass
  your own `handle.icons`.

The styles are in `compare.css`, which the components import themselves. The
colours follow the page's `--pp-*` tokens when it has them. Otherwise they use
the light theme.

## `<ComparePanel>` props

| prop | type | default | |
|---|---|---|---|
| `before` | source | required | shown left of the divider |
| `after` | source | required | shown right of the divider |
| `labels` | `{ before, after }` | `{ before: 'Before', after: 'After' }` | the corner labels; also used for the aria label and value text |
| `width`, `height` | number (CSS px) | from the content | the size both layers are drawn at |
| `defaultSplit` | 0-100 | `50` | starting split when the panel keeps the split itself |
| `split` | 0-100 | none | makes the split **controlled**; use it with `onSplitChange` |
| `onSplitChange` | `(split) => void` | none | called on every drag step and key press |
| `zoomable` | boolean | `true` | wheel zoom, drag to pan, double-click to fit; `false` keeps the content fitted |
| `minZoom`, `maxZoom` | number | `0.005`, `40` | limits, in screen px per content px |
| `fitPadding` | number | `32` | space left around the content when fitted |
| `wheelStep` | number | `1.15` | zoom factor per wheel notch |
| `onViewChange` | `({ zoom, x, y }) => void` | none | the view after every zoom, pan or fit |
| `handle` | object | none | passed to `CompareHandle`: `edge`, `labelGap`, `step`, `bigStep`, `showLabels`, `icons`, `ariaLabel`, `valueText` |
| `id`, `className`, `style` | | none | put on the panel element |

A **source** can take any of these forms:

- a URL string (an image or an SVG file, including `blob:` and `data:` URLs)
- `{ src, alt }`
- `{ svg: '<svg…>', alt }` for SVG text. SVG text is drawn through an `<img>`,
  so any script inside it never runs.

**Size.** If you don't pass `width` and `height`, the size comes from the
first of these that applies:

1. The size the SVG text states for itself. For example, `width="10.416667in"`
   gives 1000 CSS px.
2. The natural size of the "before" image.

**Ref.** Through a ref you can call `fit()`, `zoomBy(factor, x?, y?)`,
`actualSize()` and `setSplit(value)`.

## Keyboard

The grip is a `role="slider"`.

| key | moves the split by |
|---|---|
| ← → ↑ ↓ | 1 % |
| Shift + arrow | 10 % |
| Page Up / Page Down | 10 % |
| Home / End | to 0 % / 100 % |

## Examples

Controlled, with the page's own control:

```jsx
const [split, setSplit] = useState(30);
<input type="range" min="0" max="100" value={split} onChange={(e) => setSplit(Number(e.target.value))} />
<ComparePanel before={scanUrl} after={vectorUrl} split={split} onSplitChange={setSplit} zoomable={false} />
```

With zoom buttons, through the ref:

```jsx
const panel = useRef(null);
<button onClick={() => panel.current.zoomBy(1.25)}>+</button>
<button onClick={() => panel.current.fit()}>Fit</button>
<ComparePanel ref={panel} before={a} after={b} />
```

## The pieces

For a page that already has its own zoomable stage, as the Vectorize viewer
does:

| file | what it does |
|---|---|
| `compareLogic.js` | comparison logic, pure: `splitAtStageX`, `splitForKey`, `dividerLayout`, `afterClip`, `roundSplit` |
| `viewTransform.js` | fit and zoom maths, pure: `fitTransform`, `zoomTransform` |
| `useZoomPan.js` | zoom, pan, fit, wheel and resize handling for a stage element |
| `useCompareSlider.js` | slider interaction: pointer drag and keyboard |
| `CompareHandle.jsx` | the compare node: divider, grip and labels (rendering) |
| `compareSources.js` | image and SVG inputs: `normalizeSource`, `useSourceUrl`, `useContentSize` |
| `options.js` | `COMPARE_DEFAULTS`, and the default aria label and value text |
| `ComparePanel.jsx` | all of the above, put together |
| `compare.css` | styles for the node and the panel |

To use the pieces on your own stage:

```jsx
const { t, stageBox, stageProps, transform } = useZoomPan(stageRef, size);
<div ref={stageRef} className="my-stage" {...stageProps}>
  <div style={{ width: size.w, height: size.h, transform, transformOrigin: '0 0', position: 'absolute' }}>
    <img src={a} /> <img src={b} style={{ clipPath: afterClip(split) }} />
  </div>
  <CompareHandle split={split} onSplit={setSplit} t={t} size={size} stage={stageBox} stageRef={stageRef} />
</div>
```
