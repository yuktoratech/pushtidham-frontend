import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('checkout offers one secure card path while preserving donation context',async()=>{
 const [checkout,api,state]=await Promise.all([read('components/checkout.tsx'),read('lib/api-client.ts'),read('lib/checkout.ts')]);
 assert.match(checkout,/Credit \/ Debit Card/);
 assert.match(checkout,/Continue to Secure Card Payment/);
 assert.match(checkout,/paymentApi\.stripe/);
 assert.match(checkout,/methodFamily:'card'/);
 assert.match(checkout,/selection\.donationPurpose/);
 assert.match(checkout,/coverFees/);
 assert.match(checkout,/sessionStorage\.setItem\(pendingPaymentKey/);
 assert.match(api,/payments\/stripe\/checkout-sessions/);
 for(const source of [checkout,api,state]) assert.doesNotMatch(source,/paypalOrder|paypalCapture|bank-transfer|methodFamily:"ach"/);
 assert.doesNotMatch(checkout,/US Bank Account|Legacy Bank Transfer|payment method selector/i);
});

test('confirmation uses backend status and never displays an invented success',async()=>{
 const source=await read('components/donation-confirmation.tsx');
 assert.match(source,/paymentApi\.status/);
 assert.match(source,/readPendingPayment/);
 assert.doesNotMatch(source,/paypalCapture|Bank Transfer Pending|ACH verification/);
 assert.match(source,/completed=status==='succeeded'/);
});
