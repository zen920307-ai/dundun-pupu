# 网站维护

源码：dundun-pupu-site/app。

## 更换首屏视频
替换 public/media/intro.mp4；建议MP4 / H.264编码并带音轨。可同时替换 public/media/poster.jpg 和 public/media/intro.vtt，字幕必须与新视频一致。若使用其他文件名，编辑 app/content.ts 的 INTRO_VIDEO。

默认声音已开启；尝试有声自动播放。浏览器拒绝时显示「点一下，有声开场」。视频可见比例低于50%时暂停，标签页隐藏时暂停。用户手动暂停后，返回首屏不会擅自续播。系统减少动态效果偏好下不自动播放。
浏览器限制参考：https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay 。

## 内容和素材
角色形象档案：../ip-memory/CHARACTERS.md。
原创素材不覆盖；网站版本在 public/media。透明图生成提示词及透明通道检查说明在 ../ip-memory/generated/README.md。
app/Universe.tsx 控制情绪现场、季节同行、离谱开关、散落贴纸和原稿大图。app/page.tsx 控制首页、角色介绍、四段日常与设计师部分。完整设计稿出现在点击贴纸后打开的大图弹层。

## 验证
执行 npm run build、npm exec tsc -- --noEmit、npm exec oxlint -- app。
首版构建、类型检查及页面代码检查通过，主页和引用素材返回200。
全仓 lint 在脚手架自带的未使用组件（components/ui）及 use-mobile hook 中有既有错误；未为页面工作修改这些供应组件。未进行浏览器视觉与交互自动化检查。
