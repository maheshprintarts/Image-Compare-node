// Image/SVG inputs. A compare source is any of:
//   'https://.../a.png' | 'blob:...' | 'data:...'   a URL (image or SVG file)
//   { src: url, alt? }                               the same, with alt text
//   { svg: '<svg ...>...</svg>', alt? }              SVG text, shown as an image
// SVG text is drawn through an <img> (a blob URL), so any script in it never runs.

import { useEffect, useMemo, useState } from 'react';
import { svgGeometry, svgUrl } from '@/lib/svg.js';

/** { src?, svg?, alt } from any accepted form; null for nothing. */
export function normalizeSource(source) {
  if (source == null || source === '') return null;
  if (typeof source === 'string') return { src: source, alt: '' };
  if (typeof source === 'object' && (source.src || source.svg)) return { src: source.src, svg: source.svg, alt: source.alt ?? '' };
  throw new TypeError('a compare source is a URL string, { src } or { svg }');
}

/** A URL an <img> can show for the source; blob URLs for SVG text are revoked when no longer used. */
export function useSourceUrl(source) {
  const s = normalizeSource(source);
  const svg = s?.svg;
  // Made in an effect, not a memo: a remount (React's StrictMode does one)
  // must not keep showing a URL its cleanup already revoked.
  const [blob, setBlob] = useState(null);
  useEffect(() => {
    if (!svg) { setBlob(null); return undefined; }
    const url = svgUrl(svg);
    setBlob(url);
    return () => URL.revokeObjectURL(url);
  }, [svg]);
  return svg ? blob : s?.src ?? null;
}

/** The size SVG text states for itself ({ w, h } CSS px), or null. */
export function statedSize(source) {
  const svg = normalizeSource(source)?.svg;
  const g = svg ? svgGeometry(svg) : null;
  return g ? { w: g.width, h: g.height } : null;
}

/**
 * The content size both layers are drawn at, in CSS pixels. In order:
 * explicit `width`/`height`; the size SVG text states for itself ("before",
 * then "after"); the natural size of the "before" image once it has loaded
 * (report it with `onNaturalSize`).
 */
export function useContentSize(before, after, width, height) {
  const [natural, setNatural] = useState(null);
  const beforeSvg = normalizeSource(before)?.svg;
  const afterSvg = normalizeSource(after)?.svg;
  const stated = useMemo(() => statedSize(before) ?? statedSize(after), [beforeSvg, afterSvg]); // eslint-disable-line react-hooks/exhaustive-deps
  const size = width > 0 && height > 0 ? { w: width, h: height } : stated ?? natural;
  const onNaturalSize = (img) => {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  };
  return { size, onNaturalSize };
}
