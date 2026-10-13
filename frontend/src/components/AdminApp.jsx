import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowUpRight, BarChart3, Bell, Boxes, ChevronDown, ChevronRight, CircleDollarSign,
  ClipboardCheck, Diamond, Eye, EyeOff, Gem, Heart, LayoutDashboard, LockKeyhole,
  ImagePlus, LogOut, Mail, Menu, Package, PackageOpen, Plus, Search, Settings, ShoppingBag,
  SlidersHorizontal, Sparkles, Tag, UserRound, Users, X
} from 'lucide-react';
import './admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'chrisea-admin-access';

async function api(path, options = {}) {
  const token = window.sessionStorage.getItem(TOKEN_KEY);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      ...options,
      signal: options.signal || AbortSignal.timeout(12000),
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new Error('The admin server took too long to respond. Please try again.');
    throw new Error('The admin server is unavailable. Check that the backend is running.');
  }
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'Something went wrong.');
  return data?.data;
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('admin@chrisea.local');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (result.user.role !== 'admin') {
        await api('/auth/logout', { method: 'POST' });
        throw new Error('This account does not have administrator access.');
      }
      window.sessionStorage.setItem(TOKEN_KEY, result.accessToken);
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
  { id: 'customers', label: 'Customers', icon: Users, soon: true },
  { id: 'promotions', label: 'Promotions', icon: CircleDollarSign, soon: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, soon: true },
  { id: 'settings', label: 'Settings', icon: Settings, soon: true }
];

function Sidebar({ page, setPage, open, setOpen, user, onLogout }) {
  return <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
    <button className="admin-sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button>
    <a className="admin-brand" href="/"><img src="/assets/brand/chrisea-logo-full-transparent.png" alt="CHRISÉA Jewelry" /></a>
    <nav>{navItems.map(({ id, label, icon: Icon, soon }) => <button key={id} className={page === id || (id === 'products' && page === 'add-product') ? 'active' : ''} disabled={soon} onClick={() => { setPage(id); setOpen(false); }}><Icon /><span>{label}</span>{soon ? <small>Soon</small> : <ChevronRight />}</button>)}</nav>
    <div className="admin-sidebar-message"><p>Every detail,<br />beautifully managed.</p><a href="/">View store <ArrowUpRight /></a></div>
    <div className="admin-sidebar-foot"><span>{user.full_name.slice(0, 1)}</span><div><strong>{user.full_name}</strong><small>Administrator</small></div><button onClick={onLogout} aria-label="Sign out"><LogOut /></button></div>
  </aside>;
}

const money = (value) => `RM ${Number(value || 0).toFixed(2)}`;
const statusLabel = (status) => status?.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function Dashboard({ data, setPage }) {
  const stats = [
    { label: 'Products', value: data.summary.products, note: `${data.summary.variants} active variants`, icon: Gem },
    { label: 'Total stock', value: data.summary.stock, note: 'Across all active pieces', icon: Boxes },
    { label: 'Orders', value: data.summary.orders, note: `${data.summary.payments_to_review} payments to review`, icon: ShoppingBag },
    { label: 'Customers', value: data.summary.customers, note: 'Registered client accounts', icon: Users }
  ];
  const sales = data.sales || [];
  const chartValues = sales.length ? sales.map((item) => Number(item.revenue)) : [0, 0, 0, 0, 0, 0, 0];
  const chartMax = Math.max(...chartValues, 1);
  const chartPoints = chartValues.map((value, index) => `${(index / Math.max(chartValues.length - 1, 1)) * 100},${92 - (value / chartMax) * 72}`).join(' ');
  return <>
    <section className="admin-welcome"><div><p>Atelier overview</p><h1>Good day, <em>CHRISÉA.</em></h1><span>A considered view of your boutique today.</span></div><div className="admin-date"><small>{new Intl.DateTimeFormat('en-MY', { weekday: 'long' }).format(new Date())}</small><strong>{new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'long' }).format(new Date())}</strong></div></section>
    <section className="admin-stats">{stats.map(({ label, value, note, icon: Icon }) => <article key={label}><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><Icon /></article>)}</section>
    <section className="admin-dashboard-grid">
      <article className="admin-card admin-sales"><header><h2>Sales overview</h2><button>Last 30 days <ChevronDown /></button></header><div className="admin-sales-metrics"><div><strong>{money(data.summary.total_sales)}</strong><span>Total sales</span></div><div><strong>{data.summary.orders}</strong><span>Total orders</span></div><div><strong>{money(data.summary.average_order_value)}</strong><span>Average order value</span></div></div><div className="admin-chart"><span>Sales activity</span><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6d1325" stopOpacity=".22"/><stop offset="1" stopColor="#6d1325" stopOpacity="0"/></linearGradient></defs><polygon points={`0,100 ${chartPoints} 100,100`} fill="url(#salesFill)"/><polyline points={chartPoints} fill="none" stroke="#6d1325" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/></svg><div className="admin-chart-labels"><small>30 days ago</small><small>Today</small></div></div></article>
      <article className="admin-card admin-recent"><header><h2>Recent orders</h2><button onClick={() => setPage('orders')}>View all <ArrowUpRight /></button></header>{data.recentOrders.length ? <div>{data.recentOrders.map((order) => <div className="admin-order-row" key={order.id}><div><strong>{order.order_number}</strong><small>{order.full_name}</small></div><b>{money(order.grand_total)}</b><span className={`admin-status ${order.status}`}>{statusLabel(order.status)}</span></div>)}</div> : <div className="admin-empty"><ShoppingBag /><p>Your first order will appear here.</p></div>}</article>
      <article className="admin-card admin-low-stock"><header><h2>Low stock pieces</h2><button onClick={() => setPage('products')}>View all <ArrowUpRight /></button></header>{data.lowStock.length ? <div>{data.lowStock.slice(0, 4).map((item) => <div className="admin-stock-row" key={item.sku}><img src={item.image_url} alt="" /><div><strong>{item.name}</strong><small>{item.variant_name} · {item.sku}</small></div><b>{item.stock_quantity} left</b></div>)}</div> : <div className="admin-empty"><ClipboardCheck /><p>Every piece is well stocked.</p></div>}</article>
      <article className="admin-card admin-top-products"><header><h2>Top performing pieces</h2><span>Last 30 days</span></header>{data.topProducts?.length ? <div>{data.topProducts.map((item) => <div className="admin-stock-row" key={item.name}><img src={item.image_url} alt="" /><div><strong>{item.name}</strong><small>{item.units} units ordered</small></div></div>)}</div> : <div className="admin-empty"><Gem /><p>Sales will reveal your top pieces.</p></div>}</article>
      <article className="admin-collection-card"><div><Sparkles /><h2>Add new collection</h2><p>Keep your boutique fresh with new pieces.</p><button onClick={() => setPage('add-product')}><Tag /> Add product</button></div></article>
    </section>
  </>;
}

function AddProductPage({ onCancel, onCreated }) {
  const categories = ['Necklaces', 'Earrings', 'Rings', 'Bracelets'];
  const [form, setForm] = useState({ name: '', category: 'Necklaces', price: '', comparePrice: '', sku: '', variantName: 'Vintage Gold', stockQuantity: '', status: 'draft', imageUrl: '', description: '', shortDescription: '', material: '', collection: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api('/admin/products', { method: 'POST', body: JSON.stringify(form) });
      await onCreated();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };
  return <section className="admin-add-product-page">
    <form id="add-product-form" onSubmit={submit}>
      <div className="admin-add-breadcrumb"><button type="button" onClick={onCancel}>Products</button><ChevronRight /><span>Add new product</span></div>
      <header className="admin-add-header"><div><h1>Add New Product</h1><p>Create a beautiful piece and its inventory details.</p></div><div><button className="admin-cancel-product" type="button" onClick={onCancel}>Cancel</button><button className="admin-save-page" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button></div></header>
      {error && <p className="admin-add-error"><AlertTriangle /> {error}</p>}
      <div className="admin-add-layout">
        <div className="admin-add-left">
          <article className="admin-form-card admin-images-card"><header><div><h2>Product Images</h2><p>Add the main photograph for your piece.</p></div><span>{form.imageUrl ? '1' : '0'} / 10 images</span></header><div className="admin-image-workspace"><label className="admin-upload-tile"><ImagePlus /><strong>Add image</strong><span>Paste a project path or image URL below</span></label>{form.imageUrl ? <div className="admin-product-preview"><img src={form.imageUrl} alt="Product preview" /><b>Main</b><button type="button" onClick={() => setForm((current) => ({ ...current, imageUrl: '' }))}><X /></button></div> : <div className="admin-empty-image"><Plus /><span>Preview</span></div>}</div><label className="admin-page-field">Image path or URL<input value={form.imageUrl} onChange={update('imageUrl')} placeholder="/assets/products/your-product/01-main.png or https://…" /></label></article>
          <article className="admin-form-card"><header><div><h2>Basic Information</h2></div></header><div className="admin-page-form-grid"><label>Product name <b>*</b><input autoFocus value={form.name} onChange={update('name')} placeholder="e.g. Étoile Pearl Necklace" required minLength="2" /></label><label>SKU <b>*</b><input value={form.sku} onChange={update('sku')} placeholder="CHR-NKL-003" required /></label><label>Category <b>*</b><select value={form.category} onChange={update('category')}>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label>Status<select value={form.status} onChange={update('status')}><option value="draft">Draft</option><option value="active">Active</option></select></label><label className="full">Description<textarea value={form.description} onChange={update('description')} placeholder="Tell the story behind this piece — materials, inspiration, craftsmanship…" rows="5" /></label><label className="full">Short description<textarea value={form.shortDescription} onChange={update('shortDescription')} placeholder="A brief highlight for product cards and listings." rows="2" /><small>{form.shortDescription.length} / 200</small></label></div></article>
        </div>
        <div className="admin-add-right">
          <article className="admin-form-card"><header><div><h2>Pricing</h2></div></header><div className="admin-stack-fields"><label>Price (RM) <b>*</b><input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} placeholder="0.00" required /></label><label>Compare at price (RM)<input type="number" min="0" step="0.01" value={form.comparePrice} onChange={update('comparePrice')} placeholder="0.00" /><small>Original price, optional for showing discounts.</small></label></div></article>
          <article className="admin-form-card"><header><div><h2>Inventory & Variants</h2></div></header><div className="admin-stack-fields"><label>Variant name<input value={form.variantName} onChange={update('variantName')} placeholder="Vintage Gold / Adjustable" required /></label><div className="admin-variant-note"><Boxes /><div><strong>First product variant</strong><span>This creates the first colour, size or finish and keeps its inventory separately.</span></div></div><label>Initial stock <b>*</b><input type="number" min="0" step="1" value={form.stockQuantity} onChange={update('stockQuantity')} placeholder="0" required /><small>Total available stock for this variant.</small></label></div></article>
          <article className="admin-form-card"><header><div><h2>Additional Details</h2></div></header><div className="admin-stack-fields"><label>Material<input value={form.material} onChange={update('material')} placeholder="e.g. 18K Gold Vermeil, Sterling Silver" /></label><label>Collection<select value={form.collection} onChange={update('collection')}><option value="">Select collection</option><option>New Arrivals</option><option>Signature Collection</option><option>Bridal Edit</option></select></label><label>Tags<input value={form.tags} onChange={update('tags')} placeholder="pearl, minimalist, gift, bestseller" /><small>Separate tags with commas.</small></label></div></article>
        </div>
      </div>
    </form>
  </section>;
}

function Products({ products = [], onAdd }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(), [products]);
  const filtered = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.category} ${product.slug}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === 'all' || product.category === category) && (status === 'all' || product.status === status);
  }), [products, query, category, status]);
  const active = products.filter((product) => product.status === 'active').length;
  const totalStock = products.reduce((sum, product) => sum + Number(product.stock_quantity || 0), 0);
  const lowStock = products.filter((product) => Number(product.stock_quantity || 0) <= 3).length;
  return <section className="admin-products-page">
    <div className="admin-page-heading"><div><p>Atelier catalogue</p><h1>Product collection</h1><span>Curate every piece, variant and stock level in one place.</span></div><button className="admin-primary" onClick={onAdd}><Package /> Add product</button></div>
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
        <div className="admin-product-filters"><SlidersHorizontal /><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
      </div>
      <div className="admin-table-wrap admin-product-table"><table><thead><tr><th>Piece</th><th>Category</th><th>Price</th><th>Variants</th><th>Inventory</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><img src={product.image_url} alt={product.name} /><div><strong>{product.name}</strong><small>/{product.slug}</small></div></div></td><td>{product.category || 'Uncategorised'}</td><td><strong className="admin-product-price">{money(product.base_price)}</strong></td><td>{product.variant_count} {Number(product.variant_count) === 1 ? 'variant' : 'variants'}</td><td><div className="admin-inventory"><b className={Number(product.stock_quantity) <= 3 ? 'stock-empty' : ''}>{product.stock_quantity} in stock</b><i><span style={{ width: `${Math.min(Number(product.stock_quantity || 0) * 10, 100)}%` }} /></i></div></td><td><span className={`admin-status ${product.status}`}>{statusLabel(product.status)}</span></td><td><button className="admin-row-action" aria-label={`View ${product.name}`}><ChevronRight /></button></td></tr>)}</tbody></table>{!filtered.length && <div className="admin-product-empty"><Search /><h3>No matching pieces</h3><p>Try a different search or clear a filter.</p></div>}</div>
    </div>
  </section>;
}

function Orders({ orders = [] }) {
  return <section><div className="admin-page-heading"><div><p>Client care</p><h1>Order ledger</h1><span>Review payments and follow every order journey</span></div></div>{orders.length ? <div className="admin-table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.order_number}</strong><small className="admin-table-date">{new Date(order.created_at).toLocaleDateString('en-MY')}</small></td><td><strong>{order.full_name}</strong><small className="admin-table-date">{order.email}</small></td><td>{order.item_count}</td><td>{statusLabel(order.payment_method)}</td><td>{money(order.grand_total)}</td><td><span className={`admin-status ${order.status}`}>{statusLabel(order.status)}</span></td></tr>)}</tbody></table></div> : <div className="admin-card admin-orders-empty"><ShoppingBag /><p>No orders yet</p><h2>Your first customer order will appear here.</h2><span>Once checkout is connected, you can review payment proofs and move orders through fulfilment.</span></div>}</section>;
}

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = async (currentPage = page) => {
    setError('');
    try {
      if (currentPage === 'dashboard') setData(await api('/admin/dashboard'));
      if (currentPage === 'products') setData({ products: (await api('/admin/products')).products });
      if (currentPage === 'orders') setData({ orders: (await api('/admin/orders')).orders });
      if (currentPage === 'add-product') setData({ ready: true });
    } catch (loadError) { setError(loadError.message); }
  };

  useEffect(() => {
    const token = window.sessionStorage.getItem(TOKEN_KEY);
    if (!token) { setCheckingSession(false); return; }
    api('/auth/me')
      .then(({ user: account }) => account.role === 'admin' ? setUser(account) : window.sessionStorage.removeItem(TOKEN_KEY))
      .catch(() => window.sessionStorage.removeItem(TOKEN_KEY))
      .finally(() => setCheckingSession(false));
  }, []);
  useEffect(() => { if (user) { setData(null); load(page); } }, [user, page]);

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* Clear local access regardless. */ }
    window.sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  if (checkingSession) return <main className="admin-session-loading"><img src="/assets/brand/chrisea-logo-full-transparent.png" alt="CHRISÉA Jewelry" /><Sparkles /><span>Opening your atelier…</span></main>;
  if (!user) return <AdminLogin onLogin={setUser} />;
  return <div className="admin-shell"><Sidebar page={page} setPage={setPage} open={menuOpen} setOpen={setMenuOpen} user={user} onLogout={logout} /><main className="admin-main"><header className="admin-topbar"><button onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><label><Search /><input placeholder="Search orders, products, customers…" /></label><button aria-label="Notifications"><Bell /><i /></button><div className="admin-profile"><span>{user.full_name.slice(0, 1)}</span><p><strong>CHRISÉA Atelier</strong><small>Admin</small></p><ChevronDown /></div></header><div className={`admin-content ${page === 'add-product' ? 'admin-content-add' : ''}`}>{error && <div className="admin-error"><AlertTriangle /> {error}<button onClick={() => load(page)}>Try again</button></div>}{!data && !error && <div className="admin-loading"><Sparkles /><span>Preparing your atelier…</span></div>}{data && page === 'dashboard' && <Dashboard data={data} setPage={setPage} />}{data && page === 'products' && <Products products={data.products} onAdd={() => setPage('add-product')} />}{data && page === 'add-product' && <AddProductPage onCancel={() => setPage('products')} onCreated={() => setPage('products')} />}{data && page === 'orders' && <Orders orders={data.orders} />}</div></main></div>;
}
