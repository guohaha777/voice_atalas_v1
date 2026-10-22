import {useDecodedImage} from '../../../shared/media/useDecodedImage';
import {startHeading} from '../config/art';
import styles from '../StartDialog.module.css';

/** Hand-lettered title once decoded; plain text if it is slow or fails. The text is always the accessible name. */
export function StartHeading({title}:{title:string}){
 const image=useDecodedImage({mobile:startHeading.variants.mobile.url,desktop:startHeading.variants.desktop.url,fallback:startHeading.variants.fallback.url},startHeading.decodeDeadlineMs);
 const state=image.ready?'ready':image.failed?'text':'loading';
 return <span className={styles.heading} data-state={state} style={{aspectRatio:String(startHeading.aspect)}}>
  <span className={styles.headingText}>{title}</span>
  {image.ready&&<img className={styles.headingImage} src={image.url} alt="" draggable={false}/>}
 </span>;
}
