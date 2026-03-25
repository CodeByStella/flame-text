import type opentype from 'opentype.js'

export interface MaskResult {
  /** Column index -> top Y in CSS pixels (relative to canvas top), or -1 if empty */
  topEdge: Int16Array
  widthCss: number
  heightCss: number
  dpr: number
}

/**
 * Rasterize text to alpha mask and compute topmost opaque pixel per column (CSS space).
 */
export function buildMaskFromCanvasText(options: {
  text: string
  widthCss: number
  heightCss: number
  dpr: number
  font: string
  textAlign: CanvasTextAlign
}): MaskResult {
  const { text, widthCss, heightCss, dpr, font, textAlign } = options
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
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#fff'
  const x =
    textAlign === 'center'
      ? widthCss / 2
      : textAlign === 'right'
        ? widthCss
        : 0
  const y = heightCss * 0.78
  ctx.fillText(text, x, y)

  const img = ctx.getImageData(0, 0, w, h)
  const topEdge = new Int16Array(w)
  for (let col = 0; col < w; col++) {
    let best = -1
    for (let row = 0; row < h; row++) {
      const i = (row * w + col) * 4 + 3
      if (img.data[i] > 20) {
        best = row
        break
      }
    }
    topEdge[col] = best >= 0 ? best / dpr : -1
  }

  return { topEdge, widthCss, heightCss, dpr }
}

/**
 * Draw opentype path for full string and build top-edge mask (same column scan).
 */
export function buildMaskFromOpenType(options: {
  font: opentype.Font
  text: string
  widthCss: number
  heightCss: number
  dpr: number
  fontSizePx: number
  textAlign: CanvasTextAlign
}): MaskResult {
  const { font: otFont, text, widthCss, heightCss, dpr, fontSizePx, textAlign } = options
  const w = Math.max(1, Math.ceil(widthCss * dpr))
  const h = Math.max(1, Math.ceil(heightCss * dpr))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, widthCss, heightCss)

  const wText = otFont.getAdvanceWidth(text, fontSizePx)
  let x0 = 0
  if (textAlign === 'center') x0 = (widthCss - wText) / 2
  else if (textAlign === 'right') x0 = widthCss - wText

  const baselineY = heightCss * 0.78
  const path = otFont.getPath(text, x0, baselineY, fontSizePx)
  path.fill = '#ffffff'
  path.draw(ctx)

  const img = ctx.getImageData(0, 0, w, h)
  const topEdge = new Int16Array(w)
  for (let col = 0; col < w; col++) {
    let best = -1
    for (let row = 0; row < h; row++) {
      const i = (row * w + col) * 4 + 3
      if (img.data[i] > 20) {
        best = row
        break
      }
    }
    topEdge[col] = best >= 0 ? best / dpr : -1
  }

  return { topEdge, widthCss, heightCss, dpr }
}
