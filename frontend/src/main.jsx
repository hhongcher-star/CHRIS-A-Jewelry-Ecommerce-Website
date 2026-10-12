import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  Camera,
  Gem,
  Gift,
  Heart,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import HeroSlider from './components/HeroSlider';
import './styles.css';

const A = '/assets/products';
const ABOUT_CONTENT_ENDPOINT = import.meta.env.VITE_ABOUT_CONTENT_ENDPOINT || '/content/about.json';
const SHOP_PROMOTIONS_ENDPOINT = import.meta.env.VITE_SHOP_PROMOTIONS_ENDPOINT || '/content/shop-promotions.json';
const CONTACT_CONTENT_ENDPOINT = import.meta.env.VITE_CONTACT_CONTENT_ENDPOINT || '/content/contact.json';

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

const categories = [
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

const CART_KEY = 'chrisea-cart';
const readCart = () => {
  try { return JSON.parse(window.localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
};
const writeCart = (items) => {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('chrisea-cart-change', { detail: items }));
};
const addCartItem = (product, quantity = 1) => {
  const items = readCart();
  const existing = items.find((item) => item.name === product.name);
  const next = existing ? items.map((item) => item.name === product.name ? { ...item, quantity: item.quantity + quantity } : item) : [...items, { name: product.name, quantity }];
  writeCart(next);
  return next;
};

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
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
  const searchResults = searchQuery.trim().length < 2 ? [] : shopProducts.filter((product) => `${product.name} ${product.category} ${product.detail}`.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 6);
  return (
    <>
      <div className="announcement" aria-label="Complimentary shipping on orders over RM200. Gift-ready packaging.">
        <div className="announcement-track" aria-hidden="true">
          {[0, 1].map((group) => (
            <div className="announcement-group" key={group}>
              <span>✦ Complimentary shipping on orders over RM200</span>
              <i />
              <span>Gift-ready packaging</span>
              <i />
              <span>✦ Complimentary shipping on orders over RM200</span>
              <i />
              <span>Gift-ready packaging</span>
              <i />
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
            {searchResults.map((product) => { const href = `/product/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`; return <a className="header-search-result" href={href} key={product.name}><img src={product.image} alt="" /><span><small>{product.category}</small><strong>{product.name}</strong><em>{product.price}</em></span></a>; })}
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
      <div className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <button className="icon-button menu-close" onClick={close} aria-label="Close menu"><X /></button>
        <BrandMark light />
        <button className="mobile-search-trigger" type="button" onClick={() => { close(); setSearchOpen(true); }}><Search size={18} /> Search jewellery</button>
        {mobileNavigation.map((item) => (
          <a href={item.href} onClick={close} key={item.label}>{item.label}</a>
        ))}
      </div>
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

function SiteFooter() {
  const [carePanel, setCarePanel] = useState(null);
  const [contactContent, setContactContent] = useState({ eyebrow: 'We are here to help', title: 'Contact CHRISÉA', intro: 'Questions about a piece, an order or a gift? Our customer care team would be delighted to help.', sections: [['Email', 'hello@chrisea.com'], ['WhatsApp concierge', 'Available Monday to Saturday, 10:00 AM–6:00 PM MYT.'], ['Our boutique', 'CHRISÉA is an online jewellery house based in Malaysia.']] });
  const careContent = {
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
    contact: contactContent,
  };

  useEffect(() => {
    let active = true;
    fetch(CONTACT_CONTENT_ENDPOINT).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => active && setContactContent(data)).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!carePanel) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setCarePanel(null);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [carePanel]);

  const activeCare = carePanel ? careContent[carePanel] : null;

  return (
    <footer id="contact">
      <div className="footer-main section-pad">
        <div className="footer-brand"><img className="footer-logo" src="/assets/brand/chrisea-logo-full-transparent.png" alt="CHRISÉA Jewelry logo" /><p>Timeless pieces for modern romantics.<br />Designed to celebrate every chapter.</p><a href="/#top"><span aria-hidden="true">◎</span> Follow our journey</a></div>
        <div><h3>Shop</h3><a href="/shop">All products</a><a href="/shop?category=Necklaces">Necklaces</a><a href="/shop?category=Earrings">Earrings</a><a href="/shop?category=Rings">Rings</a><a href="/shop?category=Bracelets">Bracelets</a></div>
        <div className="footer-care"><h3>Customer care</h3><button type="button" onClick={() => setCarePanel('faq')}>FAQ</button><button type="button" onClick={() => setCarePanel('shipping')}>Shipping & delivery</button><button type="button" onClick={() => setCarePanel('returns')}>Return & refund</button><button type="button" onClick={() => setCarePanel('contact')}>Contact us</button></div>
        <div className="newsletter"><h3>Join our journey</h3><p>Be the first to know about new arrivals, exclusive offers and more.</p><form onSubmit={(e) => e.preventDefault()}><label className="sr-only" htmlFor="email">Email address</label><input id="email" type="email" placeholder="Your email address" /><button aria-label="Subscribe"><ArrowRight /></button></form></div>
      </div>
      <div className="footer-bottom"><span>© 2026 CHRISÉA Jewelry. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms & Conditions</span></div>
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
  hero: { eyebrow: 'The story of CHRISÉA', title: 'Jewellery for the chapters you’ll always remember.', intro: 'Born from a love of keepsakes, CHRISÉA brings vintage romance into the everyday.', image: '/assets/about/about-hero.jpg', imageAlt: 'Elegant woman wearing pearl jewellery' },
  story: { eyebrow: 'Our beginning', title: 'A little nostalgia, made for now.', paragraphs: ['CHRISÉA began with a simple belief: the jewellery we reach for most should feel as meaningful as the moments it becomes part of.'], signature: 'For every chapter, with love.', mainImage: '/assets/about/about-origin-main.jpg', detailImage: '/assets/about/about-origin-detail.jpg' },
  valuesEyebrow: 'What guides us', valuesTitle: 'Beauty with meaning', values: [], quote: 'The best jewellery does not simply complete a look. It keeps a feeling close.',
  journey: { eyebrow: 'Our journey', title: 'A story still unfolding', items: [] },
  cta: { eyebrow: 'Find your keepsake', title: 'Wear the moment. Keep the memory.', buttonLabel: 'Explore the collection', buttonHref: '/shop', image: '/assets/about/about-cta.jpg' },
};

function AboutPage() {
  const [content, setContent] = useState(aboutFallback);

  useEffect(() => {
    let active = true;
    fetch(ABOUT_CONTENT_ENDPOINT)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('About content unavailable')))
      .then((data) => active && setContent(data))
      .catch(() => {});
    return () => { active = false; };
  }, []);

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
          <div className="about-hero-image"><img src={hero.image} alt={hero.imageAlt} /></div>
          <span className="about-hero-index">Est. 2026 · Malaysia</span>
        </section>

        <section className="about-origin section-pad">
          <div className="about-origin-art">
            <img className="about-origin-main" src={story.mainImage} alt="CHRISÉA pearl jewellery styling" />
            <img className="about-origin-detail" src={story.detailImage} alt="CHRISÉA jewellery detail" />
            <div className="about-origin-mark">C<span>✦</span></div>
          </div>
          <div className="about-origin-copy">
            <p className="eyebrow dark">{story.eyebrow}</p>
            <h2>{story.title}</h2>
            <div className="short-rule" />
            {story.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
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
          <img src={cta.image} alt="CHRISÉA jewellery collection" />
          <div className="about-cta-shade" />
          <div className="about-cta-copy"><p>{cta.eyebrow}</p><h2>{cta.title}</h2><a className="button button-outline" href={cta.buttonHref}>{cta.buttonLabel}<ArrowRight size={15} /></a></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

const promotionFallback = [
  { id: 'signature-edit', active: true, eyebrow: 'The signature edit', title: 'A little something, just for you.', description: 'Discover handpicked pieces made for gifting, keeping and every meaningful moment between.', buttonLabel: 'Shop the edit', buttonHref: '/shop#sale-favourites', image: '/assets/editorial/styled-by-you-main.png', imageAlt: 'CHRISÉA signature jewellery edit' },
];

function ShopPromotionSlider() {
  const [promotions, setPromotions] = useState(promotionFallback);
  const [active, setActive] = useState(0);
  const visiblePromotions = promotions.filter((promotion) => promotion.active !== false);

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
  const current = visiblePromotions[active];

  return (
    <section className="shop-promotion" aria-roledescription="carousel" aria-label="Current promotions">
      <div className="shop-promotion-media">
        {visiblePromotions.map((promotion, index) => <img className={index === active ? 'is-active' : ''} src={promotion.image} alt={index === active ? promotion.imageAlt : ''} aria-hidden={index !== active} key={promotion.id} />)}
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
        {visiblePromotions.map((promotion, index) => <button className={index === active ? 'is-active' : ''} type="button" onClick={() => setActive(index)} aria-label={`Show promotion ${index + 1}`} key={promotion.id}><span>0{index + 1}</span><i><b /></i></button>)}
      </div>
      <div className="shop-promotion-counter">0{active + 1}<i />0{visiblePromotions.length}</div>
    </section>
  );
}

const saleFavorites = [
  { ...shopProducts[0], discount: '20% off', salePrice: 'RM134' },
  { ...shopProducts[5], discount: '20% off', salePrice: 'RM96' },
  { ...shopProducts[8], discount: '25% off', salePrice: 'RM104' },
  { ...shopProducts[9], discount: '20% off', salePrice: 'RM122' },
];

function SaleFavorites() {
  return (
    <section className="sale-favorites section-pad" id="sale-favourites" aria-labelledby="sale-favorites-title">
      <header className="sale-favorites-heading">
        <span />
        <div><h2 id="sale-favorites-title">Sale Favourites</h2><p>Handpicked pieces at special prices.</p></div>
        <span />
      </header>
      <div className="sale-favorites-grid">
        {saleFavorites.map((product) => {
          const productUrl = `/product/${encodeURIComponent(product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))}`;
          return (
            <article className="sale-favorite-card" key={product.name}>
              <a href={productUrl} className="sale-favorite-image" aria-label={`View ${product.name}`}>
                <img src={product.image} alt={product.name} />
                <span>{product.discount}</span>
              </a>
              <p>{product.category}</p>
              <h3><a href={productUrl}>{product.name}</a></h3>
              <div><strong>{product.salePrice}</strong><del>{product.price}</del></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ShopPage() {
  const requestedCategory = new URLSearchParams(window.location.search).get('category');
  const [category, setCategory] = useState(['Necklaces', 'Earrings', 'Rings', 'Bracelets'].includes(requestedCategory) ? requestedCategory : 'All');
  const [wish, setWish] = useState([]);
  const visibleProducts = category === 'All' ? shopProducts : shopProducts.filter((product) => product.category === category);
  const toggleWish = (name) => setWish((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);

  return (
    <div className="page-shell shop-page">
      <Header />
      <main>
        <ShopPromotionSlider />
        <SaleFavorites />
        <section className="shop-catalog section-pad" id="categories" aria-label="All jewellery">
          <header className="shop-catalog-heading"><p>Shop by category</p><h2>Find your signature piece</h2></header>
          <div className="shop-toolbar">
            <div className="shop-filters" aria-label="Filter products by category">
              {['All', 'Necklaces', 'Earrings', 'Rings', 'Bracelets'].map((item) => (
                <button className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>
              ))}
            </div>
            <span>{visibleProducts.length} pieces</span>
          </div>
          <div className="shop-grid">
            {visibleProducts.map((product) => {
              const productUrl = `/product/${encodeURIComponent(product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))}`;
              return (
              <article className="shop-card" key={product.name}>
                <div className="shop-card-image">
                  <a className="shop-image-link" href={productUrl} aria-label={`View ${product.name}`}>
                    <img className="shop-image-primary" src={product.image} alt={product.name} />
                    <img className="shop-image-secondary" src={product.hoverImage} alt="" aria-hidden="true" />
                  </a>
                  <button className={`heart-button ${wish.includes(product.name) ? 'active' : ''}`} onClick={() => toggleWish(product.name)} aria-label={`Save ${product.name}`}><Heart /></button>
                  <button className="quick-add" onClick={() => addCartItem(product)}>Quick add</button>
                </div>
                <div className="shop-card-copy">
                  <p>{product.category}</p>
                  <h2><a href={productUrl}>{product.name}</a></h2>
                  <span>{product.detail}</span>
                  <div className="shop-card-actions">
                    <strong>{product.price}</strong>
                    <a className="view-product-button" href={productUrl} aria-label={`View ${product.name}`}>View product <span aria-hidden="true">→</span></a>
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
  const product = shopProducts.find((item) => item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug) || shopProducts[0];
  const images = [product.image, product.hoverImage];
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="page-shell product-page">
      <Header />
      <main className="product-detail section-pad">
        <div className="product-breadcrumb"><a href="/#top">Home</a><span>/</span><a href="/shop">Shop</a><span>/</span><span>{product.category}</span><span>/</span><b>{product.name}</b></div>
        <section className="product-detail-grid">
          <div className="product-gallery">
            <div className="product-thumbnails">
              {images.map((image, index) => (
                <button className={selectedImage === image ? 'is-active' : ''} onClick={() => setSelectedImage(image)} key={image}><img src={image} alt={`${product.name} view ${index + 1}`} /></button>
              ))}
            </div>
            <div className="product-main-image"><img src={selectedImage} alt={product.name} /></div>
          </div>
          <div className="product-information">
            <p className="product-type">{product.category}</p>
            <h1>{product.name}</h1>
            <p className="product-price">{product.price}</p>
            <div className="product-divider" />
            <p className="product-summary">A refined CHRISÉA piece created with vintage-inspired detail and an elegant finish—designed to become part of your everyday story.</p>
            <div className="product-material"><span>Material</span><strong>{product.detail}</strong></div>
            <div className="product-purchase-panel">
              <p className="quantity-label">Quantity</p>
              <div className="product-buy-row">
                <div className="quantity-control" aria-label="Quantity"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span>{quantity}</span><button onClick={() => setQuantity((value) => value + 1)}>+</button></div>
                <button className="product-add" onClick={() => addCartItem(product, quantity)}>Add to cart <span>— {product.price}</span></button>
              </div>
              <button className="product-buy-now" onClick={() => { addCartItem(product, quantity); window.location.href = '/cart'; }}>Buy it now <ArrowRight /></button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

const reviewSamples = [
  { title: 'So elegant and timeless', copy: 'The finish feels beautifully considered and the delicate scale makes it easy to wear every day.', image: '/assets/reviews/review-necklace.jpg', product: 'Enamel Pendant Necklace' },
  { title: 'Perfect for everyday wear', copy: 'Minimal, refined and easy to style. It adds just enough detail without ever feeling too much.', image: '/assets/reviews/review-styling.jpg', product: 'Statement Zircon Ring' },
  { title: 'A lovely finishing touch', copy: 'Lightweight, polished and quietly distinctive—the kind of piece that completes a look.', image: '/assets/reviews/review-earrings.jpg', product: 'Mother-of-Pearl Earrings' },
  { title: 'Beautifully made', copy: 'The proportions are delicate and the presentation makes the whole experience feel special.', image: '/assets/reviews/review-styling.jpg', product: 'Four-Leaf Zircon Ring' },
  { title: 'A piece to cherish', copy: 'A romantic little detail with a modern feel. It layers beautifully with pieces I already own.', image: '/assets/reviews/review-necklace.jpg', product: 'Vintage Heart Necklace' },
  { title: 'Simply perfect', copy: 'Exactly the understated sparkle I was looking for, with a finish that feels refined and wearable.', image: '/assets/reviews/review-earrings.jpg', product: 'Zircon Button Earrings' },
];

function ReviewsPage() {
  const [rating, setRating] = useState('All');
  const filters = ['All', '5 Stars', '4 Stars', 'With Photos'];
  return (
    <div className="page-shell reviews-page">
      <Header />
      <main>
        <section className="reviews-hero">
          <img src="/assets/reviews/reviews-hero.jpg" alt="Woman wearing delicate gold jewellery" />
          <div className="reviews-hero-shade" />
          <div className="reviews-hero-copy"><p>The CHRISÉA experience</p><h1>Loved, Worn<br />&amp; Cherished.</h1><span /><p>Stories from our community—because the most meaningful pieces are the ones that become part of your story.</p></div>
        </section>

        <section className="reviews-summary section-pad" aria-label="Review summary">
          <div className="reviews-score"><strong>4.9</strong><div><span>★★★★★</span><small>Customer experience</small></div></div>
          <div className="reviews-trust"><div><Gem /><strong>Thoughtful feedback</strong><span>Shared by our community</span></div><div><Camera /><strong>Photos &amp; stories</strong><span>See how they style it</span></div><div><Heart /><strong>Pieces to cherish</strong><span>Made for every chapter</span></div></div>
        </section>

        <section className="reviews-feed section-pad">
          <div className="reviews-feed-head"><div><p>Community notes</p><h2>In their own words</h2></div><span>Sample review layout</span></div>
          <div className="reviews-toolbar" aria-label="Filter reviews">{filters.map((item) => <button className={rating === item ? 'is-active' : ''} onClick={() => setRating(item)} key={item}>{item}</button>)}</div>
          <div className="reviews-grid">
            {reviewSamples.map((review, index) => <article className="review-card" key={`${review.title}-${index}`}>
              <img src={review.image} alt="Jewellery styling detail" />
              <div className="review-card-copy"><span className="review-stars">★★★★★</span><h3>{review.title}</h3><p>{review.copy}</p><footer><strong>Community member</strong><span>● Verified purchase</span></footer><small>{review.product}</small></div>
            </article>)}
          </div>
        </section>

        <section className="reviews-social section-pad">
          <div className="reviews-social-copy"><p>Spotted on you</p><h2>Styled by You</h2><span /><p>A glimpse of how our community wears CHRISÉA. Share your look and become part of the story.</p><a href="/#contact">Tag @chrisea.jewelry <ArrowRight size={14} /></a></div>
          <div className="reviews-social-grid"><img src="/assets/reviews/review-earrings.jpg" alt="Gold earrings styled by the community" /><img src="/assets/reviews/review-styling.jpg" alt="Gold ring styling detail" /><img src="/assets/reviews/review-necklace.jpg" alt="Fine necklace styling detail" /></div>
        </section>

        <section className="reviews-cta"><div><p>Your story matters</p><h2>A Little Love Note?</h2><span>We’d love to hear about your CHRISÉA experience.</span><a href="mailto:hello@chrisea.com">Write a review <ArrowRight size={14} /></a></div></section>
        <section className="reviews-service-strip section-pad"><div><Truck /><span><strong>Free shipping</strong>On orders over RM200</span></div><div><Gift /><span><strong>Beautiful packaging</strong>Designed with care</span></div><div><ShieldCheck /><span><strong>Secure payment</strong>Your information is safe</span></div><div><Heart /><span><strong>Need help?</strong>We’re here for you</span></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}

function CartPage() {
  const [cart, setCart] = useState(() => readCart());
  const [promo, setPromo] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [discount, setDiscount] = useState(0);
  const cartItems = cart.map((item) => ({ ...shopProducts.find((product) => product.name === item.name), quantity: item.quantity })).filter((item) => item.name);
  const subtotal = cartItems.reduce((total, item) => total + Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity, 0);
  const total = subtotal * (1 - discount);
  const recommendations = shopProducts.filter((product) => !cart.some((item) => item.name === product.name)).slice(0, 4);
  const syncCart = (next) => { setCart(next); writeCart(next); };
  const updateQuantity = (name, amount) => syncCart(cart.map((item) => item.name === name ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item));
  const removeItem = (name) => syncCart(cart.filter((item) => item.name !== name));
  const moveToWishlist = (name) => {
    const wishlist = JSON.parse(window.localStorage.getItem('chrisea-wishlist') || '[]');
    window.localStorage.setItem('chrisea-wishlist', JSON.stringify([...new Set([...wishlist, name])]));
    removeItem(name);
  };
  const addRecommended = (product) => {
    const next = addCartItem(product);
    setCart(next);
  };
  const applyPromo = () => {
    if (promo.trim().toUpperCase() === 'CHRISEA10') { setDiscount(.1); setPromoMessage('CHRISEA10 applied — 10% off'); }
    else { setDiscount(0); setPromoMessage('Promo code not recognised'); }
  };
  const proceedToReceipt = () => {
    const receipt = { id: `CHR-${Date.now().toString().slice(-8)}`, placedAt: new Date().toISOString(), items: cartItems, subtotal, discount, total };
    window.localStorage.setItem('chrisea-latest-receipt', JSON.stringify(receipt));
    writeCart([]);
    window.location.href = '/receipt';
  };

  return (
    <div className="page-shell cart-page">
      <Header />
      <main>
        <section className="cart-hero"><img src="/assets/cart/cart-hero.jpg" alt="Gold ring displayed on soft ivory fabric" /><div className="cart-hero-shade" /><div><p>Shopping cart</p><h1>Your Cart</h1><span /><p>Beautiful pieces are just a few steps away.</p></div></section>
        <section className="cart-layout section-pad">
          <div className="cart-main">
            {cartItems.length ? <>
              <div className="cart-table-head"><span>Product</span><span>Price</span><span>Quantity</span><span>Total</span></div>
              <div className="cart-items">{cartItems.map((item) => <article className="cart-item" key={item.name}>
                <a href={`/product/${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}><img src={item.image} alt={item.name} /></a>
                <div className="cart-item-info"><h2>{item.name}</h2><p>{item.detail}</p><span>● &nbsp;In stock</span><div><button onClick={() => removeItem(item.name)}>Remove</button><i /><button onClick={() => moveToWishlist(item.name)}>Move to wishlist</button></div></div>
                <strong>{item.price}</strong>
                <div className="cart-quantity"><button onClick={() => updateQuantity(item.name, -1)} aria-label={`Decrease ${item.name} quantity`}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.name, 1)} aria-label={`Increase ${item.name} quantity`}>+</button></div>
                <b>RM {(Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}</b>
              </article>)}</div>
            </> : <div className="cart-empty"><p>Your bag is waiting</p><h2>Find something made for your story.</h2><a href="/shop">Explore the collection <ArrowRight size={14} /></a></div>}

            <section className="cart-recommendations"><p>You might also like</p><h2>Complete the Look</h2><div>{recommendations.map((product) => <article key={product.name}><a href={`/product/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}><img src={product.image} alt={product.name} /></a><h3>{product.name}</h3><span>{product.price}</span><button onClick={() => addRecommended(product)}>Add to cart</button></article>)}</div></section>
          </div>

          <aside className="cart-summary"><h2>Order Summary</h2><div className="cart-summary-row"><span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span><strong>RM {subtotal.toFixed(2)}</strong></div>{discount > 0 && <div className="cart-summary-row"><span>Discount</span><strong>− RM {(subtotal * discount).toFixed(2)}</strong></div>}<div className="cart-summary-row"><span>Shipping</span><span>Calculated at next step</span></div><div className="cart-summary-total"><span>Total</span><strong>RM {total.toFixed(2)}</strong></div>
            {cartItems.length ? <button className="cart-checkout" type="button" onClick={proceedToReceipt}>Proceed to checkout <ArrowRight size={14} /></button> : <span className="cart-checkout is-disabled">Your cart is empty</span>}
            <a className="cart-continue" href="/shop">Continue shopping</a>
            <div className="cart-promo"><label htmlFor="promo">Have a promo code?</label><div><input id="promo" value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Enter promo code" /><button onClick={applyPromo}>Apply</button></div>{promoMessage && <p>{promoMessage}</p>}</div>
            <div className="cart-benefits"><div><Truck /><span><strong>Free shipping</strong>Orders over RM250</span></div><div><Gift /><span><strong>Beautiful packaging</strong>Designed with care</span></div><div><ShieldCheck /><span><strong>Secure payment</strong>Your information is safe</span></div></div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ReceiptPage() {
  const [receipt] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('chrisea-latest-receipt') || 'null'); } catch { return null; }
  });
  const placedDate = receipt ? new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(receipt.placedAt)) : '';
  return (
    <div className="page-shell receipt-page">
      <Header />
      <main>
        <section className="receipt-hero"><p>Order receipt</p><h1>Thank you for choosing CHRISÉA.</h1><span /><p>Your jewellery story has begun.</p></section>
        {receipt ? <section className="receipt-layout section-pad">
          <div className="receipt-main">
            <div className="receipt-status"><span>✓</span><div><p>Order received</p><h2>Your order is confirmed.</h2><small>A copy of these details can be kept for your records.</small></div></div>
            <div className="receipt-meta"><div><span>Order number</span><strong>{receipt.id}</strong></div><div><span>Order date</span><strong>{placedDate}</strong></div><div><span>Status</span><strong>Being prepared</strong></div></div>
            <section className="receipt-items"><h2>Your pieces</h2>{receipt.items.map((item) => <article key={item.name}><img src={item.image} alt={item.name} /><div><h3>{item.name}</h3><p>{item.detail}</p><span>Quantity: {item.quantity}</span></div><strong>RM {(Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}</strong></article>)}</section>
          </div>
          <aside className="receipt-summary"><h2>Receipt Summary</h2><div><span>Subtotal</span><strong>RM {receipt.subtotal.toFixed(2)}</strong></div>{receipt.discount > 0 && <div><span>Discount</span><strong>− RM {(receipt.subtotal * receipt.discount).toFixed(2)}</strong></div>}<div><span>Shipping</span><strong>Complimentary</strong></div><footer><span>Total</span><strong>RM {receipt.total.toFixed(2)}</strong></footer><p>Questions about your order?</p><button type="button" onClick={() => window.location.href = '/#contact'}>Contact us</button></aside>
        </section> : <section className="receipt-empty section-pad"><p>No recent receipt found.</p><h2>Your next keepsake is waiting.</h2><a href="/shop">Explore the collection <ArrowRight size={14} /></a></section>}
      </main>
      <SiteFooter />
    </div>
  );
}

function App() {
  const [wish, setWish] = useState([]);
  const toggleWish = (name) => setWish((items) => items.includes(name) ? items.filter((x) => x !== name) : [...items, name]);

  return (
    <div className="page-shell">
      <Header />

      <main>
        <HeroSlider />

        <section className="category-grid section-pad" id="categories" aria-label="Shop by category">
          {categories.map((category) => (
            <a className="category-card" href={`/shop?category=${category.name}`} key={category.name}>
              <div className="image-wrap"><img src={category.image} alt={`${category.name} collection`} /></div>
              <h2>{category.name}</h2><span>Explore <ArrowRight size={13} /></span>
            </a>
          ))}
        </section>

        <section className="arrivals section-pad" id="new">
          <div className="section-intro">
            <p className="eyebrow dark">New</p>
            <h2>New arrivals</h2>
            <div className="short-rule" />
            <p>Curated pieces for modern romantics.</p>
            <a className="button button-dark" href="/shop">View all <ArrowRight size={15} /></a>
          </div>
          <div className="product-track" id="products">
            {products.map((product) => (
              <article className="product-card" key={product.name}>
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                  <button className={`heart-button ${wish.includes(product.name) ? 'active' : ''}`} onClick={() => toggleWish(product.name)} aria-label={`Save ${product.name}`}><Heart /></button>
                  <button className="quick-add" onClick={() => addCartItem(product)}>Quick add</button>
                </div>
                <div className="product-copy"><h3>{product.name}</h3><p>{product.detail}</p><strong>{product.price}</strong></div>
              </article>
            ))}
          </div>
        </section>

        <section className="editorial-edit section-pad" id="promotion">
          <div className="editorial-copy">
            <p className="editorial-label">The CHRISÉA Edit</p>
            <div className="short-rule" />
            <h2>Styled by You.</h2>
            <h3>Everyday Elegance</h3>
            <p>Timeless pieces, effortless looks. See how our jewelry brings a touch of elegance to your everyday moments.</p>
            <a className="button button-dark editorial-cta" href="/shop">Explore collection <ArrowRight size={15} /></a>
            <p className="editorial-signoff">Real moments.<br />Lasting impressions.</p>
          </div>

          <a className="editorial-card editorial-card--main" href="/product/lapis-lazuli-vintage-ring" aria-label="View Lapis Lazuli Vintage Ring">
            <img src="/assets/products/lapis-mother-of-pearl-ring/01-vintage-gold.png" alt="S925 Vintage Zircon Lapis Lazuli Ring" />
            <span className="editorial-card-gradient" />
            <span className="editorial-product-copy"><small>Rings</small><strong>Lapis Lazuli Vintage Ring</strong><em>View product <ArrowRight /></em></span>
            <span className="editorial-product-plus">+</span>
          </a>

          <div className="editorial-stack">
            <a className="editorial-card" href="/product/statement-heart-zircon-earrings" aria-label="View Statement Heart Zircon Earrings">
              <img src="/assets/products/statement-heart-zircon-earrings/01-vintage-gold.png" alt="S925 Sterling Silver Statement Heart Zircon Earrings" />
              <span className="editorial-card-gradient" />
              <span className="editorial-product-copy"><small>Earrings</small><strong>Heart Zircon Earrings</strong><em>View product <ArrowRight /></em></span>
              <span className="editorial-product-plus">+</span>
            </a>
            <a className="editorial-card" href="/product/gilded-bow-ring" aria-label="View Gilded Bow Ring">
              <img src="/assets/products/gilded-bow-ring/04-main.png" alt="Gilded Bow Ring" />
              <span className="editorial-card-gradient" />
              <span className="editorial-product-copy"><small>Rings</small><strong>Gilded Bow Ring</strong><em>View product <ArrowRight /></em></span>
              <span className="editorial-product-plus">+</span>
            </a>
          </div>
        </section>

        <section className="story section-pad" id="story">
          <div className="story-copy">
            <p className="eyebrow dark">Our story</p>
            <h2>More than<br />jewellery</h2>
            <div className="short-rule" />
            <p>CHRISÉA celebrates modern romance through vintage-inspired details, luminous pearls and meaningful motifs. Each piece is selected to feel personal—made for everyday elegance, thoughtful gifts and the milestones worth remembering.</p>
            <a className="button button-dark story-button" href="/about">Discover our story <ArrowRight size={15} /></a>
            <p className="story-signoff"><span />Every detail tells a story.</p>
          </div>
          <div className="story-collage">
            <img className="story-main" src={`${A}/pearl-turquoise-bracelet/03-lifestyle.png`} alt="Pearl and turquoise bracelet styled on the wrist" />
            <img className="story-detail" src={`${A}/minimalist-pearl-bracelet/03-lifestyle.png`} alt="Natural pearl bracelet in a warm vintage setting" />
            <div className="story-seal">Designed<br />for<br /><b>✦</b><br />every<br />chapter</div>
          </div>
        </section>

        <section className="promise section-pad" id="reviews">
          <div className="promise-heading"><p className="eyebrow dark">The CHRISÉA promise</p><h2>Made to be treasured</h2></div>
          <div className="promise-grid">
            <div><Sparkles /><h3>Thoughtful details</h3><p>Vintage-inspired forms, meaningful motifs and a refined finish.</p></div>
            <div><Gift /><h3>Gift-ready</h3><p>Every order is prepared to make the unboxing feel special.</p></div>
            <div><Truck /><h3>Malaysia delivery</h3><p>Carefully packed for delivery across our supported locations.</p></div>
            <div><ShieldCheck /><h3>Personal service</h3><p>Order and payment confirmation handled directly via WhatsApp.</p></div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

const currentPath = window.location.pathname;
createRoot(document.getElementById('root')).render(currentPath.startsWith('/product/') ? <ProductPage /> : currentPath.startsWith('/shop') ? <ShopPage /> : currentPath.startsWith('/about') ? <AboutPage /> : currentPath.startsWith('/reviews') ? <ReviewsPage /> : currentPath.startsWith('/cart') ? <CartPage /> : currentPath.startsWith('/receipt') ? <ReceiptPage /> : <App />);
