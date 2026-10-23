// 课本灵感, shared by 万物声场 (chosen before arranging) and 万物成曲 (heard in the background). The real textbook
// catalogue (songs, licence, grade mapping) is not connected: `list` returns made-up example rhythms and says so, and
// `suggest` (帮我找找) needs a connected model, so the offline implementation reports it unavailable instead of pretending.
// An inspiration only lends rhythm and feel to the background layer — never a melody, never the child's sounds.
//
// Intended server endpoints (not implemented):
//   GET  /api/v1/textbook-inspirations?grade=…          → InspirationEntry[] (licensed catalogue)
//   POST /api/v1/textbook-inspirations/suggest          ← {workId} → {entryId|null} (model behind the server's AI gateway)
import type {Arrangement} from '@wanwu-v2/contracts/arrangement';

export type Metre=2|3|4;
/** Beats per minute and beats per bar: all the background borrows from an inspiration. */
export type Rhythm={tempo:number;metre:Metre};
export type InspirationEntry={id:string;title:string;feel:string}&Rhythm;

/** Made-up examples of what the catalogue will offer: a rhythm and a feel, not real textbook songs. */
export const exampleInspirations:readonly InspirationEntry[]=[
 {id:'tb:mock:march',title:'踏步走',feel:'二拍子 · 一步一步很有精神',tempo:104,metre:2},
 {id:'tb:mock:lullaby',title:'摇篮曲',feel:'三拍子 · 像摇篮轻轻晃',tempo:66,metre:3},
 {id:'tb:mock:train',title:'小火车',feel:'四拍子 · 越跑越欢快',tempo:116,metre:4},
];

export type InspirationList={origin:'example'|'catalogue';entries:readonly InspirationEntry[]};

export type InspirationCatalog={
 list():Promise<InspirationList>;
 /** Whether 帮我找找 can work now (a model is connected through the server). */
 readonly suggestAvailable:boolean;
 suggest(arrangement:Arrangement,signal:AbortSignal):Promise<string|null>;
};

export const mockInspirationCatalog:InspirationCatalog={
 async list(){return {origin:'example',entries:exampleInspirations};},
 suggestAvailable:false,
 async suggest(){return null;},
};
