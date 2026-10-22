import {ArtPicture} from '../../../shared/media/ArtPicture';
import {backdropLayers,backdropOpacity} from '../config/backdrop';
import styles from '../SoundBirthPage.module.css';

/** Decorative, fixed behind everything; loads at low priority and is skipped on phones. */
export function Backdrop(){
 return <div className={styles.backdrop} style={{opacity:backdropOpacity}} aria-hidden="true">
  {backdropLayers.map(layer=><ArtPicture key={layer.id} variants={layer.variants} priority="low" className={styles.backdropLayer} style={layer.box}/>)}
 </div>;
}
