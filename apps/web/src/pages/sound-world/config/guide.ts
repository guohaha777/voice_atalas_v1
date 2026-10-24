// 万物声场 is led by the frog — it hops between lily pads the way sounds hop between places in the field.
// Reuses the home derivative (already cached). Lines are hand-written guidance, not generated.
import {homeLayer} from '../../../shared/scene/homeScene';

export const worldGuide={label:'小青蛙向导',variants:homeLayer('frog').variants};

export const guideLines={
 loading:'等我一下，声场马上就好～',
 playing:'听，声音一个接一个响起来～',
 unitSelected:(name:string)=>`把「${name}」放到哪里？点空白处就放下。`,
 eventSelected:'点它就能再听一次；按住可以拖到别处。换一行只是错开，声音不变。',
 placed:'放好啦！点它就能听，「剪一剪」能选一段。',
 copied:'复制好啦！新的就在后面，按住可以拖到想要的地方。',
 removed:'拿走啦。想放回来，就再点左边的声音。',
 rowAdded:'多了一行！挤在一起的声音可以错开摆，声音不会变。',
 clipped:'剪好啦！它现在只响你选的那一段，原来的录音还在。',
 span:(seconds:number)=>`声场变成 ${seconds} 秒啦，声音的先后都没变。`,
 example:'这是一个示例摆放，先听一听，也可以清空了自己摆。',
 empty:'先在左边点一个声音，再点声场里的空白处放下。',
 idle:'摆好了就点「听听这段声音」，听听看～',
};
