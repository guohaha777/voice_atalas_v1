import type {HomeDestination} from '../../../app/navigation';
import {Icon} from '../../../shared/ui/Icon';
import styles from '../HomePage.module.css';
export function HomeHeader({onNavigate}:{onNavigate:(page:HomeDestination)=>void}){return <header className={styles.header}>
 <p className={styles.brand}>万物声谱</p>
 <nav className={styles.nav} aria-label="主导航">
  <button type="button" onClick={()=>onNavigate('library')}><Icon name="wave"/>声音库</button>
  <button type="button" onClick={()=>onNavigate('shelf')}><Icon name="book"/>作品书架</button>
  <button type="button" onClick={()=>onNavigate('login')}>老师 / 贡献者登录</button>
 </nav>
</header>;}
