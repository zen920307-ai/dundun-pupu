# 本地内容后台使用说明

## 启动

```bash
npm run admin
```

浏览器打开 **http://127.0.0.1:4321**（只监听本机，外部无法访问，无需登录）。

## 界面

- 顶部标签切换五个模块：主视觉 KV / 手机壁纸 / 可爱设计 / 表情包 / 出逃档案
- 列表操作（鼠标悬停显示）：`↑↓` 排序 · `下/架` 上下架 · `编` 编辑 · `删` 删除
- `+ 新增` 创建内容；搜索框按标题/标签过滤
- 编辑器里每个字段都可改；图片字段点「上传」自动传到 `public/cms-media/<模块>/` 并自动回填宽高

## 生效流程

1. **保存**：只写入本地 `content/*.json`（关页面不丢，但线上还没变）
2. **🚀 保存并发布**：自动 `git add + commit + push` → GitHub Actions 重建 → **约 1~3 分钟后线上更新**
3. 发布按钮有结果提示；push 失败（如网络/凭据问题）会把 git 输出显示出来

## 数据文件

| 模块 | 文件 |
|---|---|
| 主视觉 KV | `content/kv.json` |
| 手机壁纸 | `content/wallpapers.json` |
| 可爱设计 | `content/festivals.json` |
| 表情包 | `content/emoji.json`（空，待你填充） |
| 出逃档案 | `content/travel.json` |

- 字段结构见 `app/gallery-data.ts`（Artwork 类型）和 `app/travel/trips.ts`（Trip 类型）
- `hidden: true` = 已下架，前端不渲染
- 出逃档案不传海报时，前端自动走 `/travel/{地点}.webp` 约定路径
- 新上传的图片在 `public/cms-media/<模块>/`，随发布一起进仓库

## 注意

- **大视频别从这里传**：GitHub 单文件限 100MB，仓库建议保持 2GB 以内；大素材继续手动处理
- 线上构建状态可在仓库 Actions 页看：https://github.com/zen920307-ai/dundun-pupu/actions
- 备用方案（云端秒级实时，腾讯云开发）已在 git 历史中验证过结构，需要时可恢复
