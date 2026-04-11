<p align="right"><a href="./README.md">English</a> | 中文</p>

# Rote Toolkit

Rote Toolkit 是一个基于 TypeScript 的增强工具包，主要用于在终端或 AI Agents 侧连接和增强你的 [Rote](https://rote.ink) 笔记系统。基于 Rote OpenKey API 授权，即插即用，无需繁复的登录流程。

主项目仓库：[`Rabithua/rote`](https://github.com/Rabithua/rote)。

## 特性

- **CLI 模式**：通过终端快速记笔记、搜索和管理笔记。
- **MCP 模式**：作为 Model Context Protocol 服务端，让 AI (Claude/Cursor) 能够安全、规范地读写 Rote 笔记。
- **SDK 模式**：在 TypeScript/JavaScript 项目中导入 `RoteClient` 使用。
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

### 笔记操作

```bash
# 快速记录笔记
rote add "今天学到了 MCP 协议，非常有趣！"

# 附带标签、设为公开并置顶
rote add "实现了一个新的前端组件" -t "代码,前端,React" --public --pin

# 绑定到文章
rote add "章节总结" --article-id "<articleId>"

# 搜索笔记
rote search "MCP" --limit 20

# 带过滤条件搜索
rote search "MCP" --archived -t "ai,notes"

# 获取最近的笔记
rote list --limit 10 --skip 0 --archived -t "知识管理"

# 获取探索页面的笔记（无需配置 OpenKey）
rote explore --limit 20
```

### 文章操作

```bash
# 创建文章
rote article add "# 我的文章内容"

# 列出文章
rote articles --limit 20 --skip 0 -k "关键词"
```

### 反应操作

```bash
# 给笔记添加反应
rote reaction add <noteId> like

# 移除反应
rote reaction remove <noteId> like
```

### 个人资料与权限

```bash
# 获取个人资料
rote profile get

# 更新个人资料
rote profile update --nickname "新昵称" --description "个人简介"

# 检查 API Key 权限
rote permissions
```

### 统计与数据

```bash
# 获取标签统计
rote tags

# 获取活动热力图
rote heatmap --start 2024-01-01 --end 2024-12-31

# 获取账户统计
rote stats

# 获取设置
rote settings get

# 更新设置
rote settings update --allow-explore true
```

## SDK 使用指南

```typescript
import { RoteClient } from "rote-toolkit";

const client = new RoteClient();

// 创建笔记
const note = await client.createNote({
  content: "今天学到了 MCP",
  title: "学习日志",
  tags: ["日记", "ai"],
  isPublic: false,
  pin: false,
});

// 更新笔记
await client.updateNote({
  noteId: "<noteId>",
  title: "修改后的标题",
  tags: ["知识", "rote"],
  isPublic: true,
  archived: false,
});

// 搜索笔记
const results = await client.searchNotes({
  keyword: "MCP",
  limit: 20,
  skip: 0,
  tag: ["ai"],
});

// 列出笔记
const notes = await client.listNotes({ limit: 20 });

// 探索公开笔记
const explore = await client.exploreNotes({ limit: 20 });

// 文章操作
const article = await client.createArticle({ content: "# 文章" });
const articles = await client.listArticles({ limit: 20 });

// 批量操作
const batchNotes = await client.batchGetNotes({ ids: ["id1", "id2"] });

// 反应操作
await client.addReaction({ roteid: "<noteId>", type: "like" });
await client.removeReaction({ roteid: "<noteId>", type: "like" });

// 个人资料与权限
const profile = await client.getProfile();
const permissions = await client.getPermissions();

// 统计数据
const tags = await client.getTags();
const heatmap = await client.getHeatmap({ startDate: "2024-01-01", endDate: "2024-12-31" });
const stats = await client.getStatistics();

// 设置
const settings = await client.getSettings();
await client.updateSettings({ allowExplore: true });

// 附件操作
await client.batchDeleteAttachments({ ids: ["att1", "att2"] });
await client.updateAttachmentsSortOrder({ noteId: "<noteId>", attachmentIds: ["att1", "att2"] });
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
- 需要稳定可复现：固定版本号，例如 `rote-toolkit@0.5.0`

### 常见问题

- 报错 `could not determine executable to run`：通常是 `npx` 参数写法不对，确认使用 `-p rote-toolkit@... rote-mcp`。
- 报错 `unknown command 'rote-mcp'`（bunx）：需要 `--package`，例如 `bunx -y --package rote-toolkit@latest rote-mcp`。

### AI 可使用的能力 (MCP Tools)

#### 笔记
- `rote_create_note` - 创建笔记
- `rote_update_note` - 更新笔记
- `rote_delete_note` - 删除笔记
- `rote_search_notes` - 搜索笔记
- `rote_list_notes` - 列出笔记
- `rote_explore_notes` - 获取探索页笔记（无需授权）
- `rote_batch_get_notes` - 批量获取笔记（最多 100 条）

#### 文章
- `rote_create_article` - 创建文章
- `rote_list_articles` - 列出文章
- `rote_get_article_by_note` - 通过笔记获取关联文章

#### 反应
- `rote_add_reaction` - 添加反应
- `rote_remove_reaction` - 移除反应

#### 个人资料与权限
- `rote_get_profile` - 获取个人资料
- `rote_update_profile` - 更新个人资料
- `rote_get_permissions` - 检查 API Key 权限

#### 统计与数据
- `rote_get_tags` - 获取标签统计
- `rote_get_heatmap` - 获取活动热力图
- `rote_get_statistics` - 获取用户统计

#### 设置
- `rote_get_settings` - 获取用户设置
- `rote_update_settings` - 更新用户设置

#### 附件
- `rote_batch_delete_attachments` - 批量删除附件（最多 100 个）
- `rote_update_attachments_sort` - 更新附件排序

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
