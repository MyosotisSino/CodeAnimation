# MV_WORKFLOW — 在本仓库用歌曲做一支手绘 MV 的完整流程

> 面向任意 AI 编码智能体。前置阅读：`ANIMATION_GUIDE.md`（必读，规则与引擎 API）。
> 本文档是"从歌到片"的工序层：已由《Seed of The Light》两部连映（snow.js + tree.js，8:09）全程验证。
> 环境：Windows 11 + Intel Arc iGPU + Chrome。

## 0. 环境（本机已就绪，换机重做）
- Node ≥ 20，Chrome 在默认位置（render.mjs 自动探测）。
- ffmpeg：`bin/ffmpeg.exe`（gyan.dev 6.1.1）。**不要用 `npm i ffmpeg-static`**（postinstall 下载会假死且产出截断文件），
  用 curl 拉 `https://github.com/eugeneware/ffmpeg-static/releases/latest/download/ffmpeg-win32-x64`。
- render.mjs 直接 spawn `ffmpeg`，编码前把 bin 挂进 PATH：`PATH="$PWD/bin:$PATH" node render.mjs …`。
- `--studio=<file>` 可指定入口 html（多部片并存时用，如 studio2.html 加载另一份场景脚本）。

## 1. 分析歌曲（tools/ 目录，Node 脚本）
1. 解码：`ffmpeg -i song.mp3 -ac 1 -ar 22050 -f s16le out.pcm`
2. `node analyze.mjs <song.mp3> <ffmpeg>` → 时长 + 每 5s 能量表 + 能量跳变点（段落结构）
3. `node tempo2.mjs` → 全频带 onset-flux 自相关 BPM（低频版 analyze.mjs 的 BPM 不可信，只看能量）
4. `node phase.mjs` → 节拍相位/首拍（弱拍检测得分低时，取 BPM 整数化 + 相位即可）

## 2. 分镜（STORYBOARD.md）
- 把歌曲段落映射成场景表；**剪切点落在小节线上**（bar = offset + 60/BPM × n）。
- 每场写 reads（观众必须理解的事，按顺序，标注起止秒）——时长由 reads 决定，不由场面决定。
- 长歌（>4min）把大段落拆 3-4 个镜头接力，不要一个镜头撑 90 秒。

## 3. 写场景代码（src/scenes/xxx.js）
- 结构：`(() => { ...边界数组 B、共享道具函数、每场一个 fn(t, lt, dur)、shots(B.map(...)) })()`
- 改 `src/config.js`：duration/bpm/offset/audio；`studio.html` 换脚本标签（或用 --studio）。
- **性能铁律（Arc iGPU 实测）**：
  - **不要用 glow()**——每次 glow 强制整块 mask 合成，一次 ~1s。全部光源用 `halo()`（三层低透明 wash 的画法光）。
  - 每帧 clawd() ≈ 200-400ms，全帧 clawd 数 ≤5；背景群众用剪影函数（~8 笔，见 tree.js 的 clawdSil）。
  - 水彩 `fill`（带 tex）是贵操作，wash 便宜：天空/地面用 wash+一条 ink 线就够。
  - 雪雨等粒子 ≤30，风线 ≤8。
- **连续性**：跨镜头的移动道具（火种/袋子/火花）位置必须在剪切点两侧对齐。
- **摄像机动、人物动、每 2-4 秒一个新读点**——静态保持 ≤1.5s，否则就是"发呆"。
- 零文本；唯一例外是用户点名的字幕卡（用 `letter()` + 自托管手写字体，见 assets/fonts + studio.html 的 @font-face）。

## 4. 审片循环（省时间的顺序）
1. `--sheet=各场中点` 一轮全景（抓布局灾难）
2. `--stills=关键帧` 全分辨率（抓细节：持握物位置/压脸/纸缝）
3. `--strip=动作段` 只查最关键的动作（每帧 1-3s，贵，省着用）
4. 已渲染的成品帧直接从 `out/frames/` 抽查（jpg 即帧）
5. **同页面连续渲染会逐帧劣化（p5.brush 资源累积，600ms→2.5s）**：render.mjs 已加"每 50 帧重建页面"。
6. GPU 并行无收益（4 worker 反而 3 倍慢于 1 worker，Arc 上下文切换损耗）：**用 `--workers=1`**。

## 5. 渲染与合成
```
node render.mjs --frames --workers=1                 # 断点续渲；改了代码就删掉受影响的帧号区间再跑一遍
PATH="$PWD/bin:$PATH" node render.mjs --encode --audio=<音频> --out=out/part.mp4
```
- 视频长于音频时先垫音频：`ffmpeg -i a.mp3 -af apad=whole_dur=335.12 -c:a aac out.m4a`（--encode 有 -shortest）。
- 多部拼接：各段同参数编码后 `ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4`。

## 6. 已知坑速查
- 持握物画在胸口会压到嘴 → 用 chestAt 的腹部位（-2.6u）。
- 'dry' 笔刷画风线会糊成团 → 用 inkfine。
- 水彩 fill 默认 border .35 会在天空留硬边 → `border: 0`。
- 场景内道具必须在 camBegin 之后画（screen/world 坐标系一致）。
- 摄像机 zoom>2 时注意画布矩形覆盖（拉远镜头要把背景 rect 加宽）。
- 情绪关键帧的时间基准是**场景局部时间 lt**，不是全局 t。
- p5.brush 的 WebGL INVALID_OPERATION 警告无害；其他 page error 都是真错误。
