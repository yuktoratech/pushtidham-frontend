import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../components/layout';
import { AboutHero, Breadcrumb, AboutContent } from '../../components/about';

export const metadata: Metadata = {
  title: 'About Us | Pushtidham Haveli',
  description: 'Discover the Pushtimarg faith, mission and welcoming community of Pushtidham Haveli.'
};

export default function AboutPage() {
  return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main" className="about-page"><AboutHero/><Breadcrumb current="About Us"/><AboutContent/></main><Footer/><MobileBottomNav/></>;
}
