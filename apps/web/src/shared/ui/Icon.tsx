type Name='wave'|'book'|'arrow'|'down'|'sound'|'muted'|'replay'|'close';
const paths:Record<Name,string>={
 wave:'M3 10v4m4-7v10m4-13v16m4-13v10m4-7v4',
 book:'M3 5c3-1 6-.5 9 1 3-1.5 6-2 9-1v15c-3-1-6-.5-9 1-3-1.5-6-2-9-1zm9 1v15',
 arrow:'M3 12h17m-6-6 6 6-6 6',down:'M12 3v17m-6-6 6 6 6-6',
 sound:'M3 9h4l5-4v14l-5-4H3zm13-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14',
 muted:'M3 9h4l5-4v14l-5-4H3zm13 0 6 6m0-6-6 6',
 replay:'M4 9a8 8 0 1 1 0 7m0-13v6h6',close:'m6 6 12 12m0-12L6 18',
};
export function Icon({name,className}:{name:Name;className?:string}){return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;}
