import {useState} from 'react';
import type {SequencePlayer} from '../../../shared/audio/SequencePlayer';
import {originalGain} from '../../../shared/audio/shapingRules';
import {sliceBuffer} from '../../../shared/audio/sliceBuffer';
import {initialTrim} from './trimEditing';
import type {TrimRange} from './trimEditing';

type Trim={buffer:AudioBuffer;label:string;mimeType:string;range:TrimRange};

/** A too-long upload being trimmed: the decoded file (only read), its name and the part to keep. */
export function useTrimUpload(player:SequencePlayer,playing:string|null,onUse:(label:string,part:AudioBuffer,mimeType:string)=>void){
 const [trim,setTrim]=useState<Trim|null>(null);
 const start=(buffer:AudioBuffer,label:string,mimeType:string)=>{player.stop();setTrim({buffer,label,mimeType,range:initialTrim(Math.round(buffer.duration*1000))});};
 const setRange=(range:TrimRange)=>{if(playing==='trim')player.stop();setTrim(current=>current&&{...current,range});};
 const listen=()=>{
  if(!trim)return;if(playing==='trim')return player.stop();
  void player.playOne('trim',sliceBuffer(trim.buffer,trim.range.startMs,trim.range.endMs),originalGain);
 };
 const use=()=>{
  if(!trim)return;
  onUse(trim.label,sliceBuffer(trim.buffer,trim.range.startMs,trim.range.endMs),trim.mimeType);setTrim(null);
 };
 return {trim,start,setRange,listen,use,cancel:()=>setTrim(null)};
}
