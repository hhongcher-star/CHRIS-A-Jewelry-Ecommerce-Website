const MAX_CART_LINES = 50;
const MAX_ITEM_QUANTITY = 99;

export function parseCart(rawValue) {
  let value;
  try { value = typeof rawValue === 'string' ? JSON.parse(rawValue || '[]') : rawValue; } catch { return []; }
  if (!Array.isArray(value)) return [];
  const unique = new Map();
  for (const candidate of value.slice(0, MAX_CART_LINES)) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const slug = typeof candidate.slug === 'string' ? candidate.slug.trim().slice(0, 200) : '';
    const name = typeof candidate.name === 'string' ? candidate.name.trim().slice(0, 180) : '';
    const quantity = Number(candidate.quantity);
    if ((!slug && !name) || !Number.isSafeInteger(quantity) || quantity < 1) continue;
    const variantId = candidate.variantId === null || candidate.variantId === undefined || candidate.variantId === '' ? null : Number(candidate.variantId);
    if (variantId !== null && (!Number.isSafeInteger(variantId) || variantId < 1)) continue;
    const key = `${slug || name}:${variantId || ''}`;
    const existing = unique.get(key);
    unique.set(key, { key, slug, name, variantId, quantity: Math.min(MAX_ITEM_QUANTITY, (existing?.quantity || 0) + quantity) });
  }
  return [...unique.values()];
}

export function clampCartToCatalogue(cart, products) {
  if (!Array.isArray(products) || !products.length) return parseCart(cart);
  return parseCart(cart).flatMap((item) => {
    const product = products.find((candidate) => candidate.slug === item.slug || candidate.name === item.name);
    if (!product) return [];
    const stock = Math.max(0, Math.floor(Number(product.stock) || 0));
    return stock ? [{ ...item, quantity: Math.min(item.quantity, stock) }] : [];
  });
}

export function checkedCartQuantity(existingQuantity, requestedQuantity, stockQuantity) {
  const existing = Math.max(0, Math.floor(Number(existingQuantity) || 0));
  const requested = Math.floor(Number(requestedQuantity));
  const stock = Math.max(0, Math.floor(Number(stockQuantity) || 0));
  if (!Number.isSafeInteger(requested) || requested < 1) return { ok: false, reason: 'INVALID_QUANTITY', existing, stock };
  if (existing + requested > stock) return { ok: false, reason: stock ? 'INSUFFICIENT_STOCK' : 'SOLD_OUT', existing, stock };
  return { ok: true, quantity: existing + requested, existing, stock };
}
