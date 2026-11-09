import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  Download,
  Gem,
  Gift,
  Heart,
  House,
  Menu,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import HeroSlider from './components/HeroSlider';
import './styles.css';
import { checkedCartQuantity, clampCartToCatalogue, parseCart } from './cart-state.js';
import { reviewButtonMode, safeReviewLink } from './content-links.js';

const AdminApp = React.lazy(() => import('./components/AdminApp'));

const A = '/assets/products';
const ABOUT_CONTENT_ENDPOINT = import.meta.env.VITE_ABOUT_CONTENT_ENDPOINT || '/content/about.json';
const SHOP_PROMOTIONS_ENDPOINT = import.meta.env.VITE_SHOP_PROMOTIONS_ENDPOINT || '/content/shop-promotions.json';
const DEPLOYMENT_SITE_URL = 'https://xn--chrisa-fva.com';
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? `${DEPLOYMENT_SITE_URL}/api` : 'http://localhost:5000/api');
const ADMIN_ENTRY_PATH = `/${String(import.meta.env.VITE_ADMIN_PATH || 'atelier-9q7m2x4k8v6p').replace(/^\/+|\/+$/g, '')}`;
const SITE_URL = String(import.meta.env.VITE_SITE_URL || (import.meta.env.PROD ? DEPLOYMENT_SITE_URL : window.location.origin)).replace(/\/+$/, '');
const DEFAULT_SHARE_IMAGE = `${SITE_URL}/icon-512.png`;

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function applySeo({ title, description, path, image = DEFAULT_SHARE_IMAGE, type = 'website', robots = 'index, follow, max-image-preview:large' }) {
  const canonicalUrl = `${SITE_URL}${path === '/' ? '/' : path}`;
  document.title = title;
  setMeta('meta[name="description"]', { name: 'description', content: description });
  setMeta('meta[name="robots"]', { name: 'robots', content: robots });
  setMeta('meta[property="og:title"]', { property: 'og:title', content: title });
  setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  setMeta('meta[property="og:type"]', { property: 'og:type', content: type });
  setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
  setMeta('meta[property="og:image"]', { property: 'og:image', content: image.startsWith('http') ? image : `${SITE_URL}${image}` });
  setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
  setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
  setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image.startsWith('http') ? image : `${SITE_URL}${image}` });
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = canonicalUrl;
}

function setJsonLd(id, value) {
  let script = document.getElementById(id);
  if (!script) { script = document.createElement('script'); script.id = id; script.type = 'application/ld+json'; document.head.appendChild(script); }
  script.textContent = JSON.stringify(value).replace(/</g, '\\u003c');
}

function mergeSiteContent(fallback, saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return fallback;
  return Object.fromEntries(Object.entries(fallback).map(([key, value]) => {
    const incoming = saved[key];
    if (Array.isArray(value)) return [key, Array.isArray(incoming) ? incoming : value];
    if (value && typeof value === 'object') return [key, mergeSiteContent(value, incoming)];
    return [key, incoming ?? value];
  }).concat(Object.entries(saved).filter(([key]) => !(key in fallback))));
}

function ResponsiveContentImage({ content, path, src, className = '', ...props }) {
  const mobileSrc = content?._mobileImages?.[path];
  const saved = content?._imageAdjustments?.[path] || {};
  const desktop = saved.desktop || saved;
  const mobile = saved.mobile || {};
  const desktopX = Number(desktop.x ?? 50);
  const desktopY = Number(desktop.y ?? 50);
  const mobileX = Number(mobile.x ?? desktop.x ?? 50);
  const mobileY = Number(mobile.y ?? desktop.y ?? 50);
  const desktopStyle = { objectFit: desktop.fit || 'cover', objectPosition: `${desktopX}% ${desktopY}%`, transform: `scale(${Number(desktop.zoom || 100) / 100})`, transformOrigin: `${desktopX}% ${desktopY}%` };
  const mobileStyle = { objectFit: mobile.fit || desktop.fit || 'cover', objectPosition: `${mobileX}% ${mobileY}%`, transform: `scale(${Number(mobile.zoom || desktop.zoom || 100) / 100})`, transformOrigin: `${mobileX}% ${mobileY}%` };
  const desktopClass = `${className} cms-adjustable-image cms-image-desktop has-mobile`.trim();
  const mobileClass = `${className} cms-adjustable-image cms-image-mobile`.trim();
  return <>
    <img className={desktopClass} src={src} style={desktopStyle} {...props} />
    <img className={mobileClass} src={mobileSrc || src} style={mobileStyle} {...props} />
  </>;
}

function socialHref({ label = '', value = '', href = '' }) {
  const type = label.trim().toLowerCase();
  const text = value.trim();
  if (!text) return '';
  if (type.includes('mail') || type.includes('gmail')) return `mailto:${text.replace(/^mailto:/i, '')}`;
  if (type.includes('whatsapp') || type === 'wa') {
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = `60${digits.slice(1)}`;
    return digits ? `https://wa.me/${digits}` : '';
  }
  if (type.includes('phone') || type.includes('telephone') || type.includes('call')) return `tel:${text.replace(/[^+\d]/g, '')}`;
  if (/^https?:\/\//i.test(text)) return text;
  if (type.includes('website') || type.includes('web')) return `https://${text.replace(/^\/+/, '')}`;
  return href.trim();
}

const socialIconUrls = {
  Instagram: 'https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/instagram.svg',
  Email: 'https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/gmail.svg',
  TikTok: 'https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/tiktok.svg',
  WhatsApp: 'https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/whatsapp.svg',
  Facebook: 'https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/facebook.svg'
};
const socialIconFor = (label = '') => socialIconUrls[Object.keys(socialIconUrls).find((type) => type.toLowerCase() === label.trim().toLowerCase())] || socialIconUrls.Email;

function useSiteContent(page, fallback) {
  const previewing = new URLSearchParams(window.location.search).has('cmsPreview');
  const previewKey = `chrisea-cms-preview-${page}`;
  const readPreview = () => {
    if (!previewing) return null;
    try { return JSON.parse(window.localStorage.getItem(previewKey) || 'null'); } catch { return null; }
  };
  const [content, setContent] = useState(() => mergeSiteContent(fallback, readPreview() || {}));
  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/content/${page}`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : Promise.reject()).then((result) => {
      if (active) setContent(mergeSiteContent(fallback, previewing ? (readPreview() || result.data?.content || {}) : (result.data?.content || {})));
    }).catch(() => {});
    return () => { active = false; };
  }, [page]);
  useEffect(() => {
    if (!previewing) return undefined;
    const refresh = (event) => { if (event.key === previewKey) setContent(mergeSiteContent(fallback, readPreview() || {})); };
    const receive = (event) => { if (event.origin === window.location.origin && event.data?.type === 'chrisea-cms-content' && event.data.page === page) setContent(mergeSiteContent(fallback, event.data.content || {})); };
    window.addEventListener('storage', refresh);
    window.addEventListener('message', receive);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('message', receive); };
  }, [page]);
  return content;
}

const inventorySlugs = {
  'Enamel Pendant Necklace': '925-sterling-silver-enamel-pendant-necklace',
  'Vintage Zircon Heart Necklace': 's925-sterling-silver-vintage-zircon-heart-pendant-necklace',
  'Minimalist Pearl Bracelet': 's925-sterling-silver-minimalist-pearl-bracelet',
  'Natural Pearl Bracelet': 's925-sterling-silver-minimalist-pearl-bracelet',
  'Pearl & Turquoise Bracelet': 'pearl-turquoise-gemstone-bracelet',
  'Malachite & Pearl Bracelet': 'vintage-gold-malachite-pearl-bracelet',
  'Statement Zircon Ring': 's925-sterling-silver-statement-zircon-ring',
  'Gilded Bow Ring': 'gilded-bow-ring',
  'Lapis Lazuli Vintage Ring': 's925-vintage-zircon-lapis-mother-of-pearl-ring',
  'Four-Leaf Zircon Ring': 's925-sterling-silver-four-leaf-zircon-ring',
  'Mother-of-Pearl Heart Earrings': 's925-vintage-natural-mother-of-pearl-heart-earrings',
  'Zircon Button Earrings': 'zircon-button-earrings',
  'Statement Pearl Earrings': 's925-statement-natural-pearl-earrings',
  'Statement Heart Zircon Earrings': 's925-statement-heart-zircon-earrings'
};

function useCatalogueInventory() {
  const [inventory, setInventory] = useState({});
  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/products/inventory`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Inventory unavailable')))
      .then((result) => {
        if (!active) return;
        setInventory(Object.fromEntries(result.data.products.map((item) => [item.slug, Number(item.stock_quantity)])));
      })
      .catch(() => { /* Keep the catalogue usable if the API is temporarily offline. */ });
    return () => { active = false; };
  }, []);
  return inventory;
}

function useCatalogueCategories() {
  const [categoryNames, setCategoryNames] = useState(['Necklaces', 'Earrings', 'Rings', 'Bracelets']);
  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/products/categories`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Categories unavailable')))
      .then((result) => {
        if (active && result.data.categories.length) setCategoryNames(result.data.categories.map((category) => category.name));
      })
      .catch(() => { /* Keep the default navigation if the API is temporarily offline. */ });
    return () => { active = false; };
  }, []);
  return categoryNames;
}

const primaryNavigation = {
  left: [
    { label: 'Home', href: '/#top' },
    { label: 'Shop', href: '/shop' },
  ],
  right: [
    { label: 'About', href: '/about' },
    { label: 'Reviews', href: '/reviews' },
  ],
};

const mobileNavigation = [...primaryNavigation.left, ...primaryNavigation.right];

const categoryShowcase = [
  { name: 'Necklaces', image: `${A}/enamel-coin-necklace/01-main.png` },
  { name: 'Earrings', image: `${A}/mother-of-pearl-heart-earrings/01-vintage-gold.png` },
  { name: 'Rings', image: `${A}/four-leaf-zircon-ring/03-main.png` },
  { name: 'Bracelets', image: `${A}/pearl-turquoise-bracelet/01-main.png` },
];

const products = [
  {
    name: 'Enamel Pendant Necklace',
    detail: 'S925 Sterling Silver · Enamel',
    price: 'RM168',
    image: `${A}/enamel-coin-necklace/01-main.png`,
  },
  {
    name: 'Natural Pearl Bracelet',
    detail: 'S925 Sterling Silver · Natural Pearl',
    price: 'RM189',
    image: `${A}/minimalist-pearl-bracelet/01-main.png`,
  },
  {
    name: 'Four-Leaf Zircon Ring',
    detail: 'S925 Sterling Silver · Cubic Zirconia',
    price: 'RM138',
    image: `${A}/four-leaf-zircon-ring/03-main.png`,
  },
  {
    name: 'Mother-of-Pearl Heart Earrings',
    detail: 'S925 Sterling Silver · Mother-of-Pearl',
    price: 'RM152',
    image: `${A}/mother-of-pearl-heart-earrings/01-vintage-gold.png`,
  },
];

const shopProducts = [
  { name: 'Enamel Pendant Necklace', category: 'Necklaces', detail: 'S925 Sterling Silver · Enamel', price: 'RM168', image: `${A}/enamel-coin-necklace/01-main.png`, hoverImage: `${A}/enamel-coin-necklace/02-detail.png` },
  { name: 'Vintage Zircon Heart Necklace', category: 'Necklaces', detail: 'S925 Sterling Silver · Zircon', price: 'RM155', image: `${A}/zircon-heart-necklace/02-main.png`, hoverImage: `${A}/zircon-heart-necklace/01-detail.png` },
  { name: 'Minimalist Pearl Bracelet', category: 'Bracelets', detail: 'S925 Sterling Silver · Natural Pearl', price: 'RM189', image: `${A}/minimalist-pearl-bracelet/01-main.png`, hoverImage: `${A}/minimalist-pearl-bracelet/02-lifestyle.png` },
  { name: 'Pearl & Turquoise Bracelet', category: 'Bracelets', detail: 'Natural Pearl · Turquoise', price: 'RM168', image: `${A}/pearl-turquoise-bracelet/01-main.png`, hoverImage: `${A}/pearl-turquoise-bracelet/03-lifestyle.png` },
  { name: 'Malachite & Pearl Bracelet', category: 'Bracelets', detail: 'S925 Sterling Silver · Natural Pearl', price: 'RM189', image: `${A}/malachite-pearl-bracelet/01-main.png`, hoverImage: `${A}/malachite-pearl-bracelet/04-lifestyle.png` },
  { name: 'Statement Zircon Ring', category: 'Rings', detail: 'S925 Sterling Silver · Zircon', price: 'RM120', image: `${A}/statement-zircon-ring/01-main.png`, hoverImage: `${A}/statement-zircon-ring/02-styled.png` },
  { name: 'Gilded Bow Ring', category: 'Rings', detail: 'S925 Sterling Silver', price: 'RM128', image: `${A}/gilded-bow-ring/04-main.png`, hoverImage: `${A}/gilded-bow-ring/01-lifestyle.png` },
  { name: 'Lapis Lazuli Vintage Ring', category: 'Rings', detail: 'S925 Sterling Silver · Lapis Lazuli', price: 'RM138', image: `${A}/lapis-mother-of-pearl-ring/01-vintage-gold.png`, hoverImage: `${A}/lapis-mother-of-pearl-ring/02-both-colours.png` },
  { name: 'Four-Leaf Zircon Ring', category: 'Rings', detail: 'S925 Sterling Silver · Cubic Zirconia', price: 'RM138', image: `${A}/four-leaf-zircon-ring/03-main.png`, hoverImage: `${A}/four-leaf-zircon-ring/01-lifestyle.png` },
  { name: 'Mother-of-Pearl Heart Earrings', category: 'Earrings', detail: 'S925 Sterling Silver · Mother-of-Pearl', price: 'RM152', image: `${A}/mother-of-pearl-heart-earrings/01-vintage-gold.png`, hoverImage: `${A}/mother-of-pearl-heart-earrings/02-both-colours.png` },
  { name: 'Zircon Button Earrings', category: 'Earrings', detail: 'S925 Sterling Silver · Zircon', price: 'RM128', image: `${A}/zircon-button-earrings/01-main.png`, hoverImage: `${A}/zircon-button-earrings/02-styled.png` },
  { name: 'Statement Pearl Earrings', category: 'Earrings', detail: 'S925 Sterling Silver · Natural Pearl', price: 'RM135', image: `${A}/statement-pearl-earrings/01-vintage-gold.png`, hoverImage: `${A}/statement-pearl-earrings/02-styled.png` },
  { name: 'Statement Heart Zircon Earrings', category: 'Earrings', detail: 'S925 Sterling Silver · Cubic Zirconia', price: 'RM120', image: `${A}/statement-heart-zircon-earrings/01-vintage-gold.png`, hoverImage: `${A}/statement-heart-zircon-earrings/02-styled.png` },
];

const productSlug = (product) => product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const productUrl = (product) => `/product/${encodeURIComponent(productSlug(product))}`;
const formatProductPrice = (value) => `RM ${Number(value || 0).toFixed(2)}`;
const catalogueDetail = (description = '', labels = []) => {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return description.match(new RegExp(`^(?:${escaped})\\s*:\\s*(.+)$`, 'im'))?.[1]?.trim() || '';
};
const catalogueDescription = (description = '') => description.split(/\r?\n/).filter((line) => !/^\s*(material|colou?r|size|ring size|bracelet length|chain length|type|pearl size|ring type)\s*:/i.test(line)).join('\n').trim();

function normaliseCatalogueProduct(product) {
  const fallback = shopProducts.find((item) => item.name === product.name || productSlug(item) === product.slug);
  const imageList = (product.images || []).map((image) => image.image_url).filter(Boolean);
  const purchaseVariant = product.purchase_variant ? { ...product.purchase_variant, price: Number(product.purchase_variant.price ?? product.base_price ?? 0), stock_quantity: Number(product.purchase_variant.stock_quantity || 0) } : null;
  const basePrice = Number(product.base_price ?? purchaseVariant?.price ?? 0);
  const discountPercent = Math.max(0, Math.min(100, Number(product.discount_percent) || 0));
  const salePrice = Number((basePrice * (1 - discountPercent / 100)).toFixed(2));
  const primaryImage = imageList[0] || fallback?.image || `${A}/enamel-coin-necklace/01-main.png`;
  const secondaryImage = imageList[1] || imageList[0] || fallback?.hoverImage || primaryImage;
  return {
    ...product,
    slug: product.slug || productSlug(product),
    category: product.category || fallback?.category || 'Jewellery',
    detail: product.short_description || fallback?.detail || product.description || '',
    price: formatProductPrice(salePrice),
    originalPrice: formatProductPrice(basePrice),
    numericPrice: salePrice,
    discountPercent,
    image: primaryImage,
    hoverImage: secondaryImage,
    imageList: imageList.length ? imageList : [primaryImage, secondaryImage].filter((image, index, items) => items.indexOf(image) === index),
    description: catalogueDescription(product.description || ''),
    material: product.material || catalogueDetail(product.description, ['Material']),
    color: product.color || catalogueDetail(product.description, ['Color', 'Colour']),
    size: product.size || catalogueDetail(product.description, ['Size', 'Ring Size', 'Bracelet Length', 'Chain Length']),
    purchaseVariant,
    stock: Number(product.stock_quantity ?? purchaseVariant?.stock_quantity ?? 0),
  };
}

let catalogueProductsCache = null;
let catalogueProductsRequest = null;

function loadCatalogueProducts() {
  if (catalogueProductsCache) return Promise.resolve(catalogueProductsCache);
  if (!catalogueProductsRequest) {
    catalogueProductsRequest = fetch(`${API_URL}/products`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Catalogue unavailable')))
      .then((result) => {
        catalogueProductsCache = (result.data?.products || []).map(normaliseCatalogueProduct);
        return catalogueProductsCache;
      })
      .finally(() => { catalogueProductsRequest = null; });
  }
  return catalogueProductsRequest;
}

function useCatalogueProducts() {
  const [catalogueProducts, setCatalogueProducts] = useState(catalogueProductsCache || []);
  const [loading, setLoading] = useState(!catalogueProductsCache);
  useEffect(() => {
    let active = true;
    loadCatalogueProducts()
      .then((items) => { if (active) setCatalogueProducts(items); })
      .catch(() => {
        if (active) setCatalogueProducts(shopProducts.map((product) => normaliseCatalogueProduct(product)));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { products: catalogueProducts, loading };
}

const getProductStock = (product, inventory = {}) => {
  if (Number.isFinite(Number(product.stock))) return Number(product.stock);
  if (Number.isFinite(Number(product.stock_quantity))) return Number(product.stock_quantity);
  return inventory[product.slug || inventorySlugs[product.name]];
};

const CART_KEY = 'chrisea-cart';
window.localStorage.removeItem('chrisea-latest-receipt');
const readCart = () => {
  const raw = window.localStorage.getItem(CART_KEY);
  const safeItems = parseCart(raw);
  const canonical = JSON.stringify(safeItems);
  if (raw !== canonical) window.localStorage.setItem(CART_KEY, canonical);
  return safeItems;
};
const writeCart = (items) => {
  const safeItems = parseCart(items);
  window.localStorage.setItem(CART_KEY, JSON.stringify(safeItems));
  window.dispatchEvent(new CustomEvent('chrisea-cart-change', { detail: safeItems }));
};

async function notifyPayment(receipt) {
  const response = await fetch(`${API_URL}/orders/${receipt.orderId}/payment-notice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentNoticeToken: receipt.paymentNoticeToken })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'The payment notice could not be sent.');
  return { ...receipt, status: result.data.status, reviewExpiresAt: result.data.reviewExpiresAt };
}
const addCartItem = async (product, quantity = 1) => {
  const slug = productSlug(product);
  const response = await fetch(`${API_URL}/products/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to verify stock. Please try again.');
  const result = await response.json();
  const liveProduct = normaliseCatalogueProduct(result.data?.product || {});
  const selectedVariantId = product.selectedVariantId || product.purchaseVariant?.id || null;
  if (selectedVariantId && String(liveProduct.purchaseVariant?.id) !== String(selectedVariantId)) {
    throw new Error('This item option is no longer available.');
  }
  const stock = Math.max(0, Math.floor(Number(liveProduct.purchaseVariant?.stock_quantity ?? liveProduct.stock) || 0));
  const requestedQuantity = Math.floor(Number(quantity));
  if (!Number.isFinite(requestedQuantity) || requestedQuantity < 1) throw new Error('Please select a valid quantity.');
  const items = readCart();
  const cartKey = `${slug}:${selectedVariantId || ''}`;
  const existing = items.find((item) => (item.key || `${item.slug || item.name}:`) === cartKey);
  const quantityCheck = checkedCartQuantity(existing?.quantity, requestedQuantity, stock);
  const existingQuantity = quantityCheck.existing;
  if (!quantityCheck.ok) {
    throw new Error(stock === 0 ? 'This item is sold out.' : `Only ${stock} item${stock === 1 ? '' : 's'} available. You already have ${existingQuantity} in your cart.`);
  }
  const cartItem = { key: cartKey, slug, name: liveProduct.name || product.name, variantId: selectedVariantId, quantity: requestedQuantity };
  const next = existing ? items.map((item) => (item.key || `${item.slug || item.name}:`) === cartKey ? { ...item, quantity: quantityCheck.quantity } : item) : [...items, cartItem];
  writeCart(next);
  return next;
};

async function addCartItemAnimated(event, product, quantity = 1, onAdded) {
  const button = event?.currentTarget;
  const bag = document.querySelector('.bag-button');
  const source = button?.closest('article, .product-detail-grid')?.querySelector('.product-main-image img, .shop-image-primary, img') || document.querySelector('.product-main-image img');
  const original = button?.innerHTML;
  if (button) {
    button.disabled = true;
    button.textContent = 'CHECKING STOCK…';
  }
  let next;
  try {
    next = await addCartItem(product, quantity);
    onAdded?.(next);
  } catch (error) {
    if (button) {
      button.textContent = error.message;
      window.setTimeout(() => { if (button.isConnected) { button.innerHTML = original; button.disabled = Number(product.stock) === 0; } }, 2200);
    }
    return;
  }
  const finish = () => {
    if (bag) {
      bag.classList.remove('bag-pop');
      void bag.offsetWidth;
      bag.classList.add('bag-pop');
      window.setTimeout(() => bag.classList.remove('bag-pop'), 520);
    }
  };
  if (button) {
    button.classList.add('is-added');
    button.textContent = '✓ ADDED TO BAG';
    window.setTimeout(() => { if (button.isConnected) { button.innerHTML = original; button.classList.remove('is-added'); button.disabled = Number(product.stock) === 0; } }, 1500);
  }
  if (!bag || !source || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish();
    return;
  }
  const start = source.getBoundingClientRect();
  const destination = bag.getBoundingClientRect();
  const size = Math.max(42, Math.min(64, Math.min(start.width, start.height) * .22));
  const flyer = source.cloneNode(true);
  flyer.className = 'cart-flying-image';
  Object.assign(flyer.style, { left: `${start.left + start.width / 2 - size / 2}px`, top: `${start.top + start.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px` });
  document.body.appendChild(flyer);
  const endX = destination.left + destination.width / 2 - (start.left + start.width / 2);
  const endY = destination.top + destination.height / 2 - (start.top + start.height / 2);
  flyer.animate([
    { transform: 'translate3d(0,0,0) scale(1)', opacity: 1, offset: 0 },
    { transform: `translate3d(${endX * .48}px,${endY * .38 - 90}px,0) scale(.78)`, opacity: .9, offset: .48 },
    { transform: `translate3d(${endX}px,${endY}px,0) scale(.28)`, opacity: 0, offset: 1 },
  ], { duration: 700, easing: 'cubic-bezier(.22,.8,.3,1)', fill: 'forwards' }).finished.then(() => { flyer.remove(); finish(); }).catch(() => { flyer.remove(); finish(); });
}

function ProductGridSkeleton({ count = 4 }) {
  return <div className="product-grid-skeleton" aria-label="Loading products">{Array.from({ length: count }, (_, index) => <article className="skeleton-card" key={index}><i className="skeleton-image" /><i className="skeleton-line short" /><i className="skeleton-line" /><i className="skeleton-line medium" /><i className="skeleton-button" /></article>)}</div>;
}

function ProductDetailSkeleton() {
  return <main className="product-detail-skeleton section-pad" aria-label="Loading product"><div className="skeleton-gallery skeleton-surface" /><div className="skeleton-copy"><i className="skeleton-line short" /><i className="skeleton-title skeleton-surface" /><i className="skeleton-line medium" /><i className="skeleton-paragraph skeleton-surface" /><i className="skeleton-paragraph skeleton-surface" /><i className="skeleton-button skeleton-surface" /></div></main>;
}

function BrandMark({ light = false }) {
  if (!light) {
    return (
      <a className="brand-mark brand-mark--logo" href="/#top" aria-label="CHRISÉA Jewelry home">
        <img src="/assets/brand/chrisea-logo-full-transparent.png" alt="CHRISÉA Jewelry" />
      </a>
    );
  }

  return (
    <div className={`brand-mark ${light ? 'brand-mark--light' : ''}`} aria-label="CHRISÉA Jewelry">
      <span className="brand-est">EST <b>✦</b> 2026</span>
      <span className="brand-name">CHRISÉA</span>
      <span className="brand-subtitle">Jewelry</span>
    </div>
  );
}

function Header() {
  const announcement = useSiteContent('announcement', { messages: ['Complimentary shipping on orders over RM200', 'Gift-ready packaging'] });
  const announcementMessages = announcement.messages?.length >= 2 ? announcement.messages.slice(0, 4) : [announcement.message1, announcement.message2].filter(Boolean);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { products: catalogueProducts } = useCatalogueProducts();
  const [cartCount, setCartCount] = useState(() => readCart().reduce((total, item) => total + item.quantity, 0));
  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    return () => document.body.classList.remove('menu-open');
  }, [open]);
  useEffect(() => {
    const updateCount = (event) => setCartCount((event.detail || readCart()).reduce((total, item) => total + item.quantity, 0));
    window.addEventListener('chrisea-cart-change', updateCount);
    return () => window.removeEventListener('chrisea-cart-change', updateCount);
  }, []);
  useEffect(() => {
    if (!searchOpen) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setSearchOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [searchOpen]);

  const close = () => setOpen(false);
  const searchResults = searchQuery.trim().length < 2 ? [] : catalogueProducts.filter((product) => `${product.name} ${product.category} ${product.detail}`.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 6);
  return (
    <>
      <div className={`announcement has-${announcementMessages.length}-items`} style={{ '--announcement-count': announcementMessages.length }} aria-label={announcementMessages.join('. ')}>
        <div className="announcement-track" aria-hidden="true">
          {Array.from({ length: 8 }, (_, group) => (
            <div className="announcement-group" key={group}>
              {announcementMessages.map((message, index) => <span className="announcement-item" key={`${group}-${index}`}><b>{index % 2 === 0 ? '✦ ' : ''}{message}</b><i /></span>)}
            </div>
          ))}
        </div>
      </div>
      <header className="site-header" id="top">
        <button className="icon-button mobile-only" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
        <div className={`header-search ${searchOpen ? 'is-open' : ''}`} onFocus={() => setSearchOpen(true)} onBlur={() => window.setTimeout(() => setSearchOpen(false), 160)}>
          <Search size={17} />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search for jewellery…" aria-label="Search jewellery" />
          {searchOpen && <div className="header-search-advice">
            {!searchQuery.trim() && <><p>Popular searches</p><div><a href="/shop?category=Necklaces#categories">Necklaces</a><a href="/shop?category=Rings#categories">Rings</a><a href="/shop?category=Bracelets#categories">Pearls</a></div></>}
            {searchQuery.trim().length === 1 && <p>Type one more letter to search.</p>}
            {searchQuery.trim().length >= 2 && !searchResults.length && <p>No pieces found. Try another word.</p>}
            {searchResults.map((product) => <a className="header-search-result" href={productUrl(product)} key={product.id || product.name}><img src={product.image} alt="" /><span><small>{product.category}</small><strong>{product.name}</strong><em>{product.price}</em></span></a>)}
            <a className="header-search-all" href="/shop">View all jewellery <ArrowRight size={13} /></a>
          </div>}
        </div>
        <nav className="nav nav-left" aria-label="Primary navigation">
          {primaryNavigation.left.map((item) => (
            <a href={item.href} aria-current={(item.href === '/shop' && location.pathname.startsWith('/shop')) || (item.href === '/#top' && location.pathname === '/') ? 'page' : undefined} key={item.label}>{item.label}</a>
          ))}
        </nav>
        <BrandMark />
        <nav className="nav nav-right" aria-label="Secondary navigation">
          {primaryNavigation.right.map((item) => (
            <a href={item.href} aria-current={(item.href === '/about' && location.pathname.startsWith('/about')) || (item.href === '/reviews' && location.pathname.startsWith('/reviews')) ? 'page' : undefined} key={item.label}>{item.label}</a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="icon-button bag-button" href="/cart" aria-label={`Shopping bag with ${cartCount} items`}><ShoppingBag /><b>{cartCount}</b></a>
        </div>
      </header>
      {createPortal(<div className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <button className="icon-button menu-close" onClick={close} aria-label="Close menu"><X /></button>
        <BrandMark light />
        <button className="mobile-search-trigger" type="button" onClick={() => { close(); setSearchOpen(true); }}><Search size={18} /> Search jewellery</button>
        {mobileNavigation.map((item) => (
          <a href={item.href} onClick={close} key={item.label}>{item.label}</a>
        ))}
      </div>, document.body)}
      {searchOpen && <div className="search-modal" role="dialog" aria-modal="true" aria-labelledby="search-title" onMouseDown={(event) => event.target === event.currentTarget && setSearchOpen(false)}>
        <div className="search-panel">
          <button className="search-close" type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X /></button>
          <p>Find your piece</p><h2 id="search-title">Search CHRISÉA</h2>
          <label className="search-input"><Search /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Try ‘pearl’, ‘ring’ or ‘zircon’…" /></label>
          <div className="search-results">
            {!searchQuery.trim() && <p className="search-hint">Search by product, category or material.</p>}
            {searchQuery.trim().length === 1 && <p className="search-hint">Type one more letter to search.</p>}
            {searchQuery.trim().length >= 2 && !searchResults.length && <p className="search-hint">No pieces found. Try another word.</p>}
            {searchResults.map((product) => { const href = `/product/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`; return <a href={href} key={product.name}><img src={product.image} alt="" /><span><small>{product.category}</small><strong>{product.name}</strong><em>{product.price}</em></span><ArrowRight /></a>; })}
          </div>
          <a className="search-view-all" href="/shop">View all jewellery <ArrowRight size={14} /></a>
        </div>
      </div>}
    </>
  );
}

const defaultFooterCare = {
  faq: { eyebrow: 'Customer care', title: 'Frequently Asked Questions', intro: 'A few helpful answers about ordering from CHRISÉA.', sections: [['Can I change my order?', 'Please contact us as soon as possible. We will gladly help before your order has been prepared for dispatch.'], ['How should I care for my jewellery?', 'Keep each piece dry, avoid perfume and lotions, and store it separately in its pouch after wearing.'], ['Is gift packaging available?', 'Every CHRISÉA order is thoughtfully presented and ready for gifting.']] },
  shipping: { eyebrow: 'Delivery information', title: 'Shipping & Delivery', intro: 'Your jewellery is carefully prepared and packed before beginning its journey to you.', sections: [['Malaysia delivery', 'Orders are usually prepared within 1–2 business days. Delivery typically takes 2–5 business days after dispatch.'], ['Shipping updates', 'Once your parcel is on the way, delivery details will be sent to the email address used at checkout.'], ['Packaging', 'Each order is protected in signature CHRISÉA packaging suitable for keeping or gifting.']] },
  returns: { eyebrow: 'Customer care', title: 'Return & Refund', intro: 'We want every CHRISÉA piece to feel just right when it arrives.', sections: [['Return window', 'Eligible unworn items may be requested for return within 14 days of delivery, with original packaging included.'], ['Making a request', 'Contact our customer care team with your order details and reason for return before sending an item back.'], ['Refunds', 'Approved refunds are returned to the original payment method after the item has been received and inspected.']] }
};

function SiteFooter() {
  const footerContent = useSiteContent('footer', { brandText: 'Timeless pieces for modern romantics. Designed to celebrate every chapter.', socialLabel: 'Follow our journey', shopTitle: 'Shop', careTitle: 'Customer care', copyright: '© 2026 CHRISÉA Jewelry. All rights reserved.', legalText: 'Privacy Policy | Terms & Conditions', care: defaultFooterCare });
  const [carePanel, setCarePanel] = useState(null);
  const legacyCareContent = {
    faq: {
      eyebrow: 'Customer care',
      title: 'Frequently Asked Questions',
      intro: 'A few helpful answers about ordering from CHRISÉA.',
      sections: [
        ['Can I change my order?', 'Please contact us as soon as possible. We will gladly help before your order has been prepared for dispatch.'],
        ['How should I care for my jewellery?', 'Keep each piece dry, avoid perfume and lotions, and store it separately in its pouch after wearing.'],
        ['Is gift packaging available?', 'Every CHRISÉA order is thoughtfully presented and ready for gifting.'],
      ],
    },
    shipping: {
      eyebrow: 'Delivery information',
      title: 'Shipping & Delivery',
      intro: 'Your jewellery is carefully prepared and packed before beginning its journey to you.',
      sections: [
        ['Malaysia delivery', 'Orders are usually prepared within 1–2 business days. Delivery typically takes 2–5 business days after dispatch.'],
        ['Shipping updates', 'Once your parcel is on the way, delivery details will be sent to the email address used at checkout.'],
        ['Packaging', 'Each order is protected in signature CHRISÉA packaging suitable for keeping or gifting.'],
      ],
    },
    returns: {
      eyebrow: 'Customer care',
      title: 'Return & Refund',
      intro: 'We want every CHRISÉA piece to feel just right when it arrives.',
      sections: [
        ['Return window', 'Eligible unworn items may be requested for return within 14 days of delivery, with original packaging included.'],
        ['Making a request', 'Contact our customer care team with your order details and reason for return before sending an item back.'],
        ['Refunds', 'Approved refunds are returned to the original payment method after the item has been received and inspected.'],
      ],
    },
  };

  useEffect(() => {
    if (!carePanel) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setCarePanel(null);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [carePanel]);
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('cmsPreview')) return undefined;
    const openCarePreview = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'chrisea-cms-section' || event.data?.page !== 'footer') return;
      if (['faq', 'shipping', 'returns'].includes(event.data.section)) setCarePanel(event.data.section);
      else setCarePanel(null);
    };
    window.addEventListener('message', openCarePreview);
    return () => window.removeEventListener('message', openCarePreview);
  }, []);

  const careContent = footerContent.care || legacyCareContent;
  const activeCare = carePanel ? careContent[carePanel] : null;

  return (
    <footer id="contact">
      <div className="footer-main section-pad">
        <div className="footer-brand"><img className="footer-logo" src="/assets/brand/chrisea-logo-full-transparent.png" alt="CHRISÉA Jewelry logo" /><p>{footerContent.brandText}</p><a href="/#top"><span aria-hidden="true">◎</span> {footerContent.socialLabel}</a></div>
        <div><h3>{footerContent.shopTitle}</h3><a href="/shop">All products</a><a href="/shop?category=Necklaces">Necklaces</a><a href="/shop?category=Earrings">Earrings</a><a href="/shop?category=Rings">Rings</a><a href="/shop?category=Bracelets">Bracelets</a></div>
        <div className="footer-care"><h3>{footerContent.careTitle}</h3><button type="button" onClick={() => setCarePanel('faq')}>FAQ</button><button type="button" onClick={() => setCarePanel('shipping')}>Shipping & delivery</button><button type="button" onClick={() => setCarePanel('returns')}>Return & refund</button></div>
      </div>
      <div className="footer-bottom"><span>{footerContent.copyright}</span><span>{footerContent.legalText}</span></div>
      {activeCare && (
        <div className="care-modal" role="dialog" aria-modal="true" aria-labelledby="care-modal-title" onMouseDown={(event) => event.target === event.currentTarget && setCarePanel(null)}>
          <div className="care-modal-panel">
            <button className="care-modal-close" type="button" onClick={() => setCarePanel(null)} aria-label="Close information window"><X /></button>
            <p className="care-modal-eyebrow">{activeCare.eyebrow}</p>
            <h2 id="care-modal-title">{activeCare.title}</h2>
            <p className="care-modal-intro">{activeCare.intro}</p>
            <div className="care-modal-content">
              {activeCare.sections.map(([heading, copy], index) => (
                <section key={heading}><span>0{index + 1}</span><div><h3>{heading}</h3><p>{copy}</p></div></section>
              ))}
            </div>
            <button className="care-modal-done" type="button" onClick={() => setCarePanel(null)}>Close</button>
          </div>
        </div>
      )}
    </footer>
  );
}

const aboutFallback = {
  hero: { eyebrow: 'The story of CHRISÉA', title: 'Jewellery for the chapters you’ll always remember.', intro: 'Born from a love of keepsakes, CHRISÉA brings vintage romance into the everyday.', image: 'https://images.unsplash.com/photo-1710753495822-3f1a0b7cfb8d?auto=format&fit=crop&w=2400&q=85', imageAlt: 'Gold jewellery arranged inside a red velvet box' },
  story: { eyebrow: 'Our beginning', title: 'A little nostalgia, made for now.', paragraphs: ['CHRISÉA began with a simple belief: the jewellery we reach for most should feel as meaningful as the moments it becomes part of.'], signature: 'For every chapter, with love.', mainImage: '/assets/about/about-origin-main.jpg', detailImage: '/assets/about/about-origin-detail.jpg' },
  valuesEyebrow: 'What guides us', valuesTitle: 'Beauty with meaning', values: [
    { number: '01', title: 'Thoughtfully chosen', text: 'Every detail is considered for its character, wearability and ability to feel personal.' },
    { number: '02', title: 'Made for real life', text: 'Elegant pieces designed to move easily from everyday rituals to life’s milestones.' },
    { number: '03', title: 'Beautifully presented', text: 'From the piece to the packaging, every order is prepared to feel like a gift.' }
  ], quote: 'The best jewellery does not simply complete a look. It keeps a feeling close.',
  journey: { eyebrow: 'Our journey', title: 'A story still unfolding', items: [
    { year: '2026', title: 'CHRISÉA begins', text: 'A curated jewellery house for modern romantics is born in Malaysia.' },
    { year: 'Today', title: 'Chosen with intention', text: 'We continue to discover pieces that balance sentiment, beauty and everyday ease.' },
    { year: 'Always', title: 'Made part of your story', text: 'Our favourite chapter is the one each piece begins with you.' }
  ] },
  cta: { eyebrow: 'Find your keepsake', title: 'Wear the moment. Keep the memory.', buttonLabel: 'Explore the collection', buttonHref: '/shop', image: 'https://images.unsplash.com/photo-1725918319267-ec6bf04c981b?auto=format&fit=crop&w=2400&q=85' },
};

function AboutPage() {
  const content = useSiteContent('about', aboutFallback);

  const { hero, story, values = [], journey, cta } = content;
  return (
    <div className="page-shell about-page">
      <Header />
      <main>
        <section className="about-hero">
          <div className="about-hero-copy">
            <p className="about-kicker">{hero.eyebrow}</p>
            <h1>{hero.title}</h1>
            <span className="about-gold-line" />
            <p>{hero.intro}</p>
          </div>
          <div className="about-hero-image"><ResponsiveContentImage content={content} path="hero.image" src={hero.image} alt={hero.imageAlt} /></div>
          <span className="about-hero-index">Est. 2026 · Malaysia</span>
        </section>

        <section className="about-origin section-pad">
          <div className="about-origin-art">
            <ResponsiveContentImage content={content} path="story.mainImage" className="about-origin-main" src={story.mainImage} alt="CHRISÉA pearl jewellery styling" />
            <ResponsiveContentImage content={content} path="story.detailImage" className="about-origin-detail" src={story.detailImage} alt="CHRISÉA jewellery detail" />
            <div className="about-origin-mark">C<span>✦</span></div>
          </div>
          <div className="about-origin-copy">
            <p className="eyebrow dark">{story.eyebrow}</p>
            <h2>{story.title}</h2>
            <div className="short-rule" />
            {(story.paragraph ? [story.paragraph] : story.paragraphs)?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p className="about-signature">{story.signature}</p>
          </div>
        </section>

        <section className="about-values section-pad">
          <header><p className="eyebrow">{content.valuesEyebrow}</p><h2>{content.valuesTitle}</h2></header>
          <div className="about-value-grid">
            {values.map((value) => <article key={value.number}><span>{value.number}</span><h3>{value.title}</h3><p>{value.text}</p></article>)}
          </div>
        </section>

        <blockquote className="about-quote section-pad"><span>“</span><p>{content.quote}</p><footer>CHRISÉA Jewelry</footer></blockquote>

        <section className="about-journey section-pad">
          <div className="about-journey-heading"><p className="eyebrow dark">{journey.eyebrow}</p><h2>{journey.title}</h2></div>
          <div className="about-timeline">
            {journey.items?.map((item) => <article key={item.year}><span>{item.year}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}
          </div>
        </section>

        <section className="about-cta">
          <ResponsiveContentImage content={content} path="cta.image" src={cta.image} alt="CHRISÉA jewellery collection" />
          <div className="about-cta-shade" />
          <div className="about-cta-copy"><p>{cta.eyebrow}</p><h2>{cta.title}</h2><a className="button button-outline" href={cta.buttonHref}>{cta.buttonLabel}<ArrowRight size={15} /></a></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

const promotionFallback = [
  { id: 'signature-edit', active: true, eyebrow: 'The signature edit', title: 'A little something, just for you.', description: 'Discover handpicked pieces made for gifting, keeping and every meaningful moment between.', buttonLabel: 'Shop the edit', buttonHref: '/shop#sale-favourites', image: 'https://images.unsplash.com/photo-1578632297758-3a6c6de14be8?auto=format&fit=crop&w=2400&q=85', imageAlt: 'Gold and silver rings on a red velvet jewellery box' },
];

function ShopPromotionSlider({ content, mobileImages = {}, imageAdjustments = {} }) {
  const [promotions, setPromotions] = useState(promotionFallback);
  const [active, setActive] = useState(0);
  const cmsPromotions = Array.isArray(content) ? content.map((promotion, index) => {
    const path = `promotion.${index}.image`;
    const saved = imageAdjustments[path] || {};
    const desktop = saved.desktop || saved;
    const mobile = saved.mobile || {};
    const desktopX = Number(desktop.x ?? 50);
    const desktopY = Number(desktop.y ?? 50);
    const mobileX = Number(mobile.x ?? desktop.x ?? 50);
    const mobileY = Number(mobile.y ?? desktop.y ?? 50);
    return { ...promotionFallback[0], ...promotion, mobileImage: mobileImages[path] || '', desktopStyle: { objectFit: desktop.fit || 'cover', objectPosition: `${desktopX}% ${desktopY}%`, transform: `scale(${Number(desktop.zoom || 100) / 100})`, transformOrigin: `${desktopX}% ${desktopY}%` }, mobileStyle: { objectFit: mobile.fit || desktop.fit || 'cover', objectPosition: `${mobileX}% ${mobileY}%`, transform: `scale(${Number(mobile.zoom || desktop.zoom || 100) / 100})`, transformOrigin: `${mobileX}% ${mobileY}%` }, id: `website-content-promotion-${index + 1}` };
  }) : [];
  const visiblePromotions = (cmsPromotions.length ? cmsPromotions : promotions).filter((promotion) => promotion.active !== false);

  useEffect(() => {
    let mounted = true;
    fetch(SHOP_PROMOTIONS_ENDPOINT)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Promotions unavailable')))
      .then((data) => mounted && Array.isArray(data) && data.some((item) => item.active !== false) && setPromotions(data))
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (visiblePromotions.length < 2) return undefined;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % visiblePromotions.length), 5500);
    return () => window.clearInterval(timer);
  }, [visiblePromotions.length]);

  useEffect(() => {
    if (active >= visiblePromotions.length) setActive(0);
  }, [active, visiblePromotions.length]);

  if (!visiblePromotions.length) return null;
  const safeActive = active % visiblePromotions.length;
  const current = visiblePromotions[safeActive];

  return (
    <section className="shop-promotion" aria-roledescription="carousel" aria-label="Current promotions">
      <div className="shop-promotion-media">
        {visiblePromotions.map((promotion, index) => <React.Fragment key={promotion.id}><img className={`${index === safeActive ? 'is-active ' : ''}cms-adjustable-image cms-image-desktop has-mobile`} src={promotion.image} style={promotion.desktopStyle} alt={index === safeActive ? promotion.imageAlt : ''} aria-hidden={index !== safeActive} /><img className={`${index === safeActive ? 'is-active ' : ''}cms-adjustable-image cms-image-mobile`} src={promotion.mobileImage || promotion.image} style={promotion.mobileStyle} alt={index === safeActive ? promotion.imageAlt : ''} aria-hidden={index !== safeActive} /></React.Fragment>)}
      </div>
      <div className="shop-promotion-shade" />
      <div className="shop-promotion-copy" key={current.id}>
        <p>{current.eyebrow}</p>
        <h1>{current.title}</h1>
        <span />
        <div className="shop-promotion-bottom">
          <p>{current.description}</p>
          <a href={current.buttonHref}>{current.buttonLabel}<ArrowRight size={15} /></a>
        </div>
        <div className="shop-promotion-benefits" aria-label="Promotion details">
          <span><b>◇</b>Selected styles</span>
          <span><b>✦</b>Limited time only</span>
          <span><b>□</b>While stocks last</span>
        </div>
      </div>
      <div className="shop-promotion-controls" aria-label="Choose promotion">
        {visiblePromotions.map((promotion, index) => <button className={index === safeActive ? 'is-active' : ''} type="button" onClick={() => setActive(index)} aria-label={`Show promotion ${index + 1}`} key={promotion.id}><span>0{index + 1}</span><i><b /></i></button>)}
      </div>
      <div className="shop-promotion-counter">0{safeActive + 1}<i />0{visiblePromotions.length}</div>
    </section>
  );
}

function SaleFavorites({ products, content }) {
  return (
    <section className="sale-favorites section-pad" id="sale-favourites" aria-labelledby="sale-favorites-title">
      <header className="sale-favorites-heading">
        <span />
        <div><h2 id="sale-favorites-title">{content.title}</h2><p>{content.description}</p></div>
        <span />
      </header>
      <div className="sale-favorites-grid">
        {products.map((product) => {
          const href = productUrl(product);
          const stock = getProductStock(product);
          const soldOut = stock === 0;
          return (
            <article className={`sale-favorite-card ${soldOut ? 'is-sold-out' : ''}`} key={product.name}>
              <a href={href} className="sale-favorite-image" aria-label={`View ${product.name}`}>
                <img src={product.image} alt={product.name} />
                {product.discountPercent > 0 && <span className="product-discount-badge">{product.discountPercent}% OFF</span>}
                {soldOut && <b className="sale-sold-out">Sold out</b>}
              </a>
              <p>{product.category}</p>
              <h3><a href={href}>{product.name}</a></h3>
              <div><strong>{product.price}</strong>{product.discountPercent > 0 && <del>{product.originalPrice}</del>}</div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ShopPage() {
  const shop = useSiteContent('shop', { promotion: [{ eyebrow: 'The signature edit', title: 'A little something, just for you.', description: 'Discover handpicked pieces made for gifting, keeping and every meaningful moment between.', buttonLabel: 'Shop the edit', buttonHref: '/shop#sale-favourites', image: 'https://images.unsplash.com/photo-1578632297758-3a6c6de14be8?auto=format&fit=crop&w=2400&q=85' }, { eyebrow: 'New arrivals', title: 'Made for your next chapter.', description: 'Meet the latest jewellery chosen to bring a little beauty to every day.', buttonLabel: 'Discover new pieces', buttonHref: '/shop#categories', image: '/assets/hero/chrisea-jewelry-ring-hero.png' }, { eyebrow: 'The gift edit', title: 'A meaningful gift, beautifully chosen.', description: 'Find keepsakes for celebrations, milestones and the moments in between.', buttonLabel: 'Explore gifts', buttonHref: '/shop#categories', image: '/assets/hero/chrisea-jewelry-bracelet-hero.png' }], favourites: { title: 'Our Favourites', description: 'Four pieces selected especially for you.', productIds: [] }, catalogue: { eyebrow: 'Shop by category', title: 'Find your signature piece', productOrders: { All: [] } } });
  const favourites = shop?.favourites && typeof shop.favourites === 'object' ? shop.favourites : { title: 'Our Favourites', description: 'Four pieces selected especially for you.', productIds: [] };
  const catalogue = shop?.catalogue && typeof shop.catalogue === 'object' ? shop.catalogue : { eyebrow: 'Shop by category', title: 'Find your signature piece', productOrders: { All: [] } };
  const requestedCategory = new URLSearchParams(window.location.search).get('category');
  const catalogueCategories = useCatalogueCategories();
  const { products: catalogueProducts, loading } = useCatalogueProducts();
  const [category, setCategory] = useState(requestedCategory || 'All');
  const favouriteIds = (Array.isArray(favourites.productIds) ? favourites.productIds : []).map(String);
  const selectedFavourites = favouriteIds.map((id) => catalogueProducts.find((product) => String(product.id) === id)).filter(Boolean);
  const favouriteProducts = (selectedFavourites.length ? selectedFavourites : catalogueProducts).slice(0, 4);
  const categoryProducts = category === 'All' ? catalogueProducts : catalogueProducts.filter((product) => product.category === category);
  const savedCategoryOrder = catalogue.productOrders?.[category] || (category === 'All' ? catalogue.productIds : []);
  const orderIds = (Array.isArray(savedCategoryOrder) ? savedCategoryOrder : []).map(String);
  const visibleProducts = [...orderIds.map((id) => categoryProducts.find((product) => String(product.id) === id)).filter(Boolean), ...categoryProducts.filter((product) => !orderIds.includes(String(product.id)))];
  const chooseCategory = (nextCategory) => {
    setCategory(nextCategory);
    const url = new URL(window.location.href);
    if (nextCategory === 'All') url.searchParams.delete('category');
    else url.searchParams.set('category', nextCategory);
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  useEffect(() => {
    const syncCategoryFromUrl = () => setCategory(new URLSearchParams(window.location.search).get('category') || 'All');
    window.addEventListener('popstate', syncCategoryFromUrl);
    return () => window.removeEventListener('popstate', syncCategoryFromUrl);
  }, []);

  return (
    <div className="page-shell shop-page">
      <Header />
      <main>
        <ShopPromotionSlider content={shop.promotion} mobileImages={shop._mobileImages} imageAdjustments={shop._imageAdjustments} />
        <SaleFavorites products={favouriteProducts} content={favourites} />
        <section className="shop-catalog section-pad" id="categories" aria-label="All jewellery">
          <header className="shop-catalog-heading"><p>{catalogue.eyebrow}</p><h2>{catalogue.title}</h2></header>
          <div className="shop-toolbar">
            <div className="shop-filters" aria-label="Filter products by category">
              {['All', ...catalogueCategories].map((item) => (
                <button className={category === item ? 'is-active' : ''} onClick={() => chooseCategory(item)} key={item}>{item}</button>
              ))}
            </div>
            <span>{visibleProducts.length} pieces</span>
          </div>
          <div className="shop-grid">
            {loading && <ProductGridSkeleton />}
            {!loading && !visibleProducts.length && <div className="shop-catalog-message"><Gem /><h3>No active pieces in this category yet.</h3><p>Publish a product from the administration page to show it here.</p></div>}
            {visibleProducts.map((product) => {
              const href = productUrl(product);
              const stock = getProductStock(product);
              const soldOut = stock === 0;
              return (
              <article className={`shop-card data-reveal ${soldOut ? 'is-sold-out' : ''}`} style={{ '--reveal-delay': `${Math.min(visibleProducts.indexOf(product), 8) * 60}ms` }} key={product.id || product.name}>
                <div className="shop-card-image">
                  <a className="shop-image-link" href={href} aria-label={`View ${product.name}`}>
                    <img className="shop-image-primary" src={product.image} alt={product.name} />
                    <img className="shop-image-secondary" src={product.hoverImage} alt="" aria-hidden="true" />
                  </a>
                  {product.discountPercent > 0 && <span className="product-discount-badge">{product.discountPercent}% OFF</span>}
                  {soldOut && <span className="sold-out-badge">Sold out</span>}
                  <button className="quick-add" disabled={soldOut} onClick={(event) => addCartItemAnimated(event, { ...product, stock })}>{soldOut ? 'Sold out' : 'Add to cart'}</button>
                </div>
                <div className="shop-card-copy">
                  <p>{product.category}</p>
                  <h2><a href={href}>{product.name}</a></h2>
                  <span>{product.detail}</span>
                  <div className="shop-card-actions">
                    <strong>{product.price}</strong>{product.discountPercent > 0 && <del>{product.originalPrice}</del>}
                    {typeof stock === 'number' && !soldOut && <small className={stock <= 3 ? 'low-stock-note' : 'stock-note'}>{stock <= 3 ? `Only ${stock} left` : 'In stock'}</small>}
                    <a className="view-product-button" href={href} aria-label={`View ${product.name}`}>View product <span aria-hidden="true">→</span></a>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ProductPage() {
  const slug = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '');
  const { products: catalogueProducts, loading } = useCatalogueProducts();
  const product = catalogueProducts.find((item) => item.slug === slug);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    if (!product) return;
    setSelectedImage(product.imageList[0] || product.image);
    setQuantity(1);
  }, [product?.id, product?.slug]);

  const images = product?.imageList || [];
  const stock = product ? getProductStock(product) : undefined;
  const displayPrice = product?.price;
  const soldOut = stock === 0;
  useEffect(() => {
    if (loading) return undefined;
    if (!product) {
      applySeo({ title: 'Product unavailable | CHRISÉA Jewelry', description: 'This jewellery piece is not currently available.', path: `/product/${encodeURIComponent(slug)}`, robots: 'noindex, follow' });
      return undefined;
    }
    const path = productUrl(product);
    const description = (product.detail || product.description || `Discover ${product.name} from CHRISÉA Jewelry.`).replace(/\s+/g, ' ').slice(0, 160);
    applySeo({ title: `${product.name} | CHRISÉA Jewelry`, description, path, image: product.image, type: 'product' });
    setJsonLd('seo-product-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.imageList.map((image) => image.startsWith('http') ? image : `${SITE_URL}${image}`),
      description,
      sku: product.purchaseVariant?.sku || undefined,
      category: product.category,
      material: product.material || undefined,
      brand: { '@type': 'Brand', name: 'CHRISÉA' },
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}${path}`,
        priceCurrency: 'MYR',
        price: Number(product.numericPrice || 0).toFixed(2),
        availability: soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition'
      }
    });
    setJsonLd('seo-breadcrumb-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
        { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}${path}` }
      ]
    });
    return () => {
      document.getElementById('seo-product-jsonld')?.remove();
      document.getElementById('seo-breadcrumb-jsonld')?.remove();
    };
  }, [loading, product, slug, soldOut]);

  if (loading) {
    return <div className="page-shell product-page"><Header /><ProductDetailSkeleton /><SiteFooter /></div>;
  }

  if (!product) {
    return <div className="page-shell product-page"><Header /><main className="product-state section-pad"><Gem /><p>Piece unavailable</p><h1>This product is not currently published.</h1><a className="button button-dark" href="/shop">Return to the collection <ArrowRight size={15} /></a></main><SiteFooter /></div>;
  }

  const cartProduct = {
    ...product,
    stock,
    price: displayPrice,
    selectedVariantId: product.purchaseVariant?.id || null,
  };

  return (
    <div className="page-shell product-page">
      <Header />
      <main className="product-detail section-pad">
        <div className="product-breadcrumb"><a href="/#top">Home</a><span>/</span><a href="/shop">Shop</a><span>/</span><span>{product.category}</span><span>/</span><b>{product.name}</b></div>
        <section className="product-detail-grid">
          <div className="product-gallery data-reveal" style={{ '--reveal-delay': '0ms' }}>
            <div className="product-thumbnails">
              {images.map((image, index) => (
                <button className={selectedImage === image ? 'is-active' : ''} onClick={() => setSelectedImage(image)} key={`${image}-${index}`}><img src={image} alt={`${product.name} view ${index + 1}`} /></button>
              ))}
            </div>
            <div className="product-main-image"><img src={selectedImage} alt={product.name} />{product.discountPercent > 0 && <span className="product-discount-badge">{product.discountPercent}% OFF</span>}</div>
          </div>
          <div className="product-information data-reveal" style={{ '--reveal-delay': '60ms' }}>
            <p className="product-type">{product.category}</p>
            <h1>{product.name}</h1>
            <p className="product-price">{displayPrice}{product.discountPercent > 0 && <del>{product.originalPrice}</del>}</p>
            {typeof stock === 'number' && <p className={`product-stock-status ${soldOut ? 'sold-out' : stock <= 3 ? 'low' : ''}`}>{soldOut ? 'Sold out' : stock <= 3 ? `Low stock — only ${stock} left` : `In stock — ${stock} available`}</p>}
            <div className="product-divider" />
            <p className="product-summary">{product.description || product.short_description || 'A refined CHRISÉA piece designed to become part of your everyday story.'}</p>
            <dl className="product-specifications">
              {product.material && <div><dt>Material</dt><dd>{product.material}</dd></div>}
              {product.color && <div><dt>Color</dt><dd>{product.color}</dd></div>}
              {product.size && <div><dt>Size</dt><dd>{product.size}</dd></div>}
            </dl>
            <div className="product-purchase-panel">
              <p className="quantity-label">Quantity</p>
              <div className="product-buy-row">
                <div className="quantity-control" aria-label="Quantity"><button disabled={soldOut} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span>{quantity}</span><button disabled={soldOut} onClick={() => setQuantity((value) => Math.min(typeof stock === 'number' ? stock : value + 1, value + 1))}>+</button></div>
                <button className="product-add" disabled={soldOut} onClick={(event) => addCartItemAnimated(event, cartProduct, quantity)}>{soldOut ? 'Sold out' : 'Add to cart'} {!soldOut && <span>— {displayPrice}</span>}</button>
              </div>
              <button className="product-buy-now" disabled={soldOut} onClick={async (event) => {
                const button = event.currentTarget;
                const original = button.innerHTML;
                button.disabled = true;
                button.textContent = 'CHECKING STOCK…';
                try {
                  await addCartItem(cartProduct, quantity);
                  window.location.href = '/cart';
                } catch (error) {
                  button.textContent = error.message;
                  window.setTimeout(() => { if (button.isConnected) { button.innerHTML = original; button.disabled = soldOut; } }, 2200);
                }
              }}>{soldOut ? 'Currently unavailable' : 'Buy it now'} {!soldOut && <ArrowRight />}</button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ReviewsPage() {
  const [rating, setRating] = useState('All');
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, title: '', content: '', website: '' });
  const [reviewStartedAt, setReviewStartedAt] = useState(Date.now());
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const reviewsContent = useSiteContent('reviews', { hero: { eyebrow: 'The CHRISÉA experience', title: 'Loved, Worn & Cherished.', description: 'Stories from our community—because the most meaningful pieces are the ones that become part of your story.', image: 'https://images.unsplash.com/photo-1761479267954-983e006443f7?auto=format&fit=crop&w=2400&q=85' }, feed: { eyebrow: 'Community notes', title: 'In their own words', items: [] }, cta: { eyebrow: 'Your story matters', title: 'A Little Love Note?', description: 'We’d love to hear about your CHRISÉA experience.', buttonLabel: 'Write a review', buttonHref: 'mailto:hello@chrisea.com', image: '/assets/reviews/review-styling.jpg', socialLinks: [{ label: 'Email', value: 'hello@chrisea.com' }] } });
  const reviewHref = reviewButtonMode(reviewsContent.cta) === 'link' ? safeReviewLink(reviewsContent.cta.buttonHref) : null;
  const filters = ['All', '5 Stars', '4 Stars', 'With Photos'];
  useEffect(() => { fetch(`${API_URL}/reviews`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : Promise.reject()).then((result) => setSubmittedReviews(result.data?.reviews || [])).catch(() => {}); }, []);
  useEffect(() => {
    if (!reviewFormOpen) return undefined;
    const scrollPosition = window.scrollY;
    const previous = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => { if (event.key === 'Escape') setReviewFormOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      Object.assign(document.body.style, previous);
      window.scrollTo({ top: scrollPosition, left: 0, behavior: 'auto' });
    };
  }, [reviewFormOpen]);
  const reviews = [...submittedReviews, ...(Array.isArray(reviewsContent.feed.items) ? reviewsContent.feed.items : [])].filter((review) =>
    review?.author?.trim() && review?.title?.trim() && review?.copy?.trim()
  );
  const visibleReviews = reviews.filter((review) => {
    if (rating === 'All') return true;
    if (rating === 'With Photos') return Boolean(review.image);
    return Number(review.rating || 5) === Number(rating[0]);
  });
  const openReviewForm = () => { setReviewStartedAt(Date.now()); setReviewStatus(''); setReviewFormOpen(true); };
  const submitCustomerReview = async (event) => {
    event.preventDefault();
    setReviewSubmitting(true); setReviewStatus('');
    try {
      const response = await fetch(`${API_URL}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...reviewForm, startedAt: reviewStartedAt }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || 'The review could not be submitted.');
      setReviewStatus('Thank you. Your review is now published.');
      setReviewForm({ customerName: '', rating: 5, title: '', content: '', website: '' });
    } catch (error) { setReviewStatus(error.message); }
    finally { setReviewSubmitting(false); }
  };
  return (
    <div className="page-shell reviews-page">
      <Header />
      <main>
        <section className="reviews-hero">
          <ResponsiveContentImage content={reviewsContent} path="hero.image" src={reviewsContent.hero.image} alt="Gold stud earrings presented in a red jewellery box" />
          <div className="reviews-hero-shade" />
          <div className="reviews-hero-copy"><p>{reviewsContent.hero.eyebrow}</p><h1>{reviewsContent.hero.title}</h1><span /><p>{reviewsContent.hero.description}</p></div>
        </section>

        <section className="reviews-feed section-pad">
          <div className="reviews-feed-head"><div><p>{reviewsContent.feed.eyebrow}</p><h2>{reviewsContent.feed.title}</h2></div><span>{reviews.length} customer {reviews.length === 1 ? 'review' : 'reviews'}</span></div>
          <div className="reviews-toolbar" aria-label="Filter reviews">{filters.map((item) => <button className={rating === item ? 'is-active' : ''} onClick={() => setRating(item)} key={item}>{item}</button>)}</div>
          <div className="reviews-grid">
            {visibleReviews.map((review, index) => <article className={`review-card ${review.image ? '' : 'is-text-only'}`} key={review.id || `${review.title}-${index}`}>
              {review.image && <img src={review.image} alt="Customer review" />}
              <div className="review-card-copy"><span className="review-stars">{'★'.repeat(Number(review.rating || 5))}{'☆'.repeat(5 - Number(review.rating || 5))}</span><h3>{review.title}</h3><p>{review.copy}</p><footer><strong>{review.author}</strong><span>● Verified purchase</span></footer></div>
            </article>)}
            {!visibleReviews.length && <div className="reviews-empty"><Heart /><h3>{reviews.length ? 'No reviews match this filter.' : 'Customer stories are coming soon.'}</h3><p>{reviews.length ? 'Choose another rating to see more reviews.' : 'Genuine customer reviews will appear here once they are published.'}</p></div>}
          </div>
        </section>

        <section className="reviews-cta">
          <div className="reviews-cta-image"><ResponsiveContentImage content={reviewsContent} path="cta.image" src={reviewsContent.cta.image} alt="CHRISÉA jewellery styled by our community" /></div>
          <div className="reviews-cta-copy"><p>{reviewsContent.cta.eyebrow}</p><h2>{reviewsContent.cta.title}</h2><span>{reviewsContent.cta.description}</span>{reviewHref ? <a className="reviews-cta-button" href={reviewHref}>{reviewsContent.cta.buttonLabel} <ArrowRight size={14} /></a> : <button className="reviews-cta-button" type="button" onClick={openReviewForm}>{reviewsContent.cta.buttonLabel} <ArrowRight size={14} /></button>}<div className={`reviews-cta-links count-${Math.min(reviewsContent.cta.socialLinks?.length || 0, 3)}`}>{(reviewsContent.cta.socialLinks || []).slice(0, 3).map((link, index) => { const destination = socialHref(link); return destination ? <a href={destination} target={destination.startsWith('http') ? '_blank' : undefined} rel={destination.startsWith('http') ? 'noreferrer' : undefined} key={link.id || `${link.label}-${index}`}><img src={socialIconFor(link.label)} alt="" /><small>{link.label}</small><strong>{link.value}</strong></a> : null; })}</div></div>
        </section>
      </main>
      <SiteFooter />
      {reviewFormOpen && createPortal(<div className="customer-review-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setReviewFormOpen(false)}><form className="customer-review-form" role="dialog" aria-modal="true" aria-labelledby="customer-review-title" onSubmit={submitCustomerReview}><button className="customer-review-close" type="button" onClick={() => setReviewFormOpen(false)} aria-label="Close review form"><X /></button><p>Share your experience</p><h2 id="customer-review-title">Write a review</h2><span>Your review will appear on the Reviews page after it is submitted.</span><div className="customer-review-fields"><label>Your name<input value={reviewForm.customerName} onChange={(event) => setReviewForm((current) => ({ ...current, customerName: event.target.value }))} minLength="2" maxLength="120" required /></label><label>Rating<select value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}>{[5,4,3,2,1].map((value) => <option value={value} key={value}>{value} stars</option>)}</select></label><label className="wide">Review title<input value={reviewForm.title} onChange={(event) => setReviewForm((current) => ({ ...current, title: event.target.value }))} minLength="3" maxLength="150" required /></label><label className="wide">Your review<textarea rows="6" value={reviewForm.content} onChange={(event) => setReviewForm((current) => ({ ...current, content: event.target.value }))} maxLength="2000" required /></label><label className="review-honeypot" aria-hidden="true">Website<input tabIndex="-1" autoComplete="off" value={reviewForm.website} onChange={(event) => setReviewForm((current) => ({ ...current, website: event.target.value }))} /></label></div>{reviewStatus && <p className="customer-review-status">{reviewStatus}</p>}<button className="customer-review-submit" type="submit" disabled={reviewSubmitting}>{reviewSubmitting ? 'Sending…' : 'Submit review'}</button></form></div>, document.body)}
    </div>
  );
}

function CartPage() {
  const isCmsPreview = new URLSearchParams(window.location.search).has('cmsPreview');
  const cartContent = useSiteContent('cart', { hero: { eyebrow: 'Shopping cart', title: 'Your Cart', description: 'Beautiful pieces are just a few steps away.', image: '/assets/cart/cart-hero.jpg' }, recommendations: { eyebrow: 'You might also like', title: 'Complete the Look', productIds: [] }, benefits: { items: [{ title: 'Free shipping', text: 'Orders over RM250' }, { title: 'Beautiful packaging', text: 'Designed with care' }, { title: 'Secure payment', text: 'Your information is safe' }] }, paymentMethods: [{ id: 'touch-n-go-qr', name: "Touch 'n Go QR", kicker: 'DuitNow QR payment', title: 'Scan to complete your payment', information: 'Open your banking or e-wallet app, scan the QR code and complete the transfer.', image: '/assets/payment/duitnow-qr.png', confirmLabel: 'I have paid — continue' }], shippingPrice: 15 });
  const paymentMethods = (Array.isArray(cartContent.paymentMethods) ? cartContent.paymentMethods : []).filter((method) => method?.name?.trim() && (method.image?.trim() || method.information?.trim()));
  const availablePaymentMethods = paymentMethods.length ? paymentMethods : [{ id: 'touch-n-go-qr', name: "Touch 'n Go QR", kicker: 'DuitNow QR payment', title: 'Scan to complete your payment', information: 'Open your banking or e-wallet app, scan the QR code and complete the transfer.', image: '/assets/payment/duitnow-qr.png', confirmLabel: 'I have paid — continue' }];
  const shippingPrice = Math.max(0, Number(cartContent.shippingPrice ?? 15) || 0);
  const [cart, setCart] = useState(() => readCart());
  const [promo, setPromo] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoSuccess, setPromoSuccess] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);
  const [checkout, setCheckout] = useState({ fullName: '', email: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postcode: '', paymentMethod: 'touch-n-go-qr' });
  const [checkoutError, setCheckoutError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [reportingPayment, setReportingPayment] = useState(false);
  const [paymentNoticeError, setPaymentNoticeError] = useState('');
  const selectedPayment = availablePaymentMethods.find((method) => String(method.id) === String(checkout.paymentMethod)) || availablePaymentMethods[0];
  useEffect(() => {
    if (!availablePaymentMethods.some((method) => String(method.id) === String(checkout.paymentMethod))) setCheckout((current) => ({ ...current, paymentMethod: availablePaymentMethods[0].id }));
  }, [cartContent.paymentMethods]);
  const { products: catalogueProducts } = useCatalogueProducts();
  const cartItems = cart.map((item) => {
    const product = catalogueProducts.find((candidate) => candidate.slug === item.slug || candidate.name === item.name);
    if (!product) return null;
    const purchaseVariant = product.purchaseVariant;
    return {
      ...product,
      cartKey: item.key || `${item.slug || item.name}:`,
      quantity: item.quantity,
      variantId: item.variantId || purchaseVariant?.id || null,
      price: product.price,
      stock: product.stock,
    };
  }).filter(Boolean);
  useEffect(() => {
    if (!catalogueProducts.length) return;
    let changed = false;
    const next = clampCartToCatalogue(cart, catalogueProducts);
    changed = JSON.stringify(next) !== JSON.stringify(cart);
    if (changed) {
      setCart(next);
      writeCart(next);
    }
  }, [catalogueProducts]);
  const subtotal = cartItems.reduce((total, item) => total + Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity, 0);
  const total = subtotal * (1 - discount);
  const recommendationIds = (cartContent.recommendations.productIds || []).map(String);
  const availableRecommendations = catalogueProducts.filter((product) => !cart.some((item) => item.slug === product.slug || item.name === product.name));
  const selectedRecommendations = recommendationIds.map((id) => availableRecommendations.find((product) => String(product.id) === id)).filter(Boolean);
  const recommendations = [...selectedRecommendations, ...availableRecommendations.filter((product) => !recommendationIds.includes(String(product.id)))].slice(0, 4);
  const cartBenefits = cartContent.benefits.items || [];
  const syncCart = (next) => { setCart(next); writeCart(next); };
  const updateQuantity = async (key, amount) => {
    const cartItem = cartItems.find((item) => item.cartKey === key);
    if (!cartItem) return;
    if (amount > 0) {
      try {
        setCheckoutError('');
        setCart(await addCartItem({ ...cartItem, selectedVariantId: cartItem.variantId }, amount));
      } catch (error) {
        setCheckoutError(error.message);
      }
      return;
    }
    syncCart(cart.map((item) => (item.key || `${item.slug || item.name}:`) === key ? { ...item, quantity: Math.max(1, Number(item.quantity) + amount) } : item));
  };
  const removeItem = (key) => syncCart(cart.filter((item) => (item.key || `${item.slug || item.name}:`) !== key));
  const addRecommended = async (product) => {
    try { setCart(await addCartItem(product)); } catch (error) { setCheckoutError(error.message); }
  };
  useEffect(() => {
    if (!subtotal || promo.trim()) return;
    let active = true;
    fetch(`${API_URL}/promotions/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subtotal, code: '', phone: checkout.phone }) })
      .then((response) => response.json()).then((result) => {
        if (!active) return;
        if (result.data?.valid) {
          const shipsFree = Boolean(result.data.promotion.free_shipping);
          setDiscount(Number(result.data.discountTotal) / subtotal);
          setFreeShipping(shipsFree);
          setPromoMessage(`${result.data.promotion.name} applied automatically — ${Number(result.data.promotion.discount_value)}% off${shipsFree ? ' + free shipping' : ''}`);
        } else {
          setDiscount(0);
          setFreeShipping(false);
          setPromoMessage('');
        }
      }).catch(() => {});
    return () => { active = false; };
  }, [subtotal, promo, checkout.phone]);
  const applyPromo = async () => {
    const code = promo.trim().toUpperCase();
    if (!code) { setDiscount(0); setFreeShipping(false); setPromoMessage('Enter a promo code'); return; }
    if (checkout.phone.replace(/\D/g, '').length < 7) { setDiscount(0); setFreeShipping(false); setPromoMessage('Enter your phone number first so we can check this promotion.'); return; }
    try {
      const response = await fetch(`${API_URL}/promotions/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subtotal, code, email: checkout.email.trim(), phone: checkout.phone.trim() }) });
      const result = await response.json();
      if (!result.data?.valid) {
        setDiscount(0);
        setFreeShipping(false);
        const promoReasons = {
          INVALID_CODE: 'This promo code does not exist. Please check the spelling and try again.',
          INACTIVE: 'This promo code is currently inactive.',
          NOT_STARTED: `This promo code is not available yet${result.data?.startsAt ? ` — it starts ${new Date(result.data.startsAt).toLocaleString('en-MY')}` : ''}.`,
          EXPIRED: 'This promo code has expired.',
          USAGE_LIMIT_REACHED: 'This promo code has reached its usage limit.',
          MINIMUM_SPEND: `Spend another RM ${Number(result.data?.shortfall || 0).toFixed(2)} to use this promo code (minimum RM ${Number(result.data?.minimumSpend || 0).toFixed(2)}).`,
          FIRST_ORDER_ONLY: 'This promo code is for first-time buyers only. Cancelled or rejected orders do not affect your eligibility.',
          FIRST_ORDER_DETAILS_REQUIRED: 'Enter your phone number first so we can check your first-order eligibility.'
        };
        setPromoMessage(promoReasons[result.data?.reason] || 'This promo code cannot be applied. Please check the offer requirements.');
        return;
      }
      setDiscount(Number(result.data.discountTotal) / Math.max(subtotal, 1));
      const shipsFree = Boolean(result.data.promotion.free_shipping);
      setFreeShipping(shipsFree);
      setPromoMessage(`${code} applied — ${Number(result.data.promotion.discount_value)}% off${shipsFree ? ' + free shipping' : ''}`);
      setPromoSuccess({
        code,
        name: result.data.promotion.name,
        percentage: Number(result.data.promotion.discount_value),
        saving: Number(result.data.discountTotal),
        freeShipping: shipsFree,
      });
    } catch { setDiscount(0); setFreeShipping(false); setPromoMessage('Unable to validate this promo code'); }
  };
  const updateCheckout = (key) => (event) => { setCheckout((current) => ({ ...current, [key]: event.target.value })); setCheckoutError(''); };
  const openPayment = async () => {
    const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postcode'];
    if (required.some((key) => !checkout[key].trim())) { setCheckoutError('Please complete your contact and delivery details.'); return; }
    if (checkout.email && !/^\S+@\S+\.\S+$/.test(checkout.email)) { setCheckoutError('Please enter a valid email address or leave it blank.'); return; }
    if (cartItems.some((item) => !item.variantId)) { setCheckoutError('One of these products needs to be refreshed before checkout.'); return; }
    setPlacingOrder(true);
    setCheckoutError('');
    try {
      const response = await fetch(`${API_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: checkout, paymentMethod: selectedPayment.name, promoCode: promo, items: cartItems.map((item) => ({ variantId: item.variantId, quantity: item.quantity })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'The order could not be placed.');
      const order = result.data.order;
      const receiptItems = order.items.map((line) => {
        const cartItem = cartItems.find((item) => Number(item.variantId) === Number(line.variantId));
        return { ...cartItem, ...line, image: cartItem?.image, detail: cartItem?.detail };
      });
      const receipt = { id: order.orderNumber, orderId: order.id, paymentNoticeToken: order.paymentNoticeToken, placedAt: new Date().toISOString(), items: receiptItems, subtotal: order.subtotal, discount: order.discount / Math.max(order.subtotal, 1), shipping: order.shipping, total: order.total, status: order.status, paymentMethod: selectedPayment.name, paymentImage: selectedPayment.image, paymentInformation: selectedPayment.information, paymentWindowHours: order.paymentWindowHours, paymentExpiresAt: order.paymentExpiresAt };
      window.sessionStorage.setItem('chrisea-latest-receipt', JSON.stringify(receipt));
      catalogueProductsCache = null;
      writeCart([]);
      setPlacedOrder(receipt);
      setPaymentOpen(true);
    } catch (orderError) {
      setCheckoutError(orderError.message);
    } finally {
      setPlacingOrder(false);
    }
  };
  const proceedToReceipt = () => { window.location.href = '/receipt'; };
  const reportPlacedPayment = async () => {
    setReportingPayment(true);
    setPaymentNoticeError('');
    try {
      const updated = await notifyPayment(placedOrder);
      window.sessionStorage.setItem('chrisea-latest-receipt', JSON.stringify(updated));
      proceedToReceipt();
    } catch (error) {
      setPaymentNoticeError(error.message);
    } finally {
      setReportingPayment(false);
    }
  };

  return (
    <div className="page-shell cart-page">
      <Header />
      <main>
        <section className="cart-hero"><ResponsiveContentImage content={cartContent} path="hero.image" src={cartContent.hero.image} alt="CHRISÉA shopping cart banner" /><div className="cart-hero-shade" /><div><p>{cartContent.hero.eyebrow}</p><h1>{cartContent.hero.title}</h1><span /><p>{cartContent.hero.description}</p></div></section>
        <section className="cart-layout section-pad">
          <div className="cart-main">
            {cartItems.length ? <>
              <div className="cart-table-head"><span>Product</span><span>Price</span><span>Quantity</span><span>Total</span></div>
              <div className="cart-items">{cartItems.map((item) => <article className="cart-item" key={item.cartKey}>
                <a href={productUrl(item)}><img src={item.image} alt={item.name} /></a>
                <div className="cart-item-info"><h2>{item.name}</h2><p>{item.detail}</p><span className={item.stock === 0 ? 'sold-out' : ''}>● &nbsp;{item.stock === 0 ? 'Sold out' : `${item.stock} in stock`}</span><div><button onClick={() => removeItem(item.cartKey)}>Remove</button></div></div>
                <strong>{item.price}</strong>
                <div className="cart-quantity"><button onClick={() => updateQuantity(item.cartKey, -1)} aria-label={`Decrease ${item.name} quantity`}>−</button><span>{item.quantity}</span><button disabled={item.quantity >= item.stock} onClick={() => updateQuantity(item.cartKey, 1)} aria-label={`Increase ${item.name} quantity`}>+</button></div>
                <b>RM {(Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}</b>
              </article>)}</div>
            </> : <div className="cart-empty"><p>Your bag is waiting</p><h2>Find something made for your story.</h2><a href="/shop">Explore the collection <ArrowRight size={14} /></a></div>}

            <section className="cart-recommendations"><p>{cartContent.recommendations.eyebrow}</p><h2>{cartContent.recommendations.title}</h2><div>{recommendations.map((product) => <article key={product.id || product.name}><a href={productUrl(product)}><img src={product.image} alt={product.name} />{product.discountPercent > 0 && <span className="product-discount-badge">{product.discountPercent}% OFF</span>}</a><h3>{product.name}</h3><span>{product.price}{product.discountPercent > 0 && <del>{product.originalPrice}</del>}</span><button disabled={product.stock === 0} onClick={(event) => addCartItemAnimated(event, product, 1, setCart)}>{product.stock === 0 ? 'Sold out' : 'Add to cart'}</button></article>)}</div></section>
          </div>

          <aside className="cart-summary"><h2>Order Summary</h2><div className="cart-summary-row"><span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span><strong>RM {subtotal.toFixed(2)}</strong></div>{discount > 0 && <div className="cart-summary-row"><span>Discount</span><strong>− RM {(subtotal * discount).toFixed(2)}</strong></div>}<div className="cart-summary-row"><span>Shipping</span><span>{freeShipping || total >= 200 || shippingPrice === 0 ? 'Complimentary' : `RM ${shippingPrice.toFixed(2)}`}</span></div><div className="cart-summary-total"><span>Total</span><strong>RM {(total + (freeShipping || total >= 200 ? 0 : shippingPrice)).toFixed(2)}</strong></div>
            {cartItems.length && <div className="cart-customer-fields"><h3>Contact &amp; delivery</h3><label>Full name<input value={checkout.fullName} onChange={updateCheckout('fullName')} autoComplete="name" /></label><label>Email <small>Optional</small><input type="email" value={checkout.email} onChange={updateCheckout('email')} autoComplete="email" /></label><label>Phone<input value={checkout.phone} onChange={updateCheckout('phone')} autoComplete="tel" required /></label><label className="full">Address<input value={checkout.addressLine1} onChange={updateCheckout('addressLine1')} autoComplete="address-line1" /></label><label className="full">Address line 2 <small>Optional</small><input value={checkout.addressLine2} onChange={updateCheckout('addressLine2')} autoComplete="address-line2" /></label><label>City<input value={checkout.city} onChange={updateCheckout('city')} autoComplete="address-level2" /></label><label>State<input value={checkout.state} onChange={updateCheckout('state')} autoComplete="address-level1" /></label><label>Postcode<input value={checkout.postcode} onChange={updateCheckout('postcode')} autoComplete="postal-code" /></label><label>Payment<div className="cart-payment-method">Touch 'n Go QR</div></label></div>}
            {(cartItems.length > 0 || isCmsPreview) && <label className="cart-payment-picker">Payment method<select value={checkout.paymentMethod} onChange={updateCheckout('paymentMethod')}>{availablePaymentMethods.map((method, index) => <option value={method.id} key={method.id || index}>{method.name}</option>)}</select>{isCmsPreview && !cartItems.length && <small>Preview only — shown at checkout when the cart has items.</small>}</label>}
            {checkoutError && <p className="cart-checkout-error">{checkoutError}</p>}
            {cartItems.length ? <button className="cart-checkout" type="button" disabled={placingOrder} onClick={openPayment}>{placingOrder ? 'Creating order…' : 'Place order'} <ArrowRight size={14} /></button> : <span className="cart-checkout is-disabled">Your cart is empty</span>}
            <a className="cart-continue" href="/shop">Continue shopping</a>
            <div className="cart-promo"><label htmlFor="promo">Have a promo code?</label><div><input id="promo" value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Enter promo code" /><button onClick={applyPromo}>Apply</button></div>{promoMessage && <p>{promoMessage}</p>}</div>
            <div className="cart-benefits"><div><Truck /><span><strong>{cartBenefits[0]?.title}</strong>{cartBenefits[0]?.text}</span></div><div><Gift /><span><strong>{cartBenefits[1]?.title}</strong>{cartBenefits[1]?.text}</span></div><div><ShieldCheck /><span><strong>{cartBenefits[2]?.title}</strong>{cartBenefits[2]?.text}</span></div></div>
          </aside>
        </section>
      </main>
      {promoSuccess && <div className="promo-success-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPromoSuccess(null); }}>
        <section className="promo-success-modal" role="dialog" aria-modal="true" aria-labelledby="promo-success-title">
          <button className="promo-success-close" type="button" onClick={() => setPromoSuccess(null)} aria-label="Close promotion message"><X /></button>
          <div className="promo-success-seal"><Sparkles /><span>Offer unlocked</span></div>
          <p className="promo-success-kicker">A little gift for you</p>
          <h2 id="promo-success-title">Congratulations!</h2>
          <p className="promo-success-copy">Your promo code has been applied beautifully to this order.</p>
          <div className="promo-success-ticket">
            <span>{promoSuccess.name}</span>
            <strong>{promoSuccess.code}</strong>
            <small>{promoSuccess.percentage}% off{promoSuccess.freeShipping ? ' · Free shipping' : ''} · You save RM {promoSuccess.saving.toFixed(2)}</small>
          </div>
          <button className="promo-success-done" type="button" onClick={() => setPromoSuccess(null)}>Continue checkout <ArrowRight size={14} /></button>
        </section>
      </div>}
      {paymentOpen && createPortal(<div className="qr-payment-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) proceedToReceipt(); }}>
        <section className="qr-payment-modal" role="dialog" aria-modal="true" aria-labelledby="qr-payment-title">
          <button className="qr-payment-close" type="button" onClick={proceedToReceipt} aria-label="View order receipt"><X /></button>
          {selectedPayment.kicker && <p className="qr-payment-kicker">{selectedPayment.kicker}</p>}
          <h2 id="qr-payment-title">{selectedPayment.title || selectedPayment.name}</h2>
          {selectedPayment.information && <p className="qr-payment-copy">{selectedPayment.information}</p>}
          {selectedPayment.image && <div className="qr-payment-code"><img src={selectedPayment.image} alt={`${selectedPayment.name} payment information`} /></div>}
          <div className="qr-payment-total"><span>Amount to transfer · {placedOrder?.id}</span><strong>RM {Number(placedOrder?.total || 0).toFixed(2)}</strong></div>
          {paymentNoticeError && <p role="alert">{paymentNoticeError}</p>}
          <button className="qr-payment-confirm" type="button" disabled={reportingPayment} onClick={reportPlacedPayment}>{reportingPayment ? 'Reporting payment…' : 'I have paid — send for verification'} <ArrowRight size={14} /></button>
          <button className="qr-payment-cancel" type="button" onClick={proceedToReceipt}>Pay later</button>
          <small>Your order is reserved for {placedOrder?.paymentWindowHours || 2} hours. Please pay within this time and share your payment record for verification.</small>
        </section>
      </div>, document.body)}
      <SiteFooter />
    </div>
  );
}

function ReceiptPage() {
  const [receipt, setReceipt] = useState(() => {
    try { return JSON.parse(window.sessionStorage.getItem('chrisea-latest-receipt') || 'null'); } catch { return null; }
  });
  const [shareMessage, setShareMessage] = useState('');
  const [showSharePrompt, setShowSharePrompt] = useState(Boolean(receipt));
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [paymentNoticeError, setPaymentNoticeError] = useState('');
  const [reportingPayment, setReportingPayment] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setCurrentTime(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  const paymentDeadline = receipt?.status === 'pending_verification' ? receipt.reviewExpiresAt : receipt?.paymentExpiresAt;
  const paymentExpired = Boolean(paymentDeadline && currentTime >= new Date(paymentDeadline).getTime());
  const reportReceiptPayment = async () => {
    setReportingPayment(true);
    setPaymentNoticeError('');
    try {
      const updated = await notifyPayment(receipt);
      window.sessionStorage.setItem('chrisea-latest-receipt', JSON.stringify(updated));
      setReceipt(updated);
    } catch (error) {
      setPaymentNoticeError(error.message);
    } finally {
      setReportingPayment(false);
    }
  };
  const placedDate = receipt ? new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(receipt.placedAt)) : '';
  const createReceiptImage = async () => {
    if (!receipt) throw new Error('No receipt');
    const productImages = await Promise.all(receipt.items.map((item) => new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = item.image;
    })));
    const width = 1200;
    const itemHeight = 175;
    const height = 900 + receipt.items.length * itemHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const burgundy = '#430411';
    const ivory = '#f8f3e9';
    ctx.fillStyle = ivory;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(67,4,17,.28)';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, width - 56, height - 56);
    ctx.textAlign = 'center';
    ctx.fillStyle = burgundy;
    ctx.font = '600 18px Montserrat, sans-serif';
    ctx.fillText('ORDER SUMMARY', width / 2, 92);
    ctx.font = '500 60px Georgia, serif';
    ctx.fillText('CHRISÉA Jewellery', width / 2, 165);
    ctx.font = 'italic 25px Georgia, serif';
    ctx.fillText('Order received. Payment pending.', width / 2, 220);
    ctx.beginPath(); ctx.moveTo(90, 260); ctx.lineTo(width - 90, 260); ctx.stroke();
    ctx.textAlign = 'left';
    ctx.font = '600 15px Montserrat, sans-serif';
    ctx.fillText('ORDER NUMBER', 90, 310);
    ctx.fillText('ORDER DATE', 455, 310);
    ctx.fillText('STATUS', 850, 310);
    ctx.font = '28px Georgia, serif';
    ctx.fillText(receipt.id, 90, 350);
    ctx.fillText(placedDate, 455, 350);
    ctx.fillText('Pending payment', 850, 350);
    ctx.beginPath(); ctx.moveTo(90, 390); ctx.lineTo(width - 90, 390); ctx.stroke();
    ctx.font = '500 38px Georgia, serif';
    ctx.fillText('Your pieces', 90, 450);
    let y = 510;
    receipt.items.forEach((item, index) => {
      const lineTotal = Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity;
      const productImage = productImages[index];
      if (productImage) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(90, y - 25, 122, 122);
        ctx.clip();
        const scale = Math.max(122 / productImage.naturalWidth, 122 / productImage.naturalHeight);
        const drawWidth = productImage.naturalWidth * scale;
        const drawHeight = productImage.naturalHeight * scale;
        ctx.drawImage(productImage, 90 + (122 - drawWidth) / 2, y - 25 + (122 - drawHeight) / 2, drawWidth, drawHeight);
        ctx.restore();
        ctx.strokeStyle = 'rgba(67,4,17,.18)';
        ctx.strokeRect(90, y - 25, 122, 122);
      }
      ctx.font = '500 29px Georgia, serif';
      ctx.fillText(item.name, 240, y);
      ctx.font = '20px Montserrat, sans-serif';
      ctx.fillStyle = 'rgba(67,4,17,.72)';
      ctx.fillText(item.detail, 240, y + 38);
      ctx.fillText(`Quantity: ${item.quantity}`, 240, y + 75);
      ctx.textAlign = 'right';
      ctx.fillStyle = burgundy;
      ctx.font = '600 24px Montserrat, sans-serif';
      ctx.fillText(`RM ${lineTotal.toFixed(2)}`, width - 90, y + 32);
      ctx.textAlign = 'left';
      ctx.beginPath(); ctx.moveTo(90, y + 132); ctx.lineTo(width - 90, y + 132); ctx.stroke();
      y += itemHeight;
    });
    ctx.font = '24px Georgia, serif';
    ctx.fillText('Subtotal', 90, y + 20);
    ctx.fillText('Shipping', 90, y + 70);
    ctx.textAlign = 'right';
    ctx.fillText(`RM ${receipt.subtotal.toFixed(2)}`, width - 90, y + 20);
    ctx.fillText(Number(receipt.shipping || 0) > 0 ? `RM ${Number(receipt.shipping).toFixed(2)}` : 'Complimentary', width - 90, y + 70);
    ctx.beginPath(); ctx.moveTo(90, y + 110); ctx.lineTo(width - 90, y + 110); ctx.stroke();
    ctx.textAlign = 'left';
    ctx.font = '500 38px Georgia, serif';
    ctx.fillText('Total', 90, y + 175);
    ctx.textAlign = 'right';
    ctx.font = '500 46px Georgia, serif';
    ctx.fillText(`RM ${receipt.total.toFixed(2)}`, width - 90, y + 175);
    ctx.textAlign = 'center';
    ctx.font = 'italic 25px Georgia, serif';
    ctx.fillText('Thank you for choosing CHRISÉA.', width / 2, height - 85);
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to create receipt image')), 'image/png', 1));
  };
  useEffect(() => {
    if (!receipt) return undefined;
    let active = true;
    let preparedUrl = '';
    createReceiptImage().then((blob) => {
      if (!active) return;
      preparedUrl = URL.createObjectURL(blob);
      setReceiptImageUrl(preparedUrl);
    }).catch(() => setShareMessage('Unable to prepare receipt image'));
    return () => {
      active = false;
      if (preparedUrl) URL.revokeObjectURL(preparedUrl);
    };
  }, [receipt]);
  const triggerReceiptDownload = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `CHRISEA-${receipt.id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const downloadReceipt = async () => {
    if (!receiptImageUrl) return;
    triggerReceiptDownload(receiptImageUrl);
    setShareMessage('Receipt image downloaded');
    window.setTimeout(() => setShareMessage(''), 2800);
  };
  const shareReceipt = () => {
    if (!receipt || !receiptImageUrl) return;
    try {
      triggerReceiptDownload(receiptImageUrl);
      const itemLines = receipt.items.map((item) => `• ${item.name} × ${item.quantity} — RM ${(Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}`);
      const message = [
        'CHRISÉA RECEIPT INFORMATION',
        `Order number: ${receipt.id}`,
        `Order date: ${placedDate}`,
        '',
        ...itemLines,
        '',
        `Subtotal: RM ${receipt.subtotal.toFixed(2)}`,
        `Shipping: ${Number(receipt.shipping || 0) > 0 ? `RM ${Number(receipt.shipping).toFixed(2)}` : 'Complimentary'}`,
        `Total: RM ${receipt.total.toFixed(2)}`,
      ].join('\n');
      const whatsappUrl = `https://wa.me/60167738560?text=${encodeURIComponent(message)}`;
      setShareMessage('Receipt downloaded — opening WhatsApp…');
      window.setTimeout(() => {
        window.location.assign(whatsappUrl);
      }, 700);
    } catch (error) {
      if (error?.name !== 'AbortError') setShareMessage('Unable to share. Please try again.');
    }
    window.setTimeout(() => setShareMessage(''), 2800);
  };
  return (
    <div className="page-shell receipt-page">
      <Header />
      {showSharePrompt && createPortal(<div className="receipt-prompt-backdrop" role="presentation">
        <section className="receipt-prompt" role="dialog" aria-modal="true" aria-labelledby="receipt-prompt-title">
          <button className="receipt-prompt-close" type="button" aria-label="Close" onClick={() => setShowSharePrompt(false)}><X size={18} /></button>
          <span className="receipt-prompt-icon">♡</span>
          <p>Thank you</p>
          <h2 id="receipt-prompt-title">Thank you for shopping with CHRISÉA.</h2>
          <div className="receipt-prompt-rule" />
          <p className="receipt-prompt-copy">Please share your payment record together with this receipt so we can verify your payment and prepare your order.</p>
          <button className="receipt-prompt-share" type="button" disabled={!receiptImageUrl} onClick={() => { setShowSharePrompt(false); shareReceipt(); }}><Share2 size={15} /> {receiptImageUrl ? 'Share receipt' : 'Preparing receipt…'}</button>
        </section>
      </div>, document.body)}
      <main className="receipt-stage">
        {receipt ? <section className="receipt-layout section-pad">
          <article className="receipt-paper">
            <header className="receipt-paper-head"><div><p>Order summary</p><h2>CHRISÉA Jewellery</h2></div><button type="button" disabled={!receiptImageUrl} onClick={shareReceipt}><Share2 size={15} /> {receiptImageUrl ? 'Share order' : 'Preparing…'}</button></header>
            <div className="receipt-status"><span>✓</span><div><p>Order received</p><h2>Payment is pending verification.</h2><small>A copy of these details can be kept for your records.</small></div></div>
            <div className="receipt-meta"><div><span>Order number</span><strong>{receipt.id}</strong></div><div><span>Order date</span><strong>{placedDate}</strong></div><div><span>Payment window</span><strong>{paymentExpired ? 'Expired' : receipt.status === 'pending_verification' ? 'Awaiting verification' : 'Pending payment'}</strong></div></div>
            <section className="receipt-items"><h2>Your pieces</h2>{receipt.items.map((item) => <article key={item.name}><img src={item.image} alt={item.name} /><div><h3>{item.name}</h3><p>{item.detail}</p><span>Quantity: {item.quantity}</span></div><strong>RM {(Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}</strong></article>)}</section>
            <aside className="receipt-summary"><h2>Receipt Summary</h2><div><span>Subtotal</span><strong>RM {receipt.subtotal.toFixed(2)}</strong></div>{receipt.discount > 0 && <div><span>Discount</span><strong>− RM {(receipt.subtotal * receipt.discount).toFixed(2)}</strong></div>}<div><span>Shipping</span><strong>{Number(receipt.shipping || 0) > 0 ? `RM ${Number(receipt.shipping).toFixed(2)}` : 'Complimentary'}</strong></div><footer><span>Total</span><strong>RM {receipt.total.toFixed(2)}</strong></footer></aside>
            {(receipt.paymentImage || receipt.paymentInformation) && <aside className="receipt-payment">{paymentExpired ? <><h2>Payment window expired</h2><p>Please contact CHRISÉA with order number {receipt.id} before making a transfer.</p></> : receipt.status === 'pending_verification' ? <><h2>Payment awaiting verification</h2><p>We received your payment notice. Please share your payment record with CHRISÉA and quote order number {receipt.id}. Payment is confirmed only after our team checks the receiving account.</p></> : <><h2>Complete your payment</h2><p>{receipt.paymentInformation}</p>{receipt.paymentImage && <img src={receipt.paymentImage} alt={`${receipt.paymentMethod} payment code`} />}<p>Transfer RM {Number(receipt.total).toFixed(2)} by {new Date(receipt.paymentExpiresAt).toLocaleString('en-MY')}. Include order number {receipt.id} when sharing your payment record.</p>{receipt.paymentNoticeToken && <button type="button" disabled={reportingPayment} onClick={reportReceiptPayment}>{reportingPayment ? 'Reporting payment…' : 'I have paid — notify the team'}</button>}{paymentNoticeError && <p role="alert">{paymentNoticeError}</p>}</>}</aside>}
            <div className="receipt-paper-footer"><p>Thank you for choosing CHRISÉA.</p><div className="receipt-footer-actions"><button type="button" disabled={!receiptImageUrl} onClick={downloadReceipt}><Download size={14} /> Download receipt</button><a href="/#top"><House size={14} /> Back to home page</a></div></div>
            {shareMessage && <div className="receipt-share-message" role="status">{shareMessage}</div>}
          </article>
        </section> : <section className="receipt-empty section-pad"><p>No recent receipt found.</p><h2>Your next keepsake is waiting.</h2><a href="/shop">Explore the collection <ArrowRight size={14} /></a></section>}
      </main>
      <SiteFooter />
    </div>
  );
}

function App() {
  const home = useSiteContent('home', { hero: [{ eyebrow: 'CHRISÉA / COLLECTION 01', title: 'An Expression of Elegance.', description: 'Discover the beauty in every detail.', buttonLabel: 'Explore Collection', buttonHref: '#new', image: '/assets/hero/chrisea-jewelry-heart-hero.png' }, { eyebrow: 'CHRISÉA / COLLECTION 02', title: 'Timeless Beauty, Modern You.', description: 'Jewelry for every chapter.', buttonLabel: 'Shop Collection', buttonHref: '#new', image: '/assets/hero/chrisea-jewelry-ring-hero.png' }, { eyebrow: 'CHRISÉA / COLLECTION 03', title: 'A Gift That Lasts.', description: 'Celebrate every meaningful moment.', buttonLabel: 'Discover More', buttonHref: '#promotion', image: '/assets/hero/chrisea-jewelry-bracelet-hero.png' }], categories: categoryShowcase, arrivals: { eyebrow: 'New', title: 'New arrivals', description: 'Curated pieces for modern romantics.', buttonLabel: 'View all', productIds: [] }, editorial: { eyebrow: 'The CHRISÉA Edit', title: 'Styled by You.', subtitle: 'Everyday Elegance', description: 'Timeless pieces, effortless looks. See how our jewelry brings a touch of elegance to your everyday moments.' }, story: { eyebrow: 'Our story', title: 'More than jewellery', description: 'CHRISÉA celebrates modern romance through vintage-inspired details, luminous pearls and meaningful motifs. Each piece is selected to feel personal—made for everyday elegance, thoughtful gifts and the milestones worth remembering.', buttonLabel: 'Discover our story', mainImage: `${A}/pearl-turquoise-bracelet/03-lifestyle.png`, detailImage: `${A}/minimalist-pearl-bracelet/03-lifestyle.png` }, promise: { eyebrow: 'The CHRISÉA promise', title: 'Made to be treasured' } });
  const { products: catalogueProducts, loading: productsLoading } = useCatalogueProducts();
  const catalogueCategories = useCatalogueCategories();
  const selectedProductIds = (home.arrivals.productIds || []).map(String);
  const selectedProducts = selectedProductIds.map((id) => catalogueProducts.find((product) => String(product.id) === id)).filter(Boolean);
  const homepageProducts = (selectedProducts.length ? selectedProducts : catalogueProducts).slice(0, 4);
  const editorialIds = (home.editorial.productIds || []).map(String);
  const editorialProducts = (editorialIds.map((id) => catalogueProducts.find((product) => String(product.id) === id)).filter(Boolean).length ? editorialIds.map((id) => catalogueProducts.find((product) => String(product.id) === id)).filter(Boolean) : catalogueProducts.slice(4, 7)).slice(0, 3);
  const promiseItems = home.promise.items || [{ title: 'Thoughtful details', text: 'Vintage-inspired forms, meaningful motifs and a refined finish.' }, { title: 'Gift-ready', text: 'Every order is prepared to make the unboxing feel special.' }, { title: 'Malaysia delivery', text: 'Carefully packed for delivery across our supported locations.' }, { title: 'Personal service', text: 'Order and payment confirmation handled directly via WhatsApp.' }];
  const homepageCategories = (home.categories?.length ? home.categories : catalogueCategories.map((name, index) => categoryShowcase.find((category) => category.name === name) || { name, image: categoryShowcase[index % categoryShowcase.length].image })).slice(0, 4);

  return (
    <div className="page-shell">
      <Header />

      <main>
        <HeroSlider content={home.hero} imageAdjustments={home._imageAdjustments} mobileImages={home._mobileImages} />

        <section className="category-grid section-pad" id="categories" aria-label="Shop by category">
          {homepageCategories.map((category) => (
            <a className="category-card" href={`/shop?category=${category.name}`} key={category.name}>
              <div className="image-wrap"><ResponsiveContentImage content={home} path={`categories.${homepageCategories.indexOf(category)}.image`} src={category.image} alt={`${category.name} collection`} /></div>
              <h2>{category.name}</h2><span>Explore <ArrowRight size={13} /></span>
            </a>
          ))}
        </section>

        <section className="arrivals section-pad" id="new">
          <div className="section-intro">
            <p className="eyebrow dark">{home.arrivals.eyebrow}</p>
            <h2>{home.arrivals.title}</h2>
            <div className="short-rule" />
            <p>{home.arrivals.description}</p>
            <a className="button button-dark" href="/shop">{home.arrivals.buttonLabel} <ArrowRight size={15} /></a>
          </div>
          <div className="product-track" id="products">
            {productsLoading && <div className="shop-catalog-message"><Sparkles /><h3>Preparing new arrivals…</h3></div>}
            {!productsLoading && !homepageProducts.length && <div className="shop-catalog-message"><Gem /><h3>New pieces are coming soon.</h3></div>}
            {homepageProducts.map((product) => { const stock = getProductStock(product); const soldOut = stock === 0; return (
              <article className={`product-card ${soldOut ? 'is-sold-out' : ''}`} key={product.id || product.name}>
                <div className="product-image">
                  <a href={productUrl(product)}><img src={product.image} alt={product.name} /></a>
                  {product.discountPercent > 0 && <span className="product-discount-badge">{product.discountPercent}% OFF</span>}
                  {soldOut && <span className="sold-out-badge">Sold out</span>}
                  <button className="quick-add" disabled={soldOut} onClick={(event) => addCartItemAnimated(event, { ...product, stock })}>{soldOut ? 'Sold out' : 'Add to cart'}</button>
                </div>
                <div className="product-copy"><h3><a href={productUrl(product)}>{product.name}</a></h3><p>{product.detail}</p><span className="product-card-price"><strong>{product.price}</strong>{product.discountPercent > 0 && <del>{product.originalPrice}</del>}</span>{typeof stock === 'number' && <small className={soldOut ? 'sold-out-note' : stock <= 3 ? 'low-stock-note' : 'stock-note'}>{soldOut ? 'Sold out' : stock <= 3 ? `Only ${stock} left` : 'In stock'}</small>}</div>
              </article>
            ); })}
          </div>
        </section>

        <section className="editorial-edit section-pad" id="promotion">
          <div className="editorial-copy">
            <p className="editorial-label">{home.editorial.eyebrow}</p>
            <div className="short-rule" />
            <h2>{home.editorial.title}</h2>
            <h3>{home.editorial.subtitle}</h3>
            <p>{home.editorial.description}</p>
            <a className="button button-dark editorial-cta" href="/shop">Explore collection <ArrowRight size={15} /></a>
            <p className="editorial-signoff">Real moments.<br />Lasting impressions.</p>
          </div>

          {editorialProducts[0] && <a className="editorial-card editorial-card--main" href={productUrl(editorialProducts[0])} aria-label={`View ${editorialProducts[0].name}`}><img src={editorialProducts[0].image} alt={editorialProducts[0].name} /><span className="editorial-card-gradient" /><span className="editorial-product-copy"><small>{editorialProducts[0].category}</small><strong>{editorialProducts[0].name}</strong><em>View product <ArrowRight /></em></span><span className="editorial-product-plus">+</span></a>}

          <div className="editorial-stack">
            {editorialProducts.slice(1, 3).map((product) => <a className="editorial-card" href={productUrl(product)} aria-label={`View ${product.name}`} key={product.id || product.name}><img src={product.image} alt={product.name} /><span className="editorial-card-gradient" /><span className="editorial-product-copy"><small>{product.category}</small><strong>{product.name}</strong><em>View product <ArrowRight /></em></span><span className="editorial-product-plus">+</span></a>)}
          </div>
        </section>

        <section className="story section-pad" id="story">
          <div className="story-copy">
            <p className="eyebrow dark">{home.story.eyebrow}</p>
            <h2>{home.story.title}</h2>
            <div className="short-rule" />
            <p>{home.story.description}</p>
            <a className="button button-dark story-button" href="/about">{home.story.buttonLabel} <ArrowRight size={15} /></a>
            <p className="story-signoff"><span />Every detail tells a story.</p>
          </div>
          <div className="story-collage">
            <div className="story-main-frame">
              <ResponsiveContentImage content={home} path="story.mainImage" className="story-main" src={home.story.mainImage} alt="Pearl and turquoise bracelet styled on the wrist" />
            </div>
            <div className="story-detail-frame">
              <ResponsiveContentImage content={home} path="story.detailImage" className="story-detail" src={home.story.detailImage} alt="Natural pearl bracelet in a warm vintage setting" />
            </div>
            <div className="story-seal">Designed<br />for<br /><b>✦</b><br />every<br />chapter</div>
          </div>
        </section>

        <section className="promise section-pad" id="reviews">
          <div className="promise-heading"><p className="eyebrow dark">{home.promise.eyebrow}</p><h2>{home.promise.title}</h2></div>
          <div className="promise-grid">
            <div><Sparkles /><h3>{promiseItems[0]?.title}</h3><p>{promiseItems[0]?.text}</p></div>
            <div><Gift /><h3>{promiseItems[1]?.title}</h3><p>{promiseItems[1]?.text}</p></div>
            <div><Truck /><h3>{promiseItems[2]?.title}</h3><p>{promiseItems[2]?.text}</p></div>
            <div><ShieldCheck /><h3>{promiseItems[3]?.title}</h3><p>{promiseItems[3]?.text}</p></div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteRouter() {
  const [currentUrl, setCurrentUrl] = useState(() => ({ value: `${window.location.pathname}${window.location.search}${window.location.hash}` }));

  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const pages = {
      '/': ['CHRISÉA Jewelry | Timeless Sterling Silver Jewellery', 'Discover vintage-inspired sterling silver necklaces, rings, earrings and bracelets made for gifting, keeping and every meaningful chapter.'],
      '/shop': ['Shop Sterling Silver Jewellery | CHRISÉA', 'Shop CHRISÉA necklaces, bracelets, rings and earrings in sterling silver, pearls and timeless vintage-inspired details.'],
      '/about': ['Our Story | CHRISÉA Jewelry', 'Meet CHRISÉA, a Malaysian online jewellery house celebrating modern romance through vintage-inspired sterling silver keepsakes.'],
      '/reviews': ['Customer Reviews | CHRISÉA Jewelry', 'Read customer stories and discover how the CHRISÉA community styles and treasures its jewellery.'],
      '/cart': ['Shopping Cart | CHRISÉA Jewelry', 'Review the jewellery in your CHRISÉA shopping cart.', 'noindex, nofollow'],
      '/receipt': ['Order Receipt | CHRISÉA Jewelry', 'Review your CHRISÉA order receipt.', 'noindex, nofollow']
    };
    const page = pages[path];
    if (path === ADMIN_ENTRY_PATH || path === '/admin' || path.startsWith('/admin/')) {
      applySeo({ title: 'Private access | CHRISÉA Jewelry', description: 'Private administrator access.', path, robots: 'noindex, nofollow, noarchive' });
    } else if (path.startsWith('/product/')) {
      applySeo({ title: 'Jewellery | CHRISÉA Jewelry', description: 'Discover this CHRISÉA jewellery piece.', path });
    } else if (page) {
      applySeo({ title: page[0], description: page[1], path, robots: page[2] });
    }
    setJsonLd('seo-organization-jsonld', {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'CHRISÉA Jewelry', alternateName: 'CHRISÉA', url: `${SITE_URL}/`, logo: `${SITE_URL}/icon-512.png` },
        { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: 'CHRISÉA Jewelry', publisher: { '@id': `${SITE_URL}/#organization` }, inLanguage: 'en-MY' },
        { '@type': 'OnlineStore', '@id': `${SITE_URL}/#store`, name: 'CHRISÉA Jewelry', url: `${SITE_URL}/`, image: DEFAULT_SHARE_IMAGE, priceRange: 'RM', currenciesAccepted: 'MYR', areaServed: { '@type': 'Country', name: 'Malaysia' } }
      ]
    });
  }, [currentUrl]);

  useEffect(() => {
    const device = new URLSearchParams(window.location.search).get('cmsDevice');
    document.documentElement.classList.toggle('cms-preview-desktop', device === 'desktop');
    return () => document.documentElement.classList.remove('cms-preview-desktop');
  }, []);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('cmsPreview')) return undefined;
    let retryTimer = null;
    let selectionId = 0;
    const selectors = {
      home: { hero: '.hero-slider', categories: '.category-grid', arrivals: '#new', editorial: '#promotion', story: '#story', promise: '#reviews' },
      shop: { promotion: '.shop-promotion', favourites: '.sale-favorites', catalogue: '.shop-catalog' },
      cart: { hero: '.cart-hero', recommendations: '.cart-recommendations', benefits: '.cart-benefits', general: '.cart-payment-picker' },
      about: { hero: '.about-hero', story: '.about-origin', values: '.about-values', general: '.about-quote', journey: '.about-journey', cta: '.about-cta' },
      reviews: { hero: '.reviews-hero', feed: '.reviews-feed', cta: '.reviews-cta' },
      announcement: { general: '.announcement' },
      footer: { general: '#contact', faq: '.care-modal-panel', shipping: '.care-modal-panel', returns: '.care-modal-panel' }
    };
    const receive = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'chrisea-cms-section') return;
      window.clearTimeout(retryTimer);
      const currentSelection = ++selectionId;
      document.querySelectorAll('.cms-preview-selected').forEach((element) => element.classList.remove('cms-preview-selected'));
      const showSection = (attempt = 0) => {
        if (currentSelection !== selectionId) return;
        const target = document.querySelector(selectors[event.data.page]?.[event.data.section]);
        if (target) {
          target.classList.add('cms-preview-selected');
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempt < 12) {
          retryTimer = window.setTimeout(() => showSection(attempt + 1), 100);
        }
      };
      showSection();
    };
    const blockInteraction = (event) => {
      if (event.target.closest('a,button,input,select,textarea,form')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('message', receive);
    document.addEventListener('click', blockInteraction, true);
    document.addEventListener('submit', blockInteraction, true);
    return () => {
      window.clearTimeout(retryTimer);
      window.removeEventListener('message', receive);
      document.removeEventListener('click', blockInteraction, true);
      document.removeEventListener('submit', blockInteraction, true);
    };
  }, []);

  useEffect(() => {
    const syncUrl = () => setCurrentUrl({ value: `${window.location.pathname}${window.location.search}${window.location.hash}` });
    const navigateInsideSite = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || !['http:', 'https:'].includes(destination.protocol)) return;

      event.preventDefault();
      window.history.pushState({}, '', `${destination.pathname}${destination.search}${destination.hash}`);
      syncUrl();
    };

    document.addEventListener('click', navigateInsideSite);
    window.addEventListener('popstate', syncUrl);
    return () => {
      document.removeEventListener('click', navigateInsideSite);
      window.removeEventListener('popstate', syncUrl);
    };
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const hash = window.location.hash.slice(1);
      const target = hash ? document.getElementById(decodeURIComponent(hash)) : null;
      if (target) target.scrollIntoView();
      else window.scrollTo({ top: 0, left: 0 });
    });
  }, [currentUrl]);

  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, '') === ADMIN_ENTRY_PATH) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.getElementById('root');
    const frame = window.requestAnimationFrame(() => {
      root?.classList.remove('route-enter');
      window.requestAnimationFrame(() => root?.classList.add('route-enter'));
    });

    const images = [...document.querySelectorAll('main img, footer img')];
    images.forEach((image, index) => {
      image.decoding = 'async';
      if (index < 2 || image.closest('.hero-slider, .about-hero, .reviews-hero, .cart-hero, .product-main-image')) {
        image.loading = 'eager';
        if (index === 0) image.fetchPriority = 'high';
      } else {
        image.loading = 'lazy';
        image.fetchPriority = 'low';
      }
    });

    const revealTargets = [...document.querySelectorAll('main > section, main > article, main section > header, .shop-card, .sale-favorite-card, .category-card, .review-card, .editorial-card')];
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealTargets.forEach((element) => element.classList.add('motion-visible'));
      return () => window.cancelAnimationFrame(frame);
    }

    revealTargets.forEach((element, index) => {
      element.classList.add('motion-reveal');
      element.style.setProperty('--motion-order', String(index % 6));
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('motion-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach((element) => observer.observe(element));

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [currentUrl]);

  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  if (currentPath === ADMIN_ENTRY_PATH) return <React.Suspense fallback={<main className="site-error-screen"><p>Secure access</p><h1>Opening the atelier…</h1></main>}><AdminApp /></React.Suspense>;
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    return <main className="site-error-screen"><img src="/assets/brand/chrisea-logo-full-transparent.png" alt="CHRISÉA Jewelry" /><p>404</p><h1>This page does not exist.</h1><div><a href="/">Return to boutique</a></div></main>;
  }
  return currentPath.startsWith('/product/') ? <ProductPage /> : currentPath.startsWith('/shop') ? <ShopPage /> : currentPath.startsWith('/about') ? <AboutPage /> : currentPath.startsWith('/reviews') ? <ReviewsPage /> : currentPath.startsWith('/cart') ? <CartPage /> : currentPath.startsWith('/receipt') ? <ReceiptPage /> : <App />;
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('CHRISÉA page error', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="site-error-screen"><img src="/assets/brand/chrisea-logo-full-transparent.png" alt="CHRISÉA Jewelry" /><p>Something interrupted the page.</p><h1>Let’s reopen the atelier.</h1><div><button onClick={() => window.location.reload()}>Try again</button><a href="/">Return to boutique</a></div></main>;
  }
}

createRoot(document.getElementById('root')).render(<AppErrorBoundary><SiteRouter /></AppErrorBoundary>);


