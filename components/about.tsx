import {CatalogImage} from './catalog-image';
import { PageLink } from './page-link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Flower2, HandHeart, HeartHandshake, MapPin, UsersRound } from 'lucide-react';
import { templeContact } from '../lib/contact';

export function AboutHero() {
  return (
    <section className="about-page-hero" aria-labelledby="about-title">
      <CatalogImage src="/images/haveli-about.webp" alt="Haveli architectural artwork with carved arches, domes and a tranquil garden" />
      <div className="about-page-hero-shade" />
      <div className="container about-page-hero-content">
        <h1 id="about-title">About Us</h1>
        <p>Our faith, our traditions and our community.</p>
      </div>
    </section>
  );
}

export function Breadcrumb({ current }: { current: string }) {
  return <nav className="container about-breadcrumb" aria-label="Breadcrumb"><PageLink href="/">Home</PageLink><ChevronRight size={14} aria-hidden="true"/><span aria-current="page">{current}</span></nav>;
}

export function InformationCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return <article className="about-information-card"><Icon aria-hidden="true"/><h3>{title}</h3><p>{children}</p></article>;
}

export function AboutContent() {
  return (
    <section className="container about-page-content" aria-labelledby="temple-title">
      <div className="about-temple-introduction">
        <div className="about-temple-copy">
          <p className="eyebrow">A place of devotion and belonging</p>
          <h2 id="temple-title">Pushtidham Haveli</h2>
          <p>Pushtidham Haveli is the spiritual and community home of Pushti Margiya Vaishnav Samaj Inc. in Ocala, Florida. Rooted in Pushtimarg—the Path of Grace—the Haveli brings devotees together in loving devotion to Shri Krishna and Shrinathji.</p>
          <p>Pushtimarg was established by Jagadguru Shrimad Vallabhacharya Mahaprabhuji. Its devotional life is expressed through seva, darshan, kirtan and the traditions of raag, bhog, vastra and shringar.</p>
          <p>Devotees, families and visitors are welcome to pray, learn, participate and serve.</p>
        </div>
        <div className="about-spiritual-detail" aria-hidden="true"><Flower2/><span>श्री कृष्ण शरणं मम</span><small>SHRI KRISHNA SHARANAM MAMA</small></div>
      </div>
      <div className="about-information-grid">
        <InformationCard icon={HandHeart} title="Devotion and Seva">Religious services, festivals and spiritual discourse support a life of selfless devotion, humility and loving seva.</InformationCard>
        <InformationCard icon={HeartHandshake} title="Learning and Culture">Education in Pushtimarg, Hindu traditions, Indian culture and the arts helps families share enduring values with future generations.</InformationCard>
        <InformationCard icon={UsersRound} title="Community and Service">The Samaj encourages belonging, volunteerism, interfaith harmony and responsible support for people and humanitarian causes.</InformationCard>
      </div>
      <div className="about-directions"><MapPin aria-hidden="true"/><div><h2>Visit Pushtidham Haveli</h2><p>{templeContact.address}</p></div><a className="button" href={templeContact.mapsUrl} target="_blank" rel="noopener noreferrer">Get Directions</a></div>
      <div className="about-closing-message"><span className="about-ornament" aria-hidden="true">❧</span><blockquote>“Seva, Bhakti and Sanskar for a Brighter Tomorrow”</blockquote><span className="about-ornament" aria-hidden="true">❧</span></div>
    </section>
  );
}
