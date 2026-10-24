# 万物声谱 · 工程前端开发交接 4（成曲规则阶段）

更新：2026-10-24。正式工程：`/Users/hahaking/Projects/voice_atalas/wanwu-shengpu-v2`，仓库 `https://github.com/guohaha777/voice_atalas_v1`，分支 `main`。本轮已在本地提交，**未推送**（推送会触发 Netlify 更新线上，需用户明确同意）。

**本文件取代 `HANDOFF3.md`。** 先读根目录 `AGENTS.md`，再读本文件；改规则先读 `packages/sound-rules/README.md`。用户当前指令优先，回复一律用中文。

## 1. 这一阶段做什么

用户使用逻辑和功能已定。现在按页面逐个完善**成曲规则和功能细节**，最后生成**和后端交接的接口协议**。仍然只做前端加 mock 数据；mock 数据最终要收进单独文件夹，方便一键清理（见第 6 节）。

工作方式：用户从页面看问题 → 先说明分析和方案 → 用户确认后再改 → 改完跑 `npm test`、`npm run build`，并在浏览器里核对。始终结构化开发：公共素材和规则只留一份，页面不写规则数值，方便后期升级、调整和接入新功能。

页面进度：**声音诞生的规则已完成（本轮）**；接下来是**万物声场**、**万物成曲**两个板块。

## 2. 本轮完成的内容

### 2.1 声音规则独立成包 `packages/sound-rules`（`@wanwu-v2/sound-rules`）
- **数值**在 `rules/analysis.v2.json`（声音体检）和 `rules/shaping.v3.json`（五个维度）。**音乐角色只改这两个文件。**
- **范围与关系校验**在 `src/schema.ts` 和 `src/rules.ts`：填错会在 `npm test` / `npm run build` 时报中文错误，并指出是哪个参数。
- **算法**是纯函数：`src/analysis.ts`（体检）、`src/arrange.ts`（长短与出现方式的时间线）、`src/shaping.ts`（塑形计划，以及 `unchangedBy` 判断“没变化”）。前端预览和以后的后端渲染读同一份规则。
- **网页侧**只负责执行塑形计划，不带任何数值：`apps/web/src/shared/audio/renderShaped.ts`（渲染）、`grains.ts`（颗粒式变调 / 拉伸，音高和长短互不影响）、`soundAnalysis.ts`（按缓冲区缓存体检结果）、`peaks.ts`（画波形）。
- **说明书**：`packages/sound-rules/README.md`，给音乐角色看，包括每个参数的含义、出了问题该查哪个参数、版本规则和调音台规则。

### 2.2 已定的五维度规则（用户 2026-10-24 确认）
- 纸卡前四问（高低、长短、变化、轻响）是**描述**孩子听到的样子，所以往描述的样子靠，**已在那一档就不动**；第五问（出现方式）是孩子的**意愿**，照做。
- **先体检**：找出单个声音（先按静音分段，较长的段再在音量低谷处细分），分三类：**单个声音 / 一串声音 / 连成一片**；再测一声的典型长度、响度和高低档。
- **长短 = 一声有多长（时值）**：
  - 单个声音和一串声音：每一声拉长或缩短，不剪；每一声保持原来的时刻（不改节奏），只有拉长后撞上下一声时才往后让。
  - 连成一片的声音：整体放慢或加快。
- **出现方式 = 这些声音怎么排**：
  - 重复 = 最响的一声按固定节拍出现；一阵一阵 = 声音自己的几声一组；慢慢出现 = 一声比一声响。
  - 连成一片的声音：涌来退去、像阵风一样起落。
- **变化**：在每一声里发生（连成一片的声音在整段上变化，配合远近）。
- **轻响**：先统一响度，再分三档，并配合起音快慢和明暗。
- **不在一声的中间一刀切**：只在两声之间切；不得不缩短时用较长的渐弱。
- **选了却没变化时告诉孩子**：向导小鸟会说“它本来就是「…」，所以听起来没怎么变”；稳稳的、刚刚好响、出现一次会说明是保持原样。
- **高低只变调，不变长短。**
- **8 段示例的分类**：
  - 单个声音：牛叫
  - 一串声音：蛙鸣、滴水、苹果落地
  - 连成一片：鸟鸣、蝉鸣、风吹树叶、自行车
  - 详表见规则包 README。

### 2.3 数据契约（`packages/contracts/src/sound.ts`）
- 新增 `SoundAnalysis`（`units` 单个声音、`kind: one | series | texture`、`unitMs` / `lengthBand` 一声的长度、`band` 高低、`rules` 体检规则版本）和校验函数 `isSoundAnalysis`。
- `SoundUnitDraft.analysis` 为可选字段：声音单元带着自己的体检结果，所以声场尾条、成曲曲谱和实际渲染的时长一定一致，后端只凭作品数据也能算出时长。尚无持久化数据，所以没有升契约版本。

### 2.4 声音库：整段原件，不替用户截取
- 示例声音从 5 段增加到 8 段（新增牛叫、苹果落地、自行车，授权见 `docs/assets/legacy-audio-authorization.md`），全部是**整段原始录音只转格式**（单声道 MP3），不截取、不淡入淡出、不改响度。
- 清单在 `docs/assets/library-recipe.json`。运行 `npm run assets:library`（需要本机有 ffmpeg）会生成公开文件、`apps/web/src/shared/creation/library-sounds.generated.json`（含每段的体检结果）和 `docs/assets/library-release-manifest.json`（含原件哈希）。
- **新增一段声音不用改代码**：放原件 → 在清单里加一条 → 运行上面的命令 → 补来源记录。
- `check:assets` 会核对原件、哈希，以及体检规则版本是否一致。
- **超过 45 秒的示例**（鸟鸣约 59 秒）：从声音库选它时弹出和上传长文件相同的选段框，由孩子选一段；选出的一段仍是示例声音，id 带区间（如 `example:bird#8000-53000`）。
- 首页角色点击用的短片段（`media/sounds/home/`）**保持不变**，和声音库互不影响。
- 声音来源上限按这一版定为 **45 秒**（公测说明里的 30 秒已被取代）。

### 2.5 其他
- 声场里新放下的声音，默认用去掉前后静音的整段（最长 45 秒），由孩子剪一剪；剪一剪对超过 45 秒的声源只提供前 45 秒。
- 声音诞生选满五项时的欢呼星星改画在覆盖整页的最上层，不再被向导气泡和面板挡住（`shared/markers/SoundSpirit` 的 `burst` 层）。
- 文档已同步：`docs/development/architecture.md`、`sound-birth-acceptance.md`、`sound-world-acceptance.md`、`docs/assets/SOURCES.md`、公开的 `legal/sound-sources.html`、根目录 `README.md`、`packages/contracts/README.md`。

## 3. 没做、但已定规则的事（下次可直接做）

1. **调音台**：完整规则写在 `packages/sound-rules/README.md` 的“调音台”一节。要点：
   - 只在开发 / 预览环境出现，正式站不打包；
   - 用的是正式的 `planCard` / `planClip` / `renderShaped`，换上正在调的规则对象；
   - 每个参数一个滑块，范围取自 `schema.ts`；
   - 导出前先校验，导出的 JSON 放进 `rules/` 就生效；
   - 配一套 15–20 段的测试声音集作为回归集（原件放 `assets-source/audio/test-set/`，清单放 `docs/assets/test-set.json`）；
   - 它用来定通用规则，不是给每段声音单独调，用户接触不到。
2. **没录到声音的提示**：体检判为 `silent` 时，声音诞生页提示“这段好像没录到声音，可以重录”。现在不会提示。
3. **耳机 / 外放实听**：五个维度的数值只做过数值测量和渲染检查（72 种组合时长一致、峰值 ≤ 0.63、无坏数据），还没人听过。需要用户或音乐角色试听后调参数。

## 4. 下两个板块：已列出、待逐条确认的成曲规则

编号沿用本轮开头列的 15 条。✅ 表示本轮已解决。

**万物声场**
- ✅ 1 长短在声场里不起作用 → 现在是“每一声的时值”，在声场照样生效。
- ✅ 3 重复太长 → 重复的是最响的那一声，连成一片的声音用涌来退去。
- 4 声音要不要和背景节拍对齐：我建议**自由摆放**（切换 20 / 30 / 45 秒时位置会等比缩放，节拍格会乱；只在播放时对齐会让竖线和声音对不上）。待用户确认。
- 5 超过所选长度时整首延长（现状）还是截断：建议延长。待确认。

**万物成曲**（核心是背景层，代码在 `pages/compose/model/backgroundSynth.ts`、`config/backgrounds.ts`、`model/useBackgroundMusic.ts`）
- 6 心情只改速度，悲伤也是大调 → 建议心情同时决定调式、和弦进行、音区和疏密，写成一张配置表。
- 7 固定旋律一直响，和孩子的声音抢 → 建议旋律只在孩子的声音停下来的空档出现，形成一问一答。
- 8 结尾 → 建议最后一个声音结束后，在下一个小节落到主和弦收尾。
- 9 孩子的声音响起时背景让一让（按时间线压低约 4 dB）。
- 10 选多件乐器时分工（风琴负责和弦和低音，木琴负责旋律，小鼓负责节奏）。
- 11 课本只给速度和拍子，心情决定调式和色彩。
- ✅ 12 录音响度统一 → 已放进塑形规则。
- 13 总线限幅，防止叠加后爆音（建议做，放在 `sound-rules` 的 `mix` 规则里）。
- 14 音乐小发现：阈值暂不动，背景规则定下来后补新特征（如“背景接话”）。
- 15 规则集中、版本化，以及最终音频由谁产出：规则包和版本文件已经有了。**还没做**：作品里记录所用规则版本（`rules:{analysis, shaping, background}`），以及“浏览器只做预览，分享和书架的正式音频由后端按同一规则混音”的约定，写进接口协议。

建议背景规则也照声音规则的做法：数值放进 `packages/sound-rules/rules/background.v1.json` 和 `mix.v1.json`，算法写成纯函数，页面不写数值。

## 5. 结构速查

```
packages/contracts/      数据契约：sound-v1（含 SoundAnalysis）、arrangement-v1、work-v1
packages/sound-rules/    声音规则：rules/*.json（只改这里）、src/（纯函数）、tests/、README（说明书）
apps/web/src/shared/audio/       渲染（renderShaped、grains）、体检缓存（soundAnalysis）、播放器 SequencePlayer
apps/web/src/shared/creation/    exampleSounds（读声音库清单）、exampleWork（示例单元与示例摆放）、arrangementTiming（时长与行）、workSounds（音源与渲染缓存）
docs/assets/library-recipe.json  声音库清单 → npm run assets:library
scripts/build-library-audio.mjs  声音库生成脚本；scripts/check-assets.mjs 资源核对
```

## 6. 仍未开始、用户已提过的要求

- **mock 数据收进单独文件夹，方便一键清理**。现状：mock 实现散在各页 `services/*.ts`（端口和 mock 在同一个文件里），页面 hook 用默认参数注入 mock。建议：新建 `apps/web/src/mocks/` 加一个组合入口，统一决定用 mock 还是真实实现；`services/` 只留端口定义。注意：声音库示例声音是给访客免登录体验的**真实内容**，不算 mock。
- **接口协议**：最后一步，从 `packages/contracts` 和各 `services/*.ts` 文件头里的预留接口生成一份交接文档。

## 7. 验证方式

```sh
cd /Users/hahaking/Projects/voice_atalas/wanwu-shengpu-v2
npm test                # 86 项（应用 67 + 规则包 19），必须全过
npm run build           # 类型检查 + 资源检查（含声音库与体检规则版本）+ 样式结构检查 + 构建
npm run assets:library  # 只在增改声音库原件或改了体检规则后运行（需要 ffmpeg）
```

- 开发服务器 `npm run dev`（127.0.0.1:5290）。
- 音频必须用真实点击触发。
- 渲染可以在浏览器控制台里用 `import('/src/shared/audio/renderShaped.ts')` 加规则包的 `planCard` 批量检查时长和峰值。
- 真机、iOS 微信、低端安卓、弱网、多浏览器都还没验收。

## 8. 新对话可直接粘贴

> 请先阅读 `/Users/hahaking/Projects/voice_atalas/wanwu-shengpu-v2/AGENTS.md` 和 `HANDOFF4.md`，涉及声音规则再读 `packages/sound-rules/README.md`。我们在按页面完善成曲规则，声音诞生已完成，现在继续万物声场和万物成曲（HANDOFF4 第 4 节的待定点）。始终用中文回复。先说明分析和方案，我确认后再改；改完跑 `npm test` 和 `npm run build`，用浏览器核对；只做前端加 mock，不提交、不推送，等我说。
