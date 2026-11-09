const LEGACY_REVIEW_LINK = 'mailto:hello@chrisea.com';

export function reviewButtonMode(cta) {
  if (cta?.buttonMode === 'form' || cta?.buttonMode === 'link') return cta.buttonMode;
  const href = String(cta?.buttonHref || '').trim();
  return href && href !== LEGACY_REVIEW_LINK ? 'link' : 'form';
}

export function safeReviewLink(value) {
  if (typeof value !== 'string') return null;
  const href = value.trim();
  if (!href || /[\u0000-\u0020\u007f\\]/.test(href)) return null;
  if (href.startsWith('#') || (href.startsWith('/') && !href.startsWith('//'))) return href;
  try {
    const url = new URL(href);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? href : null;
  } catch { return null; }
}
