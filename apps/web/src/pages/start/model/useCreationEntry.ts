import {useReducer} from 'react';
import type {CreationEntryIntent,CreationEntryResult} from '../../../app/navigation';
import {canContinue,creationEntryReducer,initialCreationEntry} from './creationEntry';

export function useCreationEntry(onContinue:(intent:CreationEntryIntent)=>CreationEntryResult){
 const [state,dispatch]=useReducer(creationEntryReducer,initialCreationEntry);
 const continueToEntry=()=>{
  if(!state.selected||!canContinue(state))return;
  // Only the app decides which destination is ready. No network or domain mutation here.
  dispatch({type:'resolved',entry:state.selected,result:onContinue({entry:state.selected})});
 };
 return {
  selected:state.selected,
  unavailable:state.unavailable!==null&&state.unavailable===state.selected,
  select:(entry:CreationEntryIntent['entry'])=>dispatch({type:'select',entry}),
  continueToEntry,
 };
}
