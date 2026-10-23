// Mock data for 万物声场: example sound units built on the licensed home clips, and one example arrangement.
// The five choices here are project presets (input 'example-preset'), not a child's choices; the page labels them 示例.
// Real class / public units come from the server later through services/soundWorldRepository.ts.
import {ARRANGEMENT_CONTRACT_VERSION,DEFAULT_ROWS,DEFAULT_SPAN_SECONDS} from '@wanwu-v2/contracts/arrangement';
import type {Arrangement,SourceClip} from '@wanwu-v2/contracts/arrangement';
import {SOUND_CONTRACT_VERSION} from '@wanwu-v2/contracts/sound';
import type {SoundShape,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import type {SoundId} from '../../../shared/media/types';

const PRESET_DATE='2026-10-22T00:00:00.000Z';
const presets:readonly {sound:SoundId;name:string;shape:SoundShape}[]=[
 {sound:'bird',name:'鸟鸣',shape:{pitch:'high',duration:'short',contour:'rising',intensity:'medium',pattern:'repeat'}},
 {sound:'drop',name:'滴水声',shape:{pitch:'mid',duration:'short',contour:'falling',intensity:'soft',pattern:'once'}},
 {sound:'frog',name:'蛙鸣',shape:{pitch:'low',duration:'medium',contour:'flat',intensity:'medium',pattern:'bursts'}},
 {sound:'cicada',name:'蝉鸣',shape:{pitch:'high',duration:'long',contour:'wavy',intensity:'soft',pattern:'fade-in'}},
 {sound:'leaves',name:'风吹树叶',shape:{pitch:'mid',duration:'long',contour:'wavy',intensity:'soft',pattern:'fade-in'}},
];

export const exampleUnitId=(sound:SoundId)=>`unit:example:${sound}`;
/** Example units; `markerIndex` is assigned when one joins a work, so pass the index it gets there. */
export function exampleUnit(sound:SoundId,markerIndex:number):SoundUnitDraft{
 const preset=presets.find(item=>item.sound===sound);
 if(!preset)throw new Error('Missing example preset '+sound);
 return {version:SOUND_CONTRACT_VERSION,id:exampleUnitId(sound),sourceId:`example:${sound}`,name:preset.name,maker:null,markerIndex,
  shape:{...preset.shape},input:'example-preset',createdAt:PRESET_DATE};
}
export const exampleUnitSounds=presets.map(preset=>preset.sound);

/**
 * The field a visitor sees before making a sound: three examples, one repeated, spread over the three rows. Each uses
 * the whole clip, like a freshly placed sound; the exact lengths are fitted to the decoded audio when it loads.
 */
const whole:SourceClip={startMs:0,endMs:3240};
const examplePlan:readonly {sound:SoundId;at:number;row:number;clip:SourceClip}[]=[
 {sound:'bird',at:.06,row:0,clip:whole},
 {sound:'drop',at:.3,row:1,clip:whole},
 {sound:'frog',at:.52,row:2,clip:whole},
 {sound:'bird',at:.66,row:0,clip:whole},
];
export function exampleArrangement(id:string,now:Date):Arrangement{
 const sounds=[...new Set(examplePlan.map(item=>item.sound))];
 return {version:ARRANGEMENT_CONTRACT_VERSION,id,origin:'example',mood:null,rows:DEFAULT_ROWS,spanSeconds:DEFAULT_SPAN_SECONDS,updatedAt:now.toISOString(),
  units:sounds.map((sound,index)=>exampleUnit(sound,index)),
  events:examplePlan.map((item,index)=>({id:`event:example:${index+1}`,unitId:exampleUnitId(item.sound),at:item.at,row:item.row,clip:{...item.clip}}))};
}
