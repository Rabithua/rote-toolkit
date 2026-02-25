# Rote Toolkit

Rote Toolkit 是一个基于 TypeScript 的增强工具包，主要用于在终端或 AI Agents 侧连接和增强你的 [Rote](https://rote.ink) 笔记系统。基于 Rote OpenKey API 授权，即插即用，无需繁复的登录流程。

## 特性

- **CLI 模式**：通过终端快速记笔记、搜索笔记。
- **MCP 模式**：作为 Model Context Protocol 服务端，让 AI (Claude/Cursor) 能够安全、规范地读写 Rote 笔记。
- **无感鉴权**：只需一次配置 OpenKey 即可长期使用。

## 安装

> 要求 Node.js v18 或更高版本。

```bash
npm install -g rote-toolkit
```

## 配置鉴权

运行以下命令进行全局配置：

```bash
rote config
```

系统会提示你输入：

1. **Rote API URL**：例如 `https://your-rote-domain.com`
2. **OpenKey**：你的 API 密钥

凭证会保存在本地：`~/.rote-toolkit/config.json`。

## CLI 模式使用指南

### 1) 快速记录笔记

```bash
rote add "今天学到了 MCP 协议，非常有趣！"
```

附带标签、设为公开并置顶：

```bash
rote add "实现了一个新的前端组件" -t "代码,前端,React" --public --pin
```

### 2) 搜索和获取笔记

搜索包含 "MCP" 的笔记：

```bash
rote search "MCP"
```

获取最近的笔记（支持过滤归档和标签）：

```bash
rote list --limit 5 --archived -t "知识管理"
```

## MCP 模式使用指南

### 是否需要提前安装？

不需要。  
在 VS Code / Claude Desktop 里使用 `npx` 或 `bunx` 配置时，会在启动 MCP Server 时自动下载并运行 `rote-toolkit`。

仅当你希望本机直接运行命令时，才需要全局安装：

```bash
npm install -g rote-toolkit
```

### 1) 先完成凭证配置（一次即可）

```bash
rote config
```

### 2) 本机手动启动（可选，用于调试）

以下两条命令等价：

```bash
rote mcp
rote-mcp
```

### 3) Claude Desktop 配置示例

```json
{
  "mcpServers": {
    "rote-toolkit": {
      "command": "npx",
      "args": ["-y", "-p", "rote-toolkit@latest", "rote-mcp"]
    }
  }
}
```

### 4) VS Code 配置示例

```json
{
  "servers": {
    "rote-toolkit": {
      "type": "stdio",
      "command": "bunx",
      "args": ["-y", "--package", "rote-toolkit@latest", "rote-mcp"]
    }
  }
}
```

### 版本建议

- 追踪最新版：`rote-toolkit@latest`
- 需要稳定可复现：固定版本号，例如 `rote-toolkit@0.3.3`

### 常见问题

- 报错 `could not determine executable to run`：通常是 `npx` 参数写法不对，确认使用 `-p rote-toolkit@... rote-mcp`。
- 报错 `unknown command 'rote-mcp'`（bunx）：需要 `--package`，例如 `bunx -y --package rote-toolkit@latest rote-mcp`。

### AI 可使用的能力 (Tools)

- `rote_create_note`
- `rote_search_notes`
- `rote_list_notes`

## 本地开发

[API Key Usage Guide](./API-KEY-GUIDE.md)

```bash
npm install
npm run build
npm run dev -- --help
```

## 发布到 npm

首次发布前先登录：

```bash
npm login
```

自动构建 + 自动升级版本 + 发布：

```bash
npm run release:patch
```

也支持：

```bash
npm run release:minor
npm run release:major
```

发布脚本会执行：

1. 检查 git 工作区是否干净
2. 检查 npm 登录状态
3. `npm run build`
4. `npm pack --dry-run`
5. `npm version <patch|minor|major>`
6. `npm publish`
