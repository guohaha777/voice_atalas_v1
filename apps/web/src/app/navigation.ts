// Only approved pages are activated here. No fake login or business API is provided.
export const destinations={
 create:{label:'开始成曲',page:'选择声音',path:'/create/sounds',ready:false},
 library:{label:'声音库',page:'声音库',path:'/sounds',ready:false},
 shelf:{label:'作品书架',page:'作品书架',path:'/works',ready:false},
 login:{label:'老师 / 贡献者登录',page:'登录',path:'/sign-in',ready:false},
} as const;
export type HomeDestination=keyof typeof destinations;
