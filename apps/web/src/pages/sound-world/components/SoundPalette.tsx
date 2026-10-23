import {SoundMarker} from '../../../shared/markers/SoundMarker';
import {markerNumber} from '../../../shared/markers/markers';
import {inspirationCopy} from '../../../shared/inspiration/copy';
import {KidIcon} from '../../../shared/ui/KidIcon';
import {worldCopy} from '../config/copy';
import {placedCount} from '../model/soundWorldState';
import type {SoundWorld} from '../model/useSoundWorld';
import type {useFieldDrag} from '../model/useFieldDrag';
import type {LibraryScope} from '../services/soundWorldRepository';
import {libraryScopes} from '../services/soundWorldRepository';
import styles from '../SoundWorldPage.module.css';

/** 选一个声音: the work's sounds as cards. Tap a card to pick it (or drag it into the field); 试听 is a separate button. */
export function SoundPalette({world,bind,onMore,onInspiration}:{world:SoundWorld;bind:ReturnType<typeof useFieldDrag>['bind'];onMore:(scope:LibraryScope)=>void;onInspiration:()=>void}){
 const {arrangement,selection}=world.state;
 return <section className={styles.palette} aria-labelledby="palette-title">
  <h2 id="palette-title">{worldCopy.paletteTitle}</h2>
  <ul className={styles.paletteList}>
   {arrangement?.units.map(unit=>{
    const selected=selection?.kind==='unit'&&selection.unitId===unit.id,count=placedCount(arrangement,unit.id);
    const key=`unit:${unit.id}`,listening=world.playing===key,waiting=world.preparing===key;
    return <li key={unit.id} className={styles.paletteItem} data-selected={selected||undefined}>
     <button type="button" className={styles.pick} aria-pressed={selected} {...bind({kind:'unit',unitId:unit.id})}>
      <SoundMarker index={unit.markerIndex} className={styles.paletteMarker}/>
      <span className={styles.pickText}>
       <b>{markerNumber(unit.markerIndex)} · {unit.name}</b>
       <small>{unit.input==='example-preset'&&<em>{worldCopy.example}</em>}{count>0&&worldCopy.placedTimes(count)}</small>
      </span>
     </button>
     <button type="button" className={styles.listen} aria-pressed={listening} aria-label={`${listening?worldCopy.stop:worldCopy.listen}「${unit.name}」`}
      data-waiting={waiting||undefined} onClick={()=>world.previewUnit(unit)}>
      <span className={styles.listenIcon}><KidIcon name={listening?'stop':'play'}/></span>{listening?worldCopy.stop:worldCopy.listen}
     </button>
    </li>;
   })}
  </ul>
  <div className={styles.paletteFoot}>
   {/* 课本灵感 before arranging: listen to the textbook rhythm (or the teacher's music) first, then place the sounds. */}
   <button type="button" className={styles.inspiration} data-on={world.inspiration.kind!=='none'||undefined} onClick={onInspiration}>
    <span className={styles.inspirationBadge}><KidIcon name="book"/></span>
    <span className={styles.inspirationText}><b>{worldCopy.inspiration}</b><small>{inspirationCopy.summary(world.inspiration,world.inspirationEntries)}</small></span>
   </button>
   <button type="button" className={styles.more} onClick={()=>onMore('example')}><KidIcon name="plus"/>{worldCopy.more}</button>
   <p className={styles.scopes}>
    {libraryScopes.map(scope=><button key={scope} type="button" onClick={()=>onMore(scope)}>{worldCopy.moreDialog.scopes[scope]}</button>)}
   </p>
  </div>
 </section>;
}
