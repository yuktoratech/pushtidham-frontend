import type { GivingOpportunity, TempleEvent } from './catalog-ui';
import { donationQuery, amountMatchesOpportunity, type DonationSelection } from './donation-selection';
import type { DemoDonor } from './account-demo';

export type PaymentMethod = 'card' | 'ach' | 'paypal' | 'venmo' | 'bank-transfer';
export type CheckoutDraft = {donor:DemoDonor;method:PaymentMethod;transactionReference:string;donorMode:'guest'|'demo'};
export const checkoutDraftKey='pushthidham-checkout-draft';
export const pendingPaymentKey='pushthidham-pending-payment';
export type PendingPayment={attemptId:string;statusToken?:string;provider:'stripe'|'paypal';orderId?:string;createdAt:number;captureState?:'not_requested'|'requested'|'resolved'|'uncertain'};
export function savePendingPayment(value:PendingPayment){sessionStorage.setItem(pendingPaymentKey,JSON.stringify(value));}
export function readPendingPayment(){try{return JSON.parse(sessionStorage.getItem(pendingPaymentKey)||'null') as PendingPayment|null}catch{return null}}
export function newIdempotencyKey(){return `checkout-${crypto.randomUUID()}`;}
export const emptyDonor:DemoDonor={firstName:'',lastName:'',email:'',phone:''};
export const bankTransferPreview={bankName:'To be provided by temple',accountName:'To be provided by temple',accountNumber:'To be provided',routingNumber:'To be provided',demoReference:'PHD-DEMO-001'};
export type DonationCatalog={giving:(GivingOpportunity & {active?:boolean})[];events:TempleEvent[]};
export function readDonationSelection(query:URLSearchParams,catalog:DonationCatalog):DonationSelection|null{
  const amount=Number(query.get('amount'));
  if(!Number.isSafeInteger(amount)||amount<=0||query.get('type')!=='one-time')return null;
  const rawChoice=query.get('choice');
  const amountChoice=rawChoice==='custom'?'custom':Number(rawChoice);
  const eventCategory=query.get('category')==='event'||(query.get('category')!=='general'&&query.has('event'));
  if(eventCategory){
    const event=catalog.events.find(e=>e.slug===query.get('event'));
    if(!event||amountChoice!=='custom')return null;
    return {categorySlug:'event',eventSlug:event.slug,eventId:event.id,amountCents:amount,currency:'USD',donationType:'one-time',amountChoice};
  }
  if(query.has('event'))return null;
  const opportunity=catalog.giving.find(item=>item.slug===query.get('giving')&&item.status==='active');
  if(!opportunity||!amountMatchesOpportunity(opportunity,amountChoice,amount))return null;
  return {categorySlug:'general',givingSlug:opportunity.slug,amountCents:amount,currency:'USD',donationType:'one-time',amountChoice};
}
export function donationContext(selection:DonationSelection,catalog:DonationCatalog){
  if(selection.categorySlug==='event'){
    const event=catalog.events.find(e=>e.slug===selection.eventSlug)!;
    return {...event,category:'Event' as const,event};
  }
  const giving=catalog.giving.find(g=>g.slug===selection.givingSlug)!;
  return {...giving,id:giving._id,category:'General' as const,event:undefined};
}

export function editDonationPath(selection:DonationSelection){return `/donate?${donationQuery(selection)}`;}
export function validateCheckout(donor:DemoDonor,method:PaymentMethod,reference:string){
  const errors:Partial<Record<keyof DemoDonor|'transactionReference',string>>={};
  if(!donor.firstName.trim())errors.firstName='Please enter your first name.';
  if(!donor.lastName.trim())errors.lastName='Please enter your last name.';
  if(!donor.email.trim())errors.email='Please enter your email address.';
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor.email.trim()))errors.email='Please enter a valid email address.';
  if(method==='bank-transfer'&&!reference.trim())errors.transactionReference='Please enter a transaction reference or confirmation number.';
  return errors;
}
