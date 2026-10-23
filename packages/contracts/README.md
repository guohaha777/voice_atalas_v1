# 数据契约预留

正式前后端共用的类型、校验与版本信息。工作区包名 `@wanwu-v2/contracts`，按子路径引用，例如 `import {missingProvenance} from '@wanwu-v2/contracts/sound'`。源码直接是 TypeScript，由 Vite 和 Node 测试共同使用。入口弹窗的 typed callback 是 UI 导航意图，不属于这里。

开始真实音源 / 声卡 / 作品功能时，先在此定义并验证契约，再实现本地仓库和远程适配器。页面不得直接依赖数据库结构，也不得把前端权限提示当作服务端授权。

## 已定义

- `src/sound.ts`（`sound-v1`，2026-10-22，声音诞生页）：`SoundSource`（示例 / 本机录音 / 本机文件，带 `provenance`：记录人昵称、日期、大致地点、分组、许可链接；`missingProvenance` 判断能否溯源）、`SoundShape`（高低、长短、变化、轻响、出现方式，取值沿用旧版声卡）、`SoundUnitDraft` 及 `parseSoundUnitDraft` 校验。没有服务端实现；`local-*` 来源表示仅在本机、未上传。`SOUND_SOURCE_MAX_MS` 为 45 秒。以后接存储时按版本迁移，不改已有字段含义。`ShapeInput` 含 `example-preset`（示例声音的预设五项，不是孩子的选择）。2026-10-23 放宽：`SoundUnitDraft.shape` 为 `ChosenShape`（五项都可缺，缺的一项保持原声：原音高、原长度、原音量、只出现一次），`isChosenShape` 校验；尚无任何持久化数据，所以没有升版本号，接存储前如再改需按版本迁移。
- `src/arrangement.ts`（`arrangement-v1`，2026-10-22，万物声场）：`Arrangement`（作品里的声音单元快照、摆放事件、心情、`origin` 示例 / 孩子、`updatedAt`）、`PlacedEvent`（`at` 0–1 先后、`row` 行号只管排版，不存像素，行不改变声音）、`rows`（默认 3，最多 5）、`spanSeconds`（20 / 30 / 45，默认 30，孩子可切换）、`mood`（`MoodChoice`：7 种预设或连接模型后的自己写，原话保留）、每个事件的 `clip`（孩子节选的原声片段，毫秒，只是引用，不剪原件）、`eventsInOrder`、`parseArrangement` 校验（引用、重复 ID、编号唯一、范围、上限）。
- `src/work.ts`（`work-v1`，2026-10-23，万物成曲 / 作品书架）：`ComposeSettings`（背景层开关、乐器列表 `instruments`（只决定用什么乐器演奏生成的背景曲；`[]` = 原始生成的背景声，最多 6 个；只有开关能让背景静音）、音量；课本灵感 `none | textbook | teaching-music`，只借节奏和气质给背景，教学音乐由后台分析后生成背景）、`Visibility`（个人 / 班级 / 学校 / 地区 / 公开，只由服务端决定和执行）、`SavedWork`（ID 与摆放 ID 相同、名字最多 16 字、摆放快照、设置、可见范围、保存时间）、`parseComposeSettings`、`parseSavedWork`、`cleanWorkTitle`。曲谱不存储，总是从摆放派生。
