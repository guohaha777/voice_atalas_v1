import {useCallback,useEffect,useMemo,useReducer,useRef,useState,useSyncExternalStore} from 'react';
import {NEUTRAL_SHAPE,SOUND_SOURCE_MAX_MS,cleanSourceText,missingProvenance} from '@wanwu-v2/contracts/sound';
import type {SoundDimension,SoundShape,SoundSource,SoundSourceKind,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {audioSupported} from '../../../shared/audio/audioContext';
import {SequencePlayer} from '../../../shared/audio/SequencePlayer';
import {LocalRecorder,RecorderError} from '../../../shared/audio/LocalRecorder';
import {AudioLoadError,decodeAudio,loadAudio} from '../../../shared/audio/loadAudio';
import {renderShaped} from '../../../shared/audio/renderShaped';
import {originalGain,planShape,shapeKey} from '../../../shared/audio/shapingRules';
import {newId} from '../../../shared/creation/ids';
import type {CreationEntry} from '../../../app/navigation';
import {EXAMPLE_TIMEOUT_MS} from '../../../shared/creation/exampleSounds';
import {FILE_MAX_BYTES,birthCopy} from '../config/copy';
import {dimensionCopy} from '../../../shared/creation/dimensionCopy';
import {sessionArchive} from '../../../shared/creation/sourceArchive';
import {libraryGroups} from '../services/soundLibrary';
import {presetHintProvider} from '../services/soundHints';
import type {SoundHint,SoundHintProvider} from '../services/soundHints';
import {exampleItems} from '../config/examples';
import type {LibraryItem} from '../services/soundLibrary';
import {finishCheck,initialSoundBirth,soundBirthReducer,toSoundUnitDraft} from './soundBirthState';
import type {Notice} from './soundBirthState';

export type FinishResult={status:'unavailable'}|{status:'opened'};
/** Which compare target the waveform shows; also the play keys for original / current. */
export type CompareTarget='original'|'current';
export type RecordPhase='idle'|'starting'|'recording'|'review';
export type ProvenanceField='label'|'recordedBy'|'recordedOn'|'place'|'group';

const baseName=(file:string)=>file.replace(/\.[^.]+$/,'').trim();
const today=()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;};
const full=(shape:Partial<SoundShape>)=>({...NEUTRAL_SHAPE,...shape});

export function useSoundBirth(entry:CreationEntry|null,markerIndex:number,onFinish:(draft:SoundUnitDraft,source:SoundSource)=>FinishResult,hints:SoundHintProvider=presetHintProvider){
 const [state,dispatch]=useReducer(soundBirthReducer,entry,start=>initialSoundBirth(start,markerIndex));
 const local=useSyncExternalStore(sessionArchive.subscribe,sessionArchive.list);
 const [playing,setPlaying]=useState<string|null>(null);
 const [progress,setProgress]=useState(0);
 const [shown,setShown]=useState<CompareTarget>('original');
 const [currentBuffer,setCurrentBuffer]=useState<AudioBuffer|null>(null);
 const [loadingId,setLoadingId]=useState<string|null>(null);
 const [recordPhase,setRecordPhase]=useState<RecordPhase>('idle');
 const [recordMs,setRecordMs]=useState(0);
 const [take,setTake]=useState<{buffer:AudioBuffer;mimeType:string}|null>(null);
 const [blocked,setBlocked]=useState(false);
 const [lastChosen,setLastChosen]=useState<SoundDimension|null>(null);
 const [hint,setHint]=useState<(SoundHint&{key:string})|null>(null);
 const hintRequest=useRef<AbortController|null>(null);
 const player=useMemo(()=>new SequencePlayer(setPlaying),[]);
 const buffers=useRef(new Map<string,AudioBuffer>());
 const renders=useRef(new Map<string,AudioBuffer>());
 const recorder=useRef<LocalRecorder|null>(null);
 const loads=useRef<AbortController|null>(null);
 const renderToken=useRef(0);
 const photo=useRef<string|null>(null);
 const latest=useRef(state);latest.current=state;

 const notify=useCallback((area:NonNullable<Notice>['area'],text:string,tone:'info'|'error'='error')=>dispatch({type:'notice',notice:{tone,area,text}}),[]);
 const bufferOf=(id:string)=>buffers.current.get(id)??sessionArchive.buffer(id);
 const sourceBuffer=state.source?bufferOf(state.source.id):null;

 // Progress follows the audio clock only while something plays.
 useEffect(()=>{
  if(!playing){setProgress(0);return;}
  let frame=0;const tick=()=>{setProgress(player.progress()??0);frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,player]);

 // Leaving the page or hiding the tab stops sound; a running recording is stopped and kept for review.
 useEffect(()=>{
  const hidden=()=>{if(document.visibilityState!=='hidden')return;player.stop();if(recorder.current)void stopRecording();};
  document.addEventListener('visibilitychange',hidden);
  return()=>{
   document.removeEventListener('visibilitychange',hidden);
   player.stop();recorder.current?.cancel();recorder.current=null;loads.current?.abort();
   if(photo.current)URL.revokeObjectURL(photo.current);
  };
 },[player]);

 useEffect(()=>{
  if(recordPhase!=='recording')return;
  const timer=setInterval(()=>setRecordMs(recorder.current?.elapsedMs()??0),200);
  return()=>clearInterval(timer);
 },[recordPhase]);

 const useSource=(source:SoundSource,buffer:AudioBuffer)=>{
  buffers.current.set(source.id,buffer);player.stop();setShown('original');setCurrentBuffer(null);setBlocked(false);
  dispatch({type:'source-ready',source});
 };
 /** New local sources start from the last values used on this device, so a class outing is filled in once. */
 const describeLocal=(kind:Exclude<SoundSourceKind,'example'>,label:string,buffer:AudioBuffer,mimeType:string):SoundSource=>({
  id:newId(kind==='local-file'?'file':'recording'),kind,label,durationMs:Math.round(buffer.duration*1000),mimeType,
  provenance:{recordedBy:sessionArchive.recent('recordedBy')[0]??null,recordedOn:today(),place:sessionArchive.recent('place')[0]??null,group:sessionArchive.recent('group')[0]??null,provenanceUrl:null},
 });
 const archiveAndUse=(source:SoundSource,buffer:AudioBuffer)=>{sessionArchive.save(source,buffer);useSource(source,buffer);};

 const reportLoad=(reason:unknown,area:NonNullable<Notice>['area'])=>{
  if(reason instanceof AudioLoadError&&reason.reason==='aborted')return;
  notify(area,reason instanceof AudioLoadError&&reason.reason==='decode'?birthCopy.fileUnreadable:birthCopy.slowNetwork);
 };
 const itemBuffer=async(item:LibraryItem)=>{
  const cached=bufferOf(item.source.id);if(cached)return cached;
  if(!item.url)throw new AudioLoadError('network');
  loads.current?.abort();const controller=new AbortController();loads.current=controller;
  setLoadingId(item.source.id);
  try{const buffer=await loadAudio(item.url,{signal:controller.signal,timeoutMs:EXAMPLE_TIMEOUT_MS});buffers.current.set(item.source.id,buffer);return buffer;}
  finally{if(loads.current===controller){loads.current=null;setLoadingId(null);}}
 };
 const previewItem=async(item:LibraryItem)=>{
  if(!audioSupported())return notify('bar',birthCopy.noAudio);
  const key=`item:${item.source.id}`;if(playing===key)return player.stop();
  try{await player.playOne(key,await itemBuffer(item),originalGain);}catch(reason){reportLoad(reason,'bar');}
 };
 const pickItem=async(item:LibraryItem)=>{
  if(!audioSupported())return notify('bar',birthCopy.noAudio);
  try{
   const buffer=await itemBuffer(item);
   useSource(item.source.kind==='example'?{...item.source,durationMs:Math.round(buffer.duration*1000)}:item.source,buffer);
  }catch(reason){reportLoad(reason,'bar');}
 };

 const chooseFile=async(file:File)=>{
  if(!audioSupported())return notify('bar',birthCopy.noAudio);
  if(file.size>FILE_MAX_BYTES)return notify('bar',birthCopy.fileTooBig);
  if(file.type&&!file.type.startsWith('audio/')&&!file.type.startsWith('video/'))return notify('bar',birthCopy.fileUnreadable);
  dispatch({type:'reading',reading:true});
  try{
   const buffer=await decodeAudio(await file.arrayBuffer());
   if(buffer.duration*1000>SOUND_SOURCE_MAX_MS+500){dispatch({type:'reading',reading:false});return notify('bar',birthCopy.tooLong);}
   archiveAndUse(describeLocal('local-file',cleanSourceText(baseName(file.name))??birthCopy.defaultRecordingName,buffer,file.type||'audio/*'),buffer);
  }catch{dispatch({type:'reading',reading:false});notify('bar',birthCopy.fileUnreadable);}
 };

 // ----- recording dialog: idle → starting → recording → review → use / retake -----
 const openRecord=()=>{player.stop();setTake(null);setRecordPhase('idle');dispatch({type:'notice',notice:null});dispatch({type:'dialog',dialog:'record'});};
 const startRecording=async()=>{
  player.stop();setTake(null);setRecordMs(0);setRecordPhase('starting');
  const next=new LocalRecorder();recorder.current=next;
  try{await next.start(SOUND_SOURCE_MAX_MS);if(recorder.current===next)setRecordPhase('recording');}
  catch(reason){
   if(recorder.current===next)recorder.current=null;
   setRecordPhase('idle');notify('bar',birthCopy.errors[reason instanceof RecorderError?reason.reason:'failed']);
  }
 };
 async function stopRecording(){
  const active=recorder.current;if(!active)return;
  recorder.current=null;
  try{
   const blob=await active.stop();
   const buffer=await decodeAudio(await blob.arrayBuffer());
   setTake({buffer,mimeType:blob.type||'audio/webm'});setRecordPhase('review');
  }catch(reason){setRecordPhase('idle');notify('bar',birthCopy.errors[reason instanceof RecorderError?reason.reason:'failed']);}
 }
 const listenTake=()=>{if(!take)return;if(playing==='take')return player.stop();void player.playOne('take',take.buffer,originalGain);};
 const useTake=()=>{if(!take)return;archiveAndUse(describeLocal('local-recording',birthCopy.defaultRecordingName,take.buffer,take.mimeType),take.buffer);setTake(null);setRecordPhase('idle');};
 const closeDialog=()=>{
  recorder.current?.cancel();recorder.current=null;setTake(null);setRecordPhase('idle');
  if(playing==='take'||playing?.startsWith('item:'))player.stop();
  loads.current?.abort();dispatch({type:'dialog',dialog:null});
 };

 // ----- shaped preview -----
 /** Render (cached) and play. Rapid taps only play the most recent request. */
 const playShape=async(shape:SoundShape,key:string,show:boolean)=>{
  const source=latest.current.source,buffer=source&&bufferOf(source.id);
  if(!source||!buffer)return;
  const token=++renderToken.current,cacheKey=`${source.id}|${shapeKey(shape)}`;
  let rendered=renders.current.get(cacheKey);
  try{
   if(!rendered){rendered=await renderShaped(buffer,planShape(shape,buffer.duration));renders.current.set(cacheKey,rendered);}
   if(token!==renderToken.current)return;
   if(show){setCurrentBuffer(rendered);setShown('current');}
   await player.playOne(key,rendered);
  }catch{if(token===renderToken.current)notify('editor',birthCopy.noAudio);}
 };
 const playCompare=(target:CompareTarget)=>{
  if(playing===target){player.stop();return;}
  if(!sourceBuffer)return;
  if(target==='original'){renderToken.current++;setShown('original');void player.playOne('original',sourceBuffer,originalGain);}
  else void playShape(full(state.shape),'current',true);
 };
 /** The waveform's own play button plays whichever version it is showing. */
 const playShown=()=>playCompare(shown==='current'&&currentBuffer?'current':'original');
 const choose=(dimension:SoundDimension,value:string)=>{
  dispatch({type:'choose',dimension,value});setBlocked(false);setLastChosen(dimension);
  // Ask the guide for an association; a newer choice cancels an older request.
  hintRequest.current?.abort();const controller=new AbortController();hintRequest.current=controller;
  void hints.hint({dimension,value,shape:{...latest.current.shape,[dimension]:value},sourceLabel:latest.current.source?.label??null},controller.signal)
   .then(result=>{if(result&&!controller.signal.aborted)setHint({...result,key:`${dimension}:${value}`});}).catch(()=>{});
  if(!latest.current.source)return notify('editor',birthCopy.noSoundYet,'info');
  void playShape(full({...latest.current.shape,[dimension]:value}),'current',true);
 };
 const updateSource=(field:ProvenanceField,value:string)=>{
  const source=latest.current.source;if(!source||source.kind==='example')return;
  const clean=field==='recordedOn'?(/^\d{4}-\d{2}-\d{2}$/.test(value)?value:null):cleanSourceText(value);
  const next:SoundSource=field==='label'?{...source,label:clean??''}:{...source,provenance:{...source.provenance,[field]:clean}};
  sessionArchive.update(next);dispatch({type:'source-update',source:next});
 };
 const setCardPhoto=(file:File|null)=>{
  if(photo.current)URL.revokeObjectURL(photo.current);
  photo.current=file?URL.createObjectURL(file):null;
  dispatch({type:'card-photo',url:photo.current});
 };
 /** One button that either finishes or walks to the first thing still missing. */
 const finish=()=>{
  const check=finishCheck(state);
  switch(check.kind){
   case 'no-source':return notify('bar',birthCopy.needSound,'info');
   case 'missing-shape':return notify('editor',birthCopy.needShape(check.dimensions.map(dimension=>dimensionCopy[dimension].label).join('、')),'info');
   case 'missing-provenance':return notify('info',birthCopy.needProvenance,'info');
   case 'ready':{
    if(!state.cardConfirmed)dispatch({type:'card',confirmed:true});
    const draft=toSoundUnitDraft(state,newId('unit'),new Date());if(!draft||!state.source)return;
    player.stop();
    if(onFinish(draft,state.source).status==='unavailable'){setBlocked(true);notify('editor',birthCopy.worldUnavailable,'info');}
   }
  }
 };

 const displayBuffer=shown==='current'&&currentBuffer?currentBuffer:sourceBuffer;
 const showingCurrent=!!currentBuffer&&displayBuffer===currentBuffer;
 return {
  state,dispatch,playing,loadingId,blocked,lastChosen,hint,local,groups:useMemo(()=>libraryGroups(exampleItems,local),[local]),
  wave:{buffer:displayBuffer,target:showingCurrent?'current' as const:'original' as const,progress:playing===(showingCurrent?'current':'original')?progress:0},
  record:{phase:recordPhase,ms:recordMs,take:take?.buffer??null,progress:playing==='take'?progress:0},
  suggestions:{recordedBy:sessionArchive.recent('recordedBy'),place:sessionArchive.recent('place'),group:sessionArchive.recent('group')},
  previewItem,pickItem,chooseFile,openRecord,startRecording,stopRecording,listenTake,useTake,closeDialog,
  playCompare,playShown,choose,updateSource,setCardPhoto,finish,
  confirmCard:()=>{
   if(latest.current.source&&missingProvenance(latest.current.source).length){notify('info',birthCopy.needProvenance,'info');return;}
   dispatch({type:'card',confirmed:true});
  },
 };
}
