// Cute, solid mood faces for the work pages (万物声场 now, 万物成曲 later). Every face is a filled, shaded ball with its
// own expression — never an outline with an empty middle — and each mood differs by expression, not colour alone.
import {useId} from 'react';
import type {ReactNode} from 'react';
import type {MoodId} from '@wanwu-v2/contracts/arrangement';

export type MoodFaceName=MoodId|'unset'|'custom';

const INK='#4a3b2c',BLUSH='#ff8fa3';
const tones:Record<MoodFaceName,[string,string]>={
 happy:['#fff3b0','#ffcf3f'],calm:['#e4f8ff','#8fd8f2'],lively:['#f2ffc4','#a9da2e'],sad:['#e9eeff','#9fb2f0'],
 angry:['#ffe1d9','#ff8a70'],scared:['#f4ecff','#c6b0f0'],curious:['#ddfff0','#6fd6ab'],unset:['#fbfbf6','#dfe2d6'],custom:['#fff0f3','#ffb8c4'],
};
const line={fill:'none',stroke:INK,strokeWidth:2.2,strokeLinecap:'round',strokeLinejoin:'round'} as const;
const dot=(cx:number,cy:number,r=1.9)=><circle cx={cx} cy={cy} r={r} fill={INK}/>;
const cheeks=(opacity=.75)=><><ellipse cx="11" cy="25" rx="2.6" ry="1.7" fill={BLUSH} opacity={opacity}/><ellipse cx="29" cy="25" rx="2.6" ry="1.7" fill={BLUSH} opacity={opacity}/></>;

const faces:Record<MoodFaceName,ReactNode>={
 happy:<>
  <path d="M11.5 19.5q2.6-3.4 5.2 0M23.3 19.5q2.6-3.4 5.2 0" {...line}/>
  <path d="M13.5 23.5q6.5 8.6 13 0z" fill={INK}/><path d="M16.8 27.2q3.2 2.1 6.4 0q-3.2-2.2-6.4 0z" fill="#ff8a8a"/>
  {cheeks()}
 </>,
 calm:<>
  <path d="M11.8 19.6q2.5 2.4 5 0M23.2 19.6q2.5 2.4 5 0" {...line}/>
  <path d="M16.4 25.8q3.6 2.4 7.2 0" {...line}/>
  {cheeks(.55)}
 </>,
 lively:<>
  <path d="M11.6 19.8q2.6-2.8 5.2 0" {...line}/>{dot(25.8,19,2.4)}<circle cx="26.6" cy="18.2" r=".8" fill="#fff"/>
  <path d="M14.5 23.6h11q-.6 6.4-5.5 6.4t-5.5-6.4z" fill={INK}/><path d="M17.2 27.6q2.8 1.7 5.6 0q-2.8-1.8-5.6 0z" fill="#ff8a8a"/>
  <path d="M33.6 5.4q.5 2.6 3 3q-2.5.5-3 3q-.5-2.5-3-3q2.5-.4 3-3z" fill="#ffd23f"/>
  {cheeks()}
 </>,
 sad:<>
  <path d="M11.4 15.6l4.6-1.8M28.6 15.6l-4.6-1.8" {...line} strokeWidth={1.8}/>
  {dot(14.2,20.2)}{dot(25.8,20.2)}
  <path d="M15.6 28.4q4.4-3.8 8.8 0" {...line}/>
  <path d="M27.4 23.2q1.7 2.6 1.7 3.6a1.7 1.7 0 0 1-3.4 0q0-1 1.7-3.6z" fill="#5fb7ff"/>
  {cheeks(.4)}
 </>,
 angry:<>
  <path d="M10.8 15.2l5.8 2.6M29.2 15.2l-5.8 2.6" {...line} strokeWidth={2.4}/>
  {dot(14.6,20.6)}{dot(25.4,20.6)}
  <path d="M15 28.2q2.5-2.4 5 0t5 0" {...line}/>
  <path d="M30.5 6.5l1.4 2.4M34.6 7.8l-2 1.9M33.6 11.6l-2.6-.6" {...line} stroke="#e8543a" strokeWidth={1.8}/>
  {cheeks(.95)}
 </>,
 scared:<>
  <circle cx="14.4" cy="19.6" r="3.6" fill="#fff"/><circle cx="25.6" cy="19.6" r="3.6" fill="#fff"/>
  {dot(14.6,20.2,1.6)}{dot(25.4,20.2,1.6)}
  <path d="M13.6 27.4q1.6-1.8 3.2 0t3.2 0t3.2 0t3.2 0" {...line} strokeWidth={1.9}/>
  <path d="M8.2 9.4q1.6 2.4 1.6 3.4a1.6 1.6 0 0 1-3.2 0q0-1 1.6-3.4z" fill="#7cc8ff"/>
  {cheeks(.45)}
 </>,
 curious:<>
  <path d="M22.6 13.6q3.2-2.4 6.2-.6" {...line} strokeWidth={1.9}/>
  {dot(14.4,19.8)}{dot(25.6,19.4,2.5)}<circle cx="26.4" cy="18.6" r=".8" fill="#fff"/>
  <ellipse cx="20.4" cy="27" rx="2.4" ry="2.8" fill={INK}/>
  <path d="M31.4 4.8a2.8 2.8 0 1 1 3.6 2.7q-1 .4-1 1.6" {...line} stroke="#2f8f6a" strokeWidth={1.9}/><circle cx="34" cy="11.6" r="1.1" fill="#2f8f6a"/>
  {cheeks(.6)}
 </>,
 unset:<>
  {dot(14.4,20,1.7)}{dot(25.6,20,1.7)}
  <path d="M16.6 26.6h6.8" {...line} stroke="#8a8f80"/>
 </>,
 custom:<>
  {dot(14.2,19.6)}{dot(24.6,19.6)}
  <path d="M15.4 25.6q3.6 3 7.2 0" {...line}/>
  {cheeks()}
  <g transform="rotate(40 31 13)"><rect x="28.6" y="2.6" width="4.8" height="15" rx="1.4" fill="#ffb03a"/><path d="M28.6 17.6h4.8l-2.4 4z" fill="#ffe1b0"/><path d="M30.2 20.4h1.6L31 22z" fill={INK}/><rect x="28.6" y="2.6" width="4.8" height="3.2" rx="1.4" fill="#ff8fa3"/></g>
 </>,
};

/** A filled mood face (decorative; the label next to it names the mood). */
export function MoodFace({name,className}:{name:MoodFaceName;className?:string}){
 const id=useId(),[light,deep]=tones[name];
 return <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
  <defs><radialGradient id={id} cx="35%" cy="28%" r="78%"><stop offset="0" stopColor={light}/><stop offset=".62" stopColor={deep}/><stop offset="1" stopColor={deep} stopOpacity=".92"/></radialGradient></defs>
  <ellipse cx="20" cy="37.2" rx="11" ry="1.8" fill="#26301a" opacity=".1"/>
  <circle cx="20" cy="21" r="16" fill={`url(#${id})`}/>
  <ellipse cx="13.6" cy="11.6" rx="4.6" ry="2.6" fill="#fff" opacity=".7" transform="rotate(-28 13.6 11.6)"/>
  {faces[name]}
 </svg>;
}
