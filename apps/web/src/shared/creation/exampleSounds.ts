// Bundled example sounds: the licensed home-page clips (same hashed files, shared cache).
// Credits follow docs/assets/SOURCES.md; they are public attributions, not children's data.
// Shared by 声音诞生 (pick a source) and 万物声场 (example units), so both resolve the same audio.
import {homeSound} from '../scene/homeScene';
import type {SoundId} from '../media/types';

export const EXAMPLE_PROVENANCE_URL='/legal/sound-sources.html';
export const exampleSounds=[
 {id:'bird',label:'鸟鸣',by:'旧版项目授权录音'},
 {id:'frog',label:'蛙鸣',by:'MichaeltheFox8621'},
 {id:'cicada',label:'蝉鸣',by:'Siobhan Leachman'},
 {id:'drop',label:'滴水声',by:'ZooFari'},
 {id:'leaves',label:'风吹树叶',by:'旧版项目授权录音'},
] as const satisfies readonly {id:SoundId;label:string;by:string}[];

export const exampleSourceId=(id:SoundId)=>`example:${id}`;
/** Audio URL for a bundled example source id (`example:bird`), or null for anything else. */
export function exampleSourceUrl(sourceId:string){
 const example=exampleSounds.find(item=>exampleSourceId(item.id)===sourceId);
 return example?homeSound(example.id).url:null;
}
