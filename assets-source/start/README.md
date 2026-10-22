# 首页入口弹窗 · 透明源素材

以本轮用户重新指定的原 A 版为准：`万物声谱_视觉过程稿/定稿页面参考/2026-10-22-四步流程/01-home-start-dialog.png`。

| 文件 | 内容 | 组合边界 |
| --- | --- | --- |
| `illustrations/start-card.png` | 松鼠、声卡、石头与植物底座 | 整组等比缩放，保留动物和支撑物接触关系 |
| `illustrations/start-upload.png` | 水滴、信封、录音设备与植物底座 | 整组等比缩放；不拆成漂浮角色 |
| `illustrations/start-library.png` | 小鸟、自然书册、植物底座与音符 | 整组等比缩放；鸟脚落在书册上 |
| `environment/corner-pond-left.png` | 弹窗左下较稀疏的池塘、石头和草叶 | 左下边缘装饰，随面板裁切，不作为居中贴纸 |
| `environment/corner-fern-right.png` | 弹窗右下浅色蕨类和草叶 | 右下边缘装饰，视觉比左下轻 |
| `title/start-heading.png` | 黑色手绘“这一次，想从哪里开始？”与邻近小叶 | 静态标题组；后续需同时保留可访问的真实标题文本 |

左上枝叶直接复用 `../home/environment/env-upper-left.png`，不重复复制或改写旧原件。弹窗外的淡化首页场景也复用现有首页资源。

原稿没有可直接导出的分层，以上为内置 imagegen 按参考进行透明分离 / 边缘补全的源素材，**不是逐像素无损抠图**。均有真实 RGBA 透明通道；几何、表情和局部纹理可能与整页原稿存在小幅差异。生成提示词、原始路径、尺寸和 SHA-256 见 `../../docs/assets/approved-ui-assets-manifest.json`。

这些是高分辨率源 PNG，尚未接入页面，也不应直接放到 public。下一步实现时再制作手机 / 桌面压缩衍生图并更新公开清单。当前不增加入场或角色独立动画；若以后需要拆分动作层，再从已归档原件派生，不能裁断支撑关系。
