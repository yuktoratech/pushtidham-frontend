'use client';
import './catalog-enhancements.css';
import './donate-experience.css';
import {useEffect, useState} from 'react';
import {HandHeart} from 'lucide-react';
import {catalogApi, type GivingCategoryRecord, type GivingRecord} from '../lib/catalog-api';
import {givingView, catalogErrorMessage} from '../lib/catalog-ui';
import {DonationPanel} from './donation-panel';
import {CatalogImage} from './catalog-image';
import {clientDemoPaymentsDeferred, PaymentDemoNotice} from './payment-demo-notice';

export function Donate() {
  const [categories,setCategories]=useState<GivingCategoryRecord[]>([]);
  const [options,setOptions]=useState<GivingRecord[]>([]);
  const [category,setCategory]=useState('');
  const [group,setGroup]=useState('');
  const [selected,setSelected]=useState('');
  const [loading,setLoading]=useState(true);
  const [optionsLoading,setOptionsLoading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    let current=true;
    (async()=>{
      try {
        const rows=await catalogApi.publicGivingCategories();
        const query=new URLSearchParams(window.location.search);
        let chosen=rows.find(c=>c.slug===query.get('givingCategory')||c._id===query.get('categoryId'));
        const slug=query.get('giving')||query.get('opportunity');
        let giving:GivingRecord|undefined;
        if(slug) {
          try{giving=await catalogApi.publicGivingBySlug(slug);}catch{}
          chosen=rows.find(c=>c._id===giving?.categoryId)||chosen;
        }
        if(!current)return;
        setCategories(rows);setOptionsLoading(Boolean(chosen));setCategory(chosen?._id||'');setGroup(chosen?(['daily-seva','general-donation'].includes(chosen.slug)?chosen.slug:'utsav'):'');
        setSelected(giving?.slug||'');
        if(query.has('event'))setNotice('Events are information only. Please choose a Giving opportunity.');
        else if((slug&&(!giving||!chosen))||((query.has('givingCategory')||query.has('categoryId'))&&!chosen))setNotice('That selection is unavailable. Please choose an available category and Giving option.');
      }catch(reason){if(current)setError(catalogErrorMessage(reason));}
      finally{if(current)setLoading(false);}
    })();
    return()=>{current=false};
  },[retry]);
  useEffect(()=>{
    if(!category)return;
    let current=true;
    catalogApi.publicGiving(category).then(rows=>{if(current)setOptions(rows.filter(g=>g.status==='active'&&g.categoryId===category))}).catch(reason=>{if(current)setError(catalogErrorMessage(reason))}).finally(()=>{if(current)setOptionsLoading(false)});
    return()=>{current=false};
  },[category,retry]);
  const chosen=categories.find(c=>c._id===category);
  const opportunity=options.find(g=>g.slug===selected);
  function chooseCategory(id:string){
    setCategory(id);setSelected('');setOptions([]);setOptionsLoading(Boolean(id));setNotice('');setError('');
    const row=categories.find(c=>c._id===id);
    window.history.replaceState(null,'',`/donate?givingCategory=${encodeURIComponent(row?.slug||'')}`);
  }
  function chooseGiving(slug:string){
    setSelected(slug);
    const params=new URLSearchParams({giving:slug,givingCategory:chosen?.slug||'',categoryId:category});
    window.history.replaceState(null,'',`/donate?${params}`);
  }
  return <div className="donate-page donate-experience container"><header className="checkout-heading"><div><p className="eyebrow">An offering of seva</p><h1>Make a Donation</h1><p>Choose a category, Giving opportunity and donation amount.</p></div></header>{clientDemoPaymentsDeferred&&<PaymentDemoNotice/>}
    {notice&&<p role="status">{notice}</p>}{error&&<div role="alert"><p>{error}</p><button className="button" onClick={()=>{setError('');setRetry(n=>n+1)}}>Try Again</button></div>}
    {loading?<p role="status">Loading Giving categories…</p>:!categories.length?<section className="checkout-empty"><h2>Giving categories are being prepared</h2><p>Please contact the Haveli for seva information.</p></section>:<div className="donate-selection-grid"><section className="checkout-panel"><div className="checkout-panel-heading"><HandHeart aria-hidden="true"/><h2>Donation Details</h2></div>

      <h2>1. Choose Category</h2>
      <div className="offering-grid" role="group" aria-label="Donation category">{[['daily-seva','Daily Seva'],['general-donation','General Donation'],['utsav','Utsav']].map(([slug,label])=><button type="button" key={slug} aria-pressed={group===slug} onClick={()=>{if(group===slug)return;setGroup(slug);chooseCategory(categories.find(c=>c.slug===slug)?._id||'');}}><HandHeart aria-hidden="true"/><strong>{label}</strong><span>{group===slug?'✓ Selected':'Choose offering'}</span></button>)}</div>
      {group==='utsav'&&<><h2>Choose your festival</h2><div className="offering-grid festival-grid" role="group" aria-label="Festival">{['dolotsav','pragatya-divas-maha-bhog','nand-mahotsav','adhikmas-hindola','annakut'].map(slug=>categories.find(c=>c.slug===slug)).filter((c):c is GivingCategoryRecord=>Boolean(c)).map(c=><button type="button" key={c._id} aria-pressed={category===c._id} onClick={()=>{if(category!==c._id)chooseCategory(c._id)}}>{c.image&&<CatalogImage src={c.image} fallback="/images/diya.webp" alt=""/>}<strong>{c.name}</strong><span>{category===c._id?'✓ Selected':'Choose festival'}</span></button>)}</div></>}
      {chosen&&<><h2>2. Choose Giving</h2><p>{chosen.description}</p><div className="offering-grid giving-grid" role="group" aria-label="Giving opportunity">{options.map(g=><button type="button" key={g._id} aria-pressed={selected===g.slug} onClick={()=>chooseGiving(g.slug)}><strong>{g.title}</strong>{g.description&&<span>{g.description}</span>}<span>{selected===g.slug?'✓ Selected':'Select this Giving'}</span></button>)}</div></>}
      {optionsLoading?<p role="status">Loading Giving options…</p>:category&&!options.length&&<p>No active Giving options are available in this category.</p>}
      {opportunity&&<p className="catalog-description">{opportunity.description}</p>}
    </section><aside className="donate-summary">{opportunity&&chosen?<DonationPanel key={category+opportunity._id} opportunity={givingView(opportunity)} givingCategory={chosen} donatePage/>:<><HandHeart aria-hidden="true"/><h2>3. Choose Donation Amount</h2><p>Choose an offering and Giving option to see the available amounts.</p><h2>4. Review Your Donation</h2><p>Your donation details will appear here before checkout.</p><button type="button" className="button" disabled>Continue to Checkout</button></>}</aside></div>}
  </div>;
}
