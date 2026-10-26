import {CatalogImage} from './catalog-image';
import {PageLink} from './page-link';
import type {LucideIcon} from 'lucide-react';
import {ChevronRight, Flower2, HandHeart, HeartHandshake, MapPin, Music2, Shirt, Utensils, UsersRound} from 'lucide-react';
import {homeSlides} from '../lib/home-slides';
import {templeContact} from '../lib/contact';

export function AboutHero() {
  return <section className="about-page-hero about-premium-hero" aria-labelledby="about-title">
    <CatalogImage src={homeSlides[1].src} alt={homeSlides[1].alt} />
    <div className="about-page-hero-shade" />
    <div className="container about-page-hero-content"><p className="eyebrow">Pushti Margiya Vaishnav Samaj Inc.</p><h1 id="about-title">About Pushtidham Haveli</h1><p>A welcoming spiritual home for bhakti, seva and community in Ocala, Florida.</p></div>
  </section>;
}

export function Breadcrumb({current}: {current: string}) {
  return <nav className="container about-breadcrumb" aria-label="Breadcrumb"><PageLink href="/">Home</PageLink><ChevronRight size={14} aria-hidden="true"/><span aria-current="page">{current}</span></nav>;
}

function PillarCard({icon: Icon, title, children}: {icon: LucideIcon; title: string; children: React.ReactNode}) {
  return <article className="about-pillar-card"><span className="about-pillar-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{children}</p></article>;
}

export function AboutContent() {
  return <section className="container about-page-content about-premium-content">
    <section className="about-pushtimarg" aria-labelledby="pushtimarg-title"><div className="about-section-intro"><p className="eyebrow">The Path of Grace</p><h2 id="pushtimarg-title">Pushtimarg, devotion expressed through seva</h2></div><div className="about-copy-columns"><p>Pushtimarg is known as the Path of Grace. Founded by Jagadguru Shrimad Vallabhacharya Mahaprabhuji, it is a tradition of loving devotion to Shri Krishna in which grace, gratitude and personal service are central.</p><p>At its heart is Shrinathji, a beloved form of Shri Krishna. Darshan, kirtan and daily seva give devotees meaningful ways to offer care, attention and joy in their spiritual lives.</p></div></section>
    <section className="about-heritage" aria-labelledby="heritage-title"><div className="about-heritage-image"><CatalogImage src="/images/devotional-hero.webp" alt="Illustrative devotional artwork in the Pushtimarg tradition" /></div><div className="about-heritage-copy"><p className="eyebrow">Our spiritual heritage</p><h2 id="heritage-title">Bhakti, seva and community</h2><p>Seva is a way of offering one’s time, attention and devotion. It creates space for families and visitors to participate with humility, learn together and share the warmth of community.</p><p>Through worship, cultural learning and thoughtful service, the Haveli seeks to nurture a living connection with faith across generations.</p><div className="about-heritage-mark" aria-hidden="true"><Flower2/><span>श्री कृष्ण शरणं मम</span></div></div></section>
    <section className="about-pillars" aria-labelledby="pillars-title"><div className="about-section-intro about-section-intro-centered"><p className="eyebrow">A living tradition</p><h2 id="pillars-title">Three pillars of Pushtimarg</h2></div><div className="about-pillars-grid"><PillarCard icon={Music2} title="Raag">Traditional Haveli music and kirtan offer a devotional expression of remembrance and joy.</PillarCard><PillarCard icon={Utensils} title="Bhog">Food offerings are prepared and presented as an expression of loving seva.</PillarCard><PillarCard icon={Shirt} title="Vastra & Shringar">Clothing and adornment are part of the attentive daily care offered in seva.</PillarCard></div></section>
    <section className="about-community" aria-labelledby="community-title"><div><p className="eyebrow">Our Haveli & community</p><h2 id="community-title">A place to pray, learn and participate</h2><p>Pushtidham Haveli is the Ocala home of Pushti Margiya Vaishnav Samaj Inc., a not-for-profit organization. The Haveli welcomes devotees, families and visitors to connect through devotion, cultural education and community participation.</p></div><div className="about-community-values"><span><HandHeart aria-hidden="true"/>Seva</span><span><HeartHandshake aria-hidden="true"/>Belonging</span><span><UsersRound aria-hidden="true"/>Learning</span></div></section>
    <section className="about-invitation" aria-labelledby="visit-title"><MapPin aria-hidden="true" /><div><p className="eyebrow">You are welcome here</p><h2 id="visit-title">Visit Pushtidham Haveli</h2><p>{templeContact.address}</p></div><div className="about-invitation-actions"><PageLink className="button" href="/contact">Contact Us</PageLink><PageLink className="button about-invitation-outline" href="/donate">Explore Seva</PageLink></div></section>
  </section>;
}
