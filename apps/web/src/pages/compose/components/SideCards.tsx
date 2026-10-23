import {useMemo} from 'react';
import type {CSSProperties} from 'react';
import {inspirationCopy} from '../../../shared/inspiration/copy';
import {KidIcon} from '../../../shared/ui/KidIcon';
import {composeCopy} from '../config/copy';
import {secondsLabel,spanChoices} from '../model/scoreLayout';
import type {Compose} from '../model/useCompose';
import styles from '../ComposePage.module.css';

/** Card icon coloured in one of the spring palette colours (see global --wk-* tokens); no backing shape. */
const Badge=({icon,tone}:{icon:Parameters<typeof KidIcon>[0]['name'];tone:'sky'|'pink'|'lime'|'yellow'})=>
 <span className={styles.badge} data-tone={tone}><KidIcon name={icon}/></span>;

/** 想听多久？ The same 20 / 30 / 45 s as the field; shows the real length when the last sound runs past it. */
export function SpanCard({compose}:{compose:Compose}){
 const arrangement=compose.state.arrangement;
 const choices=useMemo(()=>arrangement?spanChoices(arrangement):[],[arrangement]);
 return <section className={styles.card} aria-labelledby="span-title">
  <h3 id="span-title" className={styles.cardTitle}><Badge icon="clock" tone="sky"/>{composeCopy.spanTitle}</h3>
  <div className={styles.spanOptions} role="radiogroup" aria-labelledby="span-title">
   {choices.map(({seconds,real})=>{
    const longer=real>seconds+1e-6;
    return <button key={seconds} type="button" role="radio" aria-checked={arrangement?.spanSeconds===seconds} className={styles.spanOption} onClick={()=>compose.setSpan(seconds)}>
     <b>{composeCopy.seconds(String(seconds))}</b>
     <small data-longer={longer||undefined}>{longer?composeCopy.spanReal(secondsLabel(Math.ceil(real-1e-6))):composeCopy.spanOptions[seconds]}</small>
    </button>;
   })}
  </div>
 </section>;
}

/** 课本灵感 (optional, also offered in 万物声场): lends rhythm and feel to the background only. 帮我找找 needs a model. */
export function InspirationCard({compose,onOpen}:{compose:Compose;onOpen:()=>void}){
 const {inspiration,background}=compose.state.settings;
 const lead=inspiration.kind==='none'?composeCopy.inspirationLead
  :inspirationCopy.summary(inspiration,compose.entries)+'。'+(inspiration.kind==='teaching-music'?composeCopy.inspirationTeachingWait:background.enabled?'':composeCopy.inspirationBackgroundOff);
 return <section className={styles.card} aria-labelledby="inspiration-title">
  <h3 id="inspiration-title" className={styles.cardTitle}><Badge icon="book" tone="pink"/>{composeCopy.inspirationTitle}<small>{composeCopy.inspirationOptional}</small></h3>
  <p className={styles.cardLead}>{lead}</p>
  <div className={styles.choiceRow} role="group" aria-labelledby="inspiration-title">
   <button type="button" aria-pressed={inspiration.kind==='none'} onClick={()=>compose.setInspiration({kind:'none'})}>{composeCopy.inspirationNone}</button>
   <button type="button" aria-pressed={inspiration.kind!=='none'} onClick={onOpen}>{composeCopy.inspirationTextbook}</button>
   <button type="button" aria-pressed={false} data-busy={compose.suggesting||undefined} onClick={()=>void compose.suggest()}>
    {composeCopy.inspirationSuggest}{!compose.suggestAvailable&&<small>{composeCopy.inspirationSuggestOff}</small>}
   </button>
  </div>
 </section>;
}

/** 背景音乐: its own layer under the child's sounds — on / off, who plays it (any instruments, or none = as generated), how loud. */
export function BackgroundCard({compose}:{compose:Compose}){
 const {background}=compose.state.settings;
 const chosen=new Set(compose.chosen.map(item=>item.id));
 return <section className={styles.card} aria-labelledby="background-title" data-off={!background.enabled||undefined}>
  <div className={styles.cardTop}>
   <h3 id="background-title" className={styles.cardTitle}><Badge icon="note" tone="lime"/>{composeCopy.backgroundTitle}</h3>
   <button type="button" role="switch" aria-checked={background.enabled} aria-label={composeCopy.backgroundToggle} className={styles.switch}
    onClick={()=>compose.setBackgroundEnabled(!background.enabled)}>
    <span>{background.enabled?composeCopy.backgroundOn:composeCopy.backgroundOff}</span><i/>
   </button>
  </div>
  <p className={styles.cardLead}>{!background.enabled?composeCopy.backgroundOffLead:chosen.size?composeCopy.instrumentsPlaying(compose.chosen.map(item=>item.name).join('、')):composeCopy.instrumentsNone}</p>
  <div className={styles.trackRow} role="group" aria-label={composeCopy.instrumentsLabel}>
   {compose.instruments.map(item=><button key={item.id} type="button" aria-pressed={chosen.has(item.id)} onClick={()=>compose.toggleInstrument(item.id)}>
    {chosen.has(item.id)&&<KidIcon name="check"/>}{item.name}
   </button>)}
   {/* Instruments planned for later: one quiet chip, not tappable. */}
   {compose.comingInstruments.length>0&&<span className={styles.coming} title={compose.comingInstruments.join('、')}><KidIcon name="plus"/>{composeCopy.instrumentMore}<small>{composeCopy.instrumentComing}</small></span>}
  </div>
  <label className={styles.volume}>
   <KidIcon name="volume"/>
   <span className={styles.srOnly}>{composeCopy.volumeLabel}</span>
   <input type="range" min={0} max={1} step={.05} value={background.volume} disabled={!background.enabled}
    style={{'--fill':`${background.volume*100}%`} as CSSProperties} onChange={event=>compose.setBackgroundVolume(Number(event.target.value))}/>
   <span aria-hidden="true">{background.volume<.5?composeCopy.volumeLow:composeCopy.volumeHigh}</span>
  </label>
  <p className={styles.cardFoot}>{composeCopy.backgroundExample}</p>
 </section>;
}
