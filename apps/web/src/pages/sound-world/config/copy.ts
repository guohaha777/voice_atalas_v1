import type {SpanSeconds} from '@wanwu-v2/contracts/arrangement';
import type {PatternChoice} from '@wanwu-v2/contracts/sound';
import {SHAPING_RULES} from '@wanwu-v2/sound-rules/rules';
import {dimensionCopy} from '../../../shared/creation/dimensionCopy';
import type {NoticeKey} from '../model/soundWorldState';
import type {LibraryScope} from '../services/soundWorldRepository';

export const worldCopy={
 title:'把声音摆一摆，听听会发生什么',
 subtitle:'越往右越晚响起；尾巴有多长，声音就响多久。',
 // Palette
 paletteTitle:'选一个声音',listen:'试听',stop:'停',example:'示例',placedTimes:(count:number)=>`放了 ${count} 次`,
 more:'找更多声音',
 inspiration:'课本灵感',
 // Field
 fieldLabel:'声场',rowName:(row:number)=>`第 ${row} 行`,
 // Invisible layout reference only: preserve the pre-removal spacing at every font/viewport size.
 fieldHintLayout:'左边先响，右边后响 · 上下只是错开摆',
 seconds:(value:string)=>`${value}秒`,
 tailLabel:(name:string,seconds:string)=>`剪一剪「${name}」，现在响 ${seconds} 秒`,
 addRow:'加一行',removeRow:'去掉空行',
 spanLabel:'声场长度',spanOption:(seconds:SpanSeconds)=>`${seconds}秒`,
 exampleBadge:'示例摆放',clearExample:'清空，自己摆',
 placeInRow:(name:string,row:number)=>`把「${name}」放到第 ${row} 行末尾`,
 moveToRow:(row:number)=>`搬到第 ${row} 行`,
 eventLabel:(number:string,name:string,order:number,total:number,seconds:string)=>`${number} ${name}，第 ${order} 个响起（共 ${total} 个），响 ${seconds} 秒`,
 placedList:'已摆放的声音',keyboardHint:'选中后左右方向键调整先后，上下方向键换行，Delete 移除。',
 // Toolbar
 toolbar:{label:'这个声音',trim:'剪一剪',copy:'复制',remove:'移除'},
 // Mood
 moodTitle:'这首曲子的心情',
 moodUnset:'先不选',moodCustom:'自己写',moodCustomOff:'未开放',
 customMood:{title:'这首曲子是什么心情？',description:'用自己的话写一写，最多 12 个字。',placeholder:'例如：像下雨天一样',
  submit:'就是它',cancel:'不写了',working:'小青蛙在想…',failed:'没能读懂，换个说法试试，或者从上面选一个。'},
 // Actions
 back:'返回声音诞生',playAll:'听听这段声音',stopAll:'停一停',preparing:'正在准备…',
 finish:'摆好了，去万物成曲',finishUnavailable:'暂未开放',
 loading:'正在打开声场…',
 // More sounds
 moreDialog:{
  title:'找更多声音',description:'加进来的声音会出现在左边，可以反复摆放。',
  scopes:{example:'示例',mine:'我的',class:'班级',public:'公共'} satisfies Record<LibraryScope,string>,
  add:'加进来',added:'已加入',
  exampleNote:'随网页提供的示例声音，高低等五项是示例预设，不是孩子的选择。',
  mineNote:'本次打开期间在「声音诞生」做好的声音。',
  mineEmpty:'还没有自己做的声音。',
  makeNew:'去声音诞生做一个新声音',
  unavailable:{'needs-account':'班级声音库需要老师账号和班级空间，暂未开放。','needs-review':'公共声音库需要审核和授权，暂未开放。'},
  sessionOnly:'声场里的摆放仅本次打开期间保留，还没有保存到账号。',
 },
 clipEditor:{
  title:(name:string)=>`剪一剪「${name}」`,
  description:'拖动两边的把手，选出想用的一段；也可以拖着整段左右挪。原来的录音不会被剪掉。',
  loading:'正在读取声音…',failed:'这段声音读不出来，先关掉再试一次。',
  start:'开始',end:'结束',window:'选中的一段',
  picked:(from:string,to:string,length:string)=>`从 ${from} 秒到 ${to} 秒，选了 ${length} 秒`,
  heard:(seconds:string,pattern:string)=>`放进声场一共响 ${seconds} 秒（${pattern}）`,
  listenClip:'听这一段',listenSource:'听整段原声',useWhole:'整段都用',stop:'停',
  cancel:'不改了',apply:'用这一段',
  /** 出现方式 wording from the shared five-dimension copy; repeats also say how many times. */
  pattern:(pattern:PatternChoice|undefined)=>!pattern?'按原声出现一次':pattern==='repeat'?`${dimensionCopy.pattern.options.repeat} ${SHAPING_RULES.pattern.repeat.count} 次`:dimensionCopy.pattern.options[pattern],
 },

 notices:{
  'pick-first':'先在左边点一个声音，再点声场里的空白处。',
 'mood-model-off':'自己写心情要等连接模型后才能用，现在先从上面选一个吧。',
  'events-full':'声场里最多放 24 个声音，先移除一些吧。',
  'units-full':'一个作品最多用 12 个声音。',
 'rows-full':'最多 5 行，挤的话可以把声音往左右挪一挪。',
 'row-crowded':'这里摆不下了，声音叠在了一起。可以点「加一行」再错开摆。',
  'need-event':'先把一个声音放进声场吧。',
  'compose-unavailable':'万物成曲还在准备中，暂未开放。你的摆放都还在这里。',
  'load-failed':'网络有点慢，声音没加载出来，再点一次试试。',
  'no-audio':'这个浏览器不能播放试听。',
  'missing-audio':'这个声音的录音只在之前打开的页面里，刷新后找不到了。',
 } satisfies Record<NoticeKey,string>,
} as const;

