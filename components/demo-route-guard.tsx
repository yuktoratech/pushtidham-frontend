'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {hasDemoSession,type DemoRole} from '../lib/demo-auth';
export function DemoRouteGuard({role,children}:{role:DemoRole;children:ReactNode}){
 const path=usePathname();const router=useRouter();const [allowed,setAllowed]=useState(false);
 useEffect(()=>{function check(){const valid=hasDemoSession(role);setAllowed(valid);if(!valid)router.replace(role==='admin'?'/admin/login':'/login');}check();window.addEventListener('storage',check);window.addEventListener('demo-session-change',check);window.addEventListener('pageshow',check);return()=>{window.removeEventListener('storage',check);window.removeEventListener('demo-session-change',check);window.removeEventListener('pageshow',check);};},[role,path,router]);
 return allowed?<>{children}</>:<main className="container checkout-empty" role="status"><p>Opening demo sign-in…</p></main>;
}
