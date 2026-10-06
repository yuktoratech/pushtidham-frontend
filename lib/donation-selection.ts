export type DonationSelection = {
  givingSlug: string;
  amountCents: number;
  currency: 'USD';
  donationType: 'one-time';
  amountChoice: number | 'custom';
  eventSlug?: string;
  eventId?: string;
};
export const donationSelectionKey = 'pushthidham-donation-selection';
export function parseCustomAmount(value:string):{cents:number|null;error:string|null}{
  if(!value.trim()) return {cents:null,error:'Enter your donation amount in USD.'};
  if(/^[-+]/.test(value.trim())) return {cents:null,error:'Enter an amount greater than $0, without a sign.'};
  if(!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return {cents:null,error:'Use numbers with up to two decimal places.'};
  const [whole,decimal=''] = value.trim().split('.');
  const cents=Number(whole)*100+Number(decimal.padEnd(2,'0'));
  if(!Number.isSafeInteger(cents)) return {cents:null,error:'Enter a valid USD amount.'};
  if(cents<=0) return {cents:null,error:'Enter an amount greater than $0.'};
  return {cents,error:null};
}
export function donationCurrency(cents:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);}
export function donationQuery(selection:DonationSelection){
  const query=new URLSearchParams({giving:selection.givingSlug,amount:String(selection.amountCents),choice:String(selection.amountChoice),type:selection.donationType});
  if(selection.eventSlug)query.set('event',selection.eventSlug);
  return query.toString();
}
export function checkoutPath(selection:DonationSelection){return `/checkout?${donationQuery(selection)}`;}
