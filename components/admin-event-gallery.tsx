'use client';
import {useEffect,useRef,useState} from 'react';
import {catalogApi} from '../lib/catalog-api';
import {catalogErrorMessage} from '../lib/catalog-ui';
import {CatalogImage} from './catalog-image';
import type {GalleryEntry} from './event-gallery';
import {MAX_IMAGE_BYTES,MAX_IMAGE_MIB} from '../lib/image-upload-limit';
type LocalImage={id:string;file:File;preview:string;state:'ready'|'uploading'|'uploaded'|'error';error?:string};
export function AdminEventGallery({value,cover,onChange,onCover,onBusy,onPending,disabled,slug}:{value:GalleryEntry[];cover:string;onChange:(rows:GalleryEntry[])=>void;onCover:(url:string)=>void;onBusy:(busy:boolean)=>void;onPending:(pending:boolean)=>void;disabled:boolean;slug?:string}){
 const [local,setLocal]=useState<LocalImage[]>([]),[error,setError]=useState('');
 const urls=useRef<string[]>([]),inFlight=useRef(false);
 useEffect(()=>{onPending(local.some(row=>row.state!=='uploaded'))},[local,onPending]);
 useEffect(()=>()=>{urls.current.forEach(url=>URL.revokeObjectURL(url))},[]);
 const order=(rows:GalleryEntry[])=>onChange(rows.map((row,i)=>({...row,displayOrder:i})));
 function select(files:FileList|null){
   if(!files)return;const next:LocalImage[]=[];
   for(const file of Array.from(files)){
     if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>MAX_IMAGE_BYTES){setError(`Choose JPG, PNG or WebP files up to ${MAX_IMAGE_MIB} MiB each.`);continue;}
     if(value.length+local.filter(row=>row.state!=='uploaded').length+next.length>=30){setError('Maximum 30 gallery images.');break;}
     const preview=URL.createObjectURL(file);urls.current.push(preview);next.push({id:crypto.randomUUID(),file,preview,state:'ready'});
   }
   setLocal(rows=>[...rows,...next]);
 }
 async function upload(){
   if(inFlight.current)return;inFlight.current=true;
   onBusy(true);let saved=[...value];
   try{for(const item of local.filter(row=>row.state==='ready'||row.state==='error')){
     setLocal(rows=>rows.map(row=>row.id===item.id?{...row,state:'uploading',error:''}:row));
     try{const image=await catalogApi.uploadImage('events',item.file,{slug,placement:'gallery'});saved=[...saved,{url:image.url,alt:'',displayOrder:saved.length}];onChange(saved);setLocal(rows=>rows.map(row=>row.id===item.id?{...row,state:'uploaded'}:row));}
     catch(reason){setLocal(rows=>rows.map(row=>row.id===item.id?{...row,state:'error',error:catalogErrorMessage(reason)}:row));}
   }}finally{inFlight.current=false;onBusy(false);}
 }
 return <fieldset className="adm-image-field adm-field-wide" disabled={disabled}><legend>Event gallery</legend><p>Preview files, then upload. Save the Event to attach images. Removed images are retained in storage for recovery.</p>
 <input aria-label="Select gallery images" type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={e=>{select(e.target.files);e.target.value=''}}/>
 {error&&<p role="alert" className="adm-error">{error}</p>}
 {local.length>0&&<progress aria-label="Gallery upload progress" max={local.length} value={local.filter(row=>row.state==="uploaded").length}/>}
 <div className="adm-gallery-grid">{value.map((row,index)=><div key={row.url}><CatalogImage src={row.url} alt={row.alt||'Gallery preview'}/><label>Alternative text<input value={row.alt} maxLength={300} onChange={e=>onChange(value.map((r,i)=>i===index?{...r,alt:e.target.value}:r))}/></label><button type="button" disabled={index===0} onClick={()=>{const rows=[...value];[rows[index-1],rows[index]]=[rows[index],rows[index-1]];order(rows)}}>Move up</button><button type="button" disabled={index===value.length-1} onClick={()=>{const rows=[...value];[rows[index+1],rows[index]]=[rows[index],rows[index+1]];order(rows)}}>Move down</button><button type="button" aria-pressed={cover===row.url} onClick={()=>onCover(row.url)}>Use as cover</button><button type="button" onClick={()=>order(value.filter((_,i)=>i!==index))}>Remove image {index+1}</button></div>)}
 {local.filter(row=>row.state!=='uploaded').map(row=><div key={row.id}><CatalogImage src={row.preview} alt={row.file.name}/><p>{row.file.name}</p><p role="status">{row.state==='uploading'?'Uploading image…':row.state}</p>{row.error&&<p role="alert">{row.error}</p>}<button type="button" disabled={row.state==='uploading'} onClick={()=>setLocal(rows=>rows.filter(r=>r.id!==row.id))}>Remove unsaved image</button></div>)}</div>
 {local.some(row=>row.state==='ready'||row.state==='error')&&<button type="button" onClick={()=>void upload()}>Upload selected images / retry failures</button>}
 </fieldset>;
}
