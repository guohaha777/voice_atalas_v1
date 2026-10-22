// Sound library port. Bundled examples plus sources captured on this device in this visit.
// Personal / class / public libraries need the server and are reported as not yet available.
import type {SoundSource} from '@wanwu-v2/contracts/sound';
import type {ArchiveSnapshot} from './sourceArchive';

export type LibraryItem={source:SoundSource;url:string|null};
export type LibraryGroup={id:string;title:string;note:string;items:LibraryItem[]};

export const EXAMPLE_GROUP='示例声音';

/** Examples first, then local sources grouped by their 分组 (ungrouped last). */
export function libraryGroups(examples:readonly LibraryItem[],local:ArchiveSnapshot):LibraryGroup[]{
 const byGroup=new Map<string,LibraryItem[]>();
 for(const source of local){const key=source.provenance.group??'';byGroup.set(key,[...(byGroup.get(key)??[]),{source,url:null}]);}
 const groups=[...byGroup.entries()].sort(([a],[b])=>a===''?1:b===''?-1:a.localeCompare(b,'zh-Hans-CN'))
  .map(([group,items])=>({id:`local:${group}`,title:group||'未分组',note:'本机 · 未上传',items}));
 return [{id:'examples',title:EXAMPLE_GROUP,note:'随网页提供 · 可查看来源与许可',items:[...examples]},...groups];
}
