import {useMemo} from 'react';
import {computePeaks} from '../../../shared/audio/shapingRules';
import {KidIcon} from '../../../shared/ui/KidIcon';
import styles from '../SoundBirthPage.module.css';

const BARS=48;
const clock=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;

/** Real peaks of the buffer being shown; played bars darken from the shared audio clock. */
export function Waveform({buffer,progress,label,playing,onPlay}:{buffer:AudioBuffer|null;progress:number;label:string;playing?:boolean;onPlay?:()=>void}){
 const peaks=useMemo(()=>buffer?computePeaks(Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),BARS):[],[buffer]);
 if(!buffer)return null;
 const played=Math.round(progress*BARS);
 return <div className={styles.wave} data-has-play={!!onPlay||undefined}>
  {onPlay&&<button type="button" className={styles.wavePlay} aria-label={`${playing?'停止':'播放'}${label}`} aria-pressed={playing} onClick={onPlay}><KidIcon name={playing?'stop':'play'}/></button>}
  <svg viewBox={`0 0 ${BARS*4} 40`} preserveAspectRatio="none" role="img" aria-label={label}>
   {peaks.map((peak,i)=>{const h=Math.max(2,peak*36);return <rect key={i} x={i*4+1} y={20-h/2} width="2" height={h} rx="1" className={i<played?styles.waveBarPlayed:styles.waveBar}/>;})}
  </svg>
  <span className={styles.time}>{clock(progress*buffer.duration)} / {clock(Math.max(1,Math.round(buffer.duration)))}</span>
 </div>;
}
