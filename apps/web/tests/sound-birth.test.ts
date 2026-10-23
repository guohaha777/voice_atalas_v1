import test from 'node:test';
import assert from 'node:assert/strict';
import {NEUTRAL_SHAPE,SOUND_CHOICES,SOUND_CONTRACT_VERSION,SOUND_SOURCE_MAX_MS,SOUND_DIMENSIONS,cleanSourceText,normalizeMakerName,isCompleteShape,missingProvenance,normalizeSoundName,parseSoundUnitDraft} from '@wanwu-v2/contracts/sound';
import type {SoundSource} from '@wanwu-v2/contracts/sound';
import {describeShape,finishCheck,initialSoundBirth,remainingDimensions,soundBirthReducer,toSoundUnitDraft} from '../src/pages/sound-birth/model/soundBirthState.ts';
import {SessionSourceArchive} from '../src/shared/creation/sourceArchive.ts';
import {libraryGroups} from '../src/pages/sound-birth/services/soundLibrary.ts';
import {presetHintProvider} from '../src/pages/sound-birth/services/soundHints.ts';
import {computePeaks,originalGain,planShape,shapeKey,SHAPING_RULES} from '../src/shared/audio/shapingRules.ts';
import {dragTrimEdge,initialTrim,keyTrim,slideTrim,tapTrim,trimClock} from '../src/pages/sound-birth/model/trimEditing.ts';
import {parseRoute,routeHref} from '../src/app/router.ts';

const example:SoundSource={id:'example:bird',kind:'example',label:'鸟鸣',durationMs:3200,mimeType:'audio/mpeg',
 provenance:{recordedBy:'旧版项目授权录音',recordedOn:null,place:null,group:'示例声音',provenanceUrl:'/legal/sound-sources.html'}};
const recording:SoundSource={id:'recording:1',kind:'local-recording',label:'我的录音',durationMs:5000,mimeType:'audio/webm',
 provenance:{recordedBy:null,recordedOn:'2026-10-22',place:null,group:null,provenanceUrl:null}};
const ready=(source:SoundSource)=>({type:'source-ready' as const,source});
const chooseAll=(state:ReturnType<typeof initialSoundBirth>)=>{for(const [dimension,value] of Object.entries(NEUTRAL_SHAPE))state=soundBirthReducer(state,{type:'choose',dimension:dimension as keyof typeof NEUTRAL_SHAPE,value});return state;};

test('only the library entry opens a dialog first; nothing is preselected',()=>{
 assert.equal(initialSoundBirth('library').dialog,'library');
 for(const entry of ['card','upload',null] as const)assert.equal(initialSoundBirth(entry).dialog,null);
 assert.deepEqual(initialSoundBirth(null).shape,{});
});
test('choices are validated and kept when the sound changes; a new sound brings its own name',()=>{
 let state=soundBirthReducer(initialSoundBirth('card'),{type:'choose',dimension:'pitch',value:'high'});
 assert.equal(soundBirthReducer(state,{type:'choose',dimension:'pitch',value:'loudest'}),state);
 state=soundBirthReducer(state,ready(example));
 state=soundBirthReducer(state,{type:'rename',name:'  小鸟早上好呀今天天气真好呀啊  '});
 assert.equal([...state.name].length,12);
 state=soundBirthReducer(state,ready(recording));
 assert.equal(state.shape.pitch,'high');
 assert.equal(state.name,'我的录音');
 assert.equal(normalizeSoundName('   ','鸟鸣'),'鸟鸣');
});
test('the marker shows who made the card: suggested from a local recorder, editable, never from an example credit',()=>{
 assert.equal(soundBirthReducer(initialSoundBirth(null),ready(example)).maker,null);
 const local={...recording,provenance:{...recording.provenance,recordedBy:'小林'}};
 let state=soundBirthReducer(initialSoundBirth(null),ready(local));
 assert.equal(state.maker,'小林');
 state=soundBirthReducer(state,{type:'maker',name:' 小 周 '});
 assert.equal(state.maker,'小周');
 assert.equal(soundBirthReducer(state,ready(local)).maker,'小周');
 assert.equal(soundBirthReducer(state,{type:'maker',name:'   '}).maker,null);
 assert.equal(normalizeMakerName('一二三四五六七八'),'一二三四五六');
 assert.equal(soundBirthReducer(initialSoundBirth('library'),ready(example)).dialog,null);
});
test('provenance: examples are traceable already; local sources need name, recorder, date and place',()=>{
 assert.deepEqual(missingProvenance(example),[]);
 assert.deepEqual(missingProvenance(recording),['recordedBy','place']);
 assert.deepEqual(missingProvenance({...recording,label:' ',provenance:{...recording.provenance,recordedOn:'22/10'}}),['label','recordedBy','recordedOn','place']);
 assert.equal(cleanSourceText('   '),null);
 assert.equal([...cleanSourceText('学校后山的小树林旁边那条很长很长的小路上面')!].length,20);
});
test('remaining dimensions follow the row order',()=>{
 assert.deepEqual(remainingDimensions({pitch:'low',duration:'short'}),['contour','intensity','pattern']);
 assert.deepEqual(remainingDimensions(NEUTRAL_SHAPE),[]);
});
test('finish guides in order: sound, then provenance; the five choices are optional',()=>{
 let state=initialSoundBirth(null);
 assert.equal(finishCheck(state).kind,'no-source');
 state=soundBirthReducer(state,ready(recording));
 assert.deepEqual(finishCheck(state),{kind:'missing-provenance',fields:['recordedBy','place']});
 assert.equal(toSoundUnitDraft(state,'unit:1',new Date(0)),null);
 state=soundBirthReducer(state,{type:'source-update',source:{...recording,provenance:{...recording.provenance,recordedBy:'小林',place:'学校后山',group:'秋天的后山'}}});
 assert.equal(finishCheck(state).kind,'ready');
 // Nothing chosen: the unit keeps the original sound in every dimension.
 assert.deepEqual(toSoundUnitDraft(state,'unit:1',new Date(0))?.shape,{});
});
test('tapping a choice again takes it back; only that dimension returns to the original',()=>{
 let state=soundBirthReducer(initialSoundBirth(null),{type:'choose',dimension:'pitch',value:'high'});
 state=soundBirthReducer(state,{type:'choose',dimension:'pattern',value:'repeat'});
 state=soundBirthReducer(state,{type:'clear',dimension:'pitch'});
 assert.deepEqual(state.shape,{pattern:'repeat'});
 assert.ok(!('pitch' in state.shape));
 assert.equal(soundBirthReducer(state,{type:'clear',dimension:'pitch'}),state);
});
test('unchosen dimensions plan as the original sound',()=>{
 const plain=planShape({},3);
 assert.equal(plain.semitones,0);
 assert.equal(plain.gain,originalGain);
 assert.equal(plain.filter,'none');
 assert.equal(plain.fadeIn,false);
 assert.deepEqual(plain.events,[{at:0,length:3}]);
 assert.equal(planShape({},30).totalSeconds,SHAPING_RULES.maxTotalSeconds);
 assert.notEqual(shapeKey({}),shapeKey(NEUTRAL_SHAPE));
});
test('trimming a long upload: starts with the first 45 s, stays inside the file and within 1 – 45 s',()=>{
 const total=120_000;
 let range=initialTrim(total);
 assert.deepEqual(range,{startMs:0,endMs:SOUND_SOURCE_MAX_MS});
 assert.deepEqual(initialTrim(50_000),{startMs:0,endMs:45_000});
 assert.deepEqual(dragTrimEdge(range,'end',200_000,total),{startMs:0,endMs:45_000},'never longer than the source limit');
 range=dragTrimEdge(range,'end',10_000,total);
 assert.deepEqual(dragTrimEdge(range,'start',9_800,total),{startMs:9_000,endMs:10_000},'never shorter than 1 s');
 assert.deepEqual(slideTrim(range,500_000,total),{startMs:110_000,endMs:120_000});
 assert.deepEqual(slideTrim(range,-5_000,total),{startMs:0,endMs:10_000});
 assert.deepEqual(tapTrim(range,5_000,total),range,'a tap inside changes nothing');
 assert.deepEqual(tapTrim(range,60_000,total),{startMs:55_000,endMs:65_000});
 assert.deepEqual(keyTrim(range,'end','ArrowRight',false,total),{startMs:0,endMs:10_500});
 assert.deepEqual(keyTrim(range,'start','PageUp',false,total),{startMs:5_000,endMs:15_000});
 assert.equal(keyTrim(range,'start','a',false,total),null);
 assert.equal(trimClock(65_300),'1:05.3');
 assert.equal(trimClock(12_400),'0:12.4');
});
test('a source update for another source is ignored',()=>{
 const state=soundBirthReducer(initialSoundBirth(null),ready(recording));
 assert.equal(soundBirthReducer(state,{type:'source-update',source:{...example}}),state);
});
test('a draft round-trips through the contract parser',()=>{
 const state=chooseAll(soundBirthReducer(initialSoundBirth(null),ready(example)));
 const draft=toSoundUnitDraft(state,'unit:1',new Date(0));
 assert.ok(draft);
 assert.equal(draft.version,SOUND_CONTRACT_VERSION);
 assert.equal(draft.sourceId,'example:bird');
 assert.equal(draft.input,'manual');
 assert.equal(draft.maker,null);
 assert.equal(parseSoundUnitDraft({...draft,maker:'一二三四五六七'}),null);
 assert.ok(parseSoundUnitDraft({...draft,maker:'小林'}));
 assert.deepEqual(parseSoundUnitDraft(JSON.parse(JSON.stringify(draft))),draft);
 assert.equal(parseSoundUnitDraft({...draft,shape:{...draft.shape,pitch:'sky'}}),null);
 assert.equal(parseSoundUnitDraft({...draft,version:'sound-v0'}),null);
 assert.equal(isCompleteShape({pitch:'low'}),false);
 assert.ok(parseSoundUnitDraft({...draft,shape:{pitch:'low'}}),'a partial shape is valid: the rest keeps the original');
 assert.ok(parseSoundUnitDraft({...draft,shape:{}}));
 assert.equal(parseSoundUnitDraft({...draft,shape:{colour:'red'}}),null);
});
test('library: examples first, then this device grouped by 分组, ungrouped last',()=>{
 const archive=new SessionSourceArchive();
 const fake={duration:1} as AudioBuffer;
 const at=(id:string,group:string|null,by:string)=>({...recording,id,provenance:{...recording.provenance,group,recordedBy:by}});
 archive.save(at('r1',null,'小林'),fake);archive.save(at('r2','秋天的后山','小周'),fake);archive.save(at('r3','秋天的后山','小林'),fake);
 const exampleItem={url:'/x.mp3',source:example};
 const groups=libraryGroups([exampleItem],archive.list());
 assert.deepEqual(groups.map(group=>group.title),['示例声音','秋天的后山','未分组']);
 assert.equal(groups[1]!.items.length,2);
 assert.ok(groups[0]!.items.every(item=>item.source.kind==='example'&&item.source.provenance.provenanceUrl));
 assert.deepEqual(archive.recent('recordedBy'),['小林','小周']);
 archive.update({...at('r1','第三课','小林')});
 assert.deepEqual(libraryGroups([exampleItem],archive.list()).map(group=>group.title),['示例声音','第三课','秋天的后山']);
});
test('shaping plan follows the agreed mapping and stays within the preview length',()=>{
 const high=planShape({...NEUTRAL_SHAPE,pitch:'high'},3);
 assert.ok(Math.abs(high.rate-2**(3/12))<1e-9);
 assert.ok(planShape({...NEUTRAL_SHAPE,intensity:'soft'},3).gain<planShape({...NEUTRAL_SHAPE,intensity:'loud'},3).gain);
 assert.equal(planShape({...NEUTRAL_SHAPE,duration:'short'},3).totalSeconds,SHAPING_RULES.duration.shortSeconds);
 const long=planShape({...NEUTRAL_SHAPE,duration:'long'},1);
 assert.equal(long.loop,true);
 assert.ok(long.totalSeconds>=SHAPING_RULES.duration.longMinSeconds);
 assert.equal(planShape({...NEUTRAL_SHAPE,pattern:'repeat'},3).events.length,3);
 assert.equal(planShape({...NEUTRAL_SHAPE,pattern:'bursts'},3).events.length,4);
 assert.equal(planShape({...NEUTRAL_SHAPE,pattern:'fade-in'},3).fadeIn,true);
 for(const pattern of ['once','repeat','bursts','fade-in'] as const)assert.ok(planShape({...NEUTRAL_SHAPE,duration:'long',pattern},30).totalSeconds<=SHAPING_RULES.maxTotalSeconds);
});
test('peaks are normalised and robust to empty input',()=>{
 const peaks=computePeaks([new Float32Array([0,.5,0,-1,0,.25])],3);
 assert.equal(peaks.length,3);
 assert.equal(Math.max(...peaks),1);
 assert.deepEqual(computePeaks([new Float32Array(0)],4),[0,0,0,0]);
});
test('routes: entries parse, unknown entries are dropped, other paths go home',()=>{
 assert.deepEqual(parseRoute('/create','?from=card'),{page:'sound-birth',from:'card'});
 assert.deepEqual(parseRoute('/create/','?from=evil'),{page:'sound-birth',from:null});
 assert.deepEqual(parseRoute('/whatever',''),{page:'home'});
 assert.equal(routeHref({page:'sound-birth',from:'library'}),'/create?from=library');
});
test('the card bubble describes chosen options in row order',()=>{
 const labels={pitch:{high:'高高的'},duration:{},contour:{wavy:'有起伏'},intensity:{},pattern:{}};
 assert.equal(describeShape({contour:'wavy',pitch:'high'},labels),'高高的、有起伏');
 assert.equal(describeShape({},labels),'');
});
test('a local card can only be confirmed once its info is traceable; examples start confirmed',()=>{
 assert.equal(soundBirthReducer(initialSoundBirth(null),ready(example)).cardConfirmed,true);
 let state=soundBirthReducer(initialSoundBirth(null),ready(recording));
 assert.equal(state.cardConfirmed,false);
 assert.equal(soundBirthReducer(state,{type:'card',confirmed:true}),state);
 state=soundBirthReducer(state,{type:'source-update',source:{...recording,provenance:{...recording.provenance,recordedBy:'小林',place:'学校后山'}}});
 state=soundBirthReducer(state,{type:'card',confirmed:true});
 assert.equal(state.cardConfirmed,true);
 assert.equal(state.maker,'小林');
 assert.equal(soundBirthReducer(state,{type:'card',confirmed:false}).cardConfirmed,false);
 assert.equal(soundBirthReducer(state,ready({...recording,id:'recording:2'})).cardConfirmed,false);
});
test('the guide has a preset association for every choice and reports its origin',async()=>{
 for(const dimension of SOUND_DIMENSIONS)for(const value of SOUND_CHOICES[dimension]){
  const hint=await presetHintProvider.hint({dimension,value,shape:{},sourceLabel:null});
  assert.ok(hint&&hint.text.length>4,`${dimension}:${value}`);
  assert.equal(hint.origin,'preset');
 }
 assert.equal(await presetHintProvider.hint({dimension:'pitch',value:'sky',shape:{},sourceLabel:null}),null);
});
