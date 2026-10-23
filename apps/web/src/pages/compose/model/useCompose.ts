import {useCallback,useEffect,useMemo,useReducer,useRef,useState} from 'react';
import type {SpanSeconds} from '@wanwu-v2/contracts/arrangement';
import type {Inspiration} from '@wanwu-v2/contracts/work';
import {audioSupported} from '../../../shared/audio/audioContext';
import {SequencePlayer} from '../../../shared/audio/SequencePlayer';
import type {SequenceVoice} from '../../../shared/audio/SequencePlayer';
import {pieceSeconds,planPlayback} from '../../../shared/creation/arrangementTiming';
import {EXAMPLE_TIMEOUT_MS} from '../../../shared/creation/exampleSounds';
import {WorkSoundBank,soundFailure} from '../../../shared/creation/workSounds';
import {mockInspirationCatalog} from '../../../shared/inspiration/catalog';
import type {InspirationCatalog,InspirationEntry,Rhythm} from '../../../shared/inspiration/catalog';
import type {Instrument} from '../config/backgrounds';
import {moodRhythm,mockBackgroundLibrary} from '../services/backgroundLibrary';
import type {BackgroundLibrary} from '../services/backgroundLibrary';
import {mockComposeRepository} from '../services/composeRepository';
import type {ComposeRepository} from '../services/composeRepository';
import {renderBackground} from './backgroundSynth';
import {composeReducer,initialCompose,isShelved,shelfEntry} from './composeState';
import type {ComposeNoticeKey} from './composeState';
import {findDiscoveries} from './discoveries';
import {scoreLayout,soundingAt} from './scoreLayout';

/** The child's sounds together: keep the sum under full scale. */
const MIX_GAIN=.8;
/** The background stays well under the child's sounds; the slider scales within this. */
const BACKGROUND_MAX_GAIN=.6;
const PIECE='piece';
/** Pressing play this close to the end starts again from the top. */
const END_SLACK=.05;

export function useCompose(repository:ComposeRepository=mockComposeRepository,backgrounds:BackgroundLibrary=mockBackgroundLibrary,inspirations:InspirationCatalog=mockInspirationCatalog){
 const [state,dispatch]=useReducer(composeReducer,initialCompose);
 const [shelfCount,setShelfCount]=useState(0);
 const [instruments,setInstruments]=useState<readonly Instrument[]>([]);
 const [comingInstruments,setComing]=useState<readonly string[]>([]);
 const [entries,setEntries]=useState<readonly InspirationEntry[]>([]);
 const [playing,setPlaying]=useState(false);
 const [preparing,setPreparing]=useState(false);
 /** Where playback stands while it is not running (paused / sought / at the start), in seconds. */
 const [position,setPosition]=useState(0);
 /** Seconds from the audio clock while playing. */
 const [clock,setClock]=useState(0);
 const [ended,setEnded]=useState(false);
 const [suggesting,setSuggesting]=useState(false);
 /** True while this hook stops the player itself, so only a natural end counts as "finished". */
 const halting=useRef(false);
 const player=useMemo(()=>new SequencePlayer(key=>{
  setPlaying(key===PIECE);
  if(key===null&&!halting.current){setPosition(0);setEnded(true);}
 }),[]);
 const bank=useMemo(()=>new WorkSoundBank(EXAMPLE_TIMEOUT_MS),[]);
 const backgroundRenders=useRef(new Map<string,Promise<AudioBuffer>>());
 const token=useRef(0);
 const latest=useRef(state);latest.current=state;
 const positionRef=useRef(position);positionRef.current=position;

 const notify=useCallback((key:ComposeNoticeKey,tone:'info'|'error'='error')=>dispatch({type:'notice',notice:{tone,key}}),[]);
 const halt=useCallback(()=>{halting.current=true;player.stop();halting.current=false;},[player]);

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

 // The playhead, progress bar and highlights all follow the audio clock while the piece plays.
 useEffect(()=>{
  if(!playing)return;
  let frame=0;const tick=()=>{setClock(player.elapsed()??0);frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,player]);

 // Hiding the tab pauses where it is; leaving the page stops sound and pending loads.
 useEffect(()=>{
  const hidden=()=>{if(document.visibilityState==='hidden'&&player.activeKey()===PIECE){token.current++;setPosition(player.elapsed()??0);halt();}};
  document.addEventListener('visibilitychange',hidden);
  return()=>{document.removeEventListener('visibilitychange',hidden);token.current++;halt();bank.abort();};
 },[player,bank,halt]);

 // Know every source early so the first play starts quickly.
 const sourceIds=state.arrangement?.units.map(unit=>unit.sourceId).join('|')??'';
 useEffect(()=>{
  for(const sourceId of sourceIds.split('|'))if(sourceId)void bank.source(sourceId).catch(()=>{});
 },[sourceIds,bank]);

 // ----- derived: score, background, discoveries -----
 const layout=useMemo(()=>state.arrangement?scoreLayout(state.arrangement):null,[state.arrangement]);
 const {background,inspiration}=state.settings;
 const mood=state.arrangement?.mood??null;
 /** Instruments playing the background music; none chosen = the music as generated. */
 const chosen=useMemo(()=>background.instruments.flatMap(id=>instruments.filter(item=>item.id===id)),[background.instruments,instruments]);
 const entry=inspiration.kind==='textbook'?entries.find(item=>item.id===inspiration.entryId)??null:null;
 // A textbook rhythm is borrowed when chosen. Uploaded teaching music cannot be analysed yet, so it uses the mood's.
 const rhythm:Rhythm=entry?{tempo:entry.tempo,metre:entry.metre}:moodRhythm(mood);
 const discoveries=useMemo(()=>state.arrangement?findDiscoveries(state.arrangement):[],[state.arrangement]);
 const backgroundGain=background.enabled?background.volume*BACKGROUND_MAX_GAIN:0;
 const backgroundKey=`${chosen.map(item=>item.id).join('+')||'original'}|${rhythm.tempo}|${rhythm.metre}`;

 const backgroundBuffer=(seconds:number)=>{
  const key=`${backgroundKey}|${seconds}`;
  let render=backgroundRenders.current.get(key);
  if(!render){render=renderBackground(chosen.map(item=>item.recipe),seconds,rhythm);backgroundRenders.current.set(key,render);render.catch(()=>backgroundRenders.current.delete(key));}
  return render;
 };

 // ----- playback: one clock -----
 const latestGain=useRef(backgroundGain);latestGain.current=backgroundGain;
 /** Play from a moment; `continue` keeps going from wherever the running piece is once the new one is ready. */
 const start=async(from:number|'continue')=>{
  const work=latest.current.arrangement;
  if(!work?.events.length)return notify('need-event','info');
  if(!audioSupported())return notify('no-audio');
  const mine=++token.current;setPreparing(true);if(from!=='continue')setPosition(from);
  try{
   const plan=planPlayback(work),total=pieceSeconds(work);
   const sounds=await Promise.all(plan.map(item=>bank.clip(item.sourceId,item.shape,item.clip)));
   // The background is its own layer: if it cannot be made, the child's sounds still play.
   const under=await backgroundBuffer(total).catch(()=>{notify('background-failed');return null;});
   if(mine!==token.current)return;
   const voices:SequenceVoice[]=plan.map((item,index)=>({at:item.startSeconds,buffer:sounds[index]!}));
   if(under)voices.push({at:0,buffer:under,layer:'background'});
   const at=from==='continue'?player.elapsed()??positionRef.current:from;
   halt();
   await player.play(PIECE,voices,MIX_GAIN,{from:at,length:total,layers:{background:latestGain.current}});
   setClock(at);setEnded(false);
  }catch(reason){if(mine===token.current){const failure=soundFailure(reason);if(failure)notify(failure);}}
  finally{if(mine===token.current)setPreparing(false);}
 };
 /** Pause where the clock is (or cancel a play that is still preparing). */
 const pause=()=>{
  token.current++;setPreparing(false);
  if(player.activeKey()===PIECE)setPosition(player.elapsed()??positionRef.current);
  halt();
 };
 const total=layout?.totalSeconds??0;
 const togglePlay=()=>{
  if(player.activeKey()===PIECE||preparing)return pause();
  void start(positionRef.current>=total-END_SLACK?0:positionRef.current);
 };
 /** 从头听: always from 0 and playing. */
 const restart=()=>{setEnded(false);void start(0);};
 /** Jump to a moment (tap on the score or a sound): play from there. */
 const playFrom=(seconds:number)=>{setEnded(false);void start(Math.min(Math.max(0,seconds),total));};
 // Dragging the progress bar: pause while dragging, resume on release if it was playing.
 const scrub=useRef<{resume:boolean}|null>(null);
 const scrubTo=(seconds:number)=>{
  if(!scrub.current){scrub.current={resume:player.activeKey()===PIECE||preparing};token.current++;setPreparing(false);halt();}
  setEnded(false);setPosition(Math.min(Math.max(0,seconds),total));
 };
 const endScrub=()=>{const resume=scrub.current?.resume;scrub.current=null;if(resume)void start(positionRef.current);};

 // Background on / off and volume change live, without restarting.
 useEffect(()=>{player.setLayerGain('background',backgroundGain);},[backgroundGain,player]);
 // A different background (or rhythm) needs a new render: carry on from the same moment.
 const firstKey=useRef(true);
 useEffect(()=>{
  if(firstKey.current){firstKey.current=false;return;}
  if(player.activeKey()===PIECE)void start('continue');
 // Only when the background itself changes.
 },[backgroundKey]);

 const now=playing?clock:position;
 const sounding=useMemo(()=>layout&&(playing||position>0)?soundingAt(layout.items,now):new Set<string>(),[layout,playing,position,now]);

 // ----- settings -----
 const setSpan=(spanSeconds:SpanSeconds)=>{token.current++;setPreparing(false);halt();setPosition(0);setEnded(false);dispatch({type:'span',spanSeconds,now:new Date()});};
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
 const startNew=async()=>{pause();await repository.startNew();};

 return {
  state,layout,discoveries,instruments,comingInstruments,chosen,entries,entry,
  playing,preparing,ended,suggesting,suggestAvailable:inspirations.suggestAvailable,
  /** The one playback time (seconds) the playhead, progress bar and highlights read. */
  now,total,sounding,
  shelved:isShelved(state),shelfCount,
  togglePlay,restart,playFrom,scrubTo,endScrub,
  setSpan,setInspiration,suggest,
  setBackgroundEnabled:(enabled:boolean)=>dispatch({type:'background-enabled',enabled}),
  setBackgroundVolume:(volume:number)=>dispatch({type:'background-volume',volume}),
  toggleInstrument:(id:string)=>dispatch({type:'instrument',id}),
  canSave,saveWork,share,startNew,
  clearNotice:()=>dispatch({type:'notice',notice:null}),
 };
}
export type Compose=ReturnType<typeof useCompose>;
