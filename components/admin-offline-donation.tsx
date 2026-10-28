'use client';

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {ApiError, donationApi, type OfflineDonor, type OfflineSave} from '../lib/api-client';
import {catalogApi, type GivingCategoryRecord, type GivingRecord, type EventRecord} from '../lib/catalog-api';
import {donationGroups, festivalCategorySlugs} from '../lib/donation-groups';
import {parseUsdToCents} from '../lib/money';
import {donationCurrency} from '../lib/donation-selection';
import './admin-offline-donation.css';

const blank = {email:'', name:'', phone:'', amount:'', purpose:'', method:'cash', reference:'', note:'', status:'pending'};
export function OfflineDonationForm({close, saved, view}:{close:()=>void;saved:()=>void;view:(id:string)=>void}) {
  const [categories,setCategories]=useState<GivingCategoryRecord[]>([]);
  const [giving,setGiving]=useState<GivingRecord[]>([]);
  const [events,setEvents]=useState<EventRecord[]>([]);
  const [group,setGroup]=useState(''),[categoryId,setCategoryId]=useState(''),[givingId,setGivingId]=useState('');
  const [historical,setHistorical]=useState(false),[eventId,setEventId]=useState('');
  const [catalogLoading,setCatalogLoading]=useState(true),[catalogError,setCatalogError]=useState(''),[reload,setReload]=useState(0);
  const [values,setValues]=useState({...blank});
  const [donor,setDonor]=useState<OfflineDonor|null>(null),[matches,setMatches]=useState<OfflineDonor[]>([]);
  const [searching,setSearching]=useState(false),[searchedEmail,setSearchedEmail]=useState(''),[searchError,setSearchError]=useState('');
  const [busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[error,setError]=useState('');
  const [result,setResult]=useState<OfflineSave|null>(null),[mailMessage,setMailMessage]=useState(''),[mailBusy,setMailBusy]=useState(false);
  const pending=useRef(false), request=useRef<{key:string;body:object}|null>(null);
  const categorySelect=useRef<HTMLSelectElement>(null);
  const selected=giving.find(row=>row._id===givingId);
  const other=!historical&&selected?.slug==='other';
  const options=giving.filter(row=>row.status==='active'&&row.categoryId===categoryId);
  const normalizedEmail=values.email.trim().toLowerCase();
  const exact=matches.find(row=>row.email.toLowerCase()===normalizedEmail);
  useEffect(()=>{
    let active=true;
    Promise.all([catalogApi.publicGivingCategories(),catalogApi.adminGiving('', 'active'),catalogApi.adminEvents()])
      .then(([cats,items,eventRows])=>{if(active){setCategories(cats);setGiving(items);setEvents(eventRows);setCatalogError('')}})
      .catch(reason=>{if(active)setCatalogError(reason instanceof Error?reason.message:'Unable to load donation choices.')})
      .finally(()=>{if(active)setCatalogLoading(false)});
    return()=>{active=false};
  },[reload]);
  useEffect(()=>{
    if(donor||normalizedEmail.length<3)return;
    let active=true;
    const timer=setTimeout(()=>{
      setSearching(true);setSearchError('');
      donationApi.searchDonors(normalizedEmail).then(rows=>{if(active){setMatches(rows);setSearchedEmail(normalizedEmail)}})
        .catch(reason=>{if(active)setSearchError(reason instanceof Error?reason.message:'Donor search unavailable. Please retry.')})
        .finally(()=>{if(active)setSearching(false)});
    },300);
    return()=>{active=false;clearTimeout(timer)};
  },[normalizedEmail,donor,reload]);
  function change(key:keyof typeof blank,value:string){setValues(previous=>({...previous,[key]:value}));setError('')}
  function resetChoice(){setGivingId('');setValues(previous=>({...previous,amount:'',purpose:''}));setError('')}
  function chooseGroup(value:string){setGroup(value);setCategoryId(categories.find(row=>row.slug===value)?._id||'');resetChoice()}
  function chooseGiving(id:string){
    setGivingId(id);const row=giving.find(item=>item._id===id);
    setValues(previous=>({...previous,amount:row?.amountType==='fixed'&&row.fixedAmountsCents.length===1?(row.fixedAmountsCents[0]/100).toFixed(2):'',purpose:''}));setError('');
  }
  function chooseDonor(row:OfflineDonor){setDonor(row);setMatches([]);setSearching(false);setValues(previous=>({...previous,email:row.email,name:row.name,phone:row.phone}));setError('')}
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(pending.current)return;setError('');
    if(!request.current){
      const parsed=parseUsdToCents(values.amount);
      if(parsed.cents===null){setError(parsed.error||'Enter a valid USD amount.');return}
      if(!historical&&(!selected||selected.categoryId!==categoryId)){setError('Choose a Giving option from the selected category.');return}
      if(selected?.amountType==='fixed'&&!historical&&!selected.fixedAmountsCents.includes(parsed.cents)){setError('Choose one of the configured fixed amounts.');return}
      if(other&&!values.purpose.trim()){setError('Donation purpose is required for Other.');return}
      if(!donor&&(searching||searchedEmail!==normalizedEmail||searchError)){setError('Wait for the donor email search to finish, or retry it.');return}
      if(exact&&!donor){setError('Select the existing donor above to use their saved details.');return}
      const body={donorName:values.name.trim(),donorEmail:normalizedEmail,...(values.phone.trim()?{donorPhone:values.phone.trim()}:{}),
        ...(donor?{user:donor.id}:{}),type:historical||selected?.category==='utsav'?'event':'general',
        ...(historical?{event:eventId}:{giving:givingId,categoryId}),amountCents:parsed.cents,currency:'USD',
        ...(other?{donationPurpose:values.purpose.trim()}:{}),offlinePaymentMethod:values.method,status:values.status,
        ...(values.reference.trim()?{offlineReference:values.reference.trim()}:{}),...(values.note.trim()?{adminNote:values.note.trim()}:{})};
      request.current={key:`offline-${crypto.randomUUID()}`,body};
    }
    pending.current=true;setBusy(true);
    try{
      const response=await donationApi.createOffline(request.current.body,request.current.key);
      setResult(response);setMailMessage('');setValues({...blank});setDonor(null);setMatches([]);setSearchedEmail('');setSearching(false);
      setGroup('');setCategoryId('');setGivingId('');setEventId('');setHistorical(false);request.current=null;setUncertain(false);saved();
      requestAnimationFrame(()=>categorySelect.current?.focus());
    }catch(reason){
      setError(reason instanceof Error?reason.message:'Unable to save donation.');
      const unknown=!(reason instanceof ApiError)||reason.status===0||reason.status>=500;
      setUncertain(unknown);if(!unknown)request.current=null;
    }finally{pending.current=false;setBusy(false)}
  }
  async function welcome(retry:boolean){
    if(!result||mailBusy)return;setMailBusy(true);setMailMessage('');
    try{
      if(retry){await donationApi.retryWelcome(result.donor.id);setMailMessage('Setup email queued. Delivery is not yet confirmed.')}
      else{const rows=await donationApi.searchDonors(result.donor.email);const row=rows.find(item=>item.id===result.donor.id);if(row){setResult({...result,donor:row});setMailMessage(row.setupRequired?`Setup email: ${row.welcomeEmailStatus||'pending'}.`:'Donor password setup is complete.')}}
    }catch(reason){setMailMessage(reason instanceof Error?reason.message:'Unable to check setup email.')}
    finally{setMailBusy(false)}
  }
  async function retrySelectedDonor(){
    if(!donor||mailBusy)return;setMailBusy(true);setMailMessage('');
    try{await donationApi.retryWelcome(donor.id);setMailMessage('Setup email queued. The donor account and donations have not been duplicated.')}
    catch(reason){setMailMessage(reason instanceof Error?reason.message:'Unable to queue setup email.')}
    finally{setMailBusy(false)}
  }
  const givingSelect=<label className="adm-field"><span>{group==='utsav'?'Giving':'Subcategory / Giving'}</span><select required value={givingId} onChange={e=>chooseGiving(e.target.value)}><option value="">Choose Giving</option>{options.map(row=><option key={row._id} value={row._id}>{row.title}</option>)}</select></label>;
  return <section className="adm-surface offline-entry" aria-labelledby="offline-title">
    <div className="adm-section-heading"><div><h2 id="offline-title">Add Offline Donation</h2><p>Record an in-person donation. New donors can set up their password later.</p></div><button type="button" className="adm-text-button" disabled={busy||uncertain} onClick={close}>Back to donations</button></div>
    {result&&<div className="offline-success" role="status"><strong>Donation saved: {result.donationNumber}</strong><p>{result.donor.setupRequired?'Account setup email is queued or awaiting delivery. The donation is saved.':'Linked to the donor account.'}</p><button type="button" className="adm-text-button" onClick={()=>view(result.id)}>View Donation</button>{result.donor.setupRequired&&<><button type="button" className="adm-text-button" disabled={mailBusy} onClick={()=>void welcome(false)}>Check email status</button><button type="button" className="adm-text-button" disabled={mailBusy} onClick={()=>void welcome(true)}>Retry setup email</button></>}{mailMessage&&<p>{mailMessage}</p>}</div>}
    {catalogLoading?<p role="status">Loading donation choices...</p>:catalogError?<div role="alert"><p>{catalogError}</p><button className="adm-button" onClick={()=>{setCatalogLoading(true);setReload(n=>n+1)}}>Retry loading</button></div>:<form onSubmit={event=>void submit(event)}>
      {error&&<p className="adm-error" role="alert">{error}</p>}{uncertain&&<p role="alert">The save response was interrupted. Retry this same donation below; it will not be recorded twice.</p>}
      <fieldset disabled={busy||uncertain} className="offline-section"><legend>A. Donation Selection</legend>
        <label className="offline-history"><input type="checkbox" checked={historical} onChange={e=>{setHistorical(e.target.checked);setEventId('');resetChoice()}}/>Record a historical scheduled Event donation</label>
        <div className="adm-editor-grid">{historical?<label className="adm-field"><span>Historical Event</span><select required value={eventId} onChange={e=>setEventId(e.target.value)}><option value="">Choose existing Event</option>{events.map(row=><option key={row._id} value={row._id}>{row.title} ({row.status})</option>)}</select></label>:<>
          <label className="adm-field"><span>Category</span><select ref={categorySelect} required value={group} onChange={e=>chooseGroup(e.target.value)}><option value="">Choose category</option>{donationGroups.map(([slug,label])=><option key={slug} value={slug}>{label}</option>)}</select></label>
          {group==='utsav'&&<label className="adm-field"><span>Subcategory / Festival</span><select required value={categoryId} onChange={e=>{setCategoryId(e.target.value);resetChoice()}}><option value="">Choose festival</option>{festivalCategorySlugs.map(slug=>categories.find(row=>row.slug===slug)).filter((row):row is GivingCategoryRecord=>Boolean(row)).map(row=><option key={row._id} value={row._id}>{row.name}</option>)}</select></label>}
          {categoryId&&givingSelect}{categoryId&&options.length===0&&<p>No active Giving options are available in this category.</p>}
        </>}</div>
        {(selected||historical)&&<div className="offline-amount"><label className="adm-field"><span>Donation amount (USD)</span>{!historical&&selected?.amountType==='fixed'?<select required value={values.amount} onChange={e=>change('amount',e.target.value)}><option value="">Choose amount</option>{selected.fixedAmountsCents.map(cents=><option key={cents} value={(cents/100).toFixed(2)}>{donationCurrency(cents)}</option>)}</select>:<input required type="number" min="1" max="10000" step="0.01" inputMode="decimal" value={values.amount} onChange={e=>change('amount',e.target.value)}/>}</label>{!historical&&selected?.amountType==='fixed_and_custom'&&<div className="offline-presets" role="group" aria-label="Suggested amounts">{selected.fixedAmountsCents.map(cents=><button type="button" className="adm-button adm-secondary" key={cents} aria-pressed={values.amount===(cents/100).toFixed(2)} onClick={()=>change('amount',(cents/100).toFixed(2))}>{donationCurrency(cents)}</button>)}</div>}<p>$1 to $10,000. Configured fixed amounts must be used where required.</p></div>}
        {other&&<label className="adm-field"><span>Donation purpose (required)</span><textarea required maxLength={500} rows={3} value={values.purpose} onChange={e=>change('purpose',e.target.value)}/></label>}
      </fieldset>
      <fieldset disabled={busy||uncertain} className="offline-section"><legend>B. Donor Information</legend>
        <label className="adm-field"><span>Search donor email</span><input required type="email" autoComplete="off" value={values.email} onChange={e=>{setDonor(null);setMatches([]);setSearchedEmail('');setSearching(false);setSearchError('');setValues(previous=>({...previous,email:e.target.value,name:'',phone:''}))}}/></label>
        {searching&&<p role="status">Searching donors...</p>}{searchError&&<p role="alert">{searchError} <button type="button" className="adm-text-button" onClick={()=>setReload(n=>n+1)}>Retry search</button></p>}
        {!donor&&matches.length>0&&<ul className="offline-donor-results" aria-label="Matching donors">{matches.map(row=><li key={row.id}><button type="button" onClick={()=>chooseDonor(row)}><strong>{row.name}</strong><span>{row.email}</span></button></li>)}</ul>}
        {donor?<p role="status">Existing donor selected. Saved account details will be used.</p>:normalizedEmail.length>=3&&searchedEmail===normalizedEmail&&!exact&&!searching&&<p role="status">No exact account match. Enter the donor name below; an account will be created when you save. No password is needed here.</p>}
        {donor?.setupRequired&&<div><p>Account setup email: {donor.welcomeEmailStatus||'pending'}. A password can be set up later.</p><button type="button" className="adm-text-button" disabled={mailBusy} onClick={()=>void retrySelectedDonor()}>Retry selected donor setup email</button>{mailMessage&&<p role="status">{mailMessage}</p>}</div>}
        {(donor||(normalizedEmail.length>=3&&searchedEmail===normalizedEmail&&!exact&&!searching))&&<div className="adm-editor-grid"><label className="adm-field"><span>Full name</span><input required maxLength={120} readOnly={!!donor} value={values.name} onChange={e=>change('name',e.target.value)}/></label><label className="adm-field"><span>Phone (optional)</span><input type="tel" maxLength={30} readOnly={!!donor} value={values.phone} onChange={e=>change('phone',e.target.value)}/></label></div>}
      </fieldset>
      <fieldset disabled={busy||uncertain} className="offline-section"><legend>C. Offline Payment</legend><div className="adm-editor-grid">
        <label className="adm-field"><span>Payment method</span><select value={values.method} onChange={e=>change('method',e.target.value)}><option value="cash">Cash</option><option value="check">Check</option><option value="other">Other</option></select></label>
        <label className="adm-field"><span>Verification status</span><select value={values.status} onChange={e=>change('status',e.target.value)}><option value="pending">Pending verification</option><option value="completed">Completed / verified by me</option><option value="rejected">Rejected</option></select></label>
        <label className="adm-field"><span>Reference / check number (optional)</span><input maxLength={200} value={values.reference} onChange={e=>change('reference',e.target.value)}/></label>
        <label className="adm-field"><span>Admin note (optional)</span><textarea maxLength={2000} rows={2} value={values.note} onChange={e=>change('note',e.target.value)}/></label>
      </div></fieldset>
      <div className="adm-modal-actions"><button className="adm-button" disabled={busy}>{busy?'Saving donation...':uncertain?'Retry Same Donation':'Save Donation & Add Next'}</button></div>
    </form>}
  </section>;
}
