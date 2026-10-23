import {lazy,Suspense,useEffect,useState} from 'react';
import type {SoundSource,SoundUnitDraft} from '@wanwu-v2/contracts/sound';
import {HomePage} from '../pages/home/HomePage';
import {StartDialog} from '../pages/start/StartDialog';
import {startArtUrls} from '../pages/start/config/art';
import {workSession} from '../shared/creation/workSession';
import {prefetchImagesWhenIdle} from '../shared/media/prefetch';
import {NoticeDialog} from '../shared/ui/NoticeDialog';
import {PageFallback} from './PageFallback';
import type {HomeDestination} from './navigation';
import {useRoute} from './router';
import type {Route} from './router';

const loadSoundBirth=()=>import('../pages/sound-birth/SoundBirthPage');
const SoundBirthPage=lazy(()=>loadSoundBirth().then(module=>({default:module.SoundBirthPage})));
const loadSoundWorld=()=>import('../pages/sound-world/SoundWorldPage');
const SoundWorldPage=lazy(()=>loadSoundWorld().then(module=>({default:module.SoundWorldPage})));
// Warm the start dialog artwork only after the home page and its opening have had the network to themselves.
const startPrefetchDelayMs=3000;

/** Flow-header links carry plain paths; map them back to routes. */
const routeFor=(path:string):Route=>path==='/world'?{page:'sound-world'}:path==='/create'?{page:'sound-birth',from:null}:{page:'home'};

export function App(){
 const [route,navigate]=useRoute();
 const [pending,setPending]=useState<HomeDestination|null>(null);
 useEffect(()=>prefetchImagesWhenIdle(()=>startArtUrls(matchMedia('(max-width: 700px)').matches?'mobile':'desktop'),startPrefetchDelayMs),[]);
 // The dialog is the only way into 声音诞生 from home, so fetch that page's code while the child is choosing.
 useEffect(()=>{if(pending==='create')void loadSoundBirth().catch(()=>{});},[pending]);
 // 万物声场 follows 声音诞生, so warm its code while the child shapes a sound.
 useEffect(()=>{if(route.page==='sound-birth')void loadSoundWorld().catch(()=>{});},[route.page]);
 // 声音诞生 → 万物声场: the finished unit joins the current work (this visit only), then the field opens.
 const finishSound=(draft:SoundUnitDraft,source:SoundSource)=>{
  if(workSession.addUnit(draft,source).status==='full')return {status:'unavailable'} as const;
  navigate({page:'sound-world'});
  return {status:'opened'} as const;
 };
 if(route.page==='sound-birth')return <Suspense fallback={<PageFallback current="birth"/>}>
  <SoundBirthPage key={route.from??'direct'} entry={route.from} markerIndex={workSession.nextMarkerIndex()} onNavigate={path=>navigate(routeFor(path))} onFinish={finishSound}/>
 </Suspense>;
 if(route.page==='sound-world')return <Suspense fallback={<PageFallback current="world"/>}>
  <SoundWorldPage onNavigate={path=>navigate(routeFor(path))}/>
 </Suspense>;
 return <><HomePage onNavigate={setPending} suspended={pending!==null}/>{pending==='create'?<StartDialog onClose={()=>setPending(null)} onContinue={intent=>{setPending(null);navigate({page:'sound-birth',from:intent.entry});return {status:'opened'};}}/>:pending&&<NoticeDialog title="这里还在准备中" onClose={()=>setPending(null)}>
  <p>先点点小鸟、青蛙，听听森林里的声音吧。</p>
 </NoticeDialog>}</>;
}
