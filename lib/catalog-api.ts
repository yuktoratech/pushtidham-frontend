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
  categoryId?: string;
  category?: 'general' | 'daily_seva' | 'utsav';
  festivalGroup?: string;
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
  gallery?: Array<{url: string; alt: string; displayOrder: number}>;
  status: EventStatus;
};
export type GivingCategoryRecord = RecordBase & {name: string; description: string; image: string; status: 'active'|'inactive'; displayOrder: number};

export type GivingInput = Omit<GivingRecord, '_id' | 'createdAt' | 'updatedAt' | 'slug'> & {slug?: string};
export type EventInput = Omit<EventRecord, '_id' | 'createdAt' | 'updatedAt' | 'slug'> & {slug?: string};
export type CatalogImageKind = 'giving' | 'events' | 'categories';
export type UploadedImage = {
  url: string;
  key: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
};
export function imageOwnerSlug(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,150).replace(/-$/g,'');
}

const query = (values: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== '') params.set(key, String(value));
  const suffix = params.toString();
  return suffix ? `?${suffix}` : '';
};

export const catalogApi = {
  saveGivingCategory: (body: Omit<GivingCategoryRecord, '_id'|'title'|'createdAt'|'updatedAt'>, id?:string) => apiRequest<GivingCategoryRecord>(id?`/admin/giving-categories/${id}`:'/admin/giving-categories', {method:id?'PUT':'POST',body:JSON.stringify(body)}),
  deleteGivingCategory: (id:string) => apiRequest<void>(`/admin/giving-categories/${id}`,{method:'DELETE'}),
  publicGivingCategories: () => apiRequest<GivingCategoryRecord[]>(`/giving-categories${query({limit: 100})}`),
  publicGiving: (categoryId?: string) => apiRequest<GivingRecord[]>(`/giving${query({ limit: 100, categoryId })}`),
  publicGivingBySlug: (slug: string) => apiRequest<GivingRecord>(`/giving/${encodeURIComponent(slug)}`),
  publicGivingCategoryBySlug: (slug: string) => apiRequest<GivingCategoryRecord>(`/giving-categories/${encodeURIComponent(slug)}`),
  publicEvents: () => apiRequest<EventRecord[]>(`/events${query({ limit: 100 })}`),
  publicEventBySlug: (slug: string) => apiRequest<EventRecord>(`/events/${encodeURIComponent(slug)}`),
  adminGiving: (search = '', status = '', categoryId = '') => apiRequest<GivingRecord[]>(`/admin/giving${query({ limit: 100, search: search || undefined, status: status || undefined, categoryId: categoryId || undefined })}`),
  adminGivingCategories: (search = '', status = '') => apiRequest<GivingCategoryRecord[]>(`/admin/giving-categories${query({limit: 100, search: search || undefined, status: status || undefined})}`),
  adminEvents: (search = '', status = '') => apiRequest<EventRecord[]>(`/admin/events${query({ limit: 100, search: search || undefined, status: status || undefined })}`),
  createGiving: (body: GivingInput) => apiRequest<GivingRecord>('/admin/giving', { method: 'POST', body: JSON.stringify(body) }),
  replaceGiving: (id: string, body: GivingInput) => apiRequest<GivingRecord>(`/admin/giving/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  setGivingStatus: (id: string, status: GivingStatus) => apiRequest<GivingRecord>(`/admin/giving/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteGiving: (id: string) => apiRequest<void>(`/admin/giving/${id}`, { method: 'DELETE' }),
  createEvent: (body: EventInput) => apiRequest<EventRecord>('/admin/events', { method: 'POST', body: JSON.stringify(body) }),
  replaceEvent: (id: string, body: EventInput) => apiRequest<EventRecord>(`/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  setEventStatus: (id: string, status: EventStatus) => apiRequest<EventRecord>(`/admin/events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteEvent: (id: string) => apiRequest<void>(`/admin/events/${id}`, { method: 'DELETE' }),
  uploadImage: (kind: CatalogImageKind, file: File, context: {slug?:string;placement?:'cover'|'gallery'} = {}) => {
    const body = new FormData();
    body.append('image', file);
    const params=new URLSearchParams();if(context.slug)params.set('slug',context.slug);if(context.placement)params.set('placement',context.placement);
    const suffix=params.toString();
    return apiRequest<UploadedImage>(`/admin/uploads/${kind}${suffix?`?${suffix}`:''}`, { method: 'POST', body });
  },
  deleteUploadedImage: (url: string) => apiRequest<void>('/admin/uploads', { method: 'DELETE', body: JSON.stringify({ url }) }),
};

