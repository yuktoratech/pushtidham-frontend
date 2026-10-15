'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { catalogApi, type EventRecord, type GivingRecord } from '../lib/catalog-api';
import { catalogErrorMessage } from '../lib/catalog-ui';

type CatalogState = {
  giving: GivingRecord[];
  events: EventRecord[];
  loading: boolean;
  error: string | null;
  givingError: string | null;
  eventsError: string | null;
  reload: () => Promise<void>;
};

const fetchCatalog=()=>Promise.allSettled([catalogApi.publicGiving(),catalogApi.publicEvents()] as const);
const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [giving, setGiving] = useState<GivingRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [givingError,setGivingError]=useState<string|null>(null);
  const [eventsError,setEventsError]=useState<string|null>(null);
  const apply=useCallback((results:Awaited<ReturnType<typeof fetchCatalog>>)=>{
    const [g,e]=results;
    if(g.status==='fulfilled')setGiving(g.value);
    if(e.status==='fulfilled')setEvents(e.value);
    const ge=g.status==='rejected'?catalogErrorMessage(g.reason):null;
    const ee=e.status==='rejected'?catalogErrorMessage(e.reason):null;
    setGivingError(ge);setEventsError(ee);setError(ge||ee);
  },[]);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      apply(await fetchCatalog());
    } catch (reason) {
      setError(catalogErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [apply]);
  useEffect(() => {
    let current = true;
    fetchCatalog()
      .then(results => { if(current)apply(results); })
      .catch(reason => { if (current) setError(catalogErrorMessage(reason)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [apply]);
  return <CatalogContext.Provider value={{ giving, events, loading, error, givingError, eventsError, reload }}>{children}</CatalogContext.Provider>;
}

export function usePublicCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('CatalogProvider is required');
  return context;
}
