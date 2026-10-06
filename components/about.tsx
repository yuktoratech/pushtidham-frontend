import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Flower2, HandHeart, HeartHandshake, UsersRound } from 'lucide-react';

export function AboutHero() {
  return (
    <section className="about-page-hero" aria-labelledby="about-title">
      <img src="/images/haveli-about.webp" alt="Haveli architectural artwork with carved arches, domes and a tranquil garden" />
      <div className="about-page-hero-shade" />
      <div className="container about-page-hero-content">
        <h1 id="about-title">About Us</h1>
        <p>Our faith, our traditions and our community.</p>
      </div>
    </section>
  );
}

export function Breadcrumb({ current }: { current: string }) {
  return <nav className="container about-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><ChevronRight size={14} aria-hidden="true"/><span aria-current="page">{current}</span></nav>;
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
          <h2 id="temple-title">Hindu Pushthidham Temple</h2>
          <p>Pushthidham Haveli is a spiritual home where faith, devotion and community come together. Rooted in the traditions of Pushtimarg, we celebrate devotion to Shri Krishna through darshan, seva and the joy of shared worship.</p>
          <p>We are dedicated to preserving our rich traditions, nurturing spiritual connections and bringing families together. Through devotional gatherings, festivals and opportunities to serve, we share the values of Bhakti and Sanskar with the next generation.</p>
          <p>Whether you come to pray, learn or offer your seva, you are welcome here.</p>
        </div>
        <div className="about-spiritual-detail" aria-hidden="true"><Flower2/><span>श्री कृष्ण शरणं मम</span><small>SHRI KRISHNA SHARANAM MAMA</small></div>
      </div>
      <div className="about-information-grid">
        <InformationCard icon={HandHeart} title="Our Mission">To inspire devotion and serve our community through worship, seva and spiritual learning.</InformationCard>
        <InformationCard icon={HeartHandshake} title="Our Values">Faith, seva, culture and togetherness guide the way we worship, serve and care for one another.</InformationCard>
        <InformationCard icon={UsersRound} title="Our Community">A welcoming place for devotees and families to connect, celebrate and grow together.</InformationCard>
      </div>
      <div className="about-closing-message"><span className="about-ornament" aria-hidden="true">❧</span><blockquote>“Seva, Bhakti and Sanskar for a Brighter Tomorrow”</blockquote><span className="about-ornament" aria-hidden="true">❧</span></div>
    </section>
  );
}
