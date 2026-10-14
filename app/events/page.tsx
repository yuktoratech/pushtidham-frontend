import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../components/layout';
import { EventsHero, EventsList, FestivalGuide } from '../../components/events';
export const metadata: Metadata = {title:'Events & Festivals | Pushtidham Haveli',description:'Find verified event announcements and learn about festivals in the Pushtimarg tradition.'};
export default function EventsPage() {return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main" className="events-page"><EventsHero/><EventsList/><FestivalGuide/></main><Footer/><MobileBottomNav/></>;}
