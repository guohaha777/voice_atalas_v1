import {getAudioContext,resumeAudio} from './audioContext';

export type SequenceVoice={at:number;buffer:AudioBuffer};
type Playing={key:string;nodes:AudioBufferSourceNode[];master:GainNode;startedAt:number;duration:number;remaining:number};

/**
 * Several decoded buffers scheduled on one audio clock (a single preview is a sequence of one).
 * A new play preempts the previous one, so only one thing sounds at a time. Elapsed time comes from the audio clock,
 * so a playhead, a progress bar and "now sounding" highlights can all read the same time.
 */
export class SequencePlayer{
 private current:Playing|null=null;
 private onChange:(key:string|null)=>void;
 constructor(onChange:(key:string|null)=>void){this.onChange=onChange;}
 async play(key:string,voices:readonly SequenceVoice[],gain=1){
  this.stop();
  if(!voices.length)return;
  const ctx=await resumeAudio();
  const master=ctx.createGain();master.gain.value=gain;master.connect(ctx.destination);
  // A short lead keeps the first sound from being clipped while the graph starts.
  const startedAt=ctx.currentTime+.04;
  const playing:Playing={key,nodes:[],master,startedAt,duration:Math.max(...voices.map(voice=>voice.at+voice.buffer.duration)),remaining:voices.length};
  for(const voice of voices){
   const node=ctx.createBufferSource();node.buffer=voice.buffer;node.connect(master);
   node.onended=()=>{if(this.current!==playing)return;if(--playing.remaining===0){this.release(playing);this.current=null;this.onChange(null);}};
   node.start(startedAt+Math.max(0,voice.at));playing.nodes.push(node);
  }
  this.current=playing;this.onChange(key);
 }
 /** One buffer on its own (previews, the original, a recorded take). */
 playOne(key:string,buffer:AudioBuffer,gain=1){return this.play(key,[{at:0,buffer}],gain);}
 /** 0–1 of the active sequence, or null when idle. */
 progress(){
  const elapsed=this.elapsed();
  return elapsed===null||!this.current?null:Math.min(1,elapsed/this.current.duration);
 }
 /** Seconds since the sequence started (0 during the lead-in), or null when idle. */
 elapsed(){
  const playing=this.current;if(!playing)return null;
  return Math.min(playing.duration,Math.max(0,getAudioContext().currentTime-playing.startedAt));
 }
 activeKey(){return this.current?.key??null;}
 stop(){
  const playing=this.current;if(!playing)return;
  this.current=null;this.release(playing);this.onChange(null);
 }
 private release(playing:Playing){
  for(const node of playing.nodes){node.onended=null;try{node.stop();}catch{/* already stopped */}node.disconnect();}
  playing.master.disconnect();
 }
}
