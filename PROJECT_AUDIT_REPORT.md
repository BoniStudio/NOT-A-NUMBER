## 1. 项目文件结构

当前项目主目录包含 4 个核心文件（无 `assets/` 目录）：

- `index.html`
  - 作用：页面骨架。包含 `Landing`、`Main Scene`、`toggle`、人物区、气泡层、ending 弹层、底部计数器。
- `style.css`
  - 作用：全站样式系统。包含主题变量、布局、动画、响应式、`prefers-reduced-motion`。
- `script.js`
  - 作用：状态管理与交互逻辑。处理 mode 切换、点击计数、人物 SVG 状态、气泡渲染/回收、ending 触发。
- `README.md`
  - 作用：项目说明、运行方式、部署流程、概念阐述。

结论：这是纯静态 HTML/CSS/JS 项目，结构适合 GitHub Pages。

---

## 2. 页面整体结构（`index.html`）

页面由 `body[data-stage][data-mode]` 驱动，包含两大阶段：

### Landing page

- 区域：`#landing.landing`
- 关键元素：
  - `landing__title`
  - `landing__subtitle`
  - `#enterBtn.enter`
  - `landing__hint`

### Main scene

- 区域：`#scene.scene`

#### Top bar
- `header.topbar`
- 模式切换：`.toggle` + `.toggle__btn[data-mode="numbers|peace"]`
- reset：`#resetBtn.topbar__reset`

#### Character area / bubbles / noise
- 舞台：`section.stage`
- 噪音层：`#noiseLayer.noise`
- 气泡层：`#bubbles.bubbles`
- 人物：`figure.figure`
  - SVG 注入位：`#figure.figure__body`
  - 思维文本：`#figureThought.figure__thought`

#### Ending text
- 弹层：`#ending.ending`
- 文案：`.ending__line`
- 关闭：`#endingClose`

#### Footer / counter / hint
- `footer.bottombar`
- 计数：`#meterLabel`、`#meterValue`、`#meterMax`
- 提示：`#bottomHint`

另外有装饰光标：`#cursorDot.cursor-dot`。

---

## 3. CSS 结构分析（`style.css`）

### 全局变量

- `:root` 定义完整 token：颜色、字体、动效、间距（如 `--bg`、`--ink`、`--mode-transition`、`--bubble-speed`）。
- `body[data-mode="peace"]` 覆盖 Peace 主题变量。

### 页面布局

- `landing` 与 `scene` 都是全屏固定层。
- `scene` 用三行 grid：顶部、中间舞台、底部栏。
- `figure` 绝对居中；`noise` / `bubbles` 为叠加层。

### Numbers Mode 样式

- 关键选择器：
  - `body[data-mode="numbers"] ...`
  - `body[data-mode="numbers"][data-intensity="2|3|4"] ...`
- 点击递进后背景更冷、grain 更重、bubble 更硬。
- 食物气泡两层结构：
  - `.bubble.food-bubble`
  - `.bubble__label`
  - `.bubble__meta`
  - `.is-numberized`

### Peace Mode 样式

- 暖色系、慢节奏、柔和阴影。
- `figure__glow` + `@keyframes breathe` 做呼吸感。
- `.noise__word` 在 peace 下走 `breath-word` 动画。

### Character 样式

- 容器：`.figure` / `.figure__body` / `.figure__thought`
- Numbers 高强度抖动：`@keyframes tremor`

### Bubble 样式

- 双层结构：
  - `.bubble-slot`（定位）
  - `.bubble`（动画与交互）
- 状态类：`.is-in`、`.is-popped`、`.food-bubble`、`.is-numberized`

### Animation / keyframes

- `drift-a`, `drift-b`, `grain-shift`
- `fade-in`, `rise-in`, `strike`
- `float`, `streak`, `breath-word`, `breathe`, `tremor`

### Responsive media query

- `@media (max-width: 820px)`
- `@media (max-width: 520px)`

### prefers-reduced-motion

- `@media (prefers-reduced-motion: reduce)` 中统一弱化动画并隐藏 grain。

### 过于“AI 工程化”的 class/注释

- 注释分区格式高度统一：`/* ---------- xxx ---------- */`
- 长注释解释“设计意图”（如 Numbers 冷化、food bubble 心理映射），叙述完整度很高。
- 结构命名很“体系化”（如 `.bubble-slot` + `.bubble` 的职责分离），不像一般学生作业的自然演进代码。

---

## 4. JS 逻辑分析（`script.js`）

### 当前状态变量

- `STATE.stage`：`landing | scene`
- `STATE.mode`：`numbers | peace`
- `STATE.clicks`：`{ numbers, peace }`
- `STATE.reachedEnding`：`{ numbers, peace }`
- `STATE.bubbleCursor`：`{ numbers, peace }`

其他关键常量：
- `NUMBERS_MAX = 10`
- `PEACE_MAX = 8`

### mode 如何切换

- `setMode(mode)`：
  - 更新 `STATE.mode`
  - 写入 `body.dataset.mode`
  - `hideEnding()`
  - `renderAll()`

### bubbles 如何渲染

- `renderBubbles()` 初始铺环形气泡（小屏 6，大屏最多 8）。
- `buildBubbleNode()` 构建按钮节点（Numbers 食物是双层 label/meta）。
- `tapBubble()` 点击后只替换被点中的 slot，不全量重绘。
- `numberizeExistingBubbles()` 在阈值后给食物 bubble 打 `.is-numberized`。

### click counter 如何工作

- 每次点击：`STATE.clicks[mode] += 1`
- 阶段映射：
  - `numbersStageFromClicks()`
  - `peaceStageFromClicks()`
- 强度映射：`renderIntensity()` -> `body[data-intensity]`

### character 状态如何变化

- SVG 状态常量：
  - Numbers：`FIG_N0` 到 `FIG_N5`
  - Peace：`FIG_P0` 到 `FIG_P4`
- `renderFigure()` 根据 `mode + clicks` 选择对应 SVG。

### ending 文案如何出现

- `checkEnding()` 到阈值后触发 `showEnding(mode)`。
- Numbers ending：`Smaller body.` / `<em>Louder</em> mind.`
- Peace ending：四行完整文案。

### reset 如何工作

- `resetAll()`：
  - 两模式点击清零
  - `reachedEnding` 重置
  - `hideEnding()`
  - `renderAll()`

### 过于“AI 生成感”的函数/变量/结构

- 头部“架构说明”注释（`STATE / RENDER / INTENT`）过于完整。
- 分区结构标准化：`DATA`、`STATE`、`DOM LOOKUPS`、`INTENTS`、`RENDER`、`WIRING`、`INIT`。
- 函数拆分非常专业：`renderAll`、`renderIntensity`、`spawnNumbersNoise`、`ambientTick` 等职责清晰且细分。
- 变量命名高度语义化：`reachedEnding`、`bubbleCursor`、`NUMBERS_NOISE_TIERS`。

---

## 5. AI 痕迹检查（按文件）

### `index.html`

- 痕迹点：
  - 区块注释过于整齐（`LANDING`/`MAIN SCENE` 分隔）。
  - `aria-*` 与 `role` 覆盖很全（`tablist`、`aria-live`、`aria-hidden`）。
  - meta 配置完整（OG + cache 控制 + fonts preconnect）。
- 原因：
  - 更像“可发布作品模板”，而不是常见课堂作业 HTML。

### `style.css`

- 痕迹点：
  - 注释高度模板化且章节清晰。
  - token 系统完整、变量抽象层次高。
  - 使用 `color-mix`、多层动效、细粒度 mode/intensity 控制。
- 原因：
  - 工程成熟度较高，容易显得“不是第一次写前端作业”。

### `script.js`

- 痕迹点：
  - 顶部大段架构注释像技术文档。
  - 函数/状态拆分非常规范，命名统一而专业。
  - “why 型注释”很多（不只是解释做什么，还解释设计理由）。
- 原因：
  - 结构像中小型产品代码，而非普通学生单文件脚本。

### `README.md`

- 痕迹点：
  - 章节齐全（preview、deploy、accessibility、tech notes、license）。
  - 叙述语气偏产品文档和作品展示页。
  - 用词专业，像对外开源项目说明。
- 原因：
  - 对学校小作业来说“完成度过高、包装感偏强”。

---

## 6. 学生化修改建议（暂不执行）

目标：不降低功能质量，只降低“工业化/AI痕迹”。

- 注释减少到必要程度
  - 删除长段“设计理念”注释，保留关键逻辑说明即可。
- README 改为课程作业口吻
  - 改成：项目目标、实现内容、运行方法、遇到问题、反思。
- 函数名更朴素
  - 如 `reachedEnding` -> `ended`，`bubbleCursor` -> `nextIdx`。
- CSS section 注释降密度
  - 不必每段都用统一分隔线。
- 弱化过度专业语气
  - README 中减少 “production-like” 叙述，保留核心部署步骤。
- 保留核心交互与视觉
  - mode 切换、人物 progression、bubble 点击逻辑、ending 文案不动。
- 不破坏 GitHub Pages
  - 保持相对路径与静态结构，不引入构建链。

---

## 7. 后续修改计划

### Phase 1
只清理注释和 README 的 AI 痕迹。

- 精简 `script.js`、`style.css` 的工程化大注释。
- 改 `README.md` 为课程提交版文档。
- 不改功能逻辑。

### Phase 2
调整变量名、函数名、CSS section 命名，让代码更像学生项目。

- 选择少量关键命名做“朴素化”替换。
- 保持行为与视觉不变。

### Phase 3
检查网页功能是否仍然正常。

- Landing -> Scene 流程
- Numbers/Peace 独立计数
- bubble 点击与 numberize 阈值
- noise 强度递进
- ending 与 reset
- 响应式与 `prefers-reduced-motion`

---

## 总结

当前项目质量很高，交互叙事和工程结构都完整；若目标是“更像学生独立完成的小作业”，主要调整应集中在**文本层风格（注释/README/命名语气）**，而非功能层重写。
