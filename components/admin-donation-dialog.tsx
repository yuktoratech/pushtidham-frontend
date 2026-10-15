'use client';
import {useEffect,useRef,type ReactNode} from 'react';

export function AdminDonationDialog({titleId,close,busy=false,children}:{titleId:string;close:()=>void;busy?:boolean;children:ReactNode}){
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;
    const element=dialog.current;
    element?.showModal();
    document.body.style.overflow='hidden';
    return ()=>{element?.close();document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  return <dialog ref={dialog} className="admin-real-dialog" aria-labelledby={titleId} aria-busy={busy} onKeyDown={event=>{
    if(event.key!=='Tab')return;
    const controls=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')||[]).filter(element=>element.getClientRects().length>0);
    const first=controls[0],last=controls[controls.length-1];
    if(!first){event.preventDefault();return;}
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }} onCancel={event=>{event.preventDefault();if(!busy)close();}}>{children}</dialog>;
}
