import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../components/layout';
import { EventsHero, EventsList } from '../../components/events';
export const metadata: Metadata = {title:'Events | Pushthidham Haveli',description:'Discover devotional festivals, spiritual gatherings and community celebrations at Pushthidham Haveli.'};
export default function EventsPage() {return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main" className="events-page"><EventsHero/><EventsList/></main><Footer/><MobileBottomNav/></>;}
