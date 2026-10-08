'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { catalogApi, type EventRecord, type GivingRecord } from '../lib/catalog-api';
import { catalogErrorMessage } from '../lib/catalog-ui';

type CatalogState = {
  giving: GivingRecord[];
  events: EventRecord[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [giving, setGiving] = useState<GivingRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextGiving, nextEvents] = await Promise.all([catalogApi.publicGiving(), catalogApi.publicEvents()]);
      setGiving(nextGiving);
      setEvents(nextEvents);
    } catch (reason) {
      setError(catalogErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let current = true;
    Promise.all([catalogApi.publicGiving(), catalogApi.publicEvents()])
      .then(([nextGiving, nextEvents]) => { if (current) { setGiving(nextGiving); setEvents(nextEvents); } })
      .catch(reason => { if (current) setError(catalogErrorMessage(reason)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);
  return <CatalogContext.Provider value={{ giving, events, loading, error, reload }}>{children}</CatalogContext.Provider>;
}

export function usePublicCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('CatalogProvider is required');
  return context;
}
