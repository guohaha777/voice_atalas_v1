// Timing and row tidying derived from an arrangement — shared by 万物声场 (editing) and 万物成曲 (the score and the
// whole-piece playback), so both read the same start times, lengths and rows from the same data.
// Only left → right changes what is heard; rows only keep sounds from covering each other.
import {eventsInOrder} from '@wanwu-v2/contracts/arrangement';
import type {Arrangement,PlacedEvent,SourceClip,SpanSeconds} from '@wanwu-v2/contracts/arrangement';
import type {ChosenShape,SoundAnalysis,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {clipHeardSeconds} from '@wanwu-v2/sound-rules/shaping';

/** Room a marker takes on either side of its start, in field units (keeps markers and names apart). */
export const MARKER_HALF=.05;

export const clipSeconds=(clip:SourceClip)=>(clip.endMs-clip.startMs)/1000;
/** How long this occurrence is heard: the excerpt with the card's 长短 (stretch) and 出现方式 (layout); 高低 keeps the length. */
export function heardSeconds(unit:Pick<SoundUnitDraft,'shape'|'analysis'>,event:Pick<PlacedEvent,'clip'>){
 return clipHeardSeconds(unit.shape,unit.analysis??null,event.clip);
}
export function unitOf(arrangement:Arrangement|null,unitId:string){return arrangement?.units.find(unit=>unit.id===unitId)??null;}

/** The stretch of field an occurrence covers: its marker plus its length tail. */
function coverage(arrangement:Arrangement,event:PlacedEvent):[number,number]{
 const unit=unitOf(arrangement,event.unitId);
 const length=unit?heardSeconds(unit,event)/arrangement.spanSeconds:0;
 return [event.at-MARKER_HALF,event.at+Math.max(MARKER_HALF,length)];
}
/** Where an occurrence's marker and tail end, in field units. */
export const coverageEnd=(arrangement:Arrangement,event:PlacedEvent)=>coverage(arrangement,event)[1];
export function rowIsFree(arrangement:Arrangement,candidate:PlacedEvent,row:number){
 const [from,to]=coverage(arrangement,{...candidate,row});
 return arrangement.events.every(event=>{
  if(event.id===candidate.id||event.row!==row)return true;
  const [a,b]=coverage(arrangement,event);
  return to<=a+1e-9||from>=b-1e-9;
 });
}
/** The wanted row if it is free, else the nearest free row; null when every row is taken at that time. */
export function freeRow(arrangement:Arrangement,candidate:PlacedEvent,wanted:number){
 for(let distance=0;distance<arrangement.rows;distance++){
  for(const row of distance?[wanted+distance,wanted-distance]:[wanted]){
   if(row>=0&&row<arrangement.rows&&rowIsFree(arrangement,candidate,row))return row;
  }
 }
 return null;
}
/**
 * After the field length changes every tail changes size: tidy rows again in listening order (rows only; every sound
 * keeps its place in time). A sound keeps its row when that row is free, otherwise takes the nearest free one.
 */
export function resettleRows(arrangement:Arrangement):Arrangement{
 let placed:Arrangement={...arrangement,events:[]};
 for(const event of eventsInOrder(arrangement.events)){
  const row=freeRow(placed,event,event.row)??event.row;
  placed={...placed,events:[...placed.events,{...event,row}]};
 }
 const rows=new Map(placed.events.map(event=>[event.id,event.row]));
 return {...arrangement,events:arrangement.events.map(event=>({...event,row:rows.get(event.id)??event.row}))};
}
/** Switch the field length (both pages): positions stay, tails rescale, rows are re-tidied. Not yet marked as an edit. */
export const withSpan=(arrangement:Arrangement,spanSeconds:SpanSeconds)=>resettleRows({...arrangement,spanSeconds});

/** One scheduled occurrence for playback: when it starts, which excerpt, and the sound card's own shape. */
export type PlannedEvent={eventId:string;unitId:string;sourceId:string;startSeconds:number;clip:SourceClip;shape:ChosenShape;analysis:SoundAnalysis|null};
/** Playback order and timing derived from the arrangement only — the same data the field and the score read. */
export function planPlayback(arrangement:Arrangement):PlannedEvent[]{
 return eventsInOrder(arrangement.events).flatMap(event=>{
  const unit=unitOf(arrangement,event.unitId);
  return unit?[{eventId:event.id,unitId:unit.id,sourceId:unit.sourceId,startSeconds:event.at*arrangement.spanSeconds,clip:event.clip,shape:unit.shape,analysis:unit.analysis??null}]:[];
 });
}

/** Every occurrence with its unit, row, start and heard length in seconds, in listening order. */
export type TimedEvent={event:PlacedEvent;unit:SoundUnitDraft;start:number;seconds:number;end:number};
export function timedEvents(arrangement:Arrangement):TimedEvent[]{
 return eventsInOrder(arrangement.events).flatMap(event=>{
  const unit=unitOf(arrangement,event.unitId);if(!unit)return [];
  const start=event.at*arrangement.spanSeconds,seconds=heardSeconds(unit,event);
  return [{event,unit,start,seconds,end:start+seconds}];
 });
}
/**
 * How long the whole piece really lasts: the chosen length, or longer when a sound is still sounding at the end (the
 * field plays every sound in full, so the piece does too). Rounded up to a tenth of a second.
 */
export function pieceSeconds(arrangement:Arrangement){
 const last=Math.max(0,...timedEvents(arrangement).map(item=>item.end));
 return Math.max(arrangement.spanSeconds,Math.ceil(last*10-1e-6)/10);
}
