'use client';
import {usePublicCatalog} from './catalog-provider';
import {festivalGroups} from '../lib/seva';
import {utsavDonationPath} from '../lib/donation-selection';
import {formatUsd} from '../lib/money';

export function UtsavDonations() {
  const {giving, loading, givingError} = usePublicCatalog();
  const options = giving.filter(row => row.category === 'utsav');
  return <section className="container events-section" aria-labelledby="utsav-title"><p className="eyebrow">Festival offerings</p><h2 id="utsav-title">Utsav Donations</h2><p>Festival seva offerings are separate from scheduled events. Selecting an option does not confirm a date, registration or booking.</p>
    {loading ? <p role="status">Loading festival donation options…</p> : givingError ? <p role="alert">Festival donation options are temporarily unavailable.</p> : !options.length ? <p>Festival donation options will be available soon.</p> : <div className="giving-grid">{Object.entries(festivalGroups).map(([key,title]) => {
      const rows = options.filter(row => row.festivalGroup === key);
      return rows.length ? <article className="utsav-card" key={key}><h3>{title}</h3><ul>{rows.map(row => <li key={row._id}><a className="giving-link" href={utsavDonationPath(row.slug)}>{row.title} — {formatUsd(row.fixedAmountsCents[0])}</a></li>)}</ul></article> : null;
    })}</div>}
  </section>;
}
