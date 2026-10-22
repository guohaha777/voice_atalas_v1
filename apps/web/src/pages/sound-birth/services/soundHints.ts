// Guide-hint port. The page asks for a hint after each choice; today the answer comes from hand-written presets.
// A model-backed provider (prompt module + server endpoint) can implement the same interface later — the page won't change.
import type {SoundDimension,SoundShape} from '@wanwu-v2/contracts/sound';
import {presetHints} from '../config/hintPresets.ts';

export type HintRequest={dimension:SoundDimension;value:string;shape:Partial<SoundShape>;sourceLabel:string|null};
export type SoundHint={text:string;origin:'preset'|'model'};
export type SoundHintProvider={hint(request:HintRequest,signal?:AbortSignal):Promise<SoundHint|null>};

export const presetHintProvider:SoundHintProvider={
 async hint({dimension,value}){
  const text=(presetHints[dimension] as Record<string,string>)[value];
  return text?{text,origin:'preset'}:null;
 },
};
