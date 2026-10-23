// The background layer, in two steps:
// 1. The background music itself — one score (chords, a melody line, a bass), timed by tempo and metre (a textbook
//    rhythm, or the mood's). Today it is made by code here; later the server generates it (from teaching music and the
//    child's arrangement) and this step is replaced, the next one stays.
// 2. Who plays it. With no instrument chosen, the score sounds as generated (the original soft voice). Choosing
//    instruments only changes the timbre: each chosen instrument plays the same score in its own way.
// Rendered offline into one buffer for the whole piece and played as its own layer; the child's recordings are never
// touched.
import type {Rhythm} from '../../../shared/inspiration/catalog';
import type {InstrumentRecipe} from '../config/backgrounds';

export type ScorePart='chord'|'melody'|'bass';
export type ScoreNote={at:number;length:number;midi:number;part:ScorePart;accent:boolean};
/** `original` is the background as generated, before any instrument is chosen. */
export type Voicing='original'|InstrumentRecipe;

const hz=(midi:number)=>440*2**((midi-69)/12);
/** I – vi – IV – V, one chord per bar (MIDI notes). */
const CHORDS=[[60,64,67],[57,60,64],[53,57,60],[55,59,62]] as const;
/** C-major pentatonic melody, one note per beat. */
const MELODY=[72,76,79,76,74,79,81,79] as const;
const SAMPLE_RATE=22050;
const FADE_IN=1.2,FADE_OUT=2;

/** Pure: the background music for a piece of `seconds` — the same notes whoever plays them. */
export function backgroundScore(seconds:number,{tempo,metre}:Rhythm):ScoreNote[]{
 const beat=60/tempo,bar=beat*metre,notes:ScoreNote[]=[];
 for(let barIndex=0;barIndex*bar<seconds;barIndex++){
  const at=barIndex*bar,chord=CHORDS[barIndex%CHORDS.length]!;
  for(const midi of chord)notes.push({at,length:bar,midi,part:'chord',accent:false});
  notes.push({at,length:bar*.9,midi:chord[0]-24,part:'bass',accent:false});
  for(let b=0;b<metre;b++){
   const beatAt=at+b*beat;if(beatAt>=seconds)break;
   notes.push({at:beatAt,length:beat*.9,midi:MELODY[(barIndex*metre+b)%MELODY.length]!,part:'melody',accent:b===0});
  }
 }
 return notes.map(note=>({...note,length:Math.min(note.length,seconds-note.at)})).filter(note=>note.length>0);
}

/** Pure: which voicings play — the original when nothing is chosen, otherwise exactly the chosen instruments. */
export function voicings(recipes:readonly InstrumentRecipe[]):Voicing[]{return recipes.length?[...recipes]:['original'];}

type OfflineConstructor=typeof OfflineAudioContext;
type Env={gain:AudioParam};
const sustain=(env:Env,at:number,end:number,peak:number,attack:number)=>{
 env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(peak,at+attack);
 env.gain.setValueAtTime(peak,Math.max(at+attack,end-.4));env.gain.linearRampToValueAtTime(0,end);
};
const strike=(env:Env,at:number,end:number,peak:number)=>{
 env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(peak,at+.008);env.gain.exponentialRampToValueAtTime(.001,end);
};

/** Renders the background music for the whole piece with the chosen voicings (mono, low sample rate: it sits underneath). */
export async function renderBackground(recipes:readonly InstrumentRecipe[],seconds:number,rhythm:Rhythm):Promise<AudioBuffer>{
 const Offline=window.OfflineAudioContext||(window as unknown as {webkitOfflineAudioContext:OfflineConstructor}).webkitOfflineAudioContext;
 const ctx=new Offline(1,Math.max(1,Math.ceil(seconds*SAMPLE_RATE)),SAMPLE_RATE);
 const master=ctx.createGain();
 // Gentle fade in and out over the whole piece.
 master.gain.setValueAtTime(0,0);master.gain.linearRampToValueAtTime(1,Math.min(FADE_IN,seconds/3));
 master.gain.setValueAtTime(1,Math.max(seconds/2,seconds-FADE_OUT));master.gain.linearRampToValueAtTime(0,seconds);
 const voices=voicings(recipes);
 const tone=ctx.createBiquadFilter();tone.type='lowpass';tone.frequency.value=voices.includes('bells')?5200:2400;
 // Several instruments share the layer: keep their sum about as loud as one.
 const level=ctx.createGain();level.gain.value=1/Math.sqrt(voices.length);
 master.connect(level).connect(tone).connect(ctx.destination);
 const score=backgroundScore(seconds,rhythm);
 for(const voice of voices)for(const note of score){
  const {at,length}=note,end=at+length,freq=hz(note.midi);
  // Silent until its envelope starts (a gain defaults to 1, which would let a rolled chord note blip early).
  const env=ctx.createGain();env.gain.value=0;env.connect(master);
  const osc=ctx.createOscillator();osc.connect(env);
  switch(voice){
   case 'original':
    // The background as generated: a soft, plain voice for every part.
    osc.type='sine';osc.frequency.value=freq;
    if(note.part==='chord')sustain(env,at,end,.05,.6);
    else if(note.part==='bass')sustain(env,at,end,.12,.05);
    else strike(env,at,end,note.accent?.13:.09);
    break;
   case 'pad':
    // 风琴: everything held, reedy.
    osc.type='triangle';osc.frequency.value=freq;
    sustain(env,at,end,note.part==='chord'?.07:note.part==='bass'?.1:.08,note.part==='chord'?.5:.04);
    break;
   case 'bells':
    // 木琴: every note struck and decaying; chords become a quick roll.
    osc.type='sine';
    if(note.part==='chord'){const roll=at+(note.midi%12)*.012;osc.frequency.value=freq*2;strike(env,roll,Math.min(end,roll+.8),.06);}
    else{osc.frequency.value=note.part==='bass'?freq*2:freq;strike(env,at,end,note.part==='melody'?(note.accent?.2:.13):.1);}
    break;
   case 'pulse':
    // 小鼓: drums keep the rhythm, not the pitches — a thump on each melody beat, a deeper one with each bass note.
    if(note.part==='chord'){osc.disconnect();env.disconnect();continue;}
    osc.type='sine';osc.frequency.setValueAtTime(note.part==='bass'?90:130,at);osc.frequency.exponentialRampToValueAtTime(45,at+.25);
    strike(env,at,Math.min(end,at+.35),note.part==='bass'?.35:note.accent?.4:.24);
    break;
  }
  osc.start(at);osc.stop(end+.02);
 }
 return ctx.startRendering();
}
