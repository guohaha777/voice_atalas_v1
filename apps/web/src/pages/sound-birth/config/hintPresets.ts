// Preset "sound association" prompts the sound character says after each choice. Written by hand, not generated.
// When the model / prompt module is connected, it replaces these through services/soundHints.ts; keep these as the offline fallback.
import type {SoundShape} from '@wanwu-v2/contracts/sound';

export const presetHints:{[K in keyof SoundShape]:Record<SoundShape[K],string>}={
 pitch:{
  low:'低低的声音，像青蛙在池塘边“咕——”。你还听过哪些低低的声音？',
  mid:'不高不低的声音，像风轻轻吹过草地，最适合陪着别的声音一起唱。',
  high:'高高的声音，像小鸟在树梢上“啾啾”。找找身边还有什么高高的声音？',
 },
 duration:{
  short:'短短的声音，像水滴“嗒”一下就不见了。',
  medium:'不长不短刚刚好，像一声轻轻的敲门。',
  long:'长长的声音，像蝉一直“知了——”地唱，好像停不下来。',
 },
 contour:{
  rising:'往上走的声音，像小鸟飞起来，耳朵也跟着抬头。',
  falling:'往下落的声音，像树叶慢慢落到地上。',
  flat:'稳稳的声音，像远处一直吹着的风，可以垫在别的声音下面。',
  wavy:'有起伏的声音，像小溪一会儿高一会儿低，它自己就在呼吸。',
 },
 intensity:{
  soft:'轻轻的声音，要把耳朵凑近才能听见，像蜗牛爬过叶子。',
  medium:'刚刚好的音量，像朋友在身边说悄悄话。',
  loud:'响亮的声音，像雷声“轰隆隆”，一下就抓住了耳朵。',
 },
 pattern:{
  once:'只出现一次的声音，大家反而会记得最牢。',
  repeat:'重复出现就有了节奏，像啄木鸟“笃笃笃”，让人想跟着点头。',
  bursts:'一阵一阵地来，像在和谁一问一答。',
  'fade-in':'慢慢出现的声音，像雨从远处慢慢走近。',
 },
};
