/**
 * Build output folder for GitHub Pages: dist/* + landing/showcase (see pages-site/).
 */
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, cpSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const distDir = join(root, 'dist')
const outDir = join(root, '_site')

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
cpSync(distDir, outDir, { recursive: true })

const style = readFileSync(join(root, 'demo/style.css'), 'utf8')
const extra = readFileSync(join(root, 'pages-site/pages-extra.css'), 'utf8')
writeFileSync(join(outDir, 'showcase.css'), `${style}\n${extra}`)

copyFileSync(join(root, 'pages-site/index.html'), join(outDir, 'index.html'))
copyFileSync(join(root, 'pages-site/showcase.js'), join(outDir, 'showcase.js'))

console.log(`Assembled GitHub Pages site at ${outDir}`)
