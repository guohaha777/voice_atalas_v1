import {lazy,Suspense,useEffect,useState} from 'react';
import {HomePage} from '../pages/home/HomePage';
import {StartDialog} from '../pages/start/StartDialog';
import {startArtUrls} from '../pages/start/config/art';
import {prefetchImagesWhenIdle} from '../shared/media/prefetch';
import {NoticeDialog} from '../shared/ui/NoticeDialog';
import {PageFallback} from './PageFallback';
import type {HomeDestination} from './navigation';
import {useRoute} from './router';

const loadSoundBirth=()=>import('../pages/sound-birth/SoundBirthPage');
const SoundBirthPage=lazy(()=>loadSoundBirth().then(module=>({default:module.SoundBirthPage})));
// Warm the start dialog artwork only after the home page and its opening have had the network to themselves.
const startPrefetchDelayMs=3000;

export function App(){
 const [route,navigate]=useRoute();
 const [pending,setPending]=useState<HomeDestination|null>(null);
 useEffect(()=>prefetchImagesWhenIdle(()=>startArtUrls(matchMedia('(max-width: 700px)').matches?'mobile':'desktop'),startPrefetchDelayMs),[]);
 // The dialog is the only way into 声音诞生 from home, so fetch that page's code while the child is choosing.
 useEffect(()=>{if(pending==='create')void loadSoundBirth().catch(()=>{});},[pending]);
 if(route.page==='sound-birth')return <Suspense fallback={<PageFallback/>}>
  <SoundBirthPage key={route.from??'direct'} entry={route.from} onNavigate={path=>navigate(path==='/'?{page:'home'}:{page:'sound-birth',from:null})}/>
 </Suspense>;
 return <><HomePage onNavigate={setPending} suspended={pending!==null}/>{pending==='create'?<StartDialog onClose={()=>setPending(null)} onContinue={intent=>{setPending(null);navigate({page:'sound-birth',from:intent.entry});return {status:'opened'};}}/>:pending&&<NoticeDialog title="这里还在准备中" onClose={()=>setPending(null)}>
  <p>先点点小鸟、青蛙，听听森林里的声音吧。</p>
 </NoticeDialog>}</>;
}
