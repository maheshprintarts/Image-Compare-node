// The view transform { zoom, x, y }: content pixel p is drawn at stage pixel
// t.x + p * t.zoom. Pure functions, shared by every zoomable stage.

/** Fit the content inside the stage with `pad` pixels to spare, centred. */
export function fitTransform(stage, size, { pad = 32, minZoom = 0.005 } = {}) {
  const zoom = Math.max(minZoom, Math.min((stage.w - pad) / size.w, (stage.h - pad) / size.h));
  return { zoom, x: (stage.w - size.w * zoom) / 2, y: (stage.h - size.h * zoom) / 2 };
}

/** Zoom by `factor`, keeping the stage point (x0, y0) where it is. */
export function zoomTransform(t, factor, x0, y0, { minZoom = 0.005, maxZoom = 40 } = {}) {
  const zoom = Math.min(maxZoom, Math.max(minZoom, t.zoom * factor));
  return { zoom, x: x0 - (x0 - t.x) * (zoom / t.zoom), y: y0 - (y0 - t.y) * (zoom / t.zoom) };
}
