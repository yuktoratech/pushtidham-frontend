import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../../components/layout';
import { EventDetails } from '../../../components/event-details';
export const metadata:Metadata={title:'Event | Pushthidham Haveli',description:'View a Pushthidham Haveli event.'};
export default async function EventDetailsPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main"><EventDetails slug={slug}/></main><Footer/><MobileBottomNav/></>;
}
