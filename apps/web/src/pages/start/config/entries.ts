import type {IconName} from '../../../shared/ui/Icon';
import type {StartArtId} from './art';

import type {CreationEntry} from '../../../app/navigation';

export type CreationEntryOption={id:CreationEntry;title:string;description:string;continueLabel:string;art:StartArtId;icon:IconName};

export const creationEntries:readonly CreationEntryOption[]=[
 {id:'card',title:'制作声卡',description:'把听见的声音，\n做成自己的声卡。',continueLabel:'继续制作声卡',art:'start-card',icon:'card'},
 {id:'upload',title:'上传声音',description:'带来一段录音，\n留下身边的声音。',continueLabel:'继续上传声音',art:'start-upload',icon:'upload'},
 {id:'library',title:'从声音库挑选',description:'听听自然里的声音，\n挑几个喜欢的。',continueLabel:'继续挑选声音',art:'start-library',icon:'library'},
];

export const startCopy={
 brand:'万物声谱',
 title:'这一次，想从哪里开始？',
 description:'带来自己的发现，或从声音库里找找灵感。',
 legend:'选择一种开始方式',
 idleAction:'选一种方式开始',
 unavailableAction:'暂未开放',
 unavailable:(title:string)=>`「${title}」还在准备中，可以先看看别的方式。`,
} as const;
