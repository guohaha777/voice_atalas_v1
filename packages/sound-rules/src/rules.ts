// The rule files, checked once when loaded. Pages and the renderer read rules only from here; the numbers themselves live
// in ../rules/*.json so the music role can tune them without touching code (see ../README.md).
import analysisFile from '../rules/analysis.v2.json' with {type:'json'};
import shapingFile from '../rules/shaping.v3.json' with {type:'json'};
import {analysisLimits,checkRules,shapingLimits} from './schema.ts';

export type AnalysisRules=typeof analysisFile;
export type ShapingRules=typeof shapingFile;

export function analysisProblems(rules:AnalysisRules){
 return checkRules('analysis',rules,analysisLimits,[
  [rules.brightness.lowBelowHz<rules.brightness.highAboveHz,'brightness.lowBelowHz 要小于 highAboveHz'],
  [rules.unitLength.shortBelowSeconds<rules.unitLength.longAboveSeconds,'unitLength.shortBelowSeconds 要小于 longAboveSeconds'],
  [Number.isInteger(Math.log2(rules.brightness.fftSize)),'brightness.fftSize 要是 2 的整数次方（512、1024、2048…）'],
 ]);
}
export function shapingProblems(rules:ShapingRules){
 const {duration:d,level:l,pattern:p}=rules;
 return checkRules('shaping',rules,shapingLimits,[
  [d.minStretch<1&&d.maxStretch>1,'duration.minStretch 要小于 1，maxStretch 要大于 1'],
  [d.textureMinStretch<1&&d.textureMaxStretch>1,'duration.textureMinStretch 要小于 1，textureMaxStretch 要大于 1'],
  [l.choiceDb.soft<l.choiceDb.medium&&l.choiceDb.medium<l.choiceDb.loud,'轻响三档要从轻到响递增'],
  [rules.contour.sweepClosedHz<rules.contour.sweepOpenHz,'contour.sweepClosedHz 要小于 sweepOpenHz'],
  [p.repeat.motifMaxSeconds<=rules.limits.cardMaxSeconds&&p.repeat.waveSeconds<=rules.limits.cardMaxSeconds,'重复的一段不能超过声卡试听上限'],
 ]);
}

function load<T>(rules:T,problems:string[]):T{
 if(problems.length)throw new Error(`规则文件有误：\n${problems.join('\n')}`);
 return rules;
}
export const ANALYSIS_RULES:AnalysisRules=load(analysisFile,analysisProblems(analysisFile));
export const SHAPING_RULES:ShapingRules=load(shapingFile,shapingProblems(shapingFile));
