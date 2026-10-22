import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {canContinue,creationEntryReducer,initialCreationEntry} from '../src/pages/start/model/creationEntry.ts';

const root=path.resolve(import.meta.dirname,'../../..');
const readJson=(file:string)=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));

test('nothing is preselected; continue unlocks only after a choice',()=>{
 assert.equal(initialCreationEntry.selected,null);
 assert.equal(canContinue(initialCreationEntry),false);
 const chosen=creationEntryReducer(initialCreationEntry,{type:'select',entry:'card'});
 assert.equal(chosen.selected,'card');
 assert.equal(canContinue(chosen),true);
});
test('an unopened destination blocks that entry until another one is chosen',()=>{
 let state=creationEntryReducer(initialCreationEntry,{type:'select',entry:'upload'});
 state=creationEntryReducer(state,{type:'resolved',entry:'upload',result:{status:'unavailable'}});
 assert.equal(state.unavailable,'upload');
 assert.equal(canContinue(state),false);
 state=creationEntryReducer(state,{type:'select',entry:'library'});
 assert.deepEqual(state,{selected:'library',unavailable:null});
 assert.equal(canContinue(state),true);
});
test('a late result for a previous choice does not mark the current one unavailable',()=>{
 const state=creationEntryReducer(initialCreationEntry,{type:'select',entry:'library'});
 assert.equal(creationEntryReducer(state,{type:'resolved',entry:'card',result:{status:'unavailable'}}),state);
});
test('re-selecting the same entry keeps the state object',()=>{
 const state=creationEntryReducer(initialCreationEntry,{type:'select',entry:'card'});
 assert.equal(creationEntryReducer(state,{type:'select',entry:'card'}),state);
});
test('start artwork ships compressed derivatives only, inside budget, for every entry',()=>{
 const recipe=readJson('docs/assets/start-recipe.json');
 const manifest=readJson('apps/web/src/pages/start/config/start-assets.generated.json');
 for(const id of ['start-card','start-upload','start-library','start-heading','corner-pond-left','corner-fern-right']){
  const asset=manifest.assets[id];
  assert.ok(asset,id);
  assert.match(asset.variants.mobile.url,/^\/media\/start\/mobile\/[a-z-]+\.[0-9a-f]{10}\.webp$/);
  assert.match(asset.variants.desktop.url,/^\/media\/start\/desktop\/[a-z-]+\.[0-9a-f]{10}\.webp$/);
  assert.match(asset.variants.fallback.url,/^\/media\/start\/fallback\/[a-z-]+\.[0-9a-f]{10}\.png$/);
  for(const tier of ['mobile','desktop','fallback'])assert.ok(fs.existsSync(path.join(root,'apps/web/public',asset.variants[tier].url)),asset.variants[tier].url);
 }
 for(const tier of ['mobile','desktop','fallback'])assert.ok(manifest.totals[tier]<=recipe.budgets[tier],tier);
});
