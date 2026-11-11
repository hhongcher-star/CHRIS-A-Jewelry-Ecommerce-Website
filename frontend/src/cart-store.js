import { parseCart } from './cart-state.js';

export const CART_KEY = 'chrisea-cart';
export const CART_EVENT = 'chrisea-cart-change';

export function readCart() {
  const raw = window.localStorage.getItem(CART_KEY);
  const items = parseCart(raw);
  const canonical = JSON.stringify(items);
  if (raw !== canonical) window.localStorage.setItem(CART_KEY, canonical);
  return items;
}

function writeCart(items) {
  const safeItems = parseCart(items);
  const serialized = JSON.stringify(safeItems);
  if (window.localStorage.getItem(CART_KEY) !== serialized) {
    window.localStorage.setItem(CART_KEY, serialized);
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: safeItems }));
  }
  return safeItems;
}

export async function updateCart(mutate) {
  const update = () => writeCart(mutate(readCart()));
  // Serialize read-modify-write across tabs where Web Locks is available.
  return navigator.locks?.request ? navigator.locks.request(CART_KEY, update) : Promise.resolve(update());
}

export function subscribeCart(listener) {
  const sync = event => {
    if (event.type === CART_EVENT || event.key === CART_KEY || event.key === null) listener(readCart());
  };
  window.addEventListener(CART_EVENT, sync);
  window.addEventListener('storage', sync);
  listener(readCart());
  return () => { window.removeEventListener(CART_EVENT, sync); window.removeEventListener('storage', sync); };
}
