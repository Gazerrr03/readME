# Portfolio OS 蓝调流体 Shader 背景设计规格

> 状态：待用户审阅
> 日期：2026-08-17
> 范围：桌面背景层重构，不包含系统壳层、应用窗口或 Pen Pen 视觉重做

## 1. 背景与问题

当前桌面背景经历过 blueprint、ASCII、像素水族馆和像素云层等多次替换。虽然每一张图片都能独立成立，但它们仍然承担了过多视觉内容，导致背景和桌面系统争夺注意力。

用户希望最终桌面接近一套克制的个人操作系统界面：系统栏、窗口、应用入口和 Pen Pen 是主角；背景只提供蓝调色系、材质和缓慢的时间感。

当前实现的背景是由 `assets/background/` 中的 PNG/GIF 通过一个 `<img>` 元素加载。`design.md` 目前也把“图片 / GIF”定义为默认背景，并明确排除了运行时 Canvas 扰动和鼠标水波。本次设计将有边界地扩展这一约束：允许一个不承载业务信息的 WebGL shader 背景，但不恢复 ASCII 字符矩阵、鼠标水波或高频粒子效果。

## 2. 目标

### 2.1 产品目标

把背景从“有明确主体的壁纸”改造成“低对比的蓝色动态介质”，让桌面更接近一套成套的 OS 界面：

1. 背景不再提供具体场景、角色或叙事主体。
2. 背景提供蓝调、纸张/半色调质感和轻微时间感。
3. 系统对象、窗口和 Pen Pen 在所有状态下保持优先级。
4. macOS 与 Windows 共享同一背景语义和渲染器。
5. 动画在正常桌面上存在，但在窗口聚焦、移动设备和减少动态设置下主动退让。

### 2.2 技术目标

1. 将背景实现从单一图片加载扩展为可替换的背景渲染器。
2. 保持环境控制器现有的创建、同步、销毁和状态接口。
3. 使用浏览器原生 WebGL，不引入 Three.js 或其他运行时依赖。
4. 在 WebGL 不可用时保留完整桌面，并降级为静态蓝色背景。
5. 在页面隐藏、组件销毁或减少动态时停止持续渲染。

## 3. 参考与视觉解读

参考来源：

- [Pinterest reference 1](https://www.pinterest.com/pin/1121959326091317339/)
- [Pinterest reference 2](https://www.pinterest.com/pin/591027151143554456/)
- [Pinterest reference 3](https://www.pinterest.com/pin/765612005453174046/)
- [Pinterest desktop reference](https://www.pinterest.com/pin/1141803311804408963/)
- [Earendil](https://earendil.com/)

参考提炼为以下设计约束，而不是对某个页面或图片的复制：

- 蓝灰单色关系优先于高饱和蓝色。
- 纹理更接近印刷、纸张、半色调和低对比材质，而不是像素插画。
- 大面积留白和低频运动比复杂的视觉事件更重要。
- 背景的存在感来自材质和时间变化，不来自可识别的物件。
- 系统 UI 应该像贴在背景上的实体工作站，而不是被壁纸吞没。

## 4. 用户可见体验

### 4.1 正常桌面

桌面显示一个中深蓝色的全屏背景。两层非常缓慢的流体噪声形成大片、低对比的蓝灰色形态；亮部叠加极弱的半色调颗粒。用户可以感知背景在变化，但不会把它误认为一个正在播放的视频或交互特效。

背景不包含：

- 云、建筑、鱼、星空或其他具象物体；
- 字符、文字、logo、UI 控件或信息面板；
- 明显的粒子、波纹、等高线或 blueprint 网格；
- 鼠标移动触发的扰动；
- 霓虹光、紫色/绿色偏移和大范围纯白高光。

### 4.2 窗口聚焦

当用户打开或聚焦应用窗口时，背景进入 `focused` 状态：

- 流体速度降低到正常状态的一小部分；
- 半色调纹理强度降低；
- 背景整体透明度继续沿用现有环境层的退让逻辑，目标约为 `0.28`；
- 系统窗口和应用内容成为明确的视觉主体。

### 4.3 移动设备与减少动态

- 平板和手机只渲染一帧静态纹理，不启动持续动画循环。
- `prefers-reduced-motion: reduce` 下冻结在一帧稳定、可读的蓝色纹理。
- 最终状态仍保留背景色阶、系统对象、Pen Pen 和所有交互反馈。

## 5. 视觉规格

### 5.1 色彩关系

Shader 使用独立于 UI 的素材色阶，不把背景色扩散为新的系统 token。第一版候选关系如下，最终可在视觉验收中做小幅调整：

| 层级 | 角色 | 候选范围 |
| --- | --- | --- |
| Base | 中深蓝底色 | `#102C49` – `#173B5D` |
| Mid | 流体中间色 | `#245778` – `#3E6F8F` |
| Soft light | 低对比亮部 | `#7595AD` – `#A8BBC7` |
| Grain | 半色调颗粒 | 亮部透明度不超过约 5% |
| Edge | 暗角 | 只压低，不变为纯黑 |

约束：

- 总体保持蓝 / 灰蓝单色关系。
- 高光不使用纯白，避免与白色 Pen Pen 混淆。
- 不使用彩色渐变、霓虹发光或新的 UI 品牌色。
- 背景不能因为追求材质而降低系统文字和图标的对比度。

### 5.2 形态与纹理

渲染由两层低频噪声组成：

1. 第一层负责大面积流体形态，决定背景的主要视觉重量。
2. 第二层负责局部纹理和轻微位移，避免背景变成完全平滑的渐变。
3. 最终颜色映射限制在约 4–6 个蓝灰色阶，保持印刷式的离散感。
4. 半色调颗粒只在亮部和中间色区域出现，不能覆盖整个画布。
5. 使用轻微边缘暗角保护系统栏、图标和 Dock 的可读性。

### 5.3 动态参数

参数以用户可见行为定义，不将数值暴露为设置项：

- `running`：20–40 秒级别的缓慢漂移；无明显循环断点。
- `focused`：速度约为 `running` 的 20%–35%，纹理强度同时降低。
- `static`：停止时间推进和帧循环，保留当前或确定性首帧。
- 页面隐藏：停止 `requestAnimationFrame`，恢复可见时继续。

不加入 pointermove、点击、拖拽或音频驱动参数。Pen Pen 的交互仍由独立前景层负责。

## 6. 技术架构

### 6.1 背景注册

背景注册从单一图片描述扩展为可区分的渲染描述：

```js
export const DESKTOP_BACKGROUND = Object.freeze({
  id: 'blue-fluid-halftone',
  kind: 'shader',
  palette: 'blue-gray-fluid',
});
```

历史 PNG/GIF 文件继续保留在 `assets/background/`，但当前活跃背景不再引用 `storm-clouds-pixel.png`。

### 6.2 控制器接口

环境控制器继续通过背景工厂创建背景，不直接知道渲染细节。背景实例必须提供：

```js
{
  element,
  setMotionState(motion),
  destroy(),
}
```

`element` 使用：

```html
<canvas
  data-environment-background
  data-background-id="blue-fluid-halftone"
  aria-hidden="true"
></canvas>
```

现有的 `data-environment-background` 选择器、z-index、透明度和环境状态同步继续有效。这样不会改变桌面组件、窗口管理器或 Pen Pen 的层级契约。

### 6.3 Shader 渲染器

新增一个聚焦于背景的渲染模块，例如：

```text
scripts/environment/background/
  background-assets.js
  background-controller.js
  shader-background.js
  shader-source.js
```

职责边界：

- `background-assets.js`：声明当前背景类型和 palette。
- `background-controller.js`：根据 `kind` 创建图片背景或 shader 背景，并暴露统一接口。
- `shader-background.js`：创建 Canvas、WebGL 上下文、uniform、resize 和渲染生命周期。
- `shader-source.js`：保存顶点和片段 shader 字符串，不包含桌面业务逻辑。

WebGL 实现只需要一个覆盖全屏的矩形和一个 fragment shader。uniform 至少包括：

- `u_time`：缓慢时间推进；
- `u_resolution`：CSS 尺寸和设备像素比；
- `u_motion`：运行、聚焦、静态状态；
- `u_density`：半色调密度；
- `u_contrast`：聚焦时的退让程度。

### 6.4 生命周期

渲染器必须：

1. 在挂载时创建 Canvas 和 WebGL 资源。
2. 在尺寸变化时更新 backing store，设备像素比限制在合理范围内。
3. 只有 `running` 状态启动持续 `requestAnimationFrame`。
4. `focused` 状态继续渲染，但使用低速、低对比参数。
5. `static` 状态只渲染确定性帧。
6. 页面隐藏时暂停帧循环。
7. `destroy()` 时取消 RAF、解除监听并释放 WebGL 资源。

## 7. 降级策略

WebGL 不可用、上下文创建失败或 shader 编译失败时：

- 不抛出会阻断桌面的错误。
- 保留环境仪表、应用入口、窗口和 Pen Pen。
- Canvas 使用静态蓝色 fallback，或由 CSS 使用 `var(--os-canvas)` 提供纯色底。
- 设置 `data-environment-fallback="shader-unavailable"`，用于诊断和 E2E 验证。
- 不自动回退到旧的像素壁纸，避免用户仍然看到已弃用的高信息量背景。

## 8. 测试与验收

### 8.1 单元测试

- 背景注册描述为 `kind: 'shader'`。
- 背景控制器创建 Canvas 并挂载正确的 dataset。
- `setMotionState()` 能传递 `running`、`focused` 和 `static`。
- `destroy()` 会取消帧循环并释放/清理资源。
- WebGL 上下文不可用时进入可识别的 fallback 状态。

### 8.2 E2E 测试

- macOS 和 Windows 都挂载 `data-background-id="blue-fluid-halftone"`。
- 活跃背景是 Canvas，不再请求 `storm-clouds-pixel.png`。
- 正常桌面存在渲染状态，窗口打开后进入 `focused`。
- reduced motion 下不持续推进动画。
- 手机 / 平板不启动持续帧循环。
- fallback 状态下环境仪表、窗口入口和 Pen Pen 仍存在。
- Pen Pen 保持在背景之上，且白色 sprite 仍然完全不透明。

### 8.3 视觉验收

至少检查以下视口：

- macOS：`1440 × 900`；
- Windows：`1440 × 900`；
- 平板：`834 × 1194`；
- 手机：`390 × 844`；
- reduced-motion 桌面状态。

视觉验收必须回答：

1. 背景是否明显比当前云层图片更安静。
2. 蓝调和半色调质感是否可感知，但没有变成噪点墙。
3. 系统栏、仪表、图标、Dock 和 Pen Pen 是否比背景更先被注意到。
4. 打开窗口后，背景是否主动退让。
5. 不同尺寸裁切后，画面是否仍然均匀，没有突兀的中心焦点。

## 9. 非目标

本次不包含：

- 重新设计桌面系统栏、窗口、应用图标或 Pen Pen。
- 增加鼠标水波、粒子、音频响应或用户可调 shader 参数。
- 引入 Three.js、Pixi.js 或其他第三方渲染库。
- 将 shader 用于文章、项目卡片或应用内部内容。
- 删除历史图片资源。
- 改变音乐、内容页面、国际化文案或已有窗口交互。

## 10. 后续实现顺序

设计文档通过审阅后， implementation plan 按以下顺序拆分：

1. 扩展背景注册与统一控制器接口。
2. 实现 WebGL shader、resize、状态和销毁生命周期。
3. 实现 WebGL fallback 和 reduced-motion 静态帧。
4. 更新环境 CSS，保持现有透明度和层级契约。
5. 更新单元测试和 E2E 测试。
6. 在 macOS / Windows / 移动尺寸下完成视觉验收。
7. 更新 `design.md` 的背景素材与动效约束。
