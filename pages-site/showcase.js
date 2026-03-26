/**
 * Showcase controls for the GitHub Pages site (same behavior as demo/main.ts).
 * Depends on global FlameText from ./flame-text.iife.js
 */
;(function () {
  const FlameText = window.FlameText
  if (!FlameText || typeof FlameText.mount !== 'function') {
    console.error('FlameText global missing; load flame-text.iife.js first.')
    return
  }

  const root = document.querySelector('#headline')
  if (!(root instanceof HTMLElement)) return

  const tempEl = document.querySelector('#temp')
  const intEl = document.querySelector('#int')
  const ignEl = document.querySelector('#ign')
  const tempOut = document.querySelector('#temp-out')
  const intOut = document.querySelector('#int-out')
  const replayBtn = document.querySelector('#replay')

  if (
    !(tempEl instanceof HTMLInputElement) ||
    !(intEl instanceof HTMLInputElement) ||
    !(ignEl instanceof HTMLInputElement) ||
    !(tempOut instanceof HTMLOutputElement) ||
    !(intOut instanceof HTMLOutputElement) ||
    !(replayBtn instanceof HTMLButtonElement)
  ) {
    return
  }

  function readOpts() {
    return {
      temperature: Number(tempEl.value) / 100,
      intensity: Number(intEl.value) / 100,
      ignition: ignEl.checked ? { durationMs: 2800, easing: 'ease-in-out' } : false,
    }
  }

  function syncOutputs() {
    tempOut.textContent = `${tempEl.value}%`
    intOut.textContent = `${intEl.value}%`
  }

  let handle = FlameText.mount(root, {
    ...readOpts(),
  })

  function remount() {
    handle.destroy()
    handle = FlameText.mount(root, {
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

  document.querySelectorAll('.preset[data-word]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const word = btn.dataset.word
      if (!word || !(btn instanceof HTMLButtonElement)) return
      root.textContent = word
      root.lang = /[\u4e00-\u9fff]/.test(word) ? 'zh' : 'en'
      remount()
    })
  })
})()
