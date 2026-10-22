// Faint home-forest frame behind the work page: the home scene's environment layers (same hashed files, usually
// already cached), placed exactly as the home page places them — each rect scaled to the full window in both
// directions (design 1440 × 960) — so the bushes run along the left and right edges without gaps.
import {homeScene} from '../../../shared/scene/homeScene';

const {width:designWidth,height:designHeight}=homeScene.design;
const pct=(value:number,total:number)=>`${value/total*100}%`;

export const backdropLayers=homeScene.layers.filter(layer=>layer.kind==='environment').map(layer=>{
 const [x,y,width,height]=layer.rect;
 return {id:layer.id,variants:layer.variants,
  box:{left:pct(x,designWidth),top:pct(y,designHeight),width:pct(width,designWidth),height:pct(height,designHeight)}};
});
/** How visible the frame is: high transparency so it never competes with the cards. */
export const backdropOpacity=.12;
