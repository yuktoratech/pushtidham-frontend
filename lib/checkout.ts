import { getGivingOpportunity } from './giving';
import { getEvent } from './events';
import { donationQuery, type DonationSelection } from './donation-selection';
import type { DemoDonor } from './account-demo';

export type PaymentMethod = 'paypal' | 'bank-transfer';
export type CheckoutDraft = {donor:DemoDonor;method:PaymentMethod;transactionReference:string;donorMode:'guest'|'demo'};
export const checkoutDraftKey='pushthidham-checkout-draft';
export const emptyDonor:DemoDonor={firstName:'',lastName:'',email:'',phone:''};
export const bankTransferPreview={bankName:'To be provided by temple',accountName:'To be provided by temple',accountNumber:'To be provided',routingNumber:'To be provided',demoReference:'PHD-DEMO-001'};
export function readDonationSelection(query:URLSearchParams):DonationSelection|null{
  const opportunity=getGivingOpportunity(query.get('giving')||'');
  const amount=Number(query.get('amount'));
  if(!opportunity||!Number.isSafeInteger(amount)||amount<=0||query.get('type')!=='one-time')return null;
  const rawChoice=query.get('choice');
  const amountChoice=rawChoice==='custom'?'custom':Number(rawChoice);
  if(amountChoice!=='custom'&&(!opportunity.suggestedAmounts.includes(amountChoice)||amountChoice*100!==amount))return null;
  const rawEvent=query.get('event');
  const event=rawEvent?getEvent(rawEvent):null;
  if(rawEvent&&!event)return null;
  return {givingSlug:opportunity.slug,amountCents:amount,currency:'USD',donationType:'one-time',amountChoice,...(event?{eventSlug:event.slug,eventId:event.id}:{})};
}
export function editDonationPath(selection:DonationSelection){return `/giving/${selection.givingSlug}?${donationQuery(selection)}`;}
export function validateCheckout(donor:DemoDonor,method:PaymentMethod,reference:string){
  const errors:Partial<Record<keyof DemoDonor|'transactionReference',string>>={};
  if(!donor.firstName.trim())errors.firstName='Please enter your first name.';
  if(!donor.lastName.trim())errors.lastName='Please enter your last name.';
  if(!donor.email.trim())errors.email='Please enter your email address.';
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor.email.trim()))errors.email='Please enter a valid email address.';
  if(method==='bank-transfer'&&!reference.trim())errors.transactionReference='Please enter a transaction reference or confirmation number.';
  return errors;
}
