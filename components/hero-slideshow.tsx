'use client';

import Image from 'next/image';
import {useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent} from 'react';
import {ChevronLeft, ChevronRight, Pause, Play} from 'lucide-react';
import {homeSlides} from '../lib/home-slides';
import './hero-slideshow.css';

const motionQuery = '(prefers-reduced-motion: reduce)';
function subscribeMotion(change: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
}

export function HeroSlideshow() {
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => false);
  const [active, setActive] = useState(0);
  const [playRequested, setPlayRequested] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const touchStart = useRef<number | null>(null);
  const playing = playRequested ?? !reducedMotion;

  useEffect(() => {
    if (!playing || hovered) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setActive(index => (index + 1) % homeSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [playing, hovered]);

  function select(index: number) {
    setActive((index + homeSlides.length) % homeSlides.length);
    setPlayRequested(false);
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    select(active + (event.key === 'ArrowLeft' ? -1 : 1));
  }

  return <div className="hero-carousel" role="region" aria-roledescription="carousel" aria-label="Pushtidham Haveli photo slideshow" onKeyDown={keyboard} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setPlayRequested(false)}>
    <div className="hero-carousel-stage" onPointerDown={event => {if (event.pointerType === 'touch') touchStart.current = event.clientX;}} onPointerUp={event => {
      if (touchStart.current === null) return;
      const distance = event.clientX - touchStart.current;
      touchStart.current = null;
      if (Math.abs(distance) > 40) select(active + (distance < 0 ? 1 : -1));
    }} onPointerCancel={() => {touchStart.current = null;}}>
      {homeSlides.map((slide, index) => <div key={slide.id} className={`hero-carousel-slide ${index === active ? 'is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${homeSlides.length}`} aria-hidden={index !== active}>
        <picture>
          <source media="(max-width: 767px)" srcSet={failed.includes(slide.id) ? '/images/devotional-hero.webp' : slide.mobileSrc}/>
          <Image src={failed.includes(slide.id) ? '/images/devotional-hero.webp' : slide.src} alt={failed.includes(slide.id) ? 'Devotional artwork at Pushtidham Haveli' : slide.alt} fill sizes="100vw" unoptimized style={{objectPosition: slide.position}} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : undefined} onError={() => setFailed(current => current.includes(slide.id) ? current : [...current, slide.id])}/>
        </picture>
      </div>)}
      <button type="button" className="hero-carousel-arrow hero-carousel-prev" aria-label="Previous photo" onClick={() => select(active - 1)}><ChevronLeft aria-hidden="true"/></button>
      <button type="button" className="hero-carousel-arrow hero-carousel-next" aria-label="Next photo" onClick={() => select(active + 1)}><ChevronRight aria-hidden="true"/></button>
    </div>
    <div className="hero-carousel-controls">
      <span className="hero-carousel-count" aria-hidden="true">{active + 1} / {homeSlides.length}</span>
      <div className="hero-carousel-dots" role="group" aria-label="Choose a photo">{homeSlides.map((slide, index) => <button key={slide.id} type="button" className={index === active ? 'is-active' : ''} aria-label={`Show photo ${index + 1}: ${slide.alt}`} aria-current={index === active ? 'true' : undefined} onClick={() => select(index)}><span/></button>)}</div>
      <button type="button" className="hero-carousel-play" aria-label={playing ? 'Pause slideshow' : 'Play slideshow'} onClick={() => setPlayRequested(!playing)}>{playing ? <Pause aria-hidden="true"/> : <Play aria-hidden="true"/>}</button>
    </div>
    <p className="sr-only" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">Photo {active + 1} of {homeSlides.length}: {homeSlides[active].alt}</p>
  </div>;
}
