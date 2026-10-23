// Repository port for 作品书架. Today: the in-memory shelf of this visit (shared/creation/workShelf) — a refresh empties
// it. Later: the child's works from the server, filtered by account and visibility on the server.
//
// Intended server endpoints (not implemented; the server owns auth and visibility):
//   GET /api/v1/works?owner=me        → SavedWork[] (validated with parseSavedWork)
//   GET /api/v1/works/{workId}        → SavedWork
import type {SavedWork} from '@wanwu-v2/contracts/work';
import {workSession} from '../../../shared/creation/workSession';
import {workShelf} from '../../../shared/creation/workShelf';
import type {ShelfSnapshot} from '../../../shared/creation/workShelf';

export type ShelfRepository={
 list():ShelfSnapshot;
 subscribe(listener:()=>void):()=>void;
 /** Id of the piece being made now (null when none). */
 currentId():string|null;
 /** The current piece is the child's own, has sounds, and its current form is not on the shelf. */
 hasUnsavedCurrent():boolean;
 /** Make a shelved work the current piece (万物成曲 then opens it). */
 open(work:SavedWork):void;
};

const subscribeBoth=(listener:()=>void)=>{
 const offShelf=workShelf.subscribe(listener),offSession=workSession.subscribe(listener);
 return()=>{offShelf();offSession();};
};

export const mockShelfRepository:ShelfRepository={
 list:workShelf.list,
 subscribe:subscribeBoth,
 currentId:()=>workSession.current()?.id??null,
 hasUnsavedCurrent(){
  const current=workSession.current();
  if(current?.origin!=='child'||!current.events.length)return false;
  const shelved=workShelf.get(current.id);
  return !shelved||shelved.arrangement.updatedAt!==current.updatedAt||JSON.stringify(shelved.settings)!==JSON.stringify(workSession.settings());
 },
 open:work=>workSession.open(work),
};
