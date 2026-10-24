# 万物声谱 · 工程前端开发交接 3（调 UI 风格阶段）

更新：2026-10-23。正式工程：`/Users/hahaking/Projects/voice_atalas/wanwu-shengpu-v2`。仓库 `https://github.com/guohaha777/voice_atalas_v1`，分支 `main`，当前提交 `cf989f7`，工作区干净。

> 2026-10-24：**本文件已被 `HANDOFF4.md` 取代**，只作历史记录。

**本文件取代 `HANDOFF2.md`（历史记录，不要再按它的“下一步”开发）。** 先读根目录 `AGENTS.md`，再读本文件。用户当前指令优先。

## 1. 这一阶段做什么

**功能已基本定下来，接下来只调 UI 风格，且必须保证功能不变。** 不新增页面，不接后端或模型，不改数据契约。每次改动后按第 6 节验证；视觉大改（换色系、换图标体系、改版式）先让用户确认。未经用户明确说“提交 / 推送”，不要 git 提交或推送。

## 2. 页面与路由（全部前端已实现）

| 页面 | 路由 | 状态 | 文档 |
| --- | --- | --- | --- |
| 首页（声音入口） | `/` | 已实现；2026-10-23 图标与文字改为声音诞生风格、去掉贴纸旁文字和底部“带上你发现的声音”、删除开始方式弹窗（“开始成曲”直达 `/create`），待验收 | `home-acceptance.md` |
| 声音诞生 | `/create` | 功能已验收；**2026-10-23 按页面草稿改版 UI，待验收**（实心纸片图标、声音标记角色） | `sound-birth-acceptance.md` |
| 万物声场 | `/world` | 已实现；2026-10-23 按声音诞生风格改版视觉（功能不变），等待验收 | `sound-world-acceptance.md` |
| 万物成曲 | `/compose` | 已实现；2026-10-23 按声音诞生风格改版视觉（功能不变），等待验收 | `compose-acceptance.md` |
| 作品书架 | `/works` | 已实现，等待验收 | `works-acceptance.md` |

主流程四步：声音入口 → 声音诞生 → 万物声场 → 万物成曲；书架、声音库是辅助入口。总览见 `docs/development/pages.md`，结构与接入边界见 `architecture.md`。每页一份文档，改了行为或结构要同步对应文档。

## 3. 文件结构

```
apps/web/src/
├─ app/        路由 router.ts、四步导航 navigation.ts、页面组合 App.tsx
├─ pages/      home · start · sound-birth · sound-world · compose · works
│              每页：components / model / config / services + XxxPage.tsx + XxxPage.module.css
├─ shared/     audio · creation · inspiration · markers · media · scene · ui · platform
└─ styles/global.css   设计令牌（--wk-*）
packages/contracts/    sound-v1 · arrangement-v1 · work-v1（类型 + 校验）
apps/web/tests/        逻辑测试（62 项，纯函数 / reducer / 契约）
docs/development/      每页文档 + architecture / pages / deployment
docs/assets/           素材来源、配方、清单
assets-source/         原始素材（不进 public）
```

调 UI 时主要碰的文件：

| 想改什么 | 改哪里 |
| --- | --- |
| 配色、阴影、选中样式 | `styles/global.css` 的 `--wk-*`（含 `--wk-selected-fill / --wk-selected-lift`）。**优先改令牌，不要在页面里写死颜色** |
| 按钮、胶带绿卡的外观 | `shared/ui/controls.module.css`（`ui.pill` + `ui.go / ui.outline / ui.back`、`ui.limeCard` + `ui.tape`），改一处四页同步 |
| 页面布局 | 各页 `XxxPage.module.css`（只放页面布局） |
| 某个组件的外观与响应式 | 同名 `components/Xxx.module.css`（例如五行选择在 `sound-birth/components/ShapeEditor.module.css`） |
| 屏幕档位（短屏、手机等） | `styles/breakpoints.ts` 一处定义；CSS 写 `@media(--short)`，不要写死像素（构建会检查） |
| 工作页标题行 + 向导动物 | `shared/ui/WorkIntro.module.css`；各页用 CSS 变量传入动物底色 / 大小 / 边距（声场、成曲、书架共用；声音诞生保留自己的） |
| 弹窗外观、主次按钮 | `shared/ui/WorkSheet.module.css`（所有工作页弹窗）、`Dialog.module.css`（首页弹窗） |
| 顶栏 | `shared/ui/FlowHeader.module.css`、`WorkHeaderActions.tsx` |
| 图标 | `shared/ui/PaperIcon.tsx`（`PaperIcon` 彩色纸片、`Glyph` 实心小图标）、`MoodFace.tsx`（心情脸）；作品书架仍用原版 `KidIcon.tsx` |
| 声音标记 | `shared/markers`（四张纸艺 PNG + 编号叠加），**不要烘焙文字进图** |
| 课本灵感弹窗 | `shared/inspiration/InspirationDialog.module.css` |
| 工作页背景 | 令牌 `--wk-page-bg`（声音诞生、万物声场、万物成曲）；作品书架用 `shared/scene/WorkBackdrop`（首页环境层，12% 透明度） |
| 文案 | 各页 `config/copy.ts`（心情 / 五项文案在 `shared/creation/moodCopy.ts`、`dimensionCopy.ts`） |

## 4. 用户已定的视觉规则（调风格时不能违反）

1. **配色**只用色卡 `#F7FFC5 奶油 · #FFD4D9 粉 · #FFE576 黄 · #C0E64F 草绿 · #9FE8FF 天蓝`（令牌 `--wk-cream/pink/yellow/lime/sky`）和声音标记的哑光纸色（灰绿、赭黄、灰蓝、浅紫）。**不要引入新的高饱和色**。草绿承载所有操作，黄色只表示“正在发声”，粉色表示录音 / 注意，天蓝、奶油作辅助。浅色上的文字和图标用深橄榄 `--wk-on-fill`。
2. **图标**：简洁、可爱、**实心**，不能是“线框 + 中间透明”；**图标本身换成色卡颜色，不加圆形底衬**；图标里的线条（指针、书页线、高光）保持白色，加很淡的下投影。心情脸用标记的哑光纸色，不要高光。（声音诞生页旧图标待用户同意再统一。）
3. **选中状态**：实心、有立体感的草绿（顶部高光、底部暗边、柔和投影），文字深橄榄；**不要“有色框 + 半透明填充”**（用户说很土气）。
4. **万物声场的行只用来错开**：上下没有任何含义，不标高 / 中 / 低；左右才是时间；页面可以换行但绝不改声音的时间位置。
5. 清爽、留白、纸艺材质，**工作页不能像首页那么花，也不能退回成人表格工具**；低年级使用，主要触控目标 ≥ 44 × 44 CSS px，不能只靠颜色区分。
6. 正文用清晰黑体；手绘标题只用于首页，不给工作页标题套手绘字。
7. 磨砂玻璃面板（“这首音乐有什么特征”）要保证文字清楚（约 92% 不透明白）。
8. 未接入的功能如实标注“未开放”，不做假保存、假上传、假 AI 成功。

## 5. 调 UI 时绝不能破坏的功能行为

- **一屏布局**：1440 × 900、1366 × 768、1280 × 720 下声音诞生、声场、成曲都不滚动；成曲右栏三张卡与左侧曲谱上下等高，无空地；成曲底栏三个按钮中心在同一条线上，保存在最右。
- **成曲一个播放时间**：曲谱竖线、进度条、时钟、发声高亮读同一个音频时钟；不要给任何一个加独立动画计时。
- **声场**：点选再放下、拖动、点摆好的声音即播放、虚线提示只在选中左栏声音时出现；工具条不挡放置区。
- **背景音乐**：始终存在，乐器只决定谁演奏，不选 = 原始背景，只有开关静音；乐器可多选 / 取消。
- **课本灵感弹窗**：示例曲整行点击试听、“用这个”才选择；教学音乐整行点击播放；弹窗里同一时间只响一个。
- **书架**：只列本次打开期间的作品，刷新清空，页面必须保留这句如实说明。
- 所有如实标注的文案（“示例”“未开放”“只在这台设备上，还没有上传”等）不能为了好看删掉。
- 手机（≤ 700 px）单独排布，320 px 无横向溢出；`prefers-reduced-motion` 下动画关闭。
- 弹窗焦点、Esc、键盘操作（方向键、Delete）、`aria-*` 标签不能因换样式丢失。

## 6. 每次改完怎么验证

```sh
cd /Users/hahaking/Projects/voice_atalas/wanwu-shengpu-v2
npm test           # 62 项，必须全过
npm run build      # typecheck + 资源检查 + 构建
```

- 开发服务器：`npm run dev`（127.0.0.1:5290）。如果 5290 被别的会话占着，`/Users/hahaking/Projects/voice_atalas/.claude/launch.json` 里有 `wanwu-v2-dev-5292`（5292 端口，`preview_start` 可启动）。
- 浏览器逐页检查：`/create`、`/world`、`/compose`、`/works`，尺寸 1440 × 900、1280 × 720、768、390、320；看有无滚动 / 横向溢出（`document.documentElement.scrollWidth`）。
- **只调样式、不改结构时的做法**：改前后用脚本量关键元素的位置 / 大小 / 字号（`getBoundingClientRect` + `getComputedStyle`），确认只有想改的地方变了；上次结构整理就是这样做 24 组对比的。
- 音频必须用**真实点击**触发（脚本里的 `click()` 不算用户手势，播放器会停在 0）。
- 声音和混音音色目前只做过数值测量，**没有用耳机 / 外放听过**；动到音频参数的改动要提醒用户试听。
- 未做真机、iOS 微信、低端安卓、真实弱网、多浏览器验收；无障碍只做了基本标签。这些仍要在文档里如实记录“未做”。

## 7. 已知可以顺手处理的 UI 点（需用户确认范围）

- 声音诞生页：2026-10-23 已按页面草稿改版（见 `sound-birth-acceptance.md`），待用户验收；页头仍不用共用的 `WorkIntro`。
- 手机上共用顶栏隐藏了“声音库 · 作品书架”，手机工作页没有固定的书架入口。
- 作品书架卡片不能删除 / 改名；空书架页可再加强。
- 几个页面里还有零散的硬编码颜色（如声场的 `#a5cf33` 系阴影、`#4f584a` 灰绿文字），可以逐步收进令牌。
- 各页 CSS 里相似的按钮 / 入场动画样式是复制的（有意没合并），风格统一时可以一起整理成共用类，但要先对比画面不变。

## 8. 仍然没做的（不属于本阶段，除非用户另说）

需要后端或模型：账号 / 登录 / 老师入口、保存到账号、分享与班级可见范围、班级 / 公共声音库、课本曲库与授权、“帮我找找”、心情“自己写”、教学音乐上传 + 后台分析 + 生成背景、正式乐器库。前端都已留好端口和预留 REST（各 `services/*.ts` 与 `shared/inspiration/*.ts` 文件头），均为 mock 或离线实现。声音库没有独立页面，只是声场里的弹窗。

## 9. 协作约定

- 先说明再动手；大改动先给用户确认；一次只推进用户指定的内容。
- 用户的记忆笔记（已存）：不要空心图标、行只错开、配色只用色卡和纸色（图标本身换色不加底衬）。
- 部署：Netlify 自动从 `main` 部署，线上站点 `https://voiceatalas.netlify.app/`；推送后要等重新部署才生效。
- 旧 demo `/Users/hahaking/Projects/voice_atalas/atalas` 和旧 `wanwu-shengpu` 不要动。

## 10. 新对话可直接粘贴

> 请先阅读 `/Users/hahaking/Projects/voice_atalas/wanwu-shengpu-v2/AGENTS.md` 和 `HANDOFF3.md`，再看 `docs/development/pages.md` 和要改的那一页的文档。现在功能已定，只调 UI 风格，必须保证功能和行为不变。先告诉我你打算怎么改、会动哪些文件，我确认后再做；改完跑 `npm test` 和 `npm run build`，用浏览器核对一屏布局和手机宽度，不提交、不推送，等我确认。
