import type {ReactNode} from 'react';
import {ArtPicture} from '../media/ArtPicture';
import {markerFor,markerNumber} from './markers';
import styles from './SoundMarker.module.css';

/**
 * Marker artwork with a live label overlaid: by default the number, or the caller's content (e.g. the maker's name).
 * Pass `label={null}` for small sizes where a label would not be legible. Size comes from the caller's class (width).
 */
export function SoundMarker({index,className='',label}:{index:number;className?:string;label?:ReactNode}){
 const marker=markerFor(index);
 return <span className={`${styles.marker} ${className}`} data-marker={marker.id}>
  <ArtPicture variants={marker.variants} className={styles.art} fallback={<span className={styles.shape}/>}/>
  {label!==null&&<span className={styles.label}>{label??markerNumber(index)}</span>}
 </span>;
}
