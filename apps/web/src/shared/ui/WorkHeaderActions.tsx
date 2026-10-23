import {useState} from 'react';
import {KidIcon} from './KidIcon';
import {NoticeDialog} from './NoticeDialog';

const copy={library:'声音库',shelf:'作品书架',shelfTitle:'作品书架还在准备中',shelfBody:'做好的作品以后会放在这里。'};

/**
 * The work pages' secondary entries in the flow header (声音库 · 作品书架). Each page decides what 声音库 opens; the
 * shelf is not built yet, so it says so in one shared notice. Place inside FlowHeader's `aside`.
 */
export function WorkHeaderActions({onLibrary}:{onLibrary:()=>void}){
 const [shelf,setShelf]=useState(false);
 return <>
  <button type="button" onClick={onLibrary}><KidIcon name="sounds"/><span>{copy.library}</span></button>
  <button type="button" onClick={()=>setShelf(true)}><KidIcon name="shelf"/><span>{copy.shelf}</span></button>
  {shelf&&<NoticeDialog title={copy.shelfTitle} onClose={()=>setShelf(false)}><p>{copy.shelfBody}</p></NoticeDialog>}
 </>;
}
