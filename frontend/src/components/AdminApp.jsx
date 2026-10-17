import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowUpRight, BarChart3, Bell, Boxes, ChevronDown, ChevronRight, ChevronUp, CircleDollarSign,
  CircleHelp, ClipboardCheck, Diamond, Eye, EyeOff, Gem, Heart, LayoutDashboard, LockKeyhole,
  ImagePlus, LogOut, Mail, Menu, Package, PackageOpen, Plus, Search, ShoppingBag,
  RotateCcw, SlidersHorizontal, Sparkles, Tag, Trash2, UserRound, Users, X
} from 'lucide-react';
import './admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'chrisea-admin-access';
let accessToken = null;

function storeToken(token) {
  accessToken = token;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

function readToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  return accessToken;
}

function clearToken() {
  accessToken = null;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

function requestAdminConfirmation({ eyebrow = 'Please confirm', title, message, confirmLabel = 'Confirm' }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'admin-confirm-backdrop';
    const modal = document.createElement('section');
    modal.className = 'admin-confirm-modal';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    const close = document.createElement('button');
    close.className = 'admin-confirm-close'; close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', 'Close confirmation');
    const icon = document.createElement('span'); icon.className = 'admin-confirm-icon'; icon.textContent = '!';
    const kicker = document.createElement('p'); kicker.textContent = eyebrow;
    const heading = document.createElement('h2'); heading.textContent = title;
    const rule = document.createElement('div'); rule.className = 'admin-confirm-rule';
    const copy = document.createElement('p'); copy.className = 'admin-confirm-copy'; copy.textContent = message;
    const actions = document.createElement('div'); actions.className = 'admin-confirm-actions';
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Keep it';
    const confirm = document.createElement('button'); confirm.type = 'button'; confirm.className = 'danger'; confirm.textContent = confirmLabel;
    actions.append(cancel, confirm); modal.append(close, icon, kicker, heading, rule, copy, actions); backdrop.append(modal); document.body.append(backdrop);
    const finish = (value) => { document.removeEventListener('keydown', onKeyDown); backdrop.remove(); resolve(value); };
    const onKeyDown = (event) => { if (event.key === 'Escape') finish(false); };
    close.addEventListener('click', () => finish(false)); cancel.addEventListener('click', () => finish(false)); confirm.addEventListener('click', () => finish(true));
    backdrop.addEventListener('mousedown', (event) => { if (event.target === backdrop) finish(false); }); document.addEventListener('keydown', onKeyDown); confirm.focus();
  });
}

async function refreshAuthentication() {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    signal: AbortSignal.timeout(12000)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.data?.user?.role !== 'admin' || !data?.data?.accessToken) {
    clearToken();
    throw new Error('Your administrator session has expired.');
  }
  storeToken(data.data.accessToken);
  return data.data;
}

async function api(path, options = {}) {
  const { retryAuth = true, ...requestOptions } = options;
  const token = readToken();
  const canRetry = !requestOptions.method || requestOptions.method === 'GET';
  const attempts = canRetry ? 3 : 1;
  let response;
  let connectionError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      response = await fetch(`${API_URL}${path}`, {
        credentials: 'include',
        ...requestOptions,
        signal: requestOptions.signal || AbortSignal.timeout(12000),
        headers: {
          ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...requestOptions.headers
        }
      });
      if (response.status < 500 || attempt === attempts - 1) break;
    } catch (error) {
      connectionError = error;
      if (attempt === attempts - 1) break;
    }
    await new Promise((resolve) => window.setTimeout(resolve, attempt === 0 ? 300 : 800));
  }
  if (!response) {
    if (connectionError?.name === 'TimeoutError' || connectionError?.name === 'AbortError') throw new Error('The admin server took too long to respond. Please try again.');
    throw new Error('The admin server is briefly unavailable. Retrying the page usually restores it.');
  }
  if (response.status === 401 && retryAuth && !path.startsWith('/auth/')) {
    await refreshAuthentication();
    return api(path, { ...requestOptions, retryAuth: false });
  }
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Something went wrong.');
    error.status = response.status;
    throw error;
  }
  return data?.data;
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api('/auth/admin/login', {
        method: 'POST',
        retryAuth: false,
        body: JSON.stringify({ email, password })
      });
      if (result.user.role !== 'admin') {
        await api('/auth/logout', { method: 'POST' });
        throw new Error('This account does not have administrator access.');
      }
      storeToken(result.accessToken);
      onLogin(result.user);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login">
      <section className="admin-login-story">
        <div className="admin-login-brand">
          <img src="/assets/brand/chrisea-logo-full-transparent.png" alt="CHRISÉA Jewelry" />
        </div>
        <div className="admin-login-copy">
          <p>CHRISÉA Atelier</p>
          <h1>Every detail,<br /><em>beautifully managed.</em></h1>
          <i />
          <span>Your private space to manage<br />your collection, orders and clients.</span>
          <div className="admin-login-features">
            <div><PackageOpen /><p><strong>Manage Products</strong><small>Curate your collection</small></p></div>
            <div><ShoppingBag /><p><strong>Review Orders</strong><small>Follow every purchase</small></p></div>
            <div><UserRound /><p><strong>Client Care</strong><small>Keep customer details organised</small></p></div>
            <div><Diamond /><p><strong>Inventory</strong><small>Protect every precious piece</small></p></div>
          </div>
        </div>
      </section>
      <section className="admin-login-panel">
        <form onSubmit={submit}>
          <div className="admin-login-mark"><Sparkles /><span>EST. 2026</span></div>
          <p className="admin-kicker">Welcome back</p>
          <h2>Sign in to the atelier</h2>
          <p className="admin-login-intro">Manage the collection and care for every CHRISÉA order.</p>
          <label>Email address<span className="admin-input"><Mail /><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} autoComplete="username" placeholder="Enter your email" required /></span></label>
          <label>Password<span className="admin-input"><LockKeyhole /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} autoComplete="current-password" placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
          <div className="admin-login-options"><label><input type="checkbox" /> <span>Keep me signed in</span></label><button type="button" disabled>Forgot password?</button></div>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Enter dashboard'} <ArrowUpRight /></button>
          <div className="admin-login-divider"><i /><span>Secure administrator access</span><i /></div>
          <a href="/"><ArrowLeft /> Return to boutique</a>
        </form>
      </section>
    </main>
  );
}

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Gem },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'promotions', label: 'Promotions', icon: CircleDollarSign },
  { id: 'content', label: 'Website Content', icon: ImagePlus }
];

function Sidebar({ page, setPage, open, setOpen, user, onLogout }) {
  return <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
    <button className="admin-sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button>
    <a className="admin-brand" href="/"><img src="/assets/brand/chrisea-logo-full-transparent.png" alt="CHRISÉA Jewelry" /></a>
    <nav>{navItems.map(({ id, label, icon: Icon, soon }) => <button key={id} className={page === id || (id === 'products' && ['add-product', 'product-detail'].includes(page)) ? 'active' : ''} disabled={soon} onClick={() => { setPage(id); setOpen(false); }}><Icon /><span>{label}</span>{soon ? <small>Soon</small> : <ChevronRight />}</button>)}</nav>
    <div className="admin-sidebar-message"><p>Every detail,<br />beautifully managed.</p><a href="/">View store <ArrowUpRight /></a></div>
    <div className="admin-sidebar-foot"><span>{user.full_name.slice(0, 1)}</span><div><strong>{user.full_name}</strong><small>Administrator</small></div><button onClick={onLogout} aria-label="Sign out"><LogOut /></button></div>
  </aside>;
}

const overviewGuide = [
  { page: 'dashboard', selector: '.admin-sales', eyebrow: 'Commercial performance', title: 'Read your sales first', copy: 'Total sales tells you the revenue earned in the last 30 days. Compare it with total orders, average order value and sales growth to see whether customers are buying more—and spending more per order.' },
  { page: 'dashboard', selector: '.admin-sales-trend', eyebrow: 'Revenue movement', title: 'Spot the sales pattern', copy: 'Use Daily for recent activity, Weekly for short-term performance and Monthly for the bigger picture. Peaks show strong selling periods; dips help you decide when a promotion may be useful.' },
  { page: 'dashboard', selector: '.admin-category-sales', eyebrow: 'Collection decisions', title: 'See what customers prefer', copy: 'Sales by category compares Earrings, Rings, Necklaces and your other collections. Use it to decide which category deserves more stock or new designs.' },
  { page: 'dashboard', selector: '.admin-payment-sales', eyebrow: 'Checkout behaviour', title: 'Understand payment choices', copy: 'This shows how customers paid and the revenue from each method. It helps you check whether Bank Transfer, card or another option is most useful to your customers.' },
  { page: 'dashboard', selector: '.admin-top-products', eyebrow: 'Best sellers', title: 'Restock proven pieces', copy: 'Your five strongest products appear here. Use this list with Low stock pieces to prioritise restocking before a popular item sells out.' },
];

const productGuideBase = [
  { page: 'products', selector: '.admin-product-summary', eyebrow: 'Your catalogue', title: 'Know your product collection', copy: 'These cards show how many pieces are saved, currently live in the boutique, held in inventory and running low on stock.' },
  { page: 'products', selector: '[data-guide="categories"]', eyebrow: 'Storefront navigation', title: 'Create and manage Categories', copy: 'Add a category here before assigning products to it. A saved category becomes a category customers can browse on the storefront, such as Earrings, Rings or Necklaces.' },
  { page: 'products', selector: '[data-guide="add-product"]', eyebrow: 'Create a new piece', title: 'Open Add Product', copy: 'Add Product opens the complete product editor. The next steps explain every section before you enter any information.' },
  { page: 'add-product', selector: '.admin-images-card', eyebrow: 'Add product · Images', title: 'Begin with product photography', copy: 'Upload up to 10 images. The first image becomes the main storefront image; the remaining images form the product gallery.' },
  { page: 'add-product', selector: '.admin-basic-card', eyebrow: 'Add product · Information', title: 'Name and describe the piece', copy: 'The name identifies the product, Category controls where it appears in the shop, and Status decides whether it is a Draft or visible as Active. Descriptions tell its story on the storefront.' },
  { page: 'add-product', selector: '.admin-pricing-card', eyebrow: 'Add product · Pricing', title: 'Set the customer price', copy: 'Enter the selling price in Ringgit. This price is displayed on product cards, the product page, cart and receipt.' },
  { page: 'add-product', selector: '.admin-inventory-card', eyebrow: 'Add product · Inventory', title: 'Track SKU and stock', copy: 'SKU is the unique internal code for the piece. Stock controls how many customers can buy and updates the storefront availability immediately.' },
  { page: 'add-product', selector: '.admin-details-card', eyebrow: 'Add product · Details', title: 'Complete the product details', copy: 'Material, colour and size are shown on the customer product page. Use clear details so customers know exactly what they are purchasing.' },
];

const orderGuideAvailable = [
  { page: 'orders', selector: '.admin-order-summary', eyebrow: 'Order health', title: 'Understand the order summary', copy: 'See total orders, order value, payments needing attention and fulfilled orders before working through the ledger.' },
  { page: 'orders', selector: '.admin-orders-table tbody tr:first-child .admin-inline-status', eyebrow: 'Payment and delivery progress', title: 'Change the Payment Status', copy: 'Open this status menu to move an order from Payment Pending to Payment Confirmed, then Shipped. Cancelled orders return their purchased quantity to stock.' },
  { page: 'orders', selector: '.admin-orders-table tbody tr:first-child .admin-receipt-button', eyebrow: 'Customer purchase record', title: 'Open the original Receipt', copy: 'Receipt opens the same styled purchase record created for the storefront order. Review the customer, purchased pieces, delivery address, totals and payment information without leaving this page.' },
];
const orderGuideEmpty = [{ page: 'orders', selector: '.admin-orders-panel', eyebrow: 'Tutorial unavailable', title: 'No orders', copy: 'There is no order to demonstrate yet. Place a storefront order first, then return here to learn Payment Status and Receipt actions.' }];
const promotionGuide = [
  { page: 'promotions', selector: '.admin-promotion-summary', eyebrow: 'Offer performance', title: 'Understand your promotions', copy: 'These cards show how many offers exist, which are active or scheduled, and how often customers have used them.' },
  { page: 'promotions', selector: '[data-guide="promo-code"]', eyebrow: 'Customer-entered offer', title: 'Create a Promo Code', copy: 'A Promo Code gives customers a code such as CHRISEA10. They enter it in the promo-code field in the storefront shopping cart and press Apply to receive the discount.' },
  { page: 'promotions', selector: '[data-guide="storewide"]', eyebrow: 'Automatic boutique offer', title: 'Create a Storewide Discount', copy: 'A Storewide Discount applies automatically to every eligible cart during its active dates. Customers do not enter a code, making it ideal for boutique-wide sales.' },
  { page: 'promotions', selector: '.admin-promotion-ledger', eyebrow: 'Offer control', title: 'Manage active promotions', copy: 'Review every offer here, switch it Active or Inactive, see usage count and permanently remove a promotion that has finished.' },
];
const contentGuide = [
  { page: 'content', selector: '.admin-content-tabs', eyebrow: 'Choose a storefront page', title: 'Start with the page tabs', copy: 'Choose Home, About, Shop, Cart, Reviews, Announcement bar or Footer. The editor loads that page and its editable sections.' },
  { page: 'content', selector: '.admin-site-preview', eyebrow: 'See before publishing', title: 'Check the live preview', copy: 'The preview shows the page while you edit it. Switch between Desktop and Mobile, or open the full page in a new tab to inspect it at normal size.' },
  { page: 'content', selector: '.admin-visual-controls', eyebrow: 'Edit the selected section', title: 'Change words, images and products', copy: 'Choose a section, then update its fields. The preview moves to the matching section so you can see exactly what you are changing.' },
  { page: 'content', selector: '[data-guide="publish-content"]', eyebrow: 'Send changes to the storefront', title: 'Publish when everything looks right', copy: 'Your edits stay in this editor until you choose Publish changes. Publishing saves the page and makes the latest content available on the customer storefront.' },
];

function AdminTour({ item, step, total, onBack, onNext, onClose }) {
  const cardRef = useRef(null);
  const dragRef = useRef(null);
  const manuallyPositionedRef = useRef(false);
  const [cardPosition, setCardPosition] = useState({ right: 30, bottom: 30 });
  const [cardInFront, setCardInFront] = useState(true);
  useEffect(() => {
    manuallyPositionedRef.current = false;
    const positionCard = () => {
      if (manuallyPositionedRef.current) return;
      const target = document.querySelector(item.selector);
      const card = cardRef.current;
      if (!target || !card) return;
      const targetBox = target.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      const gap = 24;
      const edge = window.innerWidth > 760 ? 256 : 16;
      let left;
      let top;
      if (targetBox.right + gap + cardBox.width <= window.innerWidth - 16) {
        left = targetBox.right + gap;
        top = targetBox.top + (targetBox.height - cardBox.height) / 2;
      } else if (targetBox.left - gap - cardBox.width >= edge) {
        left = targetBox.left - gap - cardBox.width;
        top = targetBox.top + (targetBox.height - cardBox.height) / 2;
      } else if (targetBox.bottom + gap + cardBox.height <= window.innerHeight - 16) {
        left = targetBox.left + (targetBox.width - cardBox.width) / 2;
        top = targetBox.bottom + gap;
      } else {
        left = targetBox.left + (targetBox.width - cardBox.width) / 2;
        top = targetBox.top - gap - cardBox.height;
      }
      setCardPosition({
        left: Math.max(edge, Math.min(left, window.innerWidth - cardBox.width - 16)),
        top: Math.max(16, Math.min(top, window.innerHeight - cardBox.height - 16)),
      });
    };
    const frame = window.requestAnimationFrame(positionCard);
    const retry = window.setTimeout(positionCard, 320);
    window.addEventListener('resize', positionCard);
    window.addEventListener('scroll', positionCard, true);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(retry); window.removeEventListener('resize', positionCard); window.removeEventListener('scroll', positionCard, true); };
  }, [item.selector, step]);
  const startDrag = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const box = cardRef.current?.getBoundingClientRect();
    if (!box) return;
    dragRef.current = { x: event.clientX - box.left, y: event.clientY - box.top };
    manuallyPositionedRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setCardInFront(true);
  };
  const dragWindow = (event) => {
    if (!dragRef.current || !cardRef.current) return;
    const box = cardRef.current.getBoundingClientRect();
    const edge = window.innerWidth > 760 ? 256 : 16;
    setCardPosition({
      left: Math.max(edge, Math.min(event.clientX - dragRef.current.x, window.innerWidth - box.width - 16)),
      top: Math.max(16, Math.min(event.clientY - dragRef.current.y, window.innerHeight - box.height - 16)),
    });
  };
  const stopDrag = (event) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };
  useEffect(() => {
    setCardInFront(true);
    const target = document.querySelector(item.selector);
    if (!target) return undefined;
    const showTarget = (event) => { event.preventDefault(); event.stopPropagation(); setCardInFront(false); };
    target.addEventListener('pointerdown', showTarget, true);
    return () => target.removeEventListener('pointerdown', showTarget, true);
  }, [item.selector, step]);
  return <><div className="admin-tour-shade" aria-hidden="true" /><div className={`admin-tour-layer ${cardInFront ? 'message-in-front' : 'target-in-front'}`} role="presentation">
    <section ref={cardRef} className="admin-tour-card" style={cardPosition} onPointerDown={() => setCardInFront(true)} role="dialog" aria-modal="true" aria-labelledby="admin-tour-title">
      <button className="admin-tour-close" type="button" onClick={onClose} aria-label="Close guide"><X /></button>
      <div className="admin-tour-progress" onPointerDown={startDrag} onPointerMove={dragWindow} onPointerUp={stopDrag} onPointerCancel={stopDrag}><span>Page tutorial · drag to move</span><strong>{step + 1} / {total}</strong></div>
      <div className="admin-tour-dots" style={{ gridTemplateColumns: `repeat(${total},1fr)` }}>{Array.from({ length: total }, (_, index) => <i className={index <= step ? 'active' : ''} key={index} />)}</div>
      <p>{item.eyebrow}</p><h2 id="admin-tour-title">{item.title}</h2><div className="admin-tour-rule" /><span>{item.copy}</span>
      <button className="admin-tour-window-hint" type="button" onClick={() => setCardInFront((value) => !value)}>{cardInFront ? 'Click the highlighted area to view it in front' : 'Bring this tutorial window to front'}</button>
      <footer><button type="button" className="skip" onClick={onClose}><X /> Close</button><button type="button" className="back" disabled={step === 0} onClick={onBack}><ArrowLeft /> Back</button><button type="button" className="next" onClick={onNext}>{step === total - 1 ? 'Finish' : 'Next'} {step < total - 1 && <ArrowUpRight />}</button></footer>
    </section>
  </div><button className="admin-tour-swap" type="button" onClick={() => setCardInFront((value) => !value)} aria-label={cardInFront ? 'Show highlighted content in front' : 'Show tutorial in front'} title={cardInFront ? 'Show highlighted content in front' : 'Show tutorial in front'}>{cardInFront ? <Eye /> : <EyeOff />}</button></>;
}

const money = (value) => `RM ${Number(value || 0).toFixed(2)}`;
const statusLabel = (status) => status?.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const detailValue = (description = '', labels = []) => {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return description.match(new RegExp(`^(?:${escaped})\\s*:\\s*(.+)$`, 'im'))?.[1]?.trim() || '';
};
const descriptionWithoutDetails = (description = '') => description
  .split(/\r?\n/)
  .filter((line) => !/^\s*(material|colou?r|size|ring size|bracelet length|chain length|type|pearl size|ring type)\s*:/i.test(line))
  .join('\n')
  .trim();

function Dashboard({ data, setPage, onStartGuide }) {
  const [salesPeriod, setSalesPeriod] = useState('daily');
  const stats = [
    { label: 'Products', value: data.summary.products, note: 'Pieces in your catalogue', icon: Gem },
    { label: 'Total stock', value: data.summary.stock, note: 'Across all active pieces', icon: Boxes },
    { label: 'Orders', value: data.summary.orders, note: `${data.summary.payments_to_review} payments to review`, icon: ShoppingBag },
    { label: 'Customers', value: data.summary.customers, note: 'Registered client accounts', icon: Users }
  ];
  const sales = data.sales?.[salesPeriod] || [];
  const rawChartValues = sales.length ? sales.map((item) => Number(item.revenue)) : [0, 0, 0, 0, 0, 0, 0];
  const chartValues = rawChartValues.length === 1 ? [rawChartValues[0], rawChartValues[0]] : rawChartValues;
  const chartMax = Math.max(...chartValues, 1);
  const chartPoints = chartValues.map((value, index) => `${(index / Math.max(chartValues.length - 1, 1)) * 100},${92 - (value / chartMax) * 72}`).join(' ');
  const chartLabel = (value) => new Intl.DateTimeFormat('en-MY', salesPeriod === 'monthly' ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' }).format(new Date(value));
  const categoryTotal = (data.categorySales || []).reduce((sum, item) => sum + Number(item.revenue), 0);
  const paymentTotal = (data.paymentSales || []).reduce((sum, item) => sum + Number(item.orders), 0);
  const growth = Number(data.summary.sales_growth || 0);
  return <>
    <section className="admin-welcome"><div><p>Atelier overview</p><h1>Good day, <em>CHRISÉA.</em></h1><span>A considered view of your boutique today.</span></div><div className="admin-heading-tools"><button type="button" className="admin-page-guide" onClick={onStartGuide}><CircleHelp /> Overview tutorial</button><div className="admin-date"><small>{new Intl.DateTimeFormat('en-MY', { weekday: 'long' }).format(new Date())}</small><strong>{new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'long' }).format(new Date())}</strong></div></div></section>
    <section className="admin-stats">{stats.map(({ label, value, note, icon: Icon }) => <article key={label}><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><Icon /></article>)}</section>
    <section className="admin-dashboard-grid">
      <article className="admin-card admin-sales"><header><div><p>Commercial performance</p><h2>Sales overview</h2></div><span>Last 30 days</span></header><div className="admin-sales-metrics"><div><strong>{money(data.summary.total_sales)}</strong><span>Total sales</span></div><div><strong>{data.summary.orders}</strong><span>Total orders</span></div><div><strong>{money(data.summary.average_order_value)}</strong><span>Average order value</span></div><div><strong className={growth >= 0 ? 'positive' : 'negative'}>{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</strong><span>Sales growth</span></div></div></article>
      <article className="admin-card admin-sales-trend"><header><div><p>Revenue movement</p><h2>Sales trend</h2></div><div className="admin-period-tabs">{['daily','weekly','monthly'].map((period) => <button className={salesPeriod === period ? 'active' : ''} key={period} onClick={() => setSalesPeriod(period)}>{period}</button>)}</div></header><div className="admin-chart"><div className="admin-chart-scale"><span>{money(chartMax)}</span><span>{money(chartMax / 2)}</span><span>RM 0</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6d1325" stopOpacity=".24"/><stop offset="1" stopColor="#6d1325" stopOpacity="0"/></linearGradient></defs><polygon points={`0,100 ${chartPoints} 100,100`} fill="url(#salesFill)"/><polyline points={chartPoints} fill="none" stroke="#6d1325" strokeWidth="1.25" vectorEffect="non-scaling-stroke"/></svg><div className="admin-chart-labels"><small>{sales.length ? chartLabel(sales[0].sale_date) : 'No sales yet'}</small><small>{sales.length ? chartLabel(sales[sales.length - 1].sale_date) : 'Today'}</small></div></div></article>
      <article className="admin-card admin-category-sales"><header><div><p>Collection mix</p><h2>Sales by category</h2></div><span>Last 30 days</span></header><div className="admin-breakdown-list">{data.categorySales?.length ? data.categorySales.map((item) => { const percentage = categoryTotal ? Number(item.revenue) / categoryTotal * 100 : 0; return <div key={item.name || 'Uncategorised'}><p><strong>{item.name || 'Uncategorised'}</strong><span>{money(item.revenue)} · {percentage.toFixed(0)}%</span></p><i><b style={{ width: `${percentage}%` }} /></i></div>; }) : <div className="admin-empty"><BarChart3 /><p>Category sales will appear here.</p></div>}</div></article>
      <article className="admin-card admin-payment-sales"><header><div><p>Payment mix</p><h2>Sales by payment method</h2></div><span>Last 30 days</span></header><div className="admin-payment-list">{data.paymentSales?.length ? data.paymentSales.map((item) => { const percentage = paymentTotal ? Number(item.orders) / paymentTotal * 100 : 0; return <div key={item.payment_method}><span>{statusLabel(item.payment_method)}</span><strong>{percentage.toFixed(0)}%</strong><small>{item.orders} orders · {money(item.revenue)}</small></div>; }) : <div className="admin-empty"><CircleDollarSign /><p>Payment activity will appear here.</p></div>}</div></article>
      <article className="admin-card admin-recent"><header><h2>Recent orders</h2><button onClick={() => setPage('orders')}>View all <ArrowUpRight /></button></header>{data.recentOrders.length ? <div>{data.recentOrders.map((order) => <div className="admin-order-row" key={order.id}><div><strong>{order.order_number}</strong><small>{order.full_name}</small></div><b>{money(order.grand_total)}</b><span className={`admin-status ${order.status}`}>{statusLabel(order.status)}</span></div>)}</div> : <div className="admin-empty"><ShoppingBag /><p>Your first order will appear here.</p></div>}</article>
      <article className="admin-card admin-low-stock"><header><h2>Low stock pieces</h2><button onClick={() => setPage('products')}>View all <ArrowUpRight /></button></header>{data.lowStock.length ? <div>{data.lowStock.slice(0, 4).map((item) => <div className="admin-stock-row" key={item.sku}><img src={item.image_url} alt="" /><div><strong>{item.name}</strong><small>{item.sku}</small></div><b>{item.stock_quantity} left</b></div>)}</div> : <div className="admin-empty"><ClipboardCheck /><p>Every piece is well stocked.</p></div>}</article>
      <article className="admin-card admin-top-products"><header><div><p>Best sellers</p><h2>Top selling products</h2></div><span>Top 5 · Last 30 days</span></header>{data.topProducts?.length ? <div>{data.topProducts.map((item, index) => <div className="admin-stock-row" key={item.name}><b className="admin-rank">0{index + 1}</b><img src={item.image_url} alt="" /><div><strong>{item.name}</strong><small>{item.units} units ordered</small></div></div>)}</div> : <div className="admin-empty"><Gem /><p>Sales will reveal your top pieces.</p></div>}</article>
      <article className="admin-collection-card"><div><Sparkles /><h2>Add new collection</h2><p>Keep your boutique fresh with new pieces.</p><button onClick={() => setPage('add-product')}><Tag /> Add product</button></div></article>
    </section>
  </>;
}

function AddProductPage({ initialProduct = null, categories = [], onCancel, onCreated }) {
  const isEditing = Boolean(initialProduct);
  const categoryNames = [...new Set([...(categories.map((category) => category.name)), initialProduct?.category].filter(Boolean))];
  const initialStockRecord = initialProduct?.variants?.find((variant) => variant.is_active) || initialProduct?.variants?.[0];
  const [form, setForm] = useState({
    name: initialProduct?.name || '',
    category: initialProduct?.category || categoryNames[0] || '',
    price: initialProduct?.base_price || '',
    discountPercent: initialProduct?.discount_percent || 0,
    status: initialProduct?.status || 'draft',
    description: descriptionWithoutDetails(initialProduct?.description || ''),
    shortDescription: initialProduct?.short_description || '',
    material: initialProduct?.material || detailValue(initialProduct?.description, ['Material']),
    color: initialProduct?.color || detailValue(initialProduct?.description, ['Color', 'Colour']),
    size: initialProduct?.size || detailValue(initialProduct?.description, ['Size', 'Ring Size', 'Bracelet Length', 'Chain Length']),
  });
  const [inventory, setInventory] = useState({ id: initialStockRecord?.id, sku: initialStockRecord?.sku || '', stockQuantity: initialStockRecord?.stock_quantity ?? '' });
  const [images, setImages] = useState(() => initialProduct?.images?.map((image) => ({ name: image.alt_text || 'Product image', url: image.image_url })) || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const updateInventory = (key) => (event) => setInventory((current) => ({ ...current, [key]: event.target.value }));
  const setCoverImage = (index) => setImages((current) => [current[index], ...current.filter((_, itemIndex) => itemIndex !== index)]);
  const uploadImages = async (event) => {
    const selected = [...event.target.files].slice(0, Math.max(0, 10 - images.length));
    if (!selected.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of selected) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Only JPG, PNG and WebP images are supported.');
        if (file.size > 5 * 1024 * 1024) throw new Error('Each image must be 5 MB or smaller.');
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('The image could not be read.'));
          reader.readAsDataURL(file);
        });
        const result = await api('/admin/product-images', { method: 'POST', body: JSON.stringify({ filename: file.name, dataUrl }), signal: AbortSignal.timeout(60000) });
        uploaded.push({ name: file.name, url: result.imageUrl });
      }
      setImages((current) => [...current, ...uploaded].slice(0, 10));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const stockRecord = { ...(inventory.id ? { id: inventory.id } : {}), sku: inventory.sku, variantName: 'Default', price: form.price, stockQuantity: inventory.stockQuantity, isActive: true };
      const payload = { ...form, sku: inventory.sku, variantName: 'Default', stockQuantity: inventory.stockQuantity, imageUrls: images.map((image) => image.url), variants: [stockRecord] };
      await api(isEditing ? `/admin/products/${initialProduct.id}` : '/admin/products', { method: isEditing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      await onCreated();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };
  const previewDiscount = Math.max(0, Math.min(100, Number(form.discountPercent) || 0));
  const previewOriginalPrice = Number(form.price) || 0;
  const previewSalePrice = previewOriginalPrice * (1 - previewDiscount / 100);
  return <section className="admin-add-product-page">
    <form id="add-product-form" onSubmit={submit}>
      <div className="admin-add-breadcrumb"><button type="button" onClick={onCancel}>Products</button><ChevronRight /><span>{isEditing ? `Edit ${initialProduct.name}` : 'Add new product'}</span></div>
      <header className="admin-add-header"><div><h1>{isEditing ? 'Edit Product' : 'Add New Product'}</h1><p>{isEditing ? 'Update this piece, its photographs, details and stock.' : 'Create a beautiful piece and its inventory details.'}</p></div><div><button className="admin-cancel-product" type="button" onClick={onCancel}>Cancel</button><button className="admin-save-page" type="submit" disabled={saving || uploading}>{saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Product'}</button></div></header>
      {error && <p className="admin-add-error"><AlertTriangle /> {error}</p>}
      <div className="admin-add-layout">
        <div className="admin-add-left">
          <article className="admin-form-card admin-images-card"><header><div><h2>Product Images</h2><p>Upload up to 10 photographs and choose the storefront cover. Images are stored in Cloudinary as WebP.</p></div><span>{images.length} / 10 images</span></header><div className="admin-image-workspace"><label className={`admin-upload-tile ${uploading ? 'is-uploading' : ''}`}><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadImages} disabled={uploading || images.length >= 10} /><ImagePlus /><strong>{uploading ? 'Uploading…' : 'Upload images'}</strong><span>Click to choose JPG, PNG or WebP files · Max 5 MB each · Converted to WebP</span></label>{images.map((image, index) => <div className="admin-product-preview" key={image.url}><img src={image.url} alt={`Product preview ${index + 1}`} />{index === 0 ? <b>Cover</b> : <button className="admin-set-cover" type="button" onClick={() => setCoverImage(index)}>Set cover</button>}<button type="button" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${image.name}`}><X /></button></div>)}{images.length < 2 && <label className="admin-empty-image"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadImages} disabled={uploading} /><Plus /><span>Add another</span></label>}</div></article>
          <article className="admin-form-card admin-basic-card"><header><div><h2>Basic Information</h2></div></header><div className="admin-page-form-grid"><label className="full">Product name <b>*</b><input autoFocus value={form.name} onChange={update('name')} placeholder="e.g. Étoile Pearl Necklace" required minLength="2" /></label><label>Category <b>*</b><select value={form.category} onChange={update('category')} required>{categoryNames.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label>Status<select value={form.status} onChange={update('status')}><option value="draft">Draft</option><option value="active">Active</option>{isEditing && <option value="archived">Archived</option>}</select></label><label className="full">Description<textarea value={form.description} onChange={update('description')} placeholder="Tell the story behind this piece — materials, inspiration, craftsmanship…" rows="5" /></label><label className="full">Short description<textarea value={form.shortDescription} onChange={update('shortDescription')} placeholder="A brief highlight for product cards and listings." rows="2" maxLength="500" /><small>{form.shortDescription.length} / 500</small></label></div></article>
        </div>
        <div className="admin-add-right">
          <article className="admin-form-card admin-pricing-card"><header><div><h2>Pricing</h2><p>Set the original price and an optional product discount.</p></div></header><div className="admin-stack-fields"><label>Original price (RM) <b>*</b><input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} placeholder="0.00" required /></label><label>Discount (%)<input type="number" min="0" max="100" step="1" value={form.discountPercent} onChange={update('discountPercent')} /></label>{previewDiscount > 0 && <div className="admin-discount-result"><span>Discounted price</span><strong>{money(previewSalePrice)}</strong><del>{money(previewOriginalPrice)}</del></div>}</div></article>
          <article className="admin-form-card admin-inventory-card"><header><div><h2>Inventory</h2><p>Stock belongs to this product and updates the storefront immediately.</p></div></header><div className="admin-stack-fields"><label>SKU <b>*</b><input value={inventory.sku} onChange={updateInventory('sku')} placeholder="CHR-RNG-003" required /></label><label>Stock <b>*</b><input type="number" min="0" step="1" value={inventory.stockQuantity} onChange={updateInventory('stockQuantity')} placeholder="0" required /></label></div></article>
          <article className="admin-form-card admin-details-card"><header><div><h2>Product Details</h2><p>These details are highlighted on the storefront product page.</p></div></header><div className="admin-stack-fields"><label>Material<input value={form.material} onChange={update('material')} placeholder="e.g. S925 Sterling Silver" /></label><label>Color<input value={form.color} onChange={update('color')} placeholder="e.g. Vintage Gold" /></label><label>Size<input value={form.size} onChange={update('size')} placeholder="e.g. Adjustable open ring, approx. US size 16" /></label></div></article>
          <article className="admin-form-card admin-storefront-card-preview"><header><div><h2>Storefront Card Preview</h2><p>This is how the product appears to customers.</p></div></header><div className="admin-preview-product-card"><div>{images[0] ? <img src={images[0].url} alt="Product cover preview" /> : <span><ImagePlus />Choose a cover image</span>}{previewDiscount > 0 && <b>{previewDiscount}% OFF</b>}</div><small>{form.category || 'Category'}</small><h3>{form.name || 'Product name'}</h3><p>{form.shortDescription || 'Short product description'}</p><footer>{previewDiscount > 0 ? <><strong>{money(previewSalePrice)}</strong><del>{money(previewOriginalPrice)}</del></> : <strong>{money(previewOriginalPrice)}</strong>}</footer></div></article>
        </div>
      </div>
    </form>
  </section>;
}

function CategoryManager({ initialCategories, onClose }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const addCategory = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await api('/admin/categories', { method: 'POST', body: JSON.stringify({ name }) });
      setCategories((current) => [...current, result.category].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
    } catch (addError) { setError(addError.message); }
    finally { setSaving(false); }
  };

  const removeCategory = async (category) => {
    setDeletingId(category.id);
    setError('');
    try {
      await api(`/admin/categories/${category.id}`, { method: 'DELETE' });
      setCategories((current) => current.filter((item) => item.id !== category.id));
    } catch (deleteError) { setError(deleteError.message); }
    finally { setDeletingId(null); }
  };

  return <div className="admin-category-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="admin-category-modal" role="dialog" aria-modal="true" aria-labelledby="category-title"><header><div><p>Catalogue settings</p><h2 id="category-title">Manage Categories</h2><span>Add new collections or remove categories from future product listings.</span></div><button type="button" onClick={onClose} aria-label="Close categories"><X /></button></header><form onSubmit={addCategory}><label>New category name<input value={name} onChange={(event) => { setName(event.target.value); setError(''); }} placeholder="e.g. Pendants" minLength="2" maxLength="100" required /></label><button type="submit" disabled={saving}>{saving ? 'Adding…' : <><Plus /> Add Category</>}</button></form>{error && <p className="admin-category-error"><AlertTriangle /> {error}</p>}<div className="admin-category-list"><div className="admin-category-list-head"><span>Existing categories</span><small>{categories.length} active</small></div>{categories.map((category) => <article key={category.id}><div><Tag /><p><strong>{category.name}</strong><small>{category.product_count} {Number(category.product_count) === 1 ? 'product' : 'products'}</small></p></div><button type="button" onClick={() => removeCategory(category)} disabled={deletingId === category.id || categories.length <= 1}><Trash2 /> {deletingId === category.id ? 'Removing…' : 'Delete'}</button></article>)}</div><footer><p>Deleting safely removes the category from new product choices. Existing products keep their information.</p><button type="button" onClick={onClose}>Done</button></footer></section></div>;
}

function RecycleBinModal({ type, onClose, onRestored }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const isOrders = type === 'orders';
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    api(`/admin/${isOrders ? 'orders-trash' : 'products-trash'}`).then((result) => setItems(result[isOrders ? 'orders' : 'products'])).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKeyDown); };
  }, [isOrders, onClose]);
  const restore = async (item) => {
    setRestoringId(item.id); setError('');
    try { await api(`/admin/${isOrders ? 'orders' : 'products'}/${item.id}/restore`, { method: 'PATCH' }); setItems((current) => current.filter((entry) => entry.id !== item.id)); await onRestored(); }
    catch (restoreError) { setError(restoreError.message); }
    finally { setRestoringId(null); }
  };
  const permanentlyDelete = async (item) => {
    if (!await requestAdminConfirmation({ eyebrow: 'Permanent deletion', title: `Delete ${isOrders ? item.order_number : item.name}?`, message: 'This item will be removed permanently and cannot be restored.', confirmLabel: 'Delete forever' })) return;
    setDeletingId(item.id); setError('');
    try { await api(`/admin/${isOrders ? 'orders' : 'products'}/${item.id}/permanent`, { method: 'DELETE' }); setItems((current) => current.filter((entry) => entry.id !== item.id)); await onRestored(); }
    catch (deleteError) { setError(deleteError.message); }
    finally { setDeletingId(null); }
  };
  return <div className="admin-trash-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="admin-trash-modal" role="dialog" aria-modal="true" aria-labelledby="trash-title"><header><div><span><Trash2 /></span><p>Safely stored</p><h2 id="trash-title">{isOrders ? 'Order' : 'Product'} recycle bin</h2><small>Restore anything removed by mistake.</small></div><button type="button" onClick={onClose} aria-label="Close recycle bin"><X /></button></header>{error && <p className="admin-trash-error"><AlertTriangle /> {error}</p>}<div className="admin-trash-list">{loading ? <div className="admin-trash-empty"><Sparkles /><p>Opening the recycle bin…</p></div> : items.length ? items.map((item) => <article key={item.id}>{!isOrders && <img src={item.image_url} alt="" />}<div><strong>{isOrders ? item.order_number : item.name}</strong><small>{isOrders ? <>{item.full_name} · {money(item.grand_total)}<br />{item.item_count} items · {statusLabel(item.payment_method)} · {orderStatusText[item.status] || statusLabel(item.status)}<br />Ordered {new Date(item.created_at).toLocaleString('en-MY')}<br />Deleted {new Date(item.deleted_at).toLocaleString('en-MY')}</> : money(item.base_price)}</small></div><div className="admin-trash-actions"><button type="button" disabled={restoringId === item.id || deletingId === item.id} onClick={() => restore(item)}><RotateCcw /> {restoringId === item.id ? 'Restoring…' : 'Restore'}</button><button className="permanent" type="button" disabled={deletingId === item.id || restoringId === item.id} onClick={() => permanentlyDelete(item)}><Trash2 /> {deletingId === item.id ? 'Deleting…' : 'Delete forever'}</button></div></article>) : <div className="admin-trash-empty"><Trash2 /><h3>The recycle bin is empty</h3><p>Deleted {isOrders ? 'orders' : 'products'} will stay here until restored.</p></div>}</div><footer><button type="button" onClick={onClose}>Done</button></footer></section></div>;
}

function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return <nav className="admin-pagination" aria-label="Pagination"><button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => onChange(page + 1)}>Next</button></nav>;
}

function PromotionModal({ mode, promotion, onClose, onCreated }) {
  const now = new Date(); const later = new Date(now.getTime() + 30 * 86400000);
  const local = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const editing = Boolean(promotion);
  const automatic = editing ? Boolean(promotion.apply_automatically) : mode === 'automatic';
  const [form, setForm] = useState({ name: promotion?.name || '', code: promotion?.code || '', discountValue: promotion?.discount_value ?? 10, minimumSpend: promotion?.minimum_spend ?? 0, startsAt: promotion?.starts_at ? local(new Date(promotion.starts_at)) : local(now), endsAt: promotion?.ends_at ? local(new Date(promotion.ends_at)) : local(later), applyAutomatically: automatic, firstOrderOnly: Boolean(promotion?.first_order_only), usageLimit: promotion?.usage_limit ?? '', isActive: promotion ? Boolean(promotion.is_active) : true });
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  useEffect(() => { const close = (event) => { if (event.key === 'Escape') onClose(); }; document.body.style.overflow = 'hidden'; window.addEventListener('keydown', close); return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', close); }; }, [onClose]);
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); try { await api(editing ? `/admin/promotions/${promotion.id}` : '/admin/promotions', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) }); await onCreated(); onClose(); } catch (submitError) { setError(submitError.message); } finally { setSaving(false); } };
  return <div className="admin-promo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-promo-modal" role="dialog" aria-modal="true" aria-labelledby="promo-modal-title">
      <header><div><span>{automatic ? <Sparkles /> : <Tag />}</span><p>{automatic ? 'Boutique-wide event' : 'Private offer code'}</p><h2 id="promo-modal-title">{editing ? 'Edit promotion' : automatic ? 'Create storewide discount' : 'Create promo code'}</h2><small>{editing ? 'Update the offer information and customer usage limit.' : automatic ? 'Every eligible cart receives this discount automatically.' : 'Customers enter this code at checkout to receive the offer.'}</small></div><button type="button" onClick={onClose} aria-label="Close promotion form"><X /></button></header>
      <form className="admin-promotion-form" onSubmit={submit}>
        <label>Promotion name<input value={form.name} onChange={update('name')} placeholder={automatic ? 'e.g. Anniversary boutique sale' : 'e.g. VIP welcome offer'} required /></label>
        {!automatic && <label>Promo code<input value={form.code} onChange={update('code')} placeholder="e.g. CHRISEA15" required /></label>}
        <div className="admin-promo-grid"><label>Discount (%)<input type="number" min="1" max="100" value={form.discountValue} onChange={update('discountValue')} required /></label><label>Minimum spend (RM)<input type="number" min="0" value={form.minimumSpend} onChange={update('minimumSpend')} /></label><label>Usage limit<input type="number" min="1" step="1" value={form.usageLimit} onChange={update('usageLimit')} placeholder="Unlimited" /><small>Leave empty for unlimited uses.</small></label><label>Starts<input type="datetime-local" value={form.startsAt} onChange={update('startsAt')} required /></label><label>Ends<input type="datetime-local" value={form.endsAt} onChange={update('endsAt')} required /></label></div>
        {!automatic && <label className="admin-promo-rule"><input type="checkbox" checked={form.firstOrderOnly} onChange={update('firstOrderOnly')} /><span><strong>First order only</strong><small>Block customers with an existing non-cancelled order.</small></span></label>}
        <label className="admin-promo-rule"><input type="checkbox" checked={form.isActive} onChange={update('isActive')} /><span><strong>Promotion active</strong><small>Customers can use this offer during its scheduled dates.</small></span></label>
        {error && <p className="admin-form-error">{error}</p>}
        <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save promotion' : automatic ? 'Launch storewide discount' : 'Create promo code'}</button></footer>
      </form>
    </section>
  </div>;
}

function Promotions({ promotions = [], onChanged, onStartGuide }) {
  const [modal, setModal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const toggle = async (promotion) => { await api(`/admin/promotions/${promotion.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !promotion.is_active }) }); await onChanged(); };
  const remove = async (promotion) => { if (!await requestAdminConfirmation({ eyebrow: 'Delete promotion', title: `Delete ${promotion.name}?`, message: 'This promotion will be removed permanently and customers will no longer be able to use it.', confirmLabel: 'Delete promotion' })) return; setDeletingId(promotion.id); try { await api(`/admin/promotions/${promotion.id}`, { method: 'DELETE' }); await onChanged(); } finally { setDeletingId(null); } };
  const currentTime = Date.now();
  const active = promotions.filter((item) => item.is_active && new Date(item.starts_at).getTime() <= currentTime && new Date(item.ends_at).getTime() >= currentTime).length;
  const scheduled = promotions.filter((item) => item.is_active && new Date(item.starts_at).getTime() > currentTime).length;
  const uses = promotions.reduce((sum, item) => sum + Number(item.usage_count || 0), 0);
  return <section className="admin-promotions-page"><div className="admin-page-heading"><div><p>Sales atelier</p><h1>Promotion studio</h1><span>Plan every offer, code and boutique-wide event from one considered space.</span></div><div className="admin-page-actions"><button className="admin-page-guide" onClick={onStartGuide}><CircleHelp /> Promotions tutorial</button><button data-guide="promo-code" className="admin-secondary" onClick={() => setModal({ mode: 'code' })}><Tag /> Create promo code</button><button data-guide="storewide" className="admin-primary" onClick={() => setModal({ mode: 'automatic' })}><Sparkles /> Storewide discount</button></div></div><div className="admin-promotion-summary"><article><CircleDollarSign /><div><span>Total promotions</span><strong>{promotions.length}</strong></div></article><article><ClipboardCheck /><div><span>Active now</span><strong>{active}</strong></div></article><article><Sparkles /><div><span>Scheduled</span><strong>{scheduled}</strong></div></article><article><Tag /><div><span>Total uses</span><strong>{uses}</strong></div></article></div><div className="admin-promotion-list admin-promotion-ledger"><header><div><p>Offer portfolio</p><h2>All promotions</h2></div><span>{promotions.length} offers</span></header>{promotions.length ? promotions.map((promotion) => <article key={promotion.id}><div className="admin-promo-kind">{promotion.apply_automatically ? <Sparkles /> : <Tag />}</div><div><span>{promotion.apply_automatically ? 'Storewide automatic' : promotion.code}</span><h3>{promotion.name}</h3><p>{Number(promotion.discount_value)}% off · Minimum {money(promotion.minimum_spend)}</p><small>{new Date(promotion.starts_at).toLocaleString('en-MY')} — {new Date(promotion.ends_at).toLocaleString('en-MY')}</small></div><div className="admin-promo-usage"><span>Uses</span><strong>{promotion.usage_count}{promotion.usage_limit ? ` / ${promotion.usage_limit}` : ''}</strong></div><div className="admin-promo-actions"><button onClick={() => setModal({ mode: promotion.apply_automatically ? 'automatic' : 'code', promotion })}><SlidersHorizontal /> Edit</button><button className={promotion.is_active ? 'is-active' : ''} onClick={() => toggle(promotion)}>{promotion.is_active ? 'Active' : 'Inactive'}</button><button className="delete" disabled={deletingId === promotion.id} onClick={() => remove(promotion)} aria-label={`Delete ${promotion.name}`}><Trash2 /></button></div></article>) : <div className="admin-promo-empty"><CircleDollarSign /><h3>No promotions yet</h3><p>Create a promo code or launch a storewide discount to begin.</p></div>}</div>{modal && <PromotionModal mode={modal.mode} promotion={modal.promotion} onClose={() => setModal(null)} onCreated={onChanged} />}</section>;
}

function Products({ products = [], categories = [], onAdd, onView, onCategoriesChanged, onDeleted, onStartGuide }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [adjustingStockId, setAdjustingStockId] = useState(null);
  const [page, setPage] = useState(1);
  const categoryNames = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(), [products]);
  const filtered = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.category} ${product.slug}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === 'all' || product.category === category) && (status === 'all' || product.status === status);
  }), [products, query, category, status]);
  const active = products.filter((product) => product.status === 'active').length;
  const totalStock = products.reduce((sum, product) => sum + Number(product.stock_quantity || 0), 0);
  const lowStock = products.filter((product) => Number(product.stock_quantity || 0) <= 3).length;
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const visibleProducts = filtered.slice((page - 1) * 10, page * 10);
  useEffect(() => setPage(1), [query, category, status]);
  const removeProduct = async (product) => {
    if (!await requestAdminConfirmation({ eyebrow: 'Product collection', title: `Move ${product.name}?`, message: 'This product will leave the storefront and move to the recycle bin. You can restore it later.', confirmLabel: 'Move to recycle bin' })) return;
    setDeletingId(product.id);
    try { await api(`/admin/products/${product.id}`, { method: 'DELETE' }); await onDeleted(); }
    finally { setDeletingId(null); }
  };
  const adjustStock = async (product, delta) => {
    if (delta < 0 && Number(product.stock_quantity) <= 0) return;
    setAdjustingStockId(product.id);
    try { await api(`/admin/products/${product.id}/stock`, { method: 'PATCH', body: JSON.stringify({ delta }) }); await onDeleted(); }
    finally { setAdjustingStockId(null); }
  };
  return <section className="admin-products-page">
    <div className="admin-page-heading"><div><p>Atelier catalogue</p><h1>Product collection</h1><span>Curate every piece and its stock level in one place.</span></div><div className="admin-page-actions"><button className="admin-page-guide" onClick={onStartGuide}><CircleHelp /> Products tutorial</button><button className="admin-secondary" onClick={() => setTrashOpen(true)}><Trash2 /> Recycle bin</button><button data-guide="categories" className="admin-secondary" onClick={() => setCategoryManagerOpen(true)}><Tag /> Manage categories</button><button data-guide="add-product" className="admin-primary" onClick={onAdd}><Package /> Add product</button></div></div>
    <div className="admin-product-summary">
      <article><Gem /><div><span>All pieces</span><strong>{products.length}</strong></div></article>
      <article><Sparkles /><div><span>Live in boutique</span><strong>{active}</strong></div></article>
      <article><Boxes /><div><span>Total inventory</span><strong>{totalStock}</strong></div></article>
      <article className={lowStock ? 'needs-attention' : ''}><AlertTriangle /><div><span>Low stock</span><strong>{lowStock}</strong></div></article>
    </div>
    <div className="admin-catalogue-panel">
      <div className="admin-catalogue-head"><div><p>Collection inventory</p><h2>All products</h2></div><span>{filtered.length} of {products.length} pieces</span></div>
      <div className="admin-toolbar admin-product-toolbar">
        <label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, category or handle" /></label>
        <div className="admin-product-filters"><SlidersHorizontal /><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categoryNames.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
      </div>
      <div className="admin-table-wrap admin-product-table"><table><thead><tr><th>Piece</th><th>Category</th><th>Price</th><th>Inventory</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{visibleProducts.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><span className="admin-product-thumb"><img src={product.image_url} alt={product.name} />{Number(product.discount_percent) > 0 && <b>{Number(product.discount_percent)}% OFF</b>}</span><div><strong>{product.name}</strong><small>/{product.slug}</small></div></div></td><td>{product.category || 'Uncategorised'}</td><td><strong className="admin-product-price">{money(product.base_price)}</strong></td><td><div className="admin-stock-stepper"><button type="button" disabled={adjustingStockId === product.id || Number(product.stock_quantity) <= 0} onClick={() => adjustStock(product, -1)} aria-label={`Reduce ${product.name} stock`}>−</button><strong className={Number(product.stock_quantity) <= 3 ? 'stock-empty' : ''}>{product.stock_quantity}</strong><button type="button" disabled={adjustingStockId === product.id} onClick={() => adjustStock(product, 1)} aria-label={`Increase ${product.name} stock`}>+</button><span>in stock</span></div></td><td><span className={`admin-status ${product.status}`}>{statusLabel(product.status)}</span></td><td><div className="admin-row-actions"><button className="admin-delete-action" type="button" disabled={deletingId === product.id} onClick={() => removeProduct(product)} aria-label={`Delete ${product.name}`}><Trash2 /></button><button className="admin-row-action" onClick={() => onView(product.id)} aria-label={`Edit ${product.name}`}><ChevronRight /></button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="admin-product-empty"><Search /><h3>No matching pieces</h3><p>Try a different search or clear a filter.</p></div>}</div><Pagination page={page} pages={pages} onChange={setPage} />
    </div>{categoryManagerOpen && <CategoryManager initialCategories={categories} onClose={() => { setCategoryManagerOpen(false); onCategoriesChanged(); }} />}{trashOpen && <RecycleBinModal type="products" onClose={() => setTrashOpen(false)} onRestored={onDeleted} />}
  </section>;
}

const orderStatusOptions = ['pending_payment', 'payment_confirmed', 'shipped', 'cancelled'];
const orderStatusText = { pending_payment: 'Payment Pending', payment_confirmed: 'Payment Confirmed', shipped: 'Shipped', cancelled: 'Cancelled' };

function OrderReceiptModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    api(`/admin/orders/${orderId}`)
      .then(({ order: result }) => setOrder(result))
      .catch((loadError) => setError(loadError.message));
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKeyDown); };
  }, [orderId, onClose]);

  return <div className="admin-receipt-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-store-receipt-modal receipt-page" role="dialog" aria-modal="true" aria-labelledby="admin-receipt-title">
      <button className="admin-store-receipt-close" type="button" onClick={onClose} aria-label="Close receipt"><X /></button>
      {error && <p className="admin-receipt-error"><AlertTriangle /> {error}</p>}
      {!order && !error && <div className="admin-receipt-loading"><Sparkles /><span>Preparing receipt…</span></div>}
      {order && <article className="receipt-paper"><header className="receipt-paper-head"><div><p>Official receipt</p><h2 id="admin-receipt-title">CHRISÉA Jewellery</h2></div></header><div className="receipt-status"><span>✓</span><div><p>Order received</p><h2>Your order is confirmed.</h2><small>A copy of these details can be kept for your records.</small></div></div><div className="receipt-meta"><div><span>Order number</span><strong>{order.order_number}</strong></div><div><span>Order date</span><strong>{new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(order.created_at))}</strong></div><div><span>Status</span><strong>{orderStatusText[order.status] || statusLabel(order.status)}</strong></div></div><section className="receipt-items"><h2>Your pieces</h2>{order.items.map((item) => <article key={item.id}>{item.image_url && <img src={item.image_url} alt={item.product_name} />}<div><h3>{item.product_name}</h3><p>{item.short_description || item.variant_name}</p><span>Quantity: {item.quantity}</span></div><strong>{money(item.line_total)}</strong></article>)}</section><aside className="receipt-summary"><h2>Receipt Summary</h2><div><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div>{Number(order.discount_total) > 0 && <div><span>Discount</span><strong>− {money(order.discount_total)}</strong></div>}<div><span>Shipping</span><strong>{Number(order.shipping_total) > 0 ? money(order.shipping_total) : 'Complimentary'}</strong></div><footer><span>Total</span><strong>{money(order.grand_total)}</strong></footer></aside><div className="receipt-paper-footer"><p>Thank you for choosing CHRISÉA.</p></div></article>}
    </section>
  </div>;
}

function Orders({ orders = [], onChanged, onStartGuide }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [receiptOrderId, setReceiptOrderId] = useState(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const filtered = orders.filter((order) => {
    const matchesQuery = `${order.order_number} ${order.full_name} ${order.recipient_phone || ''} ${order.email || ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === 'all' || order.status === status);
  });
  const revenue = orders.filter((order) => !['cancelled', 'payment_rejected'].includes(order.status)).reduce((sum, order) => sum + Number(order.grand_total || 0), 0);
  const pending = orders.filter((order) => ['pending_payment', 'pending_verification'].includes(order.status)).length;
  const fulfilled = orders.filter((order) => ['shipped', 'completed'].includes(order.status)).length;
  const statuses = orderStatusOptions;
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const visibleOrders = filtered.slice((page - 1) * 10, page * 10);
  useEffect(() => setPage(1), [query, status]);
  const updateStatus = async (order, nextStatus) => { setSavingStatusId(order.id); try { await api(`/admin/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) }); await onChanged(); } finally { setSavingStatusId(null); } };
  const removeOrder = async (order) => { if (!await requestAdminConfirmation({ eyebrow: 'Order ledger', title: `Move ${order.order_number}?`, message: 'This order will move to the recycle bin. Inventory will be returned and the order can be restored later.', confirmLabel: 'Move to recycle bin' })) return; setDeletingId(order.id); try { await api(`/admin/orders/${order.id}`, { method: 'DELETE' }); await onChanged(); } finally { setDeletingId(null); } };
  return <section className="admin-orders-page">
    <div className="admin-page-heading"><div><p>Client care</p><h1>Order ledger</h1><span>Review payments and follow every order journey.</span></div><div className="admin-page-actions"><button className="admin-page-guide" onClick={onStartGuide}><CircleHelp /> Orders tutorial</button><button className="admin-secondary" onClick={() => setTrashOpen(true)}><Trash2 /> Recycle bin</button></div></div>
    <div className="admin-order-summary"><article><ShoppingBag /><div><span>Total orders</span><strong>{orders.length}</strong></div></article><article><CircleDollarSign /><div><span>Total value</span><strong>{money(revenue)}</strong></div></article><article><AlertTriangle /><div><span>Needs attention</span><strong>{pending}</strong></div></article><article><ClipboardCheck /><div><span>Fulfilled</span><strong>{fulfilled}</strong></div></article></div>
    <div className="admin-orders-panel"><header><div><p>Customer orders</p><h2>All orders</h2></div><span>{filtered.length} of {orders.length} orders</span></header><div className="admin-toolbar admin-order-toolbar"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order number, customer or email" /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((item) => <option value={item} key={item}>{orderStatusText[item]}</option>)}</select></div>
      <div className="admin-table-wrap admin-orders-table"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{visibleOrders.map((order) => <tr key={order.id}><td><strong>{order.order_number}</strong><small className="admin-table-date">{new Date(order.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</small></td><td><strong>{order.full_name}</strong><small className="admin-table-date">{order.email}</small></td><td>{order.item_count} {Number(order.item_count) === 1 ? 'piece' : 'pieces'}</td><td>{statusLabel(order.payment_method)}</td><td><strong>{money(order.grand_total)}</strong></td><td><select className={`admin-inline-status ${order.status}`} value={orderStatusOptions.includes(order.status) ? order.status : 'pending_payment'} disabled={savingStatusId === order.id} onChange={(event) => updateStatus(order, event.target.value)}>{orderStatusOptions.map((item) => <option key={item} value={item}>{orderStatusText[item]}</option>)}</select></td><td><div className="admin-order-actions"><button className="admin-receipt-button" type="button" onClick={() => setReceiptOrderId(order.id)}><Eye /> Receipt</button><button className="admin-delete-action" type="button" disabled={deletingId === order.id} onClick={() => removeOrder(order)} aria-label={`Delete ${order.order_number}`}><Trash2 /></button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="admin-orders-empty"><ShoppingBag /><p>{orders.length ? 'No matching orders' : 'No orders yet'}</p><h2>{orders.length ? 'Try another search or status.' : 'Your first customer order will appear here.'}</h2><span>Orders placed through the storefront are saved here automatically.</span></div>}</div><Pagination page={page} pages={pages} onChange={setPage} />
    </div>{receiptOrderId && <OrderReceiptModal orderId={receiptOrderId} onClose={() => setReceiptOrderId(null)} />}{trashOpen && <RecycleBinModal type="orders" onClose={() => setTrashOpen(false)} onRestored={onChanged} />}
  </section>;
}

const contentPages = {
  home: {
    label: 'Home',
    defaults: {
      hero: [
        { eyebrow: 'CHRISÉA / COLLECTION 01', title: 'An Expression of Elegance.', description: 'Discover the beauty in every detail.', buttonLabel: 'Explore Collection', buttonHref: '#new', image: '/assets/hero/chrisea-jewelry-heart-hero.png' },
        { eyebrow: 'CHRISÉA / COLLECTION 02', title: 'Timeless Beauty, Modern You.', description: 'Jewelry for every chapter.', buttonLabel: 'Shop Collection', buttonHref: '#new', image: '/assets/hero/chrisea-jewelry-ring-hero.png' },
        { eyebrow: 'CHRISÉA / COLLECTION 03', title: 'A Gift That Lasts.', description: 'Celebrate every meaningful moment.', buttonLabel: 'Discover More', buttonHref: '#promotion', image: '/assets/hero/chrisea-jewelry-bracelet-hero.png' }
      ],
      arrivals: { eyebrow: 'New', title: 'New arrivals', description: 'Curated pieces for modern romantics.', buttonLabel: 'View all' },
      categories: [{ name: 'Necklaces', image: '/assets/products/enamel-coin-necklace/01-main.png' }, { name: 'Bracelets', image: '/assets/products/pearl-turquoise-bracelet/01-main.png' }, { name: 'Rings', image: '/assets/products/four-leaf-zircon-ring/03-main.png' }, { name: 'Earrings', image: '/assets/products/mother-of-pearl-heart-earrings/01-vintage-gold.png' }],
      editorial: { eyebrow: 'The CHRISÉA Edit', title: 'Styled by You.', subtitle: 'Everyday Elegance', description: 'Timeless pieces, effortless looks. See how our jewelry brings a touch of elegance to your everyday moments.', productIds: [] },
      story: { eyebrow: 'Our story', title: 'More than jewellery', description: 'CHRISÉA celebrates modern romance through vintage-inspired details, luminous pearls and meaningful motifs.', buttonLabel: 'Discover our story', mainImage: '/assets/products/pearl-turquoise-bracelet/03-lifestyle.png', detailImage: '/assets/products/minimalist-pearl-bracelet/03-lifestyle.png' },
      promise: { eyebrow: 'The CHRISÉA promise', title: 'Made to be treasured', items: [{ title: 'Thoughtful details', text: 'Vintage-inspired forms, meaningful motifs and a refined finish.' }, { title: 'Gift-ready', text: 'Every order is prepared to make the unboxing feel special.' }, { title: 'Malaysia delivery', text: 'Carefully packed for delivery across our supported locations.' }, { title: 'Personal service', text: 'Order and payment confirmation handled directly via WhatsApp.' }] }
    },
    fields: [['hero.0.eyebrow','Banner 1 small title'],['hero.0.title','Banner 1 title'],['hero.0.description','Banner 1 description','textarea'],['hero.0.buttonLabel','Banner 1 button'],['hero.0.image','Banner 1 image','image'],['hero.1.eyebrow','Banner 2 small title'],['hero.1.title','Banner 2 title'],['hero.1.description','Banner 2 description','textarea'],['hero.1.buttonLabel','Banner 2 button'],['hero.1.image','Banner 2 image','image'],['hero.2.eyebrow','Banner 3 small title'],['hero.2.title','Banner 3 title'],['hero.2.description','Banner 3 description','textarea'],['hero.2.buttonLabel','Banner 3 button'],['hero.2.image','Banner 3 image','image'],['categories.0.name','Category card 1','category'],['categories.0.image','Category card 1 image','image'],['categories.1.name','Category card 2','category'],['categories.1.image','Category card 2 image','image'],['categories.2.name','Category card 3','category'],['categories.2.image','Category card 3 image','image'],['categories.3.name','Category card 4','category'],['categories.3.image','Category card 4 image','image'],['arrivals.eyebrow','New arrivals small title'],['arrivals.title','New arrivals title'],['arrivals.description','New arrivals description','textarea'],['arrivals.buttonLabel','New arrivals button'],['arrivals.productIds','Displayed products','products'],['editorial.eyebrow','Editorial small title'],['editorial.title','Editorial title'],['editorial.subtitle','Editorial subtitle'],['editorial.description','Editorial description','textarea'],['story.eyebrow','Story small title'],['story.title','Story title'],['story.description','Story description','textarea'],['story.buttonLabel','Story button'],['story.mainImage','Story main image','image'],['story.detailImage','Story detail image','image'],['promise.eyebrow','Promise small title'],['promise.title','Promise title']]
  },
  about: {
    label: 'About',
    defaults: { hero: { eyebrow: 'The story of CHRISÉA', title: 'Jewellery for the chapters you’ll always remember.', intro: 'Born from a love of keepsakes, CHRISÉA brings vintage romance into the everyday.', image: '/assets/about/about-hero.jpg' }, story: { eyebrow: 'Our beginning', title: 'A little nostalgia, made for now.', paragraph: 'CHRISÉA began with a simple belief: the jewellery we reach for most should feel as meaningful as the moments it becomes part of.', signature: 'For every chapter, with love.', mainImage: '/assets/about/about-origin-main.jpg', detailImage: '/assets/about/about-origin-detail.jpg' }, valuesEyebrow: 'What guides us', valuesTitle: 'Beauty with meaning', values: [{ number: '01', title: 'Thoughtfully chosen', text: 'Every detail is considered for its character, wearability and ability to feel personal.' }, { number: '02', title: 'Made for real life', text: 'Elegant pieces designed to move easily from everyday rituals to life’s milestones.' }, { number: '03', title: 'Beautifully presented', text: 'From the piece to the packaging, every order is prepared to feel like a gift.' }], quote: 'The best jewellery does not simply complete a look. It keeps a feeling close.', journey: { eyebrow: 'Our journey', title: 'A story still unfolding', items: [{ year: '2026', title: 'CHRISÉA begins', text: 'A curated jewellery house for modern romantics is born in Malaysia.' }, { year: 'Today', title: 'Chosen with intention', text: 'We continue to discover pieces that balance sentiment, beauty and everyday ease.' }, { year: 'Always', title: 'Made part of your story', text: 'Our favourite chapter is the one each piece begins with you.' }] }, cta: { eyebrow: 'Find your keepsake', title: 'Wear the moment. Keep the memory.', buttonLabel: 'Explore the collection', buttonHref: '/shop', image: '/assets/about/about-cta.jpg' } },
    fields: [['hero.eyebrow','Hero small title'],['hero.title','Hero title'],['hero.intro','Hero introduction','textarea'],['hero.image','Hero image','image'],['story.eyebrow','Story small title'],['story.title','Story title'],['story.paragraph','Story paragraph','textarea'],['story.signature','Story signature'],['story.mainImage','Story main image','image'],['story.detailImage','Story detail image','image'],['valuesEyebrow','Values small title'],['valuesTitle','Values title'],['values.0.title','Value 1 title'],['values.0.text','Value 1 description','textarea'],['values.1.title','Value 2 title'],['values.1.text','Value 2 description','textarea'],['values.2.title','Value 3 title'],['values.2.text','Value 3 description','textarea'],['quote','Quote','textarea'],['journey.eyebrow','Journey small title'],['journey.title','Journey title'],['journey.items.0.year','Journey 1 year'],['journey.items.0.title','Journey 1 title'],['journey.items.0.text','Journey 1 description','textarea'],['journey.items.1.year','Journey 2 year'],['journey.items.1.title','Journey 2 title'],['journey.items.1.text','Journey 2 description','textarea'],['journey.items.2.year','Journey 3 year'],['journey.items.2.title','Journey 3 title'],['journey.items.2.text','Journey 3 description','textarea'],['cta.eyebrow','Closing small title'],['cta.title','Closing title'],['cta.buttonLabel','Closing button'],['cta.image','Closing image','image']]
  },
  shop: {
    label: 'Shop',
    defaults: {
      promotion: [
        { eyebrow: 'The signature edit', title: 'A little something, just for you.', description: 'Discover handpicked pieces made for gifting, keeping and every meaningful moment between.', buttonLabel: 'Shop the edit', image: 'https://images.unsplash.com/photo-1578632297758-3a6c6de14be8?auto=format&fit=crop&w=2400&q=85' },
        { eyebrow: 'New arrivals', title: 'Made for your next chapter.', description: 'Meet the latest jewellery chosen to bring a little beauty to every day.', buttonLabel: 'Discover new pieces', image: '/assets/hero/chrisea-jewelry-ring-hero.png' },
        { eyebrow: 'The gift edit', title: 'A meaningful gift, beautifully chosen.', description: 'Find keepsakes for celebrations, milestones and the moments in between.', buttonLabel: 'Explore gifts', image: '/assets/hero/chrisea-jewelry-bracelet-hero.png' }
      ],
      favourites: { title: 'Our Favourites', description: 'Four pieces selected especially for you.', productIds: [] },
      catalogue: { eyebrow: 'Shop by category', title: 'Find your signature piece', productOrders: { All: [] } }
    },
    fields: [['promotion.0.eyebrow','Banner 1 small title'],['promotion.0.title','Banner 1 title'],['promotion.0.description','Banner 1 description','textarea'],['promotion.0.buttonLabel','Banner 1 button'],['promotion.0.image','Banner 1 image','image'],['promotion.1.eyebrow','Banner 2 small title'],['promotion.1.title','Banner 2 title'],['promotion.1.description','Banner 2 description','textarea'],['promotion.1.buttonLabel','Banner 2 button'],['promotion.1.image','Banner 2 image','image'],['promotion.2.eyebrow','Banner 3 small title'],['promotion.2.title','Banner 3 title'],['promotion.2.description','Banner 3 description','textarea'],['promotion.2.buttonLabel','Banner 3 button'],['promotion.2.image','Banner 3 image','image'],['favourites.title','Favourites title'],['favourites.description','Favourites description','textarea'],['favourites.productIds','Displayed products','products'],['catalogue.eyebrow','Catalogue small title'],['catalogue.title','Catalogue title'],['catalogue.productOrders','Product order','product-order']]
  },
  cart: {
    label: 'Cart recommendations',
    defaults: {
      hero: { eyebrow: 'Shopping cart', title: 'Your Cart', description: 'Beautiful pieces are just a few steps away.', image: '/assets/cart/cart-hero.jpg' },
      recommendations: { eyebrow: 'You might also like', title: 'Complete the Look', productIds: [] },
      benefits: { items: [{ title: 'Free shipping', text: 'Orders over RM250' }, { title: 'Beautiful packaging', text: 'Designed with care' }, { title: 'Secure payment', text: 'Your information is safe' }] }
    },
    fields: [['hero.eyebrow','Hero small title'],['hero.title','Hero title'],['hero.description','Hero description','textarea'],['hero.image','Hero image','image'],['recommendations.eyebrow','Recommendations small title'],['recommendations.title','Recommendations title'],['recommendations.productIds','Complete the Look — choose 4 products','products'],['benefits.items.0.title','Benefit 1 title'],['benefits.items.0.text','Benefit 1 description'],['benefits.items.1.title','Benefit 2 title'],['benefits.items.1.text','Benefit 2 description'],['benefits.items.2.title','Benefit 3 title'],['benefits.items.2.text','Benefit 3 description']]
  },
  reviews: {
    label: 'Reviews',
    defaults: { hero: { eyebrow: 'The CHRISÉA experience', title: 'Loved, Worn & Cherished.', description: 'Stories from our community—because the most meaningful pieces become part of your story.', image: '/assets/reviews/reviews-hero.jpg' }, feed: { eyebrow: 'Community notes', title: 'In their own words' }, social: { eyebrow: 'Spotted on you', title: 'Styled by You', description: 'A glimpse of how our community wears CHRISÉA.', image1: '/assets/reviews/review-earrings.jpg', image2: '/assets/reviews/review-styling.jpg', image3: '/assets/reviews/review-necklace.jpg' }, cta: { eyebrow: 'Your story matters', title: 'A Little Love Note?', description: 'We’d love to hear about your CHRISÉA experience.', buttonLabel: 'Write a review' } },
    fields: [['hero.eyebrow','Hero small title'],['hero.title','Hero title'],['hero.description','Hero description','textarea'],['hero.image','Hero image','image'],['feed.eyebrow','Reviews small title'],['feed.title','Reviews title'],['social.eyebrow','Social small title'],['social.title','Social title'],['social.description','Social description','textarea'],['social.image1','Social image 1','image'],['social.image2','Social image 2','image'],['social.image3','Social image 3','image'],['cta.eyebrow','Review CTA small title'],['cta.title','Review CTA title'],['cta.description','Review CTA description','textarea'],['cta.buttonLabel','Review CTA button']]
  },
  announcement: { label: 'Announcement bar', defaults: { messages: ['Complimentary shipping on orders over RM200', 'Gift-ready packaging'] }, fields: [['messages','Announcements','products']] },
  footer: { label: 'Footer', defaults: { brandText: 'Timeless pieces for modern romantics. Designed to celebrate every chapter.', socialLabel: 'Follow our journey', shopTitle: 'Shop', careTitle: 'Customer care', newsletterTitle: 'Join our journey', newsletterText: 'Be the first to know about new arrivals, exclusive offers and more.', copyright: '© 2026 CHRISÉA Jewelry. All rights reserved.', legalText: 'Privacy Policy | Terms & Conditions' }, fields: [['brandText','Brand description','textarea'],['socialLabel','Social link text'],['shopTitle','Shop heading'],['careTitle','Customer care heading'],['newsletterTitle','Newsletter heading'],['newsletterText','Newsletter description','textarea'],['copyright','Copyright text'],['legalText','Legal links text']] }
};

contentPages.home.fields.push(
  ['editorial.productIds', 'Editorial products', 'products'],
  ['promise.items.0.title', 'Promise 1 title'], ['promise.items.0.text', 'Promise 1 description', 'textarea'],
  ['promise.items.1.title', 'Promise 2 title'], ['promise.items.1.text', 'Promise 2 description', 'textarea'],
  ['promise.items.2.title', 'Promise 3 title'], ['promise.items.2.text', 'Promise 3 description', 'textarea'],
  ['promise.items.3.title', 'Promise 4 title'], ['promise.items.3.text', 'Promise 4 description', 'textarea']
);
contentPages.footer.defaults.care = {
  faq: { eyebrow: 'Customer care', title: 'Frequently Asked Questions', intro: 'A few helpful answers about ordering from CHRISÉA.', sections: [['Can I change my order?', 'Please contact us as soon as possible. We will gladly help before your order has been prepared for dispatch.'], ['How should I care for my jewellery?', 'Keep each piece dry, avoid perfume and lotions, and store it separately in its pouch after wearing.'], ['Is gift packaging available?', 'Every CHRISÉA order is thoughtfully presented and ready for gifting.']] },
  shipping: { eyebrow: 'Delivery information', title: 'Shipping & Delivery', intro: 'Your jewellery is carefully prepared and packed before beginning its journey to you.', sections: [['Malaysia delivery', 'Orders are usually prepared within 1–2 business days. Delivery typically takes 2–5 business days after dispatch.'], ['Shipping updates', 'Once your parcel is on the way, delivery details will be sent to the email address used at checkout.'], ['Packaging', 'Each order is protected in signature CHRISÉA packaging suitable for keeping or gifting.']] },
  returns: { eyebrow: 'Customer care', title: 'Return & Refund', intro: 'We want every CHRISÉA piece to feel just right when it arrives.', sections: [['Return window', 'Eligible unworn items may be requested for return within 14 days of delivery, with original packaging included.'], ['Making a request', 'Contact our customer care team with your order details and reason for return before sending an item back.'], ['Refunds', 'Approved refunds are returned to the original payment method after the item has been received and inspected.']] },
  contact: { eyebrow: 'We are here to help', title: 'Contact CHRISÉA', intro: 'Questions about a piece, an order or a gift? Our customer care team would be delighted to help.', sections: [['Email', 'hello@chrisea.com'], ['WhatsApp concierge', 'Available Monday to Saturday, 10:00 AM–6:00 PM MYT.'], ['Our boutique', 'CHRISÉA is an online jewellery house based in Malaysia.']] }
};
['faq', 'shipping', 'returns', 'contact'].forEach((panel) => contentPages.footer.fields.push(
  [`care.${panel}.eyebrow`, `${panel} small title`], [`care.${panel}.title`, `${panel} title`], [`care.${panel}.intro`, `${panel} introduction`, 'textarea'], [`care.${panel}.sections`, `${panel} entries`, 'products']
));

const cloneContent = (value) => JSON.parse(JSON.stringify(value));
function mergeContentDefaults(defaults, saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return cloneContent(defaults);
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => {
    const incoming = saved[key];
    if (Array.isArray(value)) return [key, Array.isArray(incoming) ? incoming : cloneContent(value)];
    if (value && typeof value === 'object') return [key, mergeContentDefaults(value, incoming)];
    return [key, incoming ?? value];
  }).concat(Object.entries(saved).filter(([key]) => !(key in defaults))));
}
const readContentPath = (source, path) => path.split('.').reduce((value, key) => value?.[key], source) ?? '';
function writeContentPath(source, path, value) {
  const next = cloneContent(source);
  const keys = path.split('.');
  let target = next;
  keys.slice(0, -1).forEach((key) => { target[key] ||= {}; target = target[key]; });
  target[keys.at(-1)] = value;
  return next;
}

function ContentImageField({ content, path, device, uploading, onUpload, onChange, onSelectDevice }) {
  const desktopImage = readContentPath(content, path);
  const mobileImage = content._mobileImages?.[path] || '';
  const savedAdjustment = content._imageAdjustments?.[path] || {};
  const adjustment = savedAdjustment[device] || (device === 'mobile' ? { zoom: 100, x: 68, y: 50, fit: 'cover' } : savedAdjustment);
  const zoom = Number(adjustment.zoom || 100);
  const x = Number(adjustment.x ?? 50);
  const y = Number(adjustment.y ?? 50);
  const fit = adjustment.fit || 'contain';
  const update = (key, value) => onChange((current) => ({
    ...current,
    _imageAdjustments: {
      ...(current._imageAdjustments || {}),
      [path]: {
        ...(current._imageAdjustments?.[path] || {}),
        [device]: { ...((current._imageAdjustments?.[path]?.[device]) || adjustment), [key]: key === 'fit' ? value : Number(value) }
      }
    }
  }));
  const previewStyle = (previewDevice) => {
    const defaults = previewDevice === 'mobile' ? { zoom: 100, x: 68, y: 50, fit: 'cover' } : { zoom: 100, x: 50, y: 50, fit: 'contain' };
    const previewAdjustment = savedAdjustment[previewDevice] || (previewDevice === 'desktop' ? savedAdjustment : {}) || defaults;
    const previewX = Number(previewAdjustment.x ?? defaults.x);
    const previewY = Number(previewAdjustment.y ?? defaults.y);
    return { objectFit: previewAdjustment.fit || defaults.fit, objectPosition: `${previewX}% ${previewY}%`, transform: `scale(${Number(previewAdjustment.zoom || defaults.zoom) / 100})`, transformOrigin: `${previewX}% ${previewY}%` };
  };

  return <div className="admin-content-image-field">
    <div className="admin-device-image-grid">
      <section className="admin-device-image-card">
        <header><strong>DESKTOP IMAGE</strong><span>Landscape</span></header>
        {desktopImage && <div className="admin-content-image-preview is-desktop"><img src={desktopImage} alt="Desktop preview" style={previewStyle('desktop')} /></div>}
        <label><ImagePlus /> {uploading === `${path}:desktop` ? 'Uploading…' : 'Replace desktop image'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(uploading)} onChange={onUpload(path, 'desktop')} /></label>
        <button className={`admin-adjust-image ${device === 'desktop' ? 'active' : ''}`} type="button" onClick={() => onSelectDevice('desktop')}><SlidersHorizontal /> {device === 'desktop' ? 'Adjusting desktop' : 'Adjust desktop'}</button>
      </section>
      <section className="admin-device-image-card is-mobile-card">
        <header><strong>MOBILE IMAGE</strong><span>Portrait</span></header>
        {(mobileImage || desktopImage) && <div className="admin-content-image-preview is-mobile"><img src={mobileImage || desktopImage} alt="Mobile preview" style={previewStyle('mobile')} /></div>}
        {!mobileImage && <small>Currently using the desktop image</small>}
        <label><ImagePlus /> {uploading === `${path}:mobile` ? 'Uploading…' : mobileImage ? 'Replace mobile image' : 'Upload mobile image'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(uploading)} onChange={onUpload(path, 'mobile')} /></label>
        <button className={`admin-adjust-image ${device === 'mobile' ? 'active' : ''}`} type="button" onClick={() => onSelectDevice('mobile')}><SlidersHorizontal /> {device === 'mobile' ? 'Adjusting mobile' : 'Adjust mobile'}</button>
      </section>
    </div>
    <div className="admin-image-adjustments">
      <p className="admin-image-device-note">Editing <strong>{device}</strong> framing</p>
      <div className="admin-image-fit"><button className={fit === 'contain' ? 'active' : ''} type="button" onClick={() => update('fit', 'contain')}>Show full image</button><button className={fit === 'cover' ? 'active' : ''} type="button" onClick={() => update('fit', 'cover')}>Fill & crop</button></div>
      <label><span>Zoom <b>{zoom}%</b></span><input type="range" min="50" max="250" step="5" value={zoom} onChange={(event) => update('zoom', event.target.value)} /></label>
      <label><span>Horizontal <b>{x}%</b></span><input type="range" min="0" max="100" value={x} onChange={(event) => update('x', event.target.value)} /></label>
      <label><span>Vertical <b>{y}%</b></span><input type="range" min="0" max="100" value={y} onChange={(event) => update('y', event.target.value)} /></label>
      <button type="button" onClick={() => onChange((current) => ({ ...current, _imageAdjustments: { ...(current._imageAdjustments || {}), [path]: { ...(current._imageAdjustments?.[path] || {}), [device]: { zoom: 100, x: 50, y: 50, fit: 'contain' } } } }))}><RotateCcw /> Reset {device}</button>
    </div>
    <small className="admin-image-help">Both previews are always shown. Use the Desktop/Mobile switch above to choose which framing controls you are editing.</small>
  </div>;
}

function WebsiteContent({ onStartGuide }) {
  const previewRef = useRef(null);
  const savingRef = useRef(false);
  const [page, setPage] = useState('home');
  const [content, setContent] = useState(cloneContent(contentPages.home.defaults));
  const [section, setSection] = useState('hero');
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [catalogue, setCatalogue] = useState({ products: [], categories: [] });
  const [productPicker, setProductPicker] = useState(null);
  const [orderEditor, setOrderEditor] = useState(null);
  const config = contentPages[page];
  const fieldSection = (path) => path.startsWith('values') ? 'values' : path.startsWith('care.') ? path.split('.')[1] : path.includes('.') ? path.split('.')[0] : 'general';
  const sections = [...new Set(config.fields.map(([path]) => fieldSection(path)))];
  const previewBasePath = page === 'about' ? '/about?cmsPreview=1' : page === 'shop' ? '/shop?cmsPreview=1' : page === 'cart' ? '/cart?cmsPreview=1' : page === 'reviews' ? '/reviews?cmsPreview=1' : '/?cmsPreview=1';
  const previewPath = `${previewBasePath}&cmsDevice=${previewDevice}`;
  const selectSection = (item) => {
    setSection(item);
    previewRef.current?.contentWindow?.postMessage({ type: 'chrisea-cms-section', page, section: item === 'heroSlides' ? 'hero' : item }, window.location.origin);
  };

  useEffect(() => {
    setStatus('Loading…');
    api(`/admin/content/${page}`).then((result) => {
      const saved = Object.keys(result.draft || {}).length ? result.draft : result.published;
      let normalised = page === 'home' && saved?.hero && !Array.isArray(saved.hero) ? { ...saved, hero: [saved.hero, ...config.defaults.hero.slice(1)] } : saved;
      if (page === 'announcement' && !normalised?.messages && (normalised?.message1 || normalised?.message2)) normalised = { messages: [normalised.message1, normalised.message2].filter(Boolean) };
      setContent(mergeContentDefaults(config.defaults, normalised));
      setStatus(result.publishedAt ? `Published ${new Date(result.publishedAt).toLocaleString('en-MY')}` : 'Not published yet');
    }).catch((error) => setStatus(error.message));
  }, [page]);
  useEffect(() => {
    Promise.all([api('/admin/products'), api('/admin/categories')]).then(([productResult, categoryResult]) => setCatalogue({ products: productResult.products || [], categories: categoryResult.categories || [] })).catch(() => {});
  }, []);
  useEffect(() => {
    if (!catalogue.products.length || !['home', 'shop', 'cart'].includes(page)) return;
    setContent((current) => {
      const next = cloneContent(current);
      if (page === 'home') {
        if (!next.arrivals?.productIds?.length) next.arrivals.productIds = catalogue.products.slice(0, 4).map((product) => String(product.id));
        if (!next.editorial?.productIds?.length) next.editorial.productIds = catalogue.products.slice(4, 7).map((product) => String(product.id));
      }
      if (page === 'shop') {
        next.favourites ||= cloneContent(contentPages.shop.defaults.favourites);
        if (!next.favourites.productIds?.length) next.favourites.productIds = catalogue.products.slice(0, 4).map((product) => String(product.id));
        next.catalogue ||= cloneContent(contentPages.shop.defaults.catalogue);
        next.catalogue.productOrders ||= {};
        if (!next.catalogue.productOrders.All?.length) next.catalogue.productOrders.All = next.catalogue.productIds?.length ? next.catalogue.productIds.map(String) : catalogue.products.map((product) => String(product.id));
        catalogue.categories.forEach((category) => {
          if (!next.catalogue.productOrders[category.name]?.length) next.catalogue.productOrders[category.name] = catalogue.products.filter((product) => product.category === category.name).map((product) => String(product.id));
        });
      }
      if (page === 'cart') {
        next.recommendations ||= cloneContent(contentPages.cart.defaults.recommendations);
        if (!next.recommendations.productIds?.length) next.recommendations.productIds = catalogue.products.slice(0, 4).map((product) => String(product.id));
      }
      return next;
    });
  }, [page, catalogue.products.length, status]);
  useEffect(() => {
    setSection(sections[0]);
  }, [page]);
  useEffect(() => {
    const timers = [80, 250, 600].map((delay) => window.setTimeout(() => selectSection(section), delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [page, section]);
  useEffect(() => {
    window.localStorage.setItem(`chrisea-cms-preview-${page}`, JSON.stringify(content));
    previewRef.current?.contentWindow?.postMessage({ type: 'chrisea-cms-content', page, content }, window.location.origin);
  }, [page, content]);

  const save = async (publish = false) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      if (publish) await api(`/admin/content/${page}/publish`, { method: 'POST', body: JSON.stringify({ content }) });
      else await api(`/admin/content/${page}`, { method: 'PUT', body: JSON.stringify({ content }) });
      setStatus(publish ? 'Published — the storefront is now updated.' : 'Draft saved.');
    } catch (error) { setStatus(error.message); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const upload = (path, device = 'desktop') => async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(`${path}:${device}`);
    try {
      const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await api('/admin/content-images', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, dataUrl }),
        signal: AbortSignal.timeout(60000)
      });
      setContent((current) => device === 'mobile'
        ? { ...current, _mobileImages: { ...(current._mobileImages || {}), [path]: result.imageUrl } }
        : writeContentPath(current, path, result.imageUrl));
      setStatus(`${device === 'mobile' ? 'Mobile' : 'Desktop'} image uploaded. Save or publish to keep the change.`);
    } catch (error) { setStatus(error.message); }
    finally { setUploading(''); event.target.value = ''; }
  };
  const chosenProducts = (path) => {
    const ids = readContentPath(content, path) || [];
    const selected = ids.map((id) => catalogue.products.find((product) => String(product.id) === String(id))).filter(Boolean);
    const limit = path.startsWith('editorial') ? 3 : 4;
    return selected.length ? selected : catalogue.products.slice(path.startsWith('editorial') ? 4 : 0, path.startsWith('editorial') ? 7 : limit);
  };
  const productChooser = (path) => {
    if (path.endsWith('.sections')) {
      const entries = readContentPath(content, path) || [];
      return <div className="admin-care-entry-editor">{entries.map((entry, index) => <article key={index}><header><strong>Item {index + 1}</strong><button type="button" disabled={entries.length <= 1} onClick={() => setContent((current) => writeContentPath(current, path, readContentPath(current, path).filter((_, itemIndex) => itemIndex !== index)))}><Trash2 /></button></header><label>Title<input value={entry[0]} onChange={(event) => setContent((current) => { const next = cloneContent(current); readContentPath(next, path)[index][0] = event.target.value; return next; })} /></label><label>Content<textarea rows="3" value={entry[1]} onChange={(event) => setContent((current) => { const next = cloneContent(current); readContentPath(next, path)[index][1] = event.target.value; return next; })} /></label></article>)}<button type="button" disabled={entries.length >= 5} onClick={() => setContent((current) => writeContentPath(current, path, [...readContentPath(current, path), ['New title', 'New content']]))}><Plus /> Add item</button><small>Minimum 1 · Maximum 5</small></div>;
    }
    if (path === 'messages') {
      const messages = content.messages || [];
      return <div className="admin-announcement-editor">{messages.map((message, index) => <div key={index}><input value={message} onChange={(event) => setContent((current) => { const next = cloneContent(current); next.messages[index] = event.target.value; return next; })} /><button type="button" disabled={messages.length <= 2} onClick={() => setContent((current) => ({ ...current, messages: current.messages.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 /></button></div>)}<button type="button" disabled={messages.length >= 4} onClick={() => setContent((current) => ({ ...current, messages: [...current.messages, 'New announcement'] }))}><Plus /> Add announcement</button><small>Minimum 2 · Maximum 4</small></div>;
    }
    const limit = path.startsWith('editorial') ? 3 : 4;
    return <div className="admin-content-product-choice"><div>{chosenProducts(path).map((product) => <article key={product.id}><img src={product.image_url} alt="" /><span><strong>{product.name}</strong><small>{product.category}</small></span></article>)}</div><button type="button" className="admin-content-choose" onClick={() => setProductPicker({ path, limit, title: path.startsWith('editorial') ? 'Editorial products' : path.startsWith('favourites') ? 'Favourite products' : path.startsWith('recommendations') ? 'Complete the Look products' : 'New arrivals' })}>Choose products</button></div>;
  };
  const productOrderEditor = (path) => {
    return <div className="admin-order-field"><p><strong>How ordering works</strong> All controls the complete catalogue. Necklaces, Bracelets, Rings and Earrings each keep a separate order for that storefront filter. Move products with the arrows, choose Done, then Publish changes to send the order to the storefront.</p><button type="button" className="admin-content-choose admin-open-order-editor" onClick={() => setOrderEditor({ path, category: 'All' })}>Adjust product order</button></div>;
  };
  const orderCategories = ['All', ...catalogue.categories.map((item) => item.name)];
  const orderedProductsFor = (category) => {
    const source = category === 'All' ? catalogue.products : catalogue.products.filter((product) => product.category === category);
    const orders = readContentPath(content, orderEditor?.path || 'catalogue.productOrders') || {};
    const savedIds = (Array.isArray(orders[category]) ? orders[category] : []).map(String);
    return [...savedIds.map((id) => source.find((product) => String(product.id) === id)).filter(Boolean), ...source.filter((product) => !savedIds.includes(String(product.id)))];
  };
  const moveOrderedProduct = (index, direction) => {
    if (!orderEditor) return;
    const ordered = orderedProductsFor(orderEditor.category);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const nextIds = ordered.map((product) => String(product.id));
    [nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]];
    setContent((current) => {
      const orders = readContentPath(current, orderEditor.path) || {};
      return writeContentPath(current, orderEditor.path, { ...orders, [orderEditor.category]: nextIds });
    });
  };

  return <section className="admin-content-manager">
    <div className="admin-page-heading"><div><p>Storefront editor</p><h1>Website Content</h1><span>Update storefront words and photographs without changing code.</span></div><div className="admin-page-actions"><button className="admin-page-guide" onClick={onStartGuide}><CircleHelp /> Website Content tutorial</button><button data-guide="publish-content" className="admin-primary" disabled={saving} onClick={() => save(true)}>{saving ? 'Saving…' : 'Publish changes'}</button></div></div>
    <div className="admin-content-tabs">{Object.entries(contentPages).map(([key, item]) => <button className={page === key ? 'active' : ''} onClick={() => { setContent(cloneContent(item.defaults)); setPage(key); }} key={key}>{item.label}</button>)}</div>
    <div className="admin-visual-editor">
      <div className={`admin-site-preview is-${previewDevice}`}><header><span>Live page preview · viewing only</span><div className="admin-preview-devices"><button className={previewDevice === 'desktop' ? 'active' : ''} onClick={() => setPreviewDevice('desktop')}>Desktop</button><button className={previewDevice === 'mobile' ? 'active' : ''} onClick={() => setPreviewDevice('mobile')}>Mobile</button></div><a href={previewBasePath.replace('?cmsPreview=1','')} target="_blank" rel="noreferrer">Open full page <ArrowUpRight /></a></header><div className="admin-preview-stage"><iframe ref={previewRef} title={`${config.label} storefront preview`} src={previewPath} onLoad={() => selectSection(section)} /></div></div>
      <aside className="admin-visual-controls"><header><p>{config.label}</p><h2>Edit visible section</h2><span>{status}</span></header><nav>{sections.map((item) => <button className={section === item ? 'active' : ''} onClick={() => selectSection(item)} key={item}>{item === 'general' ? config.label : item.replace(/([A-Z])/g, ' $1')}</button>)}</nav><div className="admin-content-fields">{config.fields.filter(([path]) => fieldSection(path) === section).map(([path,label,type]) => <label className="wide" key={path}><span>{label}</span>{type === 'textarea' ? <textarea rows="4" value={readContentPath(content,path)} onChange={(event) => setContent((current) => writeContentPath(current,path,event.target.value))} /> : type === 'image' ? <ContentImageField content={content} path={path} device={previewDevice} uploading={uploading} onUpload={upload} onChange={setContent} onSelectDevice={setPreviewDevice} /> : type === 'category' ? <select value={readContentPath(content,path)} onChange={(event) => setContent((current) => writeContentPath(current,path,event.target.value))}>{catalogue.categories.map((item) => <option value={item.name} key={item.id || item.name}>{item.name}</option>)}</select> : type === 'products' ? productChooser(path) : type === 'product-order' ? productOrderEditor(path) : <input value={readContentPath(content,path)} onChange={(event) => setContent((current) => writeContentPath(current,path,event.target.value))} />}</label>)}</div></aside>
    </div>
    {productPicker && <div className="admin-content-picker-backdrop"><section className="admin-content-picker"><header><div><p>{productPicker.title}</p><h2>Choose {productPicker.limit} products</h2><span>Select products from your current catalogue. Your selection will appear on the storefront after you publish.</span></div><button type="button" onClick={() => setProductPicker(null)}><X /></button></header><div className="admin-content-picker-grid">{catalogue.products.map((product) => { const ids = (readContentPath(content, productPicker.path) || []).map(String); const selected = ids.includes(String(product.id)); return <button type="button" className={selected ? 'selected' : ''} key={product.id} onClick={() => setContent((current) => { const currentIds = (readContentPath(current, productPicker.path) || []).map(String); const id = String(product.id); const nextIds = currentIds.includes(id) ? currentIds.filter((item) => item !== id) : currentIds.length < productPicker.limit ? [...currentIds, id] : currentIds; return writeContentPath(current, productPicker.path, nextIds); })}><img src={product.image_url} alt="" /><span><small>{product.category}</small><strong>{product.name}</strong></span><b>{selected ? 'Selected' : 'Select'}</b></button>; })}</div><footer><span>{(readContentPath(content, productPicker.path) || []).length} / {productPicker.limit} selected</span><button type="button" disabled={(productPicker.path.startsWith('favourites') || productPicker.path.startsWith('recommendations')) && (readContentPath(content, productPicker.path) || []).length !== 4} onClick={() => setProductPicker(null)}>Done</button></footer></section></div>}
    {orderEditor && <div className="admin-content-picker-backdrop"><section className="admin-content-picker admin-order-picker"><header><div><p>Shop catalogue</p><h2>Adjust product order</h2><span>Select one of the five storefront filters below. Each filter saves its own order; the All order does not overwrite the four category orders.</span></div><button type="button" onClick={() => setOrderEditor(null)}><X /></button></header><nav>{orderCategories.map((category) => <button type="button" className={orderEditor.category === category ? 'active' : ''} onClick={() => setOrderEditor((current) => ({ ...current, category }))} key={category}>{category}</button>)}</nav><p className="admin-order-help">Use ▲ and ▼ to move a product in the selected <strong>{orderEditor.category}</strong> filter. Choose Done when the order is correct, then choose Publish changes on Website Content to update the storefront.</p><div className="admin-product-order-editor">{orderedProductsFor(orderEditor.category).map((product, index, ordered) => <article key={product.id}><span>{index + 1}</span><img src={product.image_url} alt="" /><div><strong>{product.name}</strong><small>{product.category}</small></div><aside><button type="button" disabled={index === 0} onClick={() => moveOrderedProduct(index, -1)} aria-label={`Move ${product.name} up`}><ChevronUp /></button><button type="button" disabled={index === ordered.length - 1} onClick={() => moveOrderedProduct(index, 1)} aria-label={`Move ${product.name} down`}><ChevronDown /></button></aside></article>)}</div><footer><span>{orderedProductsFor(orderEditor.category).length} products · {orderEditor.category}</span><button type="button" onClick={() => setOrderEditor(null)}>Done</button></footer></section></div>}
  </section>;
}

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideType, setGuideType] = useState(null);
  const [guideStep, setGuideStep] = useState(0);
  const [guideProductId, setGuideProductId] = useState(null);
  const [data, setData] = useState(null);
  const [loadedPage, setLoadedPage] = useState(null);
  const [error, setError] = useState('');
  const [topbarData, setTopbarData] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsSeen, setNotificationsSeen] = useState(false);
  const loadRequest = useRef(0);
  const pageCache = useRef(new Map());

  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    const previous = existing?.content;
    const meta = existing || document.head.appendChild(document.createElement('meta'));
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive';
    return () => {
      if (existing) meta.content = previous || '';
      else meta.remove();
    };
  }, []);

  const load = async (currentPage = page, currentProductId = selectedProductId, force = false) => {
    const requestId = ++loadRequest.current;
    const cacheKey = currentPage === 'product-detail' ? `${currentPage}:${currentProductId}` : currentPage;
    const cached = pageCache.current.get(cacheKey);
    setError('');
    if (cached && !force) {
      setData(cached);
      setLoadedPage(currentPage);
    } else {
      setData(null);
      setLoadedPage(null);
    }
    try {
      let nextData = null;
      if (currentPage === 'dashboard') nextData = await api('/admin/dashboard');
      if (currentPage === 'products') {
        const [productsResult, categoriesResult] = await Promise.all([api('/admin/products'), api('/admin/categories')]);
        nextData = { products: productsResult.products, categories: categoriesResult.categories };
      }
      if (currentPage === 'product-detail') {
        const [productResult, categoriesResult] = await Promise.all([api(`/admin/products/${currentProductId}`), api('/admin/categories')]);
        nextData = { product: productResult.product, categories: categoriesResult.categories };
      }
      if (currentPage === 'orders') nextData = { orders: (await api('/admin/orders')).orders };
      if (currentPage === 'promotions') nextData = { promotions: (await api('/admin/promotions')).promotions };
      if (currentPage === 'content') nextData = { ready: true };
      if (currentPage === 'add-product') nextData = { categories: (await api('/admin/categories')).categories };
      if (requestId !== loadRequest.current) return;
      pageCache.current.set(cacheKey, nextData);
      setData(nextData);
      setLoadedPage(currentPage);
    } catch (loadError) {
      if (requestId === loadRequest.current) setError(loadError.message);
    }
  };

  useEffect(() => {
    refreshAuthentication()
      .then(({ user: account }) => setUser(account))
      .catch(() => clearToken())
      .finally(() => setCheckingSession(false));
  }, []);
  useEffect(() => { if (user) load(page, selectedProductId); }, [user, page, selectedProductId]);
  useEffect(() => {
    if (!user) return;
    api('/admin/dashboard').then(setTopbarData).catch(() => {});
  }, [user]);
  useEffect(() => {
    if (!user || !['dashboard', 'orders'].includes(page)) return undefined;
    const refresh = () => load(page, selectedProductId);
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [user, page, selectedProductId]);

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* Clear local access regardless. */ }
    clearToken();
    setUser(null);
  };

  const productGuide = guideProductId ? [...productGuideBase,
    { page: 'products', selector: '.admin-product-table tbody tr:first-child', eyebrow: 'Saved products', title: 'Review a saved product', copy: 'After saving, return to Products to find the piece in your catalogue. Use search or filters when the list grows, then select the arrow on any existing product to edit it.' },
    { page: 'product-detail', selector: '.admin-save-page', eyebrow: 'Editing an existing piece', title: 'Save your changes', copy: 'This editor loads the latest saved product. Update any field, then choose Save Changes. If a previously selected product was deleted, the tutorial uses another available product instead.' },
  ] : productGuideBase;
  const activeGuide = guideType === 'overview' ? overviewGuide : guideType === 'products' ? productGuide : guideType === 'orders' ? (data?.orders?.length ? orderGuideAvailable : orderGuideEmpty) : guideType === 'promotions' ? promotionGuide : guideType === 'content' ? contentGuide : [];
  const startGuide = (type) => {
    setGuideType(type);
    setGuideStep(0);
    setGuideProductId(type === 'products' ? (data?.products?.[0]?.id || null) : null);
    setPage({ overview: 'dashboard', products: 'products', orders: 'orders', promotions: 'promotions', content: 'content' }[type]);
    setMenuOpen(false);
  };
  const openGuideStep = (nextStep) => {
    const safeStep = Math.max(0, Math.min(nextStep, activeGuide.length - 1));
    const item = activeGuide[safeStep];
    setGuideStep(safeStep);
    if (item.page === 'product-detail') setSelectedProductId(guideProductId);
    setPage(item.page);
  };
  const closeTour = () => { setGuideType(null); setGuideStep(0); setMenuOpen(false); };
  useEffect(() => {
    if (!guideType || !activeGuide[guideStep] || loadedPage !== page) return undefined;
    const timer = window.setTimeout(() => {
      const target = document.querySelector(activeGuide[guideStep].selector);
      if (!target) return;
      target.classList.add('admin-guide-highlight');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      document.querySelectorAll('.admin-guide-highlight').forEach((target) => target.classList.remove('admin-guide-highlight'));
    };
  }, [guideType, guideStep, page, loadedPage]);

  if (checkingSession) return <main className="admin-session-loading"><img src="/assets/brand/chrisea-logo-full-transparent.png" alt="CHRISÉA Jewelry" /><Sparkles /><span>Opening your atelier…</span></main>;
  if (!user) return <AdminLogin onLogin={setUser} />;
  const pageReady = data && loadedPage === page;
  const notices = [
    { icon: ShoppingBag, title: `${topbarData?.summary?.payments_to_review || 0} payments need review`, text: 'Check pending customer payment records.', page: 'orders' },
    { icon: AlertTriangle, title: `${topbarData?.lowStock?.length || 0} low-stock pieces`, text: 'Review inventory before popular pieces sell out.', page: 'products' },
    { icon: Package, title: `${topbarData?.summary?.orders || 0} orders recorded`, text: 'Open the order ledger to follow fulfilment.', page: 'orders' },
    { icon: ImagePlus, title: 'Storefront content ready', text: 'Review and publish your latest website edits.', page: 'content' },
    { icon: CircleDollarSign, title: 'Promotion centre', text: 'Review active offers and campaign availability.', page: 'promotions' }
  ];
  const openAdminPage = (nextPage) => { setPage(nextPage); setNotificationsOpen(false); setProfileOpen(false); };
  const finishProductSave = () => {
    pageCache.current.delete('products');
    setPage('products');
  };
  return <div className="admin-shell"><Sidebar page={page} setPage={setPage} open={menuOpen} setOpen={setMenuOpen} user={user} onLogout={logout} /><main className="admin-main"><header className="admin-topbar"><button onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><label><Search /><input placeholder="Search orders and products…" /></label><button className={notificationsOpen ? 'active' : ''} onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); setNotificationsSeen(true); }} aria-label="Notifications"><Bell />{!notificationsSeen && <i />}</button><div className={`admin-profile ${profileOpen ? 'active' : ''}`} role="button" tabIndex="0" onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setProfileOpen((open) => !open); }}><span>{user.full_name.slice(0, 1)}</span><p><strong>CHRISÉA Atelier</strong><small>Admin</small></p><ChevronDown /></div>{notificationsOpen && <section className="admin-notification-panel"><header><div><p>Atelier updates</p><h2>Notifications</h2></div><span>{notices.length} updates</span></header><div>{notices.map(({ icon: Icon, title, text, page: targetPage }) => <button type="button" onClick={() => openAdminPage(targetPage)} key={title}><Icon /><span><strong>{title}</strong><small>{text}</small></span><ChevronRight /></button>)}</div></section>}{profileOpen && <section className="admin-profile-menu"><header><span>{user.full_name.slice(0, 1)}</span><div><strong>{user.full_name}</strong><small>{user.email}</small></div></header><button type="button" onClick={() => openAdminPage('dashboard')}><LayoutDashboard /> Overview</button><button type="button" onClick={() => openAdminPage('content')}><ImagePlus /> Website content</button><a href="/" target="_blank" rel="noreferrer"><ArrowUpRight /> View storefront</a><button type="button" onClick={logout}><LogOut /> Sign out</button></section>}</header><div className={`admin-content ${['add-product', 'product-detail'].includes(page) ? 'admin-content-add' : ''}`}>{error && <div className="admin-error"><AlertTriangle /> {error}<button onClick={() => load(page, selectedProductId)}>Try again</button></div>}{!pageReady && !error && <div className="admin-loading"><Sparkles /><span>Preparing your atelier…</span></div>}{pageReady && page === 'dashboard' && <Dashboard data={data} setPage={setPage} onStartGuide={() => startGuide('overview')} />}{pageReady && page === 'products' && <Products products={data.products} categories={data.categories} onAdd={() => setPage('add-product')} onView={(id) => { setSelectedProductId(id); setPage('product-detail'); }} onCategoriesChanged={() => load('products')} onDeleted={() => load('products', null, true)} onStartGuide={() => startGuide('products')} />}{pageReady && page === 'product-detail' && <AddProductPage initialProduct={data.product} categories={data.categories} onCancel={() => setPage('products')} onCreated={finishProductSave} />}{pageReady && page === 'add-product' && <AddProductPage categories={data.categories} onCancel={() => setPage('products')} onCreated={finishProductSave} />}{pageReady && page === 'orders' && <Orders orders={data.orders} onChanged={() => load('orders', null, true)} onStartGuide={() => startGuide('orders')} />}{pageReady && page === 'promotions' && <Promotions promotions={data.promotions} onChanged={() => load('promotions', null, true)} onStartGuide={() => startGuide('promotions')} />}{pageReady && page === 'content' && <WebsiteContent onStartGuide={() => startGuide('content')} />}</div></main>{guideType && activeGuide[guideStep] && <AdminTour item={activeGuide[guideStep]} step={guideStep} total={activeGuide.length} onBack={() => openGuideStep(guideStep - 1)} onNext={() => guideStep === activeGuide.length - 1 ? closeTour() : openGuideStep(guideStep + 1)} onClose={closeTour} />}</div>;
}
