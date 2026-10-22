import {useState} from 'react';
import {flowSteps,soundWorldDestination} from '../../app/navigation';
import {FlowHeader} from '../../shared/ui/FlowHeader';
import {KidIcon} from '../../shared/ui/KidIcon';
import {NoticeDialog} from '../../shared/ui/NoticeDialog';
import type {CreationEntry} from '../../app/navigation';
import {ArtPicture} from '../../shared/media/ArtPicture';
import {birthCopy} from './config/copy';
import {unitGuide} from './config/guide';
import {guideLines} from './config/hintPresets';
import {useSoundBirth} from './model/useSoundBirth';
import {Backdrop} from './components/Backdrop';
import {CurrentSoundBar} from './components/CurrentSoundBar';
import {LibraryDialog} from './components/LibraryDialog';
import {RecordDialog} from './components/RecordDialog';
import {ShapeEditor} from './components/ShapeEditor';
import {SoundCard} from './components/SoundCard';
import styles from './SoundBirthPage.module.css';

/** 声音诞生 (采集与转译 merged): bring in a sound with its provenance, set the five choices, compare with the original. */
export function SoundBirthPage({entry,onNavigate}:{entry:CreationEntry|null;onNavigate:(path:string)=>void}){
 // Hand-off to 万物声场 goes through the app; until that page is accepted it reports unavailable.
 const birth=useSoundBirth(entry,()=>soundWorldDestination);
 const [shelf,setShelf]=useState(false);
 const guideText=birth.hint?.text??(birth.state.source?guideLines.idle:guideLines.noSound);
 return <div className={styles.shell}>
  <Backdrop/>
  <FlowHeader steps={flowSteps} current="birth" onNavigate={onNavigate} aside={<>
   <button type="button" onClick={()=>birth.dispatch({type:'dialog',dialog:'library'})}><KidIcon name="sounds"/><span>声音库</span></button>
   <button type="button" onClick={()=>setShelf(true)}><KidIcon name="shelf"/><span>作品书架</span></button>
  </>}/>
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
  {shelf&&<NoticeDialog title={birthCopy.shelfTitle} onClose={()=>setShelf(false)}><p>{birthCopy.shelfBody}</p></NoticeDialog>}
 </div>;
}
