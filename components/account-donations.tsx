'use client';
/* eslint-disable react-hooks/set-state-in-effect -- initial authenticated history is loaded after mount. */
import {useEffect, useState} from 'react';
import {FileText} from 'lucide-react';
import {donationApi, type DonationRecord} from '../lib/api-client';
import {formatDonationAmount} from '../lib/account-demo';

const labels: Record<string, string> = {succeeded: 'Completed', created: 'Pending', requires_action: 'Pending', verification_pending: 'Pending', verified_online: 'Online', legacy_online: 'Online', verification_required: 'Pending', partially_refunded: 'Partially refunded', ach: 'ACH Direct Debit', card: 'Card / Wallet', paypal: 'PayPal', venmo: 'Venmo', bank_transfer: 'Bank Transfer', offline: 'Offline'};
export function donationStatusLabel(value: string) {return labels[value] ?? value.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());}
export function receiptAvailable(row: DonationRecord) {
  if (row.receiptEligible !== undefined) return row.receiptEligible;
  if (row.adjustmentStatus) return false;
  return row.donationStatus === 'completed' && ['completed', 'succeeded'].includes(row.displayStatus) && (row.providerVerified || row.recordKind === 'offline');
}
const easternDate = (value: string) => new Intl.DateTimeFormat('en-US', {dateStyle: 'medium', timeZone: 'America/New_York'}).format(new Date(value));

export function DonationHistory() {
  const [rows, setRows] = useState<DonationRecord[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [receiptBusy, setReceiptBusy] = useState<string | null>(null);
  const load = async (next: number) => {
    setLoading(true); setError('');
    try {
      const result = await donationApi.list(new URLSearchParams({page: String(next), limit: '20'}).toString());
      setRows(current => next === 1 ? result : [...current, ...result]);
      setPage(next); setMore(result.length === 20);
    } catch (failure) {setError(failure instanceof Error ? failure.message : 'Unable to load donation history.');}
    finally {setLoading(false);}
  };
  useEffect(() => {void load(1);}, []);
  async function receipt(row: DonationRecord) {
    if (receiptBusy) return;
    setReceiptBusy(row.id); setReceiptError('');
    try {await donationApi.donorReceipt(row.id, row.donationNumber);}
    catch (failure) {setReceiptError(failure instanceof Error ? failure.message : 'Receipt is unavailable.');}
    finally {setReceiptBusy(null);}
  }
  const receiptAction = (row: DonationRecord) => receiptAvailable(row)
    ? <button className="account-inline-link" type="button" disabled={receiptBusy !== null} onClick={() => void receipt(row)}>{receiptBusy === row.id ? 'Preparing…' : 'Download receipt'}</button>
    : <span className="receipt-unavailable">Receipt available after verification</span>;
  return <section className="account-panel donation-history-panel" aria-labelledby="history-heading">
    <div className="account-panel-heading history-heading"><span className="account-summary-icon"><FileText aria-hidden="true"/></span><div><p className="eyebrow">Your seva</p><h2 id="history-heading">Donation History</h2><p className="account-panel-subtitle">Backend-verified donations owned by your account.</p></div></div>
    {error && <div className="account-demo-notice" role="alert"><p>{error}</p><button className="button button-outline" disabled={loading} onClick={() => void load(rows.length ? page + 1 : 1)}>Try Again</button></div>}
    {receiptError && <p className="auth-error" role="alert">{receiptError}</p>}
    {loading && !rows.length ? <p className="account-history-footnote" role="status">Loading your donation history…</p> : !rows.length && !error ? <p className="account-history-footnote">No account-owned donations yet. Guest donations are not linked by email.</p> : <>
      <div className="account-donation-table-wrap"><table className="account-donation-table"><caption className="sr-only">Donor donation history</caption><thead><tr><th>Date</th><th>Donation For</th><th>Payment</th><th>Base Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{easternDate(row.createdAt)}</td><td><strong>{row.designationTitle}</strong><small>{row.donationNumber}</small>{row.donationPurpose&&<small className="donation-purpose-text">Purpose: {row.donationPurpose}</small>}</td><td><span className="account-payment">{donationStatusLabel(row.paymentMethod)}</span><small>{row.paymentProvider ? `${donationStatusLabel(row.paymentProvider)} provider` : donationStatusLabel(row.recordKind)}</small></td><td className="account-table-amount">{formatDonationAmount(row.baseDonationCents)}</td><td><span className={`account-status account-status-${row.displayStatus}`}>{donationStatusLabel(row.displayStatus)}</span>{row.adjustmentStatus&&<small>Adjustment: {donationStatusLabel(row.adjustmentStatus)}</small>}{row.paymentMethod === 'ach' && ['verification_required', 'processing', 'pending'].includes(row.displayStatus) && <small>Bank payment is not confirmed income yet.</small>}</td><td>{receiptAction(row)}</td></tr>)}</tbody></table></div>
      <div className="account-donation-cards">{rows.map(row => <article className="donation-history-card" key={row.id}><div className="donation-card-top"><div><p className="eyebrow">{easternDate(row.createdAt)}</p><h3>{row.designationTitle}</h3></div><strong>{formatDonationAmount(row.baseDonationCents)}</strong></div>{row.donationPurpose&&<p className="donation-purpose-text"><strong>Purpose:</strong> {row.donationPurpose}</p>}<p className="donation-card-reference">Reference <span>{row.donationNumber}</span></p><div className="donation-card-details"><div><span>Payment</span><span>{donationStatusLabel(row.paymentMethod)}</span></div><div><span>Provider / record</span><span>{row.paymentProvider ? donationStatusLabel(row.paymentProvider) : donationStatusLabel(row.recordKind)}</span></div><div><span>Verification</span><span>{row.providerVerified ? 'Provider verified' : donationStatusLabel(row.recordKind)}</span></div><div><span>Status</span><span className={`account-status account-status-${row.displayStatus}`}>{donationStatusLabel(row.displayStatus)}</span>{row.adjustmentStatus&&<small>Adjustment: {donationStatusLabel(row.adjustmentStatus)}</small>}</div><div><span>Receipt</span>{receiptAction(row)}</div></div>{row.paymentMethod === 'ach' && ['verification_required', 'processing', 'pending'].includes(row.displayStatus) && <p className="account-history-footnote">Bank payment is not confirmed income yet.</p>}</article>)}</div>
      {more && !error && <button className="button account-history-load" disabled={loading} onClick={() => void load(page + 1)}>{loading ? 'Loading…' : 'Load more'}</button>}
    </>}
  </section>;
}
