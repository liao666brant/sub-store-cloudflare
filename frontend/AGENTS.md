# frontend

> 项目根 → `frontend`

## 模块职责

Vue 3 + Vite 管理界面：认证 token 的浏览器侧保存、订阅源与集合编辑、预览、一次性转换、下载授权、回收站、主题和中英文国际化。构建后的静态文件由 `cloudflare` Worker 托管。

## 入口与启动

- 浏览器入口：`src/main.ts`；启动时从 URL 同步管理 token，注册 Pinia、Vue Router、i18n、TDesign Vue Next 和全局样式。
- 根组件：`src/App.vue`；初始化 stores，渲染导航、侧边栏与路由视图。
- 路由：`src/router/index.ts`；`/subs`、`/my`、`/tools`、`/preview`、`/edit/:editType(subs|collections)/:id` 与兜底 404。
- 开发与构建：`pnpm --dir frontend run dev`、`pnpm --dir frontend run build`；根构建命令为 `pnpm run build:frontend`。

## 对外接口

- HTTP 客户端位于 `src/api/`，统一向同源 Worker `/api/*` 发送请求并附带 admin token。
- `src/api/app/index.ts` 承载 sources、collections、templates、转换、下载授权、回收站与备份接口；接口契约由 `cloudflare/src/routes/api.ts` 实现。
- 支持的订阅目标常量在 `src/constants/subscriptionTargets.ts`；与 Worker 类型、安装 schema 和合约检查同步维护。

## 关键依赖与配置

- Vue 3、Vue Router、Pinia、Vue I18n、Axios、TDesign Vue Next、TDesign Icons、CodeMirror 与 Vite。
- `vite.config.ts` 定义 `@` 别名、Vite 入口、TDesign 自动导入、手工 chunk 与 `VITE_PUBLIC_PATH`。
- 文案基线是 `src/locales/zh.ts`，英文为 `src/locales/en.ts`；`scripts/check-locales.mjs` 校验键、占位符与静态引用。

## 数据模型

- Pinia stores 保存订阅、集合、流量请求、设置和全局 UI 状态；持久化的业务记录仍由 Worker/D1 管理。
- 管理 token 仅由浏览器工具函数读取、写入和注入请求，不应硬编码到前端源码或构建环境。

## 测试与质量

- `pnpm --dir frontend run check:locales` 校验 locale 覆盖和静态使用。
- `pnpm --dir frontend run build` 先执行 `vue-tsc --noEmit`，再执行 Vite 生产构建。
- 单元测试位于 `tests/`，浏览器回归位于 `e2e/`；交互改动至少运行 locale 检查、单元测试、生产构建和受影响浏览器场景。

## 常见问题

- 使用 `createWebHistory()`；Cloudflare Static Assets 已配置 SPA not-found 回退，其他部署宿主需提供等效回退。
- `/tools` 的目标列表不可自行漂移，新增输出格式需要同步 Worker、schema 和合约检查。

## 相关文件清单

- `frontend/package.json`：前端脚本与依赖。
- `frontend/vite.config.ts`：构建、环境变量、别名与产物策略。
- `frontend/src/main.ts`、`frontend/src/App.vue`、`frontend/src/router/index.ts`：应用启动与路由边界。
- `frontend/src/api/index.ts`、`frontend/src/api/app/index.ts`：请求基础设施与 Worker API 封装。
- `frontend/src/store/subs.ts`、`frontend/src/hooks/useBackend.ts`：核心业务状态与后端选择。
- `frontend/src/views/Sub.vue`、`frontend/src/views/SubEditor.vue`、`frontend/src/views/Tools.vue`：主要业务视图。
- `frontend/src/locales/zh.ts`、`frontend/src/locales/en.ts`、`frontend/scripts/check-locales.mjs`：国际化事实源和校验。

## 精简变更记录

- 2026-08-20：建立模块 AI 上下文索引。
