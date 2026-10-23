// Only approved pages are activated here. No fake login or business API is provided.

/** Main flow. Steps without a path are not built yet and render as plain labels. */
export const flowSteps=[
 {id:'entry',label:'声音入口',path:'/'},
 {id:'birth',label:'声音诞生',path:'/create'},
 {id:'world',label:'万物声场',path:'/world'},
 {id:'compose',label:'万物成曲',path:'/compose'},
] as const;

/** The three ways in from the start dialog; each opens 声音诞生 in the matching state. */
export type CreationEntry='card'|'upload'|'library';
export const creationEntryIds:readonly CreationEntry[]=['card','upload','library'];
/** Navigation seam only: the app maps an entry to the sound-birth page state. No upload or API call happens here. */
export type CreationEntryIntent={entry:CreationEntry};
export type CreationEntryResult={status:'unavailable'}|{status:'opened'};
export const destinations={
 create:{label:'开始成曲',page:'选择开始方式',ready:true},
 library:{label:'声音库',page:'声音库',path:'/sounds',ready:false},
 shelf:{label:'作品书架',page:'作品书架',path:'/works',ready:true},
 login:{label:'老师 / 贡献者登录',page:'登录',path:'/sign-in',ready:false},
} as const;
export type HomeDestination=keyof typeof destinations;
