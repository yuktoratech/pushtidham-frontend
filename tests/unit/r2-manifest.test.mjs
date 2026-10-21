import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, writeFile, rm, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateR2Manifest} from '../../scripts/validate-r2-manifest.mjs';

async function artworkManifest(){return JSON.parse(await readFile(new URL('../../docs/r2-category-gallery-migration-manifest.json',import.meta.url),'utf8'));}
const publicRoot=new URL('../../public/',import.meta.url);

const categories=['daily-seva','general-donation','dolotsav','pragatya-divas-maha-bhog','nand-mahotsav','adhikmas-hindola','annakut'];
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'r2-manifest-'));await mkdir(join(root,'images'),{recursive:true});
 const bytes=Buffer.from('approved fixture image'),sha256=createHash('sha256').update(bytes).digest('hex');await writeFile(join(root,'images','sample.webp'),bytes);
 const asset={id:'sample',source:'/images/sample.webp',bytes:bytes.length,sha256,proposedKey:`site/shared/${sha256}/sample.webp`,action:'upload',assetCategory:'shared-site',approvalStatus:'approved',ownershipStatus:'confirmed',consumers:['Home'],rollback:{retainSource:true,oldReference:'/images/sample.webp'},recordAssignments:[{collection:'events',id:'event-1',field:'image'}]};
 const manifest={version:2,assets:[asset],categoryArtwork:categories.map(slug=>({slug,assetId:'sample',approvalStatus:'approved',descriptionApproval:'approved',description:'Approved category description.'})),eventGalleries:Array.from({length:7},(_,i)=>({eventId:`event-${i}`,entries:[asset.proposedKey]})),atlasImageMappings:[{collection:'events',id:'event-1',field:'image',oldValue:'/images/sample.webp',newAssetId:'sample'}],excluded:[{asset:'/file.svg',reason:'Unused template asset'}],protectedObjects:['home-slider/official-5ba55c13ca87a17e/','branding/official-logo/master/'],existingObjects:[],rollback:{retainOriginalObjects:true,retainLocalSources:true}};
 return {root,asset,manifest,cleanup:()=>rm(root,{recursive:true,force:true})};
}

test('complete approved manifest verifies source bytes and SHA-256 offline',async()=>{const f=await fixture();try{const result=await validateR2Manifest(f.manifest,f.root);assert.equal(result.ready,true);assert.equal(result.verifiedSourceCount,1)}finally{await f.cleanup()}});
test('source checksum mismatch is an error',async()=>{const f=await fixture();try{f.manifest.assets[0].sha256='0'.repeat(64);const result=await validateR2Manifest(f.manifest,f.root);assert.ok(result.errors.some(row=>row.code==='CHECKSUM_MISMATCH'));assert.equal(result.ready,false)}finally{await f.cleanup()}});
test('preserve-without-switch assets are verified locally but are not proposed uploads',async()=>{const f=await fixture();try{f.manifest.assets[0].action='preserve-approved-original-no-switch';f.manifest.assets[0].approvalStatus='pending';f.manifest.assets[0].ownershipStatus='unknown';const result=await validateR2Manifest(f.manifest,f.root);assert.equal(result.ready,true);assert.equal(result.proposedKeyCount,0)}finally{await f.cleanup()}});
test('unsafe destinations, duplicate keys, conflicting assignments, and existing-key collisions are rejected',async()=>{const f=await fixture();try{f.manifest.assets.push({...f.asset,id:'duplicate',source:'/images/sample.webp',proposedKey:'site/shared/another/sample.webp',recordAssignments:[{collection:'events',id:'event-1',field:'image'}]});const result=await validateR2Manifest(f.manifest,f.root);assert.ok(result.errors.some(row=>row.code==='CONFLICTING_ASSIGNMENT'));f.manifest.assets[1].proposedKey=f.asset.proposedKey;const duplicate=await validateR2Manifest(f.manifest,f.root);assert.ok(duplicate.errors.some(row=>row.code==='DUPLICATE_TARGET'));f.manifest.assets[0].proposedKey='events/../shared.webp';const unsafe=await validateR2Manifest(f.manifest,f.root);assert.ok(unsafe.errors.some(row=>row.code==='TARGET_KEY'));f.manifest.assets[0].proposedKey='site/shared/existing.webp';f.manifest.existingObjects.push(f.manifest.assets[0].proposedKey);const collision=await validateR2Manifest(f.manifest,f.root);assert.ok(collision.errors.some(row=>row.code==='TARGET_EXISTS'))}finally{await f.cleanup()}});
test('missing source and approval, category, gallery, and rollback data block execution',async()=>{const f=await fixture();try{f.manifest.assets[0].source='/missing.webp';f.manifest.assets[0].approvalStatus='pending';f.manifest.categoryArtwork=[];f.manifest.eventGalleries=[];f.manifest.rollback.retainOriginalObjects=false;const result=await validateR2Manifest(f.manifest,f.root);assert.ok(result.errors.some(row=>row.code==='SOURCE_MISSING'));for(const code of ['ASSET_APPROVAL','CATEGORY_ARTWORK','EVENT_GALLERIES','ROLLBACK_PLAN'])assert.ok(result.blockers.some(row=>row.code===code),code);assert.equal(result.ready,false)}finally{await f.cleanup()}});

test('seven real approved category assets decode at 1200 x 800 with exact mappings and hashes',async()=>{
 const manifest=await artworkManifest();const {fileURLToPath}=await import('node:url');
 const assets=manifest.assets.filter(asset=>asset.assetCategory==='category-artwork');
 assert.equal(assets.length,7);assert.equal(new Set(assets.map(asset=>asset.categorySlug)).size,7);
 const result=await validateR2Manifest(manifest,fileURLToPath(publicRoot));
 assert.deepEqual(result.errors,[]);assert.equal(result.verifiedSourceCount,result.sourceCount);
 assert.equal(result.ready,false);assert.equal(result.blockers.some(row=>row.code==='CATEGORY_ARTWORK'),false);
 assert.ok(result.blockers.some(row=>row.code==='R2_INVENTORY'));
 for(const asset of assets)assert.equal(asset.approvalStatus,'client-approved');
});

test('category ID, assignment, format, dimensions and rollback mismatches fail offline',async()=>{
 const {fileURLToPath}=await import('node:url');
 for(const [field,value,code] of [['categoryId','incorrect','CATEGORY_ID'],['mimeType','image/png','CATEGORY_FORMAT'],['width',1199,'CATEGORY_DIMENSIONS'],['currentAtlasImage','unexpected','CATEGORY_PREIMAGE']]){
  const manifest=await artworkManifest();manifest.assets.find(asset=>asset.assetCategory==='category-artwork')[field]=value;
  const result=await validateR2Manifest(manifest,fileURLToPath(publicRoot));assert.ok(result.errors.some(row=>row.code===code),code);
 }
 const manifest=await artworkManifest();manifest.assets.find(asset=>asset.assetCategory==='category-artwork').recordAssignments[0].field='description';
 const result=await validateR2Manifest(manifest,fileURLToPath(publicRoot));assert.ok(result.errors.some(row=>row.code==='CATEGORY_ASSIGNMENT'));
});
