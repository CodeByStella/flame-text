import type opentype from 'opentype.js'

export interface MaskResult {
  /** Column index -> top Y in CSS pixels (relative to canvas top), or -1 if empty */
  topEdge: Int16Array
  /** Column index -> bottom Y in CSS pixels, or -1 if empty */
  bottomEdge: Int16Array
  /** Row index -> left X in CSS px, or -1 */
  leftEdge: Int16Array
  /** Row index -> right X in CSS px, or -1 */
  rightEdge: Int16Array
  /** 1 = glyph pixel on device raster (row-major, length rasterW * rasterH) */
  inside: Uint8Array
  rasterW: number
  rasterH: number
  widthCss: number
  heightCss: number
  dpr: number
}

/**
 * Rasterize text to alpha mask and compute top/bottom per column + left/right per row (CSS space).
 */
export function buildMaskFromCanvasText(options: {
  text: string
  widthCss: number
  heightCss: number
  dpr: number
  font: string
  textAlign: CanvasTextAlign
  direction?: CanvasDirection
}): MaskResult {
  const { text, widthCss, heightCss, dpr, font, textAlign, direction = 'ltr' } = options
  const w = Math.max(1, Math.ceil(widthCss * dpr))
  const h = Math.max(1, Math.ceil(heightCss * dpr))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, widthCss, heightCss)
  ctx.font = font
  ctx.textAlign = textAlign
  ctx.direction = direction
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#fff'
  const { x, y } = canvasTextPosition(ctx, text, widthCss, heightCss)
  ctx.fillText(text, x, y)

  const img = ctx.getImageData(0, 0, w, h)
  const edges = scanEdges(img, w, h, dpr)

  return { ...edges, widthCss, heightCss, dpr }
}

/**
 * Draw opentype path for full string and build edge masks (same scans as canvas text).
 */
export function buildMaskFromOpenType(options: {
  font: opentype.Font
  text: string
  widthCss: number
  heightCss: number
  dpr: number
  fontSizePx: number
  textAlign: CanvasTextAlign
  /** Same `font` shorthand as DOM / `fillText` so `measureText` matches rendered text. */
  fontCss: string
  direction?: CanvasDirection
}): MaskResult {
  const {
    font: otFont,
    text,
    widthCss,
    heightCss,
    dpr,
    fontSizePx,
    textAlign,
    fontCss,
    direction = 'ltr',
  } = options
  const w = Math.max(1, Math.ceil(widthCss * dpr))
  const h = Math.max(1, Math.ceil(heightCss * dpr))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, widthCss, heightCss)

  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) throw new Error('2d context unavailable')
  measure.font = fontCss
  measure.textAlign = textAlign
  measure.direction = direction
  measure.textBaseline = 'alphabetic'
  const { x: anchorX, y: baselineY } = canvasTextPosition(measure, text, widthCss, heightCss)

  const probe = otFont.getPath(text, 0, 0, fontSizePx)
  const bbox = probe.getBoundingBox()
  const cx = (bbox.x1 + bbox.x2) / 2
  const align = measure.textAlign
  const dir = measure.direction
  let penX: number
  if (align === 'center') penX = anchorX - cx
  else if (align === 'right' || (align === 'end' && dir === 'ltr')) penX = anchorX - bbox.x2
  else if (align === 'end' && dir === 'rtl') penX = anchorX - bbox.x1
  else if (align === 'left' || (align === 'start' && dir === 'ltr')) penX = anchorX
  else if (align === 'start' && dir === 'rtl') penX = anchorX - bbox.x2
  else penX = anchorX

  const path = otFont.getPath(text, penX, baselineY, fontSizePx)
  path.fill = '#ffffff'
  path.draw(ctx)

  const img = ctx.getImageData(0, 0, w, h)
  const edges = scanEdges(img, w, h, dpr)

  return { ...edges, widthCss, heightCss, dpr }
}

function scanEdges(
  img: ImageData,
  w: number,
  h: number,
  dpr: number
): Pick<MaskResult, 'topEdge' | 'bottomEdge' | 'leftEdge' | 'rightEdge' | 'inside' | 'rasterW' | 'rasterH'> {
  const topEdge = new Int16Array(w)
  const bottomEdge = new Int16Array(w)
  const leftEdge = new Int16Array(h)
  const rightEdge = new Int16Array(h)
  const inside = new Uint8Array(w * h)

  for (let col = 0; col < w; col++) {
    topEdge[col] = -1
    bottomEdge[col] = -1
  }
  for (let row = 0; row < h; row++) {
    leftEdge[row] = -1
    rightEdge[row] = -1
  }

  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const p = row * w + col
      const a = img.data[p * 4 + 3]
      if (a > 20) {
        inside[p] = 1
        if (topEdge[col] < 0) topEdge[col] = row
        bottomEdge[col] = row
        if (leftEdge[row] < 0) leftEdge[row] = col
        rightEdge[row] = col
      }
    }
  }

  for (let col = 0; col < w; col++) {
    const tt = topEdge[col]
    const bb = bottomEdge[col]
    topEdge[col] = tt >= 0 ? tt / dpr : -1
    bottomEdge[col] = bb >= 0 ? bb / dpr : -1
  }
  for (let row = 0; row < h; row++) {
    const ll = leftEdge[row]
    const rr = rightEdge[row]
    leftEdge[row] = ll >= 0 ? ll / dpr : -1
    rightEdge[row] = rr >= 0 ? rr / dpr : -1
  }

  return { topEdge, bottomEdge, leftEdge, rightEdge, inside, rasterW: w, rasterH: h }
}

/**
 * Match `fillText` anchor X/Y for the current `ctx.textAlign` / `ctx.direction`, and vertically
 * center ink using `measureText` ascent/descent (same baseline as canvas, not OpenType bbox center).
 */
function canvasTextPosition(
  ctx: CanvasRenderingContext2D,
  text: string,
  widthCss: number,
  heightCss: number
): { x: number; y: number } {
  const m = ctx.measureText(text)
  const ascent =
    m.actualBoundingBoxAscent > 0
      ? m.actualBoundingBoxAscent
      : (m as TextMetrics & { fontBoundingBoxAscent?: number }).fontBoundingBoxAscent ??
        heightCss * 0.72
  const descent =
    m.actualBoundingBoxDescent > 0
      ? m.actualBoundingBoxDescent
      : (m as TextMetrics & { fontBoundingBoxDescent?: number }).fontBoundingBoxDescent ??
        heightCss * 0.22
  const align = ctx.textAlign
  const dir = ctx.direction
  let x: number
  if (align === 'center') x = widthCss / 2
  else if (align === 'right' || (align === 'end' && dir === 'ltr')) x = widthCss
  else if (align === 'left' || (align === 'start' && dir === 'ltr')) x = 0
  else if (align === 'end' && dir === 'rtl') x = 0
  else if (align === 'start' && dir === 'rtl') x = widthCss
  else x = 0
  const y = heightCss / 2 + (ascent - descent) / 2
  return { x, y }
}
