'use client';

import {useEffect,useRef,useState,type ChangeEvent} from 'react';
import {ImagePlus,Trash2} from 'lucide-react';
import {ApiError} from '../lib/api-client';
import {catalogApi,type CatalogImageKind} from '../lib/catalog-api';
import {CatalogImage} from './catalog-image';

const maxBytes=8*1024*1024;
const allowedTypes=new Set(['image/jpeg','image/png','image/webp']);

function uploadError(error:unknown){
  if(error instanceof ApiError){
    if(error.status===413)return 'The image is too large. Choose a file no larger than 8 MiB.';
    if(error.code==='IMAGE_STORAGE_UNAVAILABLE')return 'Image uploads are not configured on the server. You can still use an existing image URL.';
    return error.message;
  }
  return 'The image could not be uploaded. Your other form values are unchanged.';
}

export function AdminImageField({kind,value,onChange,temporaryUrl,onTemporaryChange,onBusyChange,disabled=false,validationError}:{kind:CatalogImageKind;value:string;onChange:(value:string)=>void;temporaryUrl?:string;onTemporaryChange:(value?:string)=>void;onBusyChange:(busy:boolean)=>void;disabled?:boolean;validationError?:string}){
  const [preview,setPreview]=useState('');
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const objectUrl=useRef('');

  useEffect(()=>()=>{if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);},[]);

  function setBusy(busy:boolean){setUploading(busy);onBusyChange(busy);}
  function localPreview(file:File){
    if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);
    objectUrl.current=URL.createObjectURL(file);
    setPreview(objectUrl.current);
  }
  async function select(event:ChangeEvent<HTMLInputElement>){
    const input=event.currentTarget;
    const file=input.files?.[0];
    input.value='';
    if(!file)return;
    setError('');setMessage('');
    if(!allowedTypes.has(file.type)){setError('Choose a JPEG, PNG, or WebP image.');return;}
    if(file.size>maxBytes){setError('The image is too large. Choose a file no larger than 8 MiB.');return;}
    if(value&&!window.confirm('Replace the current image? The change is finalized when you save this record.'))return;
    localPreview(file);
    setBusy(true);
    try{
      const uploaded=await catalogApi.uploadImage(kind,file);
      const previous=temporaryUrl;
      onChange(uploaded.url);
      onTemporaryChange(uploaded.url);
      setMessage('Image uploaded. Save the record to apply it.');
      if(previous&&previous!==uploaded.url){
        try{await catalogApi.deleteUploadedImage(previous);}catch{/* Best-effort cleanup; record save is still safe. */}
      }
    }catch(reason){setError(uploadError(reason));}
    finally{setBusy(false);}
  }
  async function remove(){
    if(!value||!window.confirm('Remove this image when the record is saved?'))return;
    setError('');setMessage('Image removed. Save the record to apply it.');setPreview('');
    if(objectUrl.current){URL.revokeObjectURL(objectUrl.current);objectUrl.current='';}
    if(temporaryUrl===value){
      try{await catalogApi.deleteUploadedImage(value);}catch(reason){setError(uploadError(reason));return;}
      onTemporaryChange(undefined);
    }
    onChange('');
  }
  function urlChanged(next:string){
    setError('');setMessage('');setPreview('');
    if(temporaryUrl&&next!==temporaryUrl){
      void catalogApi.deleteUploadedImage(temporaryUrl).catch(()=>{});
      onTemporaryChange(undefined);
    }
    onChange(next);
  }
  const shown=preview||value;
  return <fieldset className="adm-image-field adm-field-wide" disabled={disabled||uploading}>
    <legend>Catalog image</legend>
    {shown?<CatalogImage className="adm-image-preview" src={shown} fallback={kind==='giving'?'/images/diya.webp':'/images/devotional-hero.webp'} alt="Selected catalog preview"/>:<div className="adm-image-empty"><ImagePlus aria-hidden="true"/><span>No image selected</span></div>}
    <div className="adm-image-controls">
      <label className="adm-button adm-secondary adm-upload-button"><ImagePlus aria-hidden="true"/>{uploading?'Uploading…':value?'Replace upload':'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>void select(event)} disabled={disabled||uploading}/></label>
      {value&&<button type="button" className="adm-button adm-danger" onClick={()=>void remove()} disabled={disabled||uploading}><Trash2 aria-hidden="true"/>Remove</button>}
    </div>
    <small>JPEG, PNG or WebP. Maximum 8 MiB. Uploading does not save the catalog record.</small>
    <label className="adm-field" htmlFor={`catalog-${kind}-image-url`}><span>Image URL or asset path</span><input id={`catalog-${kind}-image-url`} value={value} maxLength={2000} onChange={event=>urlChanged(event.target.value)} placeholder="https://… or /images/…"/></label>
    {message&&<p className="adm-image-success" role="status">{message}</p>}
    {validationError&&<p className="adm-error" role="alert">{validationError}</p>}
    {error&&<p className="adm-error" role="alert">{error}</p>}
  </fieldset>;
}
