import {flowSteps} from '../../app/navigation';
import {FlowHeader} from '../../shared/ui/FlowHeader';
import {WorkHeaderActions} from '../../shared/ui/WorkHeaderActions';
import type {SoundSource,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import type {CreationEntry} from '../../app/navigation';
import type {FinishResult} from './model/useSoundBirth';
import {ArtPicture} from '../../shared/media/ArtPicture';
import {WorkBackdrop} from '../../shared/scene/WorkBackdrop';
import {birthCopy} from './config/copy';
import {unitGuide} from './config/guide';
import {guideLines} from './config/hintPresets';
import {useSoundBirth} from './model/useSoundBirth';
import {CurrentSoundBar} from './components/CurrentSoundBar';
import {LibraryDialog} from './components/LibraryDialog';
import {RecordDialog} from './components/RecordDialog';
import {ShapeEditor} from './components/ShapeEditor';
import {SoundCard} from './components/SoundCard';
import styles from './SoundBirthPage.module.css';

/** 声音诞生 (采集与转译 merged): bring in a sound with its provenance, set the five choices, compare with the original. */
export function SoundBirthPage({entry,markerIndex,onNavigate,onFinish}:{entry:CreationEntry|null;markerIndex:number;onNavigate:(path:string)=>void;onFinish:(draft:SoundUnitDraft,source:SoundSource)=>FinishResult}){
 // Hand-off to 万物声场 goes through the app, which adds the unit to the current work and opens the field.
 const birth=useSoundBirth(entry,markerIndex,onFinish);
 const guideText=birth.hint?.text??(birth.state.source?guideLines.idle:guideLines.noSound);
 return <div className={styles.shell}>
  <WorkBackdrop/>
  <FlowHeader steps={flowSteps} current="birth" onNavigate={onNavigate} aside={<WorkHeaderActions onLibrary={()=>birth.dispatch({type:'dialog',dialog:'library'})}/>}/>
  <main className={styles.page}>
   <header className={styles.intro}>
    <div className={styles.introText}><h1>{birthCopy.title}</h1><p>{birthCopy.subtitle}</p></div>
    {/* The unit's guide: after each choice it offers a sound association (preset text today, model later). */}
    <aside className={styles.guidePanel} aria-label={unitGuide.label}>
     <p key={guideText} className={styles.guideBubble} aria-live="polite">{guideText}</p>
     <span key={`bird-${guideText}`} className={styles.mascot}><ArtPicture variants={unitGuide.variants} className={styles.mascotArt} priority="high"/></span>
    </aside>
   </header>
   <CurrentSoundBar birth={birth} entry={entry}/>
   <div className={styles.workspace}>
    <SoundCard birth={birth} entry={entry}/>
    <ShapeEditor birth={birth} onBack={()=>onNavigate('/')}/>
   </div>
  </main>
  {birth.state.dialog==='record'&&<RecordDialog birth={birth}/>}
  {birth.state.dialog==='library'&&<LibraryDialog birth={birth}/>}
 </div>;
}
