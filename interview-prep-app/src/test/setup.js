import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
})

globalThis.ResizeObserver = globalThis.ResizeObserver || class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || vi.fn()

Object.defineProperty(document.documentElement, 'requestFullscreen', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(document, 'fullscreenElement', {
  configurable: true,
  value: document.documentElement,
})
