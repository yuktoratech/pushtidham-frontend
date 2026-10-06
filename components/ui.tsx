import type { ReactNode } from 'react';
import { Landmark as Church, CalendarDays, HeartHandshake, HandHeart, Home, MapPin } from 'lucide-react';
export const icons = { temple: Church, events: CalendarDays, seva: HeartHandshake, give: HandHeart, home: Home, visit: MapPin };
export function Button({children,href,className='',outline=false}:{children:ReactNode;href:string;className?:string;outline?:boolean}) {return <a href={href} className={`button ${outline?'button-outline':''} ${className}`}>{children}</a>}
export function SectionHeading({eyebrow,children}:{eyebrow?:string;children:ReactNode}) {return <div className="section-heading">{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h2>{children}</h2></div>}
export function Brand(){return <a href="/" aria-label="Pushthidham home" className="brand"><Church aria-hidden="true"/><span>Pushthidham<small>HAVELI · FAITH & COMMUNITY</small></span></a>}
