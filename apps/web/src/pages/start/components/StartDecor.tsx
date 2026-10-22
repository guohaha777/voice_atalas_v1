import {ArtPicture} from '../../../shared/media/ArtPicture';
import {startDecor} from '../config/art';
import styles from '../StartDialog.module.css';

/** Sparse paper foliage on the panel edges. Purely decorative and never receives pointer events. */
export function StartDecorTop(){
 return <ArtPicture variants={startDecor.upperLeft} className={styles.decorUpper} priority="low"/>;
}
export function StartDecorBottom(){
 return <span className={styles.decorBottom} aria-hidden="true">
  <ArtPicture variants={startDecor.pond} className={styles.decorPond} priority="low"/>
  <ArtPicture variants={startDecor.fern} className={styles.decorFern} priority="low"/>
 </span>;
}
