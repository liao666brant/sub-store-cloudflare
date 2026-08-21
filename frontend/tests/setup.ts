import { afterEach, vi } from "vitest";

type MediaQueryListener = (event: MediaQueryListEvent) => void;

const listeners = new Set<MediaQueryListener>();

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: MediaQueryListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MediaQueryListener) => listeners.delete(listener),
    addListener: (listener: MediaQueryListener) => listeners.add(listener),
    removeListener: (listener: MediaQueryListener) => listeners.delete(listener),
    dispatchEvent: (event: Event) => {
      listeners.forEach(listener => listener(event as MediaQueryListEvent));
      return true;
    },
  })),
});

Object.defineProperty(window, "scrollTo", { value: vi.fn() });

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "<div id=\"app\"></div>";
  document.documentElement.removeAttribute("style");
  localStorage.clear();
  listeners.clear();
});
