import {flowSteps} from './navigation';
import {FlowHeader} from '../shared/ui/FlowHeader';

/** Shown while a lazily loaded page's code arrives; keeps the header so slow networks never see a blank screen. */
export function PageFallback(){
 return <><FlowHeader steps={flowSteps} current="birth" onNavigate={path=>{location.href=path;}}/>
  <p role="status" style={{textAlign:'center',color:'var(--muted)',fontSize:14,marginTop:'20vh'}}>正在打开…</p></>;
}
