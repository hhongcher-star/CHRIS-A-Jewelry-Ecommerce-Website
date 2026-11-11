// A new URL bypasses immutable image responses cached by previous deployments.
export function freshAssetUrl(value) {
  if (typeof value !== 'string' || !value) return value;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/assets/')) return value;
    url.searchParams.set('asset', '2');
    return value.startsWith('/') ? `${url.pathname}${url.search}${url.hash}` : url.href;
  } catch { return value; }
}
