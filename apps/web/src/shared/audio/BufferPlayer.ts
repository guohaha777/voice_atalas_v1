import {getAudioContext,resumeAudio} from './audioContext';

type Playing={key:string;node:AudioBufferSourceNode;gain:GainNode;startedAt:number;duration:number};

/** One decoded buffer at a time; a new play preempts the previous one. Progress comes from the audio clock. */
export class BufferPlayer{
 private current:Playing|null=null;
 private onChange:(key:string|null)=>void;
 constructor(onChange:(key:string|null)=>void){this.onChange=onChange;}
 async play(key:string,buffer:AudioBuffer,gain=1){
  this.stop();
  const ctx=await resumeAudio();
  const node=ctx.createBufferSource(),level=ctx.createGain();
  node.buffer=buffer;level.gain.value=gain;node.connect(level).connect(ctx.destination);
  const playing:Playing={key,node,gain:level,startedAt:ctx.currentTime,duration:buffer.duration};
  node.onended=()=>{if(this.current===playing){this.current=null;this.onChange(null);}};
  this.current=playing;node.start();this.onChange(key);
 }
 /** 0–1 of the active sound, or null when idle. */
 progress(){
  const playing=this.current;if(!playing)return null;
  return Math.min(1,Math.max(0,(getAudioContext().currentTime-playing.startedAt)/playing.duration));
 }
 activeKey(){return this.current?.key??null;}
 stop(){
  const playing=this.current;if(!playing)return;
  this.current=null;playing.node.onended=null;
  try{playing.node.stop();}catch{/* already stopped */}
  playing.node.disconnect();playing.gain.disconnect();this.onChange(null);
 }
}
