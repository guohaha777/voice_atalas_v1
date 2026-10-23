import type {ShapingPlan} from './shapingRules';
import {SHAPING_RULES} from './shapingRules';

type OfflineConstructor=typeof OfflineAudioContext;

/**
 * Renders the shaped preview offline into a new buffer. The source buffer is only read, never modified.
 * `offsetSeconds` starts every event at that point of the source (an excerpt chosen in 万物声场).
 */
export async function renderShaped(source:AudioBuffer,plan:ShapingPlan,offsetSeconds=0):Promise<AudioBuffer>{
 const Offline=window.OfflineAudioContext||(window as unknown as {webkitOfflineAudioContext:OfflineConstructor}).webkitOfflineAudioContext;
 const sampleRate=source.sampleRate,frames=Math.max(1,Math.ceil((plan.totalSeconds+0.02)*sampleRate));
 const ctx=new Offline(source.numberOfChannels,frames,sampleRate);
 const {attack,release}=SHAPING_RULES.edgeSeconds,{closed,open}=SHAPING_RULES.filterHz;
 const master=ctx.createGain();master.gain.value=plan.gain;master.connect(ctx.destination);
 for(const event of plan.events){
  const start=event.at,end=event.at+event.length;
  const node=ctx.createBufferSource();node.buffer=source;node.loop=plan.loop;
  node.playbackRate.value=plan.rate;
  if(plan.bendCents){node.detune.setValueAtTime(0,start);node.detune.linearRampToValueAtTime(plan.bendCents,end);}
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.Q.value=0.7;
  if(plan.filter==='up'){filter.frequency.setValueAtTime(closed,start);filter.frequency.exponentialRampToValueAtTime(open,end);}
  else if(plan.filter==='down'){filter.frequency.setValueAtTime(open,start);filter.frequency.exponentialRampToValueAtTime(closed,end);}
  else filter.frequency.value=open;
  if(plan.filter==='wave'){
   const lfo=ctx.createOscillator(),depth=ctx.createGain();
   lfo.frequency.value=SHAPING_RULES.wave.rateHz;depth.gain.value=SHAPING_RULES.wave.depthCents;
   lfo.connect(depth).connect(node.detune);lfo.start(start);lfo.stop(end);
  }
  const envelope=ctx.createGain(),edge=Math.min(release,event.length/3);
  envelope.gain.setValueAtTime(0,start);
  if(plan.fadeIn)envelope.gain.linearRampToValueAtTime(1,start+event.length*SHAPING_RULES.pattern.fadeInPortion);
  else envelope.gain.linearRampToValueAtTime(1,start+Math.min(attack,edge));
  envelope.gain.setValueAtTime(1,Math.max(start,end-edge));
  envelope.gain.linearRampToValueAtTime(0,end);
  node.connect(filter).connect(envelope).connect(master);
  node.start(start,Math.min(Math.max(0,offsetSeconds),source.duration));node.stop(end);
 }
 return ctx.startRendering();
}
