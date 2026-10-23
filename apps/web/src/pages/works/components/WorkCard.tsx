import type {CSSProperties} from 'react';
import type {SavedWork} from '@wanwu-v2/contracts/work';
import {pieceSeconds,timedEvents} from '../../../shared/creation/arrangementTiming';
import {moodLabels,presetMood} from '../../../shared/creation/moodCopy';
import {SoundMarker} from '../../../shared/markers/SoundMarker';
import {markerFor} from '../../../shared/markers/markers';
import {KidIcon} from '../../../shared/ui/KidIcon';
import {MoodFace} from '../../../shared/ui/MoodFace';
import {shelfCopy} from '../config/copy';
import styles from '../WorksPage.module.css';

const time=(iso:string)=>new Date(iso).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});

/** One shelved work: a small score drawn from its arrangement (same markers and rows), its name, facts and 打开听听. */
export function WorkCard({work,current,onOpen}:{work:SavedWork;current:boolean;onOpen:()=>void}){
 const {arrangement}=work,timed=timedEvents(arrangement),total=pieceSeconds(arrangement);
 const units=new Set(timed.map(item=>item.unit.id)).size,mood=arrangement.mood;
 const moodId=presetMood(mood);
 return <li className={styles.card}>
  <div className={styles.mini} style={{'--rows':arrangement.rows} as CSSProperties} aria-hidden="true">
   {Array.from({length:arrangement.rows},(_,row)=><i key={row} className={styles.miniLane}/>)}
   {timed.map(item=>{
    const position={left:`${4+item.start/total*92}%`,top:`${(item.event.row+.5)/arrangement.rows*100}%`};
    return <i key={`tail-${item.event.id}`} className={styles.miniTail} data-marker={markerFor(item.unit.markerIndex).id} style={{...position,width:`${item.seconds/total*92}%`}}/>;
   })}
   {timed.map(item=><span key={item.event.id} className={styles.miniItem} style={{left:`${4+item.start/total*92}%`,top:`${(item.event.row+.5)/arrangement.rows*100}%`}}>
    <SoundMarker index={item.unit.markerIndex} label={null} className={styles.miniMarker}/>
   </span>)}
  </div>
  <div className={styles.cardBody}>
   <h2>{work.title}{current&&<em>{shelfCopy.current}</em>}</h2>
   <p className={styles.facts}>
    <span>{shelfCopy.sounds(units)}</span><span>{shelfCopy.seconds(String(Math.ceil(total-1e-6)))}</span>
    {moodId&&<span><MoodFace name={moodId} className={styles.factMood}/>{moodLabels[moodId]}</span>}
   </p>
   <p className={styles.meta}><span>{shelfCopy.savedAt(time(work.savedAt))}</span><span><KidIcon name="lock"/>{shelfCopy.visibility[work.visibility]}</span></p>
  </div>
  <button type="button" className={styles.open} onClick={onOpen}><span><KidIcon name="play"/></span>{shelfCopy.open}</button>
 </li>;
}
