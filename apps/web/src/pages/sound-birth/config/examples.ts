// Bundled example sounds as library items: whole recordings (see shared/creation/exampleSounds and the library recipe).
import {EXAMPLE_PROVENANCE_URL,exampleSounds,exampleSourceId} from '../../../shared/creation/exampleSounds';
import {EXAMPLE_GROUP} from '../services/soundLibrary';
import type {LibraryItem} from '../services/soundLibrary';

export const exampleItems:readonly LibraryItem[]=exampleSounds.map(example=>({
 url:example.url,
 source:{id:exampleSourceId(example.id),kind:'example',label:example.label,durationMs:example.durationMs,mimeType:'audio/mpeg',
  provenance:{recordedBy:example.by,recordedOn:null,place:null,group:EXAMPLE_GROUP,provenanceUrl:EXAMPLE_PROVENANCE_URL}},
}));
