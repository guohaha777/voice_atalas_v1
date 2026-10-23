# 模块与后续接入边界

## 当前选择

一套响应式 H5，React + TypeScript + Vite。此阶段不需要服务端渲染、数据库或模型调用；构建产物可作为静态站点部署。依赖精确锁定在 `package-lock.json`，不引用旧工程的依赖目录。

首页组件只接收用户操作回调。动画控制器只管理自己的空前景容器；场景图片、导航、文案由 React 管理。页面卸载、切后台、跳过和减少动态都会清理动作与音频，避免切页后继续播放。音频必须由用户点击触发，同一时刻一个声音。

## 已建立的边界

| 层 | 负责 | 后续扩展方式 |
| --- | --- | --- |
| app | 页面入口、无依赖的 history 路由（`router.ts`）、主流程四步与入口类型（`navigation.ts`）、全局错误反馈 | 新页面验收后在 `navigation.ts` 打开对应入口，并在路由里加一条 |
| pages/<页面> | 页面布局、页面内组件与流程状态 | 每个页面独立验收，避免在首页追加全流程 |
| config | 图片、坐标、透明度、动画参数 | 视觉调整不改播放与开场状态逻辑 |
| shared/ui、media、audio、markers、scene、creation、inspiration、platform | 基础组件与图标（含工作页弹窗 `WorkSheet`、顶栏入口 `WorkHeaderActions`、工作页标题行 + 向导 `WorkIntro`、心情脸 `MoodFace`）、资源加载、声音录放 / 塑形 / 排程（工作页统一 `SequencePlayer`）、声音标记、首页场景素材与工作页背景、当前作品 / 书架 / 本机来源档案 / 示例声音与示例作品 / 时间与行 / 五项与心情文案 / 本地 ID、课本灵感、设备提示 | 后续页面按需复用；页面之间不互相引用内部实现；两页以上用到的东西放这里，只保留一份 |
| packages/contracts（`@wanwu-v2/contracts`） | 前后端共同的数据契约；已有 `sound-v1`、`arrangement-v1`、`work-v1` | 以包名引用，新增领域先写类型和校验，再加存储 |
| 后端（未开发） | 身份、音源与作品、文件存储、AI 网关 | 接在仓库 / 服务端口之后，页面不直接访问云资源 |

没有为了预留而实现假的服务器、数据库、账号或空 API。当前首页只使用本站静态资源，不收集个人信息，不向模型发送内容。

## 首页进入声音诞生与弹窗基础层

- 首页“开始成曲”直接跳转 `/create`（2026-10-23 删除了开始方式弹窗与 `?from=` 入口参数；录音、上传、声音库、拍照读声卡都在声音诞生页上选）。首页空闲约 3 秒后预取声音诞生页代码。
- `shared/ui/Dialog.tsx` 复用原生 modal 的焦点约束、Esc 与背景关闭，管理滚动锁和关闭后的焦点恢复；`NoticeDialog`（首页未开放入口）与工作页的 `WorkSheet` 复用该基础层。打开弹窗时暂停首页试听与当前角色动作，不在关闭后自动续播。

## 声音诞生页

- 路由 `/create`，代码单独分包，弹窗打开时预取。`pages/sound-birth/` 分为 `components/`（声音条、我的声卡、声卡信息、五行选择、录音 / 声音库 / 纸卡对话框）、`model/`（纯 reducer `soundBirthState.ts` + 编排 hook `useSoundBirth.ts`）、`config/`（文案、示例声音条目、向导动物、提示文案）、`services/`（声音库分组、向导提示端口）。五项文案、本机来源档案、背景层、弹窗面板和顶栏入口都在 shared，与万物声场共用。
- 数据走 `@wanwu-v2/contracts/sound`：来源与溯源信息、五项、交给声场的 `SoundUnitDraft`。原声只读，塑形在浏览器离线渲染（`shared/audio/`）。本机来源档案和示例声音清单在 `shared/creation/`，与万物声场共用。
- 向导提示走 `services/soundHints.ts` 的 `SoundHintProvider` 接口，当前是本地预设文案；接模型时实现同一接口即可。
- 首页场景的素材清单放在 `shared/scene/`（`homeScene.ts` + 生成的 JSON），首页、弹窗和声音诞生页都通过它取同一批已缓存的文件。
- 图标分两套：首页和弹窗用细线 `shared/ui/Icon.tsx`；工作页用圆润童趣的 `shared/ui/KidIcon.tsx`。工作页配色令牌是 `styles/global.css` 里的 `--wk-*`。

## 万物声场页

- 路由 `/world`，代码单独分包，在声音诞生页时预取。声音诞生“做好了”经 `App` 把 `SoundUnitDraft` + 来源交给 `shared/creation/workSession.ts`（本次打开期间的当前作品），再打开本页；标记编号由作品分配。
- `pages/sound-world/` 分为 `components/`（左栏声音、声场、浮动工具、心情、找更多声音）、`model/`（纯 reducer `soundWorldState.ts`、几何换算 `fieldGeometry.ts`、拖动 `useFieldDrag.ts`、编排 hook `useSoundWorld.ts`）、`config/`（文案、mock 示例单元与示例摆放、青蛙向导）、`services/`（`SoundWorldRepository` 端口 + mock 实现，文件头列出预留 REST 路径）。
- 数据走 `@wanwu-v2/contracts/arrangement`：事件只存 0–1 先后位置与行号（行只管错开摆放，不改变声音；默认 3 行可加到 5 行），不存像素；声音身份 `unitId` 与事件身份分开。整段试听用 `shared/audio/SequencePlayer.ts` 在同一音频时钟上排程，游标、高亮读同一时间，万物成曲可复用。
- 详见 `docs/development/sound-world-acceptance.md`。

## 万物成曲页与作品书架

- 路由 `/compose`（在声场时预取）和 `/works`（在成曲时预取），各自分包。`pages/compose/` 分为 `components/`（曲谱卡、播放条、右栏三卡、底栏与特征面板、弹窗）、`model/`（纯 reducer `composeState.ts`、曲谱派生 `scoreLayout.ts`、音乐特征 `discoveries.ts`、背景曲与演奏 `backgroundSynth.ts`、编排 hook `useCompose.ts`）、`config/`（文案、特征讲解文案、松鼠向导、示例乐器与心情节奏）、`services/`（`ComposeRepository`、`BackgroundLibrary` 两个端口 + mock，文件头列出预留 REST 路径）。`pages/works/` 同样分层，端口 `ShelfRepository`。
- 课本灵感是共用模块 `shared/inspiration/`（示例节奏目录端口 `InspirationCatalog`、试听合成、教学音乐本机选择与后端流程说明、`InspirationDialog`），万物声场摆放前就能选，万物成曲沿用同一个选择。
- 曲谱只从 `arrangement-v1` 派生，不存储。声场与成曲共用 `shared/creation/arrangementTiming.ts`（开始秒、听到的长度、整首长度、行整理、切换长度）、`exampleWork.ts`（示例单元与示例摆放）、`workSounds.ts`（音源加载与塑形缓存）。
- 播放只有一个时间：`shared/audio/SequencePlayer` 支持从任意秒开始、整首长度和分层音量；竖线、进度条、时钟、高亮都读它。背景是独立的 `background` 层。
- 背景音乐本身总是存在（今天代码生成，以后后台生成），乐器只决定由谁演奏，不选 = 原始背景；只有开关让背景静音。
- 作品契约 `@wanwu-v2/contracts/work`（`work-v1`）。当前作品设置存在 `workSession`，书架是 `shared/creation/workShelf.ts`（本次打开期间，内存）。详见 `compose-acceptance.md`、`works-acceptance.md`。

## 合并与不合并（2026-10-23 结构整理）

- 合并：万物声场、万物成曲、作品书架的标题行 + 向导（`shared/ui/WorkIntro`，各页颜色和尺寸用 CSS 变量传入）；心情文案与“取预设心情”（`shared/creation/moodCopy`）；示例声音加载超时（`shared/creation/exampleSounds` 的 `EXAMPLE_TIMEOUT_MS`）。整理前后 24 组页面 × 尺寸测量完全一致。
- 不合并：声音诞生（已验收）的标题行——尺寸、断点、动画不同，且矮屏下会把向导气泡一起隐藏，强行合并会改画面；各页的时间格式小函数（含义不同）、按钮与入场动画样式（只是相似）。

## 产品原则与字段预留方向

后续音源、声卡、作品的数据模型应保留稳定 ID、来源与贡献记录、原件引用、可见范围、所属个人 / 班级 / 学校 / 地域、创建和更新时间、数据版本。作品还需保存编排、孩子确认的参数、背景层来源与版本、音乐发现和可选课本映射。此处是接入约束，不是已经建表。

可见范围：个人、班级、学校、地域、公开。前端组件问权限端口，不在页面中散写角色判断；真实访问控制和查询过滤由服务端完成。后续保留授权 / 同意版本、审核状态、删除状态等扩展位置，具体规则需到该阶段确认。

账号方式在参考文件中存在不同设想（微信、手机号等），此阶段不替用户决定。原始录音不覆盖、默认不过度公开、不收真实儿童姓名 / 人脸 / 精确地点的方向保留。离线数据与待同步队列在功能阶段设计，当前没有宣称支持 PWA 或离线业务。

## 需求优先顺序

用户当前约定 > 最新确认首页 > `docs/product/` 两份文件。指南中的“沿用现有视觉”、十天排期、旧 Next.js 目录和已有库路径属于旧工程背景，不约束本次独立 React 工程。指南与使用流程存在缓存 / PWA 口径差异，后续功能设计前明确，不在首页迁移时悄悄实现。

## 手绘标题资源与动画边界

`HandwrittenTitle` 负责组合字形及后方装饰，`TitleSprite` 只渲染透明图集。位置、角度、尺寸比例和时序集中在 `config/title.ts`。`titleMotionState.ts` 决定 waiting / entering / settled / fallback 状态，`useTitleMotion.ts` 负责入场计时、轻量策略及页面可见性；文字完成入场后没有持续动画，循环只作用于装饰。

`shared/media/useDecodedImage.ts` 单独处理响应式资源、解码、兼容回退、超时与取消；文字不等待装饰资源。加载时不逐帧请求资源，不在网页里提取轮廓或处理像素。图集与 SVG 泡泡由独立构建脚本生成，有原件、配方、来源和哈希记录。整个标题资源组合各规格不得超过 120 KiB。
