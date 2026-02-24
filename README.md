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

附带标签：

```bash
rote add "实现了一个新的前端组件" -t "代码,前端,React"
```

### 2) 搜索笔记

```bash
rote search "MCP"
```

## MCP 模式使用指南

启动 MCP Server：

```bash
rote mcp
```

或独立命令：

```bash
rote-mcp
```

### Claude Desktop 配置示例

```json
{
  "mcpServers": {
    "rote-toolkit": {
      "command": "npx",
      "args": [
        "-y",
        "rote-toolkit",
        "mcp"
      ]
    }
  }
}
```

### AI 可使用的能力 (Tools)

- `rote_create_note`
- `rote_search_notes`
- `rote_list_notes`

## 本地开发
[text](../../../Downloads/API-KEY-GUIDE.md)
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
