import {useCallback,useEffect,useMemo,useReducer,useRef,useState} from 'react';
import type {Arrangement,MoodChoice,MoodId,SourceClip,SpanSeconds} from '@wanwu-v2/contracts/arrangement';
import type {Inspiration} from '@wanwu-v2/contracts/work';
import {mockInspirationCatalog} from '../../../shared/inspiration/catalog';
import type {InspirationCatalog,InspirationEntry} from '../../../shared/inspiration/catalog';
import type {SoundShape,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {audioSupported} from '../../../shared/audio/audioContext';
import {SequencePlayer} from '../../../shared/audio/SequencePlayer';
import {originalGain} from '../../../shared/audio/shapingRules';
import {EXAMPLE_TIMEOUT_MS} from '../../../shared/creation/exampleSounds';
import {newId} from '../../../shared/creation/ids';
import {WorkSoundBank,soundFailure} from '../../../shared/creation/workSounds';
import {mockSoundWorldRepository} from '../services/soundWorldRepository';
import type {LibraryScope,SoundWorldRepository} from '../services/soundWorldRepository';
import {cleanMoodText,offlineMoodInterpreter,parseInterpretation} from '../services/moodInterpreter';
import type {MoodInterpreter} from '../services/moodInterpreter';
import {defaultClip,eventOf,initialSoundWorld,nudge,planPlayback,rowEndSpot,soundWorldReducer,unitOf} from './soundWorldState';
import type {NoticeKey} from './soundWorldState';

export type FinishResult={status:'unavailable'}|{status:'opened'};
/** A spot in the field in business coordinates (never pixels). Only `at` affects what is heard. */
export type FieldSpot={at:number;row:number};

/** Several sounds at once: keep the sum under full scale. */
const MIX_GAIN=.8;

export function useSoundWorld(onFinish:(arrangement:Arrangement)=>FinishResult,repository:SoundWorldRepository=mockSoundWorldRepository,moods:MoodInterpreter=offlineMoodInterpreter,inspirations:InspirationCatalog=mockInspirationCatalog){
 const [state,dispatch]=useReducer(soundWorldReducer,initialSoundWorld);
 const [playing,setPlaying]=useState<string|null>(null);
 const [preparing,setPreparing]=useState<string|null>(null);
 const [elapsed,setElapsed]=useState(0);
 /** Real length of each source once its audio is decoded (ms), for default excerpts and the excerpt editor. */
 const [durations,setDurations]=useState<Record<string,number>>({});
 const player=useMemo(()=>new SequencePlayer(setPlaying),[]);
 // Real lengths feed default excerpts, the excerpt editor and excerpts that reach past the recording.
 const bank=useMemo(()=>new WorkSoundBank(EXAMPLE_TIMEOUT_MS,(sourceId,durationMs)=>{
  setDurations(current=>current[sourceId]===durationMs?current:{...current,[sourceId]:durationMs});
  dispatch({type:'source-length',sourceId,durationMs});
 }),[]);
 const token=useRef(0);
 /** When each event sounds during 听听这段声音, from the rendered buffers' real lengths. */
 const timeline=useRef<{eventId:string;start:number;end:number}[]>([]);
 const latest=useRef(state);latest.current=state;

 const notify=useCallback((key:NoticeKey,tone:'info'|'error'='error')=>dispatch({type:'notice',notice:{tone,key}}),[]);

 useEffect(()=>{
  let live=true;
  void repository.load().then(arrangement=>{if(live)dispatch({type:'loaded',arrangement});});
  void Promise.all([repository.loadInspiration(),inspirations.list()]).then(([current,list])=>{if(live){setInspirationState(current);setEntries(list.entries);}});
  return()=>{live=false;};
 },[repository,inspirations]);
 // 课本灵感 can be chosen here, before arranging; it is kept with the work for 万物成曲 and never moves a sound.
 const [inspiration,setInspirationState]=useState<Inspiration>({kind:'none'});
 const [entries,setEntries]=useState<readonly InspirationEntry[]>([]);
 const setInspiration=(next:Inspiration)=>{setInspirationState(next);void repository.saveInspiration(next);};

 // The child's arrangement is kept through the repository on every change; an untouched example is not stored.
 useEffect(()=>{
  const arrangement=state.arrangement;
  if(arrangement?.origin==='child')void repository.save(arrangement);
 },[state.arrangement,repository]);

 // Playheads (field and excerpt editor) follow the audio clock only while something plays.
 useEffect(()=>{
  if(!playing){setElapsed(0);return;}
  let frame=0;const tick=()=>{setElapsed(player.elapsed()??0);frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,player]);

 // Hiding the tab or leaving the page stops sound and pending loads.
 useEffect(()=>{
  const hidden=()=>{if(document.visibilityState==='hidden'){token.current++;player.stop();}};
  document.addEventListener('visibilitychange',hidden);
  return()=>{document.removeEventListener('visibilitychange',hidden);token.current++;player.stop();bank.abort();};
 },[player,bank]);

 // ----- audio: originals and shaped renders come from the shared work sound bank -----
 // Know every sound's real length early (examples are ~20 KB), so excerpts and tails are right from the start.
 const sourceIds=state.arrangement?.units.map(unit=>unit.sourceId).join('|')??'';
 useEffect(()=>{
  for(const sourceId of sourceIds.split('|'))if(sourceId)void bank.source(sourceId).catch(()=>{});
 // Only when the set of sources changes.
 },[sourceIds,bank]);

 const cardSound=(sourceId:string,shape:SoundShape)=>bank.card(sourceId,shape);
 const clipSound=(sourceId:string,shape:SoundShape,clip:SourceClip)=>bank.clip(sourceId,shape,clip);

 const report=(reason:unknown)=>{const failure=soundFailure(reason);if(failure)notify(failure);};
 /** Prepare then play one buffer; rapid taps only play the latest request; tapping what plays stops it. */
 const playOne=async(key:string,make:()=>Promise<AudioBuffer>,{toggle=true,gain=1}:{toggle?:boolean;gain?:number}={})=>{
  if(!audioSupported())return notify('no-audio');
  if(toggle&&player.activeKey()===key){token.current++;player.stop();return;}
  const mine=++token.current;setPreparing(key);
  try{
   const buffer=await make();
   if(mine===token.current)await player.playOne(key,buffer,gain);
  }catch(reason){if(mine===token.current)report(reason);}
  finally{if(mine===token.current)setPreparing(null);}
 };

 /** A sound card as the child made it (its own five choices), whether or not it is in the work yet. */
 const previewUnit=(unit:SoundUnitDraft)=>void playOne(`unit:${unit.id}`,()=>cardSound(unit.sourceId,unit.shape));
 const previewEvent=(eventId:string,toggle=true)=>{
  const work=latest.current.arrangement,event=eventOf(work,eventId),unit=event&&unitOf(work,event.unitId);
  if(event&&unit)void playOne(`event:${event.id}`,()=>clipSound(unit.sourceId,unit.shape,event.clip),{toggle});
 };
 /** Excerpt editor: hear a draft excerpt as it would sound in the field, or the whole original recording. */
 const previewClip=(eventId:string,clip:SourceClip)=>{
  const work=latest.current.arrangement,event=eventOf(work,eventId),unit=event&&unitOf(work,event.unitId);
  if(unit)void playOne(`clip:${eventId}`,()=>clipSound(unit.sourceId,unit.shape,clip));
 };
 const previewSource=(sourceId:string)=>void playOne(`source:${sourceId}`,()=>bank.source(sourceId),{gain:originalGain});
 const stopSound=()=>{token.current++;player.stop();setPreparing(null);};

 const playAll=async()=>{
  if(!audioSupported())return notify('no-audio');
  if(player.activeKey()==='all'||preparing==='all'){stopSound();return;}
  const work=latest.current.arrangement;
  if(!work?.events.length)return notify('need-event','info');
  const plan=planPlayback(work),mine=++token.current;
  player.stop();setPreparing('all');
  try{
   const sounds=await Promise.all(plan.map(item=>clipSound(item.sourceId,item.shape,item.clip)));
   if(mine!==token.current)return;
   timeline.current=plan.map((item,index)=>({eventId:item.eventId,start:item.startSeconds,end:item.startSeconds+sounds[index]!.duration}));
   await player.play('all',plan.map((item,index)=>({at:item.startSeconds,buffer:sounds[index]!})),MIX_GAIN);
  }catch(reason){if(mine===token.current)report(reason);}
  finally{if(mine===token.current)setPreparing(null);}
 };
 /** Edits change what the field would play, so a running full playback stops. */
 const stopAll=()=>{if(player.activeKey()==='all'||preparing==='all')stopSound();};

 // ----- placement -----
 const placeUnit=(unitId:string,spot:FieldSpot)=>{
  const unit=unitOf(latest.current.arrangement,unitId);if(!unit)return;
  stopAll();const eventId=newId('event');
  const clip=defaultClip(durations[unit.sourceId]??null);
  dispatch({type:'place',unitId,eventId,at:spot.at,row:spot.row,clip,now:new Date()});
  // Feedback when a sound lands: exactly the excerpt it will play.
  void playOne(`event:${eventId}`,()=>clipSound(unit.sourceId,unit.shape,clip),{toggle:false});
 };
 /** Moving never changes a sound, so it stays quiet. */
 const moveEvent=(eventId:string,spot:FieldSpot&{exact?:boolean})=>{
  if(!eventOf(latest.current.arrangement,eventId))return;
  stopAll();dispatch({type:'move',eventId,at:spot.at,row:spot.row,exact:spot.exact,now:new Date()});
 };
 /** 点空白处: place the picked sound there. With a placed sound selected, empty space just lets go of it. */
 const tapField=(spot:FieldSpot)=>{
  const selection=latest.current.selection;
  if(selection?.kind==='unit')placeUnit(selection.unitId,spot);
  else if(selection?.kind==='event')dispatch({type:'deselect'});
  else notify('pick-first','info');
 };
 /** 点这个声音就能播放: tapping a placed sound selects it and plays the part it uses (tap again while playing to stop). */
 const tapEvent=(eventId:string)=>{
  dispatch({type:'select-event',eventId});
  previewEvent(eventId);
 };
 /** Row buttons (keyboard and big-target alternative): append to the row, or move the occurrence to that row. */
 const tapRow=(row:number)=>{
  const {selection,arrangement}=latest.current;
  if(!arrangement)return;
  if(selection?.kind==='unit')placeUnit(selection.unitId,{row,at:rowEndSpot(arrangement,row)});
  else if(selection?.kind==='event'){const event=eventOf(arrangement,selection.eventId);if(event)moveEvent(event.id,{row,at:event.at,exact:true});}
  else notify('pick-first','info');
 };
 /** 复制: the same sound and part again, right after the original; it can then be dragged anywhere. */
 const copy=(eventId:string)=>{
  if(!eventOf(latest.current.arrangement,eventId))return;
  stopAll();dispatch({type:'copy',eventId,newId:newId('event'),now:new Date()});
 };
 const remove=(eventId:string)=>{
  if(player.activeKey()===`event:${eventId}`)player.stop();
  stopAll();dispatch({type:'remove',eventId,now:new Date()});
 };
 const keyMove=(eventId:string,key:string)=>{
  const work=latest.current.arrangement,event=eventOf(work,eventId);if(!work||!event)return false;
  const next=nudge(event,key,work.rows);
  if(next)moveEvent(eventId,next);
  return !!next;
 };
 const setClip=(eventId:string,clip:SourceClip)=>{stopAll();dispatch({type:'clip',eventId,clip,now:new Date()});};

 // ----- mood: presets always; the child's own words only while a model can understand them -----
 const moodRequest=useRef<AbortController|null>(null);
 const [interpreting,setInterpreting]=useState(false);
 const setMood=(mood:MoodChoice|null)=>{moodRequest.current?.abort();dispatch({type:'mood',mood,now:new Date()});};
 /** Returns false when the words could not be accepted (no model, empty text, or the model gave no usable answer). */
 const customMood=async(text:string)=>{
  const clean=cleanMoodText(text);
  if(!moods.available){notify('mood-model-off','info');return false;}
  if(!clean)return false;
  moodRequest.current?.abort();const controller=new AbortController();moodRequest.current=controller;
  setInterpreting(true);
  try{
   const result=parseInterpretation(await moods.interpret(clean,controller.signal));
   if(controller.signal.aborted||!result)return false;
   dispatch({type:'mood',mood:{kind:'custom',text:clean,nearest:result.nearest},now:new Date()});
   return true;
  }catch{return false;}
  finally{if(moodRequest.current===controller){moodRequest.current=null;setInterpreting(false);}}
 };

 const finish=async()=>{
  const work=latest.current.arrangement;if(!work)return;
  if(!work.events.length)return notify('need-event','info');
  stopAll();
  // The arrangement already lives in the repository (this visit); 万物成曲 opens once it is accepted.
  if(onFinish(work).status==='unavailable')dispatch({type:'blocked'});
 };

 // What sounds right now: during the full playback, events whose time span contains the clock.
 const sounding=useMemo(()=>{
  if(playing==='all')return new Set(timeline.current.filter(item=>elapsed>=item.start&&elapsed<item.end).map(item=>item.eventId));
  if(playing?.startsWith('event:'))return new Set([playing.slice(6)]);
  return new Set<string>();
 },[playing,elapsed]);
 const span=state.arrangement?.spanSeconds??30;

 return {
  state,playing,preparing,sounding,durations,elapsed,
  /** 0–1 along the field while the whole field plays, else null. Same clock as the audio. */
  playhead:playing==='all'?Math.min(1,elapsed/span):null,
  selectUnit:(unitId:string)=>dispatch({type:'select-unit',unitId}),
  selectEvent:(eventId:string)=>dispatch({type:'select-event',eventId}),
  deselect:()=>dispatch({type:'deselect'}),
  tapField,tapEvent,tapRow,placeUnit,moveEvent,copy,remove,keyMove,setClip,
  setSpan:(spanSeconds:SpanSeconds)=>{stopAll();dispatch({type:'span',spanSeconds,now:new Date()});},
  addRow:()=>dispatch({type:'add-row',now:new Date()}),
  removeRow:()=>dispatch({type:'remove-row',now:new Date()}),
  previewUnit,previewEvent,previewClip,previewSource,stopSound,playAll,finish,
  loadSource:(sourceId:string)=>bank.source(sourceId),
  setMood,customMood,interpreting,moodModelAvailable:moods.available,
  pickMood:(id:MoodId|null)=>setMood(id?{kind:'preset',id}:null),
  addUnit:(unit:SoundUnitDraft)=>{stopAll();dispatch({type:'add-unit',unit,now:new Date()});},
  clearEvents:()=>{stopAll();dispatch({type:'clear-events',now:new Date()});},
  scope:(scope:LibraryScope)=>repository.scope(scope),
  inspiration,inspirationEntries:entries,setInspiration,
 };
}
export type SoundWorld=ReturnType<typeof useSoundWorld>;
