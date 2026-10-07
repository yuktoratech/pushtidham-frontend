'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore, type SetStateAction } from 'react';
import { adminStorageKey, createAdminState, normalizeAdminState, type AdminState } from '../lib/admin-demo';
import { useHydrated } from './use-hydrated';

let memorySnapshot='';
let storageFailed=false;
const changeEvent='pushthidham-admin-demo-change';
const defaultState=createAdminState();
function snapshot(){
  if(storageFailed)return memorySnapshot;
  try{return localStorage.getItem(adminStorageKey)||memorySnapshot;}catch{return memorySnapshot;}
}
function subscribe(onChange:()=>void){
  window.addEventListener('storage',onChange);
  window.addEventListener(changeEvent,onChange);
  return ()=>{window.removeEventListener('storage',onChange);window.removeEventListener(changeEvent,onChange);};
}
const serverSnapshot=()=>'';

// Admin and donor screens share the existing local demo payload; no API is used.
export function useAdminDemo(){
  const hydrated=useHydrated();
  const raw=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
  const data=useMemo(()=>{if(!raw)return defaultState;try{return normalizeAdminState(JSON.parse(raw));}catch{return defaultState;}},[raw]);
  const setData=useCallback((update:SetStateAction<AdminState>)=>{
    const current=snapshot();
    let state=defaultState;
    if(current)try{state=normalizeAdminState(JSON.parse(current));}catch{}
    const next=typeof update==='function'?update(state):update;
    memorySnapshot=JSON.stringify(next);
    try{localStorage.setItem(adminStorageKey,memorySnapshot);storageFailed=false;}catch{storageFailed=true;}
    window.dispatchEvent(new Event(changeEvent));
  },[]);
  useEffect(()=>{
    if(!raw)return;
    try{
      const stored=JSON.parse(raw);
      const obsolete='categories' in stored||stored.giving?.some((g:Record<string,unknown>)=>'category' in g||'categorySlug' in g)||stored.donations?.some((d:Record<string,unknown>)=>'categorySlug' in d||!['General','Event'].includes(String(d.category))||!!(d.eventSlug&&d.givingSlug));
      if(obsolete)setData(current=>current);
    }catch{/* Invalid local data continues to use the default demo state. */}
  },[raw,setData]);
  // Next may hydrate a newly visited route with the server's empty snapshot
  // before React reads local storage. Wait for the catalog itself as well as
  // hydration before initializing URL selections against persisted settings.
  const ready=hydrated&&raw===snapshot();
  return {data,setData,ready,storageFailed};
}
