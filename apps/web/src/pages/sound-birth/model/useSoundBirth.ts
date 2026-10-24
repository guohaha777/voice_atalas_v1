import {useCallback,useEffect,useMemo,useReducer,useRef,useState,useSyncExternalStore} from 'react';
import {SOUND_SOURCE_MAX_MS,cleanSourceText,missingProvenance} from '@wanwu-v2/contracts/sound';
import type {SoundDimension,SoundSource,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {audioSupported} from '../../../shared/audio/audioContext';
import {SequencePlayer} from '../../../shared/audio/SequencePlayer';
import {decodeAudio} from '../../../shared/audio/loadAudio';
import {newId} from '../../../shared/creation/ids';
import {FILE_MAX_BYTES,birthCopy} from '../config/copy';
import {sessionArchive} from '../../../shared/creation/sourceArchive';
import {libraryGroups} from '../services/soundLibrary';
import {presetHintProvider} from '../services/soundHints';
import type {SoundHint,SoundHintProvider} from '../services/soundHints';
import {exampleItems} from '../config/examples';
import {baseName,describeLocal} from './localSource';
import type {Notify} from './localSource';
import {finishCheck,initialSoundBirth,soundBirthReducer,toSoundUnitDraft} from './soundBirthState';
import {TRIM_FILE_MAX_MS} from './trimEditing';
import {useLibraryItems} from './useLibraryItems';
import {useRecording} from './useRecording';
import {useShapedPreview} from './useShapedPreview';
import {useTrimUpload} from './useTrimUpload';

export type FinishResult={status:'unavailable'}|{status:'opened'};
export type {CompareTarget} from './useShapedPreview';
export type {RecordPhase} from './useRecording';
export type ProvenanceField='label'|'recordedBy'|'recordedOn'|'place'|'group';

/** 声音诞生: bring a sound in (library, file, recording), shape it with the five choices, check its card, finish.
 *  Recording, trimming, library loading and the shaped preview live in their own hooks; this one ties them together. */
export function useSoundBirth(markerIndex:number,onFinish:(draft:SoundUnitDraft,source:SoundSource)=>FinishResult,hints:SoundHintProvider=presetHintProvider){
 const [state,dispatch]=useReducer(soundBirthReducer,markerIndex,initialSoundBirth);
 const local=useSyncExternalStore(sessionArchive.subscribe,sessionArchive.list);
 const [playing,setPlaying]=useState<string|null>(null);
 const [progress,setProgress]=useState(0);
 const [blocked,setBlocked]=useState(false);
 const [lastChosen,setLastChosen]=useState<SoundDimension|null>(null);
 const [hint,setHint]=useState<(SoundHint&{key:string})|null>(null);
 const hintRequest=useRef<AbortController|null>(null);
 const player=useMemo(()=>new SequencePlayer(setPlaying),[]);
 const buffers=useRef(new Map<string,AudioBuffer>());
 const photo=useRef<string|null>(null);
 const latest=useRef(state);latest.current=state;

 const notify=useCallback<Notify>((area,text,tone='error')=>dispatch({type:'notice',notice:{tone,area,text}}),[]);
 const bufferOf=(id:string)=>buffers.current.get(id)??sessionArchive.buffer(id);
 const sourceBuffer=state.source?bufferOf(state.source.id):null;

 const preview=useShapedPreview(player,playing,notify,()=>{const source=latest.current.source;return {source,buffer:source&&bufferOf(source.id)||null};},sourceBuffer??null,state.shape);
 const useSource=(source:SoundSource,buffer:AudioBuffer)=>{
  buffers.current.set(source.id,buffer);player.stop();preview.reset();setBlocked(false);
  dispatch({type:'source-ready',source});
 };
 const archiveAndUse=(source:SoundSource,buffer:AudioBuffer)=>{sessionArchive.save(source,buffer);useSource(source,buffer);};
 const library=useLibraryItems(player,playing,notify,{get:bufferOf,set:(id,buffer)=>buffers.current.set(id,buffer)},useSource);
 const recording=useRecording(player,playing,notify,take=>archiveAndUse(describeLocal('local-recording',birthCopy.defaultRecordingName,take.buffer,take.mimeType),take.buffer));
 const trimming=useTrimUpload(player,playing,(label,part,mimeType)=>archiveAndUse(describeLocal('local-file',label,part,mimeType),part));

 // Progress follows the audio clock only while something plays.
 useEffect(()=>{
  if(!playing){setProgress(0);return;}
  let frame=0;const tick=()=>{setProgress(player.progress()??0);frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,player]);

 // Leaving the page or hiding the tab stops sound; a running recording is stopped and kept for review.
 useEffect(()=>{
  const hidden=()=>{if(document.visibilityState!=='hidden')return;player.stop();if(recording.active())void recording.stop();};
  document.addEventListener('visibilitychange',hidden);
  return()=>{
   document.removeEventListener('visibilitychange',hidden);
   player.stop();
   if(photo.current)URL.revokeObjectURL(photo.current);
  };
 },[player]);

 const chooseFile=async(file:File)=>{
  if(!audioSupported())return notify('bar',birthCopy.noAudio);
  if(file.size>FILE_MAX_BYTES)return notify('bar',birthCopy.fileTooBig);
  if(file.type&&!file.type.startsWith('audio/')&&!file.type.startsWith('video/'))return notify('bar',birthCopy.fileUnreadable);
  dispatch({type:'reading',reading:true});
  try{
   const buffer=await decodeAudio(await file.arrayBuffer());
   const label=cleanSourceText(baseName(file.name))??birthCopy.defaultRecordingName,mimeType=file.type||'audio/*';
   if(buffer.duration*1000>TRIM_FILE_MAX_MS){dispatch({type:'reading',reading:false});return notify('bar',birthCopy.tooLong);}
   // Longer than a source may be: the child picks the part to keep (the file on the device is untouched).
   if(buffer.duration*1000>SOUND_SOURCE_MAX_MS+500){
    trimming.start(buffer,label,mimeType);
    dispatch({type:'reading',reading:false});dispatch({type:'notice',notice:null});dispatch({type:'dialog',dialog:'trim'});return;
   }
   archiveAndUse(describeLocal('local-file',label,buffer,mimeType),buffer);
  }catch{dispatch({type:'reading',reading:false});notify('bar',birthCopy.fileUnreadable);}
 };
 const openRecord=()=>{recording.open();dispatch({type:'notice',notice:null});dispatch({type:'dialog',dialog:'record'});};
 const closeDialog=()=>{
  recording.cancel();trimming.cancel();
  if(playing==='take'||playing==='trim'||playing?.startsWith('item:'))player.stop();
  library.abort();dispatch({type:'dialog',dialog:null});
 };

 const choose=(dimension:SoundDimension,value:string)=>{
  dispatch({type:'choose',dimension,value});setBlocked(false);setLastChosen(dimension);
  // Ask the guide for an association; a newer choice cancels an older request.
  hintRequest.current?.abort();const controller=new AbortController();hintRequest.current=controller;
  void hints.hint({dimension,value,shape:{...latest.current.shape,[dimension]:value},sourceLabel:latest.current.source?.label??null},controller.signal)
   .then(result=>{if(result&&!controller.signal.aborted)setHint({...result,key:`${dimension}:${value}`});}).catch(()=>{});
  if(!latest.current.source)return notify('editor',birthCopy.noSoundYet,'info');
  void preview.play({...latest.current.shape,[dimension]:value},'current',true);
 };
 /** Take a choice back: that dimension returns to the original, and the result plays so the change can be heard. */
 const clear=(dimension:SoundDimension)=>{
  dispatch({type:'clear',dimension});setBlocked(false);setLastChosen(dimension);
  hintRequest.current?.abort();setHint(null);
  if(!latest.current.source)return;
  const shape={...latest.current.shape};delete shape[dimension];
  void preview.play(shape,'current',true);
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
   case 'missing-provenance':return notify('info',birthCopy.needProvenance,'info');
   case 'ready':{
    if(!state.cardConfirmed)dispatch({type:'card',confirmed:true});
    const draft=toSoundUnitDraft(state,newId('unit'),new Date());if(!draft||!state.source)return;
    player.stop();
    if(onFinish(draft,state.source).status==='unavailable'){setBlocked(true);notify('editor',birthCopy.worldUnavailable,'info');}
   }
  }
 };

 const {shown,currentBuffer}=preview,trim=trimming.trim;
 const displayBuffer=shown==='current'&&currentBuffer?currentBuffer:sourceBuffer;
 const showingCurrent=!!currentBuffer&&displayBuffer===currentBuffer;
 return {
  state,dispatch,playing,loadingId:library.loadingId,blocked,lastChosen,hint,local,groups:useMemo(()=>libraryGroups(exampleItems,local),[local]),
  wave:{buffer:displayBuffer,original:sourceBuffer??null,target:showingCurrent?'current' as const:'original' as const,progress:playing===(showingCurrent?'current':'original')?progress:0},
  record:{phase:recording.phase,ms:recording.ms,take:recording.take?.buffer??null,progress:playing==='take'?progress:0},
  trim:trim&&{buffer:trim.buffer,label:trim.label,range:trim.range,playing:playing==='trim',progress:playing==='trim'?progress:0},
  setTrimRange:trimming.setRange,listenTrim:trimming.listen,useTrim:trimming.use,
  suggestions:{recordedBy:sessionArchive.recent('recordedBy'),place:sessionArchive.recent('place'),group:sessionArchive.recent('group')},
  previewItem:library.preview,pickItem:library.pick,chooseFile,openRecord,startRecording:recording.start,stopRecording:recording.stop,
  listenTake:recording.listen,useTake:recording.use,closeDialog,
  playCompare:preview.playCompare,playShown:preview.playShown,choose,clear,updateSource,setCardPhoto,finish,
  confirmCard:()=>{
   if(latest.current.source&&missingProvenance(latest.current.source).length){notify('info',birthCopy.needProvenance,'info');return;}
   dispatch({type:'card',confirmed:true});
  },
 };
}
