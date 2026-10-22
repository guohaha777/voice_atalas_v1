import type {SoundDimension} from '@wanwu-v2/contracts/sound';
import styles from '../SoundBirthPage.module.css';

const guides=[16,32,48];
/** Small data-free diagrams for each option; drawn as SVG so they scale and never need image requests. */
export function ShapeGlyph({dimension,value}:{dimension:SoundDimension;value:string}){
 return <svg className={styles.glyph} viewBox="0 0 120 64" aria-hidden="true">{draw(dimension,value)}</svg>;
}
function draw(dimension:SoundDimension,value:string){
 switch(dimension){
  case 'pitch':{
   const y=value==='low'?48:value==='mid'?32:16;
   return <>{guides.map(g=><line key={g} className={styles.guide} x1="22" x2="98" y1={g} y2={g}/>)}<circle className={styles.dot} cx="60" cy={y} r="9"/></>;
  }
  case 'duration':{
   const width=value==='short'?16:value==='medium'?44:80;
   return <><line className={styles.guide} x1="20" x2="100" y1="44" y2="44"/><rect className={styles.fill} x="20" y="24" width={width} height="14" rx="7"/></>;
  }
  case 'contour':{
   const d=value==='rising'?'M18 50C44 48 72 34 102 14':value==='falling'?'M18 14C44 16 72 30 102 50':value==='flat'?'M18 32H102':'M18 32c10-16 18-16 28 0s18 16 28 0 18-16 28 0';
   return <path className={styles.stroke} d={d}/>;
  }
  case 'intensity':{
   const r=value==='soft'?7:value==='medium'?12:18;
   return <><circle className={styles.halo} cx="60" cy="32" r="26"/><circle className={styles.dot} cx="60" cy="32" r={r}/></>;
  }
  case 'pattern':{
   const xs=value==='once'?[60]:value==='repeat'?[30,60,90]:value==='bursts'?[24,40,80,96]:[24,48,72,96];
   return <>{xs.map((x,i)=><circle key={x} className={styles.dot} cx={x} cy="32" r={value==='fade-in'?4+i*2.5:8} opacity={value==='fade-in'?.3+i*.23:1}/>)}</>;
  }
 }
}
