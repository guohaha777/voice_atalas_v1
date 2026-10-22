// Bundled example sounds: the licensed home-page clips (same hashed files, shared cache).
// Credits follow docs/assets/SOURCES.md; they are public attributions, not children's data.
import {homeSound} from '../../../shared/scene/homeScene';
import {EXAMPLE_GROUP} from '../services/soundLibrary';
import type {LibraryItem} from '../services/soundLibrary';

const PROVENANCE='/legal/sound-sources.html';
const examples=[
 {id:'bird',label:'鸟鸣',by:'旧版项目授权录音'},
 {id:'frog',label:'蛙鸣',by:'MichaeltheFox8621'},
 {id:'cicada',label:'蝉鸣',by:'Siobhan Leachman'},
 {id:'drop',label:'滴水声',by:'ZooFari'},
 {id:'leaves',label:'风吹树叶',by:'旧版项目授权录音'},
] as const;

export const exampleItems:readonly LibraryItem[]=examples.map(example=>({
 url:homeSound(example.id).url,
 source:{id:`example:${example.id}`,kind:'example',label:example.label,durationMs:0,mimeType:'audio/mpeg',
  provenance:{recordedBy:example.by,recordedOn:null,place:null,group:EXAMPLE_GROUP,provenanceUrl:PROVENANCE}},
}));
