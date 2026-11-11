import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { freshAssetUrl } from '../asset-url.js';

const SLIDE_DURATION = 4000;

export const heroSlides = [
  {
    collection: 'CHRISÉA / COLLECTION 01',
    title: 'An Expression of Elegance.',
    titleLines: ['An Expression', 'of Elegance.'],
    description: 'Discover the beauty in every detail.',
    cta: 'Explore Collection',
    href: '#new',
    image: '/assets/hero/chrisea-jewelry-heart-hero.png',
    position: 'center center',
    mobilePosition: '68% center',
  },
  {
    collection: 'CHRISÉA / COLLECTION 02',
    title: 'Timeless Beauty, Modern You.',
    titleLines: ['Timeless Beauty,', 'Modern You.'],
    description: 'Jewelry for every chapter.',
    cta: 'Shop Collection',
    href: '#new',
    image: '/assets/hero/chrisea-jewelry-ring-hero.png',
    position: 'center center',
    mobilePosition: '68% center',
  },
  {
    collection: 'CHRISÉA / COLLECTION 03',
    title: 'A Gift That Lasts.',
    titleLines: ['A Gift', 'That Lasts.'],
    description: 'Celebrate every meaningful moment.',
    cta: 'Discover More',
    href: '#promotion',
    image: '/assets/hero/chrisea-jewelry-bracelet-hero.png',
    position: 'center center',
    mobilePosition: '70% center',
  },
];

export default function HeroSlider({ content, imageAdjustments = {}, mobileImages = {} }) {
  const slides = Array.isArray(content) ? heroSlides.map((fallback, index) => { const item = content[index] || {}; const path = `hero.${index}.image`; const saved = imageAdjustments[path] || {}; const desktop = saved.desktop || saved; const mobile = saved.mobile || {}; return { ...fallback, collection: item.eyebrow ?? fallback.collection, title: item.title ?? fallback.title, titleLines: String(item.title ?? fallback.title).split(/\n|(?<=\.)\s+/).filter(Boolean), description: item.description ?? fallback.description, cta: item.buttonLabel ?? fallback.cta, href: item.buttonHref ?? fallback.href, image: item.image ?? fallback.image, mobileImage: mobileImages[path] || '', desktopZoom: Number(desktop.zoom || 100), mobileZoom: Number(mobile.zoom || 100), desktopFit: desktop.fit || 'contain', mobileFit: mobile.fit || 'cover', position: `${Number(desktop.x ?? 50)}% ${Number(desktop.y ?? 50)}%`, mobilePosition: `${Number(mobile.x ?? 68)}% ${Number(mobile.y ?? 50)}%` }; }) : heroSlides;
  const previewing = new URLSearchParams(window.location.search).has('cmsPreview');
  const [activeSlide, setActiveSlide] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef(null);
  const timer = useRef(null);

  const selectSlide = useCallback((index) => {
    const next = (index + slides.length) % slides.length;
    window.clearTimeout(timer.current);
    setActiveSlide(next);
    setCycle((value) => value + 1);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (previewing) return undefined;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
      setCycle((value) => value + 1);
    }, SLIDE_DURATION);

    return () => window.clearTimeout(timer.current);
  }, [activeSlide, cycle, previewing]);

  useEffect(() => {
    slides.forEach(({ image }) => {
      const preload = new Image();
      preload.src = image;
    });
  }, []);

  const handleTouchStart = (event) => {
    touchStart.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 45) selectSlide(activeSlide + (distance < 0 ? 1 : -1));
    touchStart.current = null;
  };

  return (
    <section
      className={`hero-slider ${reducedMotion ? 'reduce-motion' : ''}`}
      aria-roledescription="carousel"
      aria-label="CHRISÉA featured collections"
      onTouchStart={previewing ? undefined : handleTouchStart}
      onTouchEnd={previewing ? undefined : handleTouchEnd}
    >
      <div
        className="hero-slides"
        aria-live="polite"
        onClick={() => { if (!previewing) selectSlide(activeSlide + 1); }}
        title="View next slide"
      >
        {slides.map((slide, index) => (
          <div
            className={`hero-slide ${index === activeSlide ? 'is-active' : ''}`}
            key={slide.image}
            aria-hidden={index !== activeSlide}
          >
            <img
              className={slide.mobileImage ? 'cms-image-desktop has-mobile' : 'cms-image-desktop'}
              src={freshAssetUrl(slide.image)}
              alt=""
              style={{ '--desktop-position': slide.position, '--mobile-position': slide.mobilePosition, '--desktop-zoom': (slide.desktopZoom || 100) / 100, '--mobile-zoom': (slide.mobileZoom || slide.desktopZoom || 100) / 100, '--desktop-fit': slide.desktopFit || 'contain', '--mobile-fit': slide.mobileFit || slide.desktopFit || 'contain' }}
            />
            {slide.mobileImage && <img
              className="cms-image-mobile"
              src={freshAssetUrl(slide.mobileImage)}
              alt=""
              style={{ '--mobile-position': slide.mobilePosition, '--mobile-zoom': (slide.mobileZoom || 100) / 100, '--mobile-fit': slide.mobileFit || 'cover' }}
            />}
          </div>
        ))}
      </div>
      <div className="hero-shade" />

      <div className="hero-content" key={`${activeSlide}-${cycle}`}>
        <p className="hero-kicker">{slides[activeSlide].collection}</p>
        <span className="hero-rule" />
        <h1 aria-label={slides[activeSlide].title}>
          {slides[activeSlide].titleLines.map((line, index) => <span className="hero-title-line" key={line} style={{ '--line-index': index }}>{line}</span>)}
        </h1>
        <p className="hero-description">{slides[activeSlide].description}</p>
        <a className="hero-cta" href={slides[activeSlide].href}>{slides[activeSlide].cta}<ArrowRight /></a>
      </div>

      <div className="hero-index"><span>0{activeSlide + 1}</span><i /><span>03</span></div>
    </section>
  );
}
