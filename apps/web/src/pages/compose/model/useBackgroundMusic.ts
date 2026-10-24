import {useMemo,useRef} from 'react';
import type {MoodChoice} from '@wanwu-v2/contracts/arrangement';
import type {InspirationEntry,Rhythm} from '../../../shared/inspiration/catalog';
import type {Instrument} from '../config/backgrounds';
import {moodRhythm} from '../services/backgroundLibrary';
import {renderBackground} from './backgroundSynth';
import type {ComposeState} from './composeState';

/** The background stays well under the child's sounds; the slider scales within this. */
const BACKGROUND_MAX_GAIN=.6;

/** 背景音乐: which instruments play it, the rhythm it borrows, its level, and its renders (cached per length). */
export function useBackgroundMusic(settings:ComposeState['settings'],mood:MoodChoice|null,instruments:readonly Instrument[],entries:readonly InspirationEntry[]){
 const {background,inspiration}=settings;
 const renders=useRef(new Map<string,Promise<AudioBuffer>>());
 /** Instruments playing the background music; none chosen = the music as generated. */
 const chosen=useMemo(()=>background.instruments.flatMap(id=>instruments.filter(item=>item.id===id)),[background.instruments,instruments]);
 const entry=inspiration.kind==='textbook'?entries.find(item=>item.id===inspiration.entryId)??null:null;
 // A textbook rhythm is borrowed when chosen. Uploaded teaching music cannot be analysed yet, so it uses the mood's.
 const rhythm:Rhythm=entry?{tempo:entry.tempo,metre:entry.metre}:moodRhythm(mood);
 const gain=background.enabled?background.volume*BACKGROUND_MAX_GAIN:0;
 const key=`${chosen.map(item=>item.id).join('+')||'original'}|${rhythm.tempo}|${rhythm.metre}`;
 const buffer=(seconds:number)=>{
  const cacheKey=`${key}|${seconds}`;
  let render=renders.current.get(cacheKey);
  if(!render){render=renderBackground(chosen.map(item=>item.recipe),seconds,rhythm);renders.current.set(cacheKey,render);render.catch(()=>renders.current.delete(cacheKey));}
  return render;
 };
 return {chosen,entry,gain,key,buffer};
}
