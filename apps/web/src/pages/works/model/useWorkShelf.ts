import {useSyncExternalStore} from 'react';
import type {SavedWork} from '@wanwu-v2/contracts/work';
import {mockShelfRepository} from '../services/shelfRepository';
import type {ShelfRepository} from '../services/shelfRepository';

/**
 * The shelf as a live list (this visit's works, newest first) plus opening one. Opening would replace a current piece
 * that is the child's own, has sounds and is not on the shelf in its current form — the page asks first in that case.
 */
export function useWorkShelf(repository:ShelfRepository=mockShelfRepository){
 const works=useSyncExternalStore(repository.subscribe,repository.list);
 const current=useSyncExternalStore(repository.subscribe,repository.currentId);
 return {
  works,currentId:current,
  /** True when opening `work` would lose an unsaved current piece. */
  wouldReplace:(work:SavedWork)=>repository.hasUnsavedCurrent()&&repository.currentId()!==work.id,
  open:(work:SavedWork)=>repository.open(work),
 };
}
