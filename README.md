# 万物声谱 · 正式 H5 前端 V1

本目录是本次重新开发的正式项目根目录，与比赛 demo、旧 `wanwu-shengpu` 工程分开。目前完成首页、入口选择弹窗和声音诞生页（等待验收），后续逐页确认。源码已进入 [voice_atalas_v1](https://github.com/guohaha777/voice_atalas_v1)，用户已将此前首页部署至 https://voiceatalas.netlify.app/ 。本轮手绘标题、开场修正和入口弹窗尚未推送或更新线上。

新对话接续请先读 [开发交接 HANDOFF](HANDOFF.md)，其中汇总最新视觉、交互修订及后续页面边界。

## 本机运行

需要 Node.js ≥ 22.22，建议使用 Node 24。

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:5290/。`npm run build` 生成 `apps/web/dist/`；`npm run preview` 在 http://127.0.0.1:5291/ 验收构建产物。

## 文件怎么分

| 目录 | 内容 | 是否进入网页构建 |
| --- | --- | --- |
| `apps/web/src/` | React + TypeScript 前端，页面、组件、交互控制器 | 是，打包后进入 |
| `apps/web/public/media/home/` | 定稿角色 / 环境 / 开场图与手绘标题，各有移动、桌面、兼容版本 | 是；浏览器按尺寸选一种 |
| `apps/web/public/media/shared/markers/`、`media/shared/markers-hero/` | 四款声音标记的压缩衍生图（普通 / 声音诞生角色用大图） | 是 |
| `apps/web/public/media/sounds/home/` | 5 段按需播放的短声音 | 是；点击后请求 |
| `apps/web/public/legal/` | 公开的声音来源与许可 | 是 |
| `assets-source/home/`、`start/`、`shared/` | 首页、入口弹窗、声音标记的透明 PNG 原件 | 否 |
| `packages/contracts/` | 数据契约工作区包 `@wanwu-v2/contracts` | 是，按需打包 |
| `assets-source/audio/home/` | 原始授权录音与公开许可录音 | 否 |
| `docs/product/` | 两份需求文件的原文快照 | 否 |
| `docs/assets/` | 来源、许可、压缩配方、资源哈希清单 | 否 |
| `docs/development/` | 模块边界、逐页状态、部署与后续接入说明 | 否 |
| `scripts/` | 资源重建、预算和归档检查 | 否 |

视觉过程稿、定稿参考图、生成过程记录和验收截图统一放在项目外的相邻目录：[万物声谱_视觉过程稿](../万物声谱_视觉过程稿/README.md)。旧实验室、测试预览、渲染程序及重复素材已删除。正式项目不依赖这个外部视觉档案，原件、许可和可重建资源仍保留在项目内。

工程回归测试保留在 `apps/web/tests/`，用于检查开场和音频逻辑；它们不是旧测试页面。`node_modules/` 是当前开发依赖，`apps/web/dist/` 是当前正式构建产物，均可重新生成。Git 纳入源码、锁文件、原件、公开压缩资源和必要文档，忽略依赖、构建产物、环境密钥和临时文件。

## 首页的模块

- `pages/home/components/`：场景、导航、主文案组件。
- `pages/home/config/`：资源清单、透明度、动画参数，改视觉优先在这里调整。
- `pages/home/model/`：开场生命周期和角色点击交互。
- `shared/audio/`：单声音播放、抢占、静音和清理，可供后续页面复用。
- `shared/media/`：响应式图片、PNG 兼容处理。
- `app/navigation.ts`、`app/router.ts`：主流程四步、入口类型与路由。
- `shared/scene/`：首页场景素材清单，首页、弹窗、声音诞生页共用。

## 入口弹窗与声音诞生页

- `pages/sound-birth/`：`/create`，选声音 / 录音 / 上传 / 纸卡参考、声卡信息溯源、五项选择与对比试听、向导小鸟提示，见 [声音诞生验收](docs/development/sound-birth-acceptance.md)。工作页配色在 `styles/global.css` 的 `--wk-*`，图标在 `shared/ui/KidIcon.tsx`。

修改位置：草木透明度和开场参数在 `pages/home/config/scene.ts`，角色动作在 `config/motions.ts`，手机 / 平板定位在 `HomePage.module.css`。图片裁切、输出尺寸和基准坐标改 `docs/assets/build-recipe.json` 后执行 `npm run assets:build`，不要手改 `shared/scene/home-assets.generated.json`。

“开始成曲”打开三入口弹窗，三个入口都进入声音诞生页的对应状态；万物声场、万物成曲、作品书架和登录仍明确提示未开放。全部前端确认后再接业务功能。

## 视觉基准

沿用已确认首页：白底、中轴黑体、左下重右下轻的纸贴景色。动物维持独立清晰；草木不透明度为左上 32%、右上树冠 46%、左侧中景 56%、右下 58%、左下近景 75%，开场近景 94%。手机、电脑共用组件，按画幅重新定位。

约 1.5 秒开场、点击短动作与声音、静音、重看和来源入口均保留。减少动态、节流、弱设备提示与返回访问跳过自动开场；开场等待超过 1800 ms 则直接静态展示，后到资源不补播。

## 检查与资源更新

```sh
npm test
npm run build
# 仅在替换原件、修改压缩配方后执行：
npm run assets:build
```

图片预算（包含两张开场图）：移动 341.9 KiB、桌面 694.9 KiB、PNG 兼容 339.5 KiB；每段声音 17–20 KiB。`check:assets` 校验资源实际字节和 SHA-256，阻止原件、文档和源录音进入公开目录。重建工具只读取项目内已归档资源，不依赖旧工程或实验室。

详情见 [开发约定](docs/development/architecture.md)、[页面状态](docs/development/pages.md)、[首页验收](docs/development/home-acceptance.md)、[素材来源](docs/assets/SOURCES.md)。

## 手绘标题与开场修正

首页标题已按用户确认改为黑色手绘透明资产，正文及导航继续使用黑体。`npm run assets:build` 同时重建场景和标题；标题组件、model、config 独立。丛林结束后约 1.45 秒逐字轻弹入场，之后文字静止，仅后方音符和泡泡循环上升淡出。跳过及轻量模式直接完整展示。字体和音符采用压缩 WebP / PNG，泡泡为独立 SVG；资源解码完成后再入场，加载超时使用系统字回退。

当前开场资源等待上限改为 1800ms（覆盖上文历史的 650ms），场景与前景并行加载，超时不再误记为已看过；Netlify 徽章出现时上移右下控制以免遮挡。本轮尚未提交或更新线上。
