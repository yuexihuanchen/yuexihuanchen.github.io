# yuexihuachen 的个人博客

基于 [Hexo](https://hexo.io/) 8 + [hexo-theme-aircloud](https://github.com/aircloud/hexo-theme-aircloud) 主题的个人博客，部署于 GitHub Pages（https://yuexihuanchen.github.io ）。

## 快速开始

```bash
# 安装依赖（本仓库使用 pnpm，也可换用 npm/yarn）
pnpm install

# 本地预览：启动后访问 http://localhost:4000
pnpm server

# 生成静态页面到 public/
pnpm build

# 清理缓存与上次生成的文件（预览出现异常时先执行这个）
pnpm clean
```

> Hexo 版本以 `package.json` 中 `hexo.version` 为准（当前 8.1.2），建议用 Node.js 20+。

## 写一篇新文章

```bash
hexo new post "文章标题"
```

生成的 Markdown 文件位于 `source/_posts/`，编辑后 `pnpm server` 实时预览，确认无误后提交并部署。

## 部署

本项目通过 [hexo-deployer-git](https://github.com/hexojs/hexo-deployer-git) 发布：

```bash
pnpm deploy
```

它会将 `public/` 下的生成结果推送到 `_config.yml` 中 `deploy:` 段配置的仓库和分支（当前为本仓库 `master`），由 GitHub Pages 展示。

## 目录结构

| 路径 | 说明 |
|---|---|
| `source/_posts/` | 博客文章（Markdown） |
| `source/` | 站点资源：页面、图片、草稿等 |
| `themes/` | 主题文件（aircloud） |
| `_config.yml` | 站点配置：标题、作者、社交链接、部署方式等 |
| `_config.landscape.yml` | landscape 主题备用配置 |
| `scaffolds/` | 新建文章的模板 |
| `node_modules/` `public/` `db.json` | 本地安装/构建产物，不提交 |

## 常见问题

- **本地预览样式异常**：先 `pnpm clean && pnpm server`。
- **换电脑迁移**：把本仓库 clone 下来后 `pnpm install` 即可恢复写作环境；生成结果（`public/`）不需要迁移。
