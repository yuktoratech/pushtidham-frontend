export type DemoDonor = {firstName:string;lastName:string;email:string;phone:string};
// Contact attached only to shared sample donation records; never an authenticated identity.
export const sampleDonationDonorEmail = 'donor@pushthidham.org';
export const sampleDonationContact = {firstName:'Priya',lastName:'Shah',email:sampleDonationDonorEmail,phone:'(352) 555-0148'};
export type DemoDonationStatus = 'Pending' | 'Completed' | 'Rejected';
export type DemoDonationMethod = 'PayPal' | 'Bank Transfer';
export type DemoDonation = {
  reference: string;
  date: string;
  givingFor: string;
  amountCents: number;
  method: DemoDonationMethod;
  status: DemoDonationStatus;
};
export const demoDonations: DemoDonation[] = [
  {reference:'PH-2026-0918-1042',date:'2026-09-18',givingFor:'General Donation',amountCents:10100,method:'PayPal',status:'Completed'},
  {reference:'PH-2026-0901-0876',date:'2026-09-01',givingFor:'Temple Seva',amountCents:5100,method:'Bank Transfer',status:'Pending'},
  {reference:'PH-2026-0815-0741',date:'2026-08-15',givingFor:'Festival Sponsorship',amountCents:25100,method:'Bank Transfer',status:'Completed'},
  {reference:'PH-2026-0731-0614',date:'2026-07-31',givingFor:'Prasad Seva',amountCents:2500,method:'PayPal',status:'Rejected'},
  {reference:'PH-2026-0625-0489',date:'2026-06-25',givingFor:'Annakut Mahotsav',amountCents:10100,method:'PayPal',status:'Completed'},
];
export function formatDonationAmount(amountCents:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amountCents/100);}
export function formatDonationDate(date:string){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));}
export const demoCompletedDonations = demoDonations.filter(donation=>donation.status==='Completed');
export const demoTotalGivenCents = demoCompletedDonations.reduce((sum,donation)=>sum+donation.amountCents,0);
