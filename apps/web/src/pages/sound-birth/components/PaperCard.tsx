import {useRef,useState} from 'react';
import {WorkSheet,sheetStyles} from '../../../shared/ui/WorkSheet';
import {KidIcon} from '../../../shared/ui/KidIcon';
import {birthCopy} from '../config/copy';
import styles from '../SoundBirthPage.module.css';

/** 拍照读声卡: the photo stays on this device as a reference while choosing. No recognition runs yet. */
export function PaperCard({photo,emphasis,onChange}:{photo:string|null;emphasis:boolean;onChange:(file:File|null)=>void}){
 const input=useRef<HTMLInputElement>(null);
 const [open,setOpen]=useState(false);
 const pick=()=>input.current?.click();
 return <>
  {photo?<button type="button" className={styles.tileButton} data-tone="card" onClick={()=>setOpen(true)}><span className={styles.tile}><img src={photo} alt=""/></span>{birthCopy.paperCardChip}</button>
   :<button type="button" className={styles.tileButton} data-tone="card" data-emphasis={emphasis||undefined} onClick={pick}><span className={styles.tile}><KidIcon name="camera"/></span>{birthCopy.paperCard}</button>}
  <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file?.type.startsWith('image/')){onChange(file);setOpen(false);}}}/>
  {open&&photo&&<WorkSheet title={birthCopy.paperCardChip} description={birthCopy.paperCardNote} onClose={()=>setOpen(false)}>
   <img className={styles.cardLarge} src={photo} alt="纸卡照片"/>
   <div className={sheetStyles.actions}>
    <button type="button" className={styles.secondary} onClick={pick}><KidIcon name="camera"/>重拍</button>
    <button type="button" className={styles.secondary} onClick={()=>{onChange(null);setOpen(false);}}>移除照片</button>
   </div>
  </WorkSheet>}
 </>;
}
