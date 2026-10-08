export const MIN_DONATION_CENTS = 100;
export const MAX_DONATION_CENTS = 1_000_000;

export function centsToUsd(cents: number) {
  return cents / 100;
}

export function centsToUsdInput(cents: number) {
  return centsToUsd(cents).toFixed(2);
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(centsToUsd(cents));
}

export function parseUsdToCents(value: string): { cents: number | null; error: string | null } {
  const text = value.trim();
  if (!text) return { cents: null, error: 'Enter your donation amount in USD.' };
  if (/^[-+]/.test(text)) return { cents: null, error: 'Enter an amount without a sign.' };
  if (!/^\d+(?:\.\d{1,2})?$/.test(text))
    return { cents: null, error: 'Use numbers with up to two decimal places.' };
  const [whole, decimal = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) return { cents: null, error: 'Enter a valid USD amount.' };
  if (cents < MIN_DONATION_CENTS || cents > MAX_DONATION_CENTS)
    return { cents: null, error: 'Enter an amount from $1 to $10,000.' };
  return { cents, error: null };
}

export function centsListToUsdInput(cents: number[]) {
  return cents.map(value => centsToUsd(value).toFixed(value % 100 ? 2 : 0)).join(', ');
}
