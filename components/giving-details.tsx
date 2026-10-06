'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { readDonationSelection } from '../lib/checkout';
import { ChevronRight, HandHeart, CalendarDays, Landmark, FileText } from 'lucide-react';
import { type GivingOpportunity } from '../lib/giving';
import { getEvent, type TempleEvent } from '../lib/events';
import { donationCurrency, parseCustomAmount, donationSelectionKey, checkoutPath, type DonationSelection } from '../lib/donation-selection';

export function DonationPanel({opportunity,event}:{opportunity:GivingOpportunity;event:TempleEvent|null}){
  const router=useRouter();
  const [choice,setChoice]=useState<number|'custom'>(opportunity.suggestedAmounts[0]);
  const [custom,setCustom]=useState('');
  const [touched,setTouched]=useState(false);
  const customRef=useRef<HTMLInputElement>(null);
  const parsed=choice==='custom'?parseCustomAmount(custom):{cents:choice*100,error:null};
  const valid=parsed.cents!==null;
  const showError=choice==='custom'&&(touched||custom.length>0)&&parsed.error;
  useEffect(()=>{const selection=readDonationSelection(new URLSearchParams(window.location.search));if(selection?.givingSlug===opportunity.slug){setChoice(selection.amountChoice);if(selection.amountChoice==='custom')setCustom((selection.amountCents/100).toFixed(2));}},[opportunity.slug]);
  useEffect(()=>{if(choice==='custom')customRef.current?.focus();},[choice]);
  function continueDonation(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setTouched(true);if(parsed.cents===null)return;
    const selection:DonationSelection={givingSlug:opportunity.slug,amountCents:parsed.cents,currency:'USD',donationType:'one-time',amountChoice:choice,...(event?{eventSlug:event.slug,eventId:event.id}:{})};
    try{sessionStorage.setItem(donationSelectionKey,JSON.stringify(selection));}catch{/* The local review remains available if storage is restricted. */}
    router.push(checkoutPath(selection));
  }
  return <><aside className="donation-panel" aria-labelledby="amount-title"><div className="donation-panel-intro"><HandHeart aria-hidden="true"/><p className="eyebrow">An offering from the heart</p></div><h2 id="amount-title">Choose Your Donation Amount</h2><p className="donation-panel-subtitle">Every contribution is a meaningful act of seva.</p>{event&&<div className="donation-event-message"><CalendarDays aria-hidden="true"/><p>Supporting: <strong>{event.title}</strong></p></div>}<form onSubmit={continueDonation} noValidate><fieldset className="donation-amount-options"><legend className="sr-only">Donation amount in USD</legend>{opportunity.suggestedAmounts.map(amount=><label key={amount} className={`donation-amount-option ${choice===amount?'is-selected':''}`}><input type="radio" name="donation-amount" value={amount} checked={choice===amount} onChange={()=>{setChoice(amount);setTouched(false);}}/><span>${amount}</span></label>)}<label className={`donation-amount-option donation-custom-option ${choice==='custom'?'is-selected':''}`}><input type="radio" name="donation-amount" value="custom" checked={choice==='custom'} onChange={()=>{setChoice('custom');setTouched(false);}}/><span>Custom Amount</span></label></fieldset>{choice==='custom'&&<div className="donation-custom-field"><label htmlFor="custom-donation">Custom amount (USD)</label><div className={`donation-currency-input ${showError?'has-error':''}`}><span aria-hidden="true">$</span><input ref={customRef} id="custom-donation" type="text" inputMode="decimal" autoComplete="off" placeholder="Enter amount" value={custom} onChange={e=>setCustom(e.target.value)} onBlur={()=>setTouched(true)} aria-invalid={!!showError} aria-describedby={showError?'donation-amount-error':'donation-amount-help'}/></div>{showError?<p id="donation-amount-error" className="donation-input-error" role="alert">{parsed.error}</p>:<p id="donation-amount-help" className="donation-input-help">Enter a positive amount in USD, with up to two decimal places.</p>}</div>}<div className="donation-type-line"><span className="donation-type-mark" aria-hidden="true"/><span>One-time donation</span></div><div className="donation-total"><span>Your contribution</span><strong>{valid?donationCurrency(parsed.cents!):'Choose an amount'}<small>USD</small></strong></div><button type="submit" className="button donation-continue" disabled={!valid}>Continue to Checkout</button><p className="donation-payment-note">No payment is taken when choosing an amount.</p></form><div className="donation-trust"><div><Landmark aria-hidden="true"/><p>Your contribution supports Pushthidham Haveli.</p></div><div><FileText aria-hidden="true"/><p>A receipt is provided after a successful donation.</p></div></div></aside></>;
}
export function GivingDetails({opportunity}:{opportunity:GivingOpportunity}){
  const [event,setEvent]=useState<TempleEvent|null>(null);
  useEffect(()=>{setEvent(getEvent(new URLSearchParams(window.location.search).get('event')||'')||null);},[]);
  const givingHref=event?`/giving?event=${encodeURIComponent(event.slug)}`:'/giving';
  return <div className={`giving-detail-page giving-detail-${opportunity.slug}`}><nav className="container giving-detail-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><ChevronRight aria-hidden="true"/><a href={givingHref}>Giving</a><ChevronRight aria-hidden="true"/><span aria-current="page">{opportunity.title}</span></nav><div className="container giving-detail-grid"><section className="giving-detail-overview" aria-labelledby="giving-detail-title"><img className="giving-detail-image" src={opportunity.image} alt={opportunity.imageAlt}/><div className="giving-detail-intro"><p className="eyebrow">{opportunity.category} · An offering of seva</p><h1 id="giving-detail-title">{opportunity.title}</h1><p>{opportunity.shortDescription}</p></div></section><DonationPanel opportunity={opportunity} event={event}/><section className="giving-detail-about" aria-labelledby="giving-about-title"><h2 id="giving-about-title">About This Seva</h2><p>{opportunity.fullDescription}</p><p>Every offering, large or small, helps keep the spirit of devotion and community alive.</p><div className="giving-detail-devotion"><HandHeart aria-hidden="true"/><span>Seva is an offering of love.</span></div><a className="event-all-link" href={givingHref}>Explore all giving opportunities</a></section></div></div>;
}
