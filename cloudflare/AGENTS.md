# cloudflare

> 项目根 → `cloudflare`

## 模块职责

Cloudflare Worker 运行时：托管前端静态资源，提供受 admin token 保护的配置 API，读取和维护 D1 配置，将订阅内容解析、过滤、模板化并输出为多种客户端格式。

## 入口与启动

- Worker 入口：`src/index.ts`；注册 `/api` 与下载路由，处理 CORS、安全响应头、下载专用主机边界和静态资源回退。
- 开发：`pnpm --dir cloudflare run dev`，会先生成脚本注册表再运行 Wrangler。
- 部署配置：`wrangler.jsonc`；入口为 `src/index.ts`，前端产物目录为 `../frontend/dist`，D1 binding 为 `DB`。

## 对外接口

- `/api/*`：由 `src/routes/api.ts` 提供，统一经 `requireAdmin` 授权；覆盖环境、设置、备份/恢复、sources、collections、templates、预览、一次性转换、下载链接、下载授权与回收站。
- `/download/source/:id[/:target]` 和 `/download/collection/:id[/:target]`：由 `src/routes/download.ts` 提供，使用下载 token 或受限授权。
- `src/types.ts` 定义 Filter DSL、订阅源、集合、模板、输出目标、下载授权与回收站记录等跨文件类型契约。

## 关键依赖与配置

- Hono 处理 HTTP；`yaml` 和 `json5` 参与订阅输入/输出处理。
- Wrangler 配置要求 `SUB_STORE_ADMIN_TOKEN`、`SUB_STORE_PUBLIC_DOWNLOAD_TOKEN` 两个 secret；应用名和下载专用域列表为 vars。
- D1 migrations 在 `migrations/` 中递增维护；`0003_compatibility_resources.sql` 创建 `download_grants` 与有界 `recycle_bin`。
- `src/lib/scripts.ts` 只调用构建时生成的脚本注册表；脚本源码不可来自 D1、浏览器或远程地址。

## 数据模型

- `sources`：远程 URL 或本地节点与 source filters。
- `collections`：sourceIds、collection filters、模板、是否忽略失败源；空 `sourceIds` 代表所有启用源。
- `templates`、`app_settings`、`download_grants`、`recycle_bin` 由 D1 存储；内置模板由代码维护而非写入 D1。
- 订阅主路径为：读取记录 → 拉取/解析 → source filters → 合并 → collection filters → 唯一命名 → 模板 → target 输出。

## 测试与质量

- `pnpm --dir cloudflare run check`：脚本注册表、Worker 与测试 TypeScript 检查。
- `pnpm --dir cloudflare run test`：Cloudflare Vitest 池应用真实 D1 migrations 并请求真实 Worker 入口。
- 测试覆盖鉴权与安全头、脚本动作、下载专用域、部分更新、空 sourceIds、导入/导出、转换、下载授权、回收站、预览、模板 CRUD、排序、分享过期、流量信息与节点信息查询。

## 常见问题

- 本地 `.dev.vars` 只能从 `.dev.vars.example` 创建并保持忽略；不要提交真实 token。
- 修改输出 target、路由或 API 记录格式时，需同步 `frontend`、`config/agent-setup.schema.json` 与 `scripts/check-worker-contract.mjs`。
- 修改表结构必须添加新的 migration，不能重写既有 migration。

## 相关文件清单

- `cloudflare/wrangler.jsonc`、`cloudflare/package.json`：部署与脚本入口。
- `cloudflare/src/index.ts`：Hono 应用和宿主边界。
- `cloudflare/src/routes/api.ts`、`cloudflare/src/routes/download.ts`：公开 HTTP 接口。
- `cloudflare/src/lib/store.ts`、`cloudflare/src/lib/subscription.ts`、`cloudflare/src/lib/rules.ts`、`cloudflare/src/lib/scripts.ts`：持久化、订阅处理、规则转换和构建时脚本。
- `cloudflare/src/types.ts`：跨模块类型契约。
- `cloudflare/migrations/`：D1 schema 演进。
- `cloudflare/vitest.config.ts`、`cloudflare/test/worker.test.ts`：Worker 集成测试。

## 精简变更记录

- 2026-08-20：建立模块 AI 上下文索引。
