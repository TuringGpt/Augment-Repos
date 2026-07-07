import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Mock window.matchMedia (required for next-themes and other libraries)
// Guard against non-DOM environments
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// Mock IntersectionObserver (required for some UI components)
// This mock automatically triggers callbacks to prevent components from hanging
// Guard against non-DOM environments
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null
    readonly rootMargin: string = '0px'
    readonly thresholds: ReadonlyArray<number> = [0]
    private callback: IntersectionObserverCallback
    private elements: Set<Element> = new Set()

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
    }

    observe(target: Element) {
      this.elements.add(target)
      // Trigger callback asynchronously to mimic real browser behavior
      // This simulates the element being visible in the viewport
      const entries: IntersectionObserverEntry[] = [{
        boundingClientRect: target.getBoundingClientRect(),
        intersectionRatio: 1,
        intersectionRect: target.getBoundingClientRect(),
        isIntersecting: true,
        rootBounds: null,
        target,
        time: Date.now(),
      } as IntersectionObserverEntry]

      // Schedule callback as a microtask to match real IntersectionObserver behavior
      queueMicrotask(() => {
        this.callback(entries, this)
      })
    }

    unobserve(target: Element) {
      this.elements.delete(target)
    }

    disconnect() {
      this.elements.clear()
    }

    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  } as any
}

// Mock PointerEvent for Radix UI components (like Select)
// jsdom doesn't support PointerEvent, which is required by Radix UI
if (typeof window !== 'undefined') {
  if (typeof window.PointerEvent === 'undefined') {
    class MockPointerEvent extends Event {
      button: number
      ctrlKey: boolean
      pointerType: string

      constructor(type: string, props: PointerEventInit = {}) {
        super(type, props)
        this.button = props.button || 0
        this.ctrlKey = props.ctrlKey || false
        this.pointerType = props.pointerType || 'mouse'
      }
    }

    window.PointerEvent = MockPointerEvent as typeof PointerEvent
  }

  if (typeof window.HTMLElement.prototype.scrollIntoView !== 'function') {
    window.HTMLElement.prototype.scrollIntoView = vi.fn((_arg?: boolean | ScrollIntoViewOptions) => {})
  }

  if (typeof window.HTMLElement.prototype.hasPointerCapture !== 'function') {
    window.HTMLElement.prototype.hasPointerCapture = vi.fn((_pointerId: number) => false)
  }

  if (typeof window.HTMLElement.prototype.releasePointerCapture !== 'function') {
    window.HTMLElement.prototype.releasePointerCapture = vi.fn((_pointerId: number) => {})
  }

  if (typeof window.HTMLElement.prototype.setPointerCapture !== 'function') {
    window.HTMLElement.prototype.setPointerCapture = vi.fn((_pointerId: number) => {})
  }
}

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  // Clear localStorage to prevent theme persistence across tests
  // Guard against non-DOM environments
  if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
    localStorage.clear()
  }
})
