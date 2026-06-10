/* Runtime capability check for the SVG edge-refraction filter.
   feDisplacementMap inside backdrop-filter only composites correctly
   in Blink/Chromium. Firefox & Safari report support for url() backdrop
   filters but mis-render (or ignore) the displacement, so we UA-guard.
   Detected once at module load and frozen into a constant. */
function detectRefractionSupport(): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return false;
  }
  const supportsUrlBackdrop =
    CSS.supports('backdrop-filter', 'url(#x)') ||
    CSS.supports('-webkit-backdrop-filter', 'url(#x)');
  if (!supportsUrlBackdrop) return false;

  const ua = navigator.userAgent;
  const isChromium = /Chrome|Chromium|Edg\//.test(ua) && !/Firefox/.test(ua);
  return isChromium;
}

export const SUPPORTS_REFRACTION: boolean = detectRefractionSupport();
