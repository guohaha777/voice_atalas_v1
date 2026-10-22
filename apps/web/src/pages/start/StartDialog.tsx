import {Dialog} from '../../shared/ui/Dialog';
import {Icon} from '../../shared/ui/Icon';
import {creationEntries,startCopy} from './config/entries';
import type {CreationEntryIntent,CreationEntryResult} from '../../app/navigation';
import {useCreationEntry} from './model/useCreationEntry';
import {EntryOption} from './components/EntryOption';
import {StartHeading} from './components/StartHeading';
import {StartDecorBottom,StartDecorTop} from './components/StartDecor';
import styles from './StartDialog.module.css';

export function StartDialog({onClose,onContinue}:{onClose:()=>void;onContinue:(intent:CreationEntryIntent)=>CreationEntryResult}){
 const flow=useCreationEntry(onContinue);
 const selected=creationEntries.find(option=>option.id===flow.selected);
 return <Dialog title={startCopy.title} titleContent={<StartHeading title={startCopy.title}/>} description={startCopy.description} eyebrow={startCopy.brand} className={styles.panel} onClose={onClose}>
  <StartDecorTop/>
  <fieldset className={styles.options}>
   <legend className={styles.srOnly}>{startCopy.legend}</legend>
   {creationEntries.map(option=><EntryOption key={option.id} option={option} selected={flow.selected===option.id} onSelect={flow.select}/>)}
  </fieldset>
  <div className={styles.actions}>
   <button className={styles.continue} type="button" disabled={!selected} aria-disabled={flow.unavailable||undefined} onClick={flow.continueToEntry}>
    {flow.unavailable?startCopy.unavailableAction:selected?selected.continueLabel:startCopy.idleAction}<Icon name="arrow"/>
   </button>
   <p className={styles.feedback} role="status" aria-live="polite">{flow.unavailable&&selected?startCopy.unavailable(selected.title):''}</p>
   <StartDecorBottom/>
  </div>
 </Dialog>;
}
