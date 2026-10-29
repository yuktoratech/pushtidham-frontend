'use client';

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {ApiError, donationApi, type DonationRecord, type OfflineDonor, type OfflineEditInput} from '../lib/api-client';
import {catalogApi, type GivingRecord, type GivingCategoryRecord, type EventRecord} from '../lib/catalog-api';
import {templeDateTimeInput, templeDateTimeIso} from '../lib/event-time';
import {formatUsd, parseUsdToCents} from '../lib/money';
import './admin-offline-donation.css';
import './admin-offline-edit.css';

const labels:Record<string,string>={donorId:'Donor account',donorName:'Donor name',donorEmail:'Donor email',donorPhone:'Phone',type:'Donation type',giving:'Giving',event:'Event',amountCents:'Amount',donationPurpose:'Purpose',donationDate:'Donation date (Eastern)',offlinePaymentMethod:'Offline method',offlineReference:'Reference / check number',adminNote:'Admin note'};
export function OfflineDonationEditor({row,close,saved,onBusyChange}:{row:DonationRecord;close:()=>void;saved:()=>Promise<void>;onBusyChange:(busy:boolean)=>void}) {
  const originalDate=row.donationDate||row.completedAt||row.createdAt;
  const initialDate=templeDateTimeInput(originalDate);
  const [values,setValues]=useState({name:row.donor?.name||'',email:row.donor?.email||'',phone:row.donor?.phone||'',giving:row.giving||'',event:row.event||'',amount:(row.baseDonationCents/100).toFixed(2),purpose:row.donationPurpose||'',date:initialDate,method:row.offlinePaymentMethod||'',reference:row.references?.offline||'',note:row.adminNote||'',reason:''});
  const [donorId,setDonorId]=useState<string|null>(row.donor?.id||null),[search,setSearch]=useState(''),[matches,setMatches]=useState<OfflineDonor[]>([]),[confirmed,setConfirmed]=useState(false);
  const [categories,setCategories]=useState<GivingCategoryRecord[]>([]),[giving,setGiving]=useState<GivingRecord[]>([]),[events,setEvents]=useState<EventRecord[]>([]),[category,setCategory]=useState('');
  const [catalogLoading,setCatalogLoading]=useState(true),[catalogError,setCatalogError]=useState(''),[retry,setRetry]=useState(0);
  const [error,setError]=useState(''),[searchError,setSearchError]=useState(''),[busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false);
  const [review,setReview]=useState<{body:OfflineEditInput;changes:Array<[string,string,string]>}|null>(null);
  const request=useRef<{body:OfflineEditInput;key:string}|null>(null),pending=useRef(false),heading=useRef<HTMLHeadingElement>(null);
  const reviewing=Boolean(review);
  useEffect(()=>{heading.current?.focus()},[reviewing]);
  useEffect(()=>{onBusyChange(busy||uncertain);return()=>onBusyChange(false)},[busy,uncertain,onBusyChange]);
  const selected=giving.find(item=>item._id===values.giving),reassigned=donorId!==(row.donor?.id||null),other=selected?.slug==='other';
  const historical=!!values.event||category==='historical';
  useEffect(()=>{
    let active=true;
    Promise.all([catalogApi.publicGivingCategories(),catalogApi.adminGiving(),catalogApi.adminEvents()]).then(([cats,items,eventRows])=>{
      if(!active)return;setCategories(cats);setGiving(items);setEvents(eventRows);setCatalogError('');
      setCategory(row.event?'historical':items.find(item=>item._id===row.giving)?.categoryId||'legacy');
    }).catch(reason=>{if(active)setCatalogError(reason instanceof Error?reason.message:'Catalog could not be loaded.')}).finally(()=>{if(active)setCatalogLoading(false)});
    return()=>{active=false};
  },[row.giving,row.event,retry]);
  useEffect(()=>{
    if(search.trim().length<3)return;let active=true;
    const timer=setTimeout(()=>{donationApi.searchDonors(search.trim()).then(result=>{if(active){setMatches(result);setSearchError('')}}).catch(reason=>{if(active)setSearchError(reason instanceof Error?reason.message:'Donor search failed.')})},300);
    return()=>{active=false;clearTimeout(timer)};
  },[search]);
  const change=(key:keyof typeof values,value:string)=>{setValues(current=>({...current,[key]:value}));setError('')};
  const selectCategory=(id:string)=>{setCategory(id);setValues(current=>({...current,giving:'',event:'',amount:'',purpose:''}))};
  function selectGiving(id:string){const item=giving.find(option=>option._id===id);setValues(current=>({...current,giving:id,event:'',amount:item?.amountType==='fixed'&&item.fixedAmountsCents.length===1?(item.fixedAmountsCents[0]/100).toFixed(2):'',purpose:''}))}
  function chooseDonor(donor:OfflineDonor){setDonorId(donor.id);setValues(current=>({...current,name:donor.name,email:donor.email,phone:donor.phone}));setConfirmed(false);setMatches([]);setSearch('')}
  function prepare(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');const parsed=parseUsdToCents(values.amount);
    if(parsed.cents===null){setError(parsed.error||'Enter a valid amount.');return}
    if(!values.giving&&!values.event){setError('Choose a Giving or historical Event.');return}
    const unchangedSelection=values.giving===row.giving&&parsed.cents===row.baseDonationCents;
    if(selected?.amountType==='fixed'&&!selected.fixedAmountsCents.includes(parsed.cents)&&!unchangedSelection){setError('Choose a configured fixed amount.');return}
    if(other&&!values.purpose.trim()){setError('Donation purpose is required for Other.');return}
    if(reassigned&&!confirmed){setError('Confirm reassignment to the selected donor.');return}
    const date=values.date===initialDate?originalDate:templeDateTimeIso(values.date);
    if(!date){setError('Enter an unambiguous valid Eastern donation date and time.');return}
    const body:OfflineEditInput={expectedVersion:row.correctionVersion||0,reason:values.reason.trim(),donorId,confirmDonorReassignment:reassigned&&confirmed,donorName:values.name.trim(),donorEmail:values.email.trim().toLowerCase(),donorPhone:values.phone.trim(),type:historical||selected?.category==='utsav'||(!selected&&values.giving===row.giving&&row.type==='event')?'event':'general',...(historical?{event:values.event}:{giving:values.giving}),amountCents:parsed.cents,donationPurpose:values.purpose.trim(),donationDate:date,offlinePaymentMethod:values.method?values.method as 'cash'|'check'|'other':undefined,offlineReference:values.reference.trim(),adminNote:values.note};
    if(!body.reason){setError('Enter a correction reason.');return}
    const original:Record<string,unknown>={donorId:row.donor?.id||null,donorName:row.donor?.name||'',donorEmail:row.donor?.email||'',donorPhone:row.donor?.phone||'',type:row.type,giving:row.giving||'',event:row.event||'',amountCents:row.baseDonationCents,donationPurpose:row.donationPurpose||'',donationDate:originalDate,offlinePaymentMethod:row.offlinePaymentMethod||'',offlineReference:row.references?.offline||'',adminNote:row.adminNote||''};
    const display=(key:string,value:unknown)=>key==='amountCents'?formatUsd(Number(value)):key==='giving'?giving.find(item=>item._id===value)?.title||String(value||'None'):key==='event'?events.find(item=>item._id===value)?.title||String(value||'None'):key==='donationDate'?new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'America/New_York'}).format(new Date(String(value))):String(value||'None');
    const changes=Object.entries(labels).flatMap(([key,label])=>{
      const value=body[key as keyof OfflineEditInput];
      return String(original[key]||'')===String(value||'')?[]:[[label,display(key,original[key]),display(key,value)] as [string,string,string]];
    });
    if(!changes.length){setError('Change at least one field before saving a correction.');return}
    setReview({body,changes});
  }
  async function save(){
    if(!review||pending.current)return;
    request.current??={body:review.body,key:`correction-${crypto.randomUUID()}`};pending.current=true;setBusy(true);setError('');
    try{await donationApi.editOffline(row.id,request.current.body,request.current.key);request.current=null;setUncertain(false);await saved()}
    catch(reason){setError(reason instanceof Error?reason.message:'Correction could not be saved.');const unknown=!(reason instanceof ApiError)||reason.status===0||reason.status>=500;setUncertain(unknown);if(!unknown)request.current=null}
    finally{pending.current=false;setBusy(false)}
  }
  return <section className="admin-real-modal-card offline-entry offline-correction"><h2 ref={heading} tabIndex={-1} id="donation-detail-title">{review?'Review Changes':'Edit Offline Donation'}</h2><p>{row.donationNumber} · Status remains <strong>{row.donationStatus}</strong>. No emails or payments are triggered.</p>
    {row.donationStatus==='completed'&&!row.receiptHistoryTracked&&<p className="adm-notice">The original issued receipt is not archived. Only internal notes can be corrected until its original content is reliably recovered.</p>}
    {error&&<p className="adm-error" role="alert">{error}</p>}{busy&&<p role="status">Saving correction. Please wait...</p>}
    {review?<><dl className="correction-review">{review.changes.map(([label,before,after])=><div key={label}><dt>{label}</dt><dd><span>Before: {before}</span><strong>After: {after}</strong></dd></div>)}</dl><p className="donation-purpose-text"><strong>Correction reason:</strong> {review.body.reason}</p><p>Previous values remain in immutable audit history. Receipt changes on eligible completed donations create a new revision.</p>{uncertain&&<p role="status">The response was interrupted. Retry the same correction to safely retrieve its result.</p>}<div className="adm-modal-actions"><button type="button" className="adm-button adm-secondary" disabled={busy||uncertain} onClick={()=>{setReview(null);setError('')}}>Back to edit</button><button className="adm-button" disabled={busy} onClick={()=>void save()}>{uncertain?'Retry Same Correction':'Confirm & Save'}</button></div></>:<form onSubmit={prepare}>
      <fieldset className="offline-section" disabled={busy}><legend>Donor</legend><p><strong>{values.name}</strong> · {values.email}</p><label className="adm-field"><span>Find an existing donor by email</span><input type="search" value={search} onChange={event=>{setSearch(event.target.value);setMatches([])}} autoComplete="off"/></label>{searchError&&<p role="alert">{searchError}</p>}{search.trim().length>=3&&<ul className="offline-donor-results">{matches.map(donor=><li key={donor.id}><button type="button" onClick={()=>chooseDonor(donor)}>{donor.name} · {donor.email}</button></li>)}</ul>}
      {reassigned&&<label className="offline-history"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>I confirm this donation belongs to {values.name} ({values.email}). The previous donor will lose access.</label>}
      <div className="adm-editor-grid"><label className="adm-field"><span>Donor name</span><input required readOnly={!!donorId} maxLength={120} value={values.name} onChange={event=>change('name',event.target.value)}/></label><label className="adm-field"><span>Donor email</span><input type="email" required readOnly={!!donorId} value={values.email} onChange={event=>change('email',event.target.value)}/></label><label className="adm-field"><span>Donor phone</span><input readOnly={!!donorId} maxLength={40} value={values.phone} onChange={event=>change('phone',event.target.value)}/></label></div></fieldset>
      <fieldset className="offline-section" disabled={busy}><legend>Donation designation and amount</legend>
      {catalogLoading?<p role="status">Loading catalog...</p>:catalogError?<p role="alert">{catalogError} <button type="button" onClick={()=>{setCatalogLoading(true);setRetry(value=>value+1)}}>Retry catalog</button></p>:<div className="adm-editor-grid"><label className="adm-field"><span>Donation category</span><select value={category} onChange={event=>selectCategory(event.target.value)}><option value="legacy" disabled>Current historical Giving</option>{categories.map(item=><option key={item._id} value={item._id}>{item.name}</option>)}<option value="historical">Historical scheduled Event</option></select></label>{historical?<label className="adm-field"><span>Event</span><select required value={values.event} onChange={event=>change('event',event.target.value)}><option value="">Choose an Event</option>{row.event&&!events.some(item=>item._id===row.event)&&<option value={row.event}>{row.designationTitle} (current)</option>}{events.map(item=><option key={item._id} value={item._id}>{item.title} ({item.status})</option>)}</select></label>:<label className="adm-field"><span>Giving</span><select required value={values.giving} onChange={event=>selectGiving(event.target.value)}><option value="">Choose Giving</option>{row.giving&&!giving.some(item=>item._id===row.giving&&item.categoryId===category)&&values.giving===row.giving&&<option value={row.giving}>{row.designationTitle} (current)</option>}{giving.filter(item=>item.categoryId===category&&(item.status==='active'||item._id===row.giving)).map(item=><option key={item._id} value={item._id}>{item.title}{item.status==='inactive'?' (inactive, current)':''}</option>)}</select></label>}</div>}
      <label className="adm-field offline-amount"><span>Donation amount (USD)</span>{selected?.amountType==='fixed'?<select required value={values.amount} onChange={event=>change('amount',event.target.value)}><option value="">Choose a configured amount</option>{!selected.fixedAmountsCents.includes(Math.round(Number(values.amount)*100))&&values.giving===row.giving&&<option value={values.amount}>{formatUsd(row.baseDonationCents)} (saved historical amount)</option>}{selected.fixedAmountsCents.map(cents=><option key={cents} value={(cents/100).toFixed(2)}>{formatUsd(cents)}</option>)}</select>:<input required inputMode="decimal" value={values.amount} onChange={event=>change('amount',event.target.value)}/>}</label>
      {selected?.amountType==='fixed_and_custom'&&<div className="offline-presets">{selected.fixedAmountsCents.map(cents=><button type="button" key={cents} aria-pressed={values.amount===(cents/100).toFixed(2)} onClick={()=>change('amount',(cents/100).toFixed(2))}>{formatUsd(cents)}</button>)}</div>}
      <label className="adm-field"><span>Donation purpose {other?'(required for Other)':'(optional)'}</span><textarea required={other} maxLength={500} rows={3} value={values.purpose} onChange={event=>change('purpose',event.target.value)}/></label></fieldset>
      <fieldset className="offline-section" disabled={busy}><legend>Offline details</legend><div className="adm-editor-grid"><label className="adm-field"><span>Donation date and time (Eastern)</span><input type="datetime-local" required value={values.date} onChange={event=>change('date',event.target.value)}/></label><label className="adm-field"><span>Offline payment method</span><select value={values.method} onChange={event=>change('method',event.target.value)}><option value="" disabled>Not recorded (historical)</option><option value="cash">Cash</option><option value="check">Check</option><option value="other">Other</option></select></label><label className="adm-field"><span>Reference / check number</span><input maxLength={200} value={values.reference} onChange={event=>change('reference',event.target.value)}/></label><label className="adm-field"><span>Internal admin note</span><textarea rows={3} maxLength={2000} value={values.note} onChange={event=>change('note',event.target.value)}/></label></div></fieldset>
      <label className="adm-field"><span>Correction reason (required)</span><textarea required maxLength={1000} rows={3} value={values.reason} onChange={event=>change('reason',event.target.value)}/></label><div className="adm-modal-actions"><button className="adm-button" disabled={busy||catalogLoading}>Review Changes</button></div>
    </form>}<div className="adm-modal-actions"><button type="button" className="adm-button adm-secondary" disabled={busy||uncertain} onClick={close}>Cancel editing</button></div>
  </section>;
}
