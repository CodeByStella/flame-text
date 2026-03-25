/** Normalize for comparison: strip quotes, trim, lowercase */
export function normalizeFontFamily(name: string): string {
  return name
    .split(',')[0]
    .trim()
    .replace(/^["']|["']$/g, '')
    .toLowerCase()
}

/**
 * Try to find a @font-face URL matching the first resolved font family name.
 */
export function resolveFontUrlFromDocument(family: string): string | null {
  const target = normalizeFontFamily(family)
  if (!target || typeof document === 'undefined') return null

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      if (rule.type !== CSSRule.FONT_FACE_RULE) continue
      const ff = rule as CSSFontFaceRule
      const fam = normalizeFontFamily(ff.style.getPropertyValue('font-family') || '')
      if (fam !== target) continue
      const src = ff.style.getPropertyValue('src') || ''
      const url = extractFirstUrl(src)
      if (url) return url
    }
  }
  return null
}

function extractFirstUrl(src: string): string | null {
  const m = src.match(/url\s*\(\s*["']?([^"')]+)["']?\s*\)/i)
  return m?.[1]?.trim() ?? null
}
