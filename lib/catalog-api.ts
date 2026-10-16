import { apiRequest } from './api-client';

export type GivingAmountType = 'fixed' | 'custom' | 'fixed_and_custom';
export type GivingStatus = 'active' | 'inactive';
export type EventStatus = 'draft' | 'published' | 'inactive';

type RecordBase = {
  _id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type GivingRecord = RecordBase & {
  description: string;
  image: string;
  amountType: GivingAmountType;
  fixedAmountsCents: number[];
  status: GivingStatus;
  displayOrder: number;
};

export type EventRecord = RecordBase & {
  shortDescription: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  image: string;
  status: EventStatus;
};

export type GivingInput = Omit<GivingRecord, '_id' | 'createdAt' | 'updatedAt' | 'slug'> & {slug?: string};
export type EventInput = Omit<EventRecord, '_id' | 'createdAt' | 'updatedAt' | 'slug'> & {slug?: string};
export type CatalogImageKind = 'giving' | 'events';
export type UploadedImage = {
  url: string;
  key: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
};

const query = (values: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== '') params.set(key, String(value));
  const suffix = params.toString();
  return suffix ? `?${suffix}` : '';
};

export const catalogApi = {
  publicGiving: () => apiRequest<GivingRecord[]>(`/giving${query({ limit: 100 })}`),
  publicGivingBySlug: (slug: string) => apiRequest<GivingRecord>(`/giving/${encodeURIComponent(slug)}`),
  publicEvents: () => apiRequest<EventRecord[]>(`/events${query({ limit: 100 })}`),
  publicEventBySlug: (slug: string) => apiRequest<EventRecord>(`/events/${encodeURIComponent(slug)}`),
  adminGiving: (search = '', status = '') => apiRequest<GivingRecord[]>(`/admin/giving${query({ limit: 100, search: search || undefined, status: status || undefined })}`),
  adminEvents: (search = '', status = '') => apiRequest<EventRecord[]>(`/admin/events${query({ limit: 100, search: search || undefined, status: status || undefined })}`),
  createGiving: (body: GivingInput) => apiRequest<GivingRecord>('/admin/giving', { method: 'POST', body: JSON.stringify(body) }),
  replaceGiving: (id: string, body: GivingInput) => apiRequest<GivingRecord>(`/admin/giving/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  setGivingStatus: (id: string, status: GivingStatus) => apiRequest<GivingRecord>(`/admin/giving/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteGiving: (id: string) => apiRequest<void>(`/admin/giving/${id}`, { method: 'DELETE' }),
  createEvent: (body: EventInput) => apiRequest<EventRecord>('/admin/events', { method: 'POST', body: JSON.stringify(body) }),
  replaceEvent: (id: string, body: EventInput) => apiRequest<EventRecord>(`/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  setEventStatus: (id: string, status: EventStatus) => apiRequest<EventRecord>(`/admin/events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteEvent: (id: string) => apiRequest<void>(`/admin/events/${id}`, { method: 'DELETE' }),
  uploadImage: (kind: CatalogImageKind, file: File) => {
    const body = new FormData();
    body.append('image', file);
    return apiRequest<UploadedImage>(`/admin/uploads/${kind}`, { method: 'POST', body });
  },
  deleteUploadedImage: (url: string) => apiRequest<void>('/admin/uploads', { method: 'DELETE', body: JSON.stringify({ url }) }),
};

