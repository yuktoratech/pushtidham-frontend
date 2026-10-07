'use client';
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
function AccountNav({mobile=false}:{mobile?:boolean}){const path=usePathname();return <nav className={mobile?'account-nav account-nav-mobile':'account-nav account-nav-desktop'} aria-label={mobile?'Account navigation':'Donor account navigation'}>{accountLinks.map(({label,href,icon:Icon})=>{const active=path===href||(href==='/account'&&path==='/account');return <a key={href} href={href} className={active?'is-active':''} aria-current={active?'page':undefined}><Icon aria-hidden="true"/><span>{label}</span></a>;})}<LogoutLink className="account-logout-link"><LogOut aria-hidden="true"/><span>Logout</span></LogoutLink></nav>;}
export function AccountLayout({title,description,children}:{title:string;description:string;children:React.ReactNode}){return <AuthRouteGuard><a className="skip-link" href="#account-main">Skip to account content</a><Header/><main className="account-page"><div className="container account-container"><div className="account-heading"><div><p className="eyebrow">Donor account</p><h1>{title}</h1><p>{description}</p></div><span className="account-preview-badge">Demo giving data</span></div><div className="account-shell"><AccountNav/><div className="account-workspace"><AccountNav mobile/><div id="account-main" tabIndex={-1}>{children}</div></div></div></div></main><Footer/><MobileBottomNav/></AuthRouteGuard>;}
