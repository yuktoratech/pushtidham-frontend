import { givingOpportunities, type GivingOpportunity } from './giving';
import { allEvents, type TempleEvent } from './events';
import { demoDonations, sampleDonationContact as demoDonor, type DemoDonation } from './account-demo';
import type { DonationCategory } from './donation-selection';
import { parseCustomAmount, parseFixedAmounts } from './donation-selection';
import { centsToUsdInput } from './money';
export type AdminGiving = GivingOpportunity & { active: boolean };
export type AdminDonation = Omit<DemoDonation,'method'> & { method:DemoDonation['method']|'Cash'|'Check'|'Other'; donor: string; email: string; phone: string; givingSlug?: string; category: DonationCategory; eventId?:string; source?:'online'|'offline'; adminNote?:string; eventSlug?: string; eventTitle?: string; transactionReference?: string };
export type AdminState = { giving: AdminGiving[]; events: TempleEvent[]; donations: AdminDonation[] };
export const adminStorageKey = 'pushthidham-admin-demo-v1';
export const adminImages = [...new Set(givingOpportunities.map(item=>item.image))];
const donorName = `${demoDonor.firstName} ${demoDonor.lastName}`;
const initialDonations: AdminDonation[] = demoDonations.map(item=>{const giving=givingOpportunities.find(g=>g.title===item.givingFor)!;return {...item,donor:donorName,email:demoDonor.email,phone:demoDonor.phone,givingSlug:giving.slug,category:'General',...(item.givingFor==='Festival Sponsorship'?{eventSlug:'janmashtami-celebration-2025',eventTitle:'Janmashtami Celebration'}:{}),...(item.method==='Bank Transfer'?{transactionReference:`DEMO-BANK-${item.reference.slice(-4)}`}:{})};});
export function createAdminState():AdminState{return {giving:givingOpportunities.map(g=>({...g,suggestedAmounts:[...g.suggestedAmounts],active:true})),events:allEvents.map(e=>({...e,schedule:e.schedule.map(s=>({...s}))})),donations:([...initialDonations,
{reference:'PH-2026-1005-1208',date:'2026-10-05',givingFor:'Annakut Mahotsav',givingSlug:'annakut-mahotsav',category:'General',donor:'Rohan Patel',email:'rohan.patel@example.com',phone:'',amountCents:50100,method:'Bank Transfer',status:'Pending',eventSlug:'annakut-mahotsav-2026',eventTitle:'Annakut Mahotsav',transactionReference:'DEMO-BANK-1208'},
{reference:'PH-2026-1004-1196',date:'2026-10-04',givingFor:'Community & Religious Activities',givingSlug:'community-religious-activities',category:'General',donor:'Meera Desai',email:'meera.desai@example.com',phone:'',amountCents:25100,method:'PayPal',status:'Completed'},
{reference:'PH-2026-1002-1181',date:'2026-10-02',givingFor:'Temple Seva',givingSlug:'temple-seva',category:'General',donor:'Arjun Shah',email:'arjun.shah@example.com',phone:'',amountCents:10100,method:'Bank Transfer',status:'Pending',transactionReference:'DEMO-BANK-1181'},
{reference:'PH-2026-0929-1145',date:'2026-09-29',givingFor:'Prasad Seva',givingSlug:'prasad-seva',category:'General',donor:'Nisha Patel',email:'nisha.patel@example.com',phone:'',amountCents:5100,method:'Bank Transfer',status:'Rejected',transactionReference:'DEMO-BANK-1145'}] as AdminDonation[]).map(d=>normalizeDonation(d,allEvents))};}
export function donationTotals(rows:AdminDonation[]){const sum=(status?:string)=>rows.filter(d=>!status||d.status===status).reduce((n,d)=>n+d.amountCents,0);return {total:sum(),completed:sum('Completed'),pending:sum('Pending'),donors:new Set(rows.map(d=>d.email)).size};}
export type DonationFilters={search:string;status:string;method:string;category:string;source:string;from:string;to:string};
export const emptyDonationFilters:DonationFilters={search:'',status:'All',method:'All',category:'All',source:'All',from:'',to:''};
export function filterDonations(rows:AdminDonation[],f:DonationFilters){return rows.filter(d=>(f.status==='All'||d.status===f.status)&&(f.method==='All'||d.method===f.method)&&(f.category==='All'||d.category===f.category)&&(!f.source||f.source==='All'||(d.source==='offline'?'Offline / Manual':'Online')===f.source)&&(!f.from||d.date>=f.from)&&(!f.to||d.date<=f.to)&&`${d.reference} ${d.donor} ${d.email} ${d.givingFor} ${d.eventTitle||''} ${d.transactionReference||''} ${d.source==='offline'?'offline manual':'online'}`.toLowerCase().includes(f.search.trim().toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date));}
export function donationCsv(rows:AdminDonation[]){const quote=(v:string|number)=>{const text=String(v);return '"'+(/^[=+@\-\t\r]/.test(text)?"'":'')+text.replaceAll('"','""')+'"';};return [['Reference','Donor','Email','Phone','Category','Donation For','Event','Amount USD','Payment Method','Payment Reference','Date','Status','Source','Admin Note','Giving ID','Event ID'],...rows.map(d=>[d.reference,d.donor,d.email,d.phone,d.category,d.givingFor,d.eventTitle||'',centsToUsdInput(d.amountCents),d.method,d.transactionReference||'',d.date,d.status,d.source==='offline'?'Offline / Manual':'Online',d.adminNote||'',d.givingSlug||'',d.eventId||d.eventSlug||''])].map(row=>row.map(quote).join(',')).join('\r\n');}

// Drop obsolete category records while retaining browser edits and donation history.
export function normalizeDonation(record:AdminDonation,events:TempleEvent[]):AdminDonation {
  const copy={...record} as AdminDonation & {categorySlug?:string};delete copy.categorySlug;
  if(record.category==='Event'||record.eventSlug){
    const event=events.find(e=>e.slug===record.eventSlug||e.id===record.eventId);
    delete copy.givingSlug;
    return {...copy,category:'Event',givingFor:event?.title||record.eventTitle||record.givingFor,eventTitle:event?.title||record.eventTitle||record.givingFor,eventSlug:event?.slug||record.eventSlug,eventId:event?.id||record.eventId};
  }
  delete copy.eventSlug;delete copy.eventTitle;delete copy.eventId;
  return {...copy,category:'General'};
}
export function normalizeAdminState(value:unknown):AdminState {
  const defaults=createAdminState();
  if(!value||typeof value!=='object')return defaults;
  const stored=value as Partial<AdminState>;
  if(!Array.isArray(stored.giving)||!Array.isArray(stored.events)||!Array.isArray(stored.donations))return defaults;
  const giving=stored.giving.filter(g=>g&&typeof g.slug==='string'&&typeof g.title==='string').map(g=>{
    const copy={...g} as AdminGiving & {category?:string;categorySlug?:string};delete copy.category;delete copy.categorySlug;
    const amountType=g.amountType==='fixed'||g.amountType==='custom'?g.amountType:'fixed-custom';
    const seed=givingOpportunities.find(item=>item.slug===g.slug)||givingOpportunities[0];
    const amounts=parseFixedAmounts((Array.isArray(g.suggestedAmounts)?g.suggestedAmounts:seed.suggestedAmounts).join(','),amountType);
    return {...seed,...copy,amountType,suggestedAmounts:amounts.error?[...seed.suggestedAmounts]:amounts.amounts,active:g.active!==false} as AdminGiving;
  });
  const donations=stored.donations.filter(d=>d&&typeof d.reference==='string').map(d=>normalizeDonation({...d,source:d.source==='offline'?'offline':'online'},stored.events!));
  return {giving,events:stored.events,donations};
}

export const offlineMethods=['Cash','Check','Bank Transfer','PayPal','Other'] as const;
export type OfflineDonationValues={donor:string;email:string;phone:string;category:DonationCategory;givingSlug:string;eventSlug:string;amount:string;method:string;transactionReference:string;date:string;status:string;adminNote:string};
export function localDonationDate(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validateOfflineDonation(state:AdminState,values:OfflineDonationValues,today=localDonationDate()){
  const errors:Partial<Record<keyof OfflineDonationValues,string>>={};
  if(!values.donor.trim())errors.donor='Enter the donor name.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))errors.email='Enter a valid donor email address.';
  if(!['General','Event'].includes(values.category))errors.category='Choose General or Event.';
  if(values.category==='General'&&!state.giving.some(g=>g.slug===values.givingSlug&&g.active))errors.givingSlug='Choose an active giving item.';
  if(values.category==='Event'&&!state.events.some(e=>e.slug===values.eventSlug))errors.eventSlug='Choose an available event.';
  const amount=parseCustomAmount(values.amount);
  if(amount.error)errors.amount=amount.error;
  if(!offlineMethods.some(method=>method===values.method))errors.method='Choose a payment method.';
  if(values.method!=='Cash'&&!values.transactionReference.trim())errors.transactionReference='Enter a payment or bank reference number.';
  const parsedDate=new Date(`${values.date}T12:00:00Z`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(values.date)||!Number.isFinite(parsedDate.getTime())||parsedDate.toISOString().slice(0,10)!==values.date||values.date>today)errors.date='Choose a valid donation date on or before today.';
  if(!['Pending','Completed','Rejected'].includes(values.status))errors.status='Choose a donation status.';
  return errors;
}
export function createOfflineDonation(state:AdminState,values:OfflineDonationValues,reference:string):AdminDonation {
  const errors=validateOfflineDonation(state,values);
  if(Object.keys(errors).length)throw new Error('Correct the offline donation fields before saving.');
  if(state.donations.some(d=>d.reference===reference))throw new Error('Donation reference is already in use.');
  const giving=values.category==='General'?state.giving.find(g=>g.slug===values.givingSlug):undefined;
  const event=values.category==='Event'?state.events.find(e=>e.slug===values.eventSlug):undefined;
  return {reference,date:values.date,donor:values.donor.trim(),email:values.email.trim(),phone:values.phone.trim(),category:values.category,givingFor:(event?.title||giving?.title)!,...(giving?{givingSlug:giving.slug}:{}),amountCents:parseCustomAmount(values.amount).cents!,method:values.method as AdminDonation['method'],status:values.status as AdminDonation['status'],source:'offline',transactionReference:values.transactionReference.trim(),adminNote:values.adminNote.trim(),...(event?{eventSlug:event.slug,eventId:event.id,eventTitle:event.title}:{})};
}
