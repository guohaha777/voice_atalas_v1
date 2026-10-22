import {readPerformanceHints} from '../platform/capabilities';

/**
 * Warm the HTTP cache for artwork the user is likely to open next, after the current page has loaded
 * and the main thread is idle. Skipped on Save-Data / 2G so weak connections only fetch what is shown.
 */
export function prefetchImagesWhenIdle(getUrls:()=>readonly string[],delayMs:number){
 const hints=readPerformanceHints();
 if(hints.saveData||hints.weak)return()=>{};
 let cancelled=false,timer:ReturnType<typeof setTimeout>|undefined,idle:number|undefined;
 const run=()=>{
  if(cancelled)return;
  for(const url of getUrls()){const image=new Image();image.decoding='async';image.fetchPriority='low';image.src=url;}
 };
 const schedule=()=>{timer=setTimeout(()=>{if(typeof requestIdleCallback==='function')idle=requestIdleCallback(run,{timeout:4000});else run();},delayMs);};
 if(document.readyState==='complete')schedule();else addEventListener('load',schedule,{once:true});
 return()=>{
  cancelled=true;removeEventListener('load',schedule);clearTimeout(timer);
  if(idle!==undefined&&typeof cancelIdleCallback==='function')cancelIdleCallback(idle);
 };
}
