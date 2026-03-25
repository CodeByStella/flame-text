import { mount } from '../src/index.ts'

const headline = document.querySelector('#headline')
if (!headline || !(headline instanceof HTMLElement)) {
  throw new Error('#headline missing')
}

const tempEl = document.querySelector('#temp') as HTMLInputElement
const intEl = document.querySelector('#int') as HTMLInputElement
const ignEl = document.querySelector('#ign') as HTMLInputElement

function readOpts() {
  return {
    temperature: Number(tempEl.value) / 100,
    intensity: Number(intEl.value) / 100,
    ignition: ignEl.checked ? { durationMs: 2800, easing: 'ease-in-out' as const } : false,
  }
}

let handle = mount(headline, {
  ...readOpts(),
  particleCount: 380,
})

function remount() {
  handle.destroy()
  handle = mount(headline, {
    ...readOpts(),
    particleCount: 380,
  })
}

tempEl.addEventListener('input', () => {
  handle.setTemperature(Number(tempEl.value) / 100)
})

intEl.addEventListener('input', () => {
  handle.setIntensity(Number(intEl.value) / 100)
})

ignEl.addEventListener('change', () => {
  remount()
})
