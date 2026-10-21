'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {catalogApi,imageOwnerSlug,type GivingCategoryRecord} from '../lib/catalog-api';
import {catalogErrorMessage} from '../lib/catalog-ui';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './ui/dialog';
import {AdminImageField} from './admin-image-field';

export function GivingCategoryField({value,onChange,optionalLabel='Unassigned (legacy)'}:{value:string;onChange:(id:string)=>void;optionalLabel?:string}){
 const [rows,setRows]=useState<GivingCategoryRecord[]>([]),[error,setError]=useState('');
 useEffect(()=>{let current=true;catalogApi.adminGivingCategories().then(rows=>{if(current)setRows(rows)}).catch(reason=>{if(current)setError(catalogErrorMessage(reason))});return()=>{current=false}},[]);
 return <label className="adm-field"><span>Giving category</span><select value={value} onChange={e=>onChange(e.target.value)}><option value="">{optionalLabel}</option>{rows.map(row=><option key={row._id} value={row._id}>{row.name}{row.status==='inactive'?' (inactive)':''}</option>)}</select>{error&&<small role="alert">{error}</small>}</label>;
}
type Values={name:string;slug:string;description:string;image:string;status:'active'|'inactive';displayOrder:number};
const empty:Values={name:'',slug:'',description:'',image:'',status:'active',displayOrder:0};
export function GivingCategoryManagement(){
 const [rows,setRows]=useState<GivingCategoryRecord[]>([]),[error,setError]=useState(''),[message,setMessage]=useState(''),[loading,setLoading]=useState(true);
 const [editor,setEditor]=useState<GivingCategoryRecord|null|undefined>(),[values,setValues]=useState<Values>(empty),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[temporary,setTemporary]=useState<string>();
 const load=useCallback(async()=>{setLoading(true);try{setRows(await catalogApi.adminGivingCategories())}catch(reason){setError(catalogErrorMessage(reason))}finally{setLoading(false)}},[]);
 useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer)},[load]);
 const change=(key:keyof Values,value:string|number)=>setValues(row=>({...row,[key]:value}));
 function open(row:GivingCategoryRecord|null){setEditor(row);setError('');setTemporary(undefined);setValues(row?{name:row.name,slug:row.slug,description:row.description,image:row.image,status:row.status,displayOrder:row.displayOrder}:{...empty})}
 async function save(event:FormEvent){event.preventDefault();if(busy||uploading)return;if(!values.name.trim()){setError('Enter a category name.');return}setBusy(true);setError('');try{await catalogApi.saveGivingCategory({...values,slug:values.slug||values.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')},editor?._id);setTemporary(undefined);setEditor(undefined);setMessage('Category saved.');await load()}catch(reason){setError(catalogErrorMessage(reason))}finally{setBusy(false)}}
 async function close(){if(busy||uploading)return;if(temporary)setError('Uploaded image retained for recovery. Reuse its URL if needed.');setEditor(undefined)}
 async function remove(row:GivingCategoryRecord){if(!window.confirm('Delete unassigned category '+row.name+'? Referenced categories cannot be deleted.'))return;setBusy(true);try{await catalogApi.deleteGivingCategory(row._id);await load();setMessage('Category deleted.')}catch(reason){setError(catalogErrorMessage(reason))}finally{setBusy(false)}}
 return <><div className="adm-page-heading"><div><h1>Giving Categories</h1><p>Manage category content, order and availability. Assigned Giving records are preserved.</p></div><button className="adm-button" onClick={()=>open(null)}>Add Category</button></div>{message&&<p role="status">{message}</p>}{error&&editor===undefined&&<p className="adm-error" role="alert">{error}</p>}<section className="adm-surface">{loading?<p role="status">Loading categories…</p>:!rows.length?<p>No categories yet. The approved migration must be executed separately.</p>:<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Name</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>{rows.map(row=><tr key={row._id}><td>{row.name}<small>{row.slug}</small></td><td>{row.status}</td><td>{row.displayOrder}</td><td><button className="adm-button adm-secondary" onClick={()=>open(row)}>Edit {row.name}</button><button className="adm-button adm-danger" disabled={busy} onClick={()=>void remove(row)}>Delete {row.name}</button></td></tr>)}</tbody></table></div>}</section>
 {editor!==undefined&&<Dialog open onOpenChange={open=>{if(!open)void close()}}><DialogContent className="admin-modal"><DialogTitle>{editor?'Edit':'Add'} Giving Category</DialogTitle><DialogDescription>Save to apply changes. Categories with active Giving cannot be deactivated.</DialogDescription><form onSubmit={save}><div className="adm-editor-grid">
 <label className="adm-field"><span>Name</span><input required maxLength={160} value={values.name} onChange={e=>change('name',e.target.value)}/></label>
 <label className="adm-field"><span>Slug (automatic if empty)</span><input pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} value={values.slug} onChange={e=>change('slug',e.target.value)}/></label>
 <label className="adm-field adm-field-wide"><span>Description</span><textarea maxLength={10000} value={values.description} onChange={e=>change('description',e.target.value)}/></label>
 <AdminImageField kind="categories" slug={imageOwnerSlug(values.slug||values.name)} value={values.image} onChange={value=>change('image',value)} temporaryUrl={temporary} onTemporaryChange={setTemporary} onBusyChange={setUploading} disabled={busy}/>
 <label className="adm-field"><span>Status</span><select value={values.status} onChange={e=>change('status',e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
 <label className="adm-field"><span>Display order</span><input type="number" required min={0} max={100000} step={1} value={values.displayOrder} onChange={e=>change('displayOrder',Number(e.target.value))}/></label></div>
 {error&&<p className="adm-error" role="alert">{error}</p>}<div className="adm-modal-actions"><button className="adm-button adm-secondary" type="button" disabled={busy||uploading} onClick={()=>void close()}>Cancel</button><button className="adm-button" disabled={busy||uploading}>{uploading?'Uploading…':busy?'Saving…':'Save Category'}</button></div></form></DialogContent></Dialog>}
 </>;
}
