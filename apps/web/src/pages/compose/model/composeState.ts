// Pure state for 万物成曲: the arrangement the score is derived from, the settings picked here (length, background
// layer, textbook inspiration) and whether what is on screen is already on the shelf. Playback time is not here — it
// comes from the audio clock in useCompose, so the playhead, progress bar and highlights all read one time.
import {SPAN_CHOICES} from '@wanwu-v2/contracts/arrangement';
import type {Arrangement,SpanSeconds} from '@wanwu-v2/contracts/arrangement';
import {DEFAULT_COMPOSE_SETTINGS,MAX_INSTRUMENTS,WORK_CONTRACT_VERSION,cleanWorkTitle} from '@wanwu-v2/contracts/work';
import type {ComposeSettings,Inspiration,SavedWork} from '@wanwu-v2/contracts/work';
import {withSpan} from '../../../shared/creation/arrangementTiming.ts';

export type ComposeNoticeKey='need-event'|'example-save'|'suggest-off'|'share-off'|'save-failed'|'load-failed'|'no-audio'|'missing-audio'|'background-failed';
export type ComposeNotice={tone:'info'|'error';key:ComposeNoticeKey}|null;
export type ComposeLastAction='span'|'inspiration'|'saved'|null;
export type ComposeState={
 arrangement:Arrangement|null;
 settings:ComposeSettings;
 /** The version of this work on the shelf (this visit), if any. */
 shelved:SavedWork|null;
 notice:ComposeNotice;
 lastAction:ComposeLastAction;
};
export type ComposeAction=
 |{type:'loaded';arrangement:Arrangement;settings:ComposeSettings;shelved:SavedWork|null}
 |{type:'span';spanSeconds:SpanSeconds;now:Date}
 |{type:'background-enabled';enabled:boolean}
 |{type:'background-volume';volume:number}
 /** Tap an instrument: add it, or take it away if it is already chosen. */
 |{type:'instrument';id:string}
 |{type:'inspiration';inspiration:Inspiration}
 |{type:'saved';work:SavedWork}
 |{type:'notice';notice:ComposeNotice};

export const initialCompose:ComposeState={arrangement:null,settings:DEFAULT_COMPOSE_SETTINGS,shelved:null,notice:null,lastAction:null};

const sameSettings=(a:ComposeSettings,b:ComposeSettings)=>JSON.stringify(a)===JSON.stringify(b);
/** On the shelf and unchanged since: same arrangement version, same settings. */
export function isShelved(state:ComposeState){
 const {arrangement,shelved,settings}=state;
 return !!arrangement&&!!shelved&&shelved.arrangement.updatedAt===arrangement.updatedAt&&sameSettings(shelved.settings,settings);
}

export function composeReducer(state:ComposeState,action:ComposeAction):ComposeState{
 if(action.type==='loaded')return {...initialCompose,arrangement:action.arrangement,settings:action.settings,shelved:action.shelved};
 const work=state.arrangement;
 if(!work)return state;
 const background=state.settings.background;
 switch(action.type){
  case 'span':
   // Same field as 万物声场: positions stay, tails rescale, rows are re-tidied; switching makes the arrangement the child's.
   if(!SPAN_CHOICES.includes(action.spanSeconds)||action.spanSeconds===work.spanSeconds)return state;
   return {...state,arrangement:{...withSpan(work,action.spanSeconds),origin:'child',updatedAt:action.now.toISOString()},notice:null,lastAction:'span'};
  case 'background-enabled':
   return {...state,settings:{...state.settings,background:{...background,enabled:action.enabled}},notice:null,lastAction:null};
  case 'background-volume':{
   const volume=Math.round(Math.min(1,Math.max(0,action.volume))*100)/100;
   return volume===background.volume?state:{...state,settings:{...state.settings,background:{...background,volume}}};
  }
  case 'instrument':{
   // Tap to add, tap again to take away; none at all plays the background as generated. Adding one also turns the
   // layer on: the child chose to hear it.
   const has=background.instruments.includes(action.id);
   if(!has&&background.instruments.length>=MAX_INSTRUMENTS)return state;
   const instruments=has?background.instruments.filter(id=>id!==action.id):[...background.instruments,action.id];
   return {...state,settings:{...state.settings,background:{...background,instruments,enabled:has?background.enabled:true}},notice:null,lastAction:null};
  }
  case 'inspiration':
   return {...state,settings:{...state.settings,inspiration:action.inspiration},notice:null,lastAction:action.inspiration.kind==='none'?null:'inspiration'};
  case 'saved':return {...state,shelved:action.work,notice:null,lastAction:'saved'};
  case 'notice':return {...state,notice:action.notice};
 }
}

/** A shelf entry for the current state; null when the title is empty. The arrangement is stored as it is — never altered. */
export function shelfEntry(state:ComposeState,title:string,now:Date):SavedWork|null{
 const clean=cleanWorkTitle(title);
 if(!clean||!state.arrangement)return null;
 return {version:WORK_CONTRACT_VERSION,id:state.arrangement.id,title:clean,arrangement:state.arrangement,settings:state.settings,visibility:'private',savedAt:now.toISOString()};
}
