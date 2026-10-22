import type {CreationEntry,CreationEntryResult} from '../../../app/navigation';

/** Dialog-local choice. `unavailable` remembers which entry the app reported as not yet open. */
export type CreationEntryState={selected:CreationEntry|null;unavailable:CreationEntry|null};
export type CreationEntryAction={type:'select';entry:CreationEntry}|{type:'resolved';entry:CreationEntry;result:CreationEntryResult};
export const initialCreationEntry:CreationEntryState={selected:null,unavailable:null};

export function creationEntryReducer(state:CreationEntryState,action:CreationEntryAction):CreationEntryState{
 switch(action.type){
  case 'select':return state.selected===action.entry?state:{selected:action.entry,unavailable:null};
  case 'resolved':
   if(action.entry!==state.selected)return state;
   return {...state,unavailable:action.result.status==='unavailable'?action.entry:null};
 }
}

export function canContinue(state:CreationEntryState){return state.selected!==null&&state.unavailable!==state.selected;}
