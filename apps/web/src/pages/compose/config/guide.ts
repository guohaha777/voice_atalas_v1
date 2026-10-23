// 万物成曲 is led by the squirrel — it gathers what the forest made, the way the score gathers every sound.
// Reuses the home derivative (already cached). Lines are hand-written guidance, not generated.
import {homeLayer} from '../../../shared/scene/homeScene';

export const composeGuide={label:'小松鼠向导',variants:homeLayer('squirrel').variants};

export const guideLines={
 loading:'等我一下，曲谱马上就好～',
 example:'这是示例摆放的曲谱，先听听；回声场自己摆一首，再来保存吧。',
 empty:'声场里还没有声音，回声场摆几个吧。',
 idle:'点「播放」，看竖线走到哪个声音，它就会亮起来～',
 playing:'听，竖线走到哪里，哪个声音就在唱～',
 paused:'停在这里啦，再点「播放」接着听。',
 ended:'听完啦！可以换个长度、开关背景再听一遍。',
 span:(seconds:number)=>`变成 ${seconds} 秒啦，声音的先后都没变。`,
 inspiration:'借来了课本的节奏，只给背景用，你的声音一点没变。',
 saved:'放进作品书架啦！这次打开期间都能找到它。',
};
