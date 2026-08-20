# Portfolio OS 壁纸库、Flow Shards 与作者调节页设计规格

> 状态：待用户最终审阅
>
> 日期：2026-08-20
>
> 参考效果：[Samsy Lab](http://lab.samsy.ninja)
> 范围：桌面壁纸系统、Photos 中的壁纸选择、Flow Shards 程序化壁纸、仅供作者使用的 `/setting/` 调节页

## 1. 背景与结论

当前 Portfolio OS 只有一个固定的 `blue-fluid-halftone` WebGL 壁纸。Photos 应用只浏览照片，用户无法预览或切换桌面壁纸；如果要调整新的程序化效果，也只能直接修改 shader 数值。

本次新增一套可扩展的壁纸系统，并加入一个参考 Samsy Lab 动态语言的 `Flow Shards` 壁纸。该效果不依赖 `.glb`、`.gltf`、`.obj` 或 `.fbx` 等外部 3D 模型；可见的重复物体只来自一个程序化 `BoxGeometry`。静态缩略图会作为界面预览资源提交到项目，但它不是运行时 3D 模型。

最终选择的架构是“壁纸注册表 + 独立渲染适配器”：保留现有蓝色 raw-WebGL 壁纸，不重写它；新壁纸使用本地 Three.js；Photos、桌面和作者调节页共享同一份元数据、默认配置与配置校验逻辑。

## 2. 目标

### 2.1 用户体验目标

1. Photos 应用增加 `Photos / Wallpapers` 两个页签，原有照片浏览行为保持不变。
2. 在 Wallpapers 中先打开静态预览，再点击“设为壁纸”，避免误触立即切换。
3. 壁纸选择在刷新和下次访问后仍然保留。
4. 新的 Flow Shards 在桌面端提供有空间感、流向感、拉伸朝向、投影和柔和辉光的动态背景。
5. 切换失败时保留当前壁纸，不让桌面变黑或失去响应。

### 2.2 作者体验目标

1. 访问 `/setting/` 即可进入独立调节页；也支持 `/setting/?wallpaper=flow-shards`。
2. 调节页不出现在桌面、应用注册表、Photos 或公开导航中。
3. 控件使用“速度、漩涡大小、拖尾长度”等自然语言，不展示 uniform、纹理尺寸或 GLSL 名称。
4. 调节时实时看到效果，草稿自动保存在当前浏览器。
5. 作者可把当前结果应用到本机主页试用，也可复制或下载稳定的 JSON 配置。
6. 调节页不会自动改写项目文件；正式默认值仍需把导出的配置提交到代码仓库。

### 2.3 技术目标

1. 同一时刻只运行一个桌面壁纸渲染器。
2. Photos 只读取静态元数据和缩略图，不为每个卡片创建 WebGL Canvas。
3. 只有选中 Flow Shards 时才动态加载本地 Three.js 和相关 shader。
4. 可见渲染与阴影深度渲染共用同一套实例变形逻辑，避免“物体和影子分离”。
5. 正确处理窗口聚焦、页面隐藏、减少动态、WebGL 上下文丢失和销毁。

## 3. 非目标与边界

本次不包含：

- 不做手机端的视觉还原、参数调优或性能验收；只保留现有静态/降级行为，不能破坏已有移动端流程。
- 不给普通访客提供 shader 参数编辑入口。
- 不建设登录、后台、远程配置或真正的管理员权限系统。
- `/setting/` 的“隐藏”和 `noindex` 不是安全边界；知道地址的人仍可访问。
- 不把现有蓝色 raw-WebGL 壁纸改写成 Three.js。
- 不引入 React、Vue、SPA 路由器、新的构建链或远程 CDN 依赖。
- 不使用外部 3D 模型，也不追求对参考站点逐像素复制。
- 不让调节页直接写入 Git 仓库或线上部署。
- 不在本轮重做桌面窗口、图标、Pen Pen、系统栏或 Photos 中原有照片内容。

## 4. 已选架构

### 4.1 方案比较

评估过三种方式：

1. **注册表 + 渲染适配器（已选）**：现有 raw-WebGL 与新 Three.js 各自实现渲染器，共享统一外层契约。
2. **全部迁移到 Three.js**：接口统一，但会无必要地重写已稳定的蓝色壁纸，回归范围更大。
3. **在 Photos 和主页中分别硬编码**：首版文件较少，但元数据、选择状态和默认配置会快速分叉。

选择方案 1。它能在不重写现有壁纸的前提下增加 Flow Shards，也为以后加入图片、视频或其他程序化壁纸保留清晰边界。

### 4.2 总体数据流

```text
                         wallpaper registry
                    metadata / defaults / controls
                       /          |          \
                      /           |           \
          Photos Wallpapers   desktop manager   /setting/
          static previews      active renderer   live preview
                 |                   |                |
                 |           selected wallpaper      |
                 +---------- preferences ------------+
                                     |
                         optional local preview config
```

注册表是唯一的壁纸定义来源。Photos 只使用注册表的静态部分；桌面管理器和 `/setting/` 在真正需要时才调用动态渲染工厂。

## 5. 壁纸注册表

### 5.1 描述对象

每个壁纸描述对象至少包含：

```js
{
  id: 'flow-shards',
  kind: 'three',
  title: { en: 'Flow Shards', 'zh-CN': '流动晶片', ja: 'フローシャード' },
  description: { /* 同样覆盖三种语言 */ },
  previewSrc: 'assets/background/previews/flow-shards.webp',
  defaultConfig: { /* 已校验的语义配置 */ },
  controls: [ /* 调节页的人类可读控件定义 */ ],
  loadRenderer: () => import('./wallpapers/flow-shards/index.js'),
}
```

约束：

- `id` 全局唯一且稳定；首批为 `blue-fluid-halftone` 与 `flow-shards`。
- 默认桌面壁纸仍是当前 `blue-fluid-halftone`，不会在上线后突然替现有访客切换。
- `previewSrc` 必须是仓库内的静态图片；缩略图加载不会触发 renderer 或 Three.js。
- `defaultConfig` 在注册时经过同一套 normalizer，不能包含 `NaN`、越界值或未知字段。
- `controls` 只描述 UI 名称、说明、类型和语义范围，不直接暴露 shader uniform。
- `loadRenderer` 必须保持动态导入，不能让 Three.js 进入所有页面的初始执行路径。

### 5.2 渲染器契约

所有适配器向管理器提供等价能力：

```js
{
  element,                         // Canvas 或渲染表面
  ready,                           // 首帧可显示后 resolve，失败时 reject
  setMotionState(state),           // running | focused | static
  updateConfig(nextConfig),        // 调节页实时更新；必要时可异步重建资源
  destroy(),                       // 取消帧循环、监听并释放 GPU 资源
}
```

现有蓝色壁纸通过一个很薄的 adapter 满足此契约，保留原 shader 和生命周期实现。普通图片壁纸未来也可使用同一契约，但不在本轮新增图片壁纸。

## 6. 桌面壁纸管理器

### 6.1 稳定宿主

现有 `[data-environment-background]` 从“必须是 Canvas”调整为稳定的背景宿主元素。真正的 Canvas 位于宿主内部，并标记为 `[data-wallpaper-surface]`。这样切换时可以短暂同时容纳旧表面和候选表面，而环境层的层级、聚焦透明度和点击穿透规则保持不变。

宿主负责：

- 当前壁纸 ID、加载状态和 fallback 状态的 dataset；
- 把环境的 motion state 转发给活跃渲染器；
- 保证正常状态只有一个活跃 surface；
- 在销毁时清理活跃与尚未完成的候选渲染器。

### 6.2 安全切换事务

`applyWallpaper(id)` 采用候选先行的切换流程：

1. 查找描述对象并校验其默认值或本地覆盖配置。
2. 在旧壁纸仍然可见时创建候选 surface，并把当前 motion state 立即传给它。
3. 候选附着在宿主内但保持透明，以便获得真实尺寸并渲染首帧。
4. 等待 `ready`；只有成功后才把它标为活跃。
5. 使用约 200ms 的淡入淡出完成替换；减少动态时立即替换。
6. 替换完成后销毁旧渲染器，再持久化新壁纸 ID。
7. 若候选创建、编译或首帧失败，移除候选并保留旧壁纸与旧偏好。

连续快速点击时使用递增请求序号或等价的取消标记：只有最后一次请求可以成为活跃壁纸；已过期的候选在完成后立即销毁。

### 6.3 与主页状态的连接

偏好对象新增：

```js
wallpaperId: 'blue-fluid-halftone'
```

继续使用现有 `portfolio-os:preferences` 和版本 1，不因一个可向后兼容的字段增加整体版本。读取时：

- 已知 ID 原样保留；
- 缺失、未知或类型错误时修复为 `blue-fluid-halftone`；
- 只有候选成功显示后才保存新 ID。

主入口负责把以下能力注入 Photos：当前壁纸 ID、读取壁纸静态列表、异步应用壁纸。环境控制器继续决定背景是否挂载以及 motion state，壁纸管理器只决定宿主内部显示哪一个 renderer。

### 6.4 配置优先级

主页加载某个壁纸时，配置优先级固定为：

1. 与当前 `wallpaperId` 匹配且校验成功的本机预览覆盖；
2. 注册表中的正式 `defaultConfig`。

Photos 的“设为壁纸”只改变所选 ID，不删除作者已有的本机预览覆盖。普通访客没有该覆盖，因此始终看到正式默认值。

## 7. Photos 中的壁纸体验

### 7.1 两个页签

Photos 窗口顶部增加 `Photos / Wallpapers` 页签：

- 默认打开 `Photos`，原有 4 张照片、选择、双击、前后翻页和日期信息完全不变。
- `Wallpapers` 读取注册表静态元数据，显示静态缩略图、标题和当前状态。
- 切换页签不销毁或重置原照片浏览位置。
- 英文、简体中文和日文文案均通过现有 i18n 系统提供。

### 7.2 壁纸预览与应用

Wallpapers 使用明确的两步操作：

1. 点击卡片进入该壁纸的详情预览。
2. 在详情中点击“设为壁纸”。

详情包含大号静态预览、名称、简短描述、“当前壁纸”徽标和应用按钮。应用过程中按钮禁用并显示“正在应用”；成功后更新当前徽标，失败时显示可读错误且桌面保持原样。键盘用户可使用 `Tab`、`Enter` 和 `Space` 完成相同流程。

即使 Flow Shards 已在桌面运行，Photos 中仍然只展示静态缩略图，不镜像 Canvas，也不创建第二个 Three.js renderer。

## 8. `/setting/` 作者调节页

### 8.1 路由与可见性

采用真实静态目录：

```text
/setting/
/setting/?wallpaper=flow-shards
```

`setting/index.html` 使用相对路径导入共享模块，适配当前 GitHub Pages 子目录部署，不引入客户端路由器。无 query 时默认打开 `flow-shards`；未知 ID 回到 `flow-shards` 并显示提示。

页面不注册为 OS 应用、不加入站点导航，并设置：

```html
<meta name="robots" content="noindex,nofollow">
```

这只是作者便利入口，不构成身份验证或保密机制。

### 8.2 页面布局

本轮只设计桌面布局：左侧/主区域是大尺寸实时预览，右侧是可滚动控制面板。顶部显示壁纸名称、运行状态和返回主页链接；预览区显示加载、编译失败或 WebGL 不可用状态。

控制面板遵循以下原则：

- 所有数字控件在界面中显示为 `0–100` 或低/中/高，而不是 shader 的物理范围。
- 每个控件有一句通俗说明，并在两端标注如“慢 / 快”“短 / 长”。
- 输入先经过 clamp 和 normalizer，再传给 renderer。
- 普通 uniform 变化在下一帧生效。
- 需要重建状态纹理的“数量”只在选择完成后触发，并有短 debounce；拖动期间不反复分配 GPU 资源。
- 同一时间只保留一个预览 renderer。

### 8.3 第一版控件

首版限制为 12 个直观控件：

| 分组 | 界面名称 | 类型 | 实际影响 |
| --- | --- | --- | --- |
| 预设 | 安静 / 参考 / 强烈 | 分段按钮 | 一次写入一组安全参数；继续修改后显示“自定义” |
| 密度 | 晶片数量 | 低 / 中 / 高 | `64² / 96² / 128²` 个实例，并重建状态纹理 |
| 流动 | 运动速度 | 0–100 | 模拟时间步长 |
| 流动 | 漩涡大小 | 0–100 | 噪声空间尺度；左侧细密，右侧宽阔 |
| 流动 | 翻涌强度 | 0–100 | curl-like 流场的偏转强度 |
| 流动 | 运动范围 | 0–100 | 生命周期与重生分布的组合映射 |
| 形态 | 晶片大小 | 0–100 | BoxGeometry 的基础缩放 |
| 形态 | 拖尾长度 | 0–100 | 根据当前/上一位置速度产生的轴向拉伸 |
| 光影 | 辉光 | 0–100 | bloom 阈值与合成强度的安全组合 |
| 光影 | 阴影 | 0–100 | 主光与接收阴影的强弱，不改投影几何 |
| 光影 | 雾感 | 0–100 | 远处淡出与整体空间层次 |
| 颜色 | 背景色 / 晶片色 | 两个颜色输入 | 背景、主体色；高光由主体色自动推导 |

相机、阴影相机、噪声迭代次数、纹理格式和 bloom 层数属于实现安全参数，不在非技术调节页暴露。

### 8.4 操作与存储

提供以下操作：

- **恢复默认**：把当前表单恢复为注册表正式默认值；在点击“应用到本机主页”前不影响主页。
- **应用到本机主页**：保存当前规范化配置为本地预览覆盖，并把该壁纸设为当前壁纸。
- **复制配置**：复制确定性 JSON；若剪贴板被拒绝，显示可选择的文本区域。
- **下载 JSON**：下载与复制内容完全相同的配置文件。

草稿与主页覆盖分开保存：

```text
portfolio-os:wallpaper-lab:v1      // 自动保存的编辑草稿，按 wallpaperId 分组
portfolio-os:wallpaper-preview:v1  // 明确应用到本机主页的配置覆盖
```

导出结构固定为：

```json
{
  "schemaVersion": 1,
  "wallpaperId": "flow-shards",
  "config": {}
}
```

导出前删除未知字段、修复越界值并按稳定键序列化；不写时间戳，因此相同配置得到相同文本，便于复制进代码和 Git 审阅。

## 9. Flow Shards 渲染管线

### 9.1 总览

```text
origin DataTexture
       |
       v
state A ---- simulation shader ----> state B
  ^                                  |
  |------------- next frame ---------|
                                          current + previous state
                                                   |
                      +----------------------------+-------------------+
                      |                                                |
              beauty vertex shader                            depth vertex shader
          position + direction + stretch                  same position + direction
                      |                                                |
             lit shard color pass                              shadow map pass
                      |                                                |
                      +---------------- scene + shadow ----------------+
                                               |
                                  threshold -> 3-level blur -> composite
                                               |
                                         desktop surface
```

这是一个逐帧流水线，但不是复杂的通用渲染框架。可以把它理解为：先算每个小盒子“现在在哪里”，再用现在和上一帧决定“朝哪里、拉多长”，然后画颜色、画匹配的影子，最后给亮部加柔和辉光。

### 9.2 运行时与能力检测

- 动态导入仓库内的 `vendor/three.module.min.js`，不访问 CDN。
- 需要 WebGL2、顶点纹理读取和可渲染的 float/half-float 状态纹理。
- 初始化时检测实际扩展和 framebuffer 完整性，而不是只相信浏览器 UA。
- Flow Shards 默认密度为 `96 × 96 = 9,216` 个实例；低、中、高分别是 `4,096 / 9,216 / 16,384`。
- renderer 的设备像素比上限为 `1.5`；bloom 在降分辨率缓冲区中执行。

### 9.3 GPGPU 状态纹理

每个 texel 对应一个晶片：

```text
R, G, B = 世界坐标 x, y, z
A       = 生命周期 life
```

初始化时创建确定性的 origin DataTexture，包含出生位置和 seed。两个 `WebGLRenderTarget` 交替作为 read/write：模拟 fragment shader 从 read 采样，写入新的位置和 life；下一帧交换二者。life 到期后从 origin 与 seed 重新生成，而不是在 JavaScript 中逐个更新实例。

模拟场使用基于 simplex noise 的 curl-like 向量场。配置 mapper 把“速度、漩涡大小、翻涌强度、运动范围”映射到安全的 shader 范围。JavaScript 每帧只更新少量 uniform 和交换纹理，不上传 9,216 份矩阵。

### 9.4 实例几何、朝向与拉伸

可见物体只使用一个 `BoxGeometry` 作为源几何，并转为实例化几何。每个实例额外保存自己的状态纹理 UV 与稳定随机值。

顶点 shader 同时读取：

- 新写入的状态纹理：当前位置；
- 上一张状态纹理：上一位置。

两者差值得到运动方向与速度。shader 由此构造局部朝向基底，让盒子的长轴指向运动方向，并按速度和“拖尾长度”做有限拉伸。接近零速度时使用稳定的 fallback 方向，避免归一化产生 `NaN` 或闪烁。

### 9.5 可见材质与阴影材质

可见 pass 以 Three.js 标准光照材质为基础，通过受控的 shader patch 注入状态纹理、实例朝向、位置、缩放和法线变换。场景使用一盏主方向光和低强度环境光。

投影使用匹配的 `customDepthMaterial`。位置和朝向计算抽成一段共享 GLSL 变形代码，由可见顶点 shader 与深度顶点 shader 同时引用；可见 pass 额外变换法线，depth pass 只写深度。任何影响位置、生命周期、大小或拖尾的配置都同时传入两种材质。

因此影子来自晶片真实变形后的轮廓，而不是未移动的 BoxGeometry。这是本效果不能只替换颜色 shader 的关键原因。

### 9.6 辉光合成

Three.js core 不自带项目当前可直接使用的 composer。本轮实现一个小型内部 bloom：

1. 场景先渲染到离屏目标；
2. 亮度阈值 pass 提取高光；
3. 三个降采样层级分别执行横向和纵向模糊；
4. composite pass 把辉光与原场景合成到屏幕。

调节页的单个“辉光”控件联合映射阈值和强度，不暴露多级 blur 参数。辉光关闭时允许跳过相关 pass。

### 9.7 生命周期与释放

- `running`：完整模拟与渲染。
- `focused`：模拟速度约降到正常的四分之一，辉光和视觉对比同时退让。
- `static` / 减少动态：渲染稳定首帧后停止时间推进。
- `document.hidden`：取消 RAF；恢复可见时从当前状态继续，不补算隐藏期间帧数。
- resize：更新相机、主 render target 和 bloom target；DPR 仍受上限约束。
- `destroy()`：取消 RAF、解绑 resize/context 监听，释放几何、材质、DataTexture、render target、shadow map 与 WebGLRenderer。

## 10. 失败与降级

### 10.1 桌面

- 保存的 ID 或本地配置无效：修复为已知 ID/安全默认值。
- 新候选加载、shader 编译或首帧失败：保留旧壁纸并显示非阻断状态。
- 首次加载 Flow Shards 失败且没有旧 renderer：回退到 `blue-fluid-halftone`。
- 连现有蓝色 WebGL 也无法创建：保留纯蓝 CSS 背景和完整 OS 界面。
- WebGL context lost：停止当前循环、标记诊断状态并切换到 fallback；context 恢复后可重新创建，而不是复用已失效资源。

失败不能阻断启动、窗口管理器、Photos、Pen Pen 或其他应用。

### 10.2 调节页

调节页显示人类可读错误和检测结果。GPU 不可用时禁用依赖实时预览的动作；草稿、恢复默认和配置导出仍可工作。未知 query 不产生空白页面，而是回到 Flow Shards 并显示警告。

## 11. 文件与职责边界

建议边界如下；实现计划可在不改变职责的前提下微调文件名：

```text
scripts/environment/background/
  wallpaper-registry.js          # 静态元数据、默认值、动态工厂
  wallpaper-manager.js           # 候选加载、切换、motion、销毁
  wallpaper-config.js            # 配置校验、映射、导入导出
  background-controller.js       # 环境层与 manager 的薄连接
  shader-background.js           # 现有蓝色 raw-WebGL，保留
  shader-source.js               # 现有蓝色 shader，保留
  wallpapers/flow-shards/
    index.js                      # renderer 契约与生命周期
    config.js                     # Flow Shards 默认值和语义映射
    simulation.js                 # origin/state 纹理与 ping-pong
    materials.js                  # 实例、共享变形、beauty/depth 材质
    bloom.js                      # threshold/blur/composite
    shaders.js                    # 聚焦的 GLSL 源码

modules/interactive-buttons/photos/
  photos-app.js                   # 两个页签与现有 Photos 组合
  wallpapers-view.js             # 静态卡片、详情、应用状态

setting/
  index.html
  setting.js
  setting.css

assets/background/previews/
  blue-fluid-halftone.webp
  flow-shards.webp
```

同时更新偏好校验、主页依赖注入、i18n 字符串、Photos/环境样式和对应测试。Flow Shards 的最终缩略图在实际 renderer 可用后从稳定默认配置截取并提交。

## 12. 测试策略

### 12.1 单元测试

- 注册表：ID 唯一、默认 ID 存在、三语言元数据齐全、静态读取不会执行动态 import。
- 偏好：`wallpaperId` 保存、恢复、缺失和未知值修复。
- 配置：字段白名单、clamp、密度映射、颜色校验、稳定 JSON 序列化。
- 管理器：候选成功切换、失败保留旧实例、快速连续请求只保留最后一次、motion 转发、完整 destroy。
- Flow Shards 纯逻辑：密度 tier、0–100 语义映射、零速度朝向 fallback 与 deterministic seed。
- 调节页存储：草稿与主页覆盖隔离，损坏 JSON 不阻断页面。

GPU shader 编译和最终画面不伪装成 DOM 单元测试；使用浏览器能力测试与视觉验收覆盖。

### 12.2 E2E

- Photos 默认仍显示原有 4 张照片，原照片查看器与前后导航不回归。
- Wallpapers 卡片全部使用静态图片，不创建卡片级 Canvas。
- 打开 Flow Shards 详情、点击“设为壁纸”、看到成功状态，刷新后选择仍存在。
- 注入候选失败时当前壁纸和保存 ID 均不变化。
- macOS 与 Windows 桌面均可切换，打开窗口后 renderer 收到 `focused`。
- `/setting/` 与带 query 的地址可直接加载；修改、刷新、恢复默认、应用本机和序列化输出符合预期。
- 桌面与公开导航中不存在通往 `/setting/` 的链接。
- WebGL 不可用时走蓝色/CSS fallback，OS 其余区域仍可使用。
- 重复切换多次后只剩一个活跃 surface，旧 renderer 不再推进帧。

### 12.3 视觉与性能验收

视觉验收以桌面为主：

- macOS `1440 × 900`：空桌面、Photos 壁纸详情、Flow Shards 活跃状态。
- Windows `1440 × 900`：Flow Shards 活跃状态与应用窗口聚焦状态。
- `/setting/` `1440 × 900`：参考预设和调节后的自定义状态。

验收关注：晶片流向连续、朝向稳定、拖尾不爆长、影子与实例贴合、辉光不过曝、窗口内容始终优先。默认中密度下应保持交互流畅；切换、隐藏页面和反复打开 Photos 不应持续增加 Canvas、RAF、监听器或 GPU 资源。

手机和平板不在本轮视觉/帧率验收范围内，但现有静态环境与测试套件必须继续通过。

## 13. 完成标准

满足以下条件才算功能完成：

1. Photos 的原照片体验无回归，并可通过两步操作切换壁纸。
2. `blue-fluid-halftone` 与 `flow-shards` 都由同一注册表管理，默认仍为前者。
3. Flow Shards 不加载外部 3D 模型，只在被选中或调节时加载 Three.js。
4. GPGPU、实例朝向、可见/深度共享变形和 bloom 管线在桌面端工作。
5. 刷新后壁纸选择保留，失败切换不覆盖旧偏好。
6. `/setting/` 能让不懂 shader 的作者通过 12 个直观控件完成调节、草稿保存、本机应用与 JSON 导出。
7. 页面隐藏、聚焦、减少动态、上下文丢失和销毁都有明确行为。
8. 单元、E2E、现有完整测试和桌面视觉验收全部通过。
