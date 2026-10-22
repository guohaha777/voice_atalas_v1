import {SOUND_CHOICES,SOUND_CONTRACT_VERSION,SOUND_DIMENSIONS,isCompleteShape,missingProvenance,normalizeMakerName,normalizeSoundName} from '@wanwu-v2/contracts/sound';
import type {SoundDimension,SoundShape,SoundSource,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import type {CreationEntry} from '../../../app/navigation';

export type CaptureDialog='record'|'library'|null;
/** `area` puts a message next to what it is about: the current-sound bar, the five rows or the card info. */
export type Notice={tone:'info'|'error';area:'bar'|'editor'|'info';text:string}|null;
export type SoundBirthState={
 source:SoundSource|null;
 /** The sound card's own name (child's words); the source keeps its provenance label separately. */
 name:string;
 /** Who made this sound card (nickname), shown on the marker. */
 maker:string|null;
 /** The card's info has been checked and confirmed; the card then shows as the finished big card. */
 cardConfirmed:boolean;
 shape:Partial<SoundShape>;
 cardPhoto:string|null;
 dialog:CaptureDialog;
 reading:boolean;
 notice:Notice;
 markerIndex:number;
};
export type SoundBirthAction=
 |{type:'dialog';dialog:CaptureDialog}
 |{type:'reading';reading:boolean}
 |{type:'source-ready';source:SoundSource}
 |{type:'source-update';source:SoundSource}
 |{type:'rename';name:string}
 |{type:'maker';name:string}
 |{type:'card';confirmed:boolean}
 |{type:'choose';dimension:SoundDimension;value:string}
 |{type:'card-photo';url:string|null}
 |{type:'notice';notice:Notice};

export function initialSoundBirth(entry:CreationEntry|null):SoundBirthState{
 return {source:null,name:'',maker:null,cardConfirmed:false,shape:{},cardPhoto:null,dialog:entry==='library'?'library':null,reading:false,notice:null,markerIndex:0};
}

export function soundBirthReducer(state:SoundBirthState,action:SoundBirthAction):SoundBirthState{
 switch(action.type){
  case 'dialog':return {...state,dialog:action.dialog};
  case 'reading':return {...state,reading:action.reading};
  case 'source-ready':{
   // A new sound brings its own name but keeps the child's five choices (a paper card may be filled in first).
   // The maker starts as whoever recorded a local sound; it is only a suggestion and stays editable.
   const maker=state.maker??(action.source.kind==='example'?null:normalizeMakerName(action.source.provenance.recordedBy??''));
   // Bundled examples are documented already; a local sound starts unconfirmed until its info is checked.
   return {...state,source:action.source,name:action.source.label,maker,cardConfirmed:action.source.kind==='example',dialog:null,reading:false,notice:null};
  }
  case 'source-update':
   if(state.source?.id!==action.source.id)return state;
   return {...state,source:action.source,notice:state.notice?.area==='info'&&!missingProvenance(action.source).length?null:state.notice};
  case 'rename':return {...state,name:normalizeSoundName(action.name,state.source?.label??'')};
  case 'maker':return {...state,maker:normalizeMakerName(action.name)};
  case 'card':
   // Confirming needs a traceable source; going back to edit is always allowed.
   if(action.confirmed&&(!state.source||missingProvenance(state.source).length))return state;
   // On confirm, an unwritten maker defaults to whoever recorded the sound (still editable on the marker).
   const maker=action.confirmed?state.maker??normalizeMakerName(state.source?.provenance.recordedBy??''):state.maker;
   return {...state,cardConfirmed:action.confirmed,maker,notice:action.confirmed&&state.notice?.area==='info'?null:state.notice};
  case 'choose':{
   if(!(SOUND_CHOICES[action.dimension] as readonly string[]).includes(action.value))return state;
   const shape={...state.shape,[action.dimension]:action.value};
   const clearNotice=state.notice?.area==='editor'&&remainingDimensions(shape).length===0;
   return {...state,shape,notice:clearNotice?null:state.notice};
  }
  case 'card-photo':return {...state,cardPhoto:action.url};
  case 'notice':return {...state,notice:action.notice};
 }
}

/** Child-facing summary of the chosen options, in row order, e.g. 「高高的、有起伏」. */
export function describeShape(shape:Partial<SoundShape>,labels:{[K in SoundDimension]:Record<string,string>}){
 return SOUND_DIMENSIONS.flatMap(dimension=>{const value=shape[dimension];return value?[labels[dimension][value]!]:[];}).join('、');
}

export function remainingDimensions(shape:Partial<SoundShape>){return SOUND_DIMENSIONS.filter(dimension=>shape[dimension]===undefined);}

/** What still blocks 做好了, in the order the page guides the child / teacher through it. */
export type FinishCheck={kind:'no-source'}|{kind:'missing-shape';dimensions:SoundDimension[]}|{kind:'missing-provenance';fields:ReturnType<typeof missingProvenance>}|{kind:'ready'};
export function finishCheck(state:Pick<SoundBirthState,'source'|'shape'>):FinishCheck{
 if(!state.source)return {kind:'no-source'};
 const dimensions=remainingDimensions(state.shape);
 if(dimensions.length)return {kind:'missing-shape',dimensions};
 const fields=missingProvenance(state.source);
 if(fields.length)return {kind:'missing-provenance',fields};
 return {kind:'ready'};
}

export function toSoundUnitDraft(state:SoundBirthState,id:string,now:Date):SoundUnitDraft|null{
 if(finishCheck(state).kind!=='ready'||!state.source||!isCompleteShape(state.shape))return null;
 return {version:SOUND_CONTRACT_VERSION,id,sourceId:state.source.id,name:state.name||state.source.label,maker:state.maker,markerIndex:state.markerIndex,
  shape:{...state.shape},input:state.cardPhoto?'paper-card-reference':'manual',createdAt:now.toISOString()};
}
