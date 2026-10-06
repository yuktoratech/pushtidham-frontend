import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../components/layout';
import { Breadcrumb } from '../../components/about';
import { ContactHero, ContactContent } from '../../components/contact';
export const metadata: Metadata = {title:'Contact Us | Pushthidham Haveli',description:'Connect with Pushthidham Haveli about darshan, seva, festivals and community activities.'};
export default function ContactPage(){return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main" className="contact-page"><ContactHero/><Breadcrumb current="Contact Us"/><ContactContent/></main><Footer/><MobileBottomNav/></>;}
