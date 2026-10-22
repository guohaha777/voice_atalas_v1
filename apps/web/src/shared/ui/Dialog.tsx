import {useEffect,useId,useRef} from 'react';
import type {ReactNode} from 'react';
import {Icon} from './Icon';
import styles from './Dialog.module.css';

type DialogProps={
 title:string;
 /** Visual replacement for the title text (e.g. lettering artwork); it must keep the title readable to assistive tech. */
 titleContent?:ReactNode;
 description?:string;
 eyebrow?:string;
 className?:string;
 children:ReactNode;
 onClose:()=>void;
};

/** Native modal owns focus containment; the caller owns its content and dismissal state. */
export function Dialog({title,titleContent,description,eyebrow,className='',children,onClose}:DialogProps){
 const ref=useRef<HTMLDialogElement>(null);
 const id=useId();
 useEffect(()=>{
  const dialog=ref.current;
  if(!dialog)return;
  const returnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  dialog.showModal();
  return()=>{
   dialog.close();
   document.body.style.overflow=previousOverflow;
   if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  };
 },[]);
 return <dialog ref={ref} className={`${styles.dialog} ${className}`} aria-labelledby={`${id}-title`}
  aria-describedby={description?`${id}-description`:undefined}
  onCancel={event=>{event.preventDefault();onClose();}}
  onClick={event=>{
   if(event.target!==event.currentTarget)return;
   const rect=event.currentTarget.getBoundingClientRect();
   if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();
  }}>
  <button className={styles.close} type="button" aria-label="关闭弹窗" onClick={onClose}><Icon name="close"/></button>
  <header className={styles.header}>
   {eyebrow&&<p className={styles.eyebrow}>{eyebrow}</p>}
   <h2 id={`${id}-title`}>{titleContent??title}</h2>
   {description&&<p id={`${id}-description`} className={styles.description}>{description}</p>}
  </header>
  {children}
 </dialog>;
}
