export type IconName='wave'|'book'|'arrow'|'down'|'sound'|'muted'|'replay'|'close'|'card'|'upload'|'library';
const paths:Record<IconName,string>={
 wave:'M3 10v4m4-7v10m4-13v16m4-13v10m4-7v4',
 book:'M3 5c3-1 6-.5 9 1 3-1.5 6-2 9-1v15c-3-1-6-.5-9 1-3-1.5-6-2-9-1zm9 1v15',
 arrow:'M3 12h17m-6-6 6 6-6 6',down:'M12 3v17m-6-6 6 6 6-6',
 sound:'M3 9h4l5-4v14l-5-4H3zm13-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14',
 muted:'M3 9h4l5-4v14l-5-4H3zm13 0 6 6m0-6-6 6',
 replay:'M4 9a8 8 0 1 1 0 7m0-13v6h6',close:'m6 6 12 12m0-12L6 18',
 card:'M4 3.5h13l3 3V21H4zm13 0V7h3M7 10h5m-5 3h3m4 0v4c0 2-3 2-3 .5 0-1 1.5-1.5 3-1m0-3.5 3-1v4c0 2-3 2-3 .5 0-1 1.5-1.5 3-1',
 upload:'M12 15V3m-4 4 4-4 4 4M4 13v7h16v-7',
 library:'M2 5h5v15H2zm8-2h4v17h-4zm7 4 3-1 3 13-3 1zM4.5 8v8M12 6v10',
};
/** Fine-line icons for the home page and start dialog. Work pages use the playful KidIcon set. */
export function Icon({name,className}:{name:IconName;className?:string}){return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;}
