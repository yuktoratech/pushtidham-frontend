import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../components/layout';
import { GivingHero, GivingListing } from '../../components/giving';
export const metadata:Metadata={title:'Giving | Pushthidham Haveli',description:'Support daily seva, festival celebrations and community activities at Pushthidham Haveli.'};
export default function GivingPage(){return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main" className="giving-page"><GivingHero/><GivingListing/></main><Footer/><MobileBottomNav/></>}
