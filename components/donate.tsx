'use client';

import {useEffect, useMemo, useState} from 'react';
import {ChevronRight, HandHeart} from 'lucide-react';
import {givingView, eventView, eventDate} from '../lib/catalog-ui';
import {donatePath, eventDonationPath, utsavDonationPath, type DonationCategory} from '../lib/donation-selection';
import {festivalGroups, festivalName} from '../lib/seva';
import {DonationPanel} from './donation-panel';
import {PageLink} from './page-link';
import {usePublicCatalog} from './catalog-provider';
import {clientDemoPaymentsDeferred, PaymentDemoNotice} from './payment-demo-notice';
import {isDevelopmentEvent, EventSampleNotice} from './event-sample-notice';

export function Donate() {
  const catalog = usePublicCatalog();
  const allGiving = useMemo(() => catalog.giving.map(givingView), [catalog.giving]);
  const giving = useMemo(() => allGiving.filter(g => g.category !== 'utsav'), [allGiving]);
  const utsav = useMemo(() => allGiving.filter(g => g.category === 'utsav'), [allGiving]);
  const events = useMemo(() => catalog.events.map(eventView), [catalog.events]);
  const [category, setCategory] = useState<DonationCategory>('General');
  const [selected, setSelected] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [notice, setNotice] = useState('');
  const defaultGiving = giving.find(g => g.slug === 'general-donation')?.slug || giving[0]?.slug || '';
  const eventKeys = useMemo(() => [...utsav.map(g => 'utsav:' + g.slug), ...events.map(e => 'event:' + e.slug)], [utsav, events]);
  useEffect(() => {
    if (catalog.loading || initialized) return;
    const timer = setTimeout(() => {
      const q = new URLSearchParams(window.location.search);
      const isEvent = q.get('category') === 'event' || (q.get('category') !== 'general' && !!q.get('event'));
      const requested = isEvent ? (q.get('giving') ? 'utsav:' + q.get('giving') : q.get('event') ? 'event:' + q.get('event') : '') : q.get('giving') || q.get('opportunity');
      const options = isEvent ? eventKeys : giving.map(g => g.slug);
      setCategory(isEvent ? 'Event' : 'General');
      setSelected(requested && options.includes(requested) ? requested : isEvent ? options[0] || '' : defaultGiving);
      if (requested && !options.includes(requested)) setNotice('That donation option is unavailable. Please choose an available option.');
      setInitialized(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [catalog.loading, initialized, giving, eventKeys, defaultGiving]);
  const key = selected || (category === 'General' ? defaultGiving : eventKeys[0] || '');
  const opportunity = category === 'General' ? giving.find(g => g.slug === key) : utsav.find(g => 'utsav:' + g.slug === key);
  const event = category === 'Event' ? events.find(e => 'event:' + e.slug === key) : undefined;
  function choose(next: DonationCategory, value: string) {
    setCategory(next); setSelected(value); setNotice('');
    const href = next === 'General' ? donatePath(value) : value.startsWith('utsav:') ? utsavDonationPath(value.slice(6)) : eventDonationPath(value.slice(6));
    window.history.replaceState(null, '', href);
  }
  if (catalog.loading) return <div className="container checkout-empty" role="status"><h1>Make a Donation</h1><p>Loading donation options…</p></div>;
  if (catalog.error) return <div className="container checkout-empty" role="alert"><h1>Donation options are unavailable</h1><p>{catalog.error}</p><button className="button" onClick={() => void catalog.reload()}>Try Again</button></div>;
  return <div className="donate-page">
    <nav className="container giving-detail-breadcrumb"><PageLink href="/">Home</PageLink><ChevronRight/><PageLink href="/giving">Giving</PageLink><ChevronRight/><span>Donate</span></nav>
    <div className="container"><header className="checkout-heading"><div><p className="eyebrow">An offering of seva</p><h1>Make a Donation</h1><p>Choose General for Daily Seva and other purposes, or Event for Utsav and scheduled events.</p></div></header>
      {clientDemoPaymentsDeferred && <PaymentDemoNotice/>}{notice && <p role="status">{notice}</p>}
      <div className="donate-selection-grid"><section className="checkout-panel donate-option-panel" aria-labelledby="donate-option-title"><div className="checkout-panel-heading"><HandHeart/><h2 id="donate-option-title">Donation Details</h2></div>
        <div className="auth-field"><label htmlFor="donate-category">Category</label><select id="donate-category" value={category} onChange={e => {const next = e.target.value as DonationCategory; choose(next, next === 'General' ? defaultGiving : eventKeys[0] || '');}}><option>General</option><option>Event</option></select></div>
        <div className="auth-field"><label htmlFor="donate-for">Donation For</label><select id="donate-for" value={key} disabled={category === 'General' ? !giving.length : !eventKeys.length} onChange={e => choose(category, e.target.value)}>
          {category === 'General' ? giving.map(g => <option key={g._id} value={g.slug}>{g.title}</option>) : <>
            {Object.entries(festivalGroups).map(([group, title]) => {const options = utsav.filter(g => g.festivalGroup === group); return options.length ? <optgroup key={group} label={title}>{options.map(g => <option key={g._id} value={'utsav:' + g.slug}>{g.title} — {new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(g.fixedAmountsCents[0] / 100)}</option>)}</optgroup> : null;})}
            {!!events.length && <optgroup label="Scheduled events">{events.map(e => <option key={e.id} value={'event:' + e.slug}>{e.title} — {eventDate(e.startsAt)}</option>)}</optgroup>}
          </>}
          {(category === 'General' ? !giving.length : !eventKeys.length) && <option value="">No donation options available</option>}
        </select></div>
        {opportunity?.category === 'utsav' && <p className="donate-description"><strong>{festivalName(opportunity.festivalGroup)}</strong> — {opportunity.title}. Festival donation options do not confirm an event date or booking.</p>}
        {event && isDevelopmentEvent(event) && <EventSampleNotice/>}
        <p className="donate-description">{opportunity?.description || event?.description}</p>
      </section>{(opportunity || event) && <DonationPanel opportunity={opportunity} event={event}/>}</div>
    </div>
  </div>;
}
