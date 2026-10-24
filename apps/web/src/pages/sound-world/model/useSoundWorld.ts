import {useCallback,useEffect,useReducer,useRef,useState} from 'react';
import type {Arrangement,SourceClip,SpanSeconds} from '@wanwu-v2/contracts/arrangement';
import type {Inspiration} from '@wanwu-v2/contracts/work';
import {mockInspirationCatalog} from '../../../shared/inspiration/catalog';
import type {InspirationCatalog,InspirationEntry} from '../../../shared/inspiration/catalog';
import type {SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {newId} from '../../../shared/creation/ids';
import {mockSoundWorldRepository} from '../services/soundWorldRepository';
import type {LibraryScope,SoundWorldRepository} from '../services/soundWorldRepository';
import {offlineMoodInterpreter} from '../services/moodInterpreter';
import type {MoodInterpreter} from '../services/moodInterpreter';
import {eventOf,initialSoundWorld,nudge,placedClip,rowEndSpot,soundWorldReducer,unitOf} from './soundWorldState';
import type {NoticeKey} from './soundWorldState';
import {useFieldSound} from './useFieldSound';
import {useMood} from './useMood';

export type FinishResult={status:'unavailable'}|{status:'opened'};
/** A spot in the field in business coordinates (never pixels). Only `at` affects what is heard. */
export type FieldSpot={at:number;row:number};

/** 万物声场: place the work's sounds along time, edit their excerpts, pick a mood, then go on to 万物成曲.
 *  What the field sounds like lives in useFieldSound and the mood in useMood; this hook owns the arrangement. */
export function useSoundWorld(onFinish:(arrangement:Arrangement)=>FinishResult,repository:SoundWorldRepository=mockSoundWorldRepository,moods:MoodInterpreter=offlineMoodInterpreter,inspirations:InspirationCatalog=mockInspirationCatalog){
 const [state,dispatch]=useReducer(soundWorldReducer,initialSoundWorld);
 const latest=useRef(state);latest.current=state;
 const notify=useCallback((key:NoticeKey,tone:'info'|'error'='error')=>dispatch({type:'notice',notice:{tone,key}}),[]);
 const sound=useFieldSound(latest,dispatch,notify);
 const mood=useMood(moods,dispatch,notify);
 const {stopAll,playOne,clipSound,player}=sound;

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

 // ----- placement -----
 const placeUnit=(unitId:string,spot:FieldSpot)=>{
  const unit=unitOf(latest.current.arrangement,unitId);if(!unit)return;
  stopAll();const eventId=newId('event');
  const clip=placedClip(unit.analysis??sound.bank.analysisNow(unit.sourceId),sound.durations[unit.sourceId]??null);
  dispatch({type:'place',unitId,eventId,at:spot.at,row:spot.row,clip,now:new Date()});
  // Feedback when a sound lands: exactly the excerpt it will play.
  void playOne(`event:${eventId}`,()=>clipSound(unit,clip),{toggle:false});
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
  sound.previewEvent(eventId);
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

 const finish=async()=>{
  const work=latest.current.arrangement;if(!work)return;
  if(!work.events.length)return notify('need-event','info');
  stopAll();
  // The arrangement already lives in the repository (this visit); 万物成曲 opens once it is accepted.
  if(onFinish(work).status==='unavailable')dispatch({type:'blocked'});
 };

 const span=state.arrangement?.spanSeconds??30;
 return {
  state,playing:sound.playing,preparing:sound.preparing,sounding:sound.sounding,durations:sound.durations,elapsed:sound.elapsed,
  /** 0–1 along the field while the whole field plays, else null. Same clock as the audio. */
  playhead:sound.playing==='all'?Math.min(1,sound.elapsed/span):null,
  selectUnit:(unitId:string)=>dispatch({type:'select-unit',unitId}),
  selectEvent:(eventId:string)=>dispatch({type:'select-event',eventId}),
  deselect:()=>dispatch({type:'deselect'}),
  tapField,tapEvent,tapRow,placeUnit,moveEvent,copy,remove,keyMove,setClip,
  setSpan:(spanSeconds:SpanSeconds)=>{stopAll();dispatch({type:'span',spanSeconds,now:new Date()});},
  addRow:()=>dispatch({type:'add-row',now:new Date()}),
  removeRow:()=>dispatch({type:'remove-row',now:new Date()}),
  previewUnit:sound.previewUnit,previewEvent:sound.previewEvent,previewClip:sound.previewClip,previewSource:sound.previewSource,
  stopSound:sound.stopSound,playAll:sound.playAll,finish,
  loadSource:(sourceId:string)=>sound.bank.source(sourceId),
  setMood:mood.setMood,customMood:mood.customMood,interpreting:mood.interpreting,moodModelAvailable:mood.moodModelAvailable,pickMood:mood.pickMood,
  addUnit:(unit:SoundUnitDraft)=>{stopAll();dispatch({type:'add-unit',unit,now:new Date()});},
  clearEvents:()=>{stopAll();dispatch({type:'clear-events',now:new Date()});},
  scope:(scope:LibraryScope)=>repository.scope(scope),
  inspiration,inspirationEntries:entries,setInspiration,
 };
}
export type SoundWorld=ReturnType<typeof useSoundWorld>;
