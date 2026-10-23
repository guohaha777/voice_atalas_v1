// Sources captured on this device during this visit (recordings, picked files), with their provenance.
// In memory only: nothing is uploaded or persisted. A storage / server adapter can replace this behind the same shape.
import type {SoundSource} from '@wanwu-v2/contracts/sound';

type Entry={source:SoundSource;buffer:AudioBuffer};
export type ArchiveSnapshot=readonly SoundSource[];

export class SessionSourceArchive{
 private entries=new Map<string,Entry>();
 private snapshot:ArchiveSnapshot=[];
 private listeners=new Set<()=>void>();
 save(source:SoundSource,buffer:AudioBuffer){this.entries.set(source.id,{source,buffer});this.emit();}
 update(source:SoundSource){const entry=this.entries.get(source.id);if(!entry)return;this.entries.set(source.id,{...entry,source});this.emit();}
 buffer(id:string){return this.entries.get(id)?.buffer??null;}
 list=():ArchiveSnapshot=>this.snapshot;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 /** Most recent first, distinct, non-empty values of a provenance field — for one-tap reuse. */
 recent(field:'recordedBy'|'place'|'group'){
  const seen=new Set<string>();
  for(const source of [...this.snapshot].reverse()){const value=source.provenance[field];if(value)seen.add(value);}
  return [...seen];
 }
 private emit(){this.snapshot=[...this.entries.values()].map(entry=>entry.source);for(const listener of this.listeners)listener();}
}
export const sessionArchive=new SessionSourceArchive();
