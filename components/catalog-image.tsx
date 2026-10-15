'use client';
import {useState,type ComponentProps} from 'react';
const fallback='/images/devotional-hero.webp';
export function CatalogImage({src,alt='',...props}:ComponentProps<'img'>){
  const [failed,setFailed]=useState<string>();
  const image=typeof src==='string'?src:fallback;
  return <img {...props} src={failed===image?fallback:image} alt={failed===image&&alt?'Decorative Haveli artwork':alt} onError={()=>{if(image!==fallback)setFailed(image);}}/>;
}
