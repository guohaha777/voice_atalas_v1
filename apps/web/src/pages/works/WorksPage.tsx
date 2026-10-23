import {useState} from 'react';
import type {SavedWork} from '@wanwu-v2/contracts/work';
import {flowSteps} from '../../app/navigation';
import {ArtPicture} from '../../shared/media/ArtPicture';
import {WorkBackdrop} from '../../shared/scene/WorkBackdrop';
import {FlowHeader} from '../../shared/ui/FlowHeader';
import {KidIcon} from '../../shared/ui/KidIcon';
import {WorkHeaderActions} from '../../shared/ui/WorkHeaderActions';
import {WorkIntro} from '../../shared/ui/WorkIntro';
import {WorkSheet,sheetStyles} from '../../shared/ui/WorkSheet';
import {shelfCopy,shelfGuide} from './config/copy';
import {useWorkShelf} from './model/useWorkShelf';
import {WorkCard} from './components/WorkCard';
import styles from './WorksPage.module.css';

/** 作品书架: the works put on the shelf during this visit (in memory — a refresh empties it). Opening one returns to 万物成曲. */
export function WorksPage({onNavigate}:{onNavigate:(path:string)=>void}){
 const shelf=useWorkShelf();
 const [asking,setAsking]=useState<SavedWork|null>(null);
 const open=(work:SavedWork)=>{shelf.open(work);onNavigate('/compose');};
 const text=shelfCopy.bubble(shelf.works.length);
 return <div className={styles.shell}>
  <WorkBackdrop/>
  <FlowHeader steps={flowSteps} current={null} onNavigate={onNavigate} aside={<WorkHeaderActions onNavigate={onNavigate} current="shelf"/>}/>
  <main className={styles.page}>
   <WorkIntro title={shelfCopy.title} subtitle={shelfCopy.subtitle} guide={shelfGuide} text={text} rekey={false} className={styles.intro}/>
   <p className={styles.session}><span><KidIcon name="lock"/>{shelfCopy.sessionBadge}</span>{shelfCopy.accountNote}</p>
   {shelf.works.length?<ul className={styles.grid}>
    {shelf.works.map(work=><WorkCard key={work.id} work={work} current={shelf.currentId===work.id}
     onOpen={()=>shelf.wouldReplace(work)?setAsking(work):open(work)}/>)}
   </ul>:<section className={styles.empty}>
    <span className={styles.emptyArt}><ArtPicture variants={shelfGuide.variants} className={styles.emptyMascot}/></span>
    <h2>{shelfCopy.empty}</h2>
    <p>{shelfCopy.emptyHint}</p>
    <div className={styles.emptyActions}>
     {shelf.currentId&&<button type="button" className={sheetStyles.secondary} onClick={()=>onNavigate('/compose')}><KidIcon name="back"/>{shelfCopy.goCompose}</button>}
     <button type="button" className={sheetStyles.primary} onClick={()=>onNavigate('/create')}><KidIcon name="plus"/>{shelfCopy.makeOne}</button>
    </div>
   </section>}
  </main>
  {asking&&<WorkSheet title={shelfCopy.replace.title} description={shelfCopy.replace.description} onClose={()=>setAsking(null)}>
   <div className={sheetStyles.actions}>
    <button type="button" className={sheetStyles.secondary} onClick={()=>{setAsking(null);onNavigate('/compose');}}>{shelfCopy.replace.keep}</button>
    <button type="button" className={sheetStyles.primary} onClick={()=>{const work=asking;setAsking(null);open(work);}}>{shelfCopy.replace.open}</button>
   </div>
  </WorkSheet>}
 </div>;
}
