// Each unit has a guide animal from the home page cast, shown as a sticker before the title.
// 声音诞生 is led by the bird — the first singer in the home forest. Reuses the home derivative (already cached).
import {homeLayer} from '../../../shared/scene/homeScene';

const guideId='bird';
export const unitGuide={label:'小鸟向导',variants:homeLayer(guideId).variants};
