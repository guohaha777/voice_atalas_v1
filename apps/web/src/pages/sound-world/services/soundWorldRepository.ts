// Repository port for 万物声场. The page only talks to this interface; today it is backed by mock examples and the
// in-memory work of this visit. A server adapter implements the same interface later — the page won't change.
//
// Intended server endpoints (not implemented; listed so the adapter has a target, the server owns auth and visibility):
//   GET  /api/v1/works/current/arrangement            → Arrangement (validated with parseArrangement)
//   PUT  /api/v1/works/{workId}/arrangement           ← Arrangement, If-Match: updatedAt → {status:'saved',version}
//   GET  /api/v1/sound-units?scope=mine|class|public  → SoundUnitDraft[] (server filters by account and visibility)
import type {Arrangement} from '@wanwu-v2/contracts/arrangement';
import type {SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {newId} from '../../../shared/creation/ids';
import {workSession} from '../../../shared/creation/workSession';
import {exampleArrangement,exampleUnit,exampleUnitSounds} from '../config/examples';

export type LibraryScope='example'|'mine'|'class'|'public';
export const libraryScopes:readonly LibraryScope[]=['example','mine','class','public'];
/** `needs-account`: class spaces need teacher sign-in; `needs-review`: public sounds need review and licensing. */
export type ScopeResult={status:'ready';units:SoundUnitDraft[]}|{status:'unavailable';reason:'needs-account'|'needs-review'};
/** `session` means kept for this visit only — never shown as saved. */
export type SaveResult={status:'session'}|{status:'saved';version:string}|{status:'failed'};

export type SoundWorldRepository={
 load():Promise<Arrangement>;
 save(arrangement:Arrangement):Promise<SaveResult>;
 scope(scope:LibraryScope):Promise<ScopeResult>;
};

export const mockSoundWorldRepository:SoundWorldRepository={
 // The child's own work if there is one this visit; otherwise the example field.
 async load(){return workSession.current()??exampleArrangement(newId('work'),new Date());},
 async save(arrangement){return workSession.save(arrangement)?{status:'session'}:{status:'failed'};},
 async scope(scope){
  switch(scope){
   case 'example':return {status:'ready',units:exampleUnitSounds.map(sound=>exampleUnit(sound,0))};
   case 'mine':return {status:'ready',units:workSession.current()?.units.filter(unit=>unit.input!=='example-preset')??[]};
   case 'class':return {status:'unavailable',reason:'needs-account'};
   case 'public':return {status:'unavailable',reason:'needs-review'};
  }
 },
};
