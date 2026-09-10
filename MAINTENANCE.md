# 网站维护

## 2026-09-08 片尾定格在亮白帧（不播自带淡出段）
- 探测：视频 30.08s，语音 29.21s 已结束（silencedetect），29.5s 帧仍亮白，~29.55s 起片尾自带压暗淡出，末帧暗灰。之前的「播完变暗」= 片尾淡出段 + hero-shade 双重叠加。
- 修复：page.tsx 定 `VIDEO_STOP_TIME = 29.45`，rAF 循环在播放中到达该点即 pause 并视为播完（endedRef + heroEnded），定格在亮白帧；hero 加 `hero-ended` 类，`.hero-shade` 过渡淡出（0.9s）。手动播放按钮对「已定格」视频（currentTime ≥ 29.45 或 ended）先归零再播，遮罩恢复；从头播放按钮同步处理。onEnded 保留作兜底。
- 验证：playwright 实测定格 t=29.47、shade opacity 0、滚动/鼠标不动不重播、手动播放从 0 重播且遮罩恢复；tsc 通过。
- 注意：定格后 hero 白色标题在白底上对比度低——已跟进：`.hero.hero-ended` 下 hero-top/hero-bottom/eyebrow/h1/hero-desc 切深色 #22221f（0.9s 过渡与遮罩淡出同步），重播恢复白色，实测可读性正常。

## 2026-09-08 首屏视频禁止自动重播
- 问题：视频播完后，任何触发 IntersectionObserver 回调的动作（轻微滚动、鼠标滚轮、动效位移）都会调用 `play()`，而对已播完的视频调 `play()` 会从头重播。
- 修复：`page.tsx` 新增 `endedRef` 守卫——`onEnded` 置 true，`attempt()` 自动播放路径直接跳过；手动播放按钮和「从头播放」按钮点击时清掉标记（播放按钮对已播完视频先归零再播）。滚动离开首屏再回来、切标签页回来都不会重播；刷新或从其他页回首页属全新加载，自动播放行为不变。
- 验证：playwright 实测播完后鼠标移动/滚轮/滚走再回均保持暂停，手动点播放从 0 重播；tsc 通过，lint 仅剩 page.tsx 既有 4 条 no-html-link 保留项。

## 2026-09-08 弹窗修复与首屏视频调整
- 图片预览弹窗（KV / 壁纸 / 首页原稿，出逃档案除外）底部空白根因是 `.art-dialog` 的 `inset:0 + margin:auto` 把高度拉伸到 94svh；改为 `left/top 50% + translate:-50% -50%` 后高度收缩到内容实际高度。注意 Tailwind v4 的 `-translate-x/y-1/2` 使用 `translate` 属性，`.art-dialog` 需用 `transform:none` 防止双重偏移。
- 下载按钮改为图片内部正下方 overlay（`.art-stage` + `.art-download-overlay`），新增 `app/download.ts`：所有图片下载经 canvas 转为 PNG；移动端（触屏+移动 UA）走 Web Share 系统面板可直接存相册，桌面直接下载 .png。壁纸卡片「带它走」同步改。源文件仍为 WebP，仅下载产物转 PNG。Universe 原稿弹窗新增下载按钮。
- 首屏视频只播放一遍（移除 loop），移除画质下拉框，固定播放 intro-enhanced-1080.mp4（加载失败静默回落 720p）。相关 `.video-quality` 样式已清理。
- 出逃档案 travel 弹窗保持不变。验证：tsc、build、lint（无新增错误）、playwright 桌面 1440×1000 与移动 390×844 实测通过，PNG 转换与 console 零错误确认。

## 2026-09-08 互动与画质精修

`app/polish.css` 是按原有黑白橙方向实现的精修层，最后导入。`ExperienceMotion.tsx` 负责首屏入场、阅读进度、分区线、角色视差、按钮磁吸和仅在可见区运行的贴纸浮动；系统减少动态效果及顶部动效开关会关闭新增动画。四张情绪素材改用高清透明角色原有网站副本，独立点击回应，抽选分层揭晓且避免抽到当前状态。保留已有 24 款情绪、40 条任务与测验内容。

`sound.ts` 定义 10 类低音量合成音色；SiteHeader 统一解锁、节流和静音，保留本机声音偏好。视频音轨与互动音效仍分别控制。没有添加循环背景音乐。题目切换、结果、纸签、作品入口和按钮各自提供反馈。

原片为 1280×720、约 7.98 Mbps，旧网站副本约 0.72 Mbps。新增 `intro-enhanced-1080.mp4`（1920×1080、约 4.40 Mbps、17 MB）由原片 Lanczos 放大、轻度锐化、CRF 18 编码得到，属于插值增强，不是 AI 超分或原生 1080p。`intro-original-720.mp4` 是原片重新高质量编码的 720p 版本（7.6 MB）；播放器提供画质切换并保持时间位置与暂停状态。原始素材及旧网站视频均未覆盖。两种新视频时长均 30.08 秒，保留 AAC 音轨；封面从增强版 3 秒位置抽取。

验证：生产构建、TypeScript、随机池及素材回归 5 项通过；新增动效/声音模块和 Universe/Playground lint 通过。page/SiteHeader 的既有原生站内 a 链接仍触发 Next 链接 lint 规则，本轮保留原导航行为。首页本地 HTTP 200。未执行浏览器视觉或交互自动化验证。公开站点发布需要在本地预览后确认。

## 旅行日记（2026-09-08）
新增 `/travel`，首页首屏之后和主导航均有入口。`app/travel/trips.ts` 保存 20 段按月份倒序排列的故事、路线和搞怪对话，`TravelJournal.tsx` 呈现年份跳转、完整海报与可展开日记。对话标注为创作演绎；角色仍为最好的朋友。`public/travel` 为原始旅行海报的 WebP 网站副本及缩略图，原图未修改。新增正文后已重新生成字体子集。

验证：`node --experimental-strip-types scripts/travel.test.mjs` 检查全部原图对应关系、日期顺序、唯一锚点与图片存在性；构建和类型检查通过，新增页面及修改的公共入口 lint 通过。全 app lint 的既有问题位于 Origin.tsx 和 Universe.tsx。本轮未进行浏览器视觉或交互测试；首页和旅行页 HTTP 预览返回 200。现有线上站点未发布此轮变更。

源码：dundun-pupu-site/app。

## 上线
站点仓库：https://github.com/zen920307-ai/dundun-pupu
GitHub Pages 自动从 master 构建。自定义域名 `dun.zenslab.top`。
DNS 必须把 `dun` 做成 CNAME 到 `zen920307-ai.github.io`（不要再指向 custom-domains.chatgpt.site）。
ChatGPT Sites 的预览会过期，所以会经常打不开。

## 更换首屏视频
替换 public/media/intro.mp4；建议MP4 / H.264编码并带音轨。可同时替换 public/media/poster.jpg 和 public/media/intro.vtt，字幕必须与新视频一致。若使用其他文件名，编辑 app/content.ts 的 INTRO_VIDEO。

默认声音已开启；尝试有声自动播放。浏览器拒绝时显示「点一下，有声开场」。视频可见比例低于50%时暂停，标签页隐藏时暂停。用户手动暂停后，返回首屏不会擅自续播。系统减少动态效果偏好下不自动播放。
浏览器限制参考：https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay 。

## 内容和素材
角色形象档案：../ip-memory/CHARACTERS.md。
原创素材不覆盖；网站版本在 public/media。透明图生成提示词及透明通道检查说明在 ../ip-memory/generated/README.md。
app/Universe.tsx 控制情绪现场、季节同行、离谱开关、作品手账和原稿大图。app/page.tsx 控制首页、角色介绍、四段日常与设计师部分。完整设计稿出现在点击作品后打开的大图弹层。12 张主图使用不同原稿，装饰图不得覆盖主图。

2026-09-08 精细化调整：主体内容最大 1660px，只限制设计师区 1360px、页脚 1400px，背景仍然铺满。不要再叠加全局 section max-width。中文标题用站酷快乐体，正文用霞鹜文楷，均自托管 WOFF2；许可见 public/fonts/*OFL.txt。源字体分别来自 Google Fonts 的 zcoolkuaile 和 lxgw/LxgwWenKai 官方仓库。修改文案后运行 scripts/subset-fonts.py 重新生成字体子集。

app/playful-content.ts 存放扩展随机内容与不重复抽取逻辑：24 种情绪、40 个任务、32 条离谱签、40 句角色回应、20 道测试题（每轮 3 道）。一轮抽完才洗牌；测试跨轮抽取也保证同一组问题不重复。

## 验证
执行 npm run build、npm exec tsc -- --noEmit、npm exec oxlint -- app。
首版构建、类型检查及页面代码检查通过，主页和引用素材返回200。
全仓 lint 在脚手架自带的未使用组件（components/ui）及 use-mobile hook 中有既有错误；未为页面工作修改这些供应组件。

此次浏览器检查：1440×1000 桌面和 390×844 手机；中文字体实际呈现、情绪卡、作品区、测试模块、设计师区、首屏视频。连续点击 24 次情绪和 40 次任务，分别获得 24/40 条不同内容；三题完成、结果和换题正常；设计稿切换与关闭正常，修复弹层重复位移。图片无已加载失败项，手机没有横向溢出；首屏有声播放，离开首屏暂停。关闭动效后季节照片仍全部可阅读。

随机逻辑回归：node --experimental-strip-types --test scripts/content.test.mjs（覆盖轮内唯一、跨轮相邻不重复、三道题独立、内容池数量）。

## 内容后台 CMS（2026-09-10）
新增 `/admin` 内容后台 + 腾讯云开发 CloudBase 数据层，线上内容可实时管理。数据层 `lib/cms.ts`（SDK 懒加载分包、匿名登录读、用户名密码登录写、watch 实时订阅）+ `lib/cms-config.ts`（只需填环境 ID `CMS_ENV_ID`，留空则全站走静态数据兜底）。四个模块接入 `useCmsModule` hook：Collection（kv/wallpapers）、FestivalGallery（festivals）、TravelJournal（travel）；静态数组保留为兜底，云端成功后接管。出逃档案补了显式 `poster`/`posterThumb` 字段（Trip 类型，trips.ts），不填沿用 `/travel/{place}.webp` 约定路径。后台功能：五模块切换（含表情包预备）、列表搜索/排序/上下架/删除、全字段编辑、图片视频上传（自动量尺寸回填宽高）、一键导入静态数据作为初始内容。集合 `cms_items`，文档结构 `{_id, module, sort, visible, ...字段}`。配套文档 CLOUDBASE-SETUP.md（开通环境/身份验证/安全域名/权限规则/导入流程）。顺手修复既有问题：`Artwork` 类型补 `original?: string`（9-8 下载功能遗漏）、`downloadOriginal` 接受 undefined。
验证：tsc --noEmit 零错误；oxlint app/admin + lib 零错误（全仓既有错误未动）；npm run build 通过，/admin 路由生成。未做浏览器实测（云环境尚未开通，CMS 路径走不到）。

## 本地内容后台（2026-09-10 晚，替代云端方案）
方案改为本地后台 + Git 自动发布（用户确认，零成本长期可用；云端 CloudBase 方案因 PG 环境不支持文档库 + 免费层到期限制而放弃）。内容从代码外置到 `content/*.json`（kv/wallpapers/festivals/travel/emoji 五个文件，由 TS 一次性导出生成），`gallery-data.ts` / `trips.ts` 改为 JSON 引用 + hidden 过滤。新增 `admin-local/`（server.mjs 无依赖 node:http 服务 + admin.html 原生 JS 界面）：五模块增删改查、排序（数组直接换位）、上下架（hidden 标记）、图片上传（`public/cms-media/<模块>/`，自动量尺寸回填宽高）、搜索；「保存并发布」= git add/commit/push origin master，GitHub Pages 约 1~3 分钟生效。服务只监听 127.0.0.1:4321，无需登录；`npm run admin` 启动。app/admin 与 lib/cms* 已删除，@cloudbase/js-sdk 已卸载；Artwork/Trip 类型新增 `hidden?: boolean`。前端渲染逻辑零改动（Collection/FestivalGallery/TravelJournal 恢复直读数组，出逃档案保留 poster/posterThumb 回退逻辑）。
验证：tsc 零错误、build 通过（/admin 路由已不存在）；本地服务实测 schema/读取/保存/上传 API 全通；Playwright 实测界面（21 条 KV 缩略图全载、travel 20 条、编辑器打开、模块切换、零 JS 报错）。发布链路未实测 push（等拯第一次真实发布）。
