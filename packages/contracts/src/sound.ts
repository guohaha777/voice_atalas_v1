// Sound source / sound shape contract shared by the front end and the future service layer.
// Version every persisted shape. Original audio is referenced, never rewritten; the five choices belong to the child.

export const SOUND_CONTRACT_VERSION='sound-v1' as const;

/** Where the audio came from. `local-*` means it only exists on this device and has not been uploaded. */
export type SoundSourceKind='example'|'local-recording'|'local-file';
/**
 * Who captured the sound, when, where and in which group — so every sound in a work can be traced back.
 * Children are recorded by nickname and places stay approximate (no real names, faces or exact locations).
 */
export type SourceProvenance={
 recordedBy:string|null;
 /** Calendar date YYYY-MM-DD in the recorder's local time. */
 recordedOn:string|null;
 place:string|null;
 /** Teacher-defined collection such as an outing or a lesson; groups the source in the library. */
 group:string|null;
 /** Public licence / source record for bundled examples. */
 provenanceUrl:string|null;
};
export type SoundSource={
 id:string;
 kind:SoundSourceKind;
 /** Name of the source itself (采集时的来源名称). The sound card keeps its own display name. */
 label:string;
 durationMs:number;
 mimeType:string;
 provenance:SourceProvenance;
};

export const SOURCE_TEXT_MAX=20;
/** Fields a locally captured source still needs before it is traceable. Bundled examples are documented elsewhere. */
export function missingProvenance(source:SoundSource):('label'|'recordedBy'|'recordedOn'|'place')[]{
 if(source.kind==='example')return [];
 const missing:('label'|'recordedBy'|'recordedOn'|'place')[]=[];
 if(!source.label.trim())missing.push('label');
 if(!source.provenance.recordedBy?.trim())missing.push('recordedBy');
 if(!source.provenance.recordedOn||!/^\d{4}-\d{2}-\d{2}$/.test(source.provenance.recordedOn))missing.push('recordedOn');
 if(!source.provenance.place?.trim())missing.push('place');
 return missing;
}
/** Trim and cap free-text provenance; empty becomes null so "not filled" is explicit. */
export function cleanSourceText(value:string){const clean=[...value.replace(/\s+/g,' ').trim()].slice(0,SOURCE_TEXT_MAX).join('');return clean||null;}

export type PitchChoice='low'|'mid'|'high';
export type DurationChoice='short'|'medium'|'long';
export type ContourChoice='rising'|'falling'|'flat'|'wavy';
export type IntensityChoice='soft'|'medium'|'loud';
export type PatternChoice='once'|'repeat'|'bursts'|'fade-in';
/** The five paper-card dimensions: 高低、长短、变化、轻响、出现方式. No sixth dimension. */
export type SoundShape={pitch:PitchChoice;duration:DurationChoice;contour:ContourChoice;intensity:IntensityChoice;pattern:PatternChoice};
export type SoundDimension=keyof SoundShape;

export const SOUND_DIMENSIONS:readonly SoundDimension[]=['pitch','duration','contour','intensity','pattern'];
export const SOUND_CHOICES:{readonly [K in SoundDimension]:readonly SoundShape[K][]}={
 pitch:['low','mid','high'],
 duration:['short','medium','long'],
 contour:['rising','falling','flat','wavy'],
 intensity:['soft','medium','loud'],
 pattern:['once','repeat','bursts','fade-in'],
};
/** Used only to render a preview while a dimension is still unchosen; never stored as the child's choice. */
export const NEUTRAL_SHAPE:SoundShape={pitch:'mid',duration:'medium',contour:'flat',intensity:'medium',pattern:'once'};

/** How the five choices were entered. Paper-card recognition is not implemented, so a photo is reference only. */
export type ShapeInput='manual'|'paper-card-reference';

/** A finished sound unit ready for the sound world. `sourceId` (identity) and later event IDs stay separate. */
export type SoundUnitDraft={
 version:typeof SOUND_CONTRACT_VERSION;
 id:string;
 sourceId:string;
 name:string;
 /** Nickname of the child who made this sound card; shown on the marker. Null shows the number instead. */
 maker:string|null;
 /** Position in this creation; drives the neutral marker artwork and the visible number. */
 markerIndex:number;
 shape:SoundShape;
 input:ShapeInput;
 createdAt:string;
};

export const SOUND_NAME_MAX=12;
/** Short enough to sit on the marker artwork. */
export const MAKER_NAME_MAX=6;
export const SOUND_SOURCE_MAX_MS=30_000;

export function isCompleteShape(shape:Partial<SoundShape>):shape is SoundShape{
 return SOUND_DIMENSIONS.every(dimension=>(SOUND_CHOICES[dimension] as readonly string[]).includes(shape[dimension] as string));
}

export function normalizeMakerName(name:string){const clean=[...name.replace(/\s+/g,'').trim()].slice(0,MAKER_NAME_MAX).join('');return clean||null;}

export function normalizeSoundName(name:string,fallback:string){
 const clean=[...name.replace(/\s+/g,' ').trim()].slice(0,SOUND_NAME_MAX).join('');
 return clean||[...fallback.trim()].slice(0,SOUND_NAME_MAX).join('')||'我的声音';
}

/** Validates an incoming unit (e.g. from a future API or storage) before the UI trusts it. */
export function parseSoundUnitDraft(value:unknown):SoundUnitDraft|null{
 if(!value||typeof value!=='object')return null;
 const unit=value as Record<string,unknown>;
 if(unit.version!==SOUND_CONTRACT_VERSION)return null;
 for(const key of ['id','sourceId','name','createdAt'])if(typeof unit[key]!=='string'||!unit[key])return null;
 if(!Number.isInteger(unit.markerIndex)||(unit.markerIndex as number)<0)return null;
 if(unit.input!=='manual'&&unit.input!=='paper-card-reference')return null;
 if(!unit.shape||typeof unit.shape!=='object'||!isCompleteShape(unit.shape as Partial<SoundShape>))return null;
 if([...(unit.name as string)].length>SOUND_NAME_MAX)return null;
 if(unit.maker!==null&&(typeof unit.maker!=='string'||!unit.maker||[...unit.maker].length>MAKER_NAME_MAX))return null;
 return unit as SoundUnitDraft;
}
