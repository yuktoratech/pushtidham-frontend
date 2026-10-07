import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../components/layout';
import { Donate } from '../../components/donate';

export const metadata:Metadata={title:'Donate | Pushthidham Haveli',description:'Choose a giving opportunity, event and donation amount in USD.'};
export default function DonatePage(){return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main"><Donate/></main><Footer/><MobileBottomNav/></>;}
