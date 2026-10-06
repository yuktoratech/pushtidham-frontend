import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../components/layout';
import { AboutHero, Breadcrumb, AboutContent } from '../../components/about';

export const metadata: Metadata = {
  title: 'About Us | Pushthidham Haveli',
  description: 'Discover the faith, traditions, mission and welcoming community of Hindu Pushthidham Temple.'
};

export default function AboutPage() {
  return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main" className="about-page"><AboutHero/><Breadcrumb current="About Us"/><AboutContent/></main><Footer/><MobileBottomNav/></>;
}
