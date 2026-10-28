import { PageLink } from './page-link';

// Temporary frontend presentation gate; provider configuration is unchanged.
// Keep enabled until payment testing and explicit approval are complete.
export const clientDemoPaymentsDeferred = process.env.NEXT_PUBLIC_CLIENT_DEMO !== 'false';

export function PaymentDemoNotice() {
  return <div className="checkout-demo-note" role="note"><strong>Online payments are currently unavailable for this client demo.</strong><p>You can explore donation options and amounts. No payment will be processed and no donation record or receipt will be created by this preview.</p></div>;
}

export function PaymentDemoPage() {
  return <div className="container checkout-empty"><h1>Online Payments Unavailable</h1><PaymentDemoNotice/><PageLink className="button" href="/donate">Explore Donation Options</PageLink></div>;
}
