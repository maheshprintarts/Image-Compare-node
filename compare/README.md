# Compare panel and compare node

A before/after slider for images and SVGs: two pictures on top of each other,
with a divider you drag to show more of one or the other. It is the Compare
view of the Vectorize app (view 5), packaged so any page can use it.

```
 ┌───────────────────────────────────────┐
 │ [Original]              [Filled SVG]  │   labels
 │                  │                    │
 │   before         │         after      │
 │   (image A)     (‹›)      (image B)   │   the grip, on the divider
 │                  │                    │
 └───────────────────────────────────────┘
        drag the grip ← →  ·  wheel zooms  ·  drag the picture pans
```

Everything is in this folder: `api-env/web/src/components/compare/`.

---

## 1. What is the compare node?

The **compare node** is the divider with its round grip and the two labels.
In code it is the `CompareHandle` component. It does one job: it shows where
the split is and lets the user move it. It does not draw the pictures.

**What makes it special** (compared with a plain range slider):

| | |
|---|---|
| **Sits on the picture** | The divider is drawn over the image at the split, not in a toolbar. |
| **Same size at every zoom** | It is drawn beside the zoomed picture, not inside it. At 5 % or 4000 % the grip is still 40 px and the line 2 px. |
| **Always within reach** | The grip stays at the vertical middle of the part of the picture you can see, however far you zoom or pan. |
| **Never lost** | If zooming pushes the divider off screen, the grip waits at that edge in the accent colour, with an arrow pointing to it. Drag it and the divider comes back under your pointer. |
| **Only the grip drags the split** | Dragging anywhere else on the picture pans it. The two never fight. |
| **Keyboard and screen readers** | The grip is a real slider (`role="slider"`). It can be focused with Tab and moved with the keys (see below). Screen readers announce "50% original, 50% filled SVG". |
| **Labels step aside** | A label fades out when the divider comes close to it, so it never covers the divider. |
| **Readable on any picture** | White line and grip with a dark edge: visible on black ink and on white paper. |
| **Safe with SVG** | SVG text is shown through an `<img>`, so scripts inside an SVG never run. |

Keyboard, once the grip has focus:

| key | moves the split |
|---|---|
| ← → ↑ ↓ | 1 % |
| Shift + arrow, Page Up / Page Down | 10 % |
| Home / End | to 0 % / to 100 % |

---

## 2. How the node connects

Think of it as a node with inputs and outputs:

```
            INPUTS                          OUTPUTS
  split ────────────────┐            ┌──────────────── onSplit(newSplit)
  t      (zoom, x, y) ──┤            │                 (user dragged or
  size   (w, h)       ──┤  Compare   │                  pressed a key)
  stage  (w, h)       ──┤   node     │
  stageRef            ──┤            │
  labels (optional)   ──┘            └─
```

- **`split`**: where the divider is, 0 to 100 (% of the picture's width).
  The node never changes this by itself. It calls **`onSplit`**, and you store
  the new value. This is the only output.
- **`t`, `size`, `stage`, `stageRef`**: where the picture is on screen. You do
  not compute these by hand; `useZoomPan` gives them to you (section 3.2).

The pictures themselves are not node inputs. They are two `<img>` layers you
draw, and the "after" layer is cut at the split with `afterClip(split)`.
`ComparePanel` (section 3.1) does all of this wiring for you.

---

## 3. Three ways to use it

| You want… | Use | Demo file |
|---|---|---|
| a compare view on a page, quickly | `ComparePanel` | `demo/SimpleCompareDemo.jsx` |
| the node on a stage you already have (your own layers, toolbar, zoom) | `CompareHandle` + `useZoomPan` | `demo/CompareNodeDemo.jsx` |
| to compare an image with its trace from the Vectorize service | `ComparePanel` + `traceOnServer` | `demo/TraceAndCompareDemo.jsx` |

All three demos are tested and working. They live in `demo/`.

### 3.1 The simple way: `ComparePanel`

Two pictures in, a finished compare view out: node, zoom, pan, fit and resize
included.

```jsx
import { ComparePanel } from '@/components/compare';

export function SimpleCompareDemo({ beforeUrl, afterUrl }) {
  return (
    <div style={{ height: 500 }}>          {/* the panel fills its parent: give it a height */}
      <ComparePanel
        before={beforeUrl}
        after={afterUrl}
        labels={{ before: 'Before', after: 'After' }}
      />
    </div>
  );
}
```

`before` and `after` can each be:

- a URL: `'/scan.png'`, `'/drawing.svg'`, a `blob:` URL or a `data:` URL
- `{ src: url, alt: 'text' }`
- `{ svg: '<svg …>…</svg>', alt: 'text' }` for SVG text you already have

To know or set the split from the page, control it:

```jsx
const [split, setSplit] = useState(50);
<ComparePanel before={a} after={b} split={split} onSplitChange={setSplit} />
```

To add your own zoom buttons, use a ref:

```jsx
const panel = useRef(null);
<button onClick={() => panel.current.zoomBy(1.25)}>+</button>
<button onClick={() => panel.current.fit()}>Fit</button>
<ComparePanel ref={panel} before={a} after={b} />
```

### 3.2 Connecting the node to your own stage

Use this when the page already draws its own layers, as the Vectorize viewer
does with its five views. There are three parts: the stage, the content, and
the node.

```jsx
import { useRef, useState } from 'react';
import { afterClip, CompareHandle, useZoomPan } from '@/components/compare';

export function CompareNodeDemo({ beforeUrl, afterUrl, width, height }) {
  const stageRef = useRef(null);
  const size = { w: width, h: height };                         // the pictures' size, CSS px
  const [split, setSplit] = useState(50);                       // the node's value, 0-100
  const { t, stageBox, stageProps, transform, fit } = useZoomPan(stageRef, size);

  return (
    <div>
      <p>
        Split: {split}% <button type="button" onClick={() => setSplit(50)}>Centre</button>{' '}
        <button type="button" onClick={fit}>Fit</button>
      </p>
      {/* 1. the stage: positioned, clips, receives zoom and pan */}
      <div ref={stageRef} {...stageProps} style={{ position: 'relative', overflow: 'hidden', height: 500, background: '#eee', touchAction: 'none' }}>
        {/* 2. the content: both pictures, same size, one transform */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: size.w, height: size.h, transform, transformOrigin: '0 0' }}>
          <img src={beforeUrl} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          <img src={afterUrl} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', clipPath: afterClip(split) }} />
        </div>
        {/* 3. the node: beside the content, not inside it, so it keeps its size at any zoom */}
        <CompareHandle
          split={split}
          onSplit={setSplit}
          t={t}
          size={size}
          stage={stageBox}
          stageRef={stageRef}
          labels={{ before: 'Scan', after: 'Vector' }}
        />
      </div>
    </div>
  );
}
```

The rules that make it work:

1. The **stage** needs `position: relative` and `overflow: hidden`, and it
   gets `ref={stageRef}` and `{...stageProps}` (pan, double-click fit).
2. The **content** box is `size.w × size.h`, with `transform` from
   `useZoomPan` and `transformOrigin: '0 0'`. Both pictures fill it.
3. The **node** goes inside the stage, next to the content box, never inside
   it.
4. The "after" picture gets `clipPath: afterClip(split)`.

### 3.3 With the Vectorize service: trace, then compare

Pick an image, trace it on the server, and compare the original with the
filled SVG. This uses the app's own `traceOnServer`.

```jsx
import { useEffect, useState } from 'react';
import { ComparePanel } from '@/components/compare';
import { traceOnServer } from '@/lib/api.js';
import { toParams } from '@/lib/settings.js';

export function TraceAndCompareDemo() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [svg, setSvg] = useState(null);
  const [status, setStatus] = useState('Pick a PNG or JPEG');

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setSvg(null);
    setStatus('Tracing…');
    let live = true;
    traceOnServer({ file, name: file.name }, toParams('accurate', false), {
      onProgress: (p) => live && setStatus(`Tracing… ${Math.round(p * 100)}%`),
      register: () => {},
    })
      .then((result) => { if (live) { setSvg(result.filled || result.outline); setStatus('Done'); } })
      .catch((e) => live && setStatus(`Failed: ${e.message}`));
    return () => { live = false; URL.revokeObjectURL(url); };
  }, [file]);

  return (
    <div>
      <input type="file" accept="image/png,image/jpeg" onChange={(e) => setFile(e.target.files[0] ?? null)} />
      <span> {status}</span>
      {imageUrl && svg && (
        <div style={{ height: 600, marginTop: 8 }}>
          <ComparePanel
            before={{ src: imageUrl, alt: 'Original image' }}
            after={{ svg, alt: 'Filled SVG' }}
            labels={{ before: 'Original', after: 'Filled SVG' }}
          />
        </div>
      )}
    </div>
  );
}
```

The panel takes its size from the SVG, so a 750 × 1000 px image at 72 DPI is
shown at its real 10.417" × 13.889" size. The original image is stretched to
the same box, so both line up exactly.

This demo must run on a page the service serves (port 5656), or on the Vite
dev server (`npm run dev:web`), which forwards `/api` to the service.

---

## 4. Setting it up on a new page

1. Import from `@/components/compare`. The `@` alias (to `web/src`) is already
   set in `vite.config.js`.
2. Load Font Awesome (solid) for the grip's arrows. The app already does this
   in `main.jsx`:
   ```js
   import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
   import '@fortawesome/fontawesome-free/css/solid.min.css';
   ```
   Or pass your own icon classes: `handle={{ icons: { left: 'my-left', right: 'my-right' } }}`.
3. Give the panel's parent a height.

The styles (`compare.css`) come in by themselves with the components. The
colours follow the page's `--pp-*` theme when it has one (accent colour, dark
mode). On other pages they use the light theme.

---

## 5. Reference

### `<ComparePanel>`

| prop | type | default | what it does |
|---|---|---|---|
| `before` | source | required | left of the divider |
| `after` | source | required | right of the divider |
| `labels` | `{ before, after }` | `Before` / `After` | the corner labels; also used in the screen-reader text |
| `width`, `height` | number, CSS px | from the pictures | the size both pictures are drawn at |
| `defaultSplit` | 0-100 | `50` | the starting split when the panel keeps the split itself |
| `split` | 0-100 | none | makes the split controlled by the page; use it with `onSplitChange` |
| `onSplitChange` | `(split) => void` | none | called on every drag step and key press |
| `zoomable` | boolean | `true` | wheel zoom, drag to pan, double-click to fit; `false` keeps the picture fitted |
| `minZoom`, `maxZoom` | number | `0.005`, `40` | zoom limits, in screen px per picture px |
| `fitPadding` | number | `32` | space around the picture when fitted |
| `wheelStep` | number | `1.15` | zoom per wheel notch |
| `onViewChange` | `({ zoom, x, y }) => void` | none | called after every zoom, pan or fit |
| `handle` | object | none | extra `CompareHandle` props (see below) |
| `id`, `className`, `style` | | none | put on the panel element |

**Ref methods:** `fit()`, `zoomBy(factor, x?, y?)`, `actualSize()` (one
picture pixel to one screen pixel), and `setSplit(value)`.

**Size**, when `width`/`height` are not given, comes from the first of these
that applies:

1. The size SVG text states for itself. For example, `width="10.416667in"`
   gives 1000 CSS px.
2. The natural size of the "before" image.

### `<CompareHandle>` (the node)

| prop | type | default | what it does |
|---|---|---|---|
| `split` | 0-100 | required | input: where the divider is |
| `onSplit` | `(split) => void` | required | output: the user moved it |
| `t` | `{ zoom, x, y }` | required | from `useZoomPan` |
| `size` | `{ w, h }` | required | the pictures' size |
| `stage` | `{ w, h }` | required | `stageBox` from `useZoomPan` |
| `stageRef` | ref | required | the stage element |
| `labels` | `{ before, after }` | `Before` / `After` | label text |
| `showLabels` | boolean | `true` | hide both labels with `false` |
| `step`, `bigStep` | number | `1`, `10` | keyboard steps, in % |
| `edge` | number | `24` | how far inside the edge the grip waits when the divider is off screen |
| `labelGap` | `{ before, after }` | `110`, `120` | a label hides when the divider is this close |
| `icons` | `{ left, right }` | Font Awesome chevrons | icon class names for the grip |
| `ariaLabel` | string | "Compare: before and after" | the slider's name for screen readers |
| `valueText` | `(split, labels) => string` | "50% before, 50% after" | what screen readers read as the value |

### `useZoomPan(stageRef, size, options)`

This hook provides zoom, pan, fit and resize for any stage.

**Options:**

| option | what it does |
|---|---|
| `enabled` | whether dragging pans |
| `zoomable` | whether the wheel zooms |
| `minZoom`, `maxZoom` | zoom limits |
| `fitPadding` | space around the picture when fitted |
| `wheelStep` | zoom per wheel notch |
| `refitKey` | fit again when this value changes, unless the user has zoomed by hand |

**Returns:**

| value | what it is |
|---|---|
| `t` | the view: `{ zoom, x, y }` |
| `stageBox` | the stage's size: `{ w, h }` |
| `fit`, `zoomBy`, `actualSize` | view functions |
| `panning` | `true` while the user is dragging the picture |
| `stageProps` | spread these on the stage |
| `transform` | the CSS transform for the content box |

The picture fits itself when it first appears and whenever the stage is
resized, until the user zooms or pans by hand. `fit()` makes it follow again.

### Pure helpers

These functions have no React and no DOM, so they are easy to test or reuse:

| function | what it gives you |
|---|---|
| `afterClip(split)` | the clip-path for the "after" layer |
| `splitAtStageX(x, t, size)` | the split under a point on the stage |
| `splitForKey(key, shift, from)` | the split after a key press |
| `dividerLayout({ split, t, size, stage })` | where the line, grip and labels go |
| `fitTransform(stage, size)` | the view that fits the picture |
| `zoomTransform(t, factor, x, y)` | the view after zooming about a point |
| `COMPARE_DEFAULTS` | all default values |

---

## 6. Troubleshooting

| Problem | Cause and fix |
|---|---|
| Nothing shows | The panel's parent has no height. Give it one, e.g. `style={{ height: 500 }}`. |
| Grip is an empty circle | Font Awesome is not loaded (see section 4), or pass `handle.icons`. |
| Pictures do not line up | They are drawn at one shared size. Pass `width`/`height`, or give SVG text with its own size. |
| The node grows when zooming | It was put inside the zoomed content box. It must be beside it, in the stage. |
| Dragging the grip pans the picture | `{...stageProps}` is on the content box instead of the stage. |
| The split does not move (controlled) | `onSplitChange` must store the value that is passed back in as `split`. |

---

## 7. Files

| file | part |
|---|---|
| `ComparePanel.jsx` | the complete panel |
| `CompareHandle.jsx` | the compare node: divider, grip and labels (drawing only) |
| `useCompareSlider.js` | the node's interaction: pointer drag and keyboard |
| `useZoomPan.js` | zoom, pan, fit and resize handling |
| `compareLogic.js` | comparison maths: split, keys, divider layout, clip |
| `viewTransform.js` | fit and zoom maths |
| `compareSources.js` | image and SVG inputs |
| `options.js` | defaults |
| `compare.css` | styles |
| `index.js` | what `@/components/compare` exports |
| `demo/` | the three demos above |

The Vectorize viewer (`components/Viewer.jsx`) uses `CompareHandle`,
`useZoomPan` and `afterClip`, as in section 3.2.
