import {useState} from 'react';
import {HomePage} from '../pages/home/HomePage';
import {NoticeDialog} from '../shared/ui/NoticeDialog';
import type {HomeDestination} from './navigation';
export function App(){
 const [pending,setPending]=useState<HomeDestination|null>(null);
 return <><HomePage onNavigate={setPending}/>{pending&&<NoticeDialog title="这里还在准备中" onClose={()=>setPending(null)}>
  <p>先点点小鸟、青蛙，听听森林里的声音吧。</p>
 </NoticeDialog>}</>;
}
