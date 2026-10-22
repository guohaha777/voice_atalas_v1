import {Icon} from '../../../shared/ui/Icon';
import {HomeInteractionHint} from './HomeInteractionHint';
import styles from '../HomePage.module.css';
export function HomeHero({onStart,feedback}:{onStart:()=>void;feedback:{message:string;visible:boolean}}){return <section className={styles.hero} aria-labelledby="home-title">
 <p className={styles.today}>今天，</p><h1 id="home-title">你听见了什么？</h1>
 <p className={styles.lead}>把身边的声音，排成自己的小曲子。</p>
 <button className={styles.primary} type="button" onClick={onStart}>开始成曲<Icon name="arrow"/></button>
 <p className={styles.helper}>免登录，用示例声音试一试</p>
 <HomeInteractionHint feedback={feedback}/>
</section>;}
