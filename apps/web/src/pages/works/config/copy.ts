import type {Visibility} from '@wanwu-v2/contracts/work';
import {homeLayer} from '../../../shared/scene/homeScene';

/** 作品书架 is kept by the snail — slow and careful, it keeps what you made. Reuses the home derivative. */
export const shelfGuide={label:'小蜗牛向导',variants:homeLayer('snail').variants};

export const shelfCopy={
 title:'作品书架',
 subtitle:'这次打开以来放进书架的小曲子，都在这里。',
 bubble:(count:number)=>count?`书架上有 ${count} 首小曲子，点「打开听听」就能回到曲谱。`:'书架还空着。做完一首，点「保存这首作品」就会放到这里。',
 sessionBadge:'仅本次打开期间保留 · 刷新就没了',
 accountNote:'登录后保存到账号、分享给班级，暂未开放。',
 empty:'还没有作品',
 emptyHint:'在万物成曲点「保存这首作品」，它就会出现在这里。',
 makeOne:'去做一首',goCompose:'回到万物成曲',
 open:'打开听听',
 sounds:(count:number)=>`${count} 个声音`,
 seconds:(value:string)=>`约 ${value} 秒`,
 savedAt:(time:string)=>`${time} 放进书架`,
 current:'正在做的这首',
 visibility:{private:'仅自己可见',class:'班级可见',school:'学校可见',region:'地区可见',public:'公开'} satisfies Record<Visibility,string>,
 replace:{
  title:'换成这首？',
  description:'现在正在做的那首还没有放进书架，打开别的作品会把它换掉。',
  keep:'先回去保存',open:'换成这首',
 },
} as const;
