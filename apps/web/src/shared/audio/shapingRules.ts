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
 /** 万物声场 plays the child's own excerpt (up to the 45 s source), so its cap is the source limit plus the pattern. */
 clipMaxTotalSeconds:60,
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
/** Stable cache key for a set of five choices (renders are cached per source + shape). */
export const shapeKey=(shape:SoundShape)=>[shape.pitch,shape.duration,shape.contour,shape.intensity,shape.pattern].join('/');
export const originalGain=dbToGain(SHAPING_RULES.originalGainDb);

/** Pure: how long, how often and how loud the shaped preview plays for a source of `sourceSeconds`. */
export function planShape(shape:SoundShape,sourceSeconds:number):ShapingPlan{
 const rules=SHAPING_RULES,semitones=rules.pitchSemitones[shape.pitch],rate=2**(semitones/12);
 const natural=Math.max(0.05,sourceSeconds/rate);
 const unit=shape.duration==='short'?Math.min(rules.duration.shortSeconds,natural)
  :shape.duration==='medium'?Math.min(natural,rules.duration.mediumMaxSeconds)
  :Math.min(rules.duration.longMaxSeconds,Math.max(rules.duration.longMinSeconds,natural*rules.duration.longFactor));
 const events=patternEvents(shape.pattern,unit,Math.min(unit,rules.pattern.repeatMaxSeconds),rules.maxTotalSeconds);
 return finishPlan(shape,rate,semitones,events,events.some(event=>event.length>natural+0.01));
}

/**
 * Pure: 万物声场 playback of the excerpt the child chose. The excerpt is the length (it replaces what 长短 did in the
 * preview); 高低、变化、轻响 apply as usual, and 出现方式 repeats the whole excerpt (bursts stay short hits).
 * Never loops: the excerpt is played as it is, so what the child picked is exactly what is heard.
 */
export function planClip(shape:SoundShape,clipSeconds:number):ShapingPlan{
 const semitones=SHAPING_RULES.pitchSemitones[shape.pitch],rate=2**(semitones/12);
 const unit=Math.max(0.05,clipSeconds/rate);
 return finishPlan(shape,rate,semitones,patternEvents(shape.pattern,unit,unit,SHAPING_RULES.clipMaxTotalSeconds),false);
}

function patternEvents(pattern:SoundShape['pattern'],unit:number,repeatLength:number,maxTotal:number){
 const p=SHAPING_RULES.pattern;let events:ShapeEvent[];
 switch(pattern){
  case 'repeat':events=Array.from({length:p.repeatCount},(_,i)=>({at:i*(repeatLength+p.repeatGapSeconds),length:repeatLength}));break;
  case 'bursts':{
   const length=Math.min(unit,p.burstHitSeconds),pair=length*2+p.burstInnerGap;
   events=[0,1].flatMap(group=>[0,1].map(hit=>({at:group*(pair+p.burstGroupGap)+hit*(length+p.burstInnerGap),length})));break;
  }
  default:events=[{at:0,length:unit}];
 }
 return events.filter(event=>event.at<maxTotal).map(event=>({at:event.at,length:Math.min(event.length,maxTotal-event.at)}));
}
function finishPlan(shape:SoundShape,rate:number,semitones:number,events:ShapeEvent[],loop:boolean):ShapingPlan{
 const last=events[events.length-1]!,contour=SHAPING_RULES.contour[shape.contour];
 return {rate,semitones,gain:dbToGain(SHAPING_RULES.gainDb[shape.intensity]),bendCents:contour.bendCents,filter:contour.filter,
  loop,fadeIn:shape.pattern==='fade-in',events,totalSeconds:last.at+last.length};
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
