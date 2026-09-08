# 网站维护

## 旅行日记（2026-09-08）
新增 `/travel`，首页首屏之后和主导航均有入口。`app/travel/trips.ts` 保存 20 段按月份倒序排列的故事、路线和搞怪对话，`TravelJournal.tsx` 呈现年份跳转、完整海报与可展开日记。对话标注为创作演绎；角色仍为最好的朋友。`public/travel` 为原始旅行海报的 WebP 网站副本及缩略图，原图未修改。新增正文后已重新生成字体子集。

验证：`node --experimental-strip-types scripts/travel.test.mjs` 检查全部原图对应关系、日期顺序、唯一锚点与图片存在性；构建和类型检查通过，新增页面及修改的公共入口 lint 通过。全 app lint 的既有问题位于 Origin.tsx 和 Universe.tsx。本轮未进行浏览器视觉或交互测试；首页和旅行页 HTTP 预览返回 200。现有线上站点未发布此轮变更。

源码：dundun-pupu-site/app。

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
