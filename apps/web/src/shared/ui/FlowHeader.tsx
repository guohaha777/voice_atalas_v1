import type {ReactNode} from 'react';
import styles from './FlowHeader.module.css';

type Step={id:string;label:string;path:string|null};

/** Work-page header: brand back to home plus the four-step flow. Only built steps are links. */
/** `aside` holds the page's secondary entries (声音库、作品书架) on the right; hidden on phones. */
export function FlowHeader({steps,current,onNavigate,aside}:{steps:readonly Step[];current:string;onNavigate:(path:string)=>void;aside?:ReactNode}){
 const index=steps.findIndex(step=>step.id===current);
 const go=(path:string)=>(event:React.MouseEvent)=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.button!==0)return;
  event.preventDefault();onNavigate(path);
 };
 return <header className={styles.header}>
  <a className={styles.brand} href="/" onClick={go('/')}>万物声谱</a>
  <nav aria-label="创作步骤">
   <ol className={styles.steps}>
    {steps.map((step,i)=>{
     const content=<><i className={styles.num} aria-hidden="true">{i+1}</i><b className={styles.stepLabel}>{step.label}</b></>;
     return <li key={step.id} data-state={i===index?'current':i<index?'done':'later'}>
      {step.path&&i!==index?<a href={step.path} onClick={go(step.path)}>{content}</a>:<span aria-current={i===index?'step':undefined}>{content}</span>}
     </li>;
    })}
   </ol>
  </nav>
  <p className={styles.compact} aria-hidden="true">{index+1} / {steps.length}</p>
  <div className={styles.aside}>{aside}</div>
 </header>;
}
