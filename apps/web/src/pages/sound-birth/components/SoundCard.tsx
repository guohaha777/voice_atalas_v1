import {useState} from 'react';
import {SOUND_NAME_MAX} from '@wanwu-v2/contracts/sound';
import type {SoundSource} from '@wanwu-v2/contracts/sound';
import {SoundMarker} from '../../../shared/markers/SoundMarker';
import {KidIcon} from '../../../shared/ui/KidIcon';
import type {CreationEntry} from '../../../app/navigation';
import {birthCopy} from '../config/copy';
import {dimensionCopy} from '../config/dimensions';
import {describeShape} from '../model/soundBirthState';
import type {useSoundBirth} from '../model/useSoundBirth';
import {Equalizer} from './Equalizer';
import {MakerLabel} from './MakerLabel';
import {SoundInfo} from './SoundInfo';
import {Waveform} from './Waveform';
import styles from '../SoundBirthPage.module.css';

type Birth=ReturnType<typeof useSoundBirth>;
const labels={pitch:dimensionCopy.pitch.options,duration:dimensionCopy.duration.options,contour:dimensionCopy.contour.options,intensity:dimensionCopy.intensity.options,pattern:dimensionCopy.pattern.options};
const day=(iso:string|null)=>iso?`${Number(iso.slice(5,7))}月${Number(iso.slice(8,10))}日`:null;

/**
 * 我的声卡. A local sound starts in edit mode (compact top + 声卡信息 form + 确认). Once confirmed — or for a bundled
 * example — it becomes the big card, with the confirmed info placed on it: maker on the marker, group as a tag,
 * who / where / when under the name.
 */
export function SoundCard({birth,entry}:{birth:Birth;entry:CreationEntry|null}){
 const {state}=birth,source=state.source;
 const sounding=birth.playing==='original'||birth.playing==='current';
 const description=describeShape(state.shape,labels);
 const bubble=!source?birthCopy.bubble.empty:sounding?birthCopy.bubble.sounding:description?birthCopy.bubble.shaped(description):birthCopy.bubble.fresh(state.name);
 const big=!source||state.cardConfirmed;
 return <section className={styles.card} data-mode={big?'card':'edit'} aria-labelledby="my-card-title">
  <h2 id="my-card-title" className={styles.cardTitle}>{birthCopy.myCard}
   {source&&state.cardConfirmed&&source.kind!=='example'&&<button type="button" className={styles.cardEdit} onClick={()=>birth.dispatch({type:'card',confirmed:false})}><KidIcon name="edit"/>{birthCopy.editCard}</button>}
  </h2>
  <div className={styles.cardTop}>
   <div className={styles.stage} data-sounding={sounding||undefined} data-empty={!source||undefined}>
    {big&&source?.provenance.group&&<span className={styles.groupTag}>{source.provenance.group}</span>}
    <p key={bubble} className={styles.bubble} aria-live="polite">{bubble}</p>
    <SoundMarker index={state.markerIndex} className={styles.cardMarker}
     label={source?<MakerLabel maker={state.maker} index={state.markerIndex} onChange={name=>birth.dispatch({type:'maker',name})}/>:undefined}/>
   </div>
   <div className={styles.cardMain}>
    {source?<>
     <Identity birth={birth} source={source}/>
     <Waveform buffer={birth.wave.buffer} progress={birth.wave.progress} label={birth.wave.target==='current'?'现在的声音':'原声'}
      playing={birth.playing===birth.wave.target} onPlay={birth.playShown}/>
     <div className={styles.compare}>
      {(['original','current'] as const).map(target=>{const active=birth.playing===target;return <button key={target} type="button" aria-pressed={active}
       className={target==='current'?styles.primary:styles.secondary} onClick={()=>birth.playCompare(target)}>
       {active?<Equalizer/>:<KidIcon name="play"/>}{active?birthCopy.stopPlaying:target==='original'?birthCopy.original:birthCopy.current}</button>;})}
     </div>
     {big&&<p className={styles.cardFoot}>{birthCopy.keepOriginal}</p>}
    </>:<p className={styles.cardEmpty}>{birthCopy.emptyCard[entry??'direct']}</p>}
   </div>
  </div>
  {source&&!big&&<SoundInfo birth={birth}/>}
 </section>;
}

function Identity({birth,source}:{birth:Birth;source:SoundSource}){
 const {state}=birth,[editing,setEditing]=useState(false);
 const p=source.provenance;
 const meta=source.kind==='example'
  ?<>{birthCopy.sourceLabel.example} · {birthCopy.credit(p.recordedBy??'')} · <a href={p.provenanceUrl??'#'} target="_blank" rel="noopener">{birthCopy.license}</a></>
  :state.cardConfirmed?[p.recordedBy,p.place,day(p.recordedOn)].filter(Boolean).join(' · '):birthCopy.sourceLabel[source.kind];
 return <div className={styles.identity}>
  {editing?<input className={styles.nameInput} defaultValue={state.name} maxLength={SOUND_NAME_MAX} aria-label="声卡名字" autoFocus
    onBlur={event=>{birth.dispatch({type:'rename',name:event.currentTarget.value});setEditing(false);}}
    onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();if(event.key==='Escape'){event.currentTarget.value=state.name;event.currentTarget.blur();}}}/>
   :<h3 className={styles.name}>{state.name}<button type="button" className={styles.iconButton} aria-label={birthCopy.rename} onClick={()=>setEditing(true)}><KidIcon name="edit"/></button></h3>}
  <p className={styles.sourceKind}>{meta}</p>
 </div>;
}
