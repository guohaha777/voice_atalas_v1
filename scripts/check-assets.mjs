import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicRoot=path.join(root,'apps/web/public');
const entries=JSON.parse(await fs.readFile(path.join(root,'docs/assets/release-manifest.json'),'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(root,'apps/web/src/pages/home/config/home-assets.generated.json'),'utf8'));
let count=0;
for(const item of entries){
 const bytes=await fs.readFile(path.join(root,item.path));
 if(bytes.length!==item.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw new Error(`Asset changed without updating release manifest: ${item.path}`);
 if(item.tier==='audio'&&bytes.length>=50*1024)throw new Error('Audio clip exceeds budget: '+item.id);
 count++;
}
for(const [tier,budget] of [['mobile',400*1024],['desktop',700*1024],['fallback',400*1024]]){
 let sum=0;
 for(const asset of manifest.layers){
  const item=asset.variants[tier];const stat=await fs.stat(path.join(publicRoot,item.url));
  if(stat.size!==item.bytes)throw new Error('Stale runtime manifest: '+item.url);sum+=stat.size;
 }
 if(sum>budget)throw new Error(tier+' budget exceeded');
 console.log(`${tier}: ${sum} bytes / ${budget}`);
}
async function walk(dir){const all=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())all.push(...await walk(file));else all.push(file);}return all;}
for(const file of await walk(publicRoot)){
 if(/masters|assets-source|imagegen|approved-v12|公测计划|homepage-lab|\.ogg$|\.oga$/i.test(file))throw new Error('Source or reference file in public build: '+file);
}
if(manifest.layers.length!==13)throw new Error('Expected 13 layers');
console.log(`Validated ${count} release resources. Source artwork and recordings remain outside public/.`);
