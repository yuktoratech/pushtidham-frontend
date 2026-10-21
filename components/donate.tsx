'use client';
import './catalog-enhancements.css';
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
        setCategories(rows);setOptionsLoading(Boolean(chosen||rows[0]));setCategory(chosen?._id||rows[0]?._id||'');
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
    catalogApi.publicGiving(category).then(rows=>{if(current)setOptions(rows)}).catch(reason=>{if(current)setError(catalogErrorMessage(reason))}).finally(()=>{if(current)setOptionsLoading(false)});
    return()=>{current=false};
  },[category,retry]);
  const chosen=categories.find(c=>c._id===category);
  const opportunity=options.find(g=>g.slug===selected);
  function chooseCategory(id:string){
    setCategory(id);setSelected('');setOptions([]);setOptionsLoading(true);setNotice('');setError('');
    const row=categories.find(c=>c._id===id);
    window.history.replaceState(null,'',`/donate?givingCategory=${encodeURIComponent(row?.slug||'')}`);
  }
  function chooseGiving(slug:string){
    setSelected(slug);
    const params=new URLSearchParams({giving:slug,givingCategory:chosen?.slug||'',categoryId:category});
    window.history.replaceState(null,'',`/donate?${params}`);
  }
  return <div className="donate-page container"><header className="checkout-heading"><div><p className="eyebrow">An offering of seva</p><h1>Make a Donation</h1><p>Choose a category, Giving opportunity and donation amount.</p></div></header>{clientDemoPaymentsDeferred&&<PaymentDemoNotice/>}
    {notice&&<p role="status">{notice}</p>}{error&&<div role="alert"><p>{error}</p><button className="button" onClick={()=>{setError('');setRetry(n=>n+1)}}>Try Again</button></div>}
    {loading?<p role="status">Loading Giving categories…</p>:!categories.length?<section className="checkout-empty"><h2>Giving categories are being prepared</h2><p>Please contact the Haveli for seva information.</p></section>:<div className="donate-selection-grid"><section className="checkout-panel"><div className="checkout-panel-heading"><HandHeart aria-hidden="true"/><h2>Donation Details</h2></div>
      <div className="donate-category-grid" role="group" aria-label="Giving categories">{categories.map(item=><button type="button" key={item._id} className={`donate-category-card ${category===item._id?'is-selected':''}`} aria-pressed={category===item._id} onClick={()=>chooseCategory(item._id)}><CatalogImage src={item.image} fallback="/images/diya.webp" alt=""/><strong>{item.name}</strong></button>)}</div>
      {chosen?.description&&<p className="catalog-description">{chosen.description}</p>}
      <div className="auth-field"><label htmlFor="donate-for">Giving opportunity</label><select id="donate-for" value={selected} disabled={optionsLoading||!options.length} onChange={e=>chooseGiving(e.target.value)}><option value="">Choose a Giving opportunity</option>{options.map(g=><option key={g._id} value={g.slug}>{g.title}</option>)}</select></div>
      {optionsLoading?<p role="status">Loading Giving options…</p>:!options.length&&<p>No active Giving options are available in this category.</p>}
      {opportunity&&<p className="catalog-description">{opportunity.description}</p>}
    </section>{opportunity&&chosen&&<DonationPanel key={category+opportunity._id} opportunity={givingView(opportunity)} givingCategory={chosen}/>}</div>}
  </div>;
}
