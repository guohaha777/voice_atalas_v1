import {lazy,Suspense,useEffect,useState} from 'react';
import type {SoundSource,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {HomePage} from '../pages/home/HomePage';
import {HomeBirthDestination,HomeBirthTransition} from './transitions/home-birth/HomeBirthTransition';
import {useHomeBirthTransition} from './transitions/home-birth/useHomeBirthTransition';
import {workSession} from '../shared/creation/workSession';
import {NoticeDialog} from '../shared/ui/NoticeDialog';
import {ModelConfigDialog} from '../shared/model-config/ModelConfigDialog';
import {emptyModelConfig} from '../shared/model-config/modelConfig';
import {PageFallback} from './PageFallback';
import {prefetchWhenIdle} from './prefetch';
import type {HomeDestination} from './navigation';
import {parseRoute,useRoute} from './router';
import type {Route} from './router';

const loadSoundBirth=()=>import('../pages/sound-birth/SoundBirthPage');
const SoundBirthPage=lazy(()=>loadSoundBirth().then(module=>({default:module.SoundBirthPage})));
const loadSoundWorld=()=>import('../pages/sound-world/SoundWorldPage');
const SoundWorldPage=lazy(()=>loadSoundWorld().then(module=>({default:module.SoundWorldPage})));
const loadCompose=()=>import('../pages/compose/ComposePage');
const ComposePage=lazy(()=>loadCompose().then(module=>({default:module.ComposePage})));
const loadWorks=()=>import('../pages/works/WorksPage');
const WorksPage=lazy(()=>loadWorks().then(module=>({default:module.WorksPage})));
// Prefetch 声音诞生 before the home → birth crossfade; fetch its code once the home page and its opening have had the network to themselves.
const birthPrefetchDelayMs=3000;
/** The next step's code waits a little longer than the current page's own artwork and sounds. */
const nextPagePrefetchDelayMs=1500;

/** Flow-header links carry plain paths; map them back to routes. */
const routeFor=(path:string):Route=>parseRoute(path);

export function App(){
 const [route,navigate]=useRoute();
 const transition=useHomeBirthTransition(route.page,()=>navigate({page:'sound-birth'}));
 const [pending,setPending]=useState<HomeDestination|null>(null);
 // Keys exist only in React memory for this page session; never write them to browser storage.
 const [modelConfig,setModelConfig]=useState(emptyModelConfig);
 useEffect(()=>{if(route.page==='home')return prefetchWhenIdle(loadSoundBirth,birthPrefetchDelayMs);},[route.page]);
 // 万物声场 follows 声音诞生, so warm its code while the child shapes a sound.
 useEffect(()=>{if(route.page==='sound-birth')return prefetchWhenIdle(loadSoundWorld,nextPagePrefetchDelayMs);},[route.page]);
 // 万物成曲 follows 万物声场; the shelf is one tap from 万物成曲.
 useEffect(()=>{
  if(route.page==='sound-world')return prefetchWhenIdle(loadCompose,nextPagePrefetchDelayMs);
  if(route.page==='compose')return prefetchWhenIdle(loadWorks,nextPagePrefetchDelayMs);
 },[route.page]);
 // 声音诞生 → 万物声场: the finished unit joins the current work (this visit only), then the field opens.
 const finishSound=(draft:SoundUnitDraft,source:SoundSource)=>{
  if(workSession.addUnit(draft,source).status==='full')return {status:'unavailable'} as const;
  navigate({page:'sound-world'});
  return {status:'opened'} as const;
 };
 const renderPage=()=>{
  if(route.page==='sound-birth')return <Suspense fallback={<PageFallback current="birth"/>}>
   <HomeBirthDestination onReady={transition.ready}><SoundBirthPage entryMotion={transition.phase==='idle'} markerIndex={workSession.nextMarkerIndex()} onNavigate={path=>navigate(routeFor(path))} onFinish={finishSound}/></HomeBirthDestination>
  </Suspense>;
  // 万物声场 → 万物成曲: the arrangement is already kept in the current work by the field's repository.
  if(route.page==='sound-world')return <Suspense fallback={<PageFallback current="world"/>}>
   <SoundWorldPage onNavigate={path=>navigate(routeFor(path))} onFinish={()=>{navigate({page:'compose'});return {status:'opened'};}}/>
  </Suspense>;
  if(route.page==='compose')return <Suspense fallback={<PageFallback current="compose"/>}>
   <ComposePage onNavigate={path=>navigate(routeFor(path))}/>
  </Suspense>;
  if(route.page==='works')return <Suspense fallback={<PageFallback current={null}/>}>
   <WorksPage onNavigate={path=>navigate(routeFor(path))}/>
  </Suspense>;
  return null;
 };
 const crossfading=transition.phase!=='idle';
 const showHome=route.page==='home'||(route.page==='sound-birth'&&crossfading);
 return <>
  <HomeBirthTransition phase={transition.phase} overlay={route.page!=='home'} scrollOffset={transition.scrollOffset}
   home={showHome&&<HomePage onNavigate={page=>{
    if(page==='create'){void loadSoundBirth().catch(()=>{});transition.start();}
    else if(page==='shelf')navigate({page:'works'});
    else setPending(page);
   }} suspended={pending!==null} departing={crossfading}/>}
  >{renderPage()}</HomeBirthTransition>
  {route.page==='home'&&(pending==='api'?<ModelConfigDialog config={modelConfig} onApply={setModelConfig} onClose={()=>setPending(null)}/>:pending&&<NoticeDialog title="这里还在准备中" onClose={()=>setPending(null)}>
   <p>先点点小鸟、青蛙，听听森林里的声音吧。</p>
  </NoticeDialog>)}
 </>;
}
