import {useCallback,useEffect,useMemo,useReducer,useRef,useState} from 'react';
import type {SpanSeconds} from '@wanwu-v2/contracts/arrangement';
import type {Inspiration} from '@wanwu-v2/contracts/work';
import {mockInspirationCatalog} from '../../../shared/inspiration/catalog';
import type {InspirationCatalog,InspirationEntry} from '../../../shared/inspiration/catalog';
import type {Instrument} from '../config/backgrounds';
import {mockBackgroundLibrary} from '../services/backgroundLibrary';
import type {BackgroundLibrary} from '../services/backgroundLibrary';
import {mockComposeRepository} from '../services/composeRepository';
import type {ComposeRepository} from '../services/composeRepository';
import {composeReducer,initialCompose,isShelved,shelfEntry} from './composeState';
import type {ComposeNoticeKey} from './composeState';
import {findDiscoveries} from './discoveries';
import {scoreLayout} from './scoreLayout';
import {useBackgroundMusic} from './useBackgroundMusic';
import {usePiecePlayback} from './usePiecePlayback';

/** 万物成曲: listen to the work as a piece, set its length, inspiration and background, then put it on the shelf.
 *  The playback clock lives in usePiecePlayback and the background music in useBackgroundMusic. */
export function useCompose(repository:ComposeRepository=mockComposeRepository,backgrounds:BackgroundLibrary=mockBackgroundLibrary,inspirations:InspirationCatalog=mockInspirationCatalog){
 const [state,dispatch]=useReducer(composeReducer,initialCompose);
 const [shelfCount,setShelfCount]=useState(0);
 const [instruments,setInstruments]=useState<readonly Instrument[]>([]);
 const [comingInstruments,setComing]=useState<readonly string[]>([]);
 const [entries,setEntries]=useState<readonly InspirationEntry[]>([]);
 const [suggesting,setSuggesting]=useState(false);
 const latest=useRef(state);latest.current=state;
 const notify=useCallback((key:ComposeNoticeKey,tone:'info'|'error'='error')=>dispatch({type:'notice',notice:{tone,key}}),[]);

 useEffect(()=>{
  let live=true;
  void Promise.all([repository.load(),backgrounds.list(),inspirations.list()]).then(([current,library,catalogue])=>{
   if(!live)return;
   setInstruments(library.instruments);setComing(library.coming);setEntries(catalogue.entries);setShelfCount(current.shelfCount);
   dispatch({type:'loaded',arrangement:current.arrangement,settings:current.settings,shelved:current.shelved});
  });
  return()=>{live=false;};
 },[repository,backgrounds,inspirations]);

 // Length changes go back to the same work 万物声场 edits; an untouched example is not stored.
 useEffect(()=>{
  const arrangement=state.arrangement;
  if(arrangement?.origin==='child')void repository.saveArrangement(arrangement);
 },[state.arrangement,repository]);
 useEffect(()=>{if(latest.current.arrangement)void repository.saveSettings(state.settings);},[state.settings,repository]);

 // ----- derived: score, background, discoveries -----
 const layout=useMemo(()=>state.arrangement?scoreLayout(state.arrangement):null,[state.arrangement]);
 const music=useBackgroundMusic(state.settings,state.arrangement?.mood??null,instruments,entries);
 const discoveries=useMemo(()=>state.arrangement?findDiscoveries(state.arrangement):[],[state.arrangement]);
 const playback=usePiecePlayback(latest,notify,music,layout);

 // ----- settings -----
 const setSpan=(spanSeconds:SpanSeconds)=>{playback.reset();dispatch({type:'span',spanSeconds,now:new Date()});};
 const setInspiration=(next:Inspiration)=>dispatch({type:'inspiration',inspiration:next});
 const suggestRequest=useRef<AbortController|null>(null);
 /** 帮我找找 needs a connected model; until then it says so. */
 const suggest=async()=>{
  const work=latest.current.arrangement;
  if(!inspirations.suggestAvailable||!work)return notify('suggest-off','info');
  suggestRequest.current?.abort();const controller=new AbortController();suggestRequest.current=controller;
  setSuggesting(true);
  try{
   const id=await inspirations.suggest(work,controller.signal);
   if(!controller.signal.aborted&&id&&entries.some(item=>item.id===id))setInspiration({kind:'textbook',entryId:id});
  }catch{/* nothing chosen; the child can pick from the list */}
  finally{if(suggestRequest.current===controller){suggestRequest.current=null;setSuggesting(false);}}
 };

 // ----- shelf and sharing -----
 /** Whether this piece can go on the shelf; says why not (empty, or the untouched example). */
 const canSave=()=>{
  const arrangement=latest.current.arrangement;
  if(!arrangement?.events.length){notify('need-event','info');return false;}
  if(arrangement.origin==='example'){notify('example-save','info');return false;}
  return true;
 };
 const saveWork=async(title:string)=>{
  const current=latest.current;
  if(!canSave())return false;
  const work=shelfEntry(current,title,new Date());
  if(!work)return false;
  const result=await repository.saveWork(work);
  if(result.status==='failed'){notify('save-failed');return false;}
  if(!current.shelved)setShelfCount(count=>count+1);
  dispatch({type:'saved',work});
  return true;
 };
 const share=async()=>{const result=await repository.share(latest.current.arrangement?.id??'');if(result.status==='unavailable')notify('share-off','info');};
 const startNew=async()=>{playback.pause();await repository.startNew();};

 return {
  state,layout,discoveries,instruments,comingInstruments,chosen:music.chosen,entries,entry:music.entry,
  playing:playback.playing,preparing:playback.preparing,ended:playback.ended,suggesting,suggestAvailable:inspirations.suggestAvailable,
  /** The one playback time (seconds) the playhead, progress bar and highlights read. */
  now:playback.now,total:playback.total,sounding:playback.sounding,
  shelved:isShelved(state),shelfCount,
  togglePlay:playback.togglePlay,restart:playback.restart,playFrom:playback.playFrom,scrubTo:playback.scrubTo,endScrub:playback.endScrub,
  setSpan,setInspiration,suggest,
  setBackgroundEnabled:(enabled:boolean)=>dispatch({type:'background-enabled',enabled}),
  setBackgroundVolume:(volume:number)=>dispatch({type:'background-volume',volume}),
  toggleInstrument:(id:string)=>dispatch({type:'instrument',id}),
  canSave,saveWork,share,startNew,
  clearNotice:()=>dispatch({type:'notice',notice:null}),
 };
}
export type Compose=ReturnType<typeof useCompose>;
