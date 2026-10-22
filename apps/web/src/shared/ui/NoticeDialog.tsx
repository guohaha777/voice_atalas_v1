import {useEffect,useRef} from 'react';
import {Icon} from './Icon';
import './notice-dialog.css';
export function NoticeDialog({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 const dismiss=()=>{ref.current?.close?.();onClose();};
 useEffect(()=>{const dialog=ref.current;if(!dialog)return;if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');return()=>dialog.close?.();},[]);
 return <dialog ref={ref} className="notice-dialog" aria-labelledby="notice-title" onCancel={e=>{e.preventDefault();dismiss();}} onClick={e=>{if(e.target===e.currentTarget)dismiss();}}>
  <button className="notice-close" aria-label="关闭提示" type="button" onClick={dismiss}><Icon name="close"/></button>
  <h2 id="notice-title">{title}</h2><div className="notice-copy">{children}</div>
  <button className="notice-return" type="button" onClick={dismiss}>回到森林</button>
 </dialog>;
}
