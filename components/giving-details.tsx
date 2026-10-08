'use client';
import { PageLink } from './page-link';

import { ChevronRight, HandHeart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { catalogApi, type GivingRecord } from '../lib/catalog-api';
import { catalogErrorMessage, givingView } from '../lib/catalog-ui';
import { donatePath } from '../lib/donation-selection';

export function GivingDetails({slug}:{slug:string}){
  const [record,setRecord]=useState<GivingRecord|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{let current=true;catalogApi.publicGivingBySlug(slug).then(value=>{if(current)setRecord(value);}).catch(reason=>{if(current)setError(catalogErrorMessage(reason));}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[slug]);
  if(loading)return <div className="container checkout-empty" role="status"><h1>Giving</h1><p>Loading this offering…</p></div>;
  if(error||!record)return <div className="container checkout-empty"><h1>This offering is unavailable</h1><p>{error||'Please choose another donation option.'}</p><PageLink className="button" href="/giving">View Giving</PageLink></div>;
  const opportunity=givingView(record);
  const givingHref='/giving';
  return <div className={`giving-detail-page giving-detail-${opportunity.slug}`}><nav className="container giving-detail-breadcrumb" aria-label="Breadcrumb"><PageLink href="/">Home</PageLink><ChevronRight aria-hidden="true"/><PageLink href={givingHref}>Giving</PageLink><ChevronRight aria-hidden="true"/><span aria-current="page">{opportunity.title}</span></nav><div className="container giving-detail-grid"><section className="giving-detail-overview" aria-labelledby="giving-detail-title"><img className="giving-detail-image" src={opportunity.image} alt={opportunity.imageAlt}/><div className="giving-detail-intro"><p className="eyebrow">General · An offering of seva</p><h1 id="giving-detail-title">{opportunity.title}</h1><p>{opportunity.shortDescription}</p></div></section><aside className="donation-panel"><div className="donation-panel-intro"><HandHeart aria-hidden="true"/><p className="eyebrow">An offering from the heart</p></div><h2>Support This Seva</h2><p className="donation-panel-subtitle">Choose your donation amount before continuing to checkout.</p><PageLink className="button donation-continue" href={donatePath(opportunity.slug)}>Donate Now</PageLink><p className="donation-payment-note">No payment is taken when choosing an amount.</p></aside><section className="giving-detail-about" aria-labelledby="giving-about-title"><h2 id="giving-about-title">About This Seva</h2><p>{opportunity.fullDescription}</p><p>Every offering, large or small, helps keep the spirit of devotion and community alive.</p><div className="giving-detail-devotion"><HandHeart aria-hidden="true"/><span>Seva is an offering of love.</span></div><PageLink className="event-all-link" href={givingHref}>Explore all giving opportunities</PageLink></section></div></div>;
}
