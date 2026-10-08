import { centsToUsd, formatUsd, parseUsdToCents } from './money';
import type { DonationAmountType, GivingOpportunity } from './catalog-ui';

export type DonationCategory = 'General' | 'Event';
export type DonationSelection = {
  amountCents: number;
  currency: 'USD';
  donationType: 'one-time';
  amountChoice: number | 'custom';
} & ({categorySlug:'general';givingSlug:string;eventSlug?:never;eventId?:never} | {categorySlug:'event';eventSlug:string;eventId:string;givingSlug?:never});
export const donationSelectionKey = 'pushthidham-donation-selection';
export function parseCustomAmount(value:string):{cents:number|null;error:string|null}{
  return parseUsdToCents(value);
}
export function donationCurrency(cents:number){return formatUsd(cents);}
export function donationQuery(selection:DonationSelection){
  const query=new URLSearchParams({category:selection.categorySlug,amount:String(selection.amountCents),choice:String(selection.amountChoice),type:selection.donationType});
  if(selection.givingSlug&&!selection.eventSlug)query.set('giving',selection.givingSlug);
  if(selection.eventSlug)query.set('event',selection.eventSlug);
  return query.toString();
}
export function checkoutPath(selection:DonationSelection){return `/checkout?${donationQuery(selection)}`;}

export function donatePath(givingSlug='general-donation'){
  const query=new URLSearchParams({category:'general',giving:givingSlug});
  return `/donate?${query}`;
}
export function eventDonationPath(eventSlug:string){return `/donate?${new URLSearchParams({category:'event',event:eventSlug})}`;}
export function allowsFixed(type:DonationAmountType){return type!=='custom';}
export function allowsCustom(type:DonationAmountType){return type!=='fixed';}
export function parseFixedAmounts(value:string,type:DonationAmountType){
  if(type==='custom')return {amounts:[] as number[],error:null};
  const parsed=value.split(',').map(part=>parseCustomAmount(part));
  if(parsed.some(part=>part.cents===null))return {amounts:[] as number[],error:'Enter positive USD amounts, separated by commas, with up to two decimal places.'};
  const cents=parsed.map(part=>part.cents!);
  if(new Set(cents).size!==cents.length)return {amounts:[] as number[],error:'Each fixed amount must be unique.'};
  return {amounts:cents.map(centsToUsd),error:null};
}
export function amountMatchesOpportunity(opportunity:Pick<GivingOpportunity,'amountTypeUi'|'suggestedAmounts'>,choice:number|'custom',cents:number){
  if(!Number.isSafeInteger(cents)||cents<=0)return false;
  if(choice==='custom')return allowsCustom(opportunity.amountTypeUi);
  return allowsFixed(opportunity.amountTypeUi)&&opportunity.suggestedAmounts.includes(choice)&&parseCustomAmount(String(choice)).cents===cents;
}
