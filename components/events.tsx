'use client';
import { useRef, useState } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { eventDate, upcomingEvents, pastEvents, type TempleEvent } from '../lib/events';

export function EventsHero() {
  return <section className="events-hero" aria-labelledby="events-title"><img src="/images/diya.webp" alt=""/><div className="events-hero-shade"/><div className="container events-hero-content"><h1 id="events-title">Events</h1><p>Join us in our spiritual and community events.</p></div></section>;
}

export function EventCard({ event, past }: { event: TempleEvent; past: boolean }) {
  return <article className="events-list-card" aria-labelledby={`${event.id}-title`}><img src={event.image} alt={event.imageAlt} className={`events-card-image events-image-${event.id.split('-')[0]}`}/><div className="events-card-copy">{past&&<span className="past-event-label">Past event</span>}<h2 id={`${event.id}-title`}>{event.title}</h2><div className="events-card-meta"><span><CalendarDays aria-hidden="true"/><time dateTime={event.date}>{eventDate(event.date)}</time></span><span><Clock aria-hidden="true"/>{event.time}</span></div><p>{event.description}</p><a className="button" href={event.detailsPath}>View Details<span className="sr-only"> for {event.title}</span></a></div></article>;
}

export function EventsList() {
  const [active,setActive] = useState<'upcoming'|'past'>('upcoming');
  const refs = useRef<(HTMLButtonElement|null)[]>([]);
  return <section className="container events-list-section" aria-label="Temple events"><div className="events-tabs-row"><div role="tablist" aria-label="Events by date" className="events-tabs">{(['upcoming','past'] as const).map((tab,i)=><button key={tab} ref={el=>{refs.current[i]=el;}} role="tab" id={`events-tab-${tab}`} aria-selected={active===tab} aria-controls={`events-panel-${tab}`} tabIndex={active===tab?0:-1} onClick={()=>setActive(tab)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const index=e.key==='Home'?0:e.key==='End'?1:1-i;setActive(index===0?'upcoming':'past');refs.current[index]?.focus();}}}>{tab==='upcoming'?'Upcoming Events':'Past Events'}</button>)}</div><p className="events-timezone">All times Eastern Time</p></div>{(['upcoming','past'] as const).map(tab=><div key={tab} role="tabpanel" id={`events-panel-${tab}`} aria-labelledby={`events-tab-${tab}`} hidden={active!==tab} className="events-tab-panel" tabIndex={0}><div className="events-list">{(tab==='upcoming'?upcomingEvents:pastEvents).map(event=><EventCard key={event.id} event={event} past={tab==='past'}/>)}</div></div>)}</section>;
}
