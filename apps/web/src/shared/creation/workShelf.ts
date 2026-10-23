// 作品书架 for this visit: works the child put on the shelf from 万物成曲. In memory only — a refresh empties it, and
// nothing is uploaded or saved to an account. A server adapter replaces this behind 万物成曲's repository port and the
// shelf page's port; pages never treat this as saved.
import {parseSavedWork} from '@wanwu-v2/contracts/work';
import type {SavedWork} from '@wanwu-v2/contracts/work';

export type ShelfSnapshot=readonly SavedWork[];

export class WorkShelf{
 private works:SavedWork[]=[];
 private listeners=new Set<()=>void>();
 /** Newest first. */
 list=():ShelfSnapshot=>this.works;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 get(id:string){return this.works.find(work=>work.id===id)??null;}
 /** Puts a validated work on the shelf; saving the same work again replaces it and moves it to the front. */
 put(work:SavedWork){
  if(!parseSavedWork(work))return false;
  this.works=[work,...this.works.filter(item=>item.id!==work.id)];
  this.emit();
  return true;
 }
 private emit(){for(const listener of this.listeners)listener();}
}
export const workShelf=new WorkShelf();
