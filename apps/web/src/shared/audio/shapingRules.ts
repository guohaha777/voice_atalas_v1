// Rules that turn the five choices into a local preview. Tune numbers here; pages and the renderer stay unchanged.
// Transposition is deliberately conservative so a real recording still sounds like itself.
import type {SoundShape} from '@wanwu-v2/contracts/sound';

export const SHAPING_RULES={
 version:'shaping-v1',
 pitchSemitones:{low:-3,mid:0,high:3},
 gainDb:{soft:-10,medium:-5,loud:-1},
 /** The original is auditioned at the "medium" level so 轻响 compares against it fairly. */
 originalGainDb:-5,
 duration:{shortSeconds:0.6,mediumMaxSeconds:4,longFactor:2,longMinSeconds:2.5,longMaxSeconds:8},
 contour:{
  rising:{bendCents:200,filter:'up'},
  falling:{bendCents:-200,filter:'down'},
  flat:{bendCents:0,filter:'none'},
  wavy:{bendCents:0,filter:'wave'},
 },
 filterHz:{closed:1400,open:16000},
 wave:{rateHz:3.5,depthCents:70},
 pattern:{repeatCount:3,repeatMaxSeconds:1.6,repeatGapSeconds:0.3,burstHitSeconds:0.45,burstInnerGap:0.1,burstGroupGap:0.55,fadeInPortion:0.7},
 maxTotalSeconds:10,
 edgeSeconds:{attack:0.008,release:0.05},
} as const;

export type ShapeEvent={at:number;length:number};
export type ShapingPlan={
 rate:number;semitones:number;gain:number;
 bendCents:number;filter:'up'|'down'|'none'|'wave';
 loop:boolean;fadeIn:boolean;
 events:ShapeEvent[];totalSeconds:number;
};

const dbToGain=(db:number)=>10**(db/20);
export const originalGain=dbToGain(SHAPING_RULES.originalGainDb);

/** Pure: how long, how often and how loud the shaped preview plays for a source of `sourceSeconds`. */
export function planShape(shape:SoundShape,sourceSeconds:number):ShapingPlan{
 const rules=SHAPING_RULES,semitones=rules.pitchSemitones[shape.pitch],rate=2**(semitones/12);
 const natural=Math.max(0.05,sourceSeconds/rate);
 const unit=shape.duration==='short'?Math.min(rules.duration.shortSeconds,natural)
  :shape.duration==='medium'?Math.min(natural,rules.duration.mediumMaxSeconds)
  :Math.min(rules.duration.longMaxSeconds,Math.max(rules.duration.longMinSeconds,natural*rules.duration.longFactor));
 const p=rules.pattern;let events:ShapeEvent[];
 switch(shape.pattern){
  case 'repeat':{const length=Math.min(unit,p.repeatMaxSeconds);events=Array.from({length:p.repeatCount},(_,i)=>({at:i*(length+p.repeatGapSeconds),length}));break;}
  case 'bursts':{
   const length=Math.min(unit,p.burstHitSeconds),pair=length*2+p.burstInnerGap;
   events=[0,1].flatMap(group=>[0,1].map(hit=>({at:group*(pair+p.burstGroupGap)+hit*(length+p.burstInnerGap),length})));break;
  }
  default:events=[{at:0,length:unit}];
 }
 events=events.filter(event=>event.at<rules.maxTotalSeconds).map(event=>({at:event.at,length:Math.min(event.length,rules.maxTotalSeconds-event.at)}));
 const last=events[events.length-1]!;
 const contour=rules.contour[shape.contour];
 return {rate,semitones,gain:dbToGain(rules.gainDb[shape.intensity]),bendCents:contour.bendCents,filter:contour.filter,
  loop:events.some(event=>event.length>natural+0.01),fadeIn:shape.pattern==='fade-in',events,totalSeconds:last.at+last.length};
}

/** Pure: normalised peak per bin (0–1) for drawing a waveform. */
export function computePeaks(channels:readonly Float32Array[],bins:number):number[]{
 const length=channels[0]?.length??0;
 if(!length||bins<=0)return Array.from({length:Math.max(0,bins)},()=>0);
 const peaks=new Array<number>(bins).fill(0),step=length/bins;
 for(let bin=0;bin<bins;bin++){
  const from=Math.floor(bin*step),to=Math.max(from+1,Math.floor((bin+1)*step));
  let peak=0;
  for(const channel of channels)for(let i=from;i<to&&i<length;i+=Math.max(1,Math.floor((to-from)/64)))peak=Math.max(peak,Math.abs(channel[i]!));
  peaks[bin]=peak;
 }
 const max=Math.max(...peaks);
 return max>0?peaks.map(value=>value/max):peaks;
}
