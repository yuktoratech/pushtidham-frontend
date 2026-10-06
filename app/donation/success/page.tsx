import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../../components/layout';
import { DonationConfirmation } from '../../../components/donation-confirmation';
export const metadata:Metadata={title:'Thank You | Pushthidham Haveli',robots:{index:false,follow:false}};
export default function Page(){return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main"><DonationConfirmation pending={false}/></main><Footer/><MobileBottomNav/></>;}
