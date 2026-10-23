// Bundled example sounds as library items. The clip list and credits live in shared/creation/exampleSounds.
import {homeSound} from '../../../shared/scene/homeScene';
import {EXAMPLE_PROVENANCE_URL,exampleSounds,exampleSourceId} from '../../../shared/creation/exampleSounds';
import {EXAMPLE_GROUP} from '../services/soundLibrary';
import type {LibraryItem} from '../services/soundLibrary';

export const exampleItems:readonly LibraryItem[]=exampleSounds.map(example=>({
 url:homeSound(example.id).url,
 source:{id:exampleSourceId(example.id),kind:'example',label:example.label,durationMs:0,mimeType:'audio/mpeg',
  provenance:{recordedBy:example.by,recordedOn:null,place:null,group:EXAMPLE_GROUP,provenanceUrl:EXAMPLE_PROVENANCE_URL}},
}));
