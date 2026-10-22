import type {CSSProperties} from 'react';
import {ArtPicture} from '../../../shared/media/ArtPicture';
import {Icon} from '../../../shared/ui/Icon';
import {startIllustrations} from '../config/art';
import type {CreationEntry} from '../../../app/navigation';
import type {CreationEntryOption} from '../config/entries';
import styles from '../StartDialog.module.css';

export function EntryOption({option,selected,onSelect}:{option:CreationEntryOption;selected:boolean;onSelect:(entry:CreationEntry)=>void}){
 const art=startIllustrations[option.art];
 const artStyle={'--art-ratio':art.heightRatio,aspectRatio:String(art.aspect)} as CSSProperties;
 return <label className={styles.option} data-selected={selected}>
  <input className={styles.radio} type="radio" name="creation-entry" value={option.id} checked={selected} onChange={()=>onSelect(option.id)}/>
  <span className={styles.art}>
   <ArtPicture variants={art.variants} className={styles.artImage} style={artStyle} fallback={<Icon name={option.icon} className={styles.artIcon}/>}/>
  </span>
  <span className={styles.choice}>
   <span className={styles.indicator} aria-hidden="true"/>
   <span className={styles.optionTitle}>{option.title}</span>
   <span className={styles.optionDescription}>{option.description}</span>
  </span>
 </label>;
}
