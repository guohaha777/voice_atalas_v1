import {useCallback,useEffect,useMemo,useReducer,useRef,useState} from 'react';
import type {Arrangement,MoodChoice,MoodId,SourceClip,SpanSeconds} from '@wanwu-v2/contracts/arrangement';
import type {SoundShape,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {audioSupported} from '../../../shared/audio/audioContext';
import {AudioLoadError,loadAudio} from '../../../shared/audio/loadAudio';
import {renderShaped} from '../../../shared/audio/renderShaped';
import {SequencePlayer} from '../../../shared/audio/SequencePlayer';
import {originalGain,planClip,planShape,shapeKey} from '../../../shared/audio/shapingRules';
import {exampleSourceUrl} from '../../../shared/creation/exampleSounds';
import {newId} from '../../../shared/creation/ids';
import {sessionArchive} from '../../../shared/creation/sourceArchive';
import {EXAMPLE_TIMEOUT_MS} from '../config/copy';
import {mockSoundWorldRepository} from '../services/soundWorldRepository';
import type {LibraryScope,SoundWorldRepository} from '../services/soundWorldRepository';
import {cleanMoodText,offlineMoodInterpreter,parseInterpretation} from '../services/moodInterpreter';
import type {MoodInterpreter} from '../services/moodInterpreter';
import {clipSeconds,defaultClip,eventOf,initialSoundWorld,nudge,planPlayback,rowEndSpot,soundWorldReducer,unitOf} from './soundWorldState';
import type {NoticeKey} from './soundWorldState';

export type FinishResult={status:'unavailable'}|{status:'opened'};
/** A spot in the field in business coordinates (never pixels). Only `at` affects what is heard. */
export type FieldSpot={at:number;row:number};

/** Several sounds at once: keep the sum under full scale. */
const MIX_GAIN=.8;

class MissingAudioError extends Error{}

export function useSoundWorld(onFinish:(arrangement:Arrangement)=>FinishResult,repository:SoundWorldRepository=mockSoundWorldRepository,moods:MoodInterpreter=offlineMoodInterpreter){
 const [state,dispatch]=useReducer(soundWorldReducer,initialSoundWorld);
 const [playing,setPlaying]=useState<string|null>(null);
 const [preparing,setPreparing]=useState<string|null>(null);
 const [elapsed,setElapsed]=useState(0);
 /** Real length of each source once its audio is decoded (ms), for default excerpts and the excerpt editor. */
 const [durations,setDurations]=useState<Record<string,number>>({});
 const player=useMemo(()=>new SequencePlayer(setPlaying),[]);
 const buffers=useRef(new Map<string,AudioBuffer>());
 const pending=useRef(new Map<string,Promise<AudioBuffer>>());
 const renders=useRef(new Map<string,AudioBuffer>());
 const loads=useRef(new Set<AbortController>());
 const token=useRef(0);
 /** When each event sounds during 听听这段声音, from the rendered buffers' real lengths. */
 const timeline=useRef<{eventId:string;start:number;end:number}[]>([]);
 const latest=useRef(state);latest.current=state;

 const notify=useCallback((key:NoticeKey,tone:'info'|'error'='error')=>dispatch({type:'notice',notice:{tone,key}}),[]);

 useEffect(()=>{
  let live=true;
  void repository.load().then(arrangement=>{if(live)dispatch({type:'loaded',arrangement});});
  return()=>{live=false;};
 },[repository]);

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
  const active=loads.current;
  return()=>{document.removeEventListener('visibilitychange',hidden);token.current++;player.stop();for(const controller of active)controller.abort();};
 },[player]);

 // ----- audio: original buffers by source, shaped renders by source + shape (+ excerpt) -----
 const learnLength=(sourceId:string,buffer:AudioBuffer)=>{
  const durationMs=Math.round(buffer.duration*1000);
  setDurations(current=>current[sourceId]===durationMs?current:{...current,[sourceId]:durationMs});
  dispatch({type:'source-length',sourceId,durationMs});
 };
 const sourceBuffer=(sourceId:string):Promise<AudioBuffer>=>{
  const known=buffers.current.get(sourceId);if(known)return Promise.resolve(known);
  const local=sessionArchive.buffer(sourceId);
  if(local){buffers.current.set(sourceId,local);learnLength(sourceId,local);return Promise.resolve(local);}
  const inFlight=pending.current.get(sourceId);if(inFlight)return inFlight;
  const url=exampleSourceUrl(sourceId);
  if(!url)return Promise.reject(new MissingAudioError());
  const controller=new AbortController();loads.current.add(controller);
  const request=loadAudio(url,{signal:controller.signal,timeoutMs:EXAMPLE_TIMEOUT_MS})
   .then(buffer=>{buffers.current.set(sourceId,buffer);learnLength(sourceId,buffer);return buffer;})
   .finally(()=>{loads.current.delete(controller);pending.current.delete(sourceId);});
  pending.current.set(sourceId,request);
  return request;
 };
 // Know every sound's real length early (examples are ~20 KB), so excerpts and tails are right from the start.
 const sourceIds=state.arrangement?.units.map(unit=>unit.sourceId).join('|')??'';
 useEffect(()=>{
  for(const sourceId of sourceIds.split('|'))if(sourceId)void sourceBuffer(sourceId).catch(()=>{});
 // Only when the set of sources changes.
 },[sourceIds]);

 const rendered=async(key:string,sourceId:string,make:(buffer:AudioBuffer)=>Promise<AudioBuffer>)=>{
  const cached=renders.current.get(key);if(cached)return cached;
  const result=await make(await sourceBuffer(sourceId));
  renders.current.set(key,result);return result;
 };
 /** The sound card as made in 声音诞生 (palette and library previews). */
 const cardSound=(sourceId:string,shape:SoundShape)=>rendered(`card|${sourceId}|${shapeKey(shape)}`,sourceId,
  buffer=>renderShaped(buffer,planShape(shape,buffer.duration)));
 /** One occurrence in the field: the chosen excerpt with the card's other choices. */
 const clipSound=(sourceId:string,shape:SoundShape,clip:SourceClip)=>rendered(`clip|${sourceId}|${shapeKey(shape)}|${clip.startMs}-${clip.endMs}`,sourceId,
  buffer=>renderShaped(buffer,planClip(shape,clipSeconds(clip)),clip.startMs/1000));

 const report=(reason:unknown)=>{
  if(reason instanceof AudioLoadError&&reason.reason==='aborted')return;
  notify(reason instanceof MissingAudioError?'missing-audio':reason instanceof AudioLoadError?'load-failed':'no-audio');
 };
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
 const previewSource=(sourceId:string)=>void playOne(`source:${sourceId}`,()=>sourceBuffer(sourceId),{gain:originalGain});
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
  loadSource:(sourceId:string)=>sourceBuffer(sourceId),
  setMood,customMood,interpreting,moodModelAvailable:moods.available,
  pickMood:(id:MoodId|null)=>setMood(id?{kind:'preset',id}:null),
  addUnit:(unit:SoundUnitDraft)=>{stopAll();dispatch({type:'add-unit',unit,now:new Date()});},
  clearEvents:()=>{stopAll();dispatch({type:'clear-events',now:new Date()});},
  scope:(scope:LibraryScope)=>repository.scope(scope),
 };
}
export type SoundWorld=ReturnType<typeof useSoundWorld>;
