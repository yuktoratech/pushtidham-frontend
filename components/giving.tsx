'use client';
import { useHydrated } from '../hooks/use-hydrated';
import { PageLink } from './page-link';

import { useState } from 'react';
import { ChevronRight, HandHeart, CalendarDays } from 'lucide-react';
import { givingOpportunities, getGivingOpportunity, givingDetailsPath, type GivingOpportunity } from '../lib/giving';
import { getEvent } from '../lib/events';
import { icons } from './ui';

export function GivingHero(){return <><section className="giving-page-hero" aria-labelledby="giving-title"><img src="/images/diya.webp" alt=""/><div className="giving-page-shade"/><div className="container giving-page-hero-copy"><h1 id="giving-title">Giving</h1><p>An offering of love. A lasting act of seva.</p></div></section><nav className="container giving-breadcrumb" aria-label="Breadcrumb"><PageLink href="/">Home</PageLink><ChevronRight aria-hidden="true"/><span aria-current="page">Giving</span></nav></>}
export function GivingCard({opportunity,eventSlug,highlighted=false}:{opportunity:GivingOpportunity;eventSlug?:string;highlighted?:boolean}){
  const Icon=icons[opportunity.icon];
  return <article className={`giving-opportunity-card ${highlighted?'giving-opportunity-highlight':''}`} aria-labelledby={`giving-${opportunity.slug}`}><div className={`giving-opportunity-image giving-image-${opportunity.slug}`}><img src={opportunity.image} alt={opportunity.imageAlt}/><span><Icon aria-hidden="true"/></span></div><div className="giving-opportunity-copy"><p className="giving-category">{opportunity.category}</p><h3 id={`giving-${opportunity.slug}`}>{opportunity.title}</h3><p>{opportunity.shortDescription}</p><PageLink className="button" href={givingDetailsPath(opportunity,eventSlug)}>View Details<span className="sr-only"> for {opportunity.title}</span></PageLink></div></article>;
}
export function GivingListing(){
  const [category,setCategory]=useState('All');
  const hydrated=useHydrated();const params=new URLSearchParams(hydrated?window.location.search:'');const event=getEvent(params.get('event')||'')||null;const highlighted=getGivingOpportunity(params.get('opportunity')||'')?.slug||null;
  const visible=category==='All'?givingOpportunities:givingOpportunities.filter(item=>item.category===category);
  return <><section className="container giving-page-content" aria-labelledby="giving-intro-title"><div className="giving-introduction"><p className="eyebrow">Seva begins with the heart</p><h2 id="giving-intro-title">Make a Meaningful Contribution</h2><p>Every offering helps sustain our spiritual home. Support daily seva, festival celebrations and the community we share at Pushthidham Haveli.</p></div>{event&&<div className="giving-event-context"><CalendarDays aria-hidden="true"/><div><p>Supporting <strong>{event.title}</strong></p><span>Choose a seva below to support this celebration.</span></div><PageLink href={event.detailsPath}>View event</PageLink></div>}<div className="giving-filters" role="group" aria-label="Giving categories">{['All','General','Seva','Festivals','Community'].map(name=><button key={name} aria-pressed={category===name} onClick={()=>setCategory(name)}>{name}</button>)}</div><div className="giving-opportunity-grid" aria-label="Giving opportunities">{visible.map(item=><GivingCard key={item.slug} opportunity={item} eventSlug={event?.slug} highlighted={highlighted===item.slug}/>)}</div><p className="giving-heart-note">Every act of seva is an offering of love.</p></section><section className="giving-closing" aria-labelledby="giving-closing-title"><div className="container giving-closing-inner"><HandHeart aria-hidden="true"/><div><h2 id="giving-closing-title">Your Seva Makes a Difference</h2><p>Help keep the spirit of devotion and community alive for generations to come.</p></div><PageLink className="button" href={givingDetailsPath(givingOpportunities[0],event?.slug)}>Donate Now</PageLink></div></section></>;
}
