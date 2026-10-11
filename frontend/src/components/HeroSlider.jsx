import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const SLIDE_DURATION = 4000;

export const heroSlides = [
  {
    collection: 'CHRISÉA / COLLECTION 01',
    title: 'An Expression of Elegance.',
    titleLines: ['An Expression', 'of Elegance.'],
    description: 'Discover the beauty in every detail.',
    cta: 'Explore Collection',
    href: '#new',
    image: '/assets/hero/chrisea-model-red.png',
    position: 'center 43%',
    mobilePosition: '57% center',
  },
  {
    collection: 'CHRISÉA / COLLECTION 02',
    title: 'Timeless Beauty, Modern You.',
    titleLines: ['Timeless Beauty,', 'Modern You.'],
    description: 'Jewelry for every chapter.',
    cta: 'Shop Collection',
    href: '#new',
    image: '/assets/hero/chrisea-collection-02.png',
    position: 'center 42%',
    mobilePosition: '61% center',
  },
  {
    collection: 'CHRISÉA / COLLECTION 03',
    title: 'A Gift That Lasts.',
    titleLines: ['A Gift', 'That Lasts.'],
    description: 'Celebrate every meaningful moment.',
    cta: 'Discover More',
    href: '#promotion',
    image: '/assets/hero/chrisea-collection-03.png',
    position: 'center center',
    mobilePosition: '64% center',
  },
];

export default function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef(null);
  const timer = useRef(null);

  const selectSlide = useCallback((index) => {
    const next = (index + heroSlides.length) % heroSlides.length;
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
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
      setCycle((value) => value + 1);
    }, SLIDE_DURATION);

    return () => window.clearTimeout(timer.current);
  }, [activeSlide, cycle]);

  useEffect(() => {
    heroSlides.forEach(({ image }) => {
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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="hero-slides"
        aria-live="polite"
        onClick={() => selectSlide(activeSlide + 1)}
        title="View next slide"
      >
        {heroSlides.map((slide, index) => (
          <div
            className={`hero-slide ${index === activeSlide ? 'is-active' : ''}`}
            key={slide.image}
            aria-hidden={index !== activeSlide}
          >
            <img
              src={slide.image}
              alt=""
              style={{ '--desktop-position': slide.position, '--mobile-position': slide.mobilePosition }}
            />
          </div>
        ))}
      </div>
      <div className="hero-shade" />

      <div className="hero-content" key={`${activeSlide}-${cycle}`}>
        <p className="hero-kicker">{heroSlides[activeSlide].collection}</p>
        <span className="hero-rule" />
        <h1 aria-label={heroSlides[activeSlide].title}>
          {heroSlides[activeSlide].titleLines.map((line, index) => <span className="hero-title-line" key={line} style={{ '--line-index': index }}>{line}</span>)}
        </h1>
        <p className="hero-description">{heroSlides[activeSlide].description}</p>
        <a className="hero-cta" href={heroSlides[activeSlide].href}>{heroSlides[activeSlide].cta}<ArrowRight /></a>
      </div>

      <div className="hero-index"><span>0{activeSlide + 1}</span><i /><span>03</span></div>
    </section>
  );
}
