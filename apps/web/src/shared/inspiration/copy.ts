import type {Inspiration} from '@wanwu-v2/contracts/work';
import type {InspirationEntry} from './catalog';

const minutes=(ms:number)=>{const s=Math.round(ms/1000);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};

export const inspirationCopy={
 title:'课本灵感',
 description:'选一段课本里的节奏，或上传老师的教学音乐。它只给背景带来节奏和气质，不改你的声音和摆放，也不照搬旋律。',
 tabs:{examples:'课本节奏',upload:'上传教学音乐'},
 example:'示例',
 catalogueNote:'课本曲库还没有接入，下面是示例节奏。',
 use:'用这个',using:'正在用',none:'先不用',done:'好了',
 listen:'听一听',stopListen:'停止',
 upload:{
  pick:'选一段教学音乐',repick:'换一段',
  hint:'建议由老师选：课本配套音乐或课堂上唱的歌，音频文件，最长 10 分钟。',
  picked:(ms:number)=>`时长 ${minutes(ms)}`,
  listen:'试听',stop:'停',
  local:'只在这台设备上，还没有上传。',
  flowTitle:'接上后台以后会这样：',
  flow:['上传到后台（老师账号，确认可以使用）','后台分析它的速度、拍子、调式和情绪','结合孩子摆放的声音，生成一段对应的背景'],
  off:'上传和分析还没有开放；现在背景先用示例乐器。',
  errors:{'not-audio':'这不是音频文件，换一个试试。','too-large':'文件太大了（最大 30MB）。','too-long':'音乐太长了，最长 10 分钟。','unreadable':'这段音频读不出来，换一个试试。'},
 },
 /** One line describing the current choice, for the cards that open the dialog. */
 summary:(value:Inspiration,entries:readonly InspirationEntry[])=>{
  if(value.kind==='textbook'){const entry=entries.find(item=>item.id===value.entryId);return entry?`借了「${entry.title}」的节奏`:'课本节奏';}
  if(value.kind==='teaching-music')return `教学音乐「${value.name}」`;
  return '先不用';
 },
} as const;
