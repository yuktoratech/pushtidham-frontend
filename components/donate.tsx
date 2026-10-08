'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, HandHeart, Info } from 'lucide-react';
import { eventDate, eventView, givingView } from '../lib/catalog-ui';
import { donatePath, eventDonationPath, type DonationCategory } from '../lib/donation-selection';
import { DonationPanel } from './donation-panel';
import { PageLink } from './page-link';
import { usePublicCatalog } from './catalog-provider';

export function Donate(){
  const catalog=usePublicCatalog();const giving=useMemo(()=>catalog.giving.map(givingView),[catalog.giving]);const events=useMemo(()=>catalog.events.map(eventView),[catalog.events]);const ready=!catalog.loading;
  const [category,setCategory]=useState<DonationCategory>('General');
  const [selected,setSelected]=useState('general-donation');
  const [initialized,setInitialized]=useState(false);
  const [notice,setNotice]=useState('');
  const defaultGiving=giving.find(g=>g.slug==='general-donation')?.slug||giving[0]?.slug||'';
  useEffect(()=>{if(!ready||initialized)return;const timer=setTimeout(()=>{
    const query=new URLSearchParams(window.location.search);
    const event=query.get('event');
    const isEvent=query.get('category')==='event'||(query.get('category')!=='general'&&!!event);
    const requested=isEvent?event:query.get('giving')||query.get('opportunity');
    const options=isEvent?events:giving;
    setCategory(isEvent?'Event':'General');
    setSelected(options.some(item=>item.slug===requested)?requested!:(isEvent?events[0]?.slug||'':defaultGiving));
    if(requested&&!options.some(item=>item.slug===requested))setNotice('That donation option is unavailable. Please choose an available option.');
    setInitialized(true);
  },0);return()=>clearTimeout(timer);},[ready,initialized,events,giving,defaultGiving]);
  const options=category==='General'?giving:events;
  const current=options.find(item=>item.slug===selected)||options.find(item=>item.slug===defaultGiving)||options[0];
  const opportunity=category==='General'?giving.find(g=>g.slug===current?.slug):undefined;
  const event=category==='Event'?events.find(e=>e.slug===current?.slug):undefined;
  function choose(nextCategory:DonationCategory,slug:string){
    setCategory(nextCategory);setSelected(slug);setNotice('');
    // Refreshes preserve the new selection and discard the previous amount.
    window.history.replaceState(null,'',nextCategory==='Event'?eventDonationPath(slug):donatePath(slug));
  }
  if(catalog.loading)return <div className="container checkout-empty" role="status"><HandHeart aria-hidden="true"/><h1>Make a Donation</h1><p>Loading donation options…</p></div>;
  if(catalog.error)return <div className="container checkout-empty" role="alert"><h1>Donation options are unavailable</h1><p>{catalog.error}</p><button className="button" onClick={()=>void catalog.reload()}>Try Again</button></div>;
  return <div className="donate-page">
    <nav className="container giving-detail-breadcrumb" aria-label="Breadcrumb"><PageLink href="/">Home</PageLink><ChevronRight aria-hidden="true"/><PageLink href="/giving">Giving</PageLink><ChevronRight aria-hidden="true"/><span aria-current="page">Donate</span></nav>
    <div className="container"><header className="checkout-heading"><div><p className="eyebrow">An offering of seva</p><h1>Make a Donation</h1><p>Choose your offering and amount before continuing to checkout.</p></div><span className="checkout-preview"><Info aria-hidden="true"/>Frontend preview · no payment is taken</span></header>
      {notice&&<p className="account-demo-notice" role="status">{notice}</p>}
      <div className="donate-selection-grid"><section className="checkout-panel donate-option-panel" aria-labelledby="donate-option-title"><div className="checkout-panel-heading"><HandHeart aria-hidden="true"/><div><p className="eyebrow">Your offering</p><h2 id="donate-option-title">Donation Details</h2></div></div>
        <div className="auth-field"><label htmlFor="donate-category">Category</label><select id="donate-category" value={category} onChange={e=>{const next=e.target.value as DonationCategory;choose(next,next==='General'?defaultGiving:events[0]?.slug||'');}}><option>General</option><option>Event</option></select></div>
        <div className="auth-field"><label htmlFor="donate-for">Donation For</label><select id="donate-for" value={current?.slug||''} disabled={!options.length} onChange={e=>choose(category,e.target.value)}>{!options.length&&<option value="">No available {category==='General'?'giving items':'events'}</option>}{options.map(item=><option key={item.slug} value={item.slug}>{item.title}{category==='Event'?` — ${eventDate(events.find(e=>e.slug===item.slug)!.startsAt)}`:''}</option>)}</select></div>
        <p className="donate-description">{opportunity?.shortDescription||event?.description||'Please return when a donation option is available.'}</p>
        <p className="checkout-demo-note">Your selected {category==='General'?'giving item':'event'} and amount will be carried into the donation summary. Guest and signed-in account checkout are available.</p>
      </section>{current&&<DonationPanel opportunity={opportunity} event={event}/>}</div>
    </div>
  </div>;
}
