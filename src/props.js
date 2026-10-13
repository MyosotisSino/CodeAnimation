// props.js: 道具与环境件模板库。所有"不是角色"的东西都在这里画好，场景只负责摆放与驱动动画参数——不必一边渲情节
// 一边现编配件。每一件都带三样东西：接地投影（坐得进画面）、一个可辨识特征（看得出是什么）、以及若它发光则落在
// 地面上的光斑。后两样正是 ISSUES_BACKLOG §21 / §38 / §42 的病灶。
//
// 两套尺寸约定，别混：
//   手持道具   PROP.bread(x, y, u, o)     u = 拿它那只 Clawd 的 u；从 (x,y) 向上画
//   环境件     PROP.fir(x, gy, m, o)      m = "几个成年 Clawd 高"（1 = PROP.HERO 像素），从地线向上画
// 环境件用倍数而不是像素，是为了让尺度问题在调用处就看得见：`PROP.fir(x, gy, 4.2)` 读作"四只 Clawd 高的树"，
// 写成 `0.8` 会立刻刺眼。§41 那一串"挖掘机太小 / 巨树太大 / 森林太少 / 光罩尺寸不对"就是缺这条。
//
//   PROP.held('bread', {steam:true})      → 直接塞进 clawd 的 armL / armR 钩子（画在手臂尖、沿手臂方向）
//   PROP.HERO / PROP.SCALE                尺度表；场景里所有摆放都按它对齐
//
// 检查表（渲染一次，逐件核对语义与尺度，之后场景里只管调用）：
//   node render.mjs --loop=props_hand   --sheet=1 --cols=1 --w=1920 --out=docs/props_hand.jpg     手持道具
//   node render.mjs --loop=props_life   --sheet=1 --cols=1 --w=1920 --out=docs/props_life.jpg     冷光/暖光/植物/生命
//   node render.mjs --loop=props_city   --sheet=1 --cols=1 --w=1920 --out=docs/props_city.jpg     建筑
//   node render.mjs --loop=props_street --sheet=1 --cols=1 --w=1920 --out=docs/props_street.jpg   街具与机器
//   node render.mjs --loop=props_tree   --sheet=1 --cols=1 --w=1920 --out=docs/props_tree.jpg     树与林子（§50）
//   node render.mjs --loop=props_events --sheet=1 --cols=1 --w=1920 --out=docs/props_events.jpg   16 件微事件（§51）
//   node render.mjs --loop=props_tone   --sheet=1 --cols=1 --w=1920 --out=docs/props_tone.jpg     亮度预算尺（§48）
//   node render.mjs --loop=props_memory --sheet=1 --cols=1 --w=1920 --out=docs/props_memory.jpg   回忆与时间流逝（§49）
(() => {
  // ---------- 亮度预算（§48）----------
  // 本片的语言是"光"：只有真正在发光的东西才允许站在 light / hot 两级上，其余一切——金属、布、蜡、纸币、
  // 安全帽、霓虹外壳——平均落在 warm 以下，受光面最多到 edge。这不是调色偏好而是叙事约束：
  // 第二部要演"胸口的光熄灭了"，背景里只要有一片比它更亮的假光，那个信息就当场被抹平。
  // dim() 按亮度**等比压暗**（三个通道乘同一个系数）：色相与饱和度都不变，只是"这块颜料用少了"，
  // 所以压完仍然是同一个材质，不会变成灰泥。
  // ⚠ 亮度是**面积乘出来的**：一小粒 #FFD96A 是光，一大片 #C99A28 就比光还亮。所以大面积涂装面
  //   （挖掘机车身、吊臂、围挡、安全帽）压到 mid 以下，不是 warm——§47 的"黄色安全帽太亮"就是这条。
  const TONE = { light: 1, hot: .84, edge: .72, warm: .58, mid: .42, cool: .3, dark: .18 };
  const hexLum = h => { const v = parseInt(String(h).replace('#', ''), 16); return (.2126 * (v >> 16 & 255) + .7152 * (v >> 8 & 255) + .0722 * (v & 255)) / 255; };
  function dim(col, budget = TONE.warm) {
    const L = hexLum(col); if (L <= budget || L < .005) return col;
    const f = budget / L, v = parseInt(String(col).replace('#', ''), 16);
    const g = sh => Math.round(((v >> sh) & 255) * f).toString(16).padStart(2, '0');
    return '#' + g(16) + g(8) + g(0);
  }

  // ---------- palette：PAL 的水彩范围，延伸到木、铁、布、蜡、霓虹 ----------
  // 注释里的档位 = 这件材质在预算尺上的位置。改之前先问：它自己在发光吗？不发就别碰 hot 以上。
  // ⚠ 白与米色被压到 warm/edge 之后，在**纸色底**上会发灰发闷——那不是画坏了，是背景不对：
  //   这些材质在片子里站在夜里。检查表里请给它们 {dark:true}（docs/props_tone.jpg 下面三格就是这么做的）。
  const C = {
    ink: PAL.ink, wood: '#6B5138', woodLt: dim('#8A6A45', TONE.mid), woodDk: '#43331F', bark: '#5A4433',
    steel: dim('#9AA3AE'), steelLt: dim('#C2CAD3', TONE.edge), steelDk: '#69737F', iron: '#4A505C',
    cloth: dim('#EFE0C0'), clothDk: dim('#C9B795', TONE.mid), rope: '#A98B5F', paper: dim('#F6EEDC'),
    gold: dim('#F2C53D'), ochre: PAL.ochre, red: '#C8324A', wine: '#7A2A3C',
    crumb: dim('#D89B54'), crumbLt: dim('#F0C283', TONE.edge), crumbDk: '#A8642C',
    wax: dim('#FFF3D6'), waxDk: dim('#E4CFA4', TONE.mid), sap: PAL.sap, sapDk: '#4E7A42', sapLt: dim('#9CC47E'),
    night: '#33304E', snow: dim('#DCE6F2'), snowLt: dim('#EDF3FA', TONE.edge), snowSh: '#9FB2CE', ice: dim('#B9D3E8'),
    neonP: dim('#B46BE0'), neonB: dim('#5C8FE0'),
    // 以下三个只准用于"正在发光"的东西：光芯、光斑、火焰。任何材质都不许借用。
    warm: '#FFD96A', warmLt: '#FFF2C0', scarf: '#B8503C',
  };

  // ---------- 尺度表：全片唯一的"多大"依据 ----------
  // §41/§47 的两次翻车都是"调用处看不出多大"。倍数一律相对**成年 Clawd 全身高**，且必须与巨树/工厂互相咬合：
  // 巨树 12、厂房 9、吊臂 9 —— 挖掘机是"矮而重"的机器，它靠**横向尺寸与阴影**读大，不靠高度（见 PROP.excavator）。
  const SCALE = {
    HERO: 168, heroU: 21,          // 成年 Clawd 全身高 ≈ 画面高 15.5%
    env: {                          // 建议倍数（"几个 Clawd 高"）
      fir: 3.6, firOld: 6.2, firFelled: 6.4, stump: .5, stumpGiant: 1.8, sapling: .9, giantTree: 12,
      cabin: 2.6, tenement: 9, glass: 14, factory: 9, lighthouse: 9, streetLamp: 2.6,
      excavator: 3.6, crane: 9, sled: 1.5, reindeer: 1.35, cart: 1.5, dome: 6.2,
    },
  };
  const PX = m => m * SCALE.HERO;

  // ---------- primitives ----------
  const P = (s, pts) => pts.map(([a, b]) => [a * s, b * s]);
  const blob = (cx, cy, rx, ry, lobes, bump, n = 30, topK = 1, ph = 0) => {
    const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, s = Math.sin(a), k = 1 + bump * Math.sin((a + ph) * lobes); p.push([cx + Math.cos(a) * rx * k, cy + s * ry * (s < 0 ? topK : 1) * k]); } return p;
  };
  const swOf = s => clamp(s / 14, .4, 2.6);
  const contact = (x, gy, w, k = 1) => paint(ellPts(x, gy + 1, w, w * .22, 18, w * .02), { fill: C.ink, fillOp: 70 * k, bleed: .18, tex: .4, border: .3, ink: null });
  // 光晕：§46 说圣诞老人的光"把半张画面染黄了，那不是光是换背景"。所以这里把衰减改陡——
  // 能量集中到靠近芯的两圈（更亮），外圈半径收到 0.78、透明度砍半（不再糊满环境）。
  // 记住这是"点光的衰减"而不是"一团黄"：r 是**可视衰减半径**，不是涂黄半径。
  // 一盏光的"最热色"。§52 —— 原来 halo / flame / lightPatch / sideGlow 的提亮一律 mix 向 C.warmLt（奶油白），
  // 于是紫火把在地上照出的是**米灰色**的一滩：观众根本看不出"这是紫色的光"，三盏冷光的角色全被提亮逻辑洗掉了。
  // 规则：暖光（R≥B）才许往奶油走；冷光必须留在自己的色相里提亮。
  function hotOf(col) {
    const v = parseInt(String(col).replace('#', ''), 16);
    const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    if (r >= g && r >= b) return mixCol(col, C.warmLt, .55);            // 暖色：往奶油白提，是火的本色
    // 冷色（紫火把 / 蓝灯笼 / 绿灯笼）**不能往白混** —— 混白会把饱和度打掉，
    // 于是紫色的火把烧成一团淡薰衣草汽（第十六轮复验："读作煤气火，不像火"）。
    // 正确做法是**按比例提值、保住色相与饱和度**：把最高的通道顶到 255，其余按同一比例放大。
    const mx = Math.max(r, g, b) || 1, up = 255 / mx;
    const ch = c => Math.min(255, Math.round(c * up + (255 - c * up) * .12));
    return '#' + ((1 << 24) + (ch(r) << 16) + (ch(g) << 8) + ch(b)).toString(16).slice(1);
  }
  // 光晕：四层递减。亮度集中在最内两层（§46 —— 摊开一大片淡色不叫光，那叫换背景）。
  function halo(x, y, r, col, a = 1) {
    if (a <= .02 || r < 2) return;
    const hot = hotOf(col), c = mixCol(col, hot, .35);
    // 顶点数跟着半径走：每 3px 弧长一个顶点，边就永远数不出来
    const nv = Math.round(Math.max(16, Math.min(112, r / 3)));
    // bleed/tex 必须有：纯 wash 多边形在雪地上会留下**看得见的边**（一个淡紫的十边形），
    // 观众读成"一个东西"而不是"一团光"。晕开之后它才是光。
    // §57 但只加 bleed 还不够：外两层在 r≈80 时 alpha 仍有 11~20，落在深蓝夜色上就是一圈**灰蓝色多边形**。
    // 外层的 alpha 必须低到"数不出边"，顶点数也要够多。
    paint(ellPts(x, y, r * .86, r * .8, nv, r * .03), { wash: c, washOp: 7 * a, bleed: .48, tex: .95, ink: null });
    paint(ellPts(x, y, r * .54, r * .5, nv, r * .025), { wash: mixCol(c, hot, .45), washOp: 15 * a, bleed: .4, tex: .85, ink: null });
    paint(ellPts(x, y, r * .28, r * .26, Math.max(12, nv * .7 | 0), r * .015), { wash: mixCol(c, hot, .7), washOp: 40 * a, bleed: .26, tex: .5, ink: null });
    paint(ellPts(x, y, r * .12, r * .11, Math.max(10, nv * .45 | 0)), { wash: mixCol(hot, '#FFFFFF', .45), washOp: 94 * a, bleed: .16, ink: null });
  }
  // 光贴在某一个表面上（墙、雪地、胸口）：不是把整面涂黄，而是沿受光边缘叠三层递减的亮带。
  // §21/§46 的正解——光要"落在东西上"，观众才知道它从哪来、照亮了谁。
  // w/h 是受光面的尺寸；dir（-1..1）决定亮带从哪一侧进来（-1 左、1 右、0 顶）。
  function litFace(x, y, w, h, col = C.warm, k = 1, dir = 0) {
    if (k <= .02 || w < 2 || h < 2) return;
    const hot = hotOf(col), dx = dir === 0 ? 0 : dir * .18, dy = dir === 0 ? -.16 : 0;
    for (let i = 0; i < 4; i++) {
      // 同一个病（第十六轮复验）：三层同心椭圆 + 默认 bleed .1 -> 每张受光的脸上糊了一块
      // **硬边圆角矩形**。受光不是"贴一片亮"，而是"靠光源那一侧比背侧亮"，
      // 所以改成**偏心**的四层（越靠 dir 那侧偏得越多），几乎不洇边、靠颗粒化边。
      const q = 1 - i * .19, kk = k * (.46 - i * .09);
      paint(ellPts(x + dx * w * (.3 + i * .16), y + dy * h * (.3 + i * .16), w * (.58 - i * .1) * q, h * (.6 - i * .1) * q, 20),
        { wash: mixCol(col, hot, .28 + i * .18), washOp: 26 * kk, bleed: .03, tex: .95, ink: null });
    }
  }
  // 三层火焰：外焰 col、中焰提亮、内芯最热。返回抖动系数，光斑跟着它一起呼吸。
  // 第十七轮 2：原来的火是三层**同心、顶端收尖的水滴瓣** —— 叠起来像一颗切割过的宝石，
  // 用户原话"跟宝石一样尖尖的，一点也不像火焰"。真火的形状法则是**下圆上乱**：
  // 底是圆的（贴着火钵），往上同时有 2~3 支长短不一的苗，边是波着的，
  // 而且每一支的相位不一样 —— 所以抖动必须是**按角度调制半径**，不是把轮廓整体上下拉伸。
  function flame(x, y, w, h, col = C.warm, flk = 1) {
    const hot = hotOf(col);
    const f = 1 + .16 * Math.sin(T * 12 + x * .1) * flk + .07 * Math.sin(T * 27 + y * .1);
    const shape = (ww, hh, seed, lobes) => {
      const p = [], n = 26;
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + i / n * Math.PI * 2;                     // 从正上方开始绕一圈
        const lobe = 1 + .30 * Math.sin(a * lobes + seed) + .13 * Math.sin(a * (lobes + 2) - seed * 1.7);
        const sag = a > 0 ? .72 : 1;                                      // 下半部压扁：火坐在火钵上，不是悬浮的椭圆
        p.push([x + Math.cos(a) * ww * lobe, y - hh * .40 + Math.sin(a) * hh * .60 * sag * lobe * f]);
      }
      return p;
    };
    paint(shape(w * 1.02, h * .96, x * .05, 3), { wash: mixCol(col, C.ink, .30), washOp: 225, ink: null, curv: .42 });
    paint(shape(w * .74, h * .82, x * .05 + 2.1, 2), { wash: mixCol(col, hot, .55), ink: null, curv: .42 });
    paint(shape(w * .34, h * .52, x * .05 + 4.4, 1), { wash: mixCol(hot, '#FFFFFF', .45), washOp: 245, ink: null, curv: .42 });
    return f;
  }
  function embers(x, y, w, h, n, col = C.warm, sp = 1) {
    for (let i = 0; i < n; i++) {
      const ph = frac(T * .55 * sp + i / n); if (ph > .92) continue;
      const r = (1 - ph) * 1.1, ex = x + Math.sin(ph * 7 + i * 2.1) * w * .8, ey = y - ph * h * (1.2 + .5 * hash(i));
      paint(ellPts(ex, ey, 1.9 * r + .6, 1.9 * r + .6, 6), { wash: col, washOp: 200 * (1 - ph), ink: null });
    }
  }

  const PROP = { SCALE, HERO: SCALE.HERO, heroU: SCALE.heroU, C, TONE, dim, hexLum, hotOf, swOf, halo, litFace, flame, embers, contact, PX, blob };

  // ================================================================ 光落到面上
  // §21/§42 的正面解法：光必须把照到的面提亮，中心要"过曝"于环境。r = 地面光斑的横向半径。
  // §46 之后 r 的含义收紧了：它是**能量的衰减半径**，不是"涂黄的半径"。所以最外圈压到 .88r 且几乎透明，
  // 亮度集中在中间两圈——一片小而亮的光斑比一大片淡黄更像光，也不会把背景换成夜景。
  PROP.lightPatch = (x, gy, r, col = C.warm, k = 1) => {
    if (k <= .02 || r < 4) return;
    boilSeed('patch' + Math.round(x) + '_' + Math.round(r));
    const f = 1 + .04 * Math.sin(T * 7 + r), hot = hotOf(col);
    const nv = Math.round(Math.max(18, Math.min(120, r * .55)));
    paint(ellPts(x, gy + 2, r * .88 * f, r * .25 * f, nv, r * .02), { wash: mixCol(col, hot, .14), washOp: 30 * k, bleed: .26, tex: .5, ink: null });
    paint(ellPts(x, gy + 2, r * .54 * f, r * .16 * f, Math.max(14, nv * .75 | 0)), { wash: mixCol(col, hot, .44), washOp: 60 * k, bleed: .22, tex: .4, ink: null });
    paint(ellPts(x, gy + 2, r * .26 * f, r * .08 * f, 14), { wash: mixCol(col, hot, .62), washOp: 96 * k, bleed: .18, ink: null });
    // 光斑的芯不能近白：雪地本来就亮，一块近白的椭圆读起来是"地上有个洞"，不是"这里有光"（§56）。
    paint(ellPts(x, gy + 2, r * .085 * f, r * .028 * f, 10), { wash: mixCol(hot, '#FFFFFF', .2), washOp: 118 * k, ink: null });
  };
  // §69 空气中的"亮"。用户反复说"一定要把光的要素夸大"（P1#2 火把、P1#3 蓝提灯、P1#4 绿光）。
  // 一盏夜里举着的灯，先改变的是**它周围那团空气**，然后才是地面。只画地面光斑，灯就像
  // "举着一支笔，地上有一块白"。这层极淡（15~18 alpha）+ 高 bleed，所以不是换背景。
  // 三种手持光源（火把/蜡烛/提灯）共用它，夸大程度只调这一个函数。
  PROP.airGlow = (x, y, r, col, k = 1) => {
    if (k <= .02 || r < 6) return;
    boilSeed('air' + Math.round(x) + Math.round(y));
    // 第十六轮复验：airGlow 在火把/灯笼周围画出一圈圈**硬边多边形环**，读作色带不读作光。
    // 病根是 `bleed` —— p5.brush 的 bleed 是"颜料在边缘洇出一圈深边"，大形状 + 高 bleed
    // 恰好给每一层套了一条可见的轮廓。光在空气里没有轮廓，所以 bleed 必须几乎为零，
    // 靠**层数**而不是靠单层洇出来做渐变。
    const hot = hotOf(col);
    const nv = Math.round(Math.max(24, Math.min(120, r * 1.1)));
    for (let i = 0; i < 5; i++) {
      const q = 1 - i * .17;
      paint(ellPts(x, y, r * 2.5 * q, r * 2.1 * q, Math.max(14, nv * q | 0), r * .02),
        { wash: mixCol(col, hot, .12 + i * .16), washOp: (15 - i * 1.6) * k, bleed: .04, tex: .95, ink: null });
    }
  };
  // §74 冰面观感：A5 改成"clawd 低头看湖面"的主视角之后，最大的风险是
  // 观众以为画面切到了天上。所以"这是往**下**看一块冰"必须由这张图自己说清楚：
  // 越深越暗的体积、冰内的气泡与裂纹、水面折光、**几片落在冰面上停住的雪**（带一圈融出的水痕）。
  // 雪不能多，多了整个湖面发白就什么都看不见了 —— 默认只 7 片，且都带阴影贴地。
  PROP.iceLook = (cx, cy, rx, ry, k = 1, o = {}) => {
    if (k <= .02) return;
    boilSeed('icelook' + Math.round(cx));
    const deep = o.deep || '#080D1C', top = o.top || '#1B2444';
    const nv = Math.round(Math.max(20, Math.min(128, rx * .18)));
    for (let i = 0; i < 4; i++) {                                     //  depth：从边缘到中心一层层压暗，中心=最深
      const q = 1 - i * .21;
      paint(ellPts(cx, cy, rx * q, ry * q, nv, rx * .02), { wash: mixCol(top, deep, .25 + i * .22), washOp: 90 + i * 34, bleed: .3, tex: .7, ink: null });
    }
    for (let i = 0; i < 5; i++) {                                     // 冰内的折光带（横纹，不是水面波纹）
      const yy = cy - ry * .6 + i * ry * .3;
      paint(ellPts(cx + (hash(i) - .5) * rx * .5, yy, rx * (.5 + .3 * hash(i + 4)), ry * .035, 16, 1), { wash: mixCol(top, '#9FC4E8', .5), washOp: 26, bleed: .3, tex: .8, ink: null });
    }
    for (let i = 0; i < 9; i++) {                                     // 冻在冰里的气泡串：证明"这是冰"
      const a = hash(i * 3.7) * TAU, rr = .25 + .7 * hash(i * 5.1);
      paint(ellPts(cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr, 2.6 + 2.4 * hash(i), 2.4 + 2 * hash(i + 2), 7), { wash: mixCol('#B9D3E8', '#FFFFFF', .35), washOp: 70, ink: null });
    }
    const n = o.flakes === undefined ? 7 : o.flakes;                   // 落在冰面上**停住**的雪（用户点名的衬托手法）
    for (let i = 0; i < n; i++) {
      const fx = cx + (hash(i * 7.3) - .5) * rx * 1.7, fy = cy + (hash(i * 9.1) - .5) * ry * 1.7, r = 5 + 6 * hash(i * 2.3);
      paint(ellPts(fx, fy + r * .18, r * 1.5, r * .5, 12), { wash: mixCol(deep, '#5E728E', .5), washOp: 60, bleed: .3, ink: null });   // 贴地的接触影
      paint(ellPts(fx, fy, r, r * .82, 9), { wash: '#E9F1FA', washOp: 235, fill: '#FFFFFF', fillOp: 150, bleed: .1, ink: null });
    }
    paint(ellPts(cx, cy, rx, ry, Math.max(nv, 60), rx * .015), { ink: mixCol('#8FB4D8', top, .35), sw: clamp(rx / 420, .6, 2.2), wash: null });   // 冰面开口的边
  };
  // 打在墙/人身上的侧光
  PROP.sideGlow = (x, y, w, h, col = C.warm, k = 1) => {
    if (k <= .02) return;
    const hot = hotOf(col);
    for (let i = 0; i < 4; i++) paint(ellPts(x + i * w * .18, y, w * (.5 - i * .08), h * (.55 - i * .06), 12), { wash: mixCol(col, hot, .35 + i * .18), washOp: 30 * k, ink: null });
  };

  // ================================================================ 手持道具
  // 面包：圆鼓 + 三道割痕 + 割口漏光 + 热气 + 掉渣。被抢和被给的都是它，必须一眼认出（§38）。
  PROP.bread = (x, y, u, o = {}) => {
    boilSeed('bread' + (o.half ? 'h' : 'w')); const s = u * (o.k || 1), w = s * 1.35, h = s * .95, sw = swOf(s) * .8;
    contact(x, y, w * .8, .8);
    if (o.half) {
      paint([[x - w, y - h * .25], [x - w * .55, y - h * .95], [x - w * .1, y - h * .6], [x + w * .35, y - h * 1.05], [x + w * .8, y - h * .35], [x + w * .55, y], [x - w * .7, y]],
        { wash: C.crumb, fill: C.crumbDk, fillOp: 60, bleed: .12, tex: .6, border: .4, ink: C.ink, sw });
      paint([[x + w * .5, y - h * .3], [x + w * .78, y - h * .32], [x + w * .6, y - h * .05]], { wash: C.crumbLt, ink: null });
    } else {
      paint(blob(x, y - h * .62, w, h * .72, 3, .1, 26, .8, .4), { wash: C.crumb, fill: C.crumbDk, fillOp: 55, bleed: .13, tex: .7, border: .45, ink: C.ink, sw });
      paint(ellPts(x, y - h * .18, w * .98, h * .3, 20), { wash: C.crumbDk, fill: C.woodDk, fillOp: 40, bleed: .1, ink: null });
      for (let i = -1; i <= 1; i++) inkLine([[x + i * w * .42 - w * .1, y - h * 1.16], [x + i * w * .42 + w * .12, y - h * .82]], sw * .55, C.crumbDk, 'ink', .3);
      if (o.glow !== false) { halo(x, y - h * .8, s * 1.15, C.warm, .8); paint(ellPts(x, y - h * .95, w * .2, h * .1, 10), { wash: C.warmLt, washOp: 200, ink: null }); }
    }
    if (o.steam) for (let i = 0; i < 3; i++) { const ph = frac(T * .5 + i / 3); inkLine([[x + (i - 1) * w * .38, y - h * 1.2], [x + (i - 1) * w * .38 + Math.sin(ph * 5) * s * .3, y - h * 1.2 - ph * s * 2.2]], sw * .5, mixCol(C.snow, C.ink, .25), 'inkfine', .6); }
    for (let i = 0; i < 3; i++) paint(ellPts(x - w * .5 + i * w * .5, y - h * .1, s * .09, s * .07, 6), { wash: C.crumbDk, ink: null });
  };
  // 铜币：单枚 / 一叠。§38：一次必须成串才读得出"钱"，用 coinString。
  PROP.coin = (x, y, u, o = {}) => {
    boilSeed('coin'); const s = u * (o.k || 1), r = s * .46, sw = swOf(s) * .7, n = o.stack || 1;
    if (n === 1) paint(ellPts(x, y - r * .12, r * .95, r * .3, 16), { fill: C.ink, fillOp: 60, bleed: .2, ink: null });
    for (let i = 0; i < n; i++) {
      const cy = y - r - i * r * .42, tilt = (i - n / 2) * .06;
      paint(ellPts(x, cy, r, r * (.34 + .04 * (i % 2)), 16, 0, tilt), { wash: C.gold, fill: C.ochre, fillOp: 70, bleed: .12, tex: .6, border: .4, ink: C.ink, sw });
      inkLine([[x - r * .6, cy - r * .06], [x + r * .6, cy - r * .06]], sw * .35, C.ochre, 'inkfine', 0);
      paint(ellPts(x - r * .3, cy - r * .1, r * .22, r * .1, 8, 0, -.3), { wash: C.warmLt, washOp: 190, ink: null });
    }
  };
  PROP.coinString = (x, y, u, o = {}) => {
    boilSeed('coinstr'); const s = u * (o.k || 1), n = o.n || 5;
    inkLine([[x - s * .1, y - s * 2.9], [x + s * .2, y - s * 1.4], [x - s * .1, y - s * .3]], swOf(s * .12), C.rope, 'ink', .5);
    for (let i = 0; i < n; i++) PROP.coin(x + Math.sin(i * 1.7) * s * .3, y - i * s * .52, s * .8, { k: 1 });
  };
  // 一杆永远不平的秤：币多的那侧压低（§38 的核心道具）
  PROP.scale = (x, y, u, o = {}) => {
    boilSeed('scale2'); const s = u * (o.k || 1) * 1.5, sw = swOf(s) * .7, tilt = o.tilt ?? .34;
    const ly = y - s * 1.9 + tilt * s * .5, ry = y - s * 1.9 - tilt * s * .5;
    inkLine([[x, y], [x, y - s * 2.05]], sw * 1.1, C.gold, 'ink', 0);
    inkLine([[x - s * 1.5, ly], [x + s * 1.5, ry]], sw * 1.0, C.woodLt, 'ink', 0);
    paint(ellPts(x, y - s * 2.1, s * .2, s * .2, 10), { wash: C.gold, ink: C.ink, sw: sw * .6 });
    for (const [px, py, k] of [[x - s * 1.45, ly, 1], [x + s * 1.45, ry, .45]]) {
      inkLine([[px, py], [px - s * .42, py + s * .8 * k]], sw * .4, C.wood, 'inkfine', 0);
      inkLine([[px, py], [px + s * .42, py + s * .8 * k]], sw * .4, C.wood, 'inkfine', 0);
      const p = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); p.push([px + Math.cos(a) * s * .7 * (.5 + .5 * k), py + s * .82 * k + Math.sin(a) * s * .26 * (.5 + .5 * k)]); }
      paint(p, { wash: C.steelDk, fill: C.iron, fillOp: 55, bleed: .1, tex: .5, ink: C.ink, sw });
    }
    PROP.coin(x - s * 1.45, ly + s * .95, s * .55, { stack: 3 });
  };
  // 蜡烛：整支 / 未点 / 半支（"这些只够半支"）/ 一整串（掏不完）。杆要够粗才不会被自己的描边吃掉。
  PROP.candle = (x, y, u, o = {}) => {
    boilSeed('candle' + (o.half ? 'h' : 'w')); const s = u * (o.k || 1), w = s * .34, h = s * (o.half ? .9 : 2.3), sw = swOf(s) * .5;
    contact(x, y, w * 1.5, .6);
    paint(rectPts(x - w / 2, y - h, w, h, s * .04), { wash: C.wax, fill: C.waxDk, fillOp: 40, bleed: .1, tex: .6, border: .4, ink: C.ink, sw });
    paint(ellPts(x, y - h, w * .5, w * .26, 10), { wash: C.waxDk, ink: null });
    if (o.half) paint([[x - w / 2, y - h], [x + w * .14, y - h * 1.22], [x + w / 2, y - h * .82], [x + w / 2, y - h], [x - w / 2, y - h]], { wash: C.wax, ink: null });
    for (let i = 0; i < 2; i++) inkLine([[x - w * .4 + i * w * .8, y - h * (.55 - i * .2)], [x - w * .35 + i * w * .75, y - h * (.2 - i * .05)]], sw * .35, C.waxDk, 'inkfine', 0);
    inkLine([[x, y - h], [x, y - h - s * .16]], sw * .8, C.ink, 'inkfine', 0);
    if (o.lit) { const f = flame(x, y - h - s * .14, s * .26, s * .84, C.warm); halo(x, y - h - s * .42, s * 1.9 * f, C.warm, 1); PROP.airGlow(x, y - h - s * .34, s * 1.15 * f, C.warm, 1); if (o.pool !== false) PROP.lightPatch(x, y + 1, s * 3.2 * f, C.warm, .9); }
  };
  PROP.candleBunch = (x, y, u, o = {}) => {
    boilSeed('candles'); const s = u * (o.k || 1);
    for (let i = 0; i < 5; i++) PROP.candle(x + (i - 2) * s * .32, y - Math.abs(i - 2) * s * .14, s * .8, { lit: o.lit, k: 1, half: i === 1, pool: false });
    inkLine([[x - s * .85, y - s * .32], [x + s * .85, y - s * .32]], swOf(s * .14), C.rope, 'ink', .4);
  };
  // 种子：掌心里一粒随心跳明暗的光（§40：A11 的种植动作必须看得见它在手里）
  PROP.seed = (x, y, u, o = {}) => {
    boilSeed('seed'); const s = u * (o.k || 1), beat = .72 + .28 * Math.pow(Math.max(0, Math.sin(T * 3.1)), 6);
    paint(ellPts(x, y - s * .3, s * .3, s * .42, 14, 0, .18), { wash: mixCol(C.woodDk, C.warm, .3 * beat), fill: C.bark, fillOp: 60, ink: C.ink, sw: swOf(s) * .6 });
    paint(ellPts(x - s * .07, y - s * .42, s * .09, s * .13, 8), { wash: C.warmLt, washOp: 230 * beat, ink: null });
    halo(x, y - s * .3, s * 1.4 * beat, C.warm, .85 * beat);
    if (o.pool) PROP.lightPatch(x, y + 1, s * 1.9 * beat, C.warm, .7);
  };
  // 破土三段：k 走完"拱 → 直腰 → 展叶"，带松土与地面线（§39：绝不再画成向上长的卷茎）
  PROP.sprout = (x, gy, u, o = {}) => {
    boilSeed('sprout2'); const s = u * (o.k2 || 1), k = clamp(o.k ?? 1), sw = swOf(s) * .7;
    const arch = clamp(k * 3), straight = clamp((k - .3) * 2.6), leaf = clamp((k - .62) * 2.8);
    paint(ellPts(x, gy, s * (.9 + .5 * arch), s * .16, 16), { fill: C.ink, fillOp: 60, bleed: .2, ink: null });
    for (let i = 0; i < 3; i++) inkLine([[x - s * .5 + i * s * .5, gy - s * .04], [x - s * .3 + i * s * .5, gy - s * .16 * arch]], sw * .4, C.bark, 'inkfine', 0);
    const top = [x + Math.sin(arch * 2.2) * s * .35, gy - s * (.18 + .5 * arch + .95 * straight)];
    inkLine([[x, gy - s * .04], [lerp(x, top[0], .5), gy - s * (.1 + .35 * arch + .5 * straight)], top], sw * 1.1, C.sapDk, 'ink', .4);
    if (leaf > .02) for (const d of [-1, 1]) {
      // §63 原来这里写的是 push(); rotate(d*.5*leaf); paint(blob(绝对坐标...)); pop();
      // —— rotate 绕的是**当前原点**（相机变换下就是世界原点 0,0），不是芽尖。
      // 结果子叶被甩到画面角落里，A12/A13 里"树芽"旁边飘着两片绿叶子。
      // 叶片本身已经用 blob 的 ph 参数做了倾角，不需要再转。
      paint(blob(top[0] + d * s * .3 * leaf, top[1] - s * .05, s * .34 * leaf, s * .19 * leaf, 2, .12, 16, .8, d * .6), { wash: C.sap, fill: C.sapLt, fillOp: 55, bleed: .1, tex: .6, ink: C.ink, sw: sw * .7 });
      inkLine([[top[0], top[1] - s * .04], [top[0] + d * s * .42 * leaf, top[1] - s * .02]], sw * .35, C.sapDk, 'inkfine', 0);
    }
    const beat = .7 + .3 * Math.pow(Math.max(0, Math.sin(T * 3.1)), 6);
    if (leaf > .3) { halo(top[0], top[1] - s * .1, s * 1.15 * leaf * beat, C.warm, .9 * leaf); paint(ellPts(top[0], top[1] - s * .12, s * .1 * leaf, s * .12 * leaf, 8), { wash: C.warmLt, ink: null }); }
    if (o.pool) PROP.lightPatch(x, gy + 1, s * 2.3 * k * beat, C.warm, .75 * k);
  };
  // 袋子：小布包（村民全部家当）/ 圣诞老人的大袋。§18 说大袋"不像袋子"——原来画的是一坨 blob。
  // 布袋的剪影是三件事：**底宽 → 收到一个腰 → 腰上再 flare 出领口**，加上从扎口扇下来的褶。
  // 它还得比人高（h = 8.8s，角色 8u），因为里面装的是"一整年的礼物"。
  // 麻袋。第十七轮 5：原来 big 档是 w=3.1s / h=8.8s，高宽比 2.8 —— 立着看就是**一只罐子**。
  // 真正的麻袋装满东西以后是被自己压扁的：下盘宽、上头收，高宽比 1.3 左右。
  // 而且主角拖着它走的时候它是**横躺**的（传 `rot`），只有圣诞老人的礼物堆允许竖着放。
  //   o.big  大袋（比 clawd 略小）；否则是小布包
  //   o.rot  绕"袋底中心"旋转的弧度。躺倒 = ±PI/2*.92；内部会自动把整体抬到地面上而不陷进去
  //   o.drag 拖行：在**运动的反方向**留两道被拽出来的雪沟和一小蓬雪粉
  //   o.glow 缝里漏光（大袋默认有）
  PROP.sack = (x, y, u, o = {}) => {
    boilSeed('sack' + (o.big ? 'b' : 's'));
    const s = u * (o.k || 1), big = !!o.big, sw = swOf(s) * .7;
    const w = s * (big ? 5.0 : .8), h = s * (big ? 6.5 : 1.6);
    const rot = o.rot || 0, lift = Math.abs(Math.sin(rot)) * w * .5;
    contact(x, y, w * (big ? .95 : .8), .9);
    if (o.drag) {   // 拽出来的沟：在袋口朝向的反方向
      const dir = rot > 0 ? -1 : 1, L = h * (.55 + .5 * (o.drag === true ? 1 : clamp(o.drag)));
      for (const d of [-.2, .2]) {
        inkLine([[x + dir * L, y + d * w * .3], [x + dir * L * .55, y + d * w * .26], [x, y + d * w * .18]],
          swOf(w * .1) * .8, mixCol(C.snowSh, C.ink, .34), 'inkfine', .25); }
      for (let i = 0; i < 5; i++) { const q = hash(i + 2);
        paint(ellPts(x + dir * L * (.2 + q * .8), y - w * .06 - q * w * .1, s * .12, s * .07, 8, 0, q * TAU),
          { wash: C.snowLt, washOp: 70 * (1 - q), ink: null }); }
    }
    const lying = Math.abs(rot) > .85;
    // 袋身轮廓（竖着）：底收一点 → 下三分之一鼓到最宽 → 上三分之一才收腰。
    // 一条"从底到顶线性变窄"的曲线画出来是交通锥，不是袋子（第一版就是这样）。
    const rad = t => w * (.44 + .56 * Math.sin(Math.min(1, t * 1.12) * 3)) * (1 - Math.pow(t, 3.0) * .46);
    const ny = -h * .82, nw = rad(1);
    push(); translate(x, y - (lying ? 0 : lift));
    if (lying) {
      // 躺倒的麻袋**不能**是把竖着的那只旋转 90°：转过去之后袋底变成一条竖直的边、
      // 最宽的地方压进地里，整只读作一块冲浪板或一柄破伞（第十七轮 5 复验看到的就是这个）。
      // 躺着的袋子有它自己的语法：底面摊平坐在雪里、被内容物坠出不规则的鼓，
      // 扎紧的袋口像尾巴一样从一端**瘫**出来。rot 的符号决定袋口朝哪一边。
      rotate(rot > 0 ? .045 : -.045); scale(rot > 0 ? 1 : -1, 1);
      const L = h * .94, H = w * 1.0;
      paint([[-L * .50, 0], [-L * .53, -H * .26], [-L * .45, -H * .60], [-L * .27, -H * .80],
        [-L * .02, -H * .83], [L * .20, -H * .70], [L * .36, -H * .50], [L * .45, -H * .34],
        [L * .62, -H * .41], [L * .70, -H * .20], [L * .52, -H * .06], [L * .44, 0]],
        { wash: big ? C.cloth : C.woodLt, fill: big ? C.clothDk : C.woodDk, fillOp: 62, bleed: .16, tex: .85, border: .55, ink: C.ink, sw, curv: .42 });
      paint(ellPts(-L * .02, -H * .03, L * .46, H * .11, 18), { wash: C.clothDk, washOp: 120, ink: null });   // 坐在地上压出来的底
      for (let i = 0; i < 4; i++) { const bx = -L * (.34 - i * .21);
        inkLine([[bx, -H * (.12 + .10 * (i % 2))], [bx + L * .055, -H * (.60 - .10 * (i % 2))]], sw * .5, C.clothDk, 'inkfine', .35); }
      paint(ellPts(L * .60, -H * .31, L * .105, H * .135, 10, 0, .5),
        { wash: C.clothDk, fill: C.cloth, fillOp: 60, bleed: .1, tex: .7, ink: C.ink, sw: sw * .7 });          // 瘫出来的袋口
      inkLine([[L * .50, -H * .42], [L * .53, -H * .14]], sw * .95, C.rope, 'ink', .2);                        // 扎绳
      if (big && o.glow !== false) for (let i = 0; i < 3; i++) {   // 缝里漏光：光从袋子里挤出来
        const sx = -L * (.26 - i * .24), sy = -H * (.30 + .22 * hash(i)), a = .55 + .45 * Math.sin(T * 4 + i * 2);
        inkLine([[sx - w * .07, sy], [sx + w * .07, sy + H * .06]], sw * 1.0, mixCol(C.warm, C.warmLt, a), 'ink', 0);
        halo(sx, sy, s * .95 * a, C.warm, .85 * a); }
    } else {
      rotate(rot);
      const body = [];
      for (let i = 0; i <= 14; i++) { const t = i / 14; body.push([-rad(t), -h * (.02 + t * .8)]); }
      for (let i = 14; i >= 0; i--) { const t = i / 14; body.push([rad(t), -h * (.02 + t * .8)]); }
      paint(body, { wash: big ? C.cloth : C.woodLt, fill: big ? C.clothDk : C.woodDk, fillOp: 55, bleed: .14, tex: .8, border: .5, ink: C.ink, sw, curv: .35 });
      paint([[-nw * 1.55, ny - h * .1], [nw * 1.55, ny - h * .1], [nw * .9, ny + h * .02], [-nw * .9, ny + h * .02]],
        { wash: big ? C.cloth : C.woodLt, fill: C.clothDk, fillOp: 45, bleed: .12, tex: .7, ink: C.ink, sw: sw * .85, curv: .25 });   // flare 出来的领口
      inkLine([[-nw * 1.35, ny - h * .035], [nw * 1.35, ny - h * .02]], sw * 1.15, C.rope, 'ink', .25);                              // 扎绳
    }
    if (big && !lying) {
      for (let i = 0; i < 5; i++) { const fx = (i - 2) * nw * .62;                    // 从扎口扇下来的褶
        inkLine([[fx, ny], [fx + (i - 2) * w * .11, -h * .42], [fx + (i - 2) * w * .19, -h * .1]], sw * .55, C.clothDk, 'inkfine', .35); }
      paint(ellPts(0, -h * .04, rad(0) * 1.02, h * .07, 20, w * .02), { wash: C.clothDk, washOp: 130, ink: null });                  // 内容物压出来的底
      // 缝里漏光＝光从袋子里挤出来，不是把袋子外面刷黄：每缝一小束短线 + 一个很小的核，
      // 落地光斑从 6.5 收到 3.0（§46 原话："整个画面一部分全变成黄色，那是换背景不是光"）。
      if (o.glow !== false) for (let i = 0; i < 4; i++) { const sx = (i - 1.5) * w * .4, sy = -h * (.26 + .36 * hash(i)), a = .55 + .45 * Math.sin(T * 4 + i * 2);
        inkLine([[sx - w * .09, sy], [sx + w * .09, sy + h * .05]], sw * 1.1, mixCol(C.warm, C.warmLt, a), 'ink', 0); halo(sx, sy, s * 1.05 * a, C.warm, .9 * a); }
    } else paint(rectPts(-w * .3, -h * .55, w * .5, h * .3, s * .05), { wash: C.clothDk, ink: null });
    pop();
    if (big && o.pool) PROP.lightPatch(x, y + 1, s * (o.poolR || 3), C.warm, .8);
  };
  // 斧头。§44："樵夫那个斧头太不明显了，可以夸张地做大一点"——按**握点**量，从柄尾到斧冠外缘 = 1.95·s，
  // s = 3.4u 即全长 ≈ 6.6u ≈ 0.83 个成年 Clawd 身高（原来是 0.47）。这是一件故事道具不是工具：
  // 它必须在远景里一眼看出危险。
  //   o.ang  静态角度（默认 -.35）
  //   o.swing 0..1 一整记挥砍：举过头 → 卡拍劈下（0.42 之前一直举着，之后 easeIn 砸下），自动带斧风弧
  //   o.spark 0..1 命中相位（迸火星）  o.chip 0..1 命中相位（崩木屑，砍树用这个）
  PROP.axe = (x, y, u, o = {}) => {
    boilSeed('axe3'); const s = u * (o.k || 1) * 3.4, sw = swOf(s) * .7;
    const swk = o.swing == null ? -1 : clamp(o.swing);
    const ang = swk < 0 ? (o.ang ?? -.35) : swk < .42 ? lerp(-2.25, -2.05, swk / .42) : lerp(-2.25, .34, easeIn((swk - .42) / .58));
    push(); translate(x, y); rotate(ang);
    paint(ribbon([[-.09 * s, 0], [.72 * s, -.05 * s], [1.5 * s, -.13 * s]], .135 * s, .095 * s), { wash: C.wood, ink: C.ink, sw: sw * .9 });
    for (let i = 0; i < 3; i++) inkLine([[-.03 * s + i * s * .11, -.085 * s], [.03 * s + i * s * .11, .075 * s]], sw * .55, C.clothDk, 'inkfine', 0);
    paint(P(s, [[1.04, -.62], [1.44, -.9], [1.84, -.44], [1.86, .18], [1.44, .5], [1.02, .14]]),
      { wash: C.steelDk, fill: C.iron, fillOp: 48, bleed: .1, tex: .5, ink: C.ink, sw: sw * 1.1, curv: .28 });
    // 斧冠分两层：靠柄的一半是暗锻面，靠刃的一半是磨亮的斜面。只有一条亮线的话，远景里就是一坨灰。
    paint(P(s, [[1.5, -.66], [1.76, -.36], [1.78, .12], [1.44, .4], [1.3, -.1]]), { wash: C.steelLt, fill: C.steel, fillOp: 40, bleed: .1, tex: .4, ink: null, curv: .28 });
    inkLine(P(s, [[1.76, -.38], [1.79, .1], [1.4, .42]]), sw * .9, C.snowLt, 'ink', .35);
    inkLine(P(s, [[1.1, -.5], [1.28, -.16], [1.1, .1]]), sw * .5, C.steelDk, 'inkfine', .2);          // 锻打面
    paint(P(s, [[.9, -.26], [1.18, -.34], [1.2, .26], [.92, .3]]), { wash: C.steelDk, ink: C.ink, sw: sw * .75, curv: .3 });
    pop();
    if (swk >= .42 && swk < .99) {   // 斧风：越靠近命中弧越短越淡
      for (let i = 1; i <= 4; i++) { const p = [];
        for (let k2 = 0; k2 <= 7; k2++) { const aa = lerp(ang, -2.1, k2 / 7), rr = s * (1.62 - i * .07);
          p.push([x + Math.cos(aa) * rr, y + Math.sin(aa) * rr]); }
        inkLine(p, sw * .5 * (1 - i / 5), mixCol(C.paper, C.warmLt, .25), 'inkfine', .5); } }
    if (o.spark > 0) for (let i = 0; i < 6; i++) { const ph = frac(o.spark + i / 6);
      paint(ellPts(x + s * 1.5 + Math.cos(i * 2 + o.spark * 9) * s * .5 * ph, y - s * .1 - ph * s * .7, s * .055 * (1 - ph), s * .055 * (1 - ph), 6), { wash: C.warmLt, washOp: 230 * (1 - ph), ink: null }); }
    if (o.chip > 0) { boilSeed('chip'); for (let i = 0; i < 7; i++) { const ph = frac(o.chip * 1.6 + i / 7), v = s * (.9 + hash(i) * 1.3);
      const cx2 = x + s * 1.5 + Math.cos(-1.2 + hash(i + 3) * 2.4) * v * ph, cy2 = y - s * .1 - Math.abs(Math.sin(hash(i + 7) * 3.14)) * v * ph + ph * ph * s * .9;
      paint(P(1, [[cx2 - s * .07, cy2], [cx2 + s * .05, cy2 - s * .05], [cx2 + s * .03, cy2 + s * .06]]), { wash: i % 2 ? C.crumbLt : C.woodLt, ink: C.ink, sw: sw * .35, curv: .2 }); } }
  };
  // 长锯：老树用锯（更慢更残忍），两人一前一后，锯身在两人之间来回
  PROP.saw = (x, y, u, o = {}) => {
    boilSeed('saw2'); const s = u * (o.k || 1) * 1.7, sw = swOf(s) * .7, L = s * 3.2, sag = s * .18;
    paint(ribbon([[x, y], [x + L * .5, y + sag], [x + L, y]], .18 * s, .13 * s), { wash: C.steelLt, fill: C.steelDk, fillOp: 45, bleed: .08, tex: .5, ink: C.ink, sw: sw * .5 });
    for (let i = 1; i < 14; i++) { const px = x + i / 14 * L, py = y + lerp(0, sag, Math.min(1, i / 7)); inkLine([[px, py + s * .075], [px + s * .05, py + s * .17]], sw * .45, C.steelDk, 'inkfine', 0); }
    for (const e of [0, 1]) { const ex = e ? x + L : x;
      paint(ellPts(ex, y - s * .02, s * .17, s * .13, 10, 0, e ? .3 : -.3), { wash: C.woodDk, ink: C.ink, sw: sw * .7 });
      inkLine([[ex - (e ? s * .1 : -s * .1), y - s * .12], [ex + (e ? s * .1 : -s * .1), y - s * .3]], sw * .9, C.wood, 'ink', .3); }
  };
  // 主角配件：叶子挂牌（第二部）与那条大了两号的破围巾（第一部）
  PROP.leafBadge = (x, y, u, o = {}) => {
    boilSeed('badge'); const s = u * (o.k || 1), sw = swOf(s) * .6;
    inkLine([[x - s * .5, y - s * 3.4], [x, y - s * 2.6], [x + s * .5, y - s * 3.4]], sw * .7, C.clothDk, 'ink', .5);
    paint(blob(x, y - s * 2.2, s * .34, s * .5, 2, .1, 18, .85, 1.2), { wash: o.lit > 0 ? mixCol(C.sap, C.warm, clamp(o.lit)) : C.sap, fill: C.sapLt, fillOp: 55, bleed: .12, tex: .6, ink: C.ink, sw: sw * .85 });
    inkLine([[x, y - s * 2.6], [x, y - s * 1.75]], sw * .5, C.sapDk, 'inkfine', 0);
    if (o.lit > 0) halo(x, y - s * 2.2, s * 1.6 * o.lit, C.warm, .9 * o.lit);
  };
  PROP.scarf = (u, o = {}) => {   // 身体局部空间：塞进 clawd 的 draw 钩子
    boilSeed('scarf2'); const s = u, sw = swOf(s) * .7, w = o.wind ?? 0, col = o.col || C.scarf;
    paint(rectPts(-5.2 * s, -3.6 * s, 10.4 * s, 1.15 * s, s * .06), { wash: col, fill: C.wine, fillOp: 45, bleed: .12, tex: .7, border: .45, ink: C.ink, sw });
    paint(ribbon([[-4.4 * s, -2.9 * s], [-5.6 * s - w * s, -1.6 * s], [-6.4 * s - w * 1.8 * s, .1 * s]], 1.05 * s, .7 * s), { wash: col, fill: C.wine, fillOp: 40, bleed: .12, tex: .7, ink: C.ink, sw });
    for (let i = 0; i < 4; i++) inkLine([[-6.5 * s - w * 1.8 * s + i * s * .18, .05 * s], [-6.55 * s - w * 1.8 * s + i * s * .18, .38 * s]], sw * .5, C.clothDk, 'inkfine', 0);
    for (let i = 0; i < 3; i++) paint(rectPts((-2 + i * 2.4) * s, -3.45 * s, s * .8, s * .35, s * .04), { wash: '#8E3A2C', ink: null });
  };

  // ================================================================ 冷光 / 暖光（都带落地光斑）
  // 火把：杆 + 缠绳 + 被风吹斜的火焰 + 火星 + 地面光斑。col 决定"亮而不暖"是哪一种恶。
  PROP.torch = (x, y, u, o = {}) => {
    boilSeed('torch2'); const s = u * (o.k || 1) * 2.1, col = o.col || C.warm, sw = swOf(s) * .7;
    const wind = Math.sin(T * 1.7 + x * .01) * .12 + (o.wind || 0);
    // §53 杆子的墨线必须按**杆宽**给：原来 ink 用了 sw*.85（画笔序号 1.55 ≈ 20px 描边），
    // 一根 9px 宽的木杆被描成一条黑蛇，观众只看得见"一根弯曲的黑棍"，看不见火把。
    // 第十七轮 2：杆子再砍短一截、火焰加大 —— 原来杆高 1.52s、火只有 .34s 宽，
    // 画面读作"举着一根长棍，尖上有个小紫块"。火把的重点必须是**火**。
    paint(ribbon([[x, y], [x + s * .04, y - s * .58], [x + s * .07, y - s * 1.06]], .115 * s, .09 * s), { wash: C.wood, ink: mixCol(C.wood, C.ink, .55), sw: sw * .22 });
    for (let i = 0; i < 3; i++) inkLine([[x - s * .05, y - s * (.74 + i * .13)], [x + s * .15, y - s * (.79 + i * .13)]], sw * .16, C.clothDk, 'inkfine', 0);
    paint(ellPts(x + s * .07, y - s * 1.10, s * .19, s * .11, 10, s * .01), { wash: C.iron, fill: C.steelDk, fillOp: 70, ink: C.ink, sw: sw * .2 });   // 火钵
    const fx = x + s * .08 + wind * s * .45, fy = y - s * 1.18, f = flame(fx, fy, s * .52, s * 1.52, col, 1.2);
    halo(fx, fy - s * .55, s * 3.6 * f, col, 1);
    // 空气中的"亮"：一盏夜里举着的火把，先改变的是**它周围那团空气**，然后才是地面。
    // 只画地面光斑会让火把像"举着一支笔，地上有一块白"（§52 的观感）。这层极淡，不是换背景。
    if (o.bloom !== false) PROP.airGlow(fx, fy - s * .6, s * 2.1 * f, col, 1.15);
    embers(fx, fy - s * .6, s * .6, s * 2.0, 5, mixCol(col, hotOf(col), .55));
    if (o.pool !== false) PROP.lightPatch(x, y + 1, s * (o.poolR || 3.4) * f, col, .85);
    if (o.side) PROP.sideGlow(x + s * .5, y - s * 1.8, s * 2.4, s * 2.6, col, .5);
  };
  // 灯笼：挂在高杆上，玻璃里一粒芯，光斑落在正下方
  PROP.lantern = (x, y, u, o = {}) => {
    boilSeed('lantern2'); const s = u * (o.k || 1) * 1.5, col = o.col || PAL.indigo, sw = swOf(s) * .7, f = 1 + .1 * Math.sin(T * 9);
    let bx = x, by = y - s * 2.6;
    if (o.pole) { paint(ribbon([[x, y], [x + s * .04, y - s * 4.2], [x + s * .9, y - s * 4.5]], .11 * s, .08 * s), { wash: C.wood, ink: C.ink, sw: sw * .8 }); bx = x + s * .85; by = y - s * 4.5; }
    inkLine([[bx, by - s * .5], [bx, by - s * .1]], sw * .7, C.iron, 'ink', 0);
    // 第十六轮复验：灯笼原来是一个**描了粗黑边的等宽胶囊** → 读作 App 图标/按钮。
    // 纸灯笼是**鼓**的：上下收口、中间胀出，骨架在两端捏紧。轮廓改成按高度采样出的纺锤形，
    // 墨线减到一半（描边越粗越像 UI 元素），里面的光芯也不再是 10 顶点的多边形。
    const body = [], nb = 16;
    for (let i = 0; i <= nb; i++) { const q = i / nb, bulge = .30 + .70 * Math.sin(Math.PI * (.08 + .84 * q));
      body.push([bx - s * .46 * bulge, by + s * 1.1 * q]); }
    for (let i = nb; i >= 0; i--) { const q = i / nb, bulge = .30 + .70 * Math.sin(Math.PI * (.08 + .84 * q));
      body.push([bx + s * .46 * bulge, by + s * 1.1 * q]); }
    paint(body, { wash: mixCol(col, C.night, .5), fill: C.night, fillOp: 65, bleed: .06, tex: .6, border: .35, ink: C.ink, sw: sw * .5, curv: .42 });
    for (const d of [-1, 1]) inkLine([[bx - s * .30 * d, by + s * .12], [bx - s * .40 * d, by + s * .55], [bx - s * .30 * d, by + s * .98]], sw * .3, mixCol(C.iron, col, .45), 'inkfine', .3);
    paint(ellPts(bx, by + s * .55, s * .27 * f, s * .40 * f, 18), { wash: mixCol(col, hotOf(col), .6), bleed: .2, tex: .5, ink: null });
    halo(bx, by + s * .55, s * 2.1 * f, col, 1); PROP.airGlow(bx, by + s * .5, s * 1.25 * f, col, 1);
    for (const d of [-1, 1]) inkLine([[bx - s * .42, by + s * (.18 + d * .2)], [bx - s * .52, by + s * (.1 + d * .2)]], sw * .5, C.iron, 'inkfine', 0);
    if (o.pool !== false) PROP.lightPatch(bx, y + 1, s * (o.poolR || 4.2) * f, col, .95);
  };
  // 篝火：三层火 + 柴堆 + 一大片金色光斑 + 压平的雪圈（§26"世界的边界"）
  PROP.campfire = (x, gy, u, o = {}) => {
    boilSeed('fire'); const s = u * (o.k || 1) * 2.4, sw = swOf(s) * .7, f = 1 + .12 * Math.sin(T * 11) + .05 * Math.sin(T * 29);
    paint(ellPts(x, gy, s * 1.5, s * .38, 22), { fill: mixCol(C.snowSh, C.ink, .18), fillOp: 90, bleed: .16, tex: .5, border: .4, ink: null });
    for (let i = 0; i < 4; i++) { const a = -.5 + i * .34;
      paint(ribbon([[x - Math.cos(a) * s * .95, gy - s * .08 + Math.sin(a) * s * .16], [x + Math.cos(a) * s * .95, gy - s * .08 - Math.sin(a) * s * .16]], .13 * s, .1 * s), { wash: i % 2 ? C.wood : C.woodDk, ink: C.ink, sw: sw * .7 }); }
    flame(x, gy - s * .16, s * .62, s * 1.75 * f, C.warm, 1.3);
    halo(x, gy - s * .9, s * 2.7 * f, C.warm, .95);
    embers(x, gy - s * 1.2, s * .8, s * 3.4, 8, C.warm, .8);
    if (o.pool !== false) { PROP.lightPatch(x, gy + 1, s * (o.poolR || 5.4) * f, C.warm, .95);
      PROP.litFace(x, gy - s * .1, s * 3, s * .7, C.warm, .5); }   // 火光照在压平的雪圈上，不只是地上有一滩黄
  };
  // 霓虹：暗底上几根高饱和灯管（§42：不能整片楼都在发光）
  PROP.neon = (x, y, u, o = {}) => {
    boilSeed('neon'); const s = u * (o.k || 1), col = o.col || C.neonP, sw = swOf(s) * .8, blink = o.blink ? (.55 + .45 * Math.sin(T * 6.3)) : 1;
    paint(rectPts(x - s * 1.5, y - s * 1.1, s * 3, s * 1.5, s * .1), { wash: C.night, fill: '#1B1B2E', fillOp: 80, bleed: .1, tex: .5, ink: C.ink, sw: sw * .8 });
    brush.noWash(); brush.noFill(); brush.noHatch(); brush.set('ink', mixCol(col, '#FFFFFF', .35 * blink), sw * 1.5);
    brush.beginShape(.5); for (const p of [[x - s * .85, y - s * .18], [x - s * .5, y - s * .78], [x - s * .1, y - s * .2], [x + s * .3, y - s * .8]]) brush.vertex(p[0], p[1]); brush.endShape(false);
    brush.beginShape(.5); for (const p of [[x + s * .55, y - s * .75], [x + s * .95, y - s * .5], [x + s * .62, y - s * .28], [x + s * .98, y - s * .05]]) brush.vertex(p[0], p[1]); brush.endShape(false);
    halo(x, y - s * .45, s * 1.8 * blink, col, .8 * blink);
  };
  // 灯塔：塔身 + 灯室 + 每八拍扫过一次的光束（§7）。m = 几个 Clawd 高。
  PROP.lighthouse = (x, gy, m, o = {}) => {
    boilSeed('lh'); const h = PX(m), s = h * .38, sw = swOf(s) * .7;
    contact(x, gy, s * .8, .8);
    paint([[x - s * .5, gy], [x - s * .3, gy - h], [x + s * .3, gy - h], [x + s * .5, gy]], { wash: C.cloth, fill: C.clothDk, fillOp: 50, bleed: .12, tex: .7, ink: C.ink, sw });
    for (let i = 0; i < 3; i++) paint(rectPts(x - s * (.52 - i * .07), gy - h * (.25 + i * .28), s * (1.04 - i * .14), h * .09, s * .02), { wash: C.red, fill: C.wine, fillOp: 45, ink: null });
    paint(rrPts(x - s * .34, gy - h - s * .5, s * .68, s * .55, s * .1, s * .02), { wash: C.iron, ink: C.ink, sw: sw * .9 });
    const a = (o.beam ?? frac(bpOf(T) / 8)) * TAU, on = .35 + .65 * Math.pow(Math.max(0, Math.cos(a * 2)), 3);
    paint(ellPts(x, gy - h - s * .24, s * .2, s * .2, 12), { wash: mixCol(C.warm, '#FFFFFF', .4), ink: null });
    halo(x, gy - h - s * .24, s * 1.4 * on, C.warm, .95 * on);
    if (on > .2) { const bx = x + Math.cos(a) * s * 26, by = gy - h - s * .24 + Math.sin(a) * s * 4;
      paint([[x, gy - h - s * .34], [bx, by - s * 1.6], [bx, by + s * 1.6], [x, gy - h - s * .14]], { wash: mixCol(C.warm, C.snow, .35), washOp: 34 * on, ink: null }); }
    if (o.pool) PROP.lightPatch(x, gy + 1, s * 2.2, C.warm, .5 * on);
  };

  // ================================================================ 植物
  // 冷杉。§50 的三条抱怨全落在这一个函数上："看不出来是树"（干净三角直接插地里，没有树干也没有针叶感）、
  // "树上都没有雪"（原来每层只有一块飘着的椭圆）、"太小"（尺度表原来给 2.6）。
  // 画法：**每一层是一个下垂的枝盘多边形**——上缘拱起、下缘带齿（齿尖就是那一簇簇针叶的末端），
  // 雪是沿上缘压的一条**壳**（雪知道重力，只落在朝上的面），树干露到树高 ~0.36。
  // 一层 = 1 个枝盘 + 1 条雪壳，不是十几根枝条：既读得出树，也让一片林子画得完（原来一棵树要 30 多条路径，
  // 一张 18 棵的检查表渲 33 秒/帧——那等于宣告"森林"这个镜头不能做）。
  //   o.snowK 雪负载 0..1（远景 .35、被摇过 0）  o.bare 枯枝（第二部被砍光的林子）
  //   o.old   五层 + 板根 + 更宽                  o.wind 摆幅 0..1，枝和雪一起抖
  PROP.fir = (x, gy, m, o = {}) => {
    if (o.cheap) return PROP.firSil(x, gy, m, o);     // 背景排一律走剪影版，见 PROP.firSil
    boilSeed('fir' + Math.round(o.seed ?? x));
    const h = PX(m), sw = swOf(h * .26), base = o.tone || C.sapDk;
    const snowK = o.snow === false ? 0 : clamp(o.snowK ?? 1);
    const tiers = o.old ? 5 : 4, trunkH = h * .36, w = h * (o.old ? .36 : .3);
    const sway = (o.wind ?? 0) * Math.sin(T * 1.6 + x * .02) * h * .022, teeth = 4;
    contact(x, gy, w * .55, .7);
    if (snowK > .2) paint(ellPts(x, gy, trunkH * .55, trunkH * .1, 14, h * .003), { wash: C.snow, fill: C.snowLt, fillOp: 58 * snowK, bleed: .16, tex: .5, ink: null });
    paint(ribbon([[x, gy], [x + sway * .5, gy - trunkH * .6], [x + sway, gy - trunkH]], h * .046, h * .026),
      { wash: C.bark, fill: C.woodDk, fillOp: 55, bleed: .1, tex: .8, ink: C.ink, sw: sw * .8 });
    if (o.old) for (const d of [-1, 1]) inkLine([[x + d * h * .048, gy], [x + d * h * .01, gy - h * .07]], sw * .8, C.bark, 'ink', .2);   // 板根
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1);
      const ty = gy - trunkH * .92 - (h * .9 - trunkH * .92) * t;
      const tw = w * (1 - t * .72) * (.9 + .18 * hash(i * 2.3));
      // §55 层厚与下垂量必须**按层间距封顶**：老树 5 层、h=1200 时 th 有 150 而间距只有 170，
      // 上一层的枝尖会插进这一层的雪里，两层的雪互相交叉成一张白色锯齿网（树看起来在发光）。
      const gap = (h * .9 - trunkH * .92) / (tiers - 1);
      const th = Math.min(h * .125 * (1 - t * .28), gap * .72), dr = Math.min(h * .05 * (1 - t * .5), gap * .16), jx = sway * (.3 + t * .8);
      const top = s => ty - th * (1 - Math.abs(s) * .82) + dr * s * s;
      if (o.bare) {   // 枯树：一层一根向下垂的肢 + 一截向上折断的小枝
        for (const d of [-1, 1]) {
          inkLine([[x + jx * .4, ty], [x + jx + d * tw * .52, ty - th * .08], [x + jx + d * tw, ty + th * .8]], sw * .8, C.bark, 'ink', .3);
          inkLine([[x + jx + d * tw * .6, ty + th * .18], [x + jx + d * tw * .82, ty - th * .62]], sw * .5, C.bark, 'inkfine', .25); }
        continue;
      }
      const p = [];
      for (let k = 0; k <= teeth; k++) { const s = -1 + 2 * k / teeth; p.push([x + jx + s * tw, top(s)]); }
      for (let k = teeth; k >= 0; k--) { const s = -1 + 2 * k / teeth, xs = x + jx + s * tw;
        p.push([xs + tw / teeth * .45, top(s) + th * (.7 + .6 * (1 - Math.abs(s)))]);       // 齿尖
        p.push([xs - tw / teeth * .1, top(s) + th * .16]); }                                  // 齿谷
      paint(p, { wash: mixCol(base, C.night, .18 + .1 * t), fill: mixCol(base, C.sapLt, .2 - .12 * t), fillOp: 62, bleed: .13, tex: .7, border: .45, ink: C.ink, sw: sw * .8, curv: .3 });
      if (snowK > .05) {
        // §55 雪壳只压在**下垂的肩**上，而且必须是**楔形**（内端收尖、外端最厚）。
        // 铺满整层时雪壳的垂直摆幅(≈th+dr)会超过层间距，相邻两层互相交叉成一张白色锯齿网；
        // 改成等厚带子又变成一排灰色木板/墓碑。楔形才读得出"雪压松枝"。
        for (const d of [-1, 1]) {
          const s0 = d * .26, s1 = d, a0 = top(s0), a1 = top(s1);
          paint([[x + jx + s0 * tw, a0 + th * .05], [x + jx + s1 * tw * .95, a1 - th * (.02 + .07 * snowK)],
                 [x + jx + s1 * tw * .8, a1 + th * (.12 + .22 * snowK)], [x + jx + s0 * tw * 1.1, a0 + th * .13]],
            { wash: C.snow, fill: C.snowLt, fillOp: 58 * snowK, bleed: .28, tex: .55, border: .2, ink: null, curv: .45 });
        }
        if (i === tiers - 1) paint(ellPts(x + jx, ty - th * .5, tw * .26, th * .26, 10), { wash: C.snowLt, fillOp: 48 * snowK, bleed: .22, ink: null });
      }
    }
    if (!o.bare) {   // 顶心一撮：没有尖顶的树读起来像一丛灌木
      inkLine([[x + sway, gy - h * .9], [x + sway * 1.5, gy - h * 1.02]], sw * .7, mixCol(base, C.sapDk, .45), 'ink', .2);
      if (snowK > .4) paint(ellPts(x + sway * 1.2, gy - h * .98, h * .026 * snowK, h * .02 * snowK, 8), { wash: C.snowLt, ink: null }); }
    if (o.rime) for (let i = 0; i < 4; i++) { const ry = gy - h * (.35 + .16 * i);            // 挂着的冰晶雾
      for (const d of [-1, 1]) inkLine([[x + d * w * .55, ry], [x + d * w * .85, ry + h * .035]], sw * .4, C.snowLt, 'inkfine', 0); }
  };
  // 远景冷杉剪影：**两条路径**（一层肩线多边形 + 一道压在肩线上的雪）。
  // 整片林子如果都用 PROP.fir（一棵 ~15 条路径），13 棵就是 200 条，一部片子渲不完——
  // 所以只有真正参与叙事的树（被砍的那几棵、主角靠着睡的那棵）才用 PROP.fir，林线一律走这里。
  // PROP.fir 认 o.cheap，firBand 认 o.cheap，于是场景里只需要"这排是背景"一个词。
  PROP.firSil = (x, gy, m, o = {}) => {
    const h = PX(m), w = h * (o.old ? .36 : .3), tiers = o.tiers || 4, snowK = clamp(o.snowK ?? .5);
    const R = [], L = [];
    for (let i = 1; i <= tiers; i++) {
      const t = i / tiers, yy = gy - h * (1 - .86 * t), ww = w * (.2 + .8 * t) * (.94 + .12 * hash(i * 3.1 + (o.seed || 0)));
      R.push([x + ww * .5, yy - h * .05], [x + ww, yy + h * .014]);
      L.unshift([x - ww, yy + h * .014], [x - ww * .5, yy - h * .05]);
    }
    const p = [[x, gy - h * 1.03], ...R, [x + w * .13, gy], [x - w * .13, gy], ...L];
    paint(p, { wash: o.col || mixCol(C.sapDk, '#20264A', .5), washOp: o.op === undefined ? 255 : o.op, ink: null, curv: .2 });
    if (snowK > .1) {   // 一道厚雪压在每一层的肩线上：这就是"雪里的林子"
      // §54 inkLine 的 sw 是**画笔序号**（swOf 之后的 0.4..2.6），不是像素。这里原来写的是
      // clamp(h/46,.6,3.4) —— 一棵 300px 的树直接拿到最粗那一档，"肩线上一道薄雪"变成"一条白色闪电"。
      // §55 再修：原来那条线只走 R（**右半边**的点），所以剪影树永远只有一侧镶亮边，读起来像描了个歪轮廓。
      // 现在两侧对称，而且只画最外两层（背景排要便宜：一棵 5 条路径封顶）。
      const sc = o.snowCol || dim('#CBD6E6', .62);
      for (let i = tiers; i >= tiers - 1; i--) {
        const t = i / tiers, yy = gy - h * (1 - .86 * t), ww = w * (.2 + .8 * t) * (.94 + .12 * hash(i * 3.1 + (o.seed || 0)));
        for (const d of [-1, 1]) inkLine([[x + d * ww * .3, yy - h * .052], [x + d * ww * .98, yy + h * .016]], swOf(h * .055) * snowK, sc, 'ink', .2);
      }
      inkLine([[x, gy - h * 1.03], [x, gy - h * .93]], swOf(h * .045) * snowK, sc, 'ink', .2);
    }
  };
  // 林带：三层**进深**，远排抬高、缩小、掺夜色、**排得更密**（远处的树本来就挤在一起），近排才给完整雪负载，
  // 并且按"远→近"画，近树真的压住远树。o.span = 整条林带要占的宽度，不传就按树高推一个。
  // §50 "森林太稀太小"：原来 n 棵树共用一个 gap，所以要么叠成一坨、要么排成一行图标。
  PROP.firBand = (x0, gy, n, m, o = {}) => {
    const rows = o.rows ?? 3, span = o.span ?? PX(m) * rows * 1.5;
    for (let r = rows - 1; r >= 0; r--) {                        // 先远后近
      const q = (rows - 1 - r) / Math.max(1, rows - 1);           // 0 = 最远，1 = 最近
      const mm = m * (.5 + .62 * q), cnt = Math.max(2, Math.round(n / rows * (1.6 - .9 * q)));
      for (let i = 0; i < cnt; i++) {
        const gap = span / cnt, px = x0 + (i + .5 + (hash(r * 7 + i * 3.7) - .5) * .6) * gap;
        PROP.fir(px, gy - (1 - q) * (o.rise ?? PX(m) * .1), mm * (.9 + .28 * hash(r * 5 + i + 9)),
          { seed: r * 31 + i, tone: mixCol(o.tone || C.sapDk, C.night, .08 + .4 * (1 - q)),
            snowK: (o.snowK ?? 1) * (.4 + .6 * q), old: o.old && q > .75, bare: o.bare, cheap: o.cheap });
      }
    }
  };
  // 倒下的树。§50 的"樵夫砍得树都比樵夫还小"：m 说的是它**站着时**有几个 Clawd 高（用 SCALE.env.firFelled），
  // 躺倒仍然是那个长度——这是"砍掉一棵大树"唯一诚实的画法。原来的版本把根盘画到离地 0.3 树高处，
  // 读起来像一根斜着的圆木；现在树身贴着雪、根端被抬起一点，断枝上压着雪，梢头还留一团针叶冠。
  PROP.fallenTrunk = (x, gy, m, o = {}) => {
    boilSeed('falln');
    const H = PX(m), dir = o.dir || 1, sw = swOf(H * .22), snowK = o.snow === false ? 0 : clamp(o.snowK ?? 1);
    const L = H * (.94 + .08 * hash(3)), th = H * (o.old ? .085 : .062), lift = o.lift ?? .55;
    const by0 = gy - th * 1.5 - lift * th * 1.2;                              // 根端（抬起）
    contact(x + dir * L * .45, gy, L * .4, .5);
    paint(ellPts(x + dir * L * .5, gy + th * .35, L * .52, th * 1.15, 24, H * .004), { wash: C.snow, fill: C.snowLt, fillOp: 42, bleed: .18, tex: .5, ink: null });   // 压出来的雪槽
    paint(ribbon([[x, by0], [x + dir * L * .5, gy - th * 1.15], [x + dir * L, gy - th * .85]], th * 1.12, th * .68),
      { wash: C.bark, fill: C.woodDk, fillOp: 50, bleed: .1, tex: .8, border: .5, ink: C.ink, sw, curv: .35 });
    if (snowK > .15) paint(ribbon([[x + dir * L * .1, by0 - th * 1.05], [x + dir * L * .5, gy - th * 1.5], [x + dir * L * .9, gy - th * 1.2]], th * .42 * snowK, th * .3 * snowK),
      { wash: C.snow, fill: C.snowLt, fillOp: 74 * snowK, bleed: .16, tex: .5, ink: null, curv: .4 });                 // 树身上那条雪脊：没有它就不"躺在雪里"
    for (let i = 0; i < 3; i++) inkLine([[x + dir * L * (.2 + i * .22), gy - th * (1.5 - i * .15)], [x + dir * L * (.28 + i * .22), gy - th * (.75 - i * .06)]], sw * .45, C.woodDk, 'inkfine', .2);   // 树皮裂纹
    const nBr = o.bare ? 0 : (o.old ? 4 : 3);
    for (let i = 0; i < nBr; i++) {                                            // 断枝：短、向上、每截顶压雪
      const q = .18 + .72 * (i + .5) / nBr, bx = x + dir * L * q, by = lerp(by0, gy - th * .9, q) - th * .5;
      const bl = th * (1.7 - .9 * q) * (.8 + .4 * hash(i)), ba = -1.25 - .5 * hash(i + 4);
      const tx = bx + Math.cos(ba) * bl * dir, ty = by + Math.sin(ba) * bl;
      paint(ribbon([[bx, by], [lerp(bx, tx, .55), lerp(by, ty, .42)], [tx, ty]], th * .34, th * .1),
        { wash: C.bark, fill: C.woodDk, fillOp: 45, bleed: .1, tex: .7, ink: C.ink, sw: sw * .8, curv: .35 });
      if (snowK > .05) paint(ellPts(lerp(bx, tx, .55), lerp(by, ty, .55) - th * .14, bl * .2 * snowK, th * .2 * snowK, 10, H * .003, ba * .4 * dir),
        { wash: C.snow, fill: C.snowLt, fillOp: 62 * snowK, bleed: .14, tex: .5, ink: null });
    }
    if (!o.bare) {                                                             // 梢头一团针叶冠
      const cx = x + dir * L, cy = gy - th * .95;
      for (let i = 0; i < 5; i++) { const a2 = -Math.PI * .5 + (i - 2) * .52;
        paint(ribbon([[cx - dir * th * 1.3, cy], [cx + Math.cos(a2) * th * 2.1 * dir, cy + Math.sin(a2) * th * 2.1]], th * .5, th * .1),
          { wash: mixCol(C.sapDk, C.night, .12), fill: C.sap, fillOp: 40, bleed: .12, tex: .7, ink: C.ink, sw: sw * .6, curv: .3 }); }
      if (snowK > .2) paint(ellPts(cx, cy - th * 1.15, th * 1.7 * snowK, th * .44 * snowK, 14), { wash: C.snow, fill: C.snowLt, fillOp: 64 * snowK, bleed: .14, tex: .5, ink: null });
    }
    // 根盘：翻起的土堆 + 三根断根。"倒"必须有重量和被拔起来的暴力。
    // （原来是一个 9 瓣带描边的 blob——描边把瓣画成了六个尖角，读成一朵花。）
    paint(ellPts(x - dir * th * .5, gy + th * .4, th * 2.3, th * .66, 20, H * .003), { wash: mixCol(C.woodDk, C.snowSh, .3), fill: C.woodDk, fillOp: 65, bleed: .2, tex: .8, ink: null });
    paint(ellPts(x - dir * th * .35, by0 + th * .1, th * 1.6, th * 1.15, 18, th * .1), { wash: C.woodDk, fill: C.bark, fillOp: 55, bleed: .16, tex: .8, border: .4, ink: C.ink, sw: sw * .9 });
    paint(ellPts(x - dir * th * .9, by0 - th * .55, th * .8, th * .5, 12, th * .07), { wash: C.bark, fill: C.woodDk, fillOp: 50, bleed: .14, tex: .7, ink: C.ink, sw: sw * .7 });
    for (let i = 0; i < 3; i++) { const ra = -Math.PI * (.2 + i * .3);
      inkLine([[x - dir * th * .3, by0 + th * .2], [x - dir * th * .3 + Math.cos(ra) * th * 2 * -dir, by0 + Math.sin(ra) * th * 1.6]], sw * .8, C.bark, 'ink', .3); }
    if (snowK > .3) paint(ellPts(x - dir * th * .4, by0 - th * 1.5, th * 1.1 * snowK, th * .32 * snowK, 12), { wash: C.snowLt, ink: null });
  };
  // 树桩：桩身 + 年轮 + 积雪顶。giant 要三个人抱不过来（§41）
  PROP.stump = (x, gy, m, o = {}) => {
    boilSeed('stump' + Math.round(o.seed ?? x)); const h = PX(m), w = h * (o.wide || .85), sw = swOf(h * .5);
    contact(x, gy, w * 1.1, .85);
    paint(rectPts(x - w, gy - h, w * 2, h, h * .04), { wash: C.bark, fill: C.woodDk, fillOp: 55, bleed: .12, tex: .8, border: .5, ink: C.ink, sw });
    for (let i = 0; i < 3; i++) inkLine([[x - w * .7 + i * w * .7, gy - h * .85], [x - w * .62 + i * w * .7, gy - h * .15]], sw * .4, C.woodDk, 'inkfine', 0);
    paint(ellPts(x, gy - h, w, h * .2, 22, h * .01), { wash: o.snow ? C.snow : '#C9A876', fill: o.snow ? C.snowLt : C.crumbLt, fillOp: 55, bleed: .12, tex: .6, border: .45, ink: C.ink, sw });
    if (!o.snow) for (let i = 1; i <= 3; i++) paint(ellPts(x, gy - h, w * i / 4, h * .2 * i / 4, 18), { ink: C.woodDk, sw: sw * .35, wash: null });
    if (o.snow) paint(ellPts(x - w * .3, gy - h - h * .04, w * .4, h * .07, 12), { wash: C.snowLt, ink: null });
  };
  // 树苗：可长高（k = 生长量），带根土球；lit 时苗心当夜灯
  PROP.sapling = (x, gy, m, o = {}) => {
    boilSeed('sapl' + Math.round(o.seed ?? x)); const h = PX(m) * (.6 + .4 * clamp(o.k ?? 1)), sw = swOf(h * .6);
    paint(ellPts(x, gy, h * .16, h * .06, 14), { fill: C.ink, fillOp: 55, bleed: .2, ink: null });
    paint(blob(x, gy - h * .02, h * .12, h * .07, 5, .2, 14), { wash: C.woodDk, fill: C.bark, fillOp: 50, ink: C.ink, sw: sw * .7 });
    inkLine([[x, gy - h * .04], [x, gy - h * .62]], sw * .9, C.wood, 'ink', .3);
    for (const d of [-1, 1]) { const ly = gy - h * (.42 + .12 * (d > 0 ? 1 : 0));
      paint(blob(x + d * h * .16, ly, h * .15, h * .08, 2, .12, 14, .85, d * .5), { wash: C.sap, fill: C.sapLt, fillOp: 50, bleed: .1, tex: .6, ink: C.ink, sw: sw * .7 }); }
    if (o.lit > 0) { halo(x, gy - h * .5, h * .55 * o.lit, C.warm, .9 * o.lit); paint(ellPts(x, gy - h * .5, h * .05, h * .06, 8), { wash: C.warmLt, ink: null }); PROP.lightPatch(x, gy + 1, h * .7 * o.lit, C.warm, .6 * o.lit); }
  };
  // 巨树：粗到有板根、树皮有裂纹、**光在树干内部的裂口里**（§41：不能挂在轮廓上像路灯）
  PROP.giantTree = (x, gy, m, o = {}) => {
    boilSeed('giant'); const h = PX(m), w = h * .13, sw = swOf(h * .2);
    contact(x, gy, w * 2.4, .9);
    // 主干：一整块从板根收拢到树冠的干（两条交叉的"腿"会读成圆规）
    // ⚠ o.noBase —— 第二十六轮 R26-2b：**倒下的树不该再有底部**。
    //   原来立着和倒下用的是同一份几何，底部那圈板根（干宽从 w*.9 外扩到 w*2.7）+ 两条根翼
    //   会跟着树一起躺倒，于是成片里每一棵倒树都成了一头粗一头更粗的"哑铃/十字架"
    //   （t=88 全分辨率所见），而且它和旁边那个树墩**同时存在** —— 等于底部被留在了两处。
    //   一棵被锯断的树，从断口往上就该是平行的干；板根属于**留在地上的那个墩**。
    //   默认关：立着的树、第二部那棵希望之树的轮廓一个像素都不许动。
    const nb = o.noBase ? .45 : 1.35;
    paint([[x - w * nb, gy], [x - w * .6, gy - h * .26], [x - w * .45, gy - h * .74], [x + w * .45, gy - h * .74], [x + w * .6, gy - h * .26], [x + w * nb, gy]],
      { wash: C.bark, fill: C.woodDk, fillOp: 45, bleed: .12, tex: .8, border: .5, ink: C.ink, sw, curv: .22 });
    if (!o.noBase) for (const d of [-1, 1]) paint([[x + d * w * .55, gy], [x + d * w * 1.55, gy - h * .03], [x + d * w * 1.1, gy - h * .13], [x + d * w * .5, gy - h * .09]],
      { wash: C.bark, fill: C.woodDk, fillOp: 40, bleed: .1, tex: .7, ink: C.ink, sw: sw * .7, curv: .3 });
    for (let i = 0; i < 7; i++) { const cy0 = gy - h * (.06 + .09 * i); inkLine([[x - w * .4 + hash(i) * w * .8, cy0], [x - w * .3 + hash(i + 3) * w * .6, cy0 - h * .05]], sw * .45, C.woodDk, 'inkfine', .4); }
    const heart = o.heart ?? .8, hy = gy - h * .46;
    // 树心是一块**会发光的伤口**，不是钉在树干上的便利贴。原来它是一个四条直边的平行四边形
    // （第十六轮 N7：白天看就是一张黄色贴纸）。亮起来的时候改成竖向的柳叶形裂口：
    // 上下收尖、中间鼓、里浅外深，边缘再压两道翘起的树皮唇。
    // 第一部（A4 的立着被砍的树）传的是 heart:0 —— 那一档维持原来的旧形状，
    // 因为第一部的帧已经渲完，不能在这里改它们的轮廓。
    if (heart > .02) {
      // 宽高比是这条读成"眼睛"还是"树瘤"的唯一变量：柳叶形 wl/ww ≈ 2.5 就是一个竖着的瞳孔，
      // 而且它正好长在整棵树唯一的"脸上"。伤口要读成**结疤**，就得接近圆的、并且歪。
      const wl = h * .062, ww = w * .62, jag = (i) => (hash(i + 7) - .5) * ww * .3;
      const lip = [[x - ww * .5 + jag(1), hy - wl], [x + ww * .18 + jag(2), hy - wl * .55], [x + ww * .5 + jag(3), hy + wl * .1],
        [x + ww * .16 + jag(4), hy + wl * .72], [x - ww * .46 + jag(5), hy + wl], [x - ww * .78 + jag(6), hy + wl * .28],
        [x - ww * .72 + jag(7), hy - wl * .5]];
      paint(lip, { wash: mixCol(C.woodDk, '#241A10', .45), fill: '#1B1208', fillOp: 150, bleed: .1, tex: .6, ink: C.ink, sw: sw * .5, curv: .42 });
      const inner = lip.map(([px, py]) => [x + (px - x) * .52, hy + (py - hy) * .58]);
      paint(inner, { wash: mixCol(C.bark, C.warm, .3 + .55 * heart), fill: mixCol(C.warmLt, C.warm, .35), fillOp: 215 * heart, bleed: .16, tex: .35, ink: null, curv: .4 });
      for (const d of [-1, 1]) paint([[x + d * ww * .62, hy - wl * .5], [x + d * ww * 1.05, hy - wl * .18], [x + d * ww * 1.0, hy + wl * .3], [x + d * ww * .58, hy + wl * .55]],
        { wash: mixCol(C.bark, C.warmLt, .12), fill: C.woodDk, fillOp: 40, bleed: .12, tex: .7, ink: C.ink, sw: sw * .42, curv: .35 });
    } else paint([[x - w * .16, hy - h * .09], [x + w * .12, hy - h * .05], [x + w * .06, hy + h * .07], [x - w * .18, hy + h * .04]], { wash: mixCol(C.bark, C.warm, .35 + .4 * heart), ink: C.ink, sw: sw * .6, curv: .3 });
    halo(x, hy, h * .16 * heart, C.warm, .95 * heart);
    for (const d of [-1, 1]) inkLine([[x + d * w * .3, gy - h * .6], [x + d * w * 1.9, gy - h * .78], [x + d * w * 2.9, gy - h * .92]], sw * 1.1, C.bark, 'ink', .4);
    const cy = gy - h * 1.02, cr = h * .34;
    // §48 树冠是**大面积材质**，不是光：它原来用 C.sap / C.sapLt 当 fill，在夜里亮成一块柠檬绿，
    // 把"唯一在发光的是树心"这条语言整个冲掉了。冠压回 sapDk 档，亮只留给受光的一小片和树心的裂口。
    // N6：wash 是水彩笔，即使 alpha=255 也带颗粒，底下没有**不透明的底子**时，
    // 后景的窗户会直接透过树冠看见 —— 树读成一块绿网/鬼影。先铺一层实色 fill 当底子，
    // wash 只负责它的笔触和颗粒。
    paint(blob(x, cy, cr * 1.45, cr * .82, 7, .14, 44, .92, .6), { wash: mixCol(C.sapDk, C.night, .34), fill: mixCol(C.sapDk, C.sap, .3), fillOp: 225, bleed: .14, tex: .7, border: .5, ink: C.ink, sw });
    paint(blob(x - cr * .3, cy - cr * .28, cr * 1.05, cr * .55, 5, .16, 34, .95, 1.4), { wash: mixCol(C.sapDk, C.sapLt, .22), fill: mixCol(C.sapDk, C.sapLt, .3), fillOp: 34, bleed: .16, tex: .7, ink: null });
    if (o.lit > 0) {
      for (let i = 0; i < 16; i++) { const a = hash(i) * TAU, rr = 1 + .12 * Math.sin(a * 7);
        paint(ellPts(x + Math.cos(a) * cr * 1.45 * rr, cy + Math.sin(a) * cr * .82 * rr, cr * .045, cr * .045, 6), { wash: mixCol(C.warmLt, C.warm, hash(i + 5)), washOp: 210 * o.lit, ink: null }); }
      // 树冠整体的光只在**轮廓**上，不是一整盘 ADD 光斑：原来半径 cr*1.6 把半个画面糊成毛玻璃
      halo(x, cy, cr * .62 * o.lit, C.warm, .42 * o.lit);
    }
  };
  // 树的"光灵魂"：从树冠飞散的**光鸟群**，绝不再是向上长的茎（§39）
  // 树光的灵魂：树倒了，光从树冠升起来散掉。§46 —— 原来是"一条横贯画面的白雾"，
  // 因为上升距离按整棵树高算（老树 700px 时它铺满半个画面）而且六粒都带 halo，叠成了白纸。
  // 现在：上升幅度**封顶**（和一棵树冠差不多宽就够），粒子小、只有领头那粒有光晕 —— 读起来是"一束上升的光点"。
  PROP.greenSoul = (x, gy, m, k = 1, col = PAL.sap) => {
    const h = PX(m), kk = clamp(k); if (kk < .02) return;
    boilSeed('soul' + Math.round(x));
    const sc = Math.min(h * .78, 300), w0 = Math.min(h * .03, 13);
    for (let i = 0; i < 5; i++) {
      const ph = clamp(kk * 1.3 - i * .08); if (ph < .02) continue;
      const bx = x + Math.sin(i * 2.2 + ph * 3.4) * sc * (.08 + ph * .2), by = gy - h * .96 - ph * sc - i * sc * .09;
      const a = .95 * (1 - ph * .82), w = w0 * (1 - ph * .38), flap = Math.sin(ph * 22 + i * 2);
      paint([[bx - w, by], [bx - w * .3, by - w * .8 * flap], [bx, by - w * .15], [bx + w * .3, by - w * .8 * flap], [bx + w, by], [bx, by + w * .45]],
        { wash: mixCol(col, C.warmLt, .14), washOp: 245 * a, ink: null });
      if (i === 0) halo(bx, by, w * 3.1, col, .62 * a);
    }
  };

  // ================================================================ 建筑与街
  // 窗格基元：按楼层网格排布、亮灯以"整户"为单位（§19 的彩色噪点就是缺这个）
  PROP.windowGrid = (x, y, w, h, cols, rows, o = {}) => {
    boilSeed('win' + Math.round(x) + '_' + rows); const cw = w / cols, rh = h / rows, sw = swOf(cw) * .35;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const wx = x + c * cw + cw * .22, wy = y + r * rh + rh * .2, ww = cw * .56, wh = rh * .5;
      const sd = hash(r * 7.3 + c * 13.1 + (o.off || 0)), on = o.litFn ? o.litFn(r, c, sd) : sd < (o.lit ?? .3);
      if (on) { paint(rectPts(wx, wy, ww, wh, ww * .12), { wash: mixCol(o.cold ? C.neonB : C.warm, '#FFFFFF', .3), ink: null });
        halo(wx + ww / 2, wy + wh / 2, ww * 1.2, o.cold ? C.neonB : C.warm, .4); }
      else paint(rectPts(wx, wy, ww, wh, ww * .12), { wash: mixCol(o.wall || C.night, C.ink, .25), ink: mixCol(o.wall || C.night, C.ink, .55), sw });
    }
  };
  PROP.cabin = (x, gy, m, o = {}) => {
    boilSeed('cabin' + Math.round(x)); const h = PX(m), w = h * .95, sw = swOf(h * .3);
    contact(x, gy, w * .6, .8);
    paint(rectPts(x - w / 2, gy - h * .62, w, h * .62, h * .02), { wash: C.bark, fill: C.woodDk, fillOp: 50, bleed: .12, tex: .8, border: .5, ink: C.ink, sw });
    for (let i = 1; i < 4; i++) inkLine([[x - w / 2, gy - h * .62 * i / 4], [x + w / 2, gy - h * .62 * i / 4]], sw * .4, C.woodDk, 'inkfine', 0);
    paint([[x - w * .62, gy - h * .6], [x, gy - h], [x + w * .62, gy - h * .6]], { wash: C.woodDk, fill: C.night, fillOp: 45, ink: C.ink, sw });
    paint([[x - w * .6, gy - h * .62], [x, gy - h * 1.02], [x + w * .6, gy - h * .62], [x + w * .5, gy - h * .66], [x, gy - h * .94], [x - w * .5, gy - h * .66]], { wash: C.snow, fill: C.snowLt, fillOp: 60, bleed: .14, tex: .5, ink: null, curv: .3 });
    paint(rectPts(x - w * .12, gy - h * .42, w * .24, h * .42, h * .02), { wash: C.woodDk, ink: C.ink, sw: sw * .8 });
    const lit = o.lit ?? 0;
    paint(rectPts(x + w * .16, gy - h * .48, w * .22, h * .2, h * .015), { wash: lit > .1 ? mixCol(C.warm, C.warmLt, .4 * lit) : mixCol(C.night, C.ink, .3), ink: C.ink, sw: sw * .7 });
    if (lit > .1) { halo(x + w * .27, gy - h * .38, w * .5 * lit, C.warm, .9 * lit); PROP.lightPatch(x + w * .27, gy + 1, w * .58 * lit, C.warm, .55 * lit);
      for (let i = 0; i < 4; i++) inkLine([[x + w * (.18 + .06 * i), gy - h * .46], [x + w * (.2 + .06 * i), gy - h * .3]], sw * .3, C.clothDk, 'inkfine', 0); }   // 窗花
    for (let i = 0; i < 5; i++) { const ix = x - w * .55 + i * w * .28; paint([[ix, gy - h * .62], [ix + w * .02, gy - h * .5], [ix + w * .04, gy - h * .62]], { wash: C.ice, washOp: 200, ink: null }); }
    paint(rectPts(x - w * .44, gy - h * 1.16, w * .12, h * .3, h * .01), { wash: C.iron, ink: C.ink, sw: sw * .7 });
    if (o.smoke > 0) for (let i = 0; i < 3; i++) { const ph = frac(T * .22 + i / 3);
      paint(ellPts(x - w * .38 + Math.sin(ph * 4) * w * .12, gy - h * 1.2 - ph * h * .8, w * (.05 + ph * .1), w * (.05 + ph * .1), 10), { wash: mixCol(C.snowSh, C.night, .4), washOp: 120 * o.smoke * (1 - ph), ink: null }); }
  };
  PROP.tenement = (x, gy, m, o = {}) => {
    boilSeed('ten' + Math.round(x)); const h = PX(m), w = h * (o.wide || .3), sw = swOf(h * .2);
    paint(rectPts(x - w / 2, gy - h, w, h, w * .04), { wash: mixCol(C.night, '#4A4258', .5), fill: '#241F33', fillOp: 60, bleed: .1, tex: .6, border: .4, ink: C.ink, sw });
    PROP.windowGrid(x - w / 2 + w * .08, gy - h + h * .04, w * .84, h * .9, o.cols || 3, o.rows || 8, { lit: o.lit ?? .22, cold: o.cold, off: x * .01, wall: '#2B2540' });
    for (let i = 0; i < 3; i++) { const py = gy - h * (.25 + i * .28);
      inkLine([[x - w * .55, py], [x + w * .55, py]], sw * .35, C.clothDk, 'inkfine', 0);
      for (let k = 0; k < 3; k++) paint(rectPts(x - w * .4 + k * w * .3, py, w * .09, h * .07, 1), { wash: [PAL.rose, C.cloth, C.snow][k % 3], washOp: 200, ink: null }); }
  };
  PROP.glassBlock = (x, gy, m, o = {}) => {
    boilSeed('glass' + Math.round(x)); const h = PX(m), w = h * (o.wide || .26), sw = swOf(h * .2);
    paint(rectPts(x - w / 2, gy - h, w, h, w * .03), { wash: mixCol(C.night, PAL.indigo, .35), fill: '#1E2740', fillOp: 70, bleed: .1, tex: .5, border: .4, ink: C.ink, sw });
    for (let i = 1; i < 12; i++) inkLine([[x - w / 2, gy - h * i / 12], [x + w / 2, gy - h * i / 12]], sw * .3, mixCol(C.night, C.ice, .3), 'inkfine', 0);
    for (let i = 1; i < 4; i++) inkLine([[x - w / 2 + w * i / 4, gy - h], [x - w / 2 + w * i / 4, gy]], sw * .3, mixCol(C.night, C.ice, .3), 'inkfine', 0);
    paint(ribbon([[x - w * .5, gy - h * .9], [x + w * .1, gy - h * .45], [x + w * .5, gy - h * .1]], w * .22, w * .3), { wash: C.ice, washOp: 34, ink: null });
  };
  // 工厂：厂房 + 两根烟囱 + 冷却塔（白汽）+ 两个储油罐 + 架空管道廊 + 探照灯（§6/#6）
  PROP.factory = (x, gy, m, o = {}) => {
    boilSeed('factory'); const h = PX(m), sw = swOf(h * .18), smoke = o.smoke ?? 0;
    paint(rectPts(x - h * .5, gy - h * .42, h, h * .42, h * .01), { wash: '#3A3A4C', fill: '#26262F', fillOp: 65, bleed: .1, tex: .6, border: .4, ink: C.ink, sw });
    paint([[x - h * .5, gy - h * .42], [x - h * .34, gy - h * .56], [x + h * .34, gy - h * .56], [x + h * .5, gy - h * .42]], { wash: '#2E2E3C', ink: C.ink, sw: sw * .8 });
    for (let i = 0; i < 7; i++) { const wx = x - h * .42 + i * h * .13, on = o.win ? hash(i) < .5 : false;
      paint(rectPts(wx, gy - h * .3, h * .08, h * .1, h * .005), { wash: on ? C.warm : '#1B1B24', ink: C.ink, sw: sw * .4 });
      if (on) halo(wx + h * .04, gy - h * .25, h * .12, C.warm, .7); }
    for (const [cx, ch] of [[x - h * .26, h], [x + h * .2, h * .92]]) {
      paint(ribbon([[cx - h * .05, gy - h * .5], [cx - h * .032, gy - ch], [cx + h * .032, gy - ch], [cx + h * .05, gy - h * .5]], 0, 0), { wash: C.cloth, fill: C.clothDk, fillOp: 50, ink: null });
      paint(rectPts(cx - h * .05, gy - ch, h * .1, ch - h * .5, h * .005), { wash: C.cloth, fill: C.clothDk, fillOp: 45, bleed: .1, tex: .7, ink: C.ink, sw });
      paint(rectPts(cx - h * .058, gy - ch, h * .116, h * .035, h * .005), { wash: C.red, ink: C.ink, sw: sw * .6 });
      if (smoke > .02) for (let i = 0; i < 5; i++) { const ph = frac(T * .1 + i / 5 + (cx > x ? .3 : 0)), r = h * (.05 + ph * .16);
        paint(ellPts(cx + Math.sin(ph * 5 + i) * h * .1, gy - ch - ph * h * .5, r, r * .85, 12), { wash: mixCol('#4A4450', '#20201E', ph), washOp: 150 * smoke * (1 - ph * .8), ink: null }); } }
    paint(ellPts(x + h * .46, gy - h * .3, h * .09, h * .3, 16), { wash: dim('#8E8A96', TONE.cool), fill: C.clothDk, fillOp: 35, bleed: .1, tex: .6, ink: C.ink, sw: sw * .8 });
    for (let i = 0; i < 3; i++) { const ph = frac(T * .16 + i / 3);
      paint(ellPts(x + h * .46 + Math.sin(ph * 4) * h * .05, gy - h * .62 - ph * h * .3, h * (.04 + ph * .06), h * (.04 + ph * .06), 10), { wash: C.snowLt, washOp: 118 * (1 - ph), ink: null }); }
    for (const tx of [x - h * .62, x - h * .78]) {
      paint(rrPts(tx - h * .07, gy - h * .22, h * .14, h * .22, h * .03, h * .005), { wash: '#7E7A84', fill: C.clothDk, fillOp: 40, ink: C.ink, sw: sw * .7 });
      inkLine([[tx - h * .07, gy - h * .12], [tx + h * .07, gy - h * .12]], sw * .35, C.iron, 'inkfine', 0); }
    inkLine([[x - h * .85, gy - h * .34], [x - h * .5, gy - h * .34]], sw * 1.6, '#6E6A74', 'ink', 0);
    for (let i = 0; i < 4; i++) inkLine([[x - h * (.82 - i * .1), gy - h * .34], [x - h * (.82 - i * .1), gy]], sw * .6, C.iron, 'inkfine', 0);
    if (o.beacon > 0) { const bx = x + h * .5, by = gy - h * .58, on = .4 + .6 * Math.max(0, Math.sin(T * 5));
      paint(ellPts(bx, by, h * .022, h * .022, 8), { wash: mixCol(PAL.sap, '#FFFFFF', on * .6), ink: null }); halo(bx, by, h * .1 * on, PAL.sap, .9 * on * o.beacon); }
    if (o.search > 0) { const sx = x - h * .5, sy = gy - h * .58, a = -2.4 + Math.sin(T * .5) * .5;
      paint([[sx, sy], [sx + Math.cos(a) * h * 1.8, sy + Math.sin(a) * h * 1.8], [sx + Math.cos(a + .12) * h * 1.8, sy + Math.sin(a + .12) * h * 1.8]], { wash: '#DCE8F2', washOp: 40 * o.search, ink: null }); }
  };
  PROP.hoarding = (x, gy, m, o = {}) => {
    boilSeed('hoard'); const h = PX(m), sw = swOf(h * .3);
    for (let i = 0; i < 8; i++) paint(rectPts(x + i * h * .26, gy - h, h * .25, h, h * .01), { wash: i % 2 ? dim('#C9A85C', TONE.mid) : dim('#BD9A50', TONE.mid), fill: C.woodDk, fillOp: 25, bleed: .1, tex: .6, ink: C.ink, sw: sw * .7 });
    inkLine([[x, gy - h * .82], [x + h * 2.1, gy - h * .82]], sw * .7, C.woodDk, 'inkfine', 0);
    // 第十六轮 N10：原来这个徽记是"白圆盘 + 两条等高竖杠 + 一道底边"，观众读作**暂停按钮**⏸
    // —— 因为两条杠一样高一样宽，正是暂停符号的定义。它本来想画的是"两根烟囱"。
    // 改法不是把杠变细，而是**破坏等高**：两根烟囱一高一矮、一粗一细，
    // 高的那根冒一缕向右上方飘的烟。这样既去掉 ⏸ 的读法，又把"这是厂家的围挡"讲清楚了。
    paint(ellPts(x + h * 1.05, gy - h * .5, h * .2, h * .2, 16), { wash: C.paper, fill: C.snowLt, fillOp: 50, ink: C.ink, sw: sw * .8 });
    { const bx = x + h * 1.05, by = gy - h * .5, r = h * .2;
      paint(rectPts(bx - r * .42, by + r * .42, r * .30, r * .95, r * .03), { wash: C.ink, ink: null });          // 矮的那根
      paint(rectPts(bx + r * .02, by - r * .10, r * .34, r * 1.35, r * .03), { wash: C.ink, ink: null });         // 高的那根
      inkLine([[bx - r * .30, by + r * .30], [bx - r * .05, by + r * .05], [bx + r * .18, by - r * .28],
        [bx + r * .52, by - r * .52], [bx + r * .82, by - r * .72]], sw * .55, C.ink, 'inkfine', .5);             // 烟
      paint(ellPts(bx + r * .92, by - r * .84, r * .17, r * .14, 8), { wash: C.ink, washOp: 190, ink: null }); }
  };
  PROP.streetLamp = (x, gy, m, o = {}) => {
    boilSeed('lamp'); const h = PX(m), sw = swOf(h * .2), on = o.lit ?? 1, col = o.cold ? C.neonB : C.warm;
    paint(ellPts(x, gy, h * .06, h * .018, 12), { fill: C.ink, fillOp: 60, bleed: .2, ink: null });
    paint(ribbon([[x, gy], [x, gy - h * .88], [x + h * .1, gy - h]], h * .026, h * .018), { wash: C.iron, fill: C.night, fillOp: 45, bleed: .1, tex: .6, ink: C.ink, sw });
    paint(ellPts(x + h * .11, gy - h * .98, h * .045, h * .035, 10), { wash: on > .1 ? mixCol(col, '#FFFFFF', .4) : '#2A2A34', ink: C.ink, sw: sw * .6 });
    if (on > .1) { halo(x + h * .11, gy - h * .98, h * .16 * on, col, .95 * on); PROP.lightPatch(x + h * .11, gy + 1, h * .34 * on, col, .6 * on); }
  };
  PROP.bench = (x, gy, m, o = {}) => {
    boilSeed('bench'); const h = PX(m), sw = swOf(h * .5);
    for (let i = 0; i < 3; i++) paint(rectPts(x - h * .5, gy - h * (.55 + i * .16), h, h * .1, h * .015), { wash: C.wood, fill: C.woodDk, fillOp: 40, ink: C.ink, sw: sw * .6 });
    for (const d of [-1, 1]) paint(rectPts(x + d * h * .38, gy - h * .5, h * .06, h * .5, h * .01), { wash: C.iron, ink: C.ink, sw: sw * .6 });
  };
  PROP.scaffolding = (x, gy, m, o = {}) => {
    boilSeed('scaf'); const h = PX(m), sw = swOf(h * .2);
    for (const d of [-1, 1]) inkLine([[x + d * h * .18, gy], [x + d * h * .18, gy - h]], sw * 1.2, '#8A8290', 'ink', 0);
    for (let i = 0; i < 5; i++) { const yy = gy - h * (i + .5) / 5.5;
      inkLine([[x - h * .18, yy], [x + h * .18, yy]], sw * .9, '#8A8290', 'ink', 0);
      inkLine([[x - h * .18, yy], [x + h * .18, yy - h * .09]], sw * .5, '#7A7280', 'inkfine', 0); }
    for (let i = 0; i < 3; i++) paint(rectPts(x - h * .22, gy - h * (.2 + i * .3), h * .44, h * .02, 1), { wash: C.woodLt, ink: C.ink, sw: sw * .5 });
  };
  PROP.crane = (x, gy, m, o = {}) => {
    boilSeed('crane'); const h = PX(m), sw = swOf(h * .18), a = o.ang ?? -.16;
    paint(rectPts(x - h * .05, gy - h, h * .1, h, h * .01), { wash: dim('#B08A38', TONE.mid), fill: C.ochre, fillOp: 45, bleed: .1, tex: .6, ink: C.ink, sw });
    for (let i = 0; i < 6; i++) inkLine([[x - h * .05, gy - h * i / 6], [x + h * .05, gy - h * (i + 1) / 6]], sw * .4, C.woodDk, 'inkfine', 0);
    push(); translate(x, gy - h); rotate(a);
    paint(rectPts(-h * .12, -h * .03, h * .8, h * .06, h * .01), { wash: dim('#B08A38', TONE.mid), fill: C.ochre, fillOp: 40, ink: C.ink, sw });
    inkLine([[-h * .06, -h * .06], [h * .3, -h * .2], [h * .62, -h * .06]], sw * .5, C.iron, 'ink', .3);
    pop();
    const hx = x + Math.cos(a) * h * .58, hy = gy - h + Math.sin(a) * h * .58;
    inkLine([[hx, hy], [hx, hy + h * (o.hoist ?? .3)]], sw * .5, C.iron, 'inkfine', 0);
    paint(rrPts(hx - h * .05, hy + h * (o.hoist ?? .3), h * .1, h * .07, h * .015, 1), { wash: C.iron, ink: C.ink, sw: sw * .6 });
  };

  // ================================================================ 机械与载具
  // 挖掘机：履带 + 车身 + 驾驶室 + 大臂/小臂/铲斗 + 绿色警示灯（§41：≥ 角色 2.8 倍高）
  PROP.excavator = (x, gy, m, o = {}) => {
    boilSeed('exca'); const h = PX(m), sw = swOf(h * .18), dir = o.dir || 1;
    push(); translate(x, gy); scale(dir, 1);
    contact(0, 0, h * .34, .9);
    paint(rrPts(-h * .3, -h * .19, h * .6, h * .19, h * .09, h * .01), { wash: '#3A3E46', fill: C.iron, fillOp: 45, bleed: .1, tex: .6, ink: C.ink, sw });
    for (let i = 0; i < 7; i++) inkLine([[-h * .27 + i * h * .085, -h * .17], [-h * .27 + i * h * .085, -h * .03]], sw * .5, '#22252B', 'inkfine', 0);
    for (const wx of [-h * .27, h * .27]) paint(ellPts(wx, -h * .1, h * .08, h * .08, 12), { wash: '#2A2E36', ink: C.ink, sw: sw * .7 });
    paint(rrPts(-h * .2, -h * .42, h * .4, h * .24, h * .04, h * .01), { wash: dim('#C99A28', TONE.mid), fill: C.ochre, fillOp: 45, bleed: .12, tex: .6, ink: C.ink, sw });
    paint(rrPts(-h * .16, -h * .66, h * .26, h * .25, h * .04, h * .01), { wash: dim('#B88A22', TONE.cool), fill: C.woodDk, fillOp: 35, bleed: .1, tex: .6, ink: C.ink, sw });
    paint(rrPts(-h * .12, -h * .62, h * .18, h * .14, h * .02, h * .005), { wash: mixCol(C.ice, C.night, .35), ink: C.ink, sw: sw * .7 });
    const a1 = o.armA ?? .55, a2 = o.stick ?? -.9;
    push(); translate(h * .1, -h * .4); rotate(-a1);
    paint(ribbon([[0, 0], [h * .42, 0]], h * .075, h * .055), { wash: dim('#C99A28', TONE.mid), fill: C.ochre, fillOp: 40, bleed: .1, tex: .6, ink: C.ink, sw });
    paint(ellPts(h * .42, 0, h * .05, h * .05, 10), { wash: C.iron, ink: C.ink, sw: sw * .6 });
    push(); translate(h * .42, 0); rotate(-a2);
    paint(ribbon([[0, 0], [h * .3, 0]], h * .055, h * .04), { wash: dim('#C99A28', TONE.mid), fill: C.ochre, fillOp: 40, bleed: .1, tex: .6, ink: C.ink, sw });
    push(); translate(h * .3, 0); rotate(.5);
    paint([[0, -h * .06], [h * .12, -h * .05], [h * .14, h * .05], [0, h * .07]], { wash: '#6E6A74', fill: C.iron, fillOp: 55, bleed: .1, tex: .6, ink: C.ink, sw: sw * .9, curv: .25 });
    for (let i = 0; i < 4; i++) inkLine([[h * (.02 + i * .032), h * .07], [h * (.02 + i * .032), h * .1]], sw * .6, C.iron, 'inkfine', 0);
    pop(); pop(); pop();
    const bk = o.beacon ?? 1, on = .35 + .65 * Math.max(0, Math.sin(T * 5.5));
    paint(ellPts(-h * .18, -h * .68, h * .025, h * .025, 8), { wash: mixCol(PAL.sap, '#FFFFFF', on * .5), ink: null });
    halo(-h * .18, -h * .68, h * .16 * on * bk, PAL.sap, .9 * on * bk);
    pop();
    if (o.pool) PROP.lightPatch(x, gy + 1, h * .36, PAL.sap, .4 * bk);
  };
  // 雪橇 + 礼物堆剪影（§12）
  PROP.sled = (x, gy, m, o = {}) => {
    boilSeed('sled'); const h = PX(m), sw = swOf(h * .3);
    contact(x, gy, h * .7, .8);
    for (const d of [-.05, .05]) paint(ribbon([[x - h * .55, gy - h * (.05 + d)], [x + h * .45, gy - h * (.05 + d)], [x + h * .62, gy - h * (.18 + d)]], h * .05, h * .04), { wash: C.woodDk, fill: C.bark, fillOp: 45, ink: C.ink, sw });
    paint(ribbon([[x - h * .5, gy - h * .18], [x - h * .55, gy - h * .5], [x - h * .3, gy - h * .62]], h * .05, h * .045), { wash: C.bark, ink: C.ink, sw: sw * .8 });
    paint(rectPts(x - h * .48, gy - h * .34, h * .95, h * .16, h * .02), { wash: C.bark, fill: C.woodDk, fillOp: 50, bleed: .1, tex: .7, ink: C.ink, sw });
    for (let i = 0; i < 4; i++) PROP.sack(x - h * .3 + i * h * .22, gy - h * .34, h * .3, { k: 1 + (i % 2) * .3, pool: false });
    if (o.glow) for (let i = 0; i < 3; i++) { const sx = x - h * .2 + i * h * .3; halo(sx, gy - h * .5, h * .17, C.warm, .8); PROP.lightPatch(sx, gy + 1, h * .36, C.warm, .4); }
  };
  PROP.reindeer = (x, gy, m, o = {}) => {
    boilSeed('ren'); const h = PX(m), sw = swOf(h * .35), dir = o.dir || 1;
    contact(x, gy, h * .3, .7);
    push(); translate(x, gy); scale(dir, 1);
    paint(ellPts(0, -h * .48, h * .3, h * .17, 18, 0, -.05), { wash: C.woodLt, fill: C.bark, fillOp: 45, bleed: .12, tex: .7, ink: C.ink, sw });
    for (const [lx, lo] of [[-h * .22, 0], [-h * .12, .04], [h * .16, 0], [h * .26, .05]]) paint(ribbon([[lx, -h * .34], [lx + lo * h, -h * .18], [lx, -h * .02]], h * .035, h * .025), { wash: C.woodLt, ink: C.ink, sw: sw * .7 });
    paint(ribbon([[h * .26, -h * .52], [h * .42, -h * .68], [h * .46, -h * .8]], h * .07, h * .055), { wash: C.woodLt, fill: C.bark, fillOp: 40, ink: C.ink, sw });
    paint(ellPts(h * .48, -h * .82, h * .075, h * .055, 12, 0, -.3), { wash: C.woodLt, ink: C.ink, sw: sw * .8 });
    for (const s of [-1, 1]) { paint(ribbon([[h * .46, -h * .87], [h * .5 + s * h * .02, -h * 1.02], [h * .44 + s * h * .07, -h * 1.1]], h * .02, h * .012), { wash: C.clothDk, ink: C.ink, sw: sw * .5 });
      inkLine([[h * .5 + s * h * .02, -h * 1.02], [h * .58 + s * h * .05, -h * .96]], sw * .5, C.clothDk, 'inkfine', 0); }
    paint(ellPts(h * .53, -h * .8, h * .018, h * .018, 6), { wash: C.ink, ink: null });
    pop();
    if (o.breath > 0) for (let i = 0; i < 3; i++) { const ph = frac(T * .35 + i / 3);
      paint(ellPts(x + dir * h * (.6 + ph * .4), gy - h * (.8 - ph * .12), h * (.03 + ph * .07), h * (.03 + ph * .07), 10), { wash: C.snow, washOp: 130 * o.breath * (1 - ph), ink: null }); }
  };
  // 奸商的蜡烛车：车轮 + 车斗 + 蜡烛堆 + 高杆深蓝灯笼
  PROP.cart = (x, gy, m, o = {}) => {
    boilSeed('cart'); const h = PX(m), sw = swOf(h * .3);
    contact(x, gy, h * .6, .8);
    paint(rectPts(x - h * .5, gy - h * .5, h * .95, h * .26, h * .02), { wash: C.bark, fill: C.woodDk, fillOp: 55, bleed: .12, tex: .7, border: .5, ink: C.ink, sw });
    for (const wx of [x - h * .34, x + h * .3]) {
      paint(ellPts(wx, gy - h * .12, h * .16, h * .16, 16), { wash: C.woodDk, fill: C.bark, fillOp: 45, ink: C.ink, sw });
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; inkLine([[wx - Math.cos(a) * h * .13, gy - h * .12 - Math.sin(a) * h * .13], [wx + Math.cos(a) * h * .13, gy - h * .12 + Math.sin(a) * h * .13]], sw * .4, C.bark, 'inkfine', 0); } }
    // 第十七轮 6 的**真正落点**。上一轮只是往车前**加**了一堆躺倒的红蜡烛，
    // 却把原来这四支竖着的白蜡留在原地 —— 于是成片里"整齐的栅栏"仍然盖过"乱堆的蜡烛"，
    // 用户的原话（"蜡烛太高了…应该是蜡烛堆，不是横竖摆的整整齐齐的"）等于没做。
    // 加法不是减法：挡在后面的东西必须**拆掉**，不是在前面堆一坨。
    // 现在只剩两支**矮、歪、不等距**的残烛交代"这是卖蜡烛的"，其余交给车上的堆。
    for (const [q, k, tilt] of [[-.30, .10, -.16], [.22, .075, .11]]) {
      boilSeed('stub' + q);
      push(); translate(x + h * q, gy - h * .5); rotate(tilt);
      paint(rectPts(-h * k * .17, -h * k * 1.0, h * k * .34, h * k, h * k * .06, h * k * .02),
        { wash: C.wax, fill: C.woodDk, fillOp: 30, bleed: .1, tex: .6, ink: C.ink, sw: sw * .5, curv: .2 });
      pop();
    }
    inkLine([[x + h * .45, gy - h * .4], [x + h * .72, gy - h * .5]], sw * .8, C.wood, 'ink', .3);
    if (o.lantern) PROP.lantern(x - h * .5, gy - h * .5, h * .3, { col: o.lantern, pole: true, pool: o.pool });
  };

  // ================================================================ 生命与痕迹
  // 萤火虫。§45 的原话："虫体不需要那么清楚，主要是能看出是萤火虫并且发出光亮就好"。
  // 所以这里反过来画：**主体是一团闪得不规律的光**，虫体只留一粒暗色锚点，
  // 而"看出是萤火虫"这件事完全交给身后那条渐隐的尾迹——有尾迹就是在飞，没尾迹就是一盏灯。
  // o.dir 飞行方向（默认 +1），o.k 光强，o.col 换成 PAL.sap 就是第二部的绿萤。
  // 萤火虫：§45a —— 虫体不需要清楚，**能看出是一粒会飞的光**就够了。所以光晕必须远大于虫体：
  // 原来 halo 半径只有 s*0.9（s≈20 → 20px），在 1080p 里就是一粒芝麻，十二粒围着他观众只看到"他旁边没有东西"。
  PROP.firefly = (x, y, u, o = {}) => {
    boilSeed('fly' + Math.round(x)); const s = u, col = o.col || C.warm, dir = o.dir ?? 1, kk = o.k ?? 1;
    const fl = .42 + .58 * Math.sin(T * 5.5 + x * .13 + y * .09);
    const a = clamp(fl * (frac(T * 2.1 + x * .017 + y * .011) < .11 ? .2 : 1)) * kk;   // 偶尔灭一下
    const bob = Math.sin(T * 2.3 + x * .05) * s * .1;
    if (a > .05) for (let i = 4; i >= 1; i--) { const q = i / 4;
      paint(ellPts(x - dir * s * .62 * q, y + bob * q + s * .1 * q, s * .1 * (1 - q * .5), s * .1 * (1 - q * .5), 6),
        { wash: col, washOp: 120 * a * (1 - q) * (.4 + .6 * fl), ink: null }); }
    paint(ellPts(x, y + bob, s * .15, s * .11, 8, 0, -.32 * dir), { wash: mixCol(C.night, col, .2), ink: null });
    halo(x, y + bob, s * (1.7 + .9 * fl), col, .95 * a);
    // 虫体不重要，**那颗亮**才重要：halo 的芯是 wash（半透明），在深底上不够亮，所以补一粒实心光点。
    paint(ellPts(x, y + bob, s * .1 * (.8 + .3 * fl), s * .1 * (.8 + .3 * fl), 10), { wash: mixCol(col, '#FFFFFF', .62), washOp: 250 * a, fill: '#FFFDF0', fillOp: 210 * a, ink: null });
  };
  // 一群萤火：位置自己按各自的相位飘（场景不必再发明运动）
  PROP.fireflies = (x, y, n, spread, u, o = {}) => {
    for (let i = 0; i < n; i++) { const ph = T * (.35 + .3 * hash(i)) + hash(i + 5) * TAU;
      PROP.firefly(x + Math.cos(ph) * spread * (.3 + .7 * hash(i + 2)) + (hash(i + 9) - .5) * spread,
        y - Math.abs(Math.sin(ph * .8)) * spread * .5 - hash(i + 3) * spread * .35,
        u * (.7 + .5 * hash(i + 7)), { col: o.col, dir: Math.cos(ph + 1.57) > 0 ? 1 : -1, k: o.k }); }
  };
  // 鱼：身体 + 尾 + **头上一粒灯** + 水面涟漪（§8：必须在"水里"）
  PROP.fish = (x, y, u, o = {}) => {
    boilSeed('fish' + Math.round(x)); const s = u, dir = o.dir || 1, lit = o.lit ?? 1, sw = swOf(s * .8) * .6;
    paint(ellPts(x, y, s * .5, s * .2, 16, 0, -.08 * dir), { wash: mixCol(C.snowSh, C.night, .35), fill: C.ice, fillOp: 45, bleed: .1, tex: .5, ink: C.ink, sw });
    paint([[x - dir * s * .48, y], [x - dir * s * .72, y - s * .18], [x - dir * s * .72, y + s * .18]], { wash: mixCol(C.snowSh, C.night, .4), ink: C.ink, sw: sw * .8, curv: .25 });
    paint(ellPts(x + dir * s * .2, y - s * .04, s * .05, s * .05, 6), { wash: C.ink, ink: null });
    if (lit > .05) { paint(ellPts(x + dir * s * .5, y - s * .3, s * .09, s * .11, 8), { wash: mixCol(C.warm, '#FFFFFF', .5), ink: null }); halo(x + dir * s * .5, y - s * .3, s * .55 * lit, C.warm, .9 * lit); }
    paint(ellPts(x, y + s * .28, s * .7, s * .1, 14), { ink: mixCol(C.ice, C.night, .2), sw: sw * .5, wash: null });
  };
  PROP.cat = (x, gy, u, o = {}) => {
    boilSeed('cat'); const s = u, sw = swOf(s) * .6, col = o.col || mixCol(C.night, '#4A4258', .5);
    paint(ellPts(x, gy - s * .3, s * .42, s * .26, 16), { wash: col, fill: C.ink, fillOp: 35, bleed: .12, tex: .6, ink: C.ink, sw });
    paint(ellPts(x + s * .38, gy - s * .52, s * .2, s * .18, 12), { wash: col, ink: C.ink, sw });
    for (const d of [-1, 1]) paint([[x + s * (.34 + d * .07), gy - s * .66], [x + s * (.3 + d * .12), gy - s * .84], [x + s * (.44 + d * .04), gy - s * .62]], { wash: col, ink: C.ink, sw: sw * .8, curv: .2 });
    paint(ribbon([[x - s * .4, gy - s * .3], [x - s * .75, gy - s * .42], [x - s * .7, gy - s * .72]], s * .1, s * .05), { wash: col, ink: C.ink, sw });
    paint(ellPts(x + s * .44, gy - s * .54, s * .03, s * .04, 6), { wash: C.warmLt, ink: null });
  };
  PROP.hedgehog = (x, gy, u, o = {}) => {
    boilSeed('hog'); const s = u, sw = swOf(s) * .5;
    paint(blob(x, gy - s * .28, s * .45, s * .3, 9, .16, 26, .8), { wash: C.woodLt, fill: C.woodDk, fillOp: 55, bleed: .12, tex: .8, ink: C.ink, sw });
    paint(ellPts(x + s * .42, gy - s * .26, s * .16, s * .13, 10), { wash: C.cloth, ink: C.ink, sw: sw * .8 });
    paint(ellPts(x + s * .5, gy - s * .28, s * .03, s * .035, 6), { wash: C.ink, ink: null });
  };
  // 鸟群：惊起的一群剪影（A3 的先兆 / A4 的代价）
  PROP.birdFlock = (x, y, n, spread, k = 1, col = C.night) => {
    if (k < .02) return; boilSeed('flock' + Math.round(x));
    for (let i = 0; i < n; i++) {
      const ph = clamp(k * 1.4 - i * .06); if (ph < .02) continue;
      const bx = x + (hash(i) - .5) * spread + Math.sin(ph * 3 + i) * spread * .12, by = y - ph * spread * .7 - hash(i + 3) * spread * .2;
      const fl = Math.sin(ph * 20 + i * 2), w = spread * .045 * (1 - ph * .2);
      inkLine([[bx - w, by + w * .5 * fl], [bx - w * .3, by - w * .5 * fl], [bx, by], [bx + w * .3, by - w * .5 * fl], [bx + w, by + w * .5 * fl]], swOf(spread * .3) * .8, col, 'ink', .4);
    }
  };
  // 脚印：一串渐淡的坑，"有人来过"的证据（§9）
  // 第十四轮：一行等距同尺寸的坑读作**一串白点**，不是脚步。两只脚一远一近，
  // 所以坑必须**左右两轨交替**：近脚那只更大、更低；远脚那只更小、更高（侧视透视）。
  PROP.footprints = (x0, gy, n, step, u, o = {}) => {
    boilSeed('fp' + Math.round(x0)); const s = u, dir = o.dir || 1;
    for (let i = 0; i < n; i++) {
      const a = (o.fade == null ? 1 : clamp(o.fade)) * (1 - i / n * .8); if (a < .04) continue;
      const near = i % 2 === 0, ss = s * (near ? 1.06 : .82);
      const px = x0 + dir * i * step, py = gy + (near ? s * .06 : -s * .13);
      paint(ellPts(px, py, ss * .22, ss * .1, 12, 0, dir * .2), { fill: mixCol(C.snowSh, C.ink, .3), fillOp: 120 * a, bleed: .14, tex: .5, border: .12, ink: null });
      paint(ellPts(px - dir * ss * .05, py - ss * .03, ss * .08, ss * .028, 10), { wash: C.snowLt, washOp: 58 * a, ink: null });
    }
  };
  PROP.wheelRut = (x0, gy, len, u, dir = 1) => {
    boilSeed('rut'); const s = u;
    for (const d of [-.12, .12]) inkLine([[x0, gy + d * s], [x0 + dir * len * .5, gy + d * s * .8], [x0 + dir * len, gy + d * s * 1.1]], swOf(s * .8), mixCol(C.snowSh, C.ink, .3), 'inkfine', .5);
  };
  PROP.iceCrack = (x, y, len, u, k = 1) => {
    if (k < .02) return; boilSeed('crack'); const s = u, n = 9, p = [];
    for (let i = 0; i <= n; i++) p.push([x + i * len / n * k, y + Math.sin(i * 2.3) * s * .3 + (hash(i) - .5) * s * .4]);
    inkLine(p, swOf(s * 1.1), mixCol(C.ice, '#FFFFFF', .4), 'inkfine', .3);
    for (let i = 1; i < n; i += 2) inkLine([[p[i][0], p[i][1]], [p[i][0] + s * .3, p[i][1] + (hash(i) - .5) * s * 1.2]], swOf(s * .5), mixCol(C.ice, '#FFFFFF', .3), 'inkfine', .3);
  };
  PROP.litter = (x, gy, u, o = {}) => {
    boilSeed('litter'); const s = u, sw = swOf(s) * .5, t = o.kind || 0;
    if (t % 3 === 0) { paint(blob(x, gy - s * .22, s * .3, s * .24, 4, .25, 18, .9), { wash: mixCol(C.snow, C.ink, .12), fill: C.snowLt, fillOp: 60, bleed: .16, tex: .5, ink: C.ink, sw: sw * .8 });
      inkLine([[x - s * .1, gy - s * .44], [x - s * .16, gy - s * .58]], sw * .6, C.ink, 'inkfine', 0); }
    else if (t % 3 === 1) { paint(rrPts(x - s * .12, gy - s * .5, s * .24, s * .5, s * .08, s * .01), { wash: mixCol(C.ice, C.night, .25), fill: C.snowLt, fillOp: 40, ink: C.ink, sw: sw * .8 });
      paint(rectPts(x - s * .05, gy - s * .62, s * .1, s * .13, s * .02), { wash: C.clothDk, ink: null }); }
    else { inkLine([[x - s * .3, gy - s * .06], [x + s * .1, gy - s * .2], [x + s * .34, gy - s * .42]], sw * .9, C.woodDk, 'ink', .3);
      inkLine([[x + s * .02, gy - s * .17], [x + s * .12, gy - s * .36]], sw * .6, C.woodDk, 'inkfine', 0); }
  };
  // 呼吸白气：本片没有台词，白气就是"话"（§35）
  PROP.breathFog = (x, y, u, k = 1, col = C.snow) => {
    if (k < .03) return; boilSeed('breath' + Math.round(x)); const s = u;
    for (let i = 0; i < 3; i++) { const ph = frac(clamp(k) * 1.2 + i / 3), r = s * (.08 + ph * .3);
      paint(ellPts(x + ph * s * 1.5 + Math.sin(ph * 4 + i) * s * .1, y - ph * s * .45, r, r * .8, 10), { wash: col, washOp: 110 * (1 - ph) * clamp(k * 1.4), ink: null }); }
  };
  // 贴地横漂的远景雪幕（§10）
  PROP.snowVeil = (y, h, k = 1, t = T, col = C.snow) => {
    if (k < .03) return; boilSeed('veil' + Math.round(y));
    for (let i = 0; i < 4; i++) {
      const off = frac(t * (.03 + i * .012) + i * .27) * (W + 900) - 450, vy = y + i * h * .22, p = [];
      for (let j = 0; j <= 22; j++) { const px = off - 420 + j * 40; p.push([px, vy + Math.sin(j * .8 + i * 2) * h * .12 - h * .5 * Math.sin(j / 22 * Math.PI)]); }
      paint(ribbon(p, h * .1, h * .3), { wash: col, washOp: 42 * k, ink: null, curv: .5 });
    }
  };
  PROP.gusts = (y0, y1, n, dir, k, col = C.snowLt) => {
    if (k < .03) return; boilSeed('gust');
    for (let i = 0; i < n; i++) { const yy = lerp(y0, y1, hash(i)), sp = 380 + 620 * hash(i + 4), x0 = frac(hash(i + 9) * 3 + T * sp / 2200) * (W + 700) - 350, len = (110 + 170 * hash(i + 2)) * k;
      inkLine([[x0, yy], [x0 + len * .5 * dir, yy - len * .04], [x0 + len * dir, yy + len * .03]], .9, col, 'inkfine', .4); }
  };
  // 光之穹顶：半透明金色**体积**（内部壳 + 边缘三层亮带 + 表面经线 + 光尘 + 地面椭圆透视）。
  // §41：现在只有一条 hairline 弧，读作伞骨。
  PROP.dome = (x, gy, r, k = 1, col = C.warm) => {
    if (k < .02 || r < 20) return; boilSeed('dome' + Math.round(r));
    const f = 1 + .012 * Math.sin(T * 2.2), rr = r * f, kk = clamp(k);
    const ring = (q) => { const p = []; for (let j = 0; j <= 44; j++) { const a = Math.PI + j / 44 * Math.PI, ri = rr * q; p.push([x + Math.cos(a) * ri, gy + Math.sin(a) * ri * .82]); } return p; };
    const shell = ring(1); shell.push([x + rr, gy], [x - rr, gy]);
    paint(shell, { wash: mixCol(col, C.warmLt, .4), washOp: 24 * kk, ink: null, curv: .5 });
    for (let i = 0; i < 3; i++) { const q = ring(1 - i * .055);
      paint(ribbon(q, r * (.05 - i * .011), r * (.05 - i * .011)), { wash: mixCol(col, '#FFFFFF', .2 + i * .22), washOp: (52 + i * 26) * kk, ink: null, curv: .6 }); }
    for (let i = 1; i < 12; i++) { const a = Math.PI + i / 12 * Math.PI;
      inkLine([[x + Math.cos(a) * rr, gy + Math.sin(a) * rr * .82], [x + Math.cos(a) * rr * .5, gy + Math.sin(a) * rr * .46], [x, gy - rr * .06]], swOf(r * .05), mixCol(hotOf(col), '#FFFFFF', .4), 'inkfine', .4); }
    paint(ellPts(x, gy, rr, rr * .18, 36), { ink: mixCol(col, '#FFFFFF', .35), sw: clamp(r / 190, 1, 3.4) * kk, wash: null });
    for (let i = 0; i < 26; i++) { const ph = frac(T * .12 + hash(i)), a = Math.PI + hash(i + 7) * Math.PI, rd = rr * (.3 + .62 * hash(i + 3));
      paint(ellPts(x + Math.cos(a) * rd, gy + Math.sin(a) * rd * .82 - ph * r * .12, r * .013, r * .013, 6), { wash: C.warmLt, washOp: 210 * kk * (1 - ph), ink: null }); }
    halo(x, gy - r * .5, r * .6, col, .3 * kk);
    PROP.lightPatch(x, gy + 1, r * .72, col, .45 * kk);
  };

  // ================================================================ 微事件库
  // §51 的病灶写成一句话就是"那几秒钟画面里只有人在发呆"。真正的原因不是节奏，是**细节没画**：
  // 场景一边推情节一边现编环境动作，一定编不出来，于是空转。这里把"这个世界总该发生点什么"预先做成
  // 16 件互相独立的短动作。约定：
  //   EVENTS.名字(t0, x, gy, u, o)     t0 = 起拍时刻（秒），只在 [t0, t0+dur] 内画，窗口外一笔都不落
  //   EVENTS.名字.dur                  它占多长（秒），场景据此排拍，不会叠出两个同时的动作
  // 全部纯函数于 T，所以可以同一帧叠十几件、可以乱序渲、可以并行渲。
  // 场景只需要回答"第几拍、在哪"——这就是"不用边渲情节边渲配件"的具体含义。
  const ev = (dur, fn) => {
    const f = (t0, x, gy, u, o = {}) => { const k = (T - t0) / dur; if (k < 0 || k > 1) return; fn(clamp(k), x, gy, u, o); };
    f.dur = dur; return f;
  };
  const EVENTS = {};
  PROP.EVENTS = EVENTS;

  // 雪从枝头滑下来：整块 → 碎成四团 → 落地一蓬粉
  EVENTS.snowCrash = ev(1.15, (k, x, gy, u, o) => {
    const s = u, top = o.y0 ?? gy - s * 3.4, fall = easeIn(clamp(k * 1.3)), shat = k > .48;
    for (let i = 0; i < (shat ? 4 : 1); i++) {
      const q = shat ? (i - 1.5) * s * .42 : 0;
      paint(ellPts(x + q * (1 + fall), lerp(top, gy - s * .1, fall) - Math.abs(q) * .12 * (1 - fall),
        s * (shat ? .34 : .66) * (1 - k * .35), s * (shat ? .22 : .3) * (1 - k * .3), 12, s * .01),
        { wash: C.snow, fill: C.snowLt, fillOp: 165 * (1 - k * .6), bleed: .16, tex: .5, ink: null }); }
    if (k > .62) { const q = (k - .62) / .38;
      for (let i = 0; i < 6; i++) paint(ellPts(x + (hash(i) - .5) * s * 3 * q, gy - q * s * .6 - hash(i + 3) * s * .12,
        s * .2 * (1 - q), s * .18 * (1 - q), 8), { wash: C.snowLt, washOp: 150 * (1 - q), ink: null }); }
  });
  // 冰凌滴水：檐下一粒越长越大 → 落下（加速）→ 地上砸一个圈
  EVENTS.icicleDrip = ev(1.05, (k, x, gy, u, o) => {
    const s = u, top = o.y0 ?? gy - s * 3.2, grow = clamp(k * 2.6), fall = easeIn(clamp((k - .32) / .55));
    paint(P(s, [[-.07, 0], [.07, 0], [.02, .62], [-.02, .62]]).map(p => [p[0] + x, p[1] + top]), { wash: C.ice, fill: C.snowLt, fillOp: 150, bleed: .1, tex: .5, ink: null });
    if (grow < 1) paint(ellPts(x, top + s * (.66 + .12 * grow), s * .14 * (.4 + grow), s * .19 * (.4 + grow), 8), { wash: C.ice, fill: C.snowLt, fillOp: 190, ink: null });
    if (k > .32) { const y = lerp(top + s * .78, gy, fall);
      paint(ellPts(x, y, s * .11, s * .17, 8), { wash: C.ice, fill: C.snowLt, fillOp: 185, ink: null });
      if (fall > .9) for (let i = 0; i < 5; i++) inkLine([[x, gy], [x + Math.cos(i * 1.3 + 1) * s * .4, gy - s * .16 * (1 - fall) * 6]], swOf(s) * .4, C.ice, 'inkfine', .3); }
  });
  // 摇落一身霜：树身用 PROP.fir(..., {wind:...}) 自己抖，这里只补"抖下来的冰晶"
  EVENTS.rimeShake = ev(.85, (k, x, gy, u) => {
    const s = u, q = 1 - Math.pow(1 - k, 2);
    paint(ellPts(x, gy - s * 1.2 + q * s * .8, s * 1.2 * (1 - k * .5), s * .7 * (1 - k * .5), 14), { wash: C.snowLt, washOp: 60 * (1 - k), ink: null });
    for (let i = 0; i < 11; i++) { const a = hash(i) * TAU, r = s * (.4 + 2.1 * q) * (.4 + hash(i + 5));
      paint(ellPts(x + Math.cos(a) * r, gy - s * 1.5 + Math.sin(a) * r * .7 + q * q * s * 2.4,
        s * .085 * (1 - k), s * .085 * (1 - k), 6), { wash: C.snowLt, washOp: 210 * (1 - k), ink: null }); }
  });
  // 一群鸟惊起（A3 的先兆 / A4 的代价）
  EVENTS.birdsStartle = ev(1.35, (k, x, gy, u, o) => {
    PROP.birdFlock(x, gy - (o.y0 ?? u * 2.2), o.n || 7, u * (1.6 + 3.4 * ease(k)), 1, o.col);
  });
  // 远处一列火车压过去：暗带 + 一排窗 + 脚下抖的雪（第二部"世界在动，树在死"最省的一笔）
  EVENTS.trainPass = ev(2.3, (k, x, gy, u, o) => {
    const s = u, y = gy - (o.y0 ?? s * 5.4), px = lerp(x - W * .62, x + W * .62, k), h = s * .9;
    paint(rectPts(px - s * 4.2, y - h, s * 8.4, h, s * .06), { wash: mixCol(C.night, C.ink, .35), fill: C.ink, fillOp: 55, bleed: .1, tex: .6, ink: null });
    for (let i = 0; i < 6; i++) paint(rectPts(px - s * 3.6 + i * s * 1.3, y - h * .76, s * .55, h * .4, s * .03),
      { wash: mixCol(C.warm, C.warmLt, .4), washOp: 200, ink: null });
    for (let i = 0; i < 7; i++) inkLine([[px - s * 3.5 + i * s * 1.15, y + s * .06], [px - s * 4.2 + i * s * 1.15, y + s * .4]], swOf(s) * .5, C.snowLt, 'inkfine', .3);
  });
  // 第一缕烟：从"没有"开始的一根细线，弯两折就断（§43：工厂开工的那一刻）
  EVENTS.firstSmoke = ev(3.2, (k, x, gy, u, o) => {
    const s = u, top = gy - (o.y0 ?? s * 3), p = [];
    for (let j = 0; j <= 12; j++) { const q = j / 12 * k; p.push([x + Math.sin(q * 5.5) * s * .55 * q, top - q * s * 3.6]); }
    inkLine(p, swOf(s) * 1.6, mixCol(C.snowSh, C.night, .4), 'inkfine', .5);
    if (k > .45) paint(ellPts(x + Math.sin(k * 5.5) * s * .55 * k, top - k * s * 3.6, s * .34 * (k - .45) * 2, s * .3 * (k - .45) * 2, 10), { wash: mixCol(C.snowSh, C.night, .28), washOp: 120, ink: null });
  });
  // 猫从墙上跳下来：一道抛物线 + 落地时尾巴一甩
  EVENTS.catLeap = ev(.95, (k, x, gy, u, o) => {
    const s = u, x1 = x + s * 3.6 * (o.dir || 1), y0 = gy - (o.y0 ?? s * 1.8);
    PROP.cat(lerp(x, x1, k), lerp(y0, gy, ease(k)) - Math.sin(k * Math.PI) * s * 1.2, s * .95, { col: o.col });
  });
  // 一蓬火星腾起（篝火被踩、斧刃打亮之后）
  EVENTS.emberRise = ev(1.7, (k, x, gy, u, o) => {
    const s = u, col = o.col || C.warm;
    for (let i = 0; i < 12; i++) { const q = clamp(k * 1.15 - hash(i) * .3); if (q <= 0) continue;
      paint(ellPts(x + Math.sin(q * 6 + i * 2.1) * s * 1.1, gy - q * s * 3.6 * (.6 + hash(i + 3)),
        s * .085 * (1 - q) + s * .02, s * .085 * (1 - q) + s * .02, 6), { wash: col, washOp: 220 * (1 - q), ink: null }); }
  });
  // 踩雪的一蓬粉（脚落地那一下；配合 stroll 的相位调用）
  EVENTS.stepPuff = ev(.55, (k, x, gy, u) => {
    const s = u, q = ease(k);
    for (let i = 0; i < 5; i++) paint(ellPts(x + (hash(i) - .5) * s * 1.5 * q, gy - s * .12 - q * s * .55 * hash(i + 2),
      s * (.15 + .19 * q) * (1 - q * .5), s * (.13 + .12 * q) * (1 - q * .4), 8), { wash: C.snowLt, washOp: 150 * (1 - q), ink: null });
  });
  // 一口气（本片没有台词，白气就是"话"；配合 feel/emotions 的呼气拍）
  EVENTS.breathPuff = ev(1.25, (k, x, gy, u, o) => {
    PROP.breathFog(x, gy - (o.y0 ?? u * 5.6), u, Math.sin(clamp(k) * Math.PI));
  });
  // 一盏灯灭掉：半径缩、闪得不均匀、最后一下拖一点余温（§48"光熄灭"必须演得出来）
  EVENTS.flickerOut = ev(.8, (k, x, gy, u, o) => {
    const s = u, col = o.col || C.warm, y = gy - (o.y0 ?? s * 3.4);
    const stutter = [.06, .13, .18, .3, .42, .7].map(q => Math.abs(k - q) < .04 ? .3 : 1);
    const a = clamp(k < .7 ? 1 - k * .35 : (1 - k) / .3) * Math.min(...stutter);
    paint(rrPts(x - s * .34, y - s * .46, s * .68, s * .92, s * .16, s * .02), { wash: mixCol(col, C.night, .6), fill: C.night, fillOp: 60, bleed: .1, tex: .5, ink: C.ink, sw: swOf(s) * .5 });
    halo(x, y, s * (2.1 - 1.2 * k), col, .95 * a);
    paint(ellPts(x, y, s * .17 * (1 - k * .5), s * .17 * (1 - k * .5), 8), { wash: mixCol(col, '#FFFFFF', .6), washOp: 230 * a, ink: null });
  });
  // 一盏灯亮起来：先咳两下再接稳
  EVENTS.flickerIn = ev(1.1, (k, x, gy, u, o) => {
    const s = u, col = o.col || C.warm, y = gy - (o.y0 ?? s * 3.4);
    const sp = k < .45 ? (k < .12 ? 1 : k < .2 ? .15 : k < .3 ? .8 : .2) : clamp((k - .45) / .35);
    paint(rrPts(x - s * .34, y - s * .46, s * .68, s * .92, s * .16, s * .02), { wash: mixCol(col, C.night, .6), fill: C.night, fillOp: 60, bleed: .1, tex: .5, ink: C.ink, sw: swOf(s) * .5 });
    halo(x, y, s * 2 * (.4 + .6 * sp), col, .95 * sp);
    paint(ellPts(x, y, s * .16, s * .16, 8), { wash: mixCol(col, '#FFFFFF', .6), washOp: 235 * sp, ink: null });
  });
  // 一扇窗变暖（第二部"人心回来了"的最小单位）
  EVENTS.windowLit = ev(1.0, (k, x, gy, u, o) => {
    const s = u, w = (o.w ?? s * 1.5), h = (o.h ?? s * 2), y = gy - (o.y0 ?? s * 3.6);
    const on = k < .3 ? .18 * k / .3 : lerp(.18, 1, ease((k - .3) / .7));
    paint(rectPts(x - w / 2, y - h / 2, w, h, s * .06), { wash: on > .05 ? mixCol(C.warm, C.warmLt, .4 * on) : mixCol(C.night, C.ink, .3), washOp: 235, ink: C.ink, sw: swOf(s) * .7 });
    inkLine([[x, y - h / 2], [x, y + h / 2]], swOf(s) * .4, on > .4 ? C.wine : C.ink, 'inkfine', 0);
    inkLine([[x - w / 2, y], [x + w / 2, y]], swOf(s) * .4, on > .4 ? C.wine : C.ink, 'inkfine', 0);
    if (on > .3) { halo(x, y, w * 1.5 * on, C.warm, .8 * on); PROP.litFace(x, y + h * .9, w * 2.4, h * .5, C.warm, .5 * on); }
  });
  // 一圈涟漪横过冰面（§8：鱼和倒影都要在"水里"）
  EVENTS.rippleCross = ev(1.9, (k, x, gy, u) => {
    const s = u;
    for (let i = 0; i < 3; i++) { const q = clamp(k * 1.3 - i * .22); if (q <= 0 || q >= 1) continue;
      paint(ellPts(x + (q - .5) * s * 7, gy, s * (.4 + 2.8 * q), s * (.08 + .58 * q), 22), { ink: mixCol(C.ice, C.snowLt, .4), sw: swOf(s) * .7 * (1 - q), wash: null }); }
  });
  // 一只乌鸦掠过去（单独一只比一群更不祥）
  EVENTS.crowFly = ev(1.7, (k, x, gy, u, o) => {
    const s = u, dir = o.dir || 1, px = lerp(x - s * 5.5 * dir, x + s * 5.5 * dir, k), py = gy - (o.y0 ?? s * 4.8) - Math.sin(k * Math.PI) * s * .8;
    const fl = Math.sin(k * 26) * .55, w = s * 1.3;
    inkLine([[px - w, py + w * .55 * fl], [px - w * .3, py - w * .5 * fl], [px, py], [px + w * .3, py - w * .5 * fl], [px + w, py + w * .55 * fl]], swOf(s * 2) * .85, mixCol(C.night, C.ink, .35), 'ink', .4);
    paint(ellPts(px + dir * w * .55, py - w * .1, w * .22, w * .14, 8), { wash: mixCol(C.night, C.ink, .35), ink: null });
  });
  // 鱼跳一下：出水弧线 + 入水那圈水花
  EVENTS.fishJump = ev(1.0, (k, x, gy, u, o) => {
    const s = u, dir = o.dir || 1, y = gy - (o.y0 ?? s * .4);
    const px = lerp(x - s * 1.4 * dir, x + s * 1.6 * dir, k), py = y - Math.sin(k * Math.PI) * s * 1.8;
    push(); translate(px, py); rotate((k - .5) * 1.7 * dir); PROP.fish(0, 0, s * 1.15, { dir, lit: 0 }); pop();
    if (k < .2 || k > .78) for (let i = 0; i < 5; i++) paint(ellPts(x + (hash(i) - .5) * s * 1.1, y - s * .25 * (1 - Math.abs(k - .5) * 2), s * .08, s * .08, 6), { wash: C.snowLt, washOp: 170, ink: null });
  });

  // ================================================================ 回忆（§49）
  // 原来的走马灯"根本看不出来在回忆什么"。原因很具体：回忆画成了**细节很多的正景**，
  // 又叠了一层雾。回忆的正确画法是反过来——**大色块剪影 + 暗角 + 一圈发光边**，只留三四个形状，
  // 观众靠边框认出"这是回忆"，靠剪影认出"回忆的是哪件事"。
  //   kind: 'seed' 播种 · 'sprout' 破土 · 'tree' 长成 · 'hands' 递过来 · 'cycle' 一整个寒暑
  //   k: 0..1 这一格的存在进度（出场/退场用它淡入淡出）
  PROP.memoryVignette = (cx, cy, r, kind, k = 1, o = {}) => {
    if (k < .03 || r < 20) return;
    boilSeed('mem' + kind); const kk = clamp(k);
    // 暗角：先在外面压夜色，让圆盘自己"亮起来"（这是回忆的边框，不是画）
    // o.mask = 用硬光圈把盘外全部遮掉（转场的一瞬间最清楚）；默认是三层软衰减。
    if (o.mask) irisShape(ellPts(cx, cy, r * 1.06, r * .95, 30), o.dark || mixCol(C.night, C.ink, .4));
    else for (let i = 0; i < 3; i++) paint(ellPts(cx, cy, r * (1.9 + i * .5), r * (1.75 + i * .5), 26, r * .02),
      { wash: o.dark || C.night, washOp: (34 - i * 9) * kk, ink: null });
    paint(ellPts(cx, cy, r, r * .88, 30, r * .008), { wash: mixCol(C.warmLt, C.paper, .15), washOp: 168 * kk, ink: null });
    const s = r * .42, col = mixCol(C.night, C.warm, .18);
    const bw = clamp(s / 60, .4, 1.5);   // 描边宽度是"笔号"不是像素：s/14 会饱和到 2.6，再乘 1.7 就是 4.4 号（一条黑杠）
    const sil = pts => paint(pts, { wash: col, fill: mixCol(col, C.ink, .3), fillOp: 170 * kk, bleed: .12, tex: .5, border: .4, ink: null, curv: .35 });
    const dot = (dx, dy, rad, a = 1) => {
      paint(ellPts(cx + dx, cy + dy, rad, rad * 1.15, 10), { wash: mixCol(C.warm, '#FFFFFF', .55), washOp: 240 * kk * a, ink: null });
      halo(cx + dx, cy + dy, rad * 4.6, C.warm, .9 * kk * a);
    };
    if (kind === 'seed') {          // 一个跪着的身影把一粒光按进土里（A11 的那一下）
      sil([[cx - s * 1.5, cy + s * .8], [cx + s * 1.5, cy + s * .8], [cx + s * 1.1, cy + s * .3], [cx - s * 1.1, cy + s * .3]]);   // 土
      sil([[cx - s * .92, cy + s * .34], [cx - s * .04, cy + s * .34], [cx + s * .12, cy - s * .52], [cx - s * .74, cy - s * .42]]); // 俯身的身体
      paint(ellPts(cx - s * .5, cy - s * .72, s * .34, s * .32, 14), { wash: col, ink: null });                                       // 头
      inkLine([[cx - s * .1, cy - s * .34], [cx + s * .5, cy + s * .04], [cx + s * .56, cy + s * .28]], bw * 1.7, col, 'ink', .3);   // 伸下去的那条手臂
      dot(cx + s * .58, cy + s * .34, s * .15);
    } else if (kind === 'sprout') { // 拱 → 直腰 → 两片叶（和 PROP.sprout 同一个读法）
      sil([[cx - s * 1.6, cy + s * .8], [cx + s * 1.6, cy + s * .8], [cx + s * 1.4, cy + s * .42], [cx - s * 1.4, cy + s * .42]]);
      inkLine([[cx, cy + s * .48], [cx + s * .1, cy - s * .1], [cx, cy - s * .6]], bw * 1.1, col, 'ink', .35);
      for (const d of [-1, 1]) paint(ellPts(cx + d * s * .42, cy - s * .68, s * .44, s * .15, 14, 0, d * .85), { wash: col, fill: mixCol(col, C.ink, .3), fillOp: 170 * kk, bleed: .12, tex: .5, ink: null, curv: .3 });
      dot(cx, cy - s * .86, s * .12);
    } else if (kind === 'tree') {   // 一棵大树，心里有一点光
      sil([[cx - s * 1.5, cy + s * .85], [cx + s * 1.5, cy + s * .85], [cx + s * 1.1, cy + s * .1], [cx - s * 1.1, cy + s * .1]]);
      paint(ribbon([[cx, cy + s * .3], [cx, cy - s * .4], [cx, cy - s * 1.2]], s * .18, s * .1), { wash: col, ink: null });
      sil(blob(cx, cy - s * .95, s * 1.15, s * .95, 6, .14, 26, .85));
      dot(cx, cy - s * .95, s * .16);
    } else if (kind === 'hands') {  // 两只手：一只手递给另一只手（第一部三个坏人的总回收）
      paint(ribbon([[cx - s * 1.95, cy + s * .72], [cx - s * 1.2, cy + s * .34], [cx - s * .52, cy + s * .16]], s * .3, s * .24), { wash: col, ink: null, curv: .35 });
      paint(ribbon([[cx + s * 1.95, cy - s * .58], [cx + s * 1.2, cy - s * .26], [cx + s * .52, cy - s * .1]], s * .3, s * .24), { wash: mixCol(col, C.warm, .22), ink: null, curv: .35 });
      paint(ellPts(cx - s * .44, cy + s * .18, s * .28, s * .2, 12, 0, -.34), { wash: col, ink: null });
      paint(ellPts(cx + s * .44, cy - s * .12, s * .28, s * .2, 12, 0, .34), { wash: mixCol(col, C.warm, .22), ink: null });
      dot(cx, cy - s * .46, s * .17);
    } else {                        // 'cycle'：一格之内走完一整个寒暑——太阳和月亮各走半圈，地上那棵在长
      const a = frac(kk) * TAU - Math.PI / 2;
      const sunX = cx + Math.cos(a) * r * .62, sunY = cy + Math.sin(a) * r * .5;
      paint(ellPts(sunX, sunY, s * .17, s * .17, 10), { wash: mixCol(C.warm, '#FFFFFF', .5), washOp: 235 * kk, ink: null });
      halo(sunX, sunY, s * .85, C.warm, .9 * kk);
      sil([[cx - s * 1.5, cy + s * .8], [cx + s * 1.5, cy + s * .8], [cx + s * 1.3, cy + s * .35], [cx - s * 1.3, cy + s * .35]]);
      const g = clamp(kk * 1.25);
      inkLine([[cx, cy + s * .4], [cx, cy + s * .1 - g * s * .5], [cx, cy + s * .05 - g * s * .82]], bw * (.5 + g * .7), col, 'ink', .3);
      for (const d of [-1, 1]) if (g > .35) paint(ellPts(cx + d * s * .36 * g, cy - s * .68 * g, s * .4 * g, s * .14 * g, 12, 0, d * .85), { wash: col, ink: null });
    }
    // 发光边：回忆的身份标记
    const rim = []; for (let i = 0; i <= 34; i++) { const a = i / 34 * TAU; rim.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * .88]); }
    inkLine(rim, swOf(r * .022) * kk, mixCol(C.warmLt, '#FFFFFF', .35), 'inkfine', 0);
    glow(cx, cy, r * 1.05, C.warm, .1 * kk);
  };
  // 时间流逝条（§49b "昼夜变换太慢，看不出城市环保变化的漫长过程"）。
  // 同一块地排 n 格，**格宽按公比 ratio 递减**——后半段越翻越快，体感上就是"过了很多年"。
  // 每格只画三件事：天色（夜蓝/昼暖）、地线、同一棵东西的生长阶段。剪影级细节，绝不与正景抢戏。
  // 返回最后一格的右边界，方便场景接着排下一段。
  PROP.timeLapse = (x, gy, w, h, n = 9, o = {}) => {
    const ratio = o.ratio ?? .86, darkK = o.darkK ?? 1;
    let sum = 0; for (let i = 0; i < n; i++) sum += Math.pow(ratio, i);
    const unit = w / sum; let cx = x;
    for (let i = 0; i < n; i++) {
      const pw = unit * Math.pow(ratio, i), q = i / Math.max(1, n - 1), night = o.night === false ? 0 : (i % 2 ? darkK : 0);
      paint(rectPts(cx, gy - h, pw * .94, h, pw * .04), { wash: night > .5 ? mixCol(C.night, '#20264A', .4) : mixCol(C.warmLt, C.paper, .35), washOp: 96, ink: null });
      paint(ellPts(cx + pw * .3, gy - h * .78, h * .055, h * .055, 10), { wash: night > .5 ? C.snowLt : mixCol(C.warm, '#FFFFFF', .45), washOp: 200, ink: null });
      if (night > .5) for (let k2 = 0; k2 < 3; k2++) paint(ellPts(cx + pw * (.15 + .3 * k2), gy - h * (.6 + .28 * hash(k2 + i)), 1.4, 1.4, 6), { wash: C.snowLt, washOp: 150, ink: null });
      paint(rectPts(cx, gy - h * .1, pw * .94, h * .1, 1), { wash: mixCol(C.snowSh, C.night, .2 + .3 * night), washOp: 150, ink: null });
      const m = h * (.1 + .58 * ease(q)) / SCALE.HERO;
      if (q < .18) PROP.sapling(cx + pw * .47, gy - h * .08, m, { k: .5 + q * 2, lit: night > .5 ? .8 : 0 });
      else PROP.fir(cx + pw * .47, gy - h * .08, m, { seed: i, snowK: .3 + .7 * q, tone: mixCol(C.sapDk, night > .5 ? C.night : C.sapLt, .25) });
      if (o.growth && q > .7) PROP.fir(cx + pw * .2, gy - h * .08, m * .55, { seed: i + 40, snowK: .5 });
      cx += pw;
    }
    for (let i = 0, bx = x; i < n; i++) { bx += unit * Math.pow(ratio, i); inkLine([[bx, gy - h], [bx, gy]], .8, mixCol(PAL.paper, PAL.ink, .35), 'inkfine', 0); }
    return cx;
  };

  // ================================================================ 手持包装器
  // 手臂钩子画在手臂尖端、+x 沿手臂向外。这里给每件手持道具一个"握点偏移 + 旋转"，让它在手里摆正。
  const HOLD = {
    bread: [1.1, .35, .55, -.1], coin: [.9, .1, .5, 0], coinString: [1, .5, .5, -.1], candle: [.85, .3, .38, -.15],
    candleBunch: [1.1, .4, .4, -.1], seed: [1, .1, .5, 0], sack: [1.2, .6, .6, -.15], axe: [.55, .2, .55, -1.15],
    saw: [1, .2, .4, -.25], leafBadge: [1, .3, .5, 0], torch: [.5, .25, .55, -.5], lantern: [.6, -.2, .5, -.3],
    cart: [1.2, .4, .5, -.1], litter: [1, .3, .5, 0], rattle: [.9, .2, .5, -.2],
  };
  PROP.held = (name, o = {}) => (u, sw) => {
    const h = HOLD[name] || [1.05, .1, .5, -.15];
    push(); translate(h[0] * u, h[1] * u); rotate(h[3]); scale(h[2], h[2]);
    PROP[name](0, 0, u * (h[2] < .45 ? 1.5 : 1), { pool: false, ...o });
    pop();
  };

  // ================================================================ 检查表
  // 每格站一只灰色参考 Clawd（1 英雄高）。**每一行独立定标**：该行最高的那件把行高占满，其余按真实比例摆，
  // 所以"这栋楼是角色的几倍"在图上就是它看起来的那个数。标签末尾的数字 = 建议的"几个 Clawd 高"。
  const label = (txt, x, y, size = 14, dark) => letter(txt, x, y, size, dark ? '#C9D6EC' : PAL.ink, { ink: false, alpha: .85 });
  const ghost = (x, gy, u, o = {}) => clawd(x, gy, u, { col: '#A79FB0', dk: '#847C90', lt: '#C0B8C8', eyes: 'dot', mouth: null, boilKey: 'ghost' + (o.tag || ''), aL: -.15, aR: -.15, ...o });
  // 每格站一只灰色参考 Clawd（1 英雄高）。**每一行独立定标**：该行最高的那件把行高占满，其余按真实比例摆。
  // 第 4 项是可选开关：{dark:true} 给这格铺一块夜色底（冷光/暖光在纸色上本来就看不见，§42），
  // {mag:n} 把该件放大 n 倍并标注——小道具（鱼、猫、脚印）按真实比例只有角色的 1/6，放大是为了核对画法。
  function sheet(rowsSpec) {
    return t => {
      const cellH = (H - 110) / rowsSpec.length;
      rowsSpec.forEach((row, r) => {
        // opt.fit = 这一件"算进排高"的额外余量：树冠、吊臂这些会超出它的名义高度，不补偿就会顶到上一行。
        const maxM = Math.max(...row.map(it => Math.max(1.15, it[1] * (it[3]?.fit || 1)))), cw = W / row.length;
        const pph = Math.min((cellH - 96) / maxM, cw * .42), u = pph / 8, gy = 92 + (r + 1) * cellH - 34;
        row.forEach(([lab, m, draw, opt], i) => {
          const cx = cw * i + cw / 2;
          if (opt?.dark) {
            // 夜色底一直铺到基线以下，标签才落在深色上——浅蓝标签写在纸色上是看不见的。
            paint(rrPts(cx - cw * .46, gy - cellH * .8, cw * .92, cellH * .8 + 44, 14, 2), { wash: '#20264A', fill: '#141830', fillOp: 70, bleed: .1, tex: .5, border: .4, ink: null });
            for (let k = 0; k < 9; k++) paint(ellPts(cx - cw * .42 + hash(k + r) * cw * .84, gy - cellH * .76 + hash(k + 7) * cellH * .5, 1.6, 1.6, 6), { wash: '#C9D6EC', washOp: 90 + 90 * hash(k + 3), ink: null });
          }
          ghost(cx - cw * .33, gy, u, { tag: r + '_' + i });
          const mg = opt?.mag || 1;
          draw(cx + cw * .06, gy, u * mg, u * mg / SCALE.heroU, cw);
          label(lab + (m > 1.02 ? '   ' + m + '×' : '') + (mg > 1 ? '   放大 ' + mg + '×' : ''), cx, gy + 26, 14, opt?.dark);
        });
        inkLine([[0, gy + 3], [W, gy + 3]], .7, mixCol(PAL.paper, PAL.ink, .3), 'inkfine', 0);
      });
    };
  }
  const E = SCALE.env;

  // 按尺寸分级分行：小件和大件混在一行会把小件挤到看不见。
  // 白/米/钢这些材质被 §48 压到 warm 以下之后，在纸色底上会发闷——所以这一张的**每一格都铺夜色底**，
  // 这才是它们在片子里真正站着的背景。（docs/props_tone.jpg 就是这条规则的标尺。）
  const NIGHTROW = rows => rows.map(row => row.map(([lab, m, draw, opt]) => [lab, m, draw, { dark: true, ...(opt || {}) }]));
  LOOPS.props_hand = sheet(NIGHTROW([
    [['bread 面包（割口漏光+热气+掉渣）', 1.2, (x, gy, u) => PROP.bread(x, gy, u * 1.15, { steam: true })],
     ['bread half 撕剩的半边', 1.2, (x, gy, u) => PROP.bread(x, gy, u * 1.15, { half: true })],
     ['coinString 全部家当', 1.4, (x, gy, u) => PROP.coinString(x, gy, u * 1.3, { n: 5 })],
     ['scale 不平的秤', 1.6, (x, gy, u) => PROP.scale(x, gy, u * 1.3, { tilt: .34 })]],
    [['sack 小布包 / 大袋（比人大）', 3.2, (x, gy, u) => { PROP.sack(x - u * 2.2, gy, u * 1.1, {}); PROP.sack(x + u * 1.6, gy, u * 1.1, { big: true, pool: true }); }],
     ['seed 掌心种子（心跳同频）', 1.2, (x, gy, u) => PROP.seed(x, gy, u * 1.6, { pool: true }), { mag: 2.4 }],
     ['candle 整支 / 未点 / 半支', 1.6, (x, gy, u) => { PROP.candle(x - u * 1.8, gy, u * 1.3, { lit: true }); PROP.candle(x - u * .2, gy, u * 1.3, {}); PROP.candle(x + u * 1.5, gy, u * 1.3, { half: true, lit: true }); }],
     ['candleBunch 掏不完的一串', 1.6, (x, gy, u) => PROP.candleBunch(x, gy, u * 1.4, { lit: true })]],
    [['sprout 拱→直腰→展叶', 1.4, (x, gy, u) => { PROP.sprout(x - u * 2.2, gy, u * 1.5, { k: .26 }); PROP.sprout(x - u * .3, gy, u * 1.5, { k: .64 }); PROP.sprout(x + u * 1.8, gy, u * 1.5, { k: 1, pool: true }); }, { mag: 1.7 }],
     ['axe 全长=0.83角色：举→劈→崩屑', 1.6, (x, gy, u) => { PROP.axe(x - u * 3.4, gy - u * 2.6, u, { swing: frac(T * .45) }); PROP.axe(x + u * 1.9, gy - u * 2.1, u * .8, { ang: -.2, spark: frac(T * .5), chip: frac(T * .5 + .1) }); }],
     ['saw 长锯（老树用锯）', 1.4, (x, gy, u) => PROP.saw(x - u * 2.6, gy - u * 1.6, u * 1.1, {}), { mag: 1.4 }],
     ['leafBadge / scarf 挂牌与大围巾', 1.3, (x, gy, u) => { PROP.leafBadge(x - u * .6, gy, u * 2.1, { lit: .9 }); ghost(x + u * 2.6, gy, u, { tag: 'sc', draw: uu => PROP.scarf(uu, { wind: .35 }) }); }]],
  ]));

  LOOPS.props_life = sheet([
    [['torch 紫火把 + 落地光斑', 2.4, (x, gy, u) => PROP.torch(x, gy, u * 1.3, { col: PAL.violet, side: true })],
     ['lantern 深蓝灯笼（高杆）', 3, (x, gy, u) => PROP.lantern(x, gy, u * 1.25, { col: PAL.indigo, pole: true })],
     ['campfire 篝火＝世界的边界', 2.6, (x, gy, u) => PROP.campfire(x, gy, u * 1.25, {})],
     ['neon 霓虹（暗底+灯管）', 1.6, (x, gy, u) => PROP.neon(x, gy - u * 3, u * 1.5, { blink: true })]].map(it => [it[0], it[1], it[2], { dark: true }]),
    [['fir 幼/成/老（雪负载见 props_tree）', 5, (x, gy, u, sc, cw) => { PROP.fir(x - cw * .28, gy, 1.8 * sc, { seed: 1 }); PROP.fir(x, gy, 3.6 * sc, { seed: 2 }); PROP.fir(x + cw * .28, gy, 5 * sc, { seed: 3, old: true }); }, { fit: 1.12 }],
     ['stump 普通 / 大地桩', 2, (x, gy, u, sc, cw) => { PROP.stump(x - cw * .18, gy, .5 * sc, { snow: true, seed: 1 }); PROP.stump(x + cw * .18, gy, 1.6 * sc, { wide: 1.15, seed: 2 }); }],
     ['sapling 树苗（苗心夜灯）', 1.6, (x, gy, u, sc, cw) => { PROP.sapling(x - cw * .18, gy, .9 * sc, { k: .4, lit: .5 }); PROP.sapling(x + cw * .18, gy, 1.4 * sc, { k: 1, lit: 1 }); }, { mag: 2.2 }],
     ['greenSoul 光鸟群（不是芽）', 2.8, (x, gy, u, sc) => { PROP.fir(x, gy, 1.8 * sc, { seed: 5 }); PROP.greenSoul(x, gy, 1.8 * sc, frac(T * .22) * 1.2, PAL.sap); }]],
    [['firefly 会飞的光（体不画清）', 1.3, (x, gy, u) => PROP.fireflies(x, gy - u * 1.6, 7, u * 2.4, u * 1.5), { dark: true, mag: 1.6 }],
     ['fish 鱼+头灯+涟漪', 1.3, (x, gy, u) => { PROP.fish(x - u * 1.4, gy - u * .8, u * 1.5, { lit: 1 }); PROP.fish(x + u * 1.3, gy - u * 1.7, u * 1.2, { lit: 0, dir: -1 }); }, { mag: 2.2 }],
     ['cat / hedgehog / birdFlock', 1.5, (x, gy, u) => { PROP.cat(x - u * 1.9, gy, u * 1.3); PROP.hedgehog(x + u * .2, gy, u * 1.1); PROP.birdFlock(x + u * 2, gy - u * 2.4, 6, u * 2.6, .85); }, { mag: 2 }],
     ['footprints 渐淡脚印 + 车辙', 1.2, (x, gy, u) => { PROP.footprints(x - u * 3, gy, 9, u * 1.15, u * 1.2, { dir: 1 }); PROP.wheelRut(x - u * 3, gy + u, u * 5.4, u * 1.2); }, { mag: 1.8 }],
     ['iceCrack / litter / breathFog', 1.3, (x, gy, u) => { PROP.iceCrack(x - u * 2.8, gy - u * .3, u * 5.2, u * 1.2, .9); for (let i = 0; i < 3; i++) PROP.litter(x - u * 1.6 + i * u * 1.8, gy + u, u * 1.3, { kind: i }); PROP.breathFog(x + u * 1.8, gy - u * 2.2, u * 1.3, frac(T * .5)); }, { mag: 1.8 }]],
  ]);

  LOOPS.props_city = sheet([
    [['cabin 村屋（窗花/冰凌/炊烟）', E.cabin, (x, gy, u, sc) => PROP.cabin(x, gy, E.cabin * sc, { lit: .95, smoke: 1 })],
     ['tenement 老居民楼（窗格+晾衣）', E.tenement, (x, gy, u, sc) => PROP.tenement(x, gy, E.tenement * sc, { rows: 9, cols: 3, lit: .25 })],
     ['glassBlock 玻璃幕墙', E.glass, (x, gy, u, sc) => PROP.glassBlock(x, gy, E.glass * sc, {})],
     ['lighthouse 灯塔 + 扫动光束', E.lighthouse, (x, gy, u, sc) => PROP.lighthouse(x, gy, E.lighthouse * sc, { pool: true }), { fit: 1.12 }]],
    [['factory 厂房+烟囱+冷却塔+罐+管廊', E.factory, (x, gy, u, sc) => PROP.factory(x + u * .8, gy, E.factory * sc, { smoke: 1, beacon: 1, win: true, search: .7 })],
     ['giantTree 巨树（光在树干内）', E.giantTree, (x, gy, u, sc) => PROP.giantTree(x, gy, E.giantTree * sc, { heart: 1, lit: .85 }), { fit: 1.28 }],
     ['dome 光罩（体积不是线）', E.dome, (x, gy, u, sc) => PROP.dome(x + u * .4, gy, E.dome * sc * SCALE.HERO / 2, .9), { dark: true }],
     ['crane 吊臂（拆厂）', E.crane, (x, gy, u, sc) => PROP.crane(x - u * 1.2, gy, E.crane * sc, { ang: -.2, hoist: .45 }), { fit: 1.1 }]],
  ]);

  LOOPS.props_street = sheet([
    [['excavator 挖掘机 3.6×角色（靠横向尺寸读大）', E.excavator, (x, gy, u, sc) => PROP.excavator(x, gy, E.excavator * sc, { armA: .6, stick: -1, pool: true }), { fit: 1.35 }],
     ['cart 蜡烛车 + 蓝灯笼', E.cart, (x, gy, u, sc) => PROP.cart(x, gy, E.cart * sc * 1.4, { lantern: PAL.indigo, pool: true }), { fit: 2.7 }],
     ['sled 雪橇 + 礼物堆', E.sled, (x, gy, u, sc) => PROP.sled(x, gy, E.sled * sc * 1.3, { glow: true }), { fit: 1.9 }],
     ['reindeer 驯鹿剪影 + 白气', E.reindeer, (x, gy, u, sc) => { PROP.reindeer(x - u * .6, gy, E.reindeer * sc * 1.3, { breath: 1 }); PROP.reindeer(x + u * 2.4, gy + u * .3, E.reindeer * sc * 1.1, { dir: -1 }); }],
     ['hoarding 围挡（烟囱徽记·无字）', .9, (x, gy, u, sc) => PROP.hoarding(x - u * 2.6, gy, .9 * sc * 1.3, {})]],
    [['streetLamp 冷 → 暖', E.streetLamp, (x, gy, u, sc) => { PROP.streetLamp(x - u * 3.4, gy, E.streetLamp * sc * 1.3, { cold: true }); PROP.streetLamp(x + u * 2.8, gy, E.streetLamp * sc * 1.3, {}); }, { dark: true, fit: 1.2 }],
     ['scaffolding 脚手架', 3, (x, gy, u, sc) => PROP.scaffolding(x, gy, 3 * sc * 1.1, {})],
     ['firBand 三层进深 11 棵', E.fir, (x, gy, u, sc, cw) => PROP.firBand(x - cw * .46, gy, 11, E.fir * sc, { span: cw * .92, snowK: .9 }), { fit: 1.62 }],
     ['bench / litter / snowVeil 街具', .9, (x, gy, u, sc) => { PROP.bench(x - u * 1.4, gy, .9 * sc * 1.3); for (let i = 0; i < 3; i++) PROP.litter(x + u * 1.6 + i * u * .9, gy, u * 1.2, { kind: i }); PROP.snowVeil(gy - u * 2.4, u * 1.4, .9); }, { mag: 1.6 }],
     ['lightPatch 冷/暖光斑对照', 1.2, (x, gy, u) => { PROP.lightPatch(x - u * 1.8, gy - u * .6, u * 2.8, PAL.violet, .95); PROP.lightPatch(x + u * 1.8, gy - u * .6, u * 2.8, C.warm, .95); }, { dark: true }]],
  ]);

  // §50 的检查表：树单独一张。第一行核对"雪负载"（同一棵树 snowK 0/.5/1），第二行核对"倒下的树必须
  // 比樵夫大得多"（fallenTrunk 用 E.firFelled = 6.4，斧头站在旁边作比例尺），第三行核对"林子够不够密"。
  LOOPS.props_tree = sheet([
    [['fir snowK 0 / .5 / 1（雪只压在朝上的面）', E.fir, (x, gy, u, sc, cw) => { PROP.fir(x - cw * .3, gy, E.fir * sc * .5, { seed: 1, snowK: 0 }); PROP.fir(x, gy, E.fir * sc, { seed: 2, snowK: .5 }); PROP.fir(x + cw * .3, gy, E.fir * sc * 1.2, { seed: 3, snowK: 1 }); }, { fit: 1.15 }],
     ['fir bare 枯（第二部被砍光的林子）', E.fir, (x, gy, u, sc, cw) => { PROP.fir(x - cw * .17, gy, E.fir * sc, { seed: 4, bare: true }); PROP.fir(x + cw * .17, gy, E.fir * sc * 1.25, { seed: 5, bare: true }); }],
     ['fir old 板根+五层', E.firOld, (x, gy, u, sc) => PROP.fir(x, gy, E.firOld * sc, { seed: 6, old: true, rime: true }), { fit: 1.15, mag: 1 }]],
    [['fallenTrunk 6.4×角色：一整棵', E.firFelled, (x, gy, u, sc, cw) => PROP.fallenTrunk(x - cw * .3, gy, E.firFelled * sc, { dir: 1, old: true })],
     ['stump 大地桩 + 斧（比例尺）', E.stumpGiant, (x, gy, u, sc, cw) => { PROP.stump(x - cw * .12, gy, E.stumpGiant * sc, { wide: 1.25, seed: 2 }); PROP.axe(x + cw * .14, gy, u * 1.6, { ang: -1.2 }); }]],
    [['firBand 三层进深 14 棵', E.fir, (x, gy, u, sc, cw) => PROP.firBand(x - cw * .44, gy, 14, E.fir * sc, { span: cw * .88, rows: 3, snowK: 1 }), { fit: 1.62 }],
     ['firBand 远排剪影（背景用）', E.fir, (x, gy, u, sc, cw) => PROP.firBand(x - cw * .44, gy, 12, E.fir * sc * .8, { span: cw * .88, rows: 2, snowK: .35, tone: mixCol(C.sapDk, C.night, .3) }), { fit: 1.5 }],
     ['firBand 枯（第二部）', E.fir, (x, gy, u, sc, cw) => PROP.firBand(x - cw * .44, gy, 12, E.fir * sc * .8, { span: cw * .88, rows: 2, snowK: 0, bare: true }), { fit: 1.5 }]],
  ]);

  // §51 的检查表：16 件微事件每件冻结在自己的代表帧上（t0 反推自 T），括号里是它占的秒数。
  // 这张图的作用是让"那几秒钟该发生什么"变成一次查表，而不是现场编。
  const EVPEAK = { snowCrash: .42, icicleDrip: .58, rimeShake: .18, birdsStartle: .45, trainPass: .5, firstSmoke: .82,
    catLeap: .42, emberRise: .38, stepPuff: .5, breathPuff: .5, flickerOut: .5, flickerIn: .8, windowLit: .85,
    rippleCross: .48, crowFly: .5, fishJump: .45 };
  // 每件的放大倍率：一滴冰凌、一蓬踩雪粉本来就只有角色的 1/20，等比摆在角色旁边根本看不出画法。
  // 这张表把"核对画法"和"核对尺度"分开——格子里那根竖线才是 1 个角色高。
  const EVMAG = { snowCrash: 4.2, icicleDrip: 4.2, rimeShake: 4.2, birdsStartle: 3.4, trainPass: 2, firstSmoke: 3.2,
    catLeap: 2.6, emberRise: 4.4, stepPuff: 6.5, breathPuff: 5.5, flickerOut: 2.8, flickerIn: 2.8,
    windowLit: 2.8, rippleCross: 3, crowFly: 2.8, fishJump: 2.6 };
  LOOPS.props_events = t => {
    const names = Object.keys(EVENTS), cols = 4, rows = Math.ceil(names.length / cols);
    const cw = W / cols, chh = (H - 150) / rows, NIGHT = ['flickerOut', 'flickerIn', 'windowLit'];
    letter('微事件库 EVENTS —— 调用 EVENTS.名字(起拍秒, x, 地线, u)；窗口外一笔不落，可同帧叠十几件。', W / 2, 40, 16, PAL.ink, { ink: false, alpha: .85 });
    letter('竖线 = 1 个成年 Clawd 高（真实比例）。事件本身按标注倍率放大画，所以会超出这条线——放大只为核对画法。', W / 2, 62, 14, PAL.ink, { ink: false, alpha: .7 });
    names.forEach((n, i) => {
      const f = EVENTS[n], cx = (i % cols) * cw + cw / 2, gy = 80 + (Math.floor(i / cols) + 1) * chh - 30;
      const heroPx = chh * .3, mg = EVMAG[n] ?? 2.6, u = heroPx / 8 * mg, night = NIGHT.includes(n);
      if (night) paint(rrPts(cx - cw * .46, gy - chh * .78, cw * .92, chh * .8, 12, 2), { wash: '#20264A', fill: '#141830', fillOp: 70, bleed: .1, tex: .5, border: .4, ink: null });
      else inkLine([[cx - cw * .45, gy + 4], [cx - cw * .45, gy - chh * .76], [cx + cw * .45, gy - chh * .76], [cx + cw * .45, gy + 4]], .6, mixCol(PAL.paper, PAL.ink, .22), 'inkfine', 0);
      const bx = cx - cw * .37;                                    // 1 角色高的标尺
      inkLine([[bx, gy], [bx, gy - heroPx]], 1.6, mixCol(PAL.ink, PAL.paper, .25), 'inkfine', 0);
      for (const yy of [gy, gy - heroPx]) inkLine([[bx - 5, yy], [bx + 5, yy]], 1.6, mixCol(PAL.ink, PAL.paper, .25), 'inkfine', 0);
      f(T - f.dur * (EVPEAK[n] ?? .5), cx + cw * .04, gy, u, {});
      label(n + '（' + f.dur.toFixed(2) + 's · 放大 ' + mg + '×）', cx, gy + 22, 13, night);
    });
  };
  LOOPS.props_events.len = 4;

  // §48 的检查表：一条亮度尺。每个色块由**算它的那段代码**打印自己的 hexLum，并在超预算时把自己涂红——
  // 这张图会自己报警，不需要人肉眼比。数字荒谬（>1、<0、负数）时也照样涂红。
  LOOPS.props_tone = t => {
    const mats = [['雪 snow', C.snow], ['受光雪 snowLt', C.snowLt], ['布 cloth', C.cloth], ['蜡 wax', C.wax],
      ['纸 paper', C.paper], ['亮钢 steelLt', C.steelLt], ['铜/安全帽 gold', C.gold], ['冰 ice', C.ice]];
    const lights = [['光 warm', C.warm], ['光芯 warmLt', C.warmLt], ['火焰内芯', '#FFFDF2']];
    let bad = 0;
    const chip = (x, y, w, h, col, lab, kind) => {
      const L = hexLum(col);
      const ok = kind === 'mat' ? L <= TONE.edge + .001 : L >= TONE.hot - .001;
      paint(rectPts(x, y, w, h, 5), { wash: col, fill: col, fillOp: 255, bleed: .04, tex: .3, border: .6, ink: PAL.ink, sw: .9 });
      if (!ok || !(L >= 0 && L <= 1)) { paint(rectPts(x, y, w, h, 5), { wash: C.red, washOp: 200, ink: null }); bad++; }
      label(lab, x + w / 2, y + h + 20, 14);
      label('L=' + L.toFixed(2) + (kind === 'mat' ? '  上限 ' + TONE.edge : '  下限 ' + TONE.hot), x + w / 2, y + h + 40, 13);
    };
    letter('亮度预算尺（§48）：非光材质的 hexLum 一律 ≤ ' + TONE.edge + '，只有发光的东西 ≥ ' + TONE.hot + '；超标的那格会被涂红', W / 2, 44, 17, PAL.ink, { ink: false, alpha: .85 });
    mats.forEach((c, i) => chip(72 + i * 222, 96, 200, 86, c[1], c[0], 'mat'));
    lights.forEach((c, i) => chip(72 + i * 222, 268, 200, 86, c[1], c[0], 'light'));
    // 同一支蜡烛：未点 / 点着 / 加光斑——"光压过材质"必须是看得见的对比，不是口号
    const gy = 906;
    [[330, '未点：蜡只是材质，不发亮', {}],
     [960, '点上：火焰是画面里最亮的东西', { lit: true }],
     [1590, '点上 + 落地光斑（光落在雪上）', { lit: true, pool: true }]].forEach(([x, lab, o]) => {
      paint(rectPts(x - 250, gy - 400, 500, 400, 8), { wash: '#20264A', fill: '#141830', fillOp: 70, bleed: .1, tex: .5, ink: null });
      ghost(x - 150, gy, 30, { tag: 'tone' + x });
      PROP.candle(x + 40, gy, 62, o);
      label(lab, x, gy + 44, 15);
    });
    letter(bad === 0 ? '断言：11 / 11 格全部在预算内' : '断言：' + bad + ' 格超标（已涂红）', W / 2, gy + 74, 18, bad === 0 ? PAL.sap : C.red, { ink: false, alpha: .9 });
  };
  LOOPS.props_tone.len = 1;

  // §49 的检查表：回忆必须是"大色块剪影 + 暗角 + 一圈发光边"，正景的细节一概不带；
  // 下面那条是"时间流逝条"——昼夜换得慢不是因为日子长，是因为格子和格子一样宽。
  LOOPS.props_memory = t => {
    const kinds = ['seed', 'sprout', 'tree', 'hands', 'cycle'], cw = W / kinds.length;
    letter('回忆（§49a）：大色块剪影 + 暗角 + 一圈发光边。观众靠边框认出"这是回忆"，靠剪影认出"回忆的是哪件事"。', W / 2, 42, 16, PAL.ink, { ink: false, alpha: .85 });
    kinds.forEach((k, i) => {
      const cx = cw * i + cw / 2, cy = 400, r = cw * .34;
      paint(rectPts(cx - cw * .46, cy - r * 1.42, cw * .92, r * 2.84, 10, 2), { wash: '#1B1B2E', fill: '#12142A', fillOp: 75, bleed: .1, tex: .5, ink: null });
      PROP.memoryVignette(cx, cy, r, k, .8 + .2 * Math.sin(T * 1.6 + i * 1.3));
      label(k, cx, cy + r * 1.34, 15, true);
    });
    letter('时间流逝条（§49b）：同一片地排 9 格，格宽按公比 .86 递减——后半段越翻越快，体感上就是"过了很多年"。', W / 2, 742, 16, PAL.ink, { ink: false, alpha: .85 });
    PROP.timeLapse(120, 990, W - 240, 210, 9, { growth: true });
  };
  LOOPS.props_memory.len = 4;

  window.PROP = PROP;
})();
