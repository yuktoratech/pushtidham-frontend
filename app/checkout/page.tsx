import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../components/layout';
import { Checkout } from '../../components/checkout';
export const metadata:Metadata={title:'Donation Checkout | Pushthidham Haveli',description:'Review your offering of seva and prepare your donor and payment details.'};
export default function CheckoutPage(){return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main"><Checkout/></main><Footer/><MobileBottomNav/></>;}
