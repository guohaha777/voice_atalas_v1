import {useState} from 'react';
import {flowSteps} from '../../app/navigation';
import {FlowHeader} from '../../shared/ui/FlowHeader';
import {Glyph} from '../../shared/ui/PaperIcon';
import {WorkHeaderActions} from '../../shared/ui/WorkHeaderActions';
import {WorkIntro} from '../../shared/ui/WorkIntro';
import {composeCopy} from './config/copy';
import {composeGuide,guideLines} from './config/guide';
import {useCompose} from './model/useCompose';
import type {Compose} from './model/useCompose';
import {InspirationDialog} from '../../shared/inspiration/InspirationDialog';
import {AgainDialog,SaveDialog} from './components/ComposeDialogs';
import {FooterBar} from './components/FooterBar';
import {ScoreCard} from './components/ScoreCard';
import {BackgroundCard,InspirationCard,SpanCard} from './components/SideCards';
import styles from './ComposePage.module.css';

function guideText(compose:Compose){
 const {arrangement,lastAction}=compose.state;
 if(!arrangement)return guideLines.loading;
 if(compose.playing)return guideLines.playing;
 if(!arrangement.events.length)return guideLines.empty;
 if(lastAction==='saved'&&compose.shelved)return guideLines.saved;
 if(compose.ended)return guideLines.ended;
 if(lastAction==='span')return guideLines.span(arrangement.spanSeconds);
 if(lastAction==='inspiration')return guideLines.inspiration;
 if(compose.now>0)return guideLines.paused;
 if(arrangement.origin==='example')return guideLines.example;
 return guideLines.idle;
}

type Dialog='save'|'textbook'|'again'|null;

/** 万物成曲: the field's arrangement as a graphic score with one playback clock, plus length, background, inspiration and the shelf. */
export function ComposePage({onNavigate}:{onNavigate:(path:string)=>void}){
 const compose=useCompose();
 const [dialog,setDialog]=useState<Dialog>(null);
 const text=guideText(compose);
 const notice=compose.state.notice;
 const savedNote=compose.state.lastAction==='saved'&&compose.shelved;
 const requestSave=()=>{if(compose.canSave())setDialog('save');};
 const startAgain=async()=>{setDialog(null);await compose.startNew();onNavigate('/create');};
 const again=()=>{
  const arrangement=compose.state.arrangement;
  // Only the child's own, unshelved piece would be lost; an example or an empty field just moves on.
  if(arrangement?.origin==='child'&&arrangement.events.length&&!compose.shelved)setDialog('again');
  else void startAgain();
 };
 return <div className={styles.shell}>
  <FlowHeader steps={flowSteps} current="compose" onNavigate={onNavigate} aside={<WorkHeaderActions onNavigate={onNavigate}/>}/>
  <main className={styles.page}>
   <WorkIntro title={composeCopy.title} subtitle={composeCopy.subtitle} guide={composeGuide} text={text} fit className={styles.intro}/>
   <div className={styles.workspace}>
    <ScoreCard compose={compose} onBack={()=>onNavigate('/world')}/>
    <div className={styles.side}>
     <SpanCard compose={compose}/>
     <InspirationCard compose={compose} onOpen={()=>setDialog('textbook')}/>
     <BackgroundCard compose={compose}/>
    </div>
   </div>
   <p className={styles.notice} role="status" aria-live="polite" data-tone={savedNote?'info':notice?.tone}>
    {savedNote?<>{composeCopy.savedNote}<button type="button" onClick={()=>onNavigate('/works')}><Glyph name="shelf"/>{composeCopy.goShelf}</button></>
     :notice?composeCopy.notices[notice.key]:''}
   </p>
   <FooterBar compose={compose} onSave={requestSave} onBack={()=>onNavigate('/world')} onAgain={again}/>
  </main>
  {dialog==='save'&&<SaveDialog compose={compose} onClose={()=>setDialog(null)}/>}
  {dialog==='textbook'&&<InspirationDialog value={compose.state.settings.inspiration} entries={compose.entries} onChange={compose.setInspiration} onClose={()=>setDialog(null)}/>}
  {dialog==='again'&&<AgainDialog onClose={()=>setDialog(null)} onSave={()=>setDialog(compose.canSave()?'save':null)} onDiscard={()=>void startAgain()}/>}
 </div>;
}
