import {Glyph} from '../../../shared/ui/PaperIcon';
import {HomeInteractionHint} from './HomeInteractionHint';
import {HandwrittenTitle} from './HandwrittenTitle';
import type {IntroState} from '../model/introState';
import styles from '../HomePage.module.css';
export function HomeHero({onStart,feedback,opening,cycle}:{onStart:()=>void;feedback:{message:string;visible:boolean};opening:IntroState;cycle:number}){return <section className={styles.hero} aria-labelledby="home-title">
 <HandwrittenTitle opening={opening} cycle={cycle}/>
 <p className={styles.lead}>把身边的声音，排成自己的小曲子。</p>
 <button className={styles.primary} type="button" onClick={onStart}>开始成曲<Glyph name="arrow"/></button>
 <p className={styles.helper}>免登录，用示例声音试一试</p>
 <HomeInteractionHint feedback={feedback}/>
</section>;}
