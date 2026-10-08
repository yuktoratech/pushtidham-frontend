import { ApiError } from './api-client';
import type { EventRecord, GivingAmountType, GivingRecord } from './catalog-api';
import { centsToUsd } from './money';

export type DonationAmountType = 'fixed' | 'custom' | 'fixed-custom';
export const amountTypeLabels: Record<DonationAmountType, string> = {
  fixed: 'Fixed Amount Only',
  custom: 'Custom Amount Only',
  'fixed-custom': 'Fixed + Custom Amount',
};
export const toUiAmountType = (value: GivingAmountType): DonationAmountType => value === 'fixed_and_custom' ? 'fixed-custom' : value;
export const toApiAmountType = (value: DonationAmountType): GivingAmountType => value === 'fixed-custom' ? 'fixed_and_custom' : value;

export type GivingOpportunity = GivingRecord & {
  shortDescription: string;
  fullDescription: string;
  image: string;
  imageAlt: string;
  suggestedAmounts: number[];
  amountTypeUi: DonationAmountType;
  icon: 'give' | 'temple' | 'seva';
  detailsPath: string;
};

export type TempleEvent = EventRecord & {
  id: string;
  date: string;
  time: string;
  past: boolean;
  venue: string;
  imageAlt: string;
  detailsPath: string;
};

export function givingView(record: GivingRecord): GivingOpportunity {
  return {
    ...record,
    shortDescription: record.description,
    fullDescription: record.description,
    image: '/images/diya.webp',
    imageAlt: '',
    suggestedAmounts: record.fixedAmountsCents.map(centsToUsd),
    amountTypeUi: toUiAmountType(record.amountType),
    icon: 'give',
    detailsPath: `/giving/${record.slug}`,
  };
}

export function eventView(record: EventRecord): TempleEvent {
  const starts = new Date(record.startsAt);
  return {
    ...record,
    id: record._id,
    date: record.startsAt,
    time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(starts),
    past: starts.getTime() < Date.now(),
    venue: record.location,
    image: record.image || '/images/devotional-hero.webp',
    imageAlt: '',
    detailsPath: `/events/${record.slug}`,
  };
}

export function eventDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function catalogErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'You do not have permission to manage this catalog.';
    if (error.status === 404) return 'This catalog item is unavailable.';
    if (error.status === 409) return error.message;
    if (error.status === 0) return 'Catalog services are unavailable. Please try again.';
    return error.message;
  }
  return 'The catalog could not be loaded. Please try again.';
}
