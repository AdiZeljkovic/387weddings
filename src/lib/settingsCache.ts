// Module-level singleton — avoids multiple /api/settings fetches per page visit.
// loadSettings() is idempotent: concurrent calls share the same promise.

type SettingsMap = Record<string, string>;

let _cache: SettingsMap | null = null;
let _promise: Promise<SettingsMap> | null = null;

export function loadSettings(): Promise<SettingsMap> {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = fetch('/api/settings')
    .then(r => r.json())
    .then((data: SettingsMap) => {
      _cache = data ?? {};
      return _cache;
    })
    .catch(() => {
      _cache = {};
      return _cache as SettingsMap;
    });
  return _promise;
}

// Call after saving settings so next loadSettings() re-fetches.
export function invalidateSettingsCache() {
  _cache = null;
  _promise = null;
}
