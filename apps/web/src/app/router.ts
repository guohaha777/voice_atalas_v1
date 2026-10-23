// Minimal history routing for the approved pages; no router library. Unknown paths fall back to home.
import {useCallback,useEffect,useState} from 'react';
import {creationEntryIds} from './navigation.ts';
import type {CreationEntry} from './navigation';

export type Route={page:'home'}|{page:'sound-birth';from:CreationEntry|null}|{page:'sound-world'};

export function parseRoute(pathname:string,search:string):Route{
 const path=pathname.replace(/\/+$/,'');
 if(path==='/world')return {page:'sound-world'};
 if(path==='/create'){
  const from=new URLSearchParams(search).get('from');
  return {page:'sound-birth',from:creationEntryIds.includes(from as CreationEntry)?from as CreationEntry:null};
 }
 return {page:'home'};
}
export function routeHref(route:Route){
 if(route.page==='sound-world')return '/world';
 return route.page==='home'?'/':`/create${route.from?`?from=${route.from}`:''}`;
}

export function useRoute(){
 const read=()=>parseRoute(location.pathname,location.search);
 const [route,setRoute]=useState<Route>(read);
 useEffect(()=>{const sync=()=>setRoute(read());addEventListener('popstate',sync);return()=>removeEventListener('popstate',sync);},[]);
 const navigate=useCallback((next:Route)=>{
  const href=routeHref(next);
  if(href!==location.pathname+location.search)history.pushState(null,'',href);
  scrollTo(0,0);setRoute(next);
 },[]);
 return [route,navigate] as const;
}
