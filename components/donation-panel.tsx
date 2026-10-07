'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { HandHeart, CalendarDays, Landmark, FileText } from 'lucide-react';
import { useAdminDemo } from '../hooks/use-admin-demo';
import { readDonationSelection } from '../lib/checkout';
import type { GivingOpportunity } from '../lib/giving';
import type { TempleEvent } from '../lib/events';
import { allowsCustom, allowsFixed, amountMatchesOpportunity, checkoutPath, donationCurrency, donationSelectionKey, parseCustomAmount, type DonationSelection } from '../lib/donation-selection';

type PanelProps={opportunity?:GivingOpportunity;event?:TempleEvent};
export function DonationPanel({opportunity,event}:PanelProps){
  const {data,ready}=useAdminDemo();
  const initial=ready?readDonationSelection(new URLSearchParams(window.location.search),data):null;
  const key=`${ready}:${event?'event':'general'}:${event?.slug||opportunity?.slug}:${opportunity?.amountType}:${opportunity?.suggestedAmounts.join(',')}`;
  const matches=event?initial?.categorySlug==='event'&&initial.eventSlug===event.slug:initial?.categorySlug==='general'&&initial.givingSlug===opportunity?.slug;
  return <DonationAmountForm key={key} opportunity={opportunity} event={event} initial={matches?initial:null}/>;
}

function DonationAmountForm({opportunity,event,initial}:PanelProps & {initial:DonationSelection|null}){
  const config=opportunity||{amountType:'custom' as const,suggestedAmounts:[]};
  const fixed=allowsFixed(config.amountType);
  const customAllowed=allowsCustom(config.amountType);
  const [choice,setChoice]=useState<number|'custom'>(initial?.amountChoice??(fixed?config.suggestedAmounts[0]:'custom'));
  const [custom,setCustom]=useState(initial?.amountChoice==='custom'?(initial.amountCents/100).toFixed(2):'');
  const [touched,setTouched]=useState(false);
  const customRef=useRef<HTMLInputElement>(null);
  const parsed=choice==='custom'?parseCustomAmount(custom):parseCustomAmount(String(choice));
  const valid=parsed.cents!==null&&amountMatchesOpportunity(config,choice,parsed.cents);
  const showError=choice==='custom'&&(touched||custom.length>0)&&parsed.error;
  useEffect(()=>{if(choice==='custom')customRef.current?.focus();},[choice]);
  function continueDonation(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setTouched(true);if(!valid||parsed.cents===null)return;
    if(!opportunity&&!event)return;
    const selection:DonationSelection={amountCents:parsed.cents,currency:'USD',donationType:'one-time',amountChoice:choice,...(event?{categorySlug:'event' as const,eventSlug:event.slug,eventId:event.id}:{categorySlug:'general' as const,givingSlug:opportunity!.slug})};
    try{sessionStorage.setItem(donationSelectionKey,JSON.stringify(selection));}catch{}
    // Match PageLink's document navigation so checkout reads the destination
    // URL after it is committed, rather than the previous selection-page URL.
    window.location.assign(checkoutPath(selection));
  }
  return <aside className="donation-panel" aria-labelledby="amount-title">
    <div className="donation-panel-intro"><HandHeart aria-hidden="true"/><p className="eyebrow">An offering from the heart</p></div>
    <h2 id="amount-title">Choose Your Donation Amount</h2><p className="donation-panel-subtitle">Every contribution is a meaningful act of seva.</p>
    {event&&<div className="donation-event-message"><CalendarDays aria-hidden="true"/><p>Supporting: <strong>{event.title}</strong></p></div>}
    <form onSubmit={continueDonation} noValidate>
      {fixed&&<fieldset className="donation-amount-options"><legend className="sr-only">Donation amount in USD</legend>
        {config.suggestedAmounts.map(amount=><label key={amount} className={`donation-amount-option ${choice===amount?'is-selected':''}`}><input type="radio" name="donation-amount" value={amount} checked={choice===amount} onChange={()=>{setChoice(amount);setTouched(false);}}/><span>{donationCurrency(parseCustomAmount(String(amount)).cents!)}</span></label>)}
        {customAllowed&&<label className={`donation-amount-option donation-custom-option ${choice==='custom'?'is-selected':''}`}><input type="radio" name="donation-amount" value="custom" checked={choice==='custom'} onChange={()=>{setChoice('custom');setTouched(false);}}/><span>Custom Amount</span></label>}
      </fieldset>}
      {customAllowed&&choice==='custom'&&<div className="donation-custom-field"><label htmlFor="custom-donation">Custom amount (USD)</label><div className={`donation-currency-input ${showError?'has-error':''}`}><span aria-hidden="true">$</span><input ref={customRef} id="custom-donation" type="text" inputMode="decimal" autoComplete="off" placeholder="Enter amount" value={custom} onChange={e=>setCustom(e.target.value)} onBlur={()=>setTouched(true)} aria-invalid={!!showError} aria-describedby={showError?'donation-amount-error':'donation-amount-help'}/></div>{showError?<p id="donation-amount-error" className="donation-input-error" role="alert">{parsed.error}</p>:<p id="donation-amount-help" className="donation-input-help">Enter a positive amount in USD, with up to two decimal places.</p>}</div>}
      <div className="donation-type-line"><span className="donation-type-mark" aria-hidden="true"/><span>One-time donation</span></div>
      <div className="donation-total"><span>Your contribution</span><strong>{valid?donationCurrency(parsed.cents!):'Choose an amount'}<small>USD</small></strong></div>
      <button type="submit" className="button donation-continue" disabled={!valid}>Continue to Checkout</button><p className="donation-payment-note">No payment is taken when choosing an amount.</p>
    </form>
    <div className="donation-trust"><div><Landmark aria-hidden="true"/><p>Your contribution supports Pushthidham Haveli.</p></div><div><FileText aria-hidden="true"/><p>A receipt is provided after a successful donation.</p></div></div>
  </aside>;
}
