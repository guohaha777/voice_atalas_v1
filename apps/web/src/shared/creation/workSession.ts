// The work being made in this visit: the sound units handed over from 声音诞生, the 万物声场 arrangement and the
// 万物成曲 settings (background layer, textbook inspiration).
// In memory only, like the source archive: nothing is uploaded or persisted. A storage / server adapter replaces this
// behind the page's repository port; pages never read it directly except through that port and the app hand-off.
import {ARRANGEMENT_CONTRACT_VERSION,ARRANGEMENT_MAX_UNITS,DEFAULT_ROWS,DEFAULT_SPAN_SECONDS,parseArrangement} from '@wanwu-v2/contracts/arrangement';
import type {Arrangement} from '@wanwu-v2/contracts/arrangement';
import type {SoundSource,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {DEFAULT_COMPOSE_SETTINGS,parseComposeSettings} from '@wanwu-v2/contracts/work';
import type {ComposeSettings,SavedWork} from '@wanwu-v2/contracts/work';
import {newId} from './ids.ts';

/** Result of keeping something through a repository port. `session` means kept for this visit only — never shown as saved. */
export type SaveResult={status:'session'}|{status:'saved';version:string}|{status:'failed'};
export type AddUnitResult={status:'added';unit:SoundUnitDraft}|{status:'full'};

export class WorkSession{
 private arrangement:Arrangement|null=null;
 private composeSettings:ComposeSettings=DEFAULT_COMPOSE_SETTINGS;
 private sources=new Map<string,SoundSource>();
 private listeners=new Set<()=>void>();

 current=():Arrangement|null=>this.arrangement;
 settings=():ComposeSettings=>this.composeSettings;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 /** Provenance of a unit's source, kept so later steps can trace and play it. */
 source(id:string){return this.sources.get(id)??null;}

 /** The child's own work; an untouched example arrangement does not count as one. */
 private own(){return this.arrangement?.origin==='child'?this.arrangement:null;}

 /** Marker number for the next sound made in 声音诞生: the first index not used in this work. */
 nextMarkerIndex(){const work=this.own();return work?this.nextFree(work):0;}

 /** Hand-off from 声音诞生. A clashing marker index moves to the next free one so every sound stays distinct. */
 addUnit(unit:SoundUnitDraft,source:SoundSource|null,now=new Date()):AddUnitResult{
  const work=this.own()??{version:ARRANGEMENT_CONTRACT_VERSION,id:newId('work'),units:[],events:[],rows:DEFAULT_ROWS,spanSeconds:DEFAULT_SPAN_SECONDS,mood:null,origin:'child' as const,updatedAt:now.toISOString()};
  if(work.units.length>=ARRANGEMENT_MAX_UNITS)return {status:'full'};
  const markerIndex=work.units.some(item=>item.markerIndex===unit.markerIndex)?this.nextFree(work):unit.markerIndex;
  const added={...unit,markerIndex};
  if(source)this.sources.set(source.id,source);
  this.arrangement={...work,units:[...work.units,added],updatedAt:now.toISOString()};
  this.emit();
  return {status:'added',unit:added};
 }

 /** Stores the page's arrangement after validating it, so a broken state is never kept. */
 save(arrangement:Arrangement,sources:readonly SoundSource[]=[]){
  if(!parseArrangement(arrangement))return false;
  for(const source of sources)this.sources.set(source.id,source);
  this.arrangement=arrangement;this.emit();
  return true;
 }

 /** 万物成曲 settings for the current work; invalid settings are refused. */
 saveSettings(settings:ComposeSettings){
  if(!parseComposeSettings(settings))return false;
  this.composeSettings=settings;this.emit();
  return true;
 }

 /** Reopen a work from the shelf as the current work (its arrangement and settings). */
 open(work:SavedWork){
  this.arrangement=work.arrangement;this.composeSettings=work.settings;this.emit();
 }

 /** 再来一首: start a new, empty work. Recordings stay in the source archive; shelved works stay on the shelf. */
 reset(){
  this.arrangement=null;this.composeSettings=DEFAULT_COMPOSE_SETTINGS;this.emit();
 }

 private nextFree(work:Arrangement){
  const used=new Set(work.units.map(unit=>unit.markerIndex));
  let index=0;while(used.has(index))index++;
  return index;
 }
 private emit(){for(const listener of this.listeners)listener();}
}
export const workSession=new WorkSession();
