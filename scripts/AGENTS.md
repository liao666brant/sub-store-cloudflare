# scripts

> 项目根 → `scripts`

## 模块职责

Node.js ESM 工具集合：引导 Cloudflare 部署、生成和校验私有安装配置、生成 D1 seed 与本地 Wrangler 配置、生成构建时脚本注册表，并提供发布、契约、文档和隐私检查。

## 入口与启动

- 主要安装器：`install-cloudflare.mjs`，由根 `pnpm run install:cloudflare` 调用。
- 设置校验：`validate-agent-setup.mjs`，由 `pnpm run seed:validate` 调用。
- 生成：`render-seed-sql.mjs`、`render-wrangler-config.mjs` 与 `generate-script-registry.mjs`。
- 安装器单元测试：`node --test scripts/test/*.test.mjs`，根别名为 `pnpm run check:installer`。

## 对外接口

- `lib/install-setup.mjs` 导出 `parseRemoteSourceUrls` 和 `createQuickSetup`，供安装器与 Node 原生测试复用。
- 安装器读取 `config/agent-setup.local.json`，创建/复用 D1、渲染本地部署配置、设置 secrets、迁移、部署、导入并通过 HTTP 检查验证。
- 非交互安装缺少私有配置时会写入示例并在部署前停止；不得绕过该保护部署示例订阅。

## 关键依赖与配置

- 仅使用 Node.js 内置模块和工作区 CLI；根包要求 Node.js 22+。
- 私有输入在 `config/agent-setup.local.json`，输出在 `cloudflare/agent.seed.local.sql` 与 `cloudflare/wrangler.deploy.local.jsonc`，均须由 `.gitignore` 覆盖。
- `config/agent-setup.schema.json` 与 `config/rule-presets.json` 是安装数据、目标格式和保守预置的事实来源。
- `config/script-plugins.json`（和被忽略的 local manifest）定义构建时脚本；注册表生成后由 Worker 代码引用。

## 数据模型

- 安装配置包含 deployment、sources、collections 和 templates；记录 ID 仅允许 1–64 位小写字母、数字、下划线与连字符。
- 配置验证保证 source 类型和 URL/content、集合引用、模板 target、filter preset 与脚本参数的正确性。
- seed 渲染把配置转换为可审阅的 D1 UPSERT SQL；生成前总是执行相同的校验。

## 测试与质量

- `check:installer` 覆盖 URL 去重、协议拒绝和保守 Daily collection 默认值。
- `check:deploy-experience`、`check:deploy-config`、`check:worker-contract`、`check:docs`、`check:open-source`、`check:history` 约束部署、兼容性、文档与隐私。
- `smoke-worker.mjs` 启动本地 Wrangler，检查旧 Service Worker 清理端点与安全响应头。

## 常见问题

- 部署前需可用 Cloudflare 登录；缺失时让用户运行 `pnpm --dir cloudflare exec wrangler login` 后再恢复安装器。
- 私有 URL、节点 URI、token 和 D1 ID 不可出现在测试 fixture、文档、日志或已跟踪文件中。
- 不要改写或删除生成的本地私有文件来“清理”状态；它们是可恢复的安装断点。

## 相关文件清单

- `scripts/install-cloudflare.mjs`、`scripts/lib/install-setup.mjs`：安装流程和可测试的快速配置逻辑。
- `scripts/validate-agent-setup.mjs`、`scripts/render-seed-sql.mjs`、`scripts/render-wrangler-config.mjs`：私有设置校验和部署输入生成。
- `scripts/generate-script-registry.mjs`：构建时脚本注册表生成。
- `scripts/smoke-worker.mjs`、`scripts/check-worker-contract.mjs`、`scripts/check-deploy-experience.mjs`：运行时、契约与部署体验检查。
- `scripts/test/install-setup.test.mjs`：安装器单元测试。
- `config/agent-setup.schema.json`、`config/rule-presets.json`、`config/script-plugins.json`：关联配置契约。

## 精简变更记录

- 2026-08-20：建立模块 AI 上下文索引。
