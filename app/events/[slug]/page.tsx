import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allEvents, getEvent } from '../../../lib/events';
import { Header, Footer, MobileBottomNav } from '../../../components/layout';
import { EventDetails } from '../../../components/event-details';
export const dynamicParams = false;
export function generateStaticParams() { return allEvents.map(event => ({slug:event.slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
  const event = getEvent((await params).slug);
  return event ? {title:`${event.title} | Pushthidham Haveli`,description:event.description} : {title:'Event not found | Pushthidham Haveli'};
}
export default async function EventDetailsPage({params}:{params:Promise<{slug:string}>}) {
  const event = getEvent((await params).slug);
  if (!event) notFound();
  return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main"><EventDetails event={event}/></main><Footer/><MobileBottomNav/></>;
}
