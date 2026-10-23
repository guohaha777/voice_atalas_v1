import type {SpanSeconds} from '@wanwu-v2/contracts/arrangement';
import type {Visibility} from '@wanwu-v2/contracts/work';
import type {ComposeNoticeKey} from '../model/composeState';
import type {Discovery} from '../model/discoveries';
import {discoveryText} from './discoveryCopy';

export const composeCopy={
 title:'看着曲谱，听听自己的小曲子',
 subtitle:'声音按摆放的先后响起；竖线走到哪里，哪个声音就亮起来。',
 loading:'正在打开曲谱…',
 // Score
 scoreTitle:'声音曲谱',
 /**
  * A listening prompt above the score instead of a layout note: a question that sends the child's ears somewhere,
  * picked from what this piece actually contains (its first discovery that has a prompt).
  */
 listenPrompt:(items:readonly Discovery[])=>{
  for(const item of items)switch(item.kind){
   case 'echo':return `跟着竖线听：「${item.a}」问一句，谁来回答？`;
   case 'repeat':return `跟着竖线听：「${item.name}」藏了几次？数一数。`;
   case 'together':return `跟着竖线听：哪两个声音在一起唱歌？`;
   case 'rest':return '跟着竖线听：哪里突然安静了？安静的时候，你在等谁？';
   case 'long-short':return `跟着竖线听：谁的声音拉得最长，谁一下就停了？`;
  }
  return '跟着竖线听：猜一猜，下一个响起来的会是谁？';
 },
 exampleBadge:'示例摆放',
 legendLabel:'曲谱里的声音',
 emptyScore:'声场里还没有声音',
 emptyAction:'回声场摆一摆',
 seconds:(value:string)=>`${value}秒`,
 itemLabel:(number:string,name:string,start:string,seconds:string)=>`${number} ${name}，第 ${start} 秒响起，响 ${seconds} 秒。点一下从这里听`,
 spanMark:(seconds:number)=>`选的 ${seconds} 秒`,
 scoreSeek:'点曲谱空白处，从那里开始听',
 // Transport
 play:'播放',pause:'暂停',preparing:'准备中',restart:'从头听',
 progressLabel:'播放进度',
 progressHint:'播放到哪个声音，它就会亮起来；拖动圆点可以跳到别处。',
 progressValue:(now:string,total:string)=>`${now}，共 ${total}`,
 // Length
 spanTitle:'想听多久？',
 spanOptions:{20:'短一点',30:'刚刚好',45:'长一点'} satisfies Record<SpanSeconds,string>,
 spanReal:(seconds:string)=>`实际 ${seconds} 秒`,
 spanNote:'和声场的长度是同一个；最后的声音会完整唱完。',
 // Inspiration
 inspirationTitle:'课本灵感',inspirationOptional:'（可跳过）',
 inspirationLead:'借课本的节奏和气质给背景，不改你的声音。',
 inspirationNone:'先不用',inspirationTextbook:'跟着课本',inspirationSuggest:'帮我找找',inspirationSuggestOff:'未开放',
 inspirationTeachingWait:'要等后台分析后，背景才会跟着它生成；现在先用示例乐器。',
 inspirationBackgroundOff:'背景关着，打开背景音乐才听得到。',
 // Background
 backgroundTitle:'背景音乐',
 backgroundOn:'开',backgroundOff:'关',
 backgroundToggle:'背景音乐开关',
 backgroundLead:'可关闭，只听自己的声音。',
 backgroundOffLead:'背景关着，现在只听自己的声音。',
 instrumentsLabel:'选乐器演奏背景（可多选，再点一下取消；不选就是原始背景）',
 instrumentsNone:'没选乐器：播放原始生成的背景音乐。选个乐器，就换它来演奏。',
 instrumentsPlaying:(names:string)=>`背景音乐由${names}演奏，再点一下就换回原始背景。`,
 instrumentMore:'更多乐器',instrumentComing:'即将开放',
 backgroundExample:'示例乐器：网页里合成，正式乐器库待接入',
 volumeLabel:'背景音量',volumeLow:'轻一点',volumeHigh:'响一点',
 // Discovery
 discoveryTitle:'音乐小发现',discoveryNote:'（按摆放数出来的）',discoveryNext:'换一条',
 discovery:(item:Discovery)=>discoveryText(item).line,
 bulbOpen:'点小灯泡，看这首音乐有什么特征',bulbClose:'收起',
 teachTitle:'这首音乐有什么特征',
 teachLead:'每一条特征都是从这首曲子的摆放里数出来的，可以边播放边讲给孩子听。',
 teachIdea:'音乐知识',teachAsk:'可以问孩子',
 teachPlay:'从头放给大家听',
 moodLabel:'心情',
 // Actions
 save:'保存这首作品',saved:'已放进书架',
 saveSettings:'保存与分享设置',saveVisibility:'默认仅自己可见',
 back:'回声场改一改',again:'再来一首',
 saveDialog:{
  title:'保存这首作品',
  description:'放进作品书架，这次打开期间随时能找到。',
  name:'作品名字',defaultTitle:(n:number)=>`我的小曲子 ${n}`,
  visibility:'谁能看到',
  visibilities:{private:'仅自己',class:'班级',school:'学校',region:'地区',public:'公开'} satisfies Record<Visibility,string>,
  visibilityOff:'需要账号，未开放',
  sessionOnly:'只保存在这次打开的页面里，刷新就没了；保存到账号还没有开放。',
  share:'分享链接',shareOff:'未开放',
  cancel:'先不存',submit:'放进作品书架',update:'更新书架里的这首',
 },
 savedNote:'已放进作品书架（仅本次打开期间保留，刷新就没了）。',
 goShelf:'去作品书架看看',
 againDialog:{
  title:'再来一首？',
  description:'这首还没有放进作品书架，开始新的一首后就找不回来了。',
  saveFirst:'先保存这首',discard:'不保存，再来一首',
 },
 notices:{
  'need-event':'声场里还没有声音，先回声场摆一摆吧。',
  'example-save':'这是示例摆放。回声场自己摆一摆，再来保存吧。',
  'suggest-off':'「帮我找找」要等连接模型后才能用，现在可以点「跟着课本」自己选。',
  'share-off':'分享需要账号、班级空间和审核，暂未开放。',
  'save-failed':'没能放进书架，再试一次吧。',
  'load-failed':'网络有点慢，声音没加载出来，再点一次试试。',
  'no-audio':'这个浏览器不能播放声音。',
  'missing-audio':'这首里有的录音只在之前打开的页面里，刷新后找不到了。',
  'background-failed':'背景音乐没能准备好，先只播放你的声音。',
 } satisfies Record<ComposeNoticeKey,string>,
} as const;

