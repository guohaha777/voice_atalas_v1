// Runtime view of the generated start-dialog artwork. Rebuild with `npm run assets:build`; do not edit the JSON by hand.
import generated from './start-assets.generated.json';
import {homeLayer} from '../../../shared/scene/homeScene';
import type {ArtVariants} from '../../../shared/media/types';

type GeneratedArt={label:string;group:string;crop:{width:number;height:number};variants:ArtVariants};
const assets=generated.assets as Record<string,GeneratedArt>;
function art(id:string){const item=assets[id];if(!item)throw new Error('Missing start artwork: '+id);return item;}

export type StartArtId='start-card'|'start-upload'|'start-library';
const illustrationIds:readonly StartArtId[]=['start-card','start-upload','start-library'];
// All three groups were cut from equally scaled source frames; keep their relative height so ground lines align.
const tallest=Math.max(...illustrationIds.map(id=>art(id).crop.height));
export const startIllustrations=Object.fromEntries(illustrationIds.map(id=>{
 const item=art(id);
 return [id,{label:item.label,variants:item.variants,aspect:item.crop.width/item.crop.height,heightRatio:item.crop.height/tallest}];
})) as Record<StartArtId,{label:string;variants:ArtVariants;aspect:number;heightRatio:number}>;

export const startHeading={variants:art('start-heading').variants,aspect:art('start-heading').crop.width/art('start-heading').crop.height,decodeDeadlineMs:1600};

// The upper-left branch reuses the home page derivative, which the home page has already cached.
export const startDecor={upperLeft:homeLayer('env-upper-left').variants,pond:art('corner-pond-left').variants,fern:art('corner-fern-right').variants};

/** Files the dialog shows first, in priority order, for the current layout tier. */
export function startArtUrls(tier:'mobile'|'desktop'){
 return [startHeading.variants[tier].url,...illustrationIds.map(id=>startIllustrations[id].variants[tier].url),startDecor.pond[tier].url,startDecor.fern[tier].url];
}
