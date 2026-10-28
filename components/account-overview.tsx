'use client';
import {useEffect, useState} from 'react';
import {ArrowRight, CalendarDays, CircleDollarSign, HandHeart, KeyRound, ReceiptText, UserRound} from 'lucide-react';
import {useAuth} from './auth-provider';
import {AccountLayout} from './account-layout';
import {donationApi, type DonationRecord} from '../lib/api-client';
import {formatDonationAmount} from '../lib/account-demo';
import {donationStatusLabel} from './account-donations';

const actions = [
  {title: 'Edit Profile', text: 'Update your donor contact details.', href: '/account/profile', icon: UserRound},
  {title: 'Donation History', text: 'Review your donation history and receipts.', href: '/account/donations', icon: ReceiptText},
  {title: 'Change Password', text: 'Update your account password securely.', href: '/account/change-password', icon: KeyRound},
  {title: 'Make a Donation', text: 'Support seva and temple activities.', href: '/donate', icon: HandHeart},
];
const contributionDate = (value: string) => new Intl.DateTimeFormat('en-US', {dateStyle: 'medium', timeZone: 'America/New_York'}).format(new Date(value));

// Mount only after AccountLayout's authentication guard allows access.
function OverviewContent() {
  const [rows, setRows] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    donationApi.list('page=1&limit=20').then(result => {
      if (current) setRows(result);
    }).catch(failure => {
      if (current) setError(failure instanceof Error ? failure.message : 'Unable to load account donations.');
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [retry]);
  const completed = rows.filter(row => row.donationStatus === 'completed' && ['completed', 'succeeded'].includes(row.displayStatus));
  const total = completed.reduce((sum, row) => sum + row.baseDonationCents, 0);
  const latest = rows.slice(0, 3);
  const recent = latest[0];
  function reload() { setError(''); setLoading(true); setRetry(value => value + 1); }
  return <>
    {error && <div className="account-demo-notice" role="alert"><p>{error}</p><button className="button button-outline" onClick={reload}>Retry donation summary</button></div>}
    {!error && <section className="account-summary-grid" aria-label="Giving summary" aria-busy={loading}>
      <article className="account-summary-card"><span className="account-summary-icon"><CircleDollarSign/></span><p>Recent completed giving</p><strong>{loading ? 'Loading…' : formatDonationAmount(total)}</strong><small>{loading ? 'Loading your donations' : `Within the latest 20 records · ${completed.length} completed`}</small></article>
      <article className="account-summary-card"><span className="account-summary-icon"><ReceiptText/></span><p>Recent account donations</p><strong>{loading ? 'Loading…' : rows.length}</strong><small>Latest 20 linked donations, including online and offline giving</small></article>
      <article className="account-summary-card"><span className="account-summary-icon"><CalendarDays/></span><p>Most recent contribution</p><strong>{loading ? 'Loading…' : recent ? formatDonationAmount(recent.baseDonationCents) : 'No donations yet.'}</strong><small>{!loading && recent ? `${recent.designationTitle || 'Giving contribution'} · ${contributionDate(recent.createdAt)} · ${donationStatusLabel(recent.displayStatus)}` : 'Your latest contribution will appear here'}</small></article>
    </section>}
    <section className="account-section"><div className="account-section-heading"><div><p className="eyebrow">Your account</p><h2>Quick Actions</h2></div></div><div className="account-action-grid">{actions.map(({title, text, href, icon: Icon}) => <a className="account-action-card" href={href} key={href}><span><Icon/></span><div><h3>{title}</h3><p>{text}</p></div><ArrowRight className="account-action-arrow"/></a>)}</div></section>
    <section className="account-section account-recent"><div className="account-section-heading"><div><p className="eyebrow">Your seva</p><h2>Recent Donations</h2></div><a className="account-inline-link" href="/account/donations">View donation history <ArrowRight/></a></div><div className="account-recent-list">{loading ? <p className="account-history-footnote" role="status">Loading recent donations…</p> : error ? <p className="account-history-footnote">Donation details could not be loaded. Please retry above.</p> : latest.length ? latest.map(item => <article className="account-recent-row" key={item.id}><span className="account-recent-icon"><HandHeart/></span><div className="account-recent-copy"><strong>{item.designationTitle || 'Giving contribution'}</strong><small>{contributionDate(item.createdAt)} · {donationStatusLabel(item.paymentMethod)}</small></div><strong className="account-recent-amount">{formatDonationAmount(item.baseDonationCents)}</strong><span className={`account-status account-status-${item.displayStatus}`}>{donationStatusLabel(item.displayStatus)}</span></article>) : <p className="account-history-footnote">No donations yet.</p>}</div></section>
  </>;
}

export default function AccountOverview() {
  const {user} = useAuth();
  return <AccountLayout title={`Welcome, ${user?.name.split(' ')[0] || ''}`} description="Thank you for being part of the Pushtidham Haveli community."><OverviewContent key={user?.id}/></AccountLayout>;
}
