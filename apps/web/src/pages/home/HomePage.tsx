import {useRef} from 'react';
import type {HomeDestination} from '../../app/navigation';
import {Icon} from '../../shared/ui/Icon';
import {HomeScene} from './components/HomeScene';
import {HomeHeader} from './components/HomeHeader';
import {HomeHero} from './components/HomeHero';
import {useForestOpening} from './model/useForestOpening';
import {useHomeSound} from './model/useHomeSound';
import {readPerformanceHints} from '../../shared/platform/capabilities';
import styles from './HomePage.module.css';
export function HomePage({onNavigate,suspended=false}:{onNavigate:(page:HomeDestination)=>void;suspended?:boolean}){
 const scene=useRef<HTMLDivElement>(null),curtain=useRef<HTMLDivElement>(null),audio=useRef<HTMLAudioElement>(null);
 const opening=useForestOpening(scene,curtain),sound=useHomeSound(audio,suspended);
 const reduced=readPerformanceHints().reduced;
 return <>
  <main className={[styles.homepage,reduced?styles['reduced-motion']:''].join(' ')} id="homepage" aria-label="万物声谱首页"
   data-intro-phase={opening.state.phase} data-intro-reason={opening.state.reason||'ready'} data-sound-state={sound.active.phase} data-sound-id={sound.active.id||''}>
   <HomeScene sceneRef={scene} waiting={opening.state.phase==='waiting'} active={sound.active} onInteract={sound.interact}/>
   <div ref={curtain} className={styles.intro} aria-hidden="true"/>
   {opening.state.phase!=='settled'&&<button type="button" className={styles['skip-intro']} onClick={opening.skip}>跳过开场</button>}
   <HomeHeader onNavigate={onNavigate}/><HomeHero onStart={()=>onNavigate('create')} feedback={sound.status} opening={opening.state} cycle={opening.cycle}/>
   <div className={`${styles['sound-label']} ${styles['bird-label']}`} aria-hidden="true">鸟鸣</div>
   <div className={`${styles['sound-label']} ${styles['frog-label']}`} aria-hidden="true">蛙鸣</div>
   <div className={`${styles['sound-label']} ${styles['drop-label']}`} aria-hidden="true">雨滴</div>
   <div className={styles.footer}><Icon name="down"/><span>带上你发现的声音</span></div>
   <div className={styles['home-controls']} aria-label="首页声音与开场控制">
    <button type="button" aria-label="重看开场" title="重看开场" onClick={()=>{const hints=readPerformanceHints();if(hints.reduced||hints.saveData)sound.notify('当前使用轻动效模式，直接欣赏静态场景。');opening.replay();}}><Icon name="replay"/></button>
    <button type="button" aria-label={sound.muted?'开启声音':'关闭声音'} aria-pressed={sound.muted} title={sound.muted?'开启声音':'关闭声音'} onClick={sound.toggleMute}><Icon name={sound.muted?'muted':'sound'}/></button>
    <a href="/legal/sound-sources.html" aria-label="声音来源与许可" title="声音来源与许可">来源</a>
   </div>
   <audio ref={audio} preload="none" hidden/>
  </main>
 </>;
}
