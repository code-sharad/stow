export function faviconUrl(pageUrl: string, size = 32): string | null {
  if (!chrome.runtime.getManifest().permissions?.includes('favicon')) return null;
  try {
    const url = new URL(chrome.runtime.getURL('/_favicon/'));
    url.searchParams.set('pageUrl', pageUrl);
    url.searchParams.set('size', String(size));
    return url.toString();
  } catch {
    return null;
  }
}

export function letterFor(value: string): string {
  try {
    const host = new URL(value).hostname.replace(/^www\./, '');
    const first = host.match(/[a-z0-9]/i);
    return (first?.[0] ?? '•').toUpperCase();
  } catch {
    const first = value.match(/[a-z0-9]/i);
    return (first?.[0] ?? '•').toUpperCase();
  }
}

export function hostLabel(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value.slice(0, 80);
  }
}
