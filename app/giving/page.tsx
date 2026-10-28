import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../components/layout';
import { GivingHero, GivingListing } from '../../components/giving';
export const metadata:Metadata={title:'Giving | Pushtidham Haveli',description:'Explore official daily seva opportunities at Pushtidham Haveli.'};
export default function GivingPage(){return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main" className="giving-page"><GivingHero/><GivingListing/></main><Footer/><MobileBottomNav/></>}
