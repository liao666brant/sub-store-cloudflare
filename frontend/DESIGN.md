# Sub-Store Cloudflare 前端设计契约

## 1. 定位与迁移边界

本契约定义管理界面迁移到 **TDesign Vue Next 原生桌面组件** 时必须遵守的视觉、交互和可访问性边界。它保留现有信息架构、路由语义、响应式语义及已持久化的主题数据；不复制 TDesign starter，不引入新的视觉框架、图标库或动画库。

设计基调是紧凑、可扫读的订阅管理工作台：页面底色与容器色形成低干扰层级，品牌蓝只承载可操作性与焦点，不作为装饰性大面积填充。桌面端优先采用 TDesign 的原生密度与状态，不将移动端 历史移动组件库 的 class、字体图标或覆写样式带入新组件。

### 迁移范围

- 使用 TDesign 的原生 `Button`、`Form`、`Input`、`Select`、`Table`、`List`、`Dialog`、`Drawer`、`Popup`、`Tabs`、`Message`/`Notification` 与 loading 组件；组件具体选型须保持现有页面的任务和信息架构不变。
- 下列 token 是**迁移目标别名**，用于将现有 CSS 变量映射到 TDesign 语义变量；它们不是对现有运行时代码已经存在 `--td-*` 变量的声明。
- 不新增主题 ID、不改写 `settings.theme` 的持久化形状；`light`、`dark` 与 `auto` 的行为见第 3 节。

## 2. 证据与术语

本文的“来源”均是当前实现的文件及行号；值来自 `light` / `dark` 基础主题，避免将其它可选主题误当为默认迁移目标。`TDesign token` 是后续组件迁移应消费的目标语义名；运行时的实际 CSS 变量名须以当时已安装 TDesign Vue Next 版本为准。

| 术语 | 含义 | 来源 |
| --- | --- | --- |
| 基础 light | `light` 主题，标签为 `light` | `src/themes/light.ts:1-7` |
| 基础 dark | `dark` 主题，标签为 `dark` | `src/themes/dark.ts:1-7` |
| 主题应用 | 主题颜色与通用变量写入 `:root`，并同步 `meta#theme__color` 与 `body` 背景 | `src/hooks/useThemes.ts:61-77` |
| 通用几何 | 安全边距 `16px`、卡片圆角 `12px` | `src/hooks/useThemes.ts:9-13` |

## 3. 主题模型、Tokens 与语义色板

### Theme ID 契约

| 持久化/模式 | 选择规则 | token 解析结果 | 来源 |
| --- | --- | --- | --- |
| `light` | 非自动模式下按 `theme.name` 选择基础日间主题 | 使用第 3 节 light 列 | `src/hooks/useThemes.ts:115-125`、`src/themes/light.ts:1-51` |
| `dark` | 非自动模式下按 `theme.name` 选择基础夜间主题 | 使用第 3 节 dark 列 | `src/hooks/useThemes.ts:115-125`、`src/themes/dark.ts:1-52` |
| `auto` | `theme.auto === true` 时，深色系统偏好选择 `theme.dark`，否则选择 `theme.light`；监听系统偏好变化 | 仅在两项均存在时切换，不创建第三套颜色 | `src/hooks/useThemes.ts:7,108-125` |

当前默认持久化值是 `auto: true`、`name: "light"`、`dark: "dark"`、`light: "light"`；迁移不得重命名或删除这些值。来源：`src/store/settings.ts:99-103`。

### 全部现有 Theme ID 保留矩阵

`useThemes` 以文件名作为 theme ID，并在声明 `extend` 时先合并父主题再以当前主题覆盖；因此每一项都必须保留，而不是只迁移 `light`/`dark`。来源：`src/hooks/useThemes.ts:25-57`。

| theme ID | 标签/继承 | 保留的 TDesign 语义 token 映射 | 未显式覆盖的 token 策略 | 来源 |
| --- | --- | --- | --- | --- |
| `light` | light / 无 | `--td-brand-color:#478EF2`、`--td-error-color:#E56459`、`--td-success-color:#0ED57D`、`--td-bg-color-page:#F4F4F4`、`--td-bg-color-container:#FAFAFA`、`--td-text-color-primary:#303133` | 此主题是 light 基线；所有第 3 节列出的 light token 原样映射 | `src/themes/light.ts:5-6,10-41` |
| `dark` | dark / 无 | `--td-brand-color:#478EF2`、`--td-error-color:#E56459`、`--td-success-color:#49BB88`、`--td-bg-color-page:#121212`、`--td-bg-color-container:#202020`、`--td-text-color-primary:#FFFFFFEE` | 此主题是 dark 基线；所有第 3 节列出的 dark token 原样映射 | `src/themes/dark.ts:5-6,10-41` |
| `lightblue` | light / `light` | `--td-brand-color:#A5CCEE`、`--td-error-color:#FF5A4C`、`--td-success-color:#49BB88`；页面/容器/文本保留 light 值 `#F4F4F4/#FAFAFA/#303133` | 保留自身显式颜色；遗漏项按 `light` 合并，不降级为基础蓝 | `src/themes/lightblue.ts:5-6,10-41`；`src/hooks/useThemes.ts:40-57` |
| `mocha` | light / `light` | `--td-brand-color:#75ABCD`、`--td-error-color:#B53A29`、`--td-success-color:#0ED57D`、`--td-bg-color-page:#F5F3EE`、`--td-bg-color-container:#ECE7DF`、`--td-text-color-primary:#443623` | `icon`、picker mask、`img-brightness` 等未定义值从 `light` 合并；保留摩卡色表，不以默认 light 色替换已覆盖 token | `src/themes/mocha.ts:5-6,10-42`；`src/hooks/useThemes.ts:40-57` |
| `darkblue` | dark / `dark` | `--td-brand-color:#6F9CC5`、`--td-error-color:#C16058`、`--td-success-color:#49BB88`、`--td-bg-color-page:#141416`、`--td-bg-color-container:#212126`、`--td-text-color-primary:#BCBAC1` | 当前文件已覆盖核心语义；遗漏项从 `dark` 合并 | `src/themes/darkblue.ts:5-6,10-50`；`src/hooks/useThemes.ts:40-57` |
| `monokai` | dark / `dark` | `--td-brand-color:#ED7283`、`--app-brand-gradient-end:#F19F67`、`--td-bg-color-page:#19181A`、`--td-bg-color-container:#2C2A2E`、`--td-text-color-primary:#FCF9F4` | `error`、`success`、分隔线、popup 及 disabled 等未显式值从 `dark` 合并；不得把它们设为空或回退浏览器默认值 | `src/themes/monokai.ts:5-6,10-26`；`src/themes/dark.ts:15-41`；`src/hooks/useThemes.ts:40-57` |
| `pureblack` | dark / `dark` | `--td-brand-color:#6F9CC5`、`--td-error-color:#C16058`、`--td-success-color:#49BB88`、`--td-bg-color-page:#000`、`--td-bg-color-container:#242427`、`--td-text-color-primary:#BCBAC1` | TDesign 输入控件不再消费遗留 `旧输入控件` token；其显示色降级为 `--td-text-color-primary:#BCBAC1`，其余遗漏项从 `dark` 合并 | `src/themes/pureblack.ts:5-6,10-56`；`src/hooks/useThemes.ts:40-57` |
| `sereneblues` | dark / `dark` | `--td-brand-color:#6F9CC5`、`--td-error-color:#C16058`、`--td-success-color:#49BB88`、`--td-bg-color-page:#353642`、`--td-bg-color-container:#444654`、`--td-text-color-primary:#BCBAC1` | 当前文件已覆盖核心语义；遗漏项从 `dark` 合并 | `src/themes/sereneblues.ts:5-6,10-50`；`src/hooks/useThemes.ts:40-57` |

`auto` 不是新主题 ID：它继续从已持久化的 `theme.dark` / `theme.light` 读取任意上述 dark/light 标签 ID，并随系统偏好切换。来源：`src/hooks/useThemes.ts:108-125`、`src/store/settings.ts:99-103`。

### 语义颜色映射

| 角色 | TDesign token（目标） | light | dark | 当前来源 |
| --- | --- | --- | --- |
| 品牌/主要操作 | `--td-brand-color` | `#478EF2` | `#478EF2` | `src/themes/light.ts:10`；`src/themes/dark.ts:10` |
| 品牌渐变终点（仅通知类既有语义） | `--app-brand-gradient-end` | `#496AF2` | `#496AF2` | `src/themes/light.ts:11`；`src/themes/dark.ts:11` |
| 次要强调 | `--app-accent-secondary` | `#FA6419` | `#FA6419` | `src/themes/light.ts:12`；`src/themes/dark.ts:12` |
| 成功 | `--td-success-color` | `#0ED57D` | `#49BB88` | `src/themes/light.ts:16`；`src/themes/dark.ts:16` |
| 错误/危险 | `--td-error-color` | `#E56459` | `#E56459` | `src/themes/light.ts:15`；`src/themes/dark.ts:15` |
| 页面底色 | `--td-bg-color-page` | `#F4F4F4` | `#121212` | `src/themes/light.ts:24`；`src/themes/dark.ts:24` |
| 常规容器/弹出层 | `--td-bg-color-container` | `#FAFAFA` / `#F4F4F4` | `#202020` / `#121212` | `src/themes/light.ts:27,29`；`src/themes/dark.ts:27,29` |
| 对话框容器 | `--app-dialog-color` | `#F8F8F8` | `#202020` | `src/themes/light.ts:30`；`src/themes/dark.ts:30` |
| 弱分隔线 | `--td-component-stroke` | `#00000006` | `#FFFFFF08` | `src/themes/light.ts:28`；`src/themes/dark.ts:28` |
| 主文本 | `--td-text-color-primary` | `#303133` | `#FFFFFFEE` | `src/themes/light.ts:38`；`src/themes/dark.ts:38` |
| 次文本 | `--td-text-color-secondary` | `#606266` | `#FFFFFFBB` | `src/themes/light.ts:39`；`src/themes/dark.ts:39` |
| 辅助/占位文本 | `--td-text-color-placeholder` | `#909399` | `#FFFFFF88` | `src/themes/light.ts:40`；`src/themes/dark.ts:40` |
| disabled 文本/图标 | `--td-text-color-disabled` | `#C0C4CC` | `#FFFFFF36` | `src/themes/light.ts:41`；`src/themes/dark.ts:41` |
| 非重点图标 | `--app-icon-muted` | `#00000034` | `#FFFFFF34` | `src/themes/light.ts:20`；`src/themes/dark.ts:20` |

规则：TDesign 原生状态优先使用该组件的语义 token；迁移不得在组件内写入新的裸色值。通知使用 TDesign Message 的语义类型，而非自定义渐变表面。

## 4. Typography、间距、圆角与层级

### 字体与字号

| token | 值/规则 | 来源 |
| --- | --- | --- |
| `--app-font-sans` | 保留 `Roboto`, `Noto Sans`, Arial、PingFang SC、思源黑体、Microsoft YaHei、ST Heiti、SimHei、sans-serif；第三方 UI 图标不使用字体回退 | `src/App.vue` |
| `--app-font-mono` | 仅代码/配置编辑区域可使用现有 `JB` 字体；普通管理 UI 不以等宽字体作为正文 | `src/assets/styles/fonts.scss:20-24` |
| `--td-font-size-body-medium` | `14px`；普通正文、辅助说明与链接不得低于此值 | TDesign typography token |
| `--td-font-size-title-medium` | `18px`；空状态标题等页面内标题 | TDesign typography token |
| 行高 | 表单和列表跟随 TDesign 原生行高；长中文文案保持可换行，不以固定高度裁切 | 本迁移契约 |

### 空间与密度

| token | 值 | 用途 | 来源 |
| --- | --- | --- | --- |
| `--app-space-inline-safe` | `16px` | 页面窄屏安全内边距、容器侧边距 | `src/hooks/useThemes.ts` |
| `--app-space-compact` | `6px` | 图标与表单标签的紧凑间距 | `src/hooks/useThemes.ts` |
| `--app-space-control` | `10px` | 紧凑操作组的既有横向间距 | `src/hooks/useThemes.ts` |
| `--app-space-standard` | `12px` | 空状态标题/链接的垂直节奏 | `src/hooks/useThemes.ts` |
| `--app-space-block` | `24px` | 独立区块、浮层底部留白 | `src/hooks/useThemes.ts` |

密度规则：管理表单和列表使用 TDesign 的紧凑（`small`）尺寸；标签与控件对齐、单行操作优先，长地址/令牌/订阅名称可换行或截断但不可撑出横向滚动。不得把页面全部改为“卡片大留白”布局。此规则保持既有紧凑表单图标槽 `20px` 和 tab 文本 `12px` 的信息密度，来源：`src/assets/styles/overwritten_css_var.scss:64-75,240-258`。

### 圆角、边框与 elevation

| token | 值/策略 | 来源 |
| --- | --- | --- |
| `--td-radius-default` | `12px`；常规卡片、表单分组与桌面弹出容器 | `src/hooks/useThemes.ts` |
| `--app-radius-overlay` | `8px`；现有居中 tab 面板 | `src/hooks/useThemes.ts` |
| `--app-radius-nav` | `20px`；仅悬浮 tabbar/导航胶囊 | `src/assets/styles/mixins.scss:41-44` |
| `--td-component-stroke` | 见第 3 节；以弱分隔线建立层次 | `src/themes/light.ts:28`；`src/themes/dark.ts:28` |
| elevation | 常规内容不加自定义投影；overlay 采用 TDesign 原生遮罩与层级，卡片靠容器色/弱分隔线区分 | 现有 tabbar 明确无阴影：`src/assets/styles/custom_variables.scss:40-43`；既有 popup/dialog 色：`src/themes/light.ts:27,30`、`src/themes/dark.ts:27,30` |

## 5. 原生组件、状态与图标

### 可复用 primitives

| primitive | 结构/密度 | 必须状态 | 可访问性与布局 |
| --- | --- | --- | --- |
| 表单字段 | TDesign `FormItem` + 输入/选择控件；紧凑尺寸 | 默认、hover、focus、填写、error、disabled、readonly | label 与控件程序化关联；错误信息在字段旁可感知；长值不裁切焦点 |
| 数据列表/表格 | TDesign `Table` 或 `List`；紧凑行高与操作列 | loading、empty、hover、selected、error、disabled action | 空态说明下一步；表格窄屏改为单列/详情，不横向拖动主内容 |
| 主/次/危险操作 | TDesign `Button` 的现有语义变体，不以颜色手写区分 | default、hover、active、focus-visible、loading、disabled | 键盘可达；loading 保留标签或无障碍名称 |
| overlay | TDesign `Dialog`/`Drawer`/`Popup`；遮罩上方只留一个活动表面 | open、closing、loading、error | 打开后焦点进入容器，Esc/关闭控件返回触发点，背景不可操作 |
| 导航与 tabs | TDesign `Menu`/`Tabs`；保留当前路由与信息架构 | default、active、hover、focus-visible、disabled | 当前项有文字和非颜色提示；窄屏可换行或收纳 |

### 状态契约

- **focus-visible**：所有可交互 TDesign 组件必须保留可见焦点环，以 `--td-brand-color` 为语义来源；禁止移除焦点指示。
- **error**：字段校验、危险确认与错误通知使用 `--td-error-color`，文本错误不只靠颜色。
- **disabled/readonly**：不可用文本、图标和选择控件映射 `--td-text-color-disabled`，并保留禁用语义。
- **overlay**：popup、dialog、picker 与导航浮层使用第 3 节容器色和 TDesign 原生遮罩；浮层内容本身可滚动，最大高度受视窗约束。

### 图标规则

- 所有第三方 UI 图标统一使用 TDesign Icons Vue Next；不再迁移 历史移动组件库 字体图标、历史第三方图标库 或 emoji。
- 项目自有 SVG 仅在通过审核后保留：必须有明确产品含义、可访问名称/隐藏策略、`currentColor` 或主题 token 着色、`viewBox`，且不与 TDesign 图标语义重复。审核结果应与组件迁移 PR 一同记录。
- 不保留字体图标、全局图标注册或未使用的图标构建插件。

## 6. 动效与减少动画

| token/规则 | 契约 | 当前来源 |
| --- | --- | --- |
| `--app-motion-standard` | `300ms`；仅用于已有 picker/overlay 等有明确空间变化的组件，迁移优先采用 TDesign 原生 transition | 本迁移契约 |
| `--app-motion-loading` | `1s linear infinite`；仅 loading 图标，不用于装饰性旋转 | TDesign loading primitive |
| 属性限制 | 只动画 `transform`、`opacity`、必要时 `filter`；不动画布局尺寸或滚动位置 | 本迁移契约 |
| 减少动画 | `prefers-reduced-motion: reduce` 下，非必要 animation/transition 为 `0s`，滚动为 `auto` | `src/assets/styles/reduced-motion-fix.scss:10-18` |

减少动画不移除操作反馈、错误文案、焦点或 loading 语义；`reduced-motion-fix.scss` 对非必要动画统一归零。

## 7. 响应式与滚动所有权

### 三个验收宽度

| 宽度 | 布局契约 | 现有响应式证据 |
| --- | --- | --- |
| 375px | 单列主内容；`16px` 安全侧边距；导航/操作可收纳或换行；主内容无横向滚动 | 容器在 `600px` 前为 `width:100%`，来源：`src/assets/styles/mixins.scss:1-7`；安全边距来源：`src/hooks/useThemes.ts:9-13` |
| 768px | 保留桌面式工作区，主容器 `630px`；编辑 tabs 可有 `12px` 文本和 `12px` 圆角 | `src/assets/styles/mixins.scss:9-11`；`src/assets/styles/overwritten_css_var.scss:44-47,64-75` |
| 1280px | 主容器最大 `900px`；保持密度，不因宽屏放大控件/字级；侧栏与主内容按现有可见性语义协作 | `1200px` 起最大 `900px`：`src/assets/styles/mixins.scss:17-19` |

### 滚动所有权

- 目标 shell：应用壳、顶部导航与桌面侧栏不参与页面滚动；每个路由页面的主内容区域是该区域唯一的纵向滚动 owner。全屏布局以后续实现的 `100dvb`/有界 grid 或 flex shell 保证，而非将滚动分散给祖先和子元素。
- overlay：仅浮层内容区在超过视窗时滚动；背景页面锁定，避免双滚动条。
- 表格/列表：主内容优先纵向滚动；375px 时将列折叠为详情，不让主内容出现二维滚动。超长 URL、订阅令牌和节点名称需要换行、截断或 `min-inline-size:0` 的实现策略。
- 当前债务：`#app` 同时声明 `overflow:hidden` 与 `overflow-y:auto`，`.page-body` 也声明 `overflow:auto`，可能造成滚动 owner 不唯一；迁移时必须通过实际 375/768/1280 视图验证后收敛。来源：`src/App.vue:45-70`。

## 8. CJK 与无障碍约束

- 目标为 WCAG 2.2 AA：普通文本最少 4.5:1、较大文本至少 3:1；状态除颜色外还需文字、图标或结构提示。
- 保留第 4 节的 CJK 字体回退；中文/英文切换、长订阅名、无空格 URL、token 与代码片段均不得造成主内容横向溢出。来源：`src/App.vue:45-49`。
- 正文与辅助文本最小 `14px`，使用真实 `label`、表头、按钮名称和错误信息；不要用图标单独表达关键操作。现有正文/辅助文案为 `14px`，来源：`src/assets/styles/global.scss:49-57`。
- 所有表单、列表操作、tabs、drawer/dialog、菜单和关闭控件必须可用键盘完成；overlay 需要焦点管理，关闭后恢复至触发元素。
- 尊重 `prefers-reduced-motion`；不得以自动轮播、闪烁或仅 hover 才出现的关键操作妨碍认知与键盘使用。现有减少动画规则见 `src/assets/styles/reduced-motion-fix.scss:10-39`。

## 9. 已接受的迁移债务与验收

| 债务 | 位置/影响用户 | 接受理由与退出条件 |
| --- | --- | --- |
| 主题自定义别名与 TDesign token 并行 | `src/themes/*.ts`、`src/hooks/useThemes.ts`；所有主题用户 | `useThemes` 在保留持久化颜色表的同时写入完整 TDesign 语义 token；三种主题模式均须通过浏览器验证。 |
| 焦点环需持续回归验证 | 所有键盘用户 | 使用 TDesign 原生 focus-visible；每次更改表单、弹层或导航均需运行键盘 QA。 |
| 双滚动候选 | `src/App.vue:57,64,69`；触屏、触控板和小屏用户 | 在 375/768/1280 的真实内容压力测试确认唯一 owner 后收敛，未验证前不宣称已解决。 |
| 减少动画需要持续验证 | `src/assets/styles/reduced-motion-fix.scss`；前庭障碍用户 | 不保留动画例外；每个新增反馈组件均需在减少动画模式测试。 |

### 后续组件迁移验收清单

- 每个新增/迁移的原生 TDesign 组件只使用本契约的语义 token、字体、密度、圆角与层级规则。
- 在 light、dark、auto 三种模式检查品牌、文本、容器、错误、成功、disabled 与 overlay 状态。
- 在 375、768、1280px 检查空态、长中文、长 URL/无空格字符串、loading、error、disabled、focus-visible 和 overlay。
- 生产 UI、SCSS、依赖与主题持久化改动必须保持本契约，并在视觉与键盘 QA 后交付。
