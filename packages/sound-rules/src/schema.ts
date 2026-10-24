// Range checks for the rule files. Every number a music role can tune has a [min, max] here; a value outside it, a
// missing or unknown key, or a broken relation (short longer than long…) is reported in plain words. `rules.ts` refuses
// to load invalid rules, so a bad edit fails the tests and the build — it never reaches a child.
type Limits={readonly [key:string]:readonly [number,number]|Limits|'version'};
export type RuleProblem=string;

function walk(value:unknown,limits:Limits,path:string,problems:RuleProblem[]){
 if(!value||typeof value!=='object'||Array.isArray(value)){problems.push(`${path} 应该是一组参数`);return;}
 const record=value as Record<string,unknown>;
 for(const key of Object.keys(record))if(!(key in limits))problems.push(`${path}.${key} 不认识（拼错了？）`);
 for(const [key,limit] of Object.entries(limits)){
  const at=`${path}.${key}`,item=record[key];
  if(item===undefined){problems.push(`${at} 缺少`);continue;}
  if(limit==='version'){if(typeof item!=='string'||!item)problems.push(`${at} 应该是版本名`);continue;}
  if(Array.isArray(limit)){
   const [min,max]=limit as readonly [number,number];
   if(typeof item!=='number'||!Number.isFinite(item))problems.push(`${at} 应该是数字`);
   else if(item<min||item>max)problems.push(`${at} = ${item}，超出允许范围 [${min}, ${max}]`);
   continue;
  }
  walk(item,limit as Limits,at,problems);
 }
}

export function checkRules(name:string,value:unknown,limits:Limits,relations:readonly [boolean,string][]=[]):RuleProblem[]{
 const problems:RuleProblem[]=[];
 walk(value,limits,name,problems);
 if(!problems.length)for(const [ok,message] of relations)if(!ok)problems.push(`${name}: ${message}`);
 return problems;
}

export const analysisLimits={
 version:'version',
 frameSeconds:[.005,.05],
 smoothFrames:[1,9],
 silence:{belowPeakDb:[10,80],floorDb:[-90,-20]},
 units:{mergeGapSeconds:[0,1],minSeconds:[.01,1],splitAboveSeconds:[.2,10],splitDipDb:[2,30],maxCount:[1,200]},
 kind:{oneMaxSeconds:[.5,10],oneDominanceDb:[3,40],seriesQuietRatio:[0,1]},
 unitLength:{shortBelowSeconds:[.05,2],longAboveSeconds:[.2,5]},
 brightness:{fftSize:[256,8192],maxFrames:[4,400],withinDb:[3,60],ignoreBelowHz:[0,1000],lowBelowHz:[100,8000],highAboveHz:[200,12000]},
} as const satisfies Limits;

const tone={attackSeconds:[.001,.5],lowpassHz:[500,20000],highShelfDb:[-12,12]} as const;
const wave={rateHz:[.1,12],depthCents:[0,600],gainDepth:[0,.9]} as const;
export const shapingLimits={
 version:'version',
 level:{targetRmsDb:[-40,-6],maxBoostDb:[0,40],peakCeilingDb:[-12,0],choiceDb:{soft:[-30,0],medium:[-30,0],loud:[-30,0]},unchosenDb:[-30,0]},
 intensityTone:{soft:tone,medium:tone,loud:tone},
 pitch:{semitonesPerStep:[0,12],maxSemitones:[0,12],shelfDbPerStep:[0,12]},
 duration:{stretchPerStep:[1,4],minStretch:[.2,1],maxStretch:[1,4],textureMinStretch:[.2,1],textureMaxStretch:[1,4]},
 contour:{
  unit:{bendCents:[0,1200],wave},
  texture:{bendCents:[0,1200],rampDb:[0,24],wave},
  sweepClosedHz:[200,8000],sweepOpenHz:[2000,20000],
 },
 pattern:{
  repeat:{count:[2,8],gapSeconds:[0,3],motifMaxSeconds:[.2,10],waveSeconds:[.5,10],waveGapSeconds:[0,3]},
  bursts:{groups:[1,6],hitsPerGroup:[1,8],hitMaxSeconds:[.05,3],innerGapSeconds:[0,1],groupGapSeconds:[.1,3],gustSeconds:[.3,5],gainJitterDb:[0,12]},
  fadeIn:{portion:[.1,1],fromHz:[100,8000],seriesFromDb:[-40,0]},
 },
 grain:{seconds:[.02,.3]},
 edges:{unitTailSeconds:[0,1],unitGapSeconds:[0,1],releaseMinSeconds:[.005,.5],releasePortion:[0,.5],cutFadePortion:[.1,.9],textureFadeSeconds:[.05,2]},
 limits:{cardMaxSeconds:[2,10],clipMaxSeconds:[10,120]},
} as const satisfies Limits;
