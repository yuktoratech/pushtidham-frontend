'use client';
import { useAdminDemo } from '../hooks/use-admin-demo';
import { PageLink } from './page-link';

import { ChevronRight, HandHeart } from 'lucide-react';
import { type GivingOpportunity } from '../lib/giving';
import { donatePath } from '../lib/donation-selection';

export function GivingDetails({opportunity:seed}:{opportunity:GivingOpportunity}){
  const {data}=useAdminDemo();const opportunity=data.giving.find(g=>g.slug===seed.slug);
  if(!opportunity||!opportunity.active)return <div className="container checkout-empty"><h1>This offering is unavailable</h1><p>Please choose another donation option.</p><PageLink className="button" href="/donate">Choose a Donation</PageLink></div>;
  const givingHref='/giving';
  return <div className={`giving-detail-page giving-detail-${opportunity.slug}`}><nav className="container giving-detail-breadcrumb" aria-label="Breadcrumb"><PageLink href="/">Home</PageLink><ChevronRight aria-hidden="true"/><PageLink href={givingHref}>Giving</PageLink><ChevronRight aria-hidden="true"/><span aria-current="page">{opportunity.title}</span></nav><div className="container giving-detail-grid"><section className="giving-detail-overview" aria-labelledby="giving-detail-title"><img className="giving-detail-image" src={opportunity.image} alt={opportunity.imageAlt}/><div className="giving-detail-intro"><p className="eyebrow">General · An offering of seva</p><h1 id="giving-detail-title">{opportunity.title}</h1><p>{opportunity.shortDescription}</p></div></section><aside className="donation-panel"><div className="donation-panel-intro"><HandHeart aria-hidden="true"/><p className="eyebrow">An offering from the heart</p></div><h2>Support This Seva</h2><p className="donation-panel-subtitle">Choose your donation amount before continuing to checkout.</p><PageLink className="button donation-continue" href={donatePath(opportunity.slug)}>Donate Now</PageLink><p className="donation-payment-note">No payment is taken when choosing an amount.</p></aside><section className="giving-detail-about" aria-labelledby="giving-about-title"><h2 id="giving-about-title">About This Seva</h2><p>{opportunity.fullDescription}</p><p>Every offering, large or small, helps keep the spirit of devotion and community alive.</p><div className="giving-detail-devotion"><HandHeart aria-hidden="true"/><span>Seva is an offering of love.</span></div><PageLink className="event-all-link" href={givingHref}>Explore all giving opportunities</PageLink></section></div></div>;
}
