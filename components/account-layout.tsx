'use client';
import Link from 'next/link';
import {useAuth} from './auth-provider';
import './account-session.css';
import {AuthRouteGuard} from './auth-route-guard';
import {LogoutLink} from './logout-link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UserRound, ReceiptText, KeyRound, LogOut } from 'lucide-react';
import { Header, Footer, MobileBottomNav } from './layout';
const accountLinks=[
  {label:'Overview',href:'/account',icon:LayoutDashboard},
  {label:'My Profile',href:'/account/profile',icon:UserRound},
  {label:'Donation History',href:'/account/donations',icon:ReceiptText},
  {label:'Change Password',href:'/account/change-password',icon:KeyRound},
];
function AccountNav({mobile=false,pending=false}:{mobile?:boolean;pending?:boolean}){const path=usePathname();return <nav className={mobile?'account-nav account-nav-mobile':'account-nav account-nav-desktop'} aria-label={mobile?'Account navigation':'Donor account navigation'}>{accountLinks.map(({label,href,icon:Icon})=>{const active=path===href||(href==='/account'&&path==='/account');if(pending)return <span className="account-nav-placeholder" key={href}><Icon aria-hidden="true"/><span>{label}</span></span>;return <Link prefetch={false} key={href} href={href} className={active?'is-active':''} aria-current={active?'page':undefined}><Icon aria-hidden="true"/><span>{label}</span></Link>;})}{!pending&&<LogoutLink className="account-logout-link"><LogOut aria-hidden="true"/><span>Logout</span></LogoutLink>}</nav>;}
const pageDetails:Record<string,{title:string;description:string}>={
 '/account/profile':{title:'My Profile',description:'Review and update your donor account contact details.'},
 '/account/donations':{title:'Donation History',description:'Review your contributions and the receipt options for each one.'},
 '/account/change-password':{title:'Change Password',description:'Update the password for your donor account.'},
};
function AccountFrame({children,pending=false}:{children:React.ReactNode;pending?:boolean}){
 const path=usePathname(),auth=useAuth();
 const details=pending?{title:'Your Account',description:'Secure access to your donor account.'}:pageDetails[path]||{title:path==='/account'?`Welcome, ${auth.user?.name.split(' ')[0]||''}`:'Donor Account',description:'Thank you for being part of the Pushtidham Haveli community.'};
 return <><a className="skip-link" href="#account-main">Skip to account content</a><Header/><main className="account-page"><div className="container account-container"><div className="account-heading"><div><p className="eyebrow">Donor account</p><h1>{details.title}</h1><p>{details.description}</p></div><span className="account-preview-badge">Donor account</span></div><div className="account-shell"><AccountNav pending={pending}/><div className="account-workspace"><AccountNav mobile pending={pending}/><div id="account-main" key={pending?'pending':auth.user?.id} tabIndex={-1}>{children}</div></div></div></div></main><Footer/><MobileBottomNav/></>;
}
export function AccountLayout({children}:{children:React.ReactNode}){
 const auth=useAuth();
 const unresolved=<AccountFrame pending><section className="account-panel account-session-state" role="status" aria-live="polite" aria-busy={!auth.error}><UserRound aria-hidden="true"/><h2>{auth.error?'Account connection interrupted':'Preparing your account'}</h2><p>{auth.error||'Securely restoring your session. Your account details will appear shortly.'}</p>{auth.error?<button className="button" onClick={()=>void auth.restore()}>Retry account connection</button>:<div className="account-session-skeleton" aria-hidden="true"><span/><span/><span/></div>}</section></AccountFrame>;
 return <AuthRouteGuard fallback={unresolved}><AccountFrame>{children}</AccountFrame></AuthRouteGuard>;
}
