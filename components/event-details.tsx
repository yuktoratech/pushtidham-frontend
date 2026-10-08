'use client';
import { useEffect, useState } from 'react';
import { eventDonationPath } from '../lib/donation-selection';
import { PageLink } from './page-link';
import { CalendarDays, Clock, MapPin, ChevronRight, HandHeart } from 'lucide-react';
import { catalogApi, type EventRecord } from '../lib/catalog-api';
import { catalogErrorMessage, eventDate, eventView, type TempleEvent } from '../lib/catalog-ui';
import { Button } from './ui';

export function EventMetadata({event}:{event:TempleEvent}) { return <div className="event-detail-meta"><span><CalendarDays aria-hidden="true"/><time dateTime={event.startsAt}>{eventDate(event.startsAt)}</time></span><span><Clock aria-hidden="true"/>{event.time}</span><span><MapPin aria-hidden="true"/>{event.location}</span></div>; }
export function EventSupport({event}:{event:TempleEvent}) { return <section className="event-support" aria-labelledby="support-title"><HandHeart aria-hidden="true"/><h2 id="support-title">Support This Event</h2><p>Your generosity supports the celebrations that bring our community together.</p><Button href={eventDonationPath(event.slug)}>Donate Now</Button></section>; }
export function EventDetails({slug}:{slug:string}) {
  const [record,setRecord]=useState<EventRecord|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{let current=true;catalogApi.publicEventBySlug(slug).then(value=>{if(current)setRecord(value);}).catch(reason=>{if(current)setError(catalogErrorMessage(reason));}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[slug]);
  if(loading)return <div className="container checkout-empty" role="status"><h1>Event</h1><p>Loading event details…</p></div>;
  if(error||!record)return <div className="container checkout-empty"><h1>This event is unavailable</h1><p>{error||'Please choose another event.'}</p><PageLink className="button" href="/events">View Events</PageLink></div>;
  const event=eventView(record);
  return <div className="event-detail-page"><section className="event-detail-hero" aria-labelledby="detail-title"><img src={event.image} alt=""/><div className="event-detail-shade"/><div className="container event-detail-hero-copy"><p className="eyebrow">Together in devotion</p><h1 id="detail-title">{event.title}</h1><EventMetadata event={event}/></div></section><nav className="container event-detail-breadcrumb" aria-label="Breadcrumb"><PageLink href="/">Home</PageLink><ChevronRight aria-hidden="true"/><PageLink href="/events">Events</PageLink><ChevronRight aria-hidden="true"/><span aria-current="page">{event.title}</span></nav><div className="container event-detail-body"><div className="event-detail-grid"><section className="event-information" aria-labelledby="information-title"><img className="event-detail-photo" src={event.image} alt={event.imageAlt}/><div className="event-information-copy">{event.past&&<span className="past-event-label">This event has taken place</span>}<p className="eyebrow">Seva · Bhakti · Community</p><h2 id="information-title">{event.title}</h2><EventMetadata event={event}/><p>{event.description||event.shortDescription}</p>{event.endsAt&&<p>Ends {eventDate(event.endsAt)}.</p>}<div className="event-welcome"><MapPin aria-hidden="true"/><div><h3>Location</h3><p>{event.location}</p></div></div></div></section><aside className="event-detail-aside" aria-label="Event support"><EventSupport event={event}/></aside></div></div></div>;
}
