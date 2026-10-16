'use client';
/* eslint-disable @next/next/no-img-element -- Catalog URLs include backward-compatible external and local sources; no arbitrary Next optimizer proxy is enabled. */
import {useState,type ComponentProps} from 'react';
const defaultFallback='/images/devotional-hero.webp';
export function CatalogImage({src,alt='',fallback=defaultFallback,...props}:ComponentProps<'img'> & {fallback?:string}){
  const [failed,setFailed]=useState<string>();
  const image=typeof src==='string'&&src?src:fallback;
  return <img {...props} src={failed===image?fallback:image} alt={failed===image&&alt?'Decorative Haveli artwork':alt} onError={()=>{if(image!==fallback)setFailed(image);}}/>;
}
