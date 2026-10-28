'use client';
import {clientDemoPaymentsDeferred,PaymentDemoPage} from './payment-demo-notice';
import {useCallback,useEffect,useState} from 'react';
import {Check,Clock3,Info,XCircle} from 'lucide-react';
import {PageLink} from './page-link';
import {paymentApi,type PaymentAttemptStatus} from '../lib/api-client';
import {readPendingPayment,type PendingPayment} from '../lib/checkout';
import {donationCurrency} from '../lib/donation-selection';
import {useAuth} from './auth-provider';

function IntegratedDonationConfirmation(){
 const auth=useAuth();
 const [context,setContext]=useState<PendingPayment|null>(null);
 const [status,setStatus]=useState<PaymentAttemptStatus|null>(null);
 const [amount,setAmount]=useState<number|null>(null);
 const [error,setError]=useState('');
 const [checking,setChecking]=useState(true);
 const refresh=useCallback(async(value:PendingPayment)=>{
  setChecking(true);setError('');
  try{
   const result=await paymentApi.status(value.attemptId,value.statusToken);
   setStatus(result.status);setAmount(result.totalChargeCents);
  }catch(e){setError(e instanceof Error?e.message:'Unable to check payment status.')}
  finally{setChecking(false)}
 },[]);
 useEffect(()=>{
  if(auth.status==='initializing')return;
  const value=readPendingPayment();
  let active=true;
  queueMicrotask(()=>{
   if(!active)return;
   if(!value||value.provider!=='stripe'){
    setError('This browser no longer has access to the pending card payment status.');
    setChecking(false);return;
   }
   setContext(value);void refresh(value);
  });
  return()=>{active=false};
 },[refresh,auth.status]);
 useEffect(()=>{
  if(!context||!['created','requires_action','verification_pending','processing'].includes(status||''))return;
  let count=0;
  const timer=setInterval(()=>{if(++count>=8){clearInterval(timer);return}void refresh(context)},5000);
  return()=>clearInterval(timer);
 },[context,status,refresh]);
 const completed=status==='succeeded',failed=status==='failed'||status==='canceled',waiting=!completed&&!failed;
 return <div className="donation-confirmation-page"><section className="donation-confirmation-card" aria-live="polite">
  <div className={`donation-confirmation-icon ${waiting?'is-pending':''}`}>{completed?<Check/>:failed?<XCircle/>:<Clock3/>}</div>
  <p className="eyebrow">Backend-verified card payment status</p>
  <span className={`donation-confirmation-status ${waiting?'is-pending':''}`}>{checking?'Checking…':status||'Unavailable'}</span>
  <h1>{completed?'Thank You':failed?'Payment Not Completed':error&&!status?'Payment Status Unavailable':'Payment Pending'}</h1>
  <p className="donation-confirmation-intro">{completed?'Your card payment was confirmed by Stripe.':failed?'Your card payment was not completed. You may return to checkout and try again.':error&&!status?'We could not retrieve your payment status. This does not mean your payment failed. Please do not pay again.':'Your card payment is being verified. Please check again shortly.'}</p>
  {context?.donationPurpose&&<p className="donation-purpose-text"><strong>Donation purpose:</strong> {context.donationPurpose}</p>}
  {amount!==null&&<div className="donation-confirmation-amount"><small>Total charged · USD</small><strong>{donationCurrency(amount)}</strong></div>}
  {error&&<p className="donation-confirmation-note" role="alert"><Info/><span>{error}</span></p>}
  <div className="donation-confirmation-actions">{context&&<button className="button" disabled={checking} onClick={()=>void refresh(context)}>Refresh Status</button>}<PageLink className="button donation-return-home" href="/">Return Home</PageLink></div>
 </section></div>;
}
export function DonationConfirmation(){return clientDemoPaymentsDeferred?<PaymentDemoPage/>:<IntegratedDonationConfirmation/>;}
