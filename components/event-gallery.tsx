'use client';
import './catalog-enhancements.css';
import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react';
import {CatalogImage} from './catalog-image';
export type GalleryEntry={url:string;alt:string;displayOrder:number};
export function EventGallery({cover,gallery=[],title}:{cover:string;gallery?:GalleryEntry[];title:string}){
 const slides=[{url:cover,alt:title,displayOrder:-1},...gallery.toSorted((a,b)=>a.displayOrder-b.displayOrder)].filter((row,index,all)=>row.url&&all.findIndex(other=>other.url===row.url)===index);
 const [active,setActive]=useState(0),[playing,setPlaying]=useState(false);
 const touch=useRef<number|null>(null);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setPlaying(!media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);
 useEffect(()=>{if(!playing||slides.length<2)return;const timer=setInterval(()=>{if(!document.hidden)setActive(n=>(n+1)%slides.length)},5000);return()=>clearInterval(timer)},[playing,slides.length]);
 const index=active%Math.max(slides.length,1),slide=slides[index];
 const choose=(n:number)=>{setPlaying(false);setActive((n+slides.length)%slides.length)};
 return <section className="event-gallery" role="region" aria-roledescription="carousel" aria-label={title+' photos'} tabIndex={0}
 onFocusCapture={()=>setPlaying(false)} onMouseEnter={()=>setPlaying(false)}
 onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();choose(index+(e.key==='ArrowLeft'?-1:1))}}}
 onPointerDown={e=>{if(e.pointerType==='touch')touch.current=e.clientX}} onPointerUp={e=>{if(touch.current!==null&&Math.abs(e.clientX-touch.current)>40)choose(index+(e.clientX<touch.current?1:-1));touch.current=null}}>
 <CatalogImage className="event-detail-photo" src={slide?.url||'/images/devotional-hero.webp'} alt={slide?.alt||title}/>
 {slides.length>1&&<><button className="event-gallery-control event-gallery-prev" type="button" aria-label="Previous image" onClick={()=>choose(index-1)}><ChevronLeft/></button><button className="event-gallery-control event-gallery-next" type="button" aria-label="Next image" onClick={()=>choose(index+1)}><ChevronRight/></button><div className="event-gallery-controls"><button type="button" aria-label={playing?'Pause slideshow':'Play slideshow'} onClick={()=>setPlaying(n=>!n)}>{playing?<Pause/>:<Play/>}</button>{slides.map((item,n)=><button key={item.url} type="button" aria-label={'Show image '+(n+1)} aria-current={index===n?'true':undefined} onClick={()=>choose(n)}><span/></button>)}</div></>}
 <p className="sr-only" aria-live={playing?'off':'polite'}>Image {index+1} of {slides.length||1}</p></section>;
}
