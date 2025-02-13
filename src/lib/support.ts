// If the user is going to experience a degraded experience due to
// certain features not being supported, tell them.
// TODO: use somewhere, and ensure it stays updated

export function checkAPIs() {
  const apis = ['IntersectionObserver', 'fetch', 'Promise'];

  const unsupportedAPIs = apis.filter((api: string) => {
    return typeof window[api] === 'undefined';
  });

  return unsupportedAPIs;
}

/// HACK: Ideally, this function should never be called. The backend
/// should have sent changes such that duplication is not possible.
export function crutch_dedeuplicateByKeyFunction<T>(
  arr: Array<T>,
  keyFn: (item: T) => string
): Array<T> {
  const map = new Map();
  arr.forEach((item) => {
    const key = keyFn(item);
    if (map.has(key)) {
      console.warn(
        'crutch_dedeuplicateByKeyFunction: duplicate key found (dropping in favour of higher positions)',
        key
      );
    } else {
      map.set(keyFn(item), item);
    }
  });

  return Array.from(map.values());
}
