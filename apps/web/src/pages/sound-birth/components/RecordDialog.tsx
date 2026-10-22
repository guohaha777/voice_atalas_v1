import {SOUND_SOURCE_MAX_MS} from '@wanwu-v2/contracts/sound';
import {Dialog} from '../../../shared/ui/Dialog';
import {KidIcon} from '../../../shared/ui/KidIcon';
import {birthCopy} from '../config/copy';
import type {useSoundBirth} from '../model/useSoundBirth';
import {Waveform} from './Waveform';
import styles from '../SoundBirthPage.module.css';

type Birth=ReturnType<typeof useSoundBirth>;
const copy=birthCopy.recordDialog;
const seconds=(ms:number)=>`00:${String(Math.floor(ms/1000)).padStart(2,'0')}`;

/** 录一段声音: record → listen back → use or retake. Nothing leaves the device. */
export function RecordDialog({birth}:{birth:Birth}){
 const {phase,ms,take,progress}=birth.record;
 const error=birth.state.notice?.area==='bar'&&birth.state.notice.tone==='error'?birth.state.notice.text:'';
 return <Dialog title={copy.title} description={copy.description} className={styles.sheet} onClose={birth.closeDialog}>
  <div className={styles.recorder} data-phase={phase}>
   {phase==='review'&&take?<>
    <Waveform buffer={take} progress={progress} label="刚录的声音" playing={birth.playing==='take'} onPlay={birth.listenTake}/>
    <div className={styles.sheetActions}>
     <button type="button" className={styles.secondary} onClick={()=>void birth.startRecording()}><KidIcon name="replay"/>{copy.retake}</button>
     <button type="button" className={styles.primary} onClick={birth.useTake}>{copy.use}<KidIcon name="arrow"/></button>
    </div>
   </>:<>
    <p className={styles.recTime} role="timer" aria-live="off">{phase==='recording'&&<span className={styles.recDot} aria-hidden="true"/>}{seconds(birth.record.ms)}<small> / {seconds(SOUND_SOURCE_MAX_MS)}</small></p>
    {phase==='recording'
     ?<button type="button" className={styles.recButton} data-active onClick={()=>void birth.stopRecording()}><KidIcon name="stop"/>{copy.stop}</button>
     :<button type="button" className={styles.recButton} disabled={phase==='starting'} onClick={()=>void birth.startRecording()}><KidIcon name="mic"/>{phase==='starting'?copy.starting:copy.start}</button>}
    {ms===0&&<p className={styles.sheetNote} role="status">{error}</p>}
   </>}
  </div>
 </Dialog>;
}
