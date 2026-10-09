export type PayPalFundingSource = 'paypal' | 'venmo';
export type PayPalSessionData = { orderId: string };
export type PayPalSessionError = { code?: string; message?: string };
export type PayPalSession = {
  start(options: { presentationMode: 'auto' }, order: Promise<{ orderId: string }>): Promise<void>;
};
export type PayPalSdk = {
  findEligibleMethods(options: { currencyCode: 'USD'; amount: string }): Promise<{ isEligible(method: PayPalFundingSource): boolean }>;
  createPayPalOneTimePaymentSession(options: PayPalSessionOptions): PayPalSession;
  createVenmoOneTimePaymentSession(options: PayPalSessionOptions): PayPalSession;
};
export type PayPalSessionOptions = {
  onApprove(data: PayPalSessionData): Promise<void>;
  onCancel(data: Partial<PayPalSessionData>): void;
  onError(error: PayPalSessionError): void;
};
type PayPalGlobal = { createInstance(options: { clientId: string; components: string[]; pageType: 'checkout' }): Promise<PayPalSdk> };

declare global { interface Window { paypal?: PayPalGlobal; isBrowserSupportedByPayPal?: () => boolean } }

const loads = new Map<string, Promise<PayPalSdk>>();
export function paypalSdkUrl(environment: 'sandbox'|'live') {
  return environment === 'sandbox' ? 'https://www.sandbox.paypal.com/web-sdk/v6/core' : 'https://www.paypal.com/web-sdk/v6/core';
}
export function eligibleFunding(paypal:boolean, venmoConfigured:boolean, venmoEligible:boolean):PayPalFundingSource[]{
  return [...(paypal?['paypal' as const]:[]),...(venmoConfigured&&venmoEligible?['venmo' as const]:[])];
}
export function loadPayPalSdk(clientId:string,environment:'sandbox'|'live',venmo:boolean):Promise<PayPalSdk>{
  if(!clientId.trim())return Promise.reject(new Error('PayPal public client ID is not configured.'));
  const key=`${environment}:${clientId}:${venmo}`;
  const existing=loads.get(key);if(existing)return existing;
  const loading=new Promise<PayPalSdk>((resolve,reject)=>{
    if(window.isBrowserSupportedByPayPal?.()===false){reject(new Error('This browser does not support PayPal checkout.'));return}
    const initialize=()=>window.paypal?.createInstance({clientId,components:venmo?['paypal-payments','venmo-payments']:['paypal-payments'],pageType:'checkout'}).then(resolve,reject)??reject(new Error('PayPal SDK did not initialize.'));
    if(window.paypal?.createInstance){initialize();return}
    let script=document.querySelector<HTMLScriptElement>('script[data-pushtidham-paypal-sdk]');
    if(!script){script=document.createElement('script');script.async=true;script.src=paypalSdkUrl(environment);script.dataset.pushtidhamPaypalSdk='true';document.head.appendChild(script)}
    script.addEventListener('load',initialize,{once:true});script.addEventListener('error',()=>reject(new Error('PayPal checkout could not be loaded. Use another payment method or try again.')),{once:true});
  });
  loads.set(key,loading);loading.catch(()=>loads.delete(key));return loading;
}
