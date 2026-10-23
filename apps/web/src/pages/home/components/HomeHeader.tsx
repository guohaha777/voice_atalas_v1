import type {HomeDestination} from '../../../app/navigation';
import {Glyph} from '../../../shared/ui/PaperIcon';
import {Logo} from '../../../shared/ui/Logo';
import styles from '../HomePage.module.css';
export function HomeHeader({onNavigate}:{onNavigate:(page:HomeDestination)=>void}){return <header className={styles.header}>
 <p className={styles.brand}><Logo/></p>
 <nav className={styles.nav} aria-label="主导航">
  <button type="button" onClick={()=>onNavigate('library')}><Glyph name="bars"/>声音库</button>
  <button type="button" onClick={()=>onNavigate('shelf')}><Glyph name="shelf"/>作品书架</button>
  <button type="button" onClick={()=>onNavigate('login')}><Glyph name="person"/>老师 / 贡献者登录</button>
 </nav>
</header>;}
