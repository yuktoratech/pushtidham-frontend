'use client';
import {createElement,useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {paymentApi,type PaymentStart} from '../lib/api-client';
import {readPendingPayment,savePendingPayment} from '../lib/checkout';
import {eligibleFunding,loadPayPalSdk,type PayPalFundingSource,type PayPalSession,type PayPalSessionError} from '../lib/paypal-sdk';

const captures=new Map<string,Promise<void>>();
const finalStatuses=new Set(['succeeded','failed','canceled','processing','verification_pending']);

export async function captureApprovedOrder(orderId:string,navigate:()=>void){
 const stored=readPendingPayment();
 if(!stored||stored.provider!=='paypal'||stored.orderId!==orderId)throw new Error('The approved PayPal order does not match this browser checkout.');
 const existing=captures.get(orderId);if(existing)return existing;
 const task=(async()=>{
  try{
   const status=await paymentApi.status(stored.attemptId,stored.statusToken);
   if(finalStatuses.has(status.status)){savePendingPayment({...stored,captureState:'resolved'});navigate();return}
   const pending={...stored,captureState:'requested' as const};savePendingPayment(pending);
   await paymentApi.paypalCapture(orderId,stored.statusToken);
   savePendingPayment({...pending,captureState:'resolved'});
  }catch{
   savePendingPayment({...stored,captureState:'uncertain'});
  }
  navigate();
 })().finally(()=>captures.delete(orderId));
 captures.set(orderId,task);return task;
}

type Props={clientId:string;environment:'sandbox'|'live';venmoEnabled:boolean;amountCents:number;createOrder:()=>Promise<PaymentStart>;onBusy:(busy:boolean)=>void;onMessage:(message:string)=>void};
export function PayPalWallet({clientId,environment,venmoEnabled,amountCents,createOrder,onBusy,onMessage}:Props){
 const router=useRouter(),orderPromise=useRef<Promise<PaymentStart>|null>(null),latest=useRef({createOrder,onBusy,onMessage});
 const [loading,setLoading]=useState(true),[funding,setFunding]=useState<PayPalFundingSource[]>([]),[sessions,setSessions]=useState<Partial<Record<PayPalFundingSource,PayPalSession>>>({}),[paypalButton,setPaypalButton]=useState<HTMLElement|null>(null),[venmoButton,setVenmoButton]=useState<HTMLElement|null>(null);
 useEffect(()=>{latest.current={createOrder,onBusy,onMessage}},[createOrder,onBusy,onMessage]);
 const getOrder=()=>{if(!orderPromise.current)orderPromise.current=latest.current.createOrder().then(result=>{if(!result.orderId)throw new Error('PayPal did not return an order ID.');savePendingPayment({attemptId:result.attemptId,statusToken:result.statusToken,provider:'paypal',orderId:result.orderId,createdAt:Date.now(),captureState:'not_requested'});return result}).catch(error=>{orderPromise.current=null;throw error});return orderPromise.current};
 useEffect(()=>{let active=true;loadPayPalSdk(clientId,environment,venmoEnabled).then(async sdk=>{const eligible=await sdk.findEligibleMethods({currencyCode:'USD',amount:(amountCents/100).toFixed(2)});if(!active)return;const available=eligibleFunding(eligible.isEligible('paypal'),venmoEnabled,eligible.isEligible('venmo'));const options={onApprove:async({orderId}:{orderId:string})=>captureApprovedOrder(orderId,()=>router.push('/donation-confirmation')),onCancel:()=>{orderPromise.current=null;latest.current.onBusy(false);latest.current.onMessage('PayPal checkout was canceled. Your donation was not completed.')},onError:(error:PayPalSessionError)=>{latest.current.onBusy(false);latest.current.onMessage(error.message||'PayPal checkout could not be completed. Your payment status may still be pending verification.')}};setFunding(available);setSessions({paypal:available.includes('paypal')?sdk.createPayPalOneTimePaymentSession(options):undefined,venmo:available.includes('venmo')?sdk.createVenmoOneTimePaymentSession(options):undefined});setLoading(false)}).catch(error=>{if(active){setLoading(false);latest.current.onMessage(error instanceof Error?error.message:'PayPal checkout could not be loaded.')}});return()=>{active=false}},[clientId,environment,venmoEnabled,amountCents,router]);
 useEffect(()=>{const listeners:Array<[HTMLElement,EventListener]>=[];for(const [source,element] of [['paypal',paypalButton],['venmo',venmoButton]] as const){const session=sessions[source];if(!element||!session)continue;const listener:EventListener=()=>{latest.current.onBusy(true);latest.current.onMessage('');void session.start({presentationMode:'auto'},getOrder().then(({orderId})=>({orderId:orderId!}))).catch(error=>{latest.current.onBusy(false);latest.current.onMessage(error instanceof Error?error.message:'The payment window was closed. You can try again safely.')})};element.addEventListener('click',listener);listeners.push([element,listener])}return()=>listeners.forEach(([element,listener])=>element.removeEventListener('click',listener))},[sessions,paypalButton,venmoButton]);
 const redirect=async()=>{latest.current.onBusy(true);latest.current.onMessage('');try{const result=await getOrder();if(!result.approvalUrl)throw new Error('PayPal redirect is unavailable.');location.assign(result.approvalUrl)}catch(error){latest.current.onBusy(false);latest.current.onMessage(error instanceof Error?error.message:'Unable to start PayPal checkout.')}};
 if(loading)return <p className="checkout-paypal-state" role="status">Loading secure PayPal options…</p>;
 if(!funding.length)return <div className="checkout-paypal-state" role="alert">PayPal Wallet is not available for this checkout. Please choose another payment method.</div>;
 return <div className="checkout-paypal-buttons"><p className="sr-only">Eligible PayPal payment options</p>{funding.includes('paypal')&&createElement('paypal-button',{ref:(node:Element|null)=>setPaypalButton(node as HTMLElement|null),type:'pay','aria-label':'Pay with PayPal'})}{funding.includes('venmo')&&createElement('venmo-button',{ref:(node:Element|null)=>setVenmoButton(node as HTMLElement|null),type:'pay','aria-label':'Pay with Venmo'})}<button type="button" className="checkout-paypal-fallback" onClick={()=>void redirect()}>Having trouble? Continue on the PayPal site</button></div>;
}
