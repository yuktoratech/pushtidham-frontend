import {createHash} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

export const categoryIds={'daily-seva':'5cd141e27aa548b08e859ec1','general-donation':'34182ed239cb95df622288cc','dolotsav':'013ed2dcfa609d03285d1ddd','pragatya-divas-maha-bhog':'c0e46f2266fce999bc02d5cc','nand-mahotsav':'dd9b046182853ea6447d1fb2','adhikmas-hindola':'ebc31477cbc3b20077006a71','annakut':'3c61fb0cc4df85b97c1eec99'};
const approved=value=>['approved','client-approved'].includes(value);

const keyPattern=/^(?:branding|categories|giving|events|site|home-slider)\/[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*$/;
const requiredCategories=['daily-seva','general-donation','dolotsav','pragatya-divas-maha-bhog','nand-mahotsav','adhikmas-hindola','annakut'];
const add=(list,code,message)=>list.push({code,message});

export async function validateR2Manifest(manifest,publicRoot){
 const errors=[],blockers=[],warnings=[],sources=[];
 if(manifest?.version!==2)add(blockers,'SCHEMA_VERSION','Version 2 approval and mapping fields are required; update the current version 1 planning manifest.');
 if(!Array.isArray(manifest?.assets))add(errors,'ASSETS_REQUIRED','Manifest assets must be an array.');
 const assets=Array.isArray(manifest?.assets)?manifest.assets:[],keys=new Map(),assignments=new Map();
 for(const [index,asset] of assets.entries()){
  const label=String(asset?.source??`asset[${index}]`);
  if(typeof asset?.source!=='string'||!asset.source.startsWith('/')||asset.source.includes('..')||asset.source.includes('\\')){add(errors,'SOURCE_PATH',`${label}: source must be an absolute public path without traversal.`);continue;}
  const file=resolve(publicRoot,`.${asset.source.replaceAll('/',sep)}`);
  if(!file.startsWith(resolve(publicRoot)+sep)){add(errors,'SOURCE_ESCAPE',`${label}: source escapes the public asset directory.`);continue;}
  let bytes;
  try{bytes=await readFile(file)}catch{add(errors,'SOURCE_MISSING',`${label}: source file is missing.`);}
  if(bytes){
   const digest=createHash('sha256').update(bytes).digest('hex');
   const size=(await stat(file)).size;
   const sourceResult={source:asset.source,actualBytes:size,actualSha256:digest,verifiedBytes:size===asset.bytes,verifiedSha256:digest===asset.sha256};sources.push(sourceResult);
   if(size!==asset.bytes)add(errors,'SIZE_MISMATCH',`${label}: recorded byte size does not match.`);
   if(digest!==asset.sha256)add(errors,'CHECKSUM_MISMATCH',`${label}: recorded SHA-256 does not match.`);
   if(asset.assetCategory==='category-artwork'){
    try{
     const metadata=await sharp(bytes).metadata();await sharp(bytes).raw().toBuffer();
     if(metadata.format!=='webp'||asset.mimeType!=='image/webp'||!asset.source.endsWith('.webp'))add(errors,'CATEGORY_FORMAT',`${label}: WebP is required.`);
     if(metadata.width!==1200||metadata.height!==800||asset.width!==1200||asset.height!==800)add(errors,'CATEGORY_DIMENSIONS',`${label}: 1200 x 800 is required.`);
    }catch{add(errors,'CATEGORY_DECODE',`${label}: image cannot be decoded.`);}
   }
  }
  if(asset.assetCategory==='category-artwork'){
   if(!categoryIds[asset.categorySlug]||categoryIds[asset.categorySlug]!==asset.categoryId)add(errors,'CATEGORY_ID',`${label}: category ID does not match the approved slug.`);
   if(asset.proposedKey!==`categories/${asset.categorySlug}/${asset.categorySlug}-${asset.sha256}.webp`)add(errors,'CATEGORY_KEY',`${label}: immutable key must use the full content hash.`);
   const assignment=asset.recordAssignments;
   if(!Array.isArray(assignment)||assignment.length!==1||assignment[0].collection!=='givingcategories'||assignment[0].id!==asset.categoryId||assignment[0].field!=='image')add(errors,'CATEGORY_ASSIGNMENT',`${label}: only the matching category image may be assigned.`);
   const mappings=manifest.atlasImageMappings?.filter(row=>row.newAssetId===asset.id);
   if(!mappings||mappings.length!==1||mappings[0].id!==asset.categoryId||mappings[0].collection!=='givingcategories'||mappings[0].field!=='image'||mappings[0].oldValue!==''||asset.currentAtlasImage!==''||asset.rollback?.oldReference!=='')add(errors,'CATEGORY_PREIMAGE',`${label}: category mapping and empty rollback preimage must agree.`);
  }
  if(asset.action==='keep-local'){
   if(asset.proposedKey!==null)add(errors,'KEEP_LOCAL_KEY',`${label}: keep-local assets must not have an R2 target.`);
  }else if(asset.action==='exclude'||asset.action==='preserve-approved-original-no-switch'){
   if(asset.action==='exclude'&&(!asset.exclusionReason||typeof asset.exclusionReason!=='string'))add(blockers,'EXCLUSION_REASON',`${label}: excluded assets need a reason.`);
  }else if(typeof asset.proposedKey!=='string'||!keyPattern.test(asset.proposedKey)||asset.proposedKey.split('/').some(part=>part==='.'||part==='..'))add(errors,'TARGET_KEY',`${label}: destination key is missing or outside the safe allowlist.`);
  else {const old=keys.get(asset.proposedKey);if(old)add(errors,'DUPLICATE_TARGET',`${label}: destination duplicates ${old}.`);else keys.set(asset.proposedKey,label);}
  if(!['keep-local','exclude','preserve-approved-original-no-switch'].includes(asset.action)){
   if(!['branding','category-artwork','giving','event-cover','event-gallery','shared-site','static-illustration','slider'].includes(asset.assetCategory))add(blockers,'ASSET_CATEGORY',`${label}: an explicit asset category is required.`);
   if(!approved(asset.approvalStatus))add(blockers,'ASSET_APPROVAL',`${label}: client approval is missing.`);
   if(asset.ownershipStatus!=='confirmed'&&!(asset.usagePermission==='client-approved-for-website-use'&&asset.ownership==='Pushtidham project artwork, client-approved for website use'))add(blockers,'OWNERSHIP',`${label}: ownership or website-use permission confirmation is missing.`);
   if(!Array.isArray(asset.consumers)||asset.consumers.length===0)add(blockers,'CONSUMERS',`${label}: intended consumers are not mapped.`);
   if(asset.rollback?.retainSource!==true||typeof asset.rollback?.oldReference!=='string')add(blockers,'ROLLBACK_METADATA',`${label}: source retention and old-reference metadata are required.`);
  }
  if(asset.recordAssignments!==undefined&&!Array.isArray(asset.recordAssignments))add(errors,'ASSIGNMENTS_SHAPE',`${label}: recordAssignments must be an array.`);
  for(const row of Array.isArray(asset.recordAssignments)?asset.recordAssignments:[]){
   if(!row.collection||!row.id||!row.field||!asset.proposedKey)add(errors,'ASSIGNMENT_SHAPE',`${label}: a record assignment needs collection, ID, field, and destination.`);
   const identity=`${row.collection}:${row.id}:${row.field}`;const prior=assignments.get(identity);
   if(prior&&prior!==asset.proposedKey)add(errors,'CONFLICTING_ASSIGNMENT',`${label}: ${identity} maps to multiple targets.`);
   else if(prior)add(errors,'DUPLICATE_ASSIGNMENT',`${label}: ${identity} is assigned more than once.`);
   else assignments.set(identity,asset.proposedKey);
  }
 }
 for(const slug of requiredCategories){
  const rows=manifest?.categoryArtwork?.filter?.(item=>item.slug===slug)??[],row=rows[0];
  if(rows.length>1)add(errors,'DUPLICATE_CATEGORY',`${slug}: duplicate category mapping.`);
  if(row?.categoryId!==undefined&&row.categoryId!==categoryIds[slug])add(errors,'CATEGORY_ID',`${slug}: incorrect category ID.`);
  if(!row||!row.assetId||!assets.some(asset=>asset.id===row.assetId)||!approved(row.approvalStatus)||!approved(row.descriptionApproval)||typeof row.description!=='string'||!row.description.trim())add(blockers,'CATEGORY_ARTWORK',`${slug}: approved category image and description are required.`);
  const asset=assets.find(asset=>asset.id===row?.assetId);
  if(asset?.assetCategory==='category-artwork'&&(asset.categorySlug!==slug||asset.categoryId!==row.categoryId))add(errors,'CATEGORY_MAPPING',`${slug}: asset and category mapping differ.`);
 }
 if(!Array.isArray(manifest?.eventGalleries)||manifest.eventGalleries.length<7||manifest.eventGalleries.some(row=>!row.eventId||!Array.isArray(row.entries)||(row.entries.length===0&&!(row.decision==='approved-empty'&&row.approvalStatus==='approved'))))add(blockers,'EVENT_GALLERIES','All seven Event galleries need approved entries or an explicit client-approved empty-gallery decision.');
 if(!Array.isArray(manifest?.atlasImageMappings)||manifest.atlasImageMappings.length===0||manifest.atlasImageMappings.some(row=>!row.collection||!row.id||!['image','gallery'].includes(row.field)||row.oldValue===undefined||!row.newAssetId))add(blockers,'ATLAS_MAPPING','Explicit collection, record ID, image field, old value and new asset mapping are required.');
 if(!Array.isArray(manifest?.excluded)||!manifest.excluded.some(row=>row.asset&&row.reason))add(blockers,'EXCLUSIONS','Unreferenced/template assets must be explicitly listed with reasons.');
 if(!Array.isArray(manifest?.protectedObjects)||!manifest.protectedObjects.some(key=>key==='home-slider/official-5ba55c13ca87a17e/')||!manifest.protectedObjects.some(key=>key.startsWith('branding/official-logo/')))add(blockers,'PROTECTED_KEYS','Homepage slider and official logo keys must be explicitly protected.');
 if(!Array.isArray(manifest?.existingObjects))add(blockers,'R2_INVENTORY','A verified read-only inventory of existing R2 keys is required before collision checks.');
 else for(const asset of assets){if(asset.proposedKey&&manifest.existingObjects.includes(asset.proposedKey))add(errors,'TARGET_EXISTS',`${asset.source}: target key already exists and must never be overwritten.`);}
 if(!manifest?.rollback?.retainOriginalObjects||!manifest?.rollback?.retainLocalSources)add(blockers,'ROLLBACK_PLAN','Rollback must retain original objects and local sources.');
 if(manifest?.databaseImages?.source)warnings.push({code:'LEGACY_MAPPING_SUMMARY',message:'Database image mapping is descriptive only; per-record mappings are still required.'});
 return {ready:errors.length===0&&blockers.length===0,errors,blockers,warnings,sourceCount:sources.length,verifiedSourceCount:sources.filter(row=>row.verifiedBytes&&row.verifiedSha256).length,proposedKeyCount:keys.size,sources};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const root=resolve(process.cwd());
 try{const manifest=JSON.parse(await readFile(resolve(root,'docs/r2-category-gallery-migration-manifest.json'),'utf8'));const result=await validateR2Manifest(manifest,resolve(root,'public'));console.log(JSON.stringify(result,null,2));if(!result.ready)process.exitCode=1;}
 catch(error){console.error(error instanceof Error?error.message:'Manifest validation failed');process.exitCode=1;}
}
