# 首页定稿 V1声音来源与修改记录

这份记录随预览和声音文件一同保留。声音点击后加载，无背景自动播放。所有交付片段均转为单声道 32 kHz / MP3 48 kbps，做短淡入淡出和响度处理，具体来源与授权如下。

| 文件 | 内容、来源与作者 | 许可 | 本次修改 |
| --- | --- | --- | --- |
| `bird.mp3` | 鸟鸣，沿用旧 demo 的 `forest-bird.mp3` | 用户提供；旧项目 [旧授权记录](legacy-audio-authorization.md) 记录用户于 2026-08-10 授权公开使用。非公共领域或 CC 声明。 | 从第 8 秒截取 3.2 秒，转码、淡入淡出、响度处理 |
| `leaves.mp3` | 风与树叶环境声，沿用旧 demo 的 `wind.mp3` | 同上 | 从第 6 秒截取 2.8 秒，转码、淡入淡出、响度处理 |
| `frog.mp3` | [Single Frog Croak](https://commons.wikimedia.org/wiki/File:Single_Frog_Croak.oga)，MichaeltheFox8621 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)，修改片段沿用此许可 | 从第 0.4 秒截取 3.2 秒，转码、淡入淡出、响度处理 |
| `cicada.mp3` | [Chorus Cicada singing](https://commons.wikimedia.org/wiki/File:Chorus_Cicada_singing.ogg)，Siobhan Leachman / Ambrosia10 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | 从第 5 秒截取 3.2 秒，转码、淡入淡出、响度处理 |
| `drop.mp3` | [Water drops dripping](https://commons.wikimedia.org/wiki/File:Water_drops_dripping.ogg)，ZooFari | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)，修改片段沿用此许可 | 从第 3 秒截取 2.8 秒，转码、淡入淡出、响度处理 |

水滴来源为室内水滴落入容器的录音，交互提示标为“滴水声”。松鼠使用树叶环境声，没有将其标为松鼠叫声。蜗牛只做动作，不配虚构叫声。

公开来源原文件保存在 `assets-source/audio/home/`。原件和交付文件的 SHA-256 见 [audio-provenance.json](audio-provenance.json)。CC BY-SA 对相应改编声音文件继续适用，不表示整个程序改用该许可。

## 图片

13 张 PNG 为本次调用内置 imagegen、以用户确认的 V12 视觉为参考重新生成的分层资产，保留原文件于 `assets-source/home/`。不是从 V12 无损抠出的原图层；不能承诺角色与原图逐像素一致。完整生成及修正提示词已移入项目外的视觉档案：`万物声谱_视觉过程稿/资产生成记录/imagegen-prompts.json`。该档案仅用于过程溯源，不是构建依赖。

网页衍生版本仅作透明边界裁紧、尺寸缩小与 WebP / PNG 压缩，没有人工绘制或遮罩去底。所有 PNG 原件均具有 alpha 通道；部分纸贴边缘有浅色柔边，需结合最终白底画面审美验收。

正式网页文件使用内容哈希命名；逻辑声音名与网页文件路径见 `apps/web/src/pages/home/config/home-assets.generated.json`。该目录仅归档旧记录中的鸟鸣和风声来源，未引入旧项目其他素材。

## 2026-10-22 五官修订

使用内置 imagegen 对现有透明 PNG 做局部编辑：蝉的嘴移至头部前缘；蜗牛移除面部重复眼睛，仅保留触角眼。修订前原件及完整两条编辑提示词保存在项目外 `万物声谱_视觉过程稿/资产修订/2026-10-22-五官与落点修订/`。正式原件仍在 `assets-source/home/characters/`，已同步源文件 SHA-256、裁切配方和全部网页衍生图。松鼠及其他角色原图未重绘，落点通过场景组合坐标修正。
