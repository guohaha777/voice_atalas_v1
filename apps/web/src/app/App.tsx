import {lazy,Suspense,useEffect,useState} from 'react';
import type {SoundSource,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {HomePage} from '../pages/home/HomePage';
import {workSession} from '../shared/creation/workSession';
import {NoticeDialog} from '../shared/ui/NoticeDialog';
import {PageFallback} from './PageFallback';
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
// 开始成曲 opens 声音诞生 directly; fetch its code once the home page and its opening have had the network to themselves.
const birthPrefetchDelayMs=3000;

/** Flow-header links carry plain paths; map them back to routes. */
const routeFor=(path:string):Route=>parseRoute(path);

export function App(){
 const [route,navigate]=useRoute();
 const [pending,setPending]=useState<HomeDestination|null>(null);
 useEffect(()=>{if(route.page!=='home')return;const timer=setTimeout(()=>void loadSoundBirth().catch(()=>{}),birthPrefetchDelayMs);return()=>clearTimeout(timer);},[route.page]);
 // 万物声场 follows 声音诞生, so warm its code while the child shapes a sound.
 useEffect(()=>{if(route.page==='sound-birth')void loadSoundWorld().catch(()=>{});},[route.page]);
 // 万物成曲 follows 万物声场; the shelf is one tap from 万物成曲.
 useEffect(()=>{if(route.page==='sound-world')void loadCompose().catch(()=>{});if(route.page==='compose')void loadWorks().catch(()=>{});},[route.page]);
 // 声音诞生 → 万物声场: the finished unit joins the current work (this visit only), then the field opens.
 const finishSound=(draft:SoundUnitDraft,source:SoundSource)=>{
  if(workSession.addUnit(draft,source).status==='full')return {status:'unavailable'} as const;
  navigate({page:'sound-world'});
  return {status:'opened'} as const;
 };
 if(route.page==='sound-birth')return <Suspense fallback={<PageFallback current="birth"/>}>
  <SoundBirthPage markerIndex={workSession.nextMarkerIndex()} onNavigate={path=>navigate(routeFor(path))} onFinish={finishSound}/>
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
 return <><HomePage onNavigate={page=>{if(page==='create')navigate({page:'sound-birth'});else if(page==='shelf')navigate({page:'works'});else setPending(page);}} suspended={pending!==null}/>{pending&&<NoticeDialog title="这里还在准备中" onClose={()=>setPending(null)}>
  <p>先点点小鸟、青蛙，听听森林里的声音吧。</p>
 </NoticeDialog>}</>;
}
