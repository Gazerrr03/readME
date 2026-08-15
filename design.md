# Portfolio OS Design Language

> 本文档是后续新增页面、窗口、组件、图标、背景素材、动效与内容呈现的设计约束。
> 当前基线是“Deep Indigo × Retro Hardware × Workstation Desktop”的成套 OS 界面，不是 blueprint，也不是运行时 ASCII 展示。
> 它总结当前已实现的视觉语言，不是对某个真实操作系统的复刻规范。

## 1. 设计定位

### 核心描述

这是一个发生在凌晨两点的、虚构的个人作品集操作系统：像一台安静运行的旧显示设备，也像一款克制的像素游戏。它首先应当是一个**可以操作的系统**，其次才是一个网站；像素感负责建立记忆点，OS 结构负责保证可用性。

当前视觉主题已经从 blueprint 转为深靛蓝的像素怀旧 OS：背景由经过处理的低分辨率图片或 GIF 构成，前景由深色系统栏、窗口、图标和白色 Pen Pen 组成。画面可以有颗粒、色阶和像素块，但不靠装饰堆叠气氛。

### 设计关键词

- 像素：硬边、离散色阶、清晰的像素簇和有限的细节密度。
- 蓝调：以深蓝、亮蓝和白色建立昼夜感，不依赖多色霓虹。
- 怀旧但不拟古：借用低分辨率显示设备和早期桌面的感觉，不复制某个年代或品牌。
- 系统化：边框、状态、窗口层级和交互反馈必须可预测。
- 稀疏而非空洞：背景提供空间感，前景只保留真正可操作或可识别的对象。
- 少即是多：像素细节服务于构图和识别，不把每个空白填满。
- 有人格的彩蛋：Pen Pen 是常驻的白色前景对象，安静存在，交互时才暴露少量故障感和生命感。

### 三个系统级决策

- **Shell 2：Shared OS + Platform Skins**。菜单栏、Dock、任务栏、窗口、图标、焦点环和状态反馈使用同一套组件契约；macOS 与 Windows 只改变系统 chrome、入口位置和少量空间规则，不各自发展一套视觉语言。
- **Density 2：Workstation Desktop**。桌面允许同时承载背景、环境仪表、应用入口、系统状态和窗口，但每个区域都有有限的信息预算。仪表是低频状态，窗口是主要工作区，背景只提供空间和情绪。
- **Surface 2：Retro Hardware**。组件使用直角、细边框、硬阴影和明确的 pressed / selected 状态，像贴在旧设备上的面板；不使用玻璃、模糊或软浮层。轻微 bevel 只服务于控件边缘和状态，不把内容包装成层层卡片。

## 2. 视觉层级与约束

### 三层画面模型

桌面由三个相互独立的层组成，新增内容应先判断属于哪一层：

1. **背景素材层**：全屏铺开的蓝调像素图片或 GIF，负责空间、时间和情绪，不承载按钮或状态信息。
2. **系统对象层**：菜单栏、Dock、任务栏、桌面图标、窗口和环境仪表，负责导航、状态和操作。
3. **前景彩蛋层**：Pen Pen 等常驻对象，负责个性和轻量互动，不应被背景图或窗口内容吞没。

背景素材不能把系统对象画进图片里；Pen Pen 也不能被烘焙进背景。这样更换图片、切换 Windows / macOS 或调整窗口时，系统结构仍然稳定。

### 固定层：新增设计必须遵守

- 系统壳层使用 Deep Indigo 色阶、近白色文字和反相状态表达层级；透明度只用于次要背景可读性，不承担主要状态表达。
- 背景采用经过预处理的像素图像或 GIF；默认全屏显示，使用 `object-fit: cover` 自适应尺寸。
- 图像的像素感来自硬边、有限色阶和像素化采样，不通过难读的像素字体制造怀旧感。
- 系统组件使用直角、细边框和无模糊硬阴影。
- Serif 展示标题与 Monospace 系统文本保持明确分工。
- 以 4px / 8px 为基础的间距节奏和 32px 默认网格继续有效，但网格是布局工具，不是背景主题。
- Windows / macOS 两种桌面布局共享同一组件语言，只改变系统 chrome、应用入口位置和必要的窄屏空间关系。
- 英文、简体中文、日文三种语言下均不溢出、不遮挡、不改变信息层级。
- `prefers-reduced-motion` 下仍能看懂全部状态变化。
- 任何新增装饰都必须回答它服务的是识别、层级、状态还是操作；没有答案的装饰不加入。

### 可演化层：允许随内容发展

- `assets/background/` 中的图片和 GIF，以及它们的预处理方式。
- Projects、Writing、About、Contact 的内部信息架构与内容版式。
- Pen Pen 的人格、拖拽反馈、故障图形和其他低频彩蛋状态。
- 作品内容中的真实图片、视频、代码和文章排版。

背景素材可以更换，应用内容可以更丰富，但不能反过来改变窗口、导航、控制器和状态反馈的基础语言。

## 3. 颜色

### Deep Indigo token 关系

| Token | 值 | 用途 |
| --- | --- | --- |
| `--os-canvas` | `#071426` | 页面、桌面和背景加载前的最深底色 |
| `--os-surface` | `#0E2340` | 普通窗口、应用内容和基础控件表面 |
| `--os-surface-raised` | `#1A2E46` | 标题栏、系统栏、仪表和抬高一级的控件表面 |
| `--os-surface-highlight` | `#40566A` | 边框、分隔线和低对比结构线 |
| `--os-accent` | `#748BFF` | 选中、激活、按下和主要操作的反相底色 |
| `--os-accent-bright` | `#B9D7FF` | focus ring、亮边框、故障轮廓和高优先级提示 |
| `--os-ink` | `#F2F6FF` | 主要文字、图标、白色 Pen Pen 和前景高对比内容 |
| `--os-muted` | `#8296B8` | 次要说明、低频状态和不抢焦点的信息 |
| `--os-shadow` | `#020811` | 无模糊硬阴影和 pressed 后的深色边缘 |

系统壳层保持深靛蓝、亮蓝和近白的关系。背景图片可以使用从原图提取的少量蓝色阶，但它们属于内容素材，不应被当作新的 UI token 扩散到按钮、窗口和导航中。`--blue`、`--white` 等旧别名只用于迁移兼容，新组件必须直接使用 `--os-*` token。

### 颜色使用规则

- 默认状态：`--os-surface` / `--os-surface-raised` 表面配 `--os-ink` 文字和 `--os-surface-highlight` 边框。
- 强调 / 选中 / 当前状态：`--os-accent` 底色配 `--os-canvas` 文字；必要时用 `--os-accent-bright` 加边。
- 聚焦：`2px solid var(--os-accent-bright)`，通常配合 `2px` 外偏移。
- Pen Pen 默认使用完全不透明的单一白色视觉，保持与像素背景的高对比；故障碎片只使用 `--os-ink`、`--os-accent-bright` 和透明度变化。
- macOS 交通灯可以保留其熟悉的系统识别色，但只能用于窗口控制，不得扩展为应用品牌色。
- 禁止把红、紫、橙、荧光绿等颜色作为新的 UI 强调色。
- 禁止彩色渐变、霓虹光、米色纸张底、灰色拟物层、透明玻璃和背景模糊。
- CSS gradient 仅可用于 Pen Pen 的短暂图形化故障纹理或其他明确的像素显示纹理；UI 表面不使用装饰性渐变。预处理背景的色阶和纹理属于素材，不属于 UI 表面。

## 4. 字体与文字层级

### 字体角色

```css
--serif: "Times New Roman", "Songti SC", "Yu Mincho", serif;
--mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

- `--serif`：站点标题、应用主标题、窗口内容中的章节标题和较大的时间读数。
- `--mono`：按钮、导航、状态、字段标签、协议、应用名、辅助说明和所有系统 chrome。
- 不额外引入无衬线品牌字体。正文若未来需要长篇阅读，可在 Writing 应用内定义专用阅读字体，但不能替代系统字体。

### 排版规则

- 像素感来自图像和图形资产，不通过全站使用像素字体降低可读性。
- 不使用负字距；CJK 文本保持 `letter-spacing: 0`。
- 英文系统标签可大写，但自然语言标题不要全部大写。
- 长标题优先截断并提供完整可访问名称；字段标签优先换行，不用缩到不可读。
- 数值、单位和协议写法保持紧凑，如 `32px`、`60Hz`、`TCP/IP / SECURE`。
- 文案应像状态输出或工具标签：短、具体、可执行，避免营销语和解释性口号。

## 5. 背景素材与构图

### 素材工作流

背景不再由浏览器运行时把图片转换成 ASCII，也不通过鼠标移动实时扭曲背景。新的素材流程是：

1. 将原始图片或 GIF 放入背景素材工作区。
2. 在进入项目之前完成蓝调、像素化、色阶和尺寸适配等处理。
3. 将项目可直接使用的 PNG 或 GIF 放入 [`assets/background/`](./assets/background/)。
4. 在 [`scripts/environment/background/background-assets.js`](./scripts/environment/background/background-assets.js) 注册当前素材。
5. 由背景控制器以图片元素加载，桌面通过 `object-fit: cover` 全屏展示。

静态图片是默认选择；GIF 可以通过素材本身提供预制动画。除非运动表达了明确的状态，否则不为背景额外增加持续漂移、鼠标水波或运行时粒子层。

### 构图原则

- 背景是完整的空间，不是 blueprint 图纸、ASCII 字符矩阵或信息面板。
- 优先选择有明确主体、地平线或方向线的画面，让低分辨率细节在远看时仍可识别。
- 背景主体应避开菜单栏、仪表、桌面图标和 Dock 的主要遮挡区域；这是素材构图责任，不通过运行时 quiet zone 算法补救。
- `cover` 裁切是允许的，关键主体不能依赖某一个固定视口比例才能成立。
- 背景保留大面积安静区域，避免细节与系统文字争夺注意力。
- 前景系统对象应像贴在显示设备上的实体：边框清楚、层级明确、不会因为背景复杂而失去轮廓。
- macOS 顶部菜单栏、底部 Dock、左上环境仪表和右侧桌面图标维持现有空间关系；Pen Pen 位于独立前景层，默认靠近右下区域。

## 6. 空间、形状与硬边

### 基础节奏

- 以 `4px` 为最小单位、`8px` 为主要间距单位。
- 常用间距：`4 / 6 / 8 / 12 / 16 / 24 / 28 / 32px`。
- 默认桌面网格为 `32px`；它用于定位和对齐，不要求背景出现可见网格线。
- 窗口内容默认内边距为 `24px`，复杂面板可用 `28px`；窄屏降为 `16px`。

### 形状

- 所有系统组件使用 `border-radius: 0`。
- 基础描边为 `1px solid var(--os-surface-highlight)`；需要强调时使用 `var(--os-accent-bright)`。
- 需要章节强调时可使用 `4px double var(--os-accent)`。
- 次级分隔可用 `1px dotted var(--os-surface-highlight)`；最小化等非活跃状态可用 dashed border。
- 不使用药丸、圆形浮动按钮或大圆角容器。

### 硬阴影层级

| 偏移 | 用途 |
| --- | --- |
| `3-4px` | 小按钮、图标、轻量控件 |
| `6px` | 普通窗口、悬停后的图标 |
| `9px` | 当前活动窗口 |
| `12px` | 启动面板或唯一主舞台 |

阴影必须是无模糊、无扩散的 `var(--os-shadow)` 色块。按下状态可把偏移压缩到 `1px`，模拟明确的机械反馈。Retro Hardware 的 bevel 只通过相邻的 surface / highlight 边线、硬阴影和 pressed 位移表达；不要用软阴影制造悬浮卡片。渐变不用于系统表面，只允许出现在明确的像素故障纹理或预处理背景素材中。

## 7. 图标、像素资产与 Pen Pen

- 系统图标以 `46 x 46px` 为标准画布，使用 `--os-surface` 表面、`--os-surface-highlight` 边框和 `--os-shadow` 硬阴影。
- 图形使用 1px 线条、矩形、字符和少量实心块构成，保持 1-bit / 低分辨率观感。
- 新图标必须先保证对象轮廓可辨识，再考虑风格化；不能依赖颜色区分含义。
- 优先用 CSS、字符或像素位图实现系统图标，不使用现代圆角应用图标、emoji、彩色插画或未经处理的第三方 icon set。
- 选中时图标和标签同时反相：`--os-accent` 底色配 `--os-canvas` 文字 / 图形。
- 照片、视频和项目截图属于内容资产，应显示真实作品；若需要统一视觉，可用像素化或蓝调处理，但不把内容做成模糊氛围背景。

### Pen Pen

- Pen Pen 是系统前景层的常驻彩蛋，不能与背景素材合并。
- 默认使用完全不透明的白色单色形象，保留 `PEN²` 等能让熟悉作品的访客识别的细节。
- 造型必须一眼可辨识为企鹅；故障元素只能作为 hover 或特定状态的短暂叠加。
- 支持鼠标长按拖动，拖动过程中使用轻量行走帧和左右方向帧；释放后位置只在当前会话中保留，刷新页面回到默认右下位置。
- Pen Pen 是独立的前景层，视觉上位于背景、工作站仪表和窗口之上，保证彩蛋不会被吞没；默认位置和窄屏 clearance 必须避开系统栏、Dock 与主要入口，不能成为主要导航。

## 8. 核心组件规范

### 应用图标

- Windows 桌面单元宽 `88px`、最小高 `80px`，图标与标签间距 `8px`。
- 精细指针设备：单击选中、双击打开；触屏与窄屏：单击打开。
- hover 只做短距离上移与硬阴影增强；macOS Dock 可略强，但不做弹簧放大链。
- 必须支持键盘方向键导航、`Enter` 打开及清晰 focus ring。

### 窗口

- `--os-surface` 表面、1px `--os-surface-highlight` 边框、普通 `6px` 硬阴影；活动窗口提升为 `9px`，全屏状态可去除阴影。
- 标题栏高 `32px`，`--os-surface-raised` 表面配 `--os-ink`；控件至少 `32 x 32px`，使用反相和亮边表达状态。
- 控件使用熟悉的符号，如最小化 `-`、关闭 `X`，并提供本地化的可访问名称。
- 同一应用只保留一个窗口实例；再次启动应聚焦或恢复，而不是叠加副本。
- 窗口状态必须包含 active、inactive、minimized、restored、closed。
- 桌面可拖动；窄屏窗口固定铺满可用工作区，不显示无意义的拖动提示。

### 系统栏、Dock 与状态

- 系统栏高 `32-48px`，只承载全局状态和高频入口。
- 状态文本保持单行、可扫描，以边线和空隙分组。
- 运行应用使用反相表示当前态，dashed border 表示最小化。
- Pen Pen 等常驻对象应贴近边缘，但默认位置和拖动边界要避开系统栏、Dock、窗口控件和应用入口。

## 9. 动效与反馈

### 时间与曲线

```css
--press-duration: 140ms;
--ui-duration: 200ms;
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
```

- 常规 hover、选择、窗口显隐控制在 `120-200ms`。
- 按压先改变位移或阴影，再改变颜色；反馈必须短而清楚。
- 启动、扫描、数据包和像素故障等“系统过程”使用 `steps()`，形成离散输出感。
- 背景默认静止；GIF 的运动来自素材本身。运行时背景只允许一个图片元素，不引入 ASCII 字符渲染、Canvas、鼠标水波、pointermove 扰动、实时滤镜或持续漂移。
- Pen Pen 的 hover 故障、拖拽行走和窗口状态变化可以运动，但必须短、可中断、服务于状态表达。
- 新动效必须回答：什么状态发生了变化、用户是否能中断、减少动态后如何表达同一信息。

### Reduced Motion

- 在 `prefers-reduced-motion: reduce` 下把过渡压缩到约 `1ms` 或移除。
- 停止 GIF 以外的循环信号动画、icon jitter、故障闪烁和分步移动；必要时冻结在清晰帧。
- 不得移除最终状态、focus、选中、运行或错误反馈。

## 10. 响应式与多语言

### 断点原则

- `760px` 及以下进入窄屏系统模式。
- 窄屏窗口占据除系统 chrome 外的可用空间，窗口打开时隐藏被遮挡的桌面图标 / Dock。
- 背景继续使用 `cover`，允许裁切，但主体必须在 `390px x 844px` 下保持可辨识。
- 设置侧栏在窄屏转为顶部三列导航，字段从多列转为单列。
- 图标触控目标保持约 `76px` 单元；窗口控制不能小于 `32px`。
- 不按视口宽度连续缩放字体，使用明确断点和稳定字号。

### 国际化

- 所有可见文案从 locale dictionary 获取，禁止组件内硬编码英文。
- 同时验证 `en`、`zh-CN`、`ja`，以最长文案决定控件宽度和换行策略。
- 协议型 token 可保持不翻译，例如 `[OK]`、`BUILD: 882.A`、`TCP/IP`。
- 切换语言不刷新页面，并同步更新已打开窗口、标题、辅助文本和 document title。

## 11. 可访问性

- 交互元素必须使用语义化的 `button`、`input`、`select`、`nav` 等元素。
- 所有 icon-only 控件必须有本地化 accessible name。
- 键盘可以完成图标选择、应用打开、窗口控制、设置修改和语言切换。
- focus ring 不得因视觉“更干净”而移除。
- 状态变化使用 `aria-pressed`、`aria-live` 或等价语义，不只依赖视觉反相。
- 文字与背景保持 Deep Indigo / `--os-ink` 高对比；通过透明度弱化的内容仍需满足可读性。
- Pen Pen 的拖动不能成为唯一交互路径，必须保留键盘和其他系统操作的可达性。
- 组件必须在 200% 缩放、窄屏和三种语言下保持可操作，不允许文字与控件重叠。

## 12. 禁止模式

后续设计不得出现以下偏离：

- 把 blueprint 网格、建筑制图线或技术图纸继续当作默认桌面主题。
- 把 ASCII 字符矩阵、运行时鼠标水波或实时 Canvas 扰动重新引入桌面背景。
- 新增第三种 UI 强调色，或为每个应用分配品牌色。
- 圆角卡片、药丸标签、玻璃拟态、背景模糊、软阴影、发光描边。
- 把桌面做成营销落地页，在首屏放 hero、功能卖点或解释性文案。
- 大量独立卡片或卡片嵌套，用容器代替真正的信息层级。
- 装饰性渐变、光斑、bokeh、漂浮几何体或无功能的 3D 元素。
- 直接复制 Windows / macOS 原生视觉资产，造成品牌拼贴；交通灯仅作为必要的系统识别例外。
- 使用 emoji 或彩色通用图标替代现有 1-bit / 像素图标系统。
- 为“复古感”故意降低可用性，例如隐藏焦点、缩小触控目标、使用难读的像素字体。
- 不解释状态的动画、无止境的环境运动或与系统节奏不一致的弹簧效果。
- 在组件中硬编码语言、只验证英文、用缩小字号解决 CJK 溢出。

## 13. 新增设计元素的决策顺序

每次新增元素，依次回答：

1. 它是背景素材、系统 chrome、交互控件、状态反馈，还是被系统承载的内容？
2. 它解决什么任务，是否已有组件或状态可以复用？
3. 默认、hover、pressed、selected、focus、disabled、loading、error 各是什么状态？
4. 它能否只用蓝、白、像素边缘、线型、反相和硬阴影表达层级？
5. 如果它是背景，主体在 `cover` 裁切和窄屏下是否仍然可辨识？
6. 它在 Windows 与 macOS 桌面模式中是共享组件还是位置变化？
7. 它在 `390px` 窄屏、`1440px` 桌面、200% 缩放下是否稳定？
8. 英文、中文、日文最长文案是否能完整显示或合理截断？
9. 减少动态后，状态变化是否仍然明确？

如果前三个问题没有清晰答案，不应先创造视觉样式。

## 14. 交付检查清单

- [ ] 系统 chrome 仅使用既有 Deep Indigo / 近白 token；背景素材使用受控的蓝调有限色阶。
- [ ] 背景是独立的 PNG / GIF 素材，已注册到背景清单，并通过 `cover` 自适应。
- [ ] 没有运行时 ASCII、鼠标水波或无意义的环境扰动。
- [ ] 所有系统容器保持直角、1px 结构边框和规定的硬阴影层级。
- [ ] Serif / Mono 的角色没有混用，像素感没有以牺牲可读性为代价。
- [ ] 复用了现有间距、标题栏、控件和状态模式。
- [ ] 没有新增装饰性卡片、渐变、软阴影、模糊或第三 UI 强调色。
- [ ] hover、pressed、selected、focus、disabled 和异步状态完整。
- [ ] Pen Pen 保持白色、高对比、可辨识，并且不遮挡主要操作。
- [ ] Windows / macOS 两种模式下位置正确且行为一致。
- [ ] `390 x 844` 与 `1440 x 900` 下没有遮挡、溢出或背景主体丢失。
- [ ] `en`、`zh-CN`、`ja` 均已检查。
- [ ] 键盘、触屏、精细指针与 reduced motion 均可用。
- [ ] 新增文案已进入 i18n dictionary，图标有 accessible name。

## 15. 当前实现的参考入口

- 设计 token：[`styles/tokens.css`](./styles/tokens.css)
- OS 桌面边界与背景样式：[`styles/shell.css`](./styles/shell.css)、[`styles/environment.css`](./styles/environment.css)
- 背景素材目录：[`assets/background/`](./assets/background/)
- 背景素材注册：[`scripts/environment/background/background-assets.js`](./scripts/environment/background/background-assets.js)
- 背景控制器：[`scripts/environment/background/background-controller.js`](./scripts/environment/background/background-controller.js)
- 图标系统：[`styles/icons.css`](./styles/icons.css)
- Windows / macOS chrome：[`styles/windows-mode.css`](./styles/windows-mode.css)、[`styles/macos-mode.css`](./styles/macos-mode.css)
- 窗口状态与交互：[`styles/windows.css`](./styles/windows.css)、[`scripts/window-manager.js`](./scripts/window-manager.js)
- 应用内部控件：[`styles/apps.css`](./styles/apps.css)
- 窄屏规则：[`styles/responsive.css`](./styles/responsive.css)
- 启动体验：[`styles/boot.css`](./styles/boot.css)
- Pen Pen 行为：[`scripts/desktop.js`](./scripts/desktop.js)
- Pen Pen 资产：[`assets/pets/pen-pen/`](./assets/pets/pen-pen/)
- OS kit 契约测试：[`tests/e2e/ui-kit.spec.js`](./tests/e2e/ui-kit.spec.js)、[`tests/e2e/desktop.spec.js`](./tests/e2e/desktop.spec.js)、[`tests/e2e/windows.spec.js`](./tests/e2e/windows.spec.js)、[`tests/e2e/environment.spec.js`](./tests/e2e/environment.spec.js)
- 单元契约测试：[`tests/unit/desktop-bot.test.js`](./tests/unit/desktop-bot.test.js)、[`tests/unit/window-state.test.js`](./tests/unit/window-state.test.js)
- 产品与交互规格：[`docs/superpowers/specs/2026-08-15-portfolio-os-ui-kit-redesign-design.md`](./docs/superpowers/specs/2026-08-15-portfolio-os-ui-kit-redesign-design.md)

当文档与实现发生差异时：先判断是实现偏离了固定层，还是项目确实需要演化固定层。前者应修正实现；后者必须同步更新本文档与相关 token，不能只在局部组件中留下例外。
