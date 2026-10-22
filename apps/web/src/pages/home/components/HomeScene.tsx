import {useState} from 'react';
import type {CSSProperties,RefObject} from 'react';
import {ResponsivePicture} from '../../../shared/media/ResponsivePicture';
import type {SceneLayer} from '../../../shared/media/types';
import {sceneLayers,homeAssets,foliageOpacity,sceneGroups,mobilePlacement} from '../config/scene';
import styles from '../HomePage.module.css';
type Props={sceneRef:RefObject<HTMLDivElement|null>;waiting:boolean;active:{id:string|null;phase:string};onInteract:(asset:SceneLayer,el:HTMLElement)=>void};
function Layer({asset,active,onInteract,group}:{asset:SceneLayer;active:Props['active'];onInteract:Props['onInteract'];group:readonly [number,number,number,number]}){
 const [failed,setFailed]=useState(false);
 const [gx,gy]=group;
 const [worldX,worldY,w,h]=asset.rect;
 const x=worldX-gx,y=worldY-gy;
 const [mx,my,mw,mh]=mobilePlacement[asset.id]||[x,y,w,h];
 const style={'--x':x,'--y':y,'--w':w,'--h':h,'--mx':mx,'--my':my,'--mw':mw,'--mh':mh,'--z':asset.z,'--origin':asset.origin||'center',opacity:foliageOpacity[asset.id]} as CSSProperties;
 const className=[styles.asset,styles[asset.kind],failed?styles.failed:'',active.id===asset.id?styles['is-'+active.phase]:''].filter(Boolean).join(' ');
 const picture=<ResponsivePicture asset={asset} onFailure={()=>setFailed(true)}/>;
 if(asset.kind==='character')return <button type="button" className={className} style={style} data-id={asset.id} data-label={asset.label}
  aria-describedby="home-sticker-hint" title={`点一下${asset.label}${asset.sound?'，听听声音':'，看它动一动'}`}
  aria-label={`${asset.label}，${asset.sound?'点击试听'+homeAssets.sounds[asset.sound].label:'点击看它慢慢挪动'}`}
  onClick={event=>onInteract(asset,event.currentTarget)}><span className={styles.hitArea} aria-hidden="true"/>{picture}</button>;
 return <div className={className} style={style} data-id={asset.id} aria-hidden="true">{picture}</div>;
}
export function HomeScene({sceneRef,waiting,active,onInteract}:Props){return <div ref={sceneRef} className={[styles.scene,waiting?styles['pending-intro']:''].join(' ')} aria-label="可以点击试听的自然小伙伴">
 {sceneGroups.map(group=><div key={group.id} className={styles.sceneGroup} data-group={group.id} style={{'--space-w':group.rect[2],'--space-h':group.rect[3]} as CSSProperties}>
  {sceneLayers.filter(asset=>(group.members as readonly string[]).includes(asset.id)).map(asset=><Layer key={asset.id} asset={asset} group={group.rect} active={active} onInteract={onInteract}/>)}
 </div>)}
</div>;}
