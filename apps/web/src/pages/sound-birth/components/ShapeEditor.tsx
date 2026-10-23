import {useEffect,useRef} from 'react';
import {SOUND_CHOICES,SOUND_DIMENSIONS} from '@wanwu-v2/contracts/sound';
import type {SoundDimension} from '@wanwu-v2/contracts/sound';
import {KidIcon} from '../../../shared/ui/KidIcon';
import {birthCopy} from '../config/copy';
import {dimensionCopy} from '../../../shared/creation/dimensionCopy';
import type {useSoundBirth} from '../model/useSoundBirth';
import {remainingDimensions} from '../model/soundBirthState';
import {Equalizer} from './Equalizer';
import {ShapeGlyph} from './ShapeGlyph';
import styles from '../SoundBirthPage.module.css';

type Birth=ReturnType<typeof useSoundBirth>;
const label=(dimension:SoundDimension,value:string)=>(dimensionCopy[dimension].options as Record<string,string>)[value];

/** 转译: all five dimensions laid out as rows, so every choice is one tap away. Choosing also plays the result. */
export function ShapeEditor({birth,onBack}:{birth:Birth;onBack:()=>void}){
 const {state}=birth,rows=useRef<HTMLDivElement>(null);
 const editorNotice=state.notice?.area==='editor'?state.notice:null;
 const missing=editorNotice?remainingDimensions(state.shape):[];
 const done=SOUND_DIMENSIONS.length-remainingDimensions(state.shape).length;
 // Guided finish: bring the first unchosen row into view.
 useEffect(()=>{
  if(!editorNotice||!missing.length)return;
  rows.current?.querySelector(`[data-dimension="${missing[0]}"]`)?.scrollIntoView({block:'center',behavior:'smooth'});
 // Runs when a new guidance notice appears.
 },[editorNotice]);
 return <section className={styles.editor} aria-labelledby="shape-title">
  <header className={styles.editorHead}>
   <div><h2 id="shape-title">{birthCopy.shapeTitle}</h2><p>{state.cardPhoto?birthCopy.paperCardNote:birthCopy.optionHint}</p></div>
   <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={SOUND_DIMENSIONS.length} aria-valuenow={done} aria-label={birthCopy.progress(done,SOUND_DIMENSIONS.length)}>
    <span className={styles.progressFill} style={{width:`${Math.max(done,.6)/SOUND_DIMENSIONS.length*100}%`}}>{done>0&&<KidIcon name="check"/>}</span>
    <b>{birthCopy.progress(done,SOUND_DIMENSIONS.length)}</b>
   </div>
  </header>
  <div ref={rows} className={styles.rows}>
   {SOUND_DIMENSIONS.map(dimension=>{
    const copy=dimensionCopy[dimension],chosen=state.shape[dimension];
    return <div key={dimension} className={styles.row} data-dimension={dimension} data-missing={missing.includes(dimension)||undefined}
     role="radiogroup" aria-labelledby={`row-${dimension}`}>
     <span id={`row-${dimension}`} className={styles.rowLabel}>
      <span className={styles.rowBadge} data-done={!!chosen||undefined}><KidIcon name={chosen?'check':copy.icon}/></span>{copy.label}
     </span>
     <div className={styles.rowOptions} data-count={SOUND_CHOICES[dimension].length}>
      {SOUND_CHOICES[dimension].map(value=>{const checked=chosen===value,sounding=checked&&birth.playing==='current'&&birth.lastChosen===dimension;
       return <button key={value} type="button" role="radio" aria-checked={checked}
       className={styles.choice} data-playing={sounding||undefined} onClick={()=>birth.choose(dimension,value)}>
       <ShapeGlyph dimension={dimension} value={value}/><span>{label(dimension,value)}</span>
       {sounding&&<Equalizer/>}
      </button>;})}
     </div>
    </div>;
   })}
  </div>
  <p className={styles.notice} role="status" aria-live="polite" data-tone={editorNotice?.tone}>{editorNotice?.text??''}</p>
  <div className={styles.actions}>
   <button type="button" className={styles.backButton} onClick={onBack}><KidIcon name="back"/>{birthCopy.backEntry}</button>
   <button type="button" className={styles.finish} aria-disabled={birth.blocked||undefined} onClick={birth.finish}>
    {birth.blocked?birthCopy.finishUnavailable:birthCopy.finish}<KidIcon name="arrow"/>
   </button>
  </div>
 </section>;
}
