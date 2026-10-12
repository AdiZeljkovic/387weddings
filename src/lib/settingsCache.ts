// Module-level singleton — avoids multiple /api/settings fetches per page visit.
// loadSettings() is idempotent: concurrent calls share the same promise.

type SettingsMap = Record<string, string>;

// The server writes the public settings into the page (window.__BOOT__), so
// the first render already has them — no request, no stand-in photographs
const boot = (typeof window !== 'undefined'
  ? (window as unknown as { __BOOT__?: { settings?: SettingsMap } }).__BOOT__?.settings
  : undefined) ?? null;

let _cache: SettingsMap | null = boot;
let _promise: Promise<SettingsMap> | null = null;

/** The settings if they are already here (inlined in the page), else null */
export function peekSettings(): SettingsMap | null {
  return _cache;
}

export function loadSettings(): Promise<SettingsMap> {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = fetch('/api/settings')
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(`settings ${r.status}`))))
    .then((data: SettingsMap) => {
      _cache = data ?? {};
      return _cache;
    })
    .catch(() => {
      // Not remembered: a failure used to leave the whole visit on stock
      // photographs; the next caller asks again
      _promise = null;
      return {} as SettingsMap;
    });
  return _promise;
}

// Call after saving settings so next loadSettings() re-fetches.
export function invalidateSettingsCache() {
  _cache = null;
  _promise = null;
}
