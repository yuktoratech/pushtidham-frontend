import type {EventRecord} from '../lib/catalog-api';
export function isDevelopmentEvent(event:EventRecord){return /development sample|sample for future api integration/i.test(event.shortDescription+' '+event.description);}
export function EventSampleNotice(){return <p className="event-sample-notice"><strong>Development sample</strong> - for demonstration only. This is not a confirmed temple announcement; its date, time and location are sample data.</p>;}
