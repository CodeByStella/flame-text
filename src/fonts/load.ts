import opentype from 'opentype.js'

export async function loadFontFromUrl(url: string): Promise<opentype.Font> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`)
  const buf = await res.arrayBuffer()
  return opentype.parse(buf)
}
