import { mount } from '../src/index.js'

const headlineEl = document.querySelector('#headline')
if (!(headlineEl instanceof HTMLElement)) {
  throw new Error('#headline missing')
}
/** Narrowed so nested callbacks (e.g. `remount`) see `HTMLElement`, not `Element | null`. */
const headline: HTMLElement = headlineEl
headline.lang = 'zh'

const tempEl = document.querySelector('#temp') as HTMLInputElement
const intEl = document.querySelector('#int') as HTMLInputElement
const ignEl = document.querySelector('#ign') as HTMLInputElement
const tempOut = document.querySelector('#temp-out') as HTMLOutputElement
const intOut = document.querySelector('#int-out') as HTMLOutputElement
const replayBtn = document.querySelector('#replay') as HTMLButtonElement

function readOpts() {
  return {
    temperature: Number(tempEl.value) / 100,
    intensity: Number(intEl.value) / 100,
    ignition: ignEl.checked ? { durationMs: 2800, easing: 'ease-in-out' as const } : false,
  }
}

function syncOutputs() {
  tempOut.textContent = `${tempEl.value}%`
  intOut.textContent = `${intEl.value}%`
}

let handle = mount(headline, {
  ...readOpts(),
})

function remount() {
  handle.destroy()
  handle = mount(headline, {
    ...readOpts(),
  })
}

syncOutputs()

tempEl.addEventListener('input', () => {
  syncOutputs()
  handle.setTemperature(Number(tempEl.value) / 100)
})

intEl.addEventListener('input', () => {
  syncOutputs()
  handle.setIntensity(Number(intEl.value) / 100)
})

ignEl.addEventListener('change', () => {
  remount()
})

replayBtn.addEventListener('click', () => {
  remount()
})

document.querySelectorAll<HTMLButtonElement>('.preset[data-word]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const word = btn.dataset.word
    if (!word) return
    headline.textContent = word
    headline.lang = /[\u4e00-\u9fff]/.test(word) ? 'zh' : 'en'
    remount()
  })
})
