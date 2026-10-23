import {useState} from 'react';
import {KidIcon} from './KidIcon';
import {WorkSheet,sheetStyles} from './WorkSheet';

const copy={library:'声音库',shelf:'作品书架',
 libraryTitle:'声音库在万物声场里',libraryBody:'回到万物声场，点「找更多声音」，就能加示例声音和自己做的声音。班级和公共声音库还没有开放。',
 goWorld:'去万物声场',stay:'留在这里'};

/**
 * The work pages' secondary entries in the flow header (声音库 · 作品书架). A page with its own sound library passes
 * `onLibrary`; elsewhere 声音库 explains where the library lives. 作品书架 opens the shelf page. Place inside FlowHeader's
 * `aside`; `current` marks the shelf button on the shelf page.
 */
export function WorkHeaderActions({onLibrary,onNavigate,current}:{onLibrary?:()=>void;onNavigate:(path:string)=>void;current?:'shelf'}){
 const [library,setLibrary]=useState(false);
 return <>
  <button type="button" onClick={onLibrary??(()=>setLibrary(true))}><KidIcon name="sounds"/><span>{copy.library}</span></button>
  <button type="button" aria-current={current==='shelf'?'page':undefined} onClick={()=>onNavigate('/works')}><KidIcon name="shelf"/><span>{copy.shelf}</span></button>
  {library&&<WorkSheet title={copy.libraryTitle} onClose={()=>setLibrary(false)}>
   <p className={sheetStyles.body}>{copy.libraryBody}</p>
   <div className={sheetStyles.actions}>
    <button type="button" className={sheetStyles.secondary} onClick={()=>setLibrary(false)}>{copy.stay}</button>
    <button type="button" className={sheetStyles.primary} onClick={()=>{setLibrary(false);onNavigate('/world');}}>{copy.goWorld}</button>
   </div>
  </WorkSheet>}
 </>;
}
