import { PageLink } from './page-link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Landmark as Church, CalendarDays, HeartHandshake, HandHeart, Home, MapPin } from 'lucide-react';
export const icons = { temple: Church, events: CalendarDays, seva: HeartHandshake, give: HandHeart, home: Home, visit: MapPin };
export function Button({children,href,className='',outline=false}:{children:ReactNode;href:string;className?:string;outline?:boolean}) {return <PageLink href={href} className={`button ${outline?'button-outline':''} ${className}`}>{children}</PageLink>}
export function SectionHeading({eyebrow,children}:{eyebrow?:string;children:ReactNode}) {return <div className="section-heading">{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h2>{children}</h2></div>}
export function Brand(){return <PageLink href="/" aria-label="Pushti Margiya Vaishnav Samaj Inc., Pushtidham Haveli, Ocala Florida" className="brand"><Image src="/images/pushtidham-official-logo.webp" alt="Pushti Margiya Vaishnav Samaj Inc. logo" width={96} height={96} className="brand-logo"/><span>Pushti Margiya Vaishnav Samaj Inc.<small>Pushtidham Haveli (Ocala FL)</small></span></PageLink>}
