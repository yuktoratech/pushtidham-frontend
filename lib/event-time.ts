export const templeTimeZone = 'America/New_York';
export const templeTimeZoneLabel = 'Eastern Time (America/New_York)';

export function eventTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {hour:'numeric',minute:'2-digit',timeZone:templeTimeZone,timeZoneName:'short'}).format(new Date(value));
}

export function templeDateTimeInput(value?: string) {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:templeTimeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
  const part = (name: string) => parts.find(p=>p.type===name)!.value;
  return part('year')+'-'+part('month')+'-'+part('day')+'T'+part('hour')+':'+part('minute');
}

// Reject skipped or repeated DST wall times rather than silently shifting an event.
export function templeDateTimeIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const utc = Date.parse(value+'Z');
  if (!Number.isFinite(utc)) return null;
  const candidates = [4,5].map(offset=>new Date(utc+offset*3600000).toISOString()).filter(iso=>templeDateTimeInput(iso)===value);
  return candidates.length===1?candidates[0]:null;
}
