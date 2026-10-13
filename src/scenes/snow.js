// snow.js — 第一部《雪夜灯火》／Seed of The Light, Part I（335.1s · 128 BPM · 首拍 .25s）
//
// 一只旧 Clawd 穿过一个结冰的夜晚：三盏冷色的光各自给他看一颗冷掉的心；一捧真正的萤火虫把他领到一只
// 没有底的袋子前，他把光还回去——然后种下一粒种子，睡过去，种子醒了。最后一帧是那棵树，早了几十年。
//
// 这一版是**重制**：角色全部走 src/jobs.js 的职业模板，道具/树/建筑全部走 src/props.js，环境里该发生的
// 小事全部走 props.js 的 EVENTS，天色与地面与夜色层走 src/scenes/film.js。
// 以前这些是在场景里边推情节边现编的，编不出来就剩下发呆（§43/§51），编出来了也没人复核尺度（§41/§47）。
//
// 每帧的固定顺序（写死，别再发明）：
//   camBegin → 天空/星/月 → 远景林线(cheap) → 地面 → 中景建筑与树 → **FILM.grade()** →
//   光源与落地光斑 → 角色 → 雪与微事件 → camEnd → 片名/转场
// grade() 在角色之前：夜色压住所有不发亮的东西，光斑和角色身上因此天然更亮（§48）。
(() => {
  const B = [0, 15.22, 35.85, 63.97, 95.85, 127.72, 142.72, 178.35, 206.47, 228.97, 256.8, 279.6, 299.85, 331.29, 335.1];
  const F = FILM, P = PROP, C = P.C, E = P.SCALE.env, EV = P.EVENTS, dim = P.dim;
  const VIO = F.VIO, BLU = F.BLU, GRN = F.GRN, WARM = F.WARM;
  const EDGE = F.TONE.edge, U = 21;                 // U = 主角身体单位；全身 8u = 168px = 1 英雄高
  // §71 三盏冷光在 FILM 色板里是**材质档**（warm=.58），当作发光体太暗了。
  // 亮度预算说"只有发光的东西 ≥ hot"，所以火焰/灯芯一律用 PROP.hotOf 在自己的色相里提到 hot，
  // 绝不往奶油白混（那是 §52 的病灶：紫火把照出一滩米灰）。
  const VIOHOT = P.hotOf(VIO), BLUHOT = P.hotOf(BLU), GRNHOT = P.hotOf(GRN);

  // ============================================================ 场景-local 地基
  // ============================================================ L6 · 全片只有**一条**雪况
  // 原来每一场各自传一个常量 k（A1 是 1、A2 是 .85、A6 是 1.3、A11 是 .22……），于是切镜头的
  // 那一拍 k 从 .85 直接跳到 0 —— 用户说的"雪骤停"就是这个跳变（§E / L6）。A3 更是整场没有雪。
  // 现在拆成三件连续的事：
  //   ① snowArc(t)：全片一条弧线。A1 厚雪暴 → 一路渐薄 → A11 之后"雪几乎停了"（§A11）。
  //   ② snowK(t)：一整部片**一条腿**的起/褪（F.snowWeather），镜头切、天气不切。
  //   ③ 风速也连续（snowWind）：§E 要的是"密度、大小、风速都连续变化"。
  const snowArc = t => kf(t, [[B[0], 1], [B[2], .93], [B[4], .85], [B[6], .72], [B[8], .56], [B[9], .46],
    [B[10], .3], [B[11], .21], [B[12], .13], [B[13], .05]]);
  const snowWind = t => kf(t, [[B[0], -78], [B[1], -62], [B[3], -46], [B[5], -26], [B[6], -30], [B[8], -58],
    [B[9], -36], [B[11], -18], [B[13], -8]]);
  // 一场雪的连续 k。**任何 F.snowfall 都不许再传常量。**
  // 刻意**不按镜头分段**：镜头可以切，天气不能切。整部片一条腿 —— 开场 3.5 秒起雪（iris 打开在
  // 风暴里），322 秒起用 8 秒褪干净（最后三秒只剩三个点），中间完全由 snowArc 决定厚薄。
  // 按镜头分腿会留下一个洞：本场褪到 0 的那一拍正好是下一场的第 0 帧，全片十三次"骤停"。
  function snowK(t, o = {}) {
    return F.snowWeather(t, B[0], 322, 8, 1) * snowArc(t) * (o.peak === undefined ? 1 : o.peak);
  }
  // L4：一条**永远铺满画面**的低空带。F.skyBand / F.haze 的椭圆是固定世界尺寸（rx 1500），
  // 镜头一拉到 zoom<.65（A10 的航拍、A13 的结尾拉远）椭圆的两个端点就落进画面里，
  // 压在纸色底上读成一条**撕破的黄带子**（P1#9）。这里按当前镜头的可见宽度画，
  // 并且只用几条横带叠出竖向过渡 —— 左右没有任何端点可以破。
  function wideBand(y, w, h, col, a) {
    const cam = CAM || { cx: W * .5, zoom: 1 };
    const hw = Math.max(w, (W * .5) / cam.zoom + 420), x0 = cam.cx - hw;
    boilSeed('f.wband');
    for (let i = 0; i < 5; i++) {
      const q = (i - 2) / 2, hh = h * (1 - Math.abs(q) * .34);
      paint(rectPts(x0, y + q * h * .74 - hh * .5, hw * 2, hh), { wash: col, washOp: 255 * a * (1 - Math.abs(q) * .58), ink: null });
    }
  }
  // 地平线那口"雪原还在往前延伸"的亮气（haze 的无端点版）
  const wideHaze = (gy, k, col = F.snowSh) => wideBand(gy - 8, 1500, 74, col, .085 * k);
  // L4：A13 要"整个夜空第一次完整出现"。F.stars 的星永远撒在 x 0..1920 里 —— 镜头拉到 .34
  // （一屏 5600px）时星只占中间一条，两边是空的天空。这里撒在一段**固定的世界宽度**上
  // （不是跟着镜头，否则拉远时星会游泳），覆盖到 zoom .30 为止。
  function wideStars(n, y0, y1, col = '#C9D6EC') {
    for (let i = 0; i < n; i++) {
      boilSeed('ws' + i);
      const a = .45 + .55 * Math.sin(T * (.8 + hash(i + 3)) + i * 2.3);
      paint(ellPts(-2600 + hash(i + 40) * 7100, y0 + hash(i + 9) * (y1 - y0), 1.6 + 2 * a, 1.6 + 2 * a, 6), { wash: col, washOp: 105 + 125 * a, ink: null });
    }
  }

  // 一串**踩在拍子上**的脚印（P1#1 / **L5**）。每一拍落一只脚，所以坑就钉在他那一拍站过的那个 x 上。
  // L5 三条：① 卡拍（tb 就是鼓点）② 拖在**身后**（坑在世界坐标里，他往前走）
  // ③ 被落雪**逐渐填平**：a 随年龄褪到 0，同时坑里的雪面从坑底长起来，填满即消失。
  // 病根：原来一只坑只拿到 u*.92 ≈ 22 的"参照单位" → 实际 5px 宽，缩略图和全分辨率都等于没有。
  // 现在 o.s 直接给脚印单位尺寸（默认 2.9u ≈ 一只 32px 长、14px 宽的爪坑，zoom 1 也读得出）。
  function beatTrail(t, t0, t1, x0, x1, gy, u, o = {}) {
    const b0 = Math.ceil(bpOf(t0)), b1 = Math.floor(bpOf(t)), keep = o.keep || 22;
    const s = u * (o.s === undefined ? 3.3 : o.s), life = o.life || 7;
    const xs = b => lerp(x0, x1, ease(seg(OFF + b * BEAT, t0, t1)));
    for (let b = Math.max(b0 - (o.pre || 0), b1 - keep); b <= b1; b++) {
      const tb = OFF + b * BEAT;
      // 起步/停步那几拍步距很小，别把坑叠成一坨（真实走路本来就是这样）
      if (b >= b0 && Math.abs(xs(b) - xs(b - 1)) < s * .34) continue;
      const a = clamp(o.fade === undefined ? 1 : o.fade) * clamp(1 - (t - tb) / life);
      if (a < .05) continue;
      // o.pre：开场**之前**他就一直在走，所以画外那一段也要有一串脚印（否则开场特写里是空雪）
      const px = b >= b0 ? xs(b) : x0 - (b0 - b) * (o.stride || u * 1.5);
      // 两轨交替（第十四轮）：左脚=近轨（更大、更低），右脚=远轨（更小、更高）。
      // 原来 ±u*.05 = 1px 的抖动等于没有，一串坑就退化成一条虚线。
      const near = (b & 1) === 0, sp = s * (near ? 1.06 : .82);
      const py = gy + (near ? u * .1 : -u * .22);
      P.footprints(px, py, 1, 0, sp, { dir: 1, fade: a * .85 });
      // 坑底的阴影。L5 的另一半病根：PROP.footprints 的"影子"用的是 C.snowSh=#9FB2CE ——
      // 那是照检查表的**亮纸**调的，压过夜色之后它比地面还亮，于是一串脚印读起来是一排白点。
      // 所以坑必须自己带一块深色；"被落雪填平"就是这块深色一寸寸缩小、中间鼓起一小片新雪。
      const f = clamp((t - tb) / life) * (.55 + .45 * snowArc(t));        // 0=刚踩下，1=填平
      const open = clamp(1 - f * .8);
      if (open > .05) {
        boilSeed('fpd' + b);
        paint(ellPts(px, py + sp * .014, sp * .185 * open, sp * .075 * open, 11, 0, .2),
          { wash: mixCol(F.snowDeep, F.INK, .52), washOp: 240 * a * open, ink: null });
      }
      // 填平=坑**心**先鼓起一小片新雪，坑沿的暗色要留到最后。原来亮片画到坑那么大，
      // 一串旧脚印于是读成一排气泡（第十四轮）。
      if (f > .22 && f < .95) {
        boilSeed('fpf' + b);
        paint(ellPts(px - sp * .02, py - sp * .008, sp * .085 * f, sp * .03 * f, 10, 0, .2),
          { wash: F.snowLit, washOp: 88 * a * f, ink: null });
      }
    }
  }
  // 一排**静态**的旧脚印（A6/A7/A9："之前有人走过"，不是这一拍踩的）。补深色坑底的道理同上。
  function printRow(x0, gy, n, step, u, o = {}) {
    const dir = o.dir || 1, a = clamp(o.fade === undefined ? 1 : o.fade);
    P.footprints(x0, gy, n, step, u, { dir, fade: a * .85 });
    for (let i = 0; i < n; i++) {
      const k = a * (1 - i / n * .8); if (k < .05) continue;
      boilSeed('prd' + Math.round(x0) + '_' + i);
      const px = x0 + dir * i * step, py = gy + (i % 2 ? -u * .04 : u * .04);
      paint(ellPts(px, py + u * .014, u * .185, u * .075, 11, 0, dir * .2), { wash: mixCol(F.snowDeep, F.INK, .52), washOp: 235 * k, ink: null });
    }
  }
  // 一条**分段走路脚本**：legs = [[t0,t1,x1,style],...]，每一段用 FILM.walkTo 生成位移与步态。
  // P1#6/P1#7 的病根是"位置由 kf 管、步态由另一套时钟管"，两套一不同步就是漂浮。
  // 这里位置和步态**同源**，所以脚永远踩在拍子上、也永远踩在他真正走过的那一点。
  function walkChain(t, legs, x0, u, view = 'side') {
    let x = x0, out = { x, view: 'front', flip: false, walk: null, dy: 0, moving: false, ph: 0 };
    let from = x0;
    for (let i = 0; i < legs.length; i++) {
      const [t0, t1, nx, style] = legs[i];
      const w = F.walkTo(t, t0, t1, from, nx, u, style || 'walk', view);
      out = { x: w.x, view: w.view, flip: w.flip, walk: w.walk, dy: w.dy, moving: t > t0 && t < t1, ph: i };
      if (t < t1) { from = nx; return out; }
      from = nx;
    }
    return out;
  }
  // 树桩必须和**被砍的那棵树**咬合（P1#4④："桩子的比例一会儿大一会儿小"）。
  // PROP.giantTree 根部干宽 = PX(m)*.13*1.35*2 = .351·PX(m)。桩子取"高 = 半个宽"，
  // 于是 ms = .1755·m、wide = 1.0 —— 一个公式，A4 与 A11 共用，两场的桩子互相对得上。
  const giantHalf = m => P.PX(m) * .13 * 1.35;
  // 第十七轮 7：用户要"树墩和 clawd 差不多大"。原来的咬合公式给 7.4 的树配 ms=1.30 的桩
  // （≈218px，是一个 Clawd 的 1.3 倍），A6 那根更是 1.71 —— 全片的桩都成了"三个人抱不过来"。
  // 加一道**全局封顶**：任何桩都不许超过一个 Clawd 高。咬合公式本身保留，
  // 所以同一棵树留下的桩仍然互相对得上，只是整体不再越砍越大。
  // PROP.stump 的 `m` 是**高度**（PX(m)=m·168），而宽度 = 高 × wide —— wide 给 1.0 时
  // 一个"和一个 Clawd 等高"的桩其实有 336px 宽，是主角身高的两倍，看上去仍然巨大。
  // 所以封顶要同时管住高和宽：h≈104（到 clawd 胸口）、总宽≈166（正好一个 clawd 高）。
  const STUMP_CAP = .62, STUMP_WIDE = .8;
  const stumpOf = m => [Math.min(m * .1755, STUMP_CAP), STUMP_WIDE];
  const stumpOfTree = (x, gy, m, o = {}) => { const [ms, wd] = stumpOf(m); P.stump(x, gy, ms, { wide: wd, snow: true, seed: o.seed ?? 0 }); };
  // 拖在雪地上的袋子：第十七轮 5 —— 原来只是**斜靠**（rot .3 弧度）立着的袋子，
  // 用户判为"正对着像只罐子"。真正被拖着的麻袋是**横躺**在雪上、袋口朝前被绳子拽着，
  // 身后拖出两道雪沟。只有圣诞老人的礼物堆才允许竖着放。
  function dragSack(x, gy, u, dir, t, o = {}) {
    boilSeed('drag');
    const k = o.k || .9, sx = x - dir * u * 3.4, sway = .05 * Math.sin(bpOf(t) * Math.PI);
    paint(ellPts(lerp(x, sx, .45), gy + u * .30, u * 2.6, u * .24, 14, u * .02), { fill: F.snowDeep, fillOp: 80, bleed: .22, tex: .5, ink: null });
    P.sack(sx, gy + u * .1, u * k, { big: true, pool: false, rot: dir * (1.44 + sway), drag: .7 });
    // 绳子从**躺倒的袋口**拉到他的手上。PROP.sack 躺着时袋口在局部 (L*.60, -H*.31)，
    // L = h*.94、H = w = s*5.0、h = s*6.5 —— 换算法就会把绳子拴到空气里去。
    const hh = u * k * 6.5, mouth = sx + dir * hh * .94 * .60, my = gy - u * k * 5.0 * .31;
    inkLine([[mouth, my], [(mouth + x) / 2, my - u * .6], [x - dir * u * .4, gy - u * 4.4]], P.swOf(u * .3), C.rope, 'inkfine', .3);
  }
  // 第十八轮 R18-1：**没有对话框的喊声**。抢劫那一段光靠画面看不懂"谁在抢谁"，
  // 所以喊话必须是**字**而不是气泡 —— 白、大、抖、出现一拍就化掉。
  // 判据（R18-3）：只有"这一段的核心信息是**谁对谁喊了什么**"时才允许用；
  // 靠动作就能讲清楚的地方一律不加。全片目前只在这里用两次。
  function shout(txt, x, y, size, age, o = {}) {
    if (age < 0 || age > (o.life ?? 1.5)) return;
    const k = clamp(age / .16);                                  // 一拍的爆发，不是淡入
    sfx(txt, x, y + Math.sin(age * 9) * size * .03, size * (.72 + .28 * backOut(k)),
      o.col || '#F4F8FF', age, {
        life: o.life ?? 1.5, rot: (o.rot ?? -.05) + Math.sin(age * 17) * .035,
        alpha: 1 - seg(age, (o.life ?? 1.5) - .3, o.life ?? 1.5), stroke: o.stroke || '#0B1024',
      });
  }
  // §71 P1#2 / 第十七轮 1 —— "一伙人"，不是三个工种凑一桌。
  // 上一版的做法是"同色身体 + 同一件肩披 + 同一条围巾，但帽子留给各自的职业模板"，
  // 用户看完仍然说"盗贼团仍然是三个职业的人混在一起"。**帽子恰恰是工种最响的信号**，
  // 留着貂皮高帽和皮安全帽，就等于把三个职业团请回来站成一排。
  // 所以：三顶帽子一律同一款（在 A2/A5 用同一个 job），差异只留** gang 内部的记号**——
  // 围巾的结、帽带上的一点东西。观众要能分辨"老大/跟班/打手"，但不能读出"这是樵夫"。
  const GANG = { col: dim('#6A6480', .34), dk: dim('#3E3A52', .22), lt: dim('#8C86A2', .4) };
  function gangKit(u, sw, wind = .3, mark = 0) {
    boilSeed('gangkit');
    const cloak = dim('#4A4460', .32), cloakDk = dim('#2A2740', .2);
    for (const d of [-1, 1]) paint([[d * 2.9 * u, -7.7 * u], [d * 5.25 * u, -7.4 * u], [d * 4.75 * u, -3.1 * u], [d * 2.7 * u, -3.6 * u]],
      { wash: cloak, fill: cloakDk, fillOp: 50, bleed: .14, tex: .75, border: .5, ink: PAL.ink, sw: sw * .85, curv: .3 });
    paint(rrPts(-5.1 * u, -8.3 * u, 10.2 * u, 1.55 * u, u * .32, u * .05), { wash: cloak, fill: cloakDk, fillOp: 58, bleed: .12, tex: .7, border: .45, ink: PAL.ink, sw, curv: .22 });
    inkLine([[-3.4 * u, -7.5 * u], [0, -6.5 * u], [3.4 * u, -7.5 * u]], sw * .6, cloakDk, 'inkfine', .3);
    PROP.scarf(u, { wind, col: [dim('#5C3A50', .3), dim('#4A3B58', .3), dim('#563C38', .3)][mark % 3] });
    // 帽带上的记号：老大插一根歪羽毛，跟班别一枚铜片，打手是一道砸出来的凹痕
    if (mark % 3 === 0) { for (const q of [.55, .8, 1.05]) inkLine([[1.1 * u, -9.0 * u], [(1.1 + q * 1.5) * u, (-9.0 - q * 1.5) * u]], sw * .5, dim('#8E7A5E', .34), 'inkfine', .4); }
    else if (mark % 3 === 1) paint(ellPts(-1.5 * u, -9.0 * u, .52 * u, .52 * u, 10), { wash: dim('#A88C4E', .42), fill: dim('#6E5A2E', .3), fillOp: 70, ink: PAL.ink, sw: sw * .5 });
    else for (const q of [-.2, .1, .4]) inkLine([[(q - .3) * u, -9.2 * u], [(q + .3) * u, -8.7 * u]], sw * .55, cloakDk, 'inkfine', .25);
  }
  // 手臂尖的世界坐标 = clawd() 里 arm() 那个变换的逆变换。
  // P1#2 的病根：火把塞在 armR 钩子里，于是被后面画的角色盖掉一半，"光"也跟着被盖掉。
  // 把光源从角色身上解出来、画在所有角色之上，它才真的压得住整幅画。
  function handPt(x, gy, u, a, side = 1, o = {}) {
    const c = clamp((Math.abs(a) - .7) / .9);
    const lx = side > 0 ? (5 + .55 * c) * u + 2.2 * u * Math.cos(a) : -((4.7 + .55 * c) * u + 2.2 * u * Math.cos(a));
    const ly = -4.5 * u - 2.2 * u * Math.sin(a);
    const px = o.flip ? -lx : lx, py = ly + (o.dy || 0) * u, r = o.rot || 0;
    return [x + px * Math.cos(r) - py * Math.sin(r), gy + px * Math.sin(r) + py * Math.cos(r)];
  }
  // 一车**横躺的红色杆烛**（P1#3d：原来的 PROP.cart 画的是四支竖着的白蜡，读起来像一截栅栏，
  // 完全看不出"这是一车蜡烛"）。这里借 PROP.cart 的车斗与轮子（**关掉它自带的那盏高杆灯**——
  // 那根杆在村里就是一盏路灯，P1#3g 明令禁止），再在车斗上码四层横放的红色杆烛，
  // 每支都露出一节切口的白蜡头 —— 一眼读出"一整横车蜡烛"。
  function candleCart(x, gy, m, col, t) {
    const h = m * P.HERO, sw = P.swOf(h * .3);
    P.cart(x, gy, m, { lantern: 0, pool: false });
    const RED = dim(C.red, .42), REDLT = dim('#E0607A', .48), WAX = dim(C.wax, .52);
    // 第十七轮 6：蜡烛原来是 4 排**整齐横躺**的红杆（7/6/4/3 根）—— 读作码好的木材，
    // 不是"一堆蜡烛"，而且每根都有 h*.30 长，显得又高又挺。
    // 改成**乱堆**：长短不一、角度乱、互相压着，越往上越少，最上面几支还在往下滚。
    for (let i = 0; i < 27; i++) {
      boilSeed('stk' + i);
      const q = i / 27;
      const px = x - h * .04 + (hash(i) - .5) * h * .78 * (1 - q * .3);
      const py = gy - h * (.545 + q * .27) + (hash(i + 5) - .5) * h * .055;
      const L = h * (.13 + .075 * hash(i + 3)), th = h * .068;
      const tilt = (hash(i + 11) - .5) * 1.15;
      paint(rrPts(px - L / 2, py - th / 2, L, th, th * .46, th * .06),
        { wash: i % 2 ? RED : REDLT, fill: C.wine, fillOp: 46, bleed: .1, tex: .6, border: .4, ink: PAL.ink, sw: sw * .5, curv: .18 });
      paint(ellPts(px + L / 2 - th * .26, py, th * .28, th * .42, 8), { wash: WAX, ink: PAL.ink, sw: sw * .26 });
      inkLine([[px - L * .28, py - th * .1], [px + L * .16, py - th * .16]], sw * .2, mixCol(RED, '#FFFFFF', .45), 'inkfine', 0);
    }
    // 价签写在车帮上。用户："最好在蜡烛车的车板上写着 $99 FOR ONE CANDLE，一行写不下可以分两行，
    // 但**不要拆单词**"。所以断行是 `$99 FOR ONE` / `CANDLE` —— 而不是把 CANDLE 切开。
    // 注意：letter() 是画在最上层的合成层，会被前面的人物压不住；
    // 本场已经按第 6 条把车挪到**远离村民的一侧**，所以不会有人挡在它前面。
    paint(rrPts(x - h * .30, gy - h * .40, h * .60, h * .20, h * .02, h * .006),
      { wash: dim('#C9B896', .46), fill: C.woodDk, fillOp: 40, bleed: .1, tex: .7, border: .5, ink: PAL.ink, sw: sw * .5, curv: .12 });
    letter('$99 FOR ONE', x, gy - h * .335, h * .085, dim('#3A2A22', .28), { align: 'center', ink: false });
    letter('CANDLE', x, gy - h * .255, h * .085, dim('#8E2E34', .34), { align: 'center', ink: false });
    // 斗沿外斜出来的一支 + 车帮前面挂着一盏**没有杆**的小蓝灯（光源属于这个摊子，不属于市政）
    boilSeed('stk-out');
    paint(rrPts(x + h * .34, gy - h * .58, h * .22, h * .068, h * .03, h * .006),
      { wash: RED, fill: C.wine, fillOp: 45, bleed: .1, tex: .6, ink: PAL.ink, sw: sw * .5, curv: .3 });
    P.lantern(x - h * .52, gy - h * .1, h * .26, { col, pool: false });
  }
  // 村民的"穷"与"冷"：一律灰扑扑的素麻，不许有颜色（P1#3f）。
  const POOR = { col: dim('#8A8296', .3), dk: dim('#565068', .2), lt: dim('#A29AAC', .36) };
  // 冷月：一块淡盘 + 一条缓缓盖过去的流云（A1 整场只遮露一次）
  function moon(x, y, r, cloudK = 0, col = '#D7E2F2') {
    boilSeed('moon');
    const c = dim(col, EDGE);
    paint(ellPts(x, y, r, r, 20, r * .03), { wash: c, washOp: 200, ink: null });
    paint(ellPts(x - r * .24, y - r * .2, r * .28, r * .28, 12), { wash: mixCol(c, '#20264A', .35), washOp: 90, ink: null });
    if (cloudK > .01) {                              // 云从右往左盖过来，盖满再退
      const w = r * 5.2, cx = x + lerp(w * .85, -w * .85, clamp(cloudK));
      paint(ellPts(cx, y + r * .12, w * .5, r * .66, 16, r * .05), { wash: mixCol(F.SKYLO, F.SKY, .3), washOp: 225, ink: null });
    }
  }
  // 地平林线：一律走剪影版（PROP.firSil）。一棵 2 条路径，一排在 30 条以内。
  function treeline(x0, gy, n, m, o = {}) {
    P.firBand(x0, gy, n, m, {
      span: o.span || 3400, rows: o.rows || 2, snowK: o.snowK === undefined ? .4 : o.snowK,
      tone: o.tone || mixCol(C.sapDk, F.SKY, .6), bare: o.bare, cheap: true,
    });
  }
  // 地平线那一排远杉的**镜头感知版**：位置钉死在一张世界网格上（i 的纯函数），只画当前镜头
  // 看得见的那几棵。A11→A12→A13 是一镜到底：三场必须看到**同一片**林子，而拉到 zoom .34 时
  // 固定 2400px 的一排又铺不满 5600px 宽的地平线（L4/L7）。这样两头都不破，也不浪费笔数。
  function farFirs(gy, m, o = {}) {
    const cam = CAM || { cx: W * .5, zoom: 1 }, st = o.step || 260;
    const hw = (W * .5) / cam.zoom + 400;
    for (let i = Math.floor((cam.cx - hw) / st); i <= Math.ceil((cam.cx + hw) / st); i++) {
      P.firSil(i * st + (hash(i * 7.3) - .5) * st * .7, gy + (hash(i * 3.1) - .5) * 14,
        m * (.72 + .5 * hash(i * 5.7)), { snowK: o.snowK === undefined ? .5 : o.snowK, col: o.tone });
    }
  }
  // 一道断断续续的废弃栅栏（A1/A2 中景层）：有断口，路是废弃的
  function fence(x0, gy, n, step_, o = {}) {
    for (let i = 0; i < n; i++) {
      boilSeed('fnc' + i);
      if (hash(i + 11) < .2) continue;
      const px = x0 + i * step_ * (.82 + .4 * hash(i)), tilt = (hash(i + 5) - .5) * .3, h = (o.h || 86) * (.85 + .3 * hash(i + 2));
      inkLine([[px, gy], [px + tilt * h, gy - h]], P.swOf(h * .13), o.col || dim('#5E5468', .34), 'ink', .2);
      if (o.snow !== false) paint(ellPts(px + tilt * h, gy - h, 13, 5, 9, 1), { wash: F.snowLit, ink: null });
    }
    if (o.rail) inkLine([[x0, gy - (o.h || 86) * .55], [x0 + n * step_ * .9, gy - (o.h || 86) * .48]], 2.4, o.col || dim('#5E5468', .34), 'inkfine', .4);
  }
  // 雪岩：被风磨圆的边 + 一顶积雪（A2 的掩体）；o.snowFall 时刻那顶雪扑地滑下来
  function rock(x, gy, w, h, o = {}) {
    boilSeed('rk' + Math.round(x));
    paint(P.blob(x, gy - h * .34, w * .5, h * .64, 5, .12, 20, .74, .6),
      { wash: F.rock, fill: mixCol(F.rock, F.INK, .4), fillOp: 62, bleed: .14, tex: .7, border: .45, ink: mixCol(F.INK, F.SKY, .3), sw: 1.1 });
    // 雪帽不能是一只**盘子**：原来是一个 12 顶点的完美椭圆（212px 宽 × 20px 高），
    // 于是读作漂浮在石头上的白碟/UFO（第十六轮复验）。雪是**盖**在岩顶上的：
    // 边缘跟着岩顶起伏、下缘不规则（化了又冻）、有两三处从侧面挂下去。
    // 第二十轮 R20-4：**上一版改过头了**。`blob` 的第 5、6 个参数是 lobes 和 bump，
    // 给它 9 个鼓包、±34% 起伏，而这只帽子总共只有 23px 高 —— 于是每个鼓包都是一个
    // 看得见的尖角，成片里是"四五个白色星星浮在石头上空"（f00480 裁切所见）。
    // 雪是**软**的：鼓包要少、起伏要小，而且必须**咬进岩顶**（下缘低于岩石的 topK 顶面）。
    // 岩石：top = cy - ry*topK = gy-.34h-.64h*.74 = gy-.814h。帽子中心 gy-.86h、ry=.16h
    // → 下缘 gy-.70h，压进岩顶 .11h。
    paint(P.blob(x - w * .04, gy - h * .86, w * .33, h * .16, 4, .11, 26, .88, x * .07),
      { wash: F.snowLit, fill: C.snowLt, fillOp: 72, bleed: .1, tex: .55, border: .35, ink: null, curv: .45 });
    for (const [dx, dw, dh] of [[-.26, .075, .17], [.09, .055, .12], [.24, .065, .21]])
      paint(P.blob(x + w * dx, gy - h * .80, w * dw, h * dh, 3, .10, 16, .92, dx * 40),
        { wash: F.snow, fill: C.snowLt, fillOp: 58, bleed: .1, tex: .6, border: .3, ink: null, curv: .45 });
    if (o.snowFall) EV.snowCrash(o.snowFall, x + w * .12, gy - h * .1, w * .13, { y0: h * .82 });
  }
  // ============================================================================
  // 第二十四轮 R24-1：三次"偷看"的统一语法（紫 / 蓝 / 绿）。
  // 用户的方案是讨镜头的巧：**深色掩体围出一个中央空缺，clawd 的背影从画面下沿探进空缺
  // （不露腿），空缺深处是那团把他吸过来的光**；镜头推向空缺，掩体滑出画面，就进了坏蛋现场。
  // 三个收益：① "偷看"终于演得出来；② 坏蛋现场里 clawd 根本不出镜，第十七轮那一整类
  // 朝向/遮挡问题随之消失；③ "光不能穿出缺口"不需要真做布尔挖洞 —— **光先画、掩体后画**，
  // 遮挡关系是绘制顺序保证的。
  // 掩体的尺寸必须是**固定世界坐标**，不能每帧按 camRect 算 —— 否则镜头推进时掩体会跟着
  // 视野一起长大，永远推不出去。每一块都"贴住缺口的一条边、然后向外延伸到远超画面"。
  const PEEK_STYLE = {
    rock: { col: '#141625', lobes: 5, bump: .09 },     // 两块巨岩夹一道竖缝（A2 盗贼）
    bush: { col: '#11151E', lobes: 5, bump: .17 },     // 一丛类圆灌木围一个圆洞（A3 奸商）
    log: { col: '#151924', lobes: 5, bump: .11 },      // 倒木压上、雪堆压下 = 一条横缝（A4 樵夫）
  };
  const PEEK_REACH = 3000;                             // 向外延伸量：任何机位下都不会露出掩体的外沿
  // 掩体的做法（第一版按"半径够大"猜，结果掩体和夜空几乎同值，缺口根本读不出来）：
  // ① 先用**四块矩形把画面精确铺满、只留中央一个洞** —— 左/右两条通到上下边界，
  //    上/下两条只填左右两条之间的空档。这是一个**不重不漏的划分**，所以"有没有盖住"
  //    不再靠估算。② 再沿洞的四条边按风格压上轮廓块（岩=有棱角、灌木=类圆、倒木=横长），
  //    这层只负责"像什么"，不负责遮挡。
  // ③ 掩体必须**比夜空更黑**，否则缺口读不出来；用户要的就是"有轮廓 + 深色配色"。
  function peekCover(gapX, gapY, gw, gh, style, fr) {
    const S = PEEK_STYLE[style] || PEEK_STYLE.rock;
    const dark = mixCol(S.col, '#000000', .55);
    const L = fr[0], T = fr[1], R = fr[0] + fr[2], Bo = fr[1] + fr[3], M = 900;
    const gl = gapX - gw * .5, gr = gapX + gw * .5, gt = gapY - gh * .5, gb = gapY + gh * .5;
    const slab = (x0, y0, x1, y1, sd) => { boilSeed('pks' + sd);
      // R27-1b：这四块是**剪影**，不是纸上的颜料 —— 要的是"完全不透明"。
      // 原来写 `fillOp: 255` 看着就是实心，但同时给了 `tex: .45`：p5.brush 的
      // fillTexture(amount, border) 是**在填充里挖空洞**，于是底下那层雪地一格一格透上来，
      // 用户一眼指出"完全可以看见穿帮的雪地"（t=19 整片气泡状花斑）。
      // 遮挡层一律 tex / border / bleed = 0；"像什么"交给下面那圈轮廓块去做。
      paint(rectPts(x0, y0, x1 - x0, y1 - y0, 6, 2),
        { wash: dark, fill: dark, fillOp: 255, bleed: 0, tex: 0, border: 0, ink: null }); };
    slab(L - M, T - M, gl, Bo + M, 1); slab(gr, T - M, R + M, Bo + M, 2);
    slab(gl, T - M, gr, gt, 3); slab(gl, gb, gr, Bo + M, 4);
    // 沿缺口边的轮廓块：只往洞**外**长，不侵入洞内（否则"光穿出缺口"的遮挡就破了）
    // R27-1b：和四块挡板同一个病 —— `tex` 会在填充里挖洞，这些块又正好骑在缺口边上，
    // 于是"岩缝"是半透明的，能看见后面的雪地和天。轮廓靠**形状**给，不靠纹理。
    const edge = (x, y, rx, ry, lobes, bump, sd) => { boilSeed('pke' + sd);
      paint(P.blob(x, y, rx, ry, lobes, bump, 20, 1, sd),
        { wash: dark, fill: dark, fillOp: 255, bleed: 0, tex: 0, border: 0, ink: null, curv: .45 }); };
    // 沿缺口边的轮廓块必须**骑在边界上**，不能全长在洞外：
    // 上一版放在 `gw*.5 + rx*.55`（完全在洞外），四块矩形掩体的内沿就是**尺规直边** ——
    // 本档 §57 的老规矩：数得出直边，观众就读成"贴了一块板"而不是"岩缝"。
    // 但也不能咬进太多：第二十四轮第一版把灌木放在洞内 18%，16 颗直接把 430×400 的洞
    // 几乎堵死，A3 的偷看拍变成"一片黑里有个小亮点"。所以**每种掩体给自己的咬合深度**。
    // ⚠ R27-1b 之后这些数必须**重新校准**：挡板变成全不透明以后，轮廓块不再靠半透明"糊"在
    // 边界上，而是**实打实地把洞堵掉**。原来 rock 的 -.18 是在"块本身能透过去看见洞"的前提
    // 下调出来的，洞因此被 13 颗石头咬成了一条细缝（t=16 复核所见）。现在一律收到贴边为止。
    const cfg = style === 'bush' ? { n: 12, rx: .21, ry: .19, bite: .01 }
      : style === 'rock' ? { n: 13, rx: .17, ry: .10, bite: -.045 }
        : { n: 8, rx: .20, ry: .09, bite: -.03 };
    for (let i = 0; i < cfg.n; i++) {
      const a = i / cfg.n * Math.PI * 2 + .37;
      const ex = Math.cos(a), ey = Math.sin(a);
      const rx = gw * (cfg.rx + .09 * hash(i * 2.3)), ry = gh * (cfg.ry + .07 * hash(i * 4.1));
      edge(gapX + ex * (gw * .5 + rx * cfg.bite * 5), gapY + ey * (gh * .5 + ry * cfg.bite * 5), rx, ry,
        S.lobes, S.bump, 20 + i);
    }
    if (style === 'log') {                             // 倒木：洞的上沿压一根横长的树干
      edge(gapX, gt - gh * .16, gw * .92, gh * .13, 5, .07, 71);
      edge(gapX - gw * .30, gt - gh * .34, gw * .52, gh * .10, 4, .06, 73);
    }
  }
  // 一整拍"偷看"：远景 + 缺口里的光 + 掩体 + 探头的背影。
  // **顺序就是遮挡**：光先画、掩体后画，所以光被缺口裁住，绝不会穿出掩体。
  function peekBeat(t, lt, PEEK, o) {
    const q = ease(seg(lt, PEEK * .30, PEEK));          // 推向空缺
    const z = lerp(1, 2.2, q);
    // 缺口本身也跟着"让开"：掩体的划分锚在**起始机位**的画面上，缺口在世界坐标里长大，
    // 于是镜头推进时读起来就是"从缝里挤进去"，而不是"一块黑板往前压"。
    const gw = o.gw * (1 + 2.5 * q), gh = o.gh * (1 + 1.6 * q);
    const fr = [o.x - 960, o.y - 540, 1920, 1080];      // z=1 时的画面矩形（掩体按它铺，不随镜头变）
    camBegin(o.x, o.y, z, 0);
    F.sky(mixCol(F.SKY, o.col, .07));
    F.skyBand(200, 1080, 130, mixCol(F.SKYLO, o.col, .14), .7);
    F.stars(4, 60, 210);
    treeline(o.x - 900, o.y + o.gh * .42, 9, E.fir * .34, { span: 3400, rows: 1, snowK: .22 });
    F.ground(o.y + o.gh * .48, F.snow, F.snowSh, { horizon: o.y + o.gh * .40, top: 40, lit: false });
    F.grade(.66);
    // 吸引他的那团光：要大、要亮（用户："要亮一点，大一点"）。
    // **外圈用饱和色，只有很小的核心才用 hot** —— 三层全用 hot（近白）时紫光读成"一盏白灯"，
    // 观众分不清紫/蓝/绿，而这三种颜色正是用户点名要用来区分三个坏蛋片段的。
    P.lightPatch(o.x, o.y + o.gh * .26, o.gh * (1.9 + .8 * q), o.col, .95);
    P.airGlow(o.x, o.y - o.gh * .06, o.gh * (1.15 + .5 * q), mixCol(o.col, o.hot, .42), 1.35);
    P.halo(o.x, o.y - o.gh * .12, o.gh * (.78 + .30 * q), mixCol(o.col, o.hot, .55), 1.15);
    P.halo(o.x, o.y - o.gh * .12, o.gh * .26, o.hot, 1.0);
    peekCover(o.x, o.y, gw, gh, o.style, fr);
    // 背影探头：u 按**画面高度**给（不是按缺口给），脚落在视野下沿之外 → 只到肩，看不见腿。
    // 身体顶 = cb - 8u 放在画面 63% 高处，于是露出约 24% 画高的后背与后脑。
    // R27-1a：这里的 vh **不能**跟着镜头变。原来写 `vh = 1080 / z`，尺寸和落点都按当前视野算，
    // 于是他永远是画面的同一个比例 —— 镜头推到 2.2× 他还是那么大，读起来像贴纸。
    // 他是一个**站在世界里的东西**：尺寸和脚点冻在 z=1 的那一把尺上，镜头推进时画面上抬，
    // 先裁掉腿、再裁掉肩，最后整个人出画 —— 只剩空隙里的画面。这才是视角逻辑。
    const cu = 1080 * .037, cb = o.y + 1080 * .516;
    F.hero(o.x - gw * .10, cb, cu, t, {
      view: 'back', cold: 1, light: .0, gloom: .5, boilKey: 'peek' + o.style,
      eyes: 'closed', mouth: null, aL: -.22, aR: -.22, sq: .05 + .05 * Math.sin(t * 1.6),
      dy: -Math.abs(Math.sin(bpOf(t) * Math.PI)) * .10,
    });
    F.snowfall(t, 22, .5, -10);
    camEnd();
    // 开场从黑里**浮出来**（上一场的收尾是黑的），而不是把整拍压黑 ——
    // 写成 `1 - seg(lt, PEEK-.55, PEEK)` 会在偷看的绝大部分时间里输出 dip=1，即全黑 5 秒。
    F.dip(1 - clamp(seg(lt, 0, .85)));
  }
  // 一道村口的矮雪墙（A3 的掩体）。和 rock 一样画两遍：地形一遍、近景唇口一遍，角色才真的躲在后面。
  function wall(x, gy, w, h, col) {
    boilSeed('wall' + Math.round(x));
    paint(rrPts(x - w / 2, gy - h, w, h, 8, 3), { wash: col || dim('#4A4458', .3), fill: mixCol(col || F.rock, F.INK, .4), fillOp: 60, bleed: .12, tex: .6, border: .45, ink: mixCol(F.INK, F.SKY, .3), sw: 1 });
    paint(ellPts(x, gy - h, w * .52, 9, 14, 2), { wash: F.snowLit, fill: C.snowLt, fillOp: 60, bleed: .14, tex: .5, ink: null });
  }
  // 第二十四轮 R24-7：驯鹿的脚印。鹿蹄印能被认出来只靠两件事 —— **偶蹄成对**（两个尖朝前的
  // 小三角）和**左右两列交错**前进。画成一排圆点就是人的脚印或者狗爪印，观众不会读成鹿。
  // 用户要求"不用特别细致，能看出来是鹿的脚印就行"，所以每只蹄只用三笔。
  function deerTrackLine(x0, x1, y, s, k) {
    if (k <= .02) return;
    const n = Math.max(1, Math.round(k * 15));
    for (let i = 0; i < n; i++) {
      boilSeed('dt' + i);
      const px = lerp(x0, x1, i / 15), py = y + Math.sin(i * 1.9) * s * .34;
      const lane = (i % 2 ? 1 : -1) * s * .46;                 // 两列交错：鹿是溜蹄行走
      for (const d of [-1, 1]) {
        const tx = px + d * s * .16, ty = py + lane * .5;
        paint([[tx - s * .115, ty + s * .17], [tx, ty - s * .21], [tx + s * .115, ty + s * .17]],
          { wash: mixCol(F.snowSh, F.INK, .34), fill: mixCol(F.snowSh, F.INK, .52), fillOp: 165,
            bleed: .1, tex: .5, ink: null, curv: .22 });
      }
    }
  }
  // 第二十四轮 R24-10：播种点 + 站位的**共用常量**。A11→A12→A13 是一镜到底，
  // 所以这些点必须三场共用 —— 原来三场各自写死 `holeX = 1010`、`1142`、`1182`、`1330`，
  // 想挪一次要改六处，改漏任何一处都是"镜头没动，东西自己跳了"（L7 第 3 条 / 连续性一级 bug）。
  //   dy 是**正数**：用户要求"种子不要和 clawd 在同一水平线上，往下一点（空间关系上就是
  //   种子在前面、离观众更近），不然会显得拥挤"。原来他的脚在 gy+4、坑的中心在 gy+10，
  //   椭圆顶边 gy-16 —— 整个坑和他的脚叠在同一条线上。52 = 2.5U 之后顶边在 gy+26。
  //   hero 从 1088 挪到 1290：这是特写能不能成立的**关键**。他和坑原来只相距 130 世界像素，
  //   镜头一推近他的身体就变成一堵粉色墙横在画面正中，种子和坑全被挡住；不推近又看不清
  //   种子。间距拉到 332 之后，4.2× 的特写能把"左边的坑 + 右边半个他"同时装下，而他被画面
  //   右缘裁掉一部分 —— 特写里角色被裁边是常态，整只站在中间才是问题。
  const SEED_SPOT = { x: 958, dy: 52, hero: 1290, sack: 1400, stump: 1470 };
  // 特写里**整幅画都在地平线以下**，而 F.ground 是一整块纯色 —— 于是雪原读成一堵灰墙，
  // 所有道具都"飘"在上面。补一条由远到近的明度阶梯（越靠近镜头的雪接的光越多）。
  // 必须**薄**：一层的厚度乘上特写的 zoom 就是它在屏幕上的高度，6 层 × 96px 在 4.2× 下
  // 会画成几条横杠。12 层 × 48px、每层只差 3/255，任何倍率下都是连续的。
  // A11/A12/A13 一镜到底，三场都必须调它 —— 只有一场有的话切点上地面会突然亮一档。
  function snowDepth() {
    for (let i = 0; i < 12; i++) paint(rectPts(-60, 640 + i * 48, W + 120, 52, 4),
      { wash: mixCol(F.snowLit, '#C4D2EE', .3), washOp: 5 + i * 3, ink: null });
  }
  // ============================================================ 第二十五轮 R25-1：褪色毛刺
  // 用户 2026-10-10 给了参考图。第一版我把它做成"往画面上盖黑白条子"，用户直接否了：
  // "一点也不像记忆逐渐模糊，反倒像渲染出了 bug、画质突然崩坏"。
  // 把参考图放大到像素级再看（out/check/ref/bench.png，长凳那块 2× 近邻放大），机制其实很清楚：
  //   · **平的地方是干净的** —— 凳面、天空都是平滑的大色块，只是被压成了几层灰阶；
  //   · **所有破坏都长在"边缘"上** —— 草的弧线变成一排梳齿、物体轮廓断成一截截竖向短刺；
  //   · 那些短刺是**沿 Y 拉长的**，而且往下滴得比往上多。
  // 所以它是「**边缘层 + 竖向拖影 + 高反差**」，跟"盖条子"是两回事：
  // 前者是画面自己烂掉，后者是有人在画面上贴胶带 —— 这就是"像 bug"的来源。
  //
  // ⚠ 关键教训（第一版探针"读不到画布"是**假的**）：p5 会把每个 createGraphics 缓冲都挂成
  //   一个 <canvas> 塞进 DOM，`document.querySelector('canvas')` 拿到的是**某张缓冲**
  //   （所以我们读到一张纸纹，还误判成"WEBGL 读不回来"）。主画布唯一可靠的句柄是
  //   `window.drawingContext.canvas`。用对句柄之后读回完全正常，见 out/check/rb3/。
  //   ⇒ 能做真的位移和真的连续去色，不必再伪造。
  //
  // ⚠ 抖动只能由**帧号**派生（`Math.floor(t*24)`），绝不能用 Math.random()：本渲染器每一帧
  //   都是 t 的纯函数、并行乱序渲，随机数会让同一帧重渲两次长得不一样，断点续渲立刻穿帮。
  // ⚠ 用户红线："那些拉远之后的木墩以及原来的所有东西不能丢了哦" —— 所以 fray 用
  //   `difference` 合成（亮边压暗、暗边提亮，**跟随背景**，不会像贴胶带那样糊住主体），
  //   并且整体权重封顶。
  const GLBS = [];
  function gbuf(i) {
    // ⚠ 不能写成 `[GLB,GLB2,GLB3][i] = n` —— 那是往一个临时数组字面量里赋值，
    //   变量根本没被改，于是**每帧新建三张 1920×1080 缓冲**，立刻泄漏爆掉。
    if (!GLBS[i]) { GLBS[i] = createGraphics(W, H); GLBS[i].pixelDensity(1); }
    return GLBS[i];
  }
  function memGlitch(k, t) {
    if (k <= .01) return;
    const A = gbuf(0), B = gbuf(1), C = gbuf(2);
    const ca = A.drawingContext, cb = B.drawingContext, cc = C.drawingContext;
    const el = window.drawingContext.canvas;
    const fq = Math.floor(t * 24), R = i => hash(fq * .1731 + i * 12.9898);
    // ① 取帧 + **连续**去色（这一步终于不用硬切了）
    // ⚠ 反差不能拉高：参考图是**白天的雪**，本来就亮；我们这一帧是黑夜，同样的 contrast
    //   会把中间调整片压进死黑，毛边就看不见了（第一版就是这样，t=322 黑成一团）。
    //   所以这里只轻轻提一点亮度、反差收着，去色则拉满。
    ca.globalCompositeOperation = 'copy';
    ca.filter = `grayscale(${Math.min(1, k * 1.2).toFixed(3)}) brightness(${(1 + .12 * k).toFixed(3)}) contrast(${(1 + .22 * k).toFixed(3)})`;
    ca.drawImage(el, 0, 0, W, H); ca.filter = 'none';
    // ② 边缘图 = |原图 − 模糊原图|
    // ⚠ blur 半径 = 毛边的"粗细"。2.4px 出来是一圈**柔焦晕影**，参考图的刺是**硬而长**的；
    //    收窄到 1.5px 再把滴距拉长，才从"糊"变成"撕"。
    // ⚠ drawImage 只认**真的 canvas**，传 p5.Graphics 对象会 TypeError，所以要 `.elt`。
    cb.globalCompositeOperation = 'copy'; cb.filter = 'blur(1.5px)';
    cb.drawImage(A.elt, 0, 0); cb.filter = 'none';
    cb.globalCompositeOperation = 'difference'; cb.drawImage(A.elt, 0, 0);
    cb.globalCompositeOperation = 'source-over';
    // ③ 把边缘**沿 Y 拖成毛边**：一上一下交替滴（只往下滴会像"融化"，
    //    参考图是**撕碎**——边缘两侧都起刺）
    cc.globalCompositeOperation = 'copy'; cc.clearRect(0, 0, W, H);
    cc.globalCompositeOperation = 'lighter';
    const nD = 9 + Math.round(13 * k);
    for (let i = 0; i < nD; i++) {
      const step = Math.ceil(i / 2) * (1.6 + 5.0 * k);
      cc.globalAlpha = (.55 - i / nD * .5) * k;
      cc.drawImage(B.elt, 0, i % 2 ? step : -step);
    }
    cc.globalAlpha = 1; cc.globalCompositeOperation = 'source-over';
    // ④ 合成：difference 让毛边**顺着背景走**（浅底上变黑刺、深底上变亮丝），
    //    这正是参考图里"草变成梳齿"的成因，也是它不像贴胶带的原因。
    ca.globalCompositeOperation = 'difference'; ca.globalAlpha = .70 * k;
    ca.drawImage(C.elt, 0, 0); ca.globalAlpha = 1; ca.globalCompositeOperation = 'source-over';
    // ⑤ 少量横向错位（参考图里也有，但很克制）：只切几条窄带、位移量小
    cb.globalCompositeOperation = 'copy'; cb.drawImage(A.elt, 0, 0);
    for (let i = 0; i < 3; i++) {
      if (R(i * 11.3 + .5) > .30 + .45 * k) continue;
      const y = R(i * 13.7) * H, h = 4 + R(i * 17.1) * (10 + 26 * k), dx = (R(i * 19.3) - .5) * 26 * k;
      ca.clearRect(0, y, W, h);
      ca.drawImage(B.elt, 0, y, W, h, dx, y, W, h);
    }
    push(); blendMode(REPLACE); image(A, 0, 0); pop();
  }
  // 一盏下一场的光在地平线上升起（§24 的预叙语法：光先在场，人才走过去）
  function horizonLight(x, y, r, col, k) {
    if (k <= .01) return;
    P.halo(x, y, r * k, col, .8 * k);
    paint(ellPts(x, y, r * .11 * k, r * .11 * k, 10), { wash: mixCol(col, '#FFFFFF', .55), ink: null });
    P.lightPatch(x, y + r * .9, r * 1.4 * k, col, .42 * k);
  }
  // 一蓬被踩起的雪雾 + 一口白气，都按拍触发（§51：这些"小事"以前没人画，于是画面在发呆）
  const beatT = (t0, i) => t0 + i * BEAT + .02;
  function onBeatBreath(t0, x, gy, u, every = 4) {
    const i = Math.floor(bpOf(T - t0) / every);
    EV.breathPuff(t0 + i * every * BEAT, x, gy, u, { y0: u * 5.1 });
  }

  // ============================================================ A1 · 0–15.22 · 雪夜独行
  // 六层：天（月被流云遮露一次 + 三颗星）· 远（钝齿林线 + 贴地雪幕）· 中（起伏雪坡 + 废弃栅栏）
  //       近（**一串踩在拍子上、正被落雪填平的脚印** + 贴地雪烟）· 光（只有胸口那粒和月）· 生命
  //       （每四拍一口白气、围巾在风里抽打、栅栏柱上一堆积雪扑地落一次）
  // §71 P1#1 三件事：① 原来脚印是 `P.footprints(walk.x-560, …)` —— 一整串挂在他身上一起滑，
  //   等于"没有脚印"；现在每一坑都钉在他**那一拍真正站过的那个 x** 上（beatTrail）。
  //   ② 脚与地面脱离：clawd 的腿长已修，这里再把地面线、脚线、脚印线统一到同一个 GY。
  //   ③ 步点踩拍：FILM.walkTo 的步态已经由 bpOf(t) 推出来，A1 只要保证**只用 walkTo**（原来
  //   的 frac(t*k) 自由时钟一律不许出现），落雪坑/雪雾也就跟着落在鼓点上。
  function sAlone(t, lt, dur) {
    const t0 = B[0], GY = 830;                      // 全场景唯一的地面线：脚、坑、脚印都用它
    // 开场从脚印特写升起拉远：先看见一串脚印，再看见走路的人（世界先于主角出现）
    // L5/L7 —— 原来特写的机位 cx = walk.x-520 ≈ 11，而脚印是从 520 才开始有的：
    //   特写里只有一片空雪，观众当然"看不见脚印"。现在机位落在**已有脚印的那一段**上，
    //   并且 tight 到他还进不了画（zoom 2.5 → 右边缘 444 < 他的 520）：先坑，后人。
    const rise = ease(seg(lt, .8, 4.4));
    const lead = ease(seg(lt, 11.4, 14.2));         // 结尾：镜头停住让他**走出画面右缘**（§A1 转场 out）
    const walk = F.walkTo(t, .5, 14.2, 520, 1240, U, 'walk', 'side');
    camBegin(lerp(lerp(60, walk.x + 210, rise), walk.x - 470, lead) + 12 * Math.sin(lt * .5),
      lerp(806, 574, rise) + 140 * lead, lerp(2.35, 1.05, rise) + .8 * lead + .004 * lt);
    F.sky(F.SKY);
    moon(1516, 170, 60, seg(lt, 4.2, 9.2) * (1 - seg(lt, 10.6, 14.4)));
    F.stars(3, 74, 214);
    F.skyBand(238, 940, 116, F.SKYLO, .62);
    // 远地平线是钝齿状的暗森林剪影：两排，后排更小更暗，前排之间留缝 —— 一排等距同形三角是图标，不是林子
    treeline(-460, 820, 20, E.fir * .5, { span: 4000, rows: 1, snowK: .3, tone: mixCol(C.sapDk, F.SKY, .72) });
    treeline(-380, 824, 13, E.fir * .68, { span: 3600, rows: 1, snowK: .45 });
    F.ground(GY - 4, F.snow, F.snowSh, { horizon: 812 });
    F.haze(GY - 4, .8);
    fence(120, GY - 6, 9, 216, { h: 88, rail: true });
    // 剧本"雪幕在森林前贴地横漂"：贴地的横飘雪烟，密度跟着全片雪况走（L6）
    F.snowVeil(GY - 30, 52, .55 * snowArc(t));
    P.gusts(706, GY - 6, 5, -1, .45 + .55 * seg(lt, 5.1, 5.6), C.snowLt);
    F.grade(.46);
    // 雪面不是空板：被风堆起来的脊（亮）和脊后的浅沟（暗）成对出现，铺满开场特写的整段画幅。
    // 原来只有 3 团 washOp 26 的淡斑、且都在 cx≈90 的画外，于是特写里 2/3 画面是一块纯色。
    // 和脚印同一条规矩（L5）：雪面的**明暗关系**必须画在夜色层之后，否则被 grade 一起抹平。
    for (let i = 0; i < 11; i++) { boilSeed('dr' + i);
      const dx = -900 + i * 330 + hash(i) * 190, dy = 848 + (i % 3) * 52 + hash(i + 7) * 30, dw = 250 + hash(i + 3) * 300;
      paint(ellPts(dx, dy, dw, 15 + 7 * (i % 3), 16, 4), { wash: F.snowSh, washOp: 52, ink: null });
      paint(ellPts(dx + dw * .18, dy - 13 - 5 * (i % 3), dw * .74, 11 + 5 * (i % 3), 14, 3), { wash: F.snowLit, washOp: 46, ink: null }); }
    // 他走过的证据：一串正在被落雪慢慢填平的脚印。**开场特写里它就是主角。**
    // 画在 grade() **之后**：坑是雪面上的暗伤，压过夜色再画才不会被一起抹平（L5"看不见"的另一半原因）。
    beatTrail(t, .5, 14.2, 520, 1240, GY + 2, U * 1.15, { life: 9, pre: 30, stride: U * 1.45 });
    F.lamp(walk.x - 4, GY + 2, 74, WARM, .5);
    F.snowfall(t, 60, snowK(t), snowWind(t));          // 暴风雪：全片最厚的一层（L6）
    // 落脚：每步一拍，雪面陷坑 + 一蓬雪雾
    EV.stepPuff(beatT(OFF, Math.floor(bpOf(t))), walk.x - 8, GY, U * .95);
    // 第 12 拍风猛了一口，他把围巾按住
    const gust = ease(seg(lt, 5.05, 5.5)) * (1 - ease(seg(lt, 6.4, 7.3)));
    F.hero(walk.x, GY, U, t, {
      ...walk, cold: .78, light: .26 + .05 * Math.sin(T * 2.2), wind: .3 + gust * .85,
      eyes: 'narrow', mouth: 'flat', lookX: .85, lookY: .12,
      aL: lerp(-.2, .62, gust), aR: -.52, gloom: .16, emote: null, boilKey: 'hero1',
    });
    onBeatBreath(t0 + 3.4, walk.x + 30, GY, U * .95, 4);
    EV.snowCrash(t0 + 4.9, 366, GY - 6, U * .8, { y0: U * 3.7 });    // 栅栏柱上的积雪"扑"地掉一次
    camEnd();
    F.title(seg(lt, 3.4, 4.6) * (1 - seg(lt, 6.1, 6.9)));         // 片名浮在画面上约 3 秒，不黑屏报幕
    if (lt < .5) F.irisIn(W * .5, H * .5, lt / .5);               // 从风暴里睁开眼
    F.wipeOut(lt, dur, ['#2A3560', '#1B2140']);
  }

  // ============================================================ A2 · 15.22–35.85 · 紫火把（盗贼团）
  // §45b 三段式：光先在场 → 身体转向它 → 靠近并发现。§17：偷看 ≠ 明看。
  // §71 P1#2 —— 原来这三个人是 thief / huckster / lumberjack **三套职业装并排**，观众读到的是
  // "三个不同工种凑成一伙"。现在三个人共用同一件斗篷 + 同一条围巾 + 同一个身体色 + 同一种被紫光照
  // 白的脸色，只有**帽子**留下来区分（夜帽 / 貂皮高帽 / 皮安全帽）。
  function sViolet(t, lt, dur) {
    const t0 = B[1], gy = 856;
    // 岩石是这一场的**布景轴**：镜头要多宽、光落在哪，全按它算，所以只允许有一个坐标。
    // 原来它在 grade 前后各被画了一次，而且两次尺寸还不一样（300×150 与 322×168）——
    // 镜头一拉远就看见同一块石头的两个轮廓。
    const ROCK_X = 1150, ROCK_W = 322;
    // 第二十四轮 R24-1：开场 5.2 秒是**偷看那一拍** —— 两块巨岩之间一道竖缝，缝里是那团紫光，
    // clawd 的后脑勺从画面下沿探进来（看不见腿）。镜头推向缝隙直到掩体滑出画面，才进抢劫现场。
    // ⚠ **故意不重映射现场段的时间轴**：抢劫的拍子（rob 7.4 / shove 9.6 / leave 14.6）是踩在
    // 音乐上的，若把整段往后推 5.2 秒就会全部错位。所以偷看是**替换**掉原来空转的开场，
    // 而不是加在前面 —— 现场段仍然从 lt=0 的数值继续跑，只是 0..PEEK 这几秒画的是偷看。
    const PEEK = 5.2;
    if (lt < PEEK) { peekBeat(t, lt, PEEK, { x: 1470, y: 690, gw: 470, gh: 350, style: 'rock', col: VIO, hot: VIOHOT }); return; }
    const glowIn = ease(seg(lt, 0, 3.2));
    // L7（第九轮 C）：**开场是光，不是人**。镜头贴着那团紫光起画，一边褪紫一边拉远，
    // 三个盗贼和整块岩是被镜头**找到**的 —— 不是切进去就站在原地。
    // 第二十四轮：原来收尾要"同时装下石头左边的他和右边的抢劫"才收到 .92/cx1470；
    // 现在他根本不出镜，镜头可以**留在抢劫本身**上。
    camBegin(kf(lt, [[0, 1640], [4.4, 1700], [9.5, 1740], [20.6, 1800]]), kf(lt, [[0, 640], [4.4, 646], [20.6, 656]]),
      lerp(1.62, 1.05, ease(seg(lt, 0, 4.4))) + .014 * Math.sin(lt * .42));
    F.sky(mixCol(F.SKY, VIO, .1 * glowIn));
    F.skyBand(208, 1030, 128, mixCol(F.SKYLO, '#2A2350', .5), .8);
    treeline(300, gy - 60, 9, E.fir * .5, { span: 2600, rows: 2, snowK: .3 });
    // 顺序：先雪原（从地平线铺下来）→ 再坡（前景的一道岭）→ 再岩石。原来坡画在雪原之前，
    // 于是加了 horizon 之后雪原整块盖住了坡。
    F.ground(gy - 24, F.snow, F.snowSh, { horizon: gy - 74 });
    // 岩后的坡。F.slope 的 ink 轮廓是**闭合多边形**的边：原来底边收在 y=1080、右边收在 x=2400，
    // 两头都落在画面里，于是雪地上凭空出现一个巨大的圆角矩形边（镜头一退远就露馅）。
    // 封底/封口全部推到最远镜头之外。
    F.slope([[200, 1500], [200, 806], [900, 748], [2300, 700], [3100, 706], [3100, 1500]]);
    rock(2380, gy - 6, 330, 156, { snowFall: t0 + 12.6 });                         // 盗贼那侧的岩（和躲藏的岩无关）
    rock(ROCK_X, gy - 8, ROCK_W, 168, {});                                         // 旧 Clawd 躲的那块（被风磨圆的边 + 一顶雪）
    F.grade(.63);                                                                 // P1#2：夜色压得更狠，光才有"赢"的余地
    // 剧本写"盗贼们来的新脚印（从右侧进入，杂乱）"—— 原来 `sViolet` 里根本没有任何 `printRow`，
    // 所以三个人是**凭空站在那儿**的。补一串从画右进来的乱脚印，观众立刻知道他们走了多远、几个人。
    printRow(2680, gy + 4, 15, 78, U * 1.15, { dir: -1, fade: .46 });
    printRow(2610, gy + 16, 11, 66, U * 1.0, { dir: -1, fade: .34 });
    // 火把先照亮，人才被看见：紫色光斑把雪照成青紫，影子拉得又长又歪
    // §45b —— "被光吸引"要成立，光源必须在画面里真的**赢**。原来火把只有人高的四成、光斑 360px@.68，
    // 读起来是"一个人举着根棍子"，不是"一团紫火"。现在火把举到一人半高、光斑 560px、空气整团是紫的。
    const torchX = 1694, torchY = gy - 8;                 // 火焰实际落点：举杖人 x + 34（手臂上举后往回摆）
    P.lightPatch(torchX, torchY + 10, 560 * glowIn, VIOHOT, .95 * glowIn);
    P.airGlow(torchX, gy - 250, 250 * glowIn, VIOHOT, 1.2 * glowIn);
    F.snowfall(t, 46, snowK(t), snowWind(t));
    // 三个盗贼围住小女孩。**间距要大于一个身宽（10u≈210px）还不够** —— 第二十轮 R20-5：
    // 上一版三个人同一条基线（只差 `i*4`）、同一个尺寸，四腿一排排得整整齐齐，
    // 于是"三个盗贼"在成片里读成"一只很多腿的兽"（f00480 裁切所见）。
    // 缺的是**进深**：每人一条 lane，尺寸也跟着进深变，观众才数得出这是三个人。
    const rob = seg(lt, 7.4, 9.6), shove = seg(lt, 9.6, 10.6), leave = ease(seg(lt, 14.6, 20.2));
    const cast = [['thief', 1660, 1.06, 'laugh', 18], ['thief', 1950, .92, 'sneer', -18], ['thief', 2230, 1.0, 'numb', 2]];
    const reachOf = i => i === 0 ? lerp(.3, 1.02, rob) - 1.2 * Math.max(0, ease(seg(lt, 9.8, 10.6)) - ease(seg(lt, 12.4, 13.2))) : .12 + .1 * Math.sin(T * 3 + i);
    cast.forEach(([jn, tx, sc, ex, lane], i) => {
      const px = tx + 360 * leave;
      const tn = leave > .02 ? turn(lt, 14.6, 15.1, -.25, .25) : { view: 'q', flip: true };
      clawd(px, gy + lane, U * 1.02 * sc, job(jn, t, {
        ...tn, ...GANG, expr: ex, boilKey: 'v' + i, tint: 'blue', tintK: .3,
        aR: reachOf(i), aL: i === 0 ? .62 : -.4 + .1 * Math.sin(T * 2.6 + i),
        dy: -Math.abs(Math.sin(bpOf(t) * Math.PI + i * .9)) * (leave > .05 ? .34 : .1),
        rot: (i === 0 ? -.11 * ease(seg(lt, 8.8, 9.8)) : .03 * Math.sin(T * 4 + i)) - .07 * shove,
        lookX: i === 0 ? -.75 : -.4, light: i === 2 ? .08 : null, lightCol: VIO,
        ...(i === 0 ? { armR: uu => PROP.bread(1.2 * uu, 0, uu * .95, { half: lt > 10.6 }) } : {}),
        draw: (uu, sw) => gangKit(uu, sw, .3 + .12 * i, i),
      }));
    });
    // 火把**从手臂钩子里拿出来，画在所有角色之上**：塞在 armR 里就会被后面两个人盖掉，光也一起被盖掉。
    // 位置用 handPt()（clawd 的 arm() 的逆变换）算，所以它仍然长在那只举着的手上。
    const tu = U * 1.02 * cast[0][2];
    const [hx0, hy0] = handPt(cast[0][1] + 360 * leave, gy + cast[0][4], tu, reachOf(0), 1,
      { flip: true, rot: -.11 * ease(seg(lt, 8.8, 9.8)) - .07 * shove });
    if (leave < .97) {
      P.torch(hx0, hy0, tu * 2.6, { col: VIOHOT, pool: false, wind: -.2 });
      P.airGlow(hx0, hy0 - tu * 9.4, tu * 5.2, VIOHOT, 1.3 * (1 - .4 * leave));
      P.halo(hx0, hy0 - tu * 8.2, tu * 3.8, VIOHOT, .9 * (1 - .4 * leave));
    }
    // 小女孩：先善意地举着整块面包（她以为他们是路人），再被抢、被推倒，膝上留着小的那半
    const girlX = 1430, girlG = gy + 8, gu = U * .62;
    const fall = ease(seg(lt, 9.8, 11)), girlLit = 1 - ease(seg(lt, 12.4, 14.6));
    const imp = Math.exp(-Math.max(0, lt - 11) * 4.4) * Math.cos(Math.max(0, lt - 11) * 15);
    clawd(girlX, girlG, gu, job('girl', t, {
      view: 'q', flip: false, boilKey: 'girl2',
      expr: lt < 7.4 ? 'reach' : lt < 12.4 ? 'snarl' : 'cry',
      sq: .05 + .28 * fall + .12 * imp, dy: 2.4 * fall, rot: -.28 * fall,
      aL: lt < 9.8 ? 1.18 : -1.22, aR: lt < 9.8 ? 1.12 : -1.28,
      lookX: .55, lookY: lt < 9.8 ? -.2 : .3, light: girlLit * .9,
      ...(lt < 9.8 ? { armR: uu => PROP.bread(1.2 * uu, 0, uu * .95, { steam: true }) } : {}),
    }));
    if (lt >= 11) PROP.bread(girlX + 6, girlG - 2, gu * 1.15, { half: true, glow: false });   // 丢回她膝上的是小的那半
    // 第十八轮 R18-1：两句**无框白字**的喊叫。第一句在面包被夺走的那一拍，
    // 第二句在她被推倒、三个人转身要走的时候 —— 由大到小、由近到远，喊到没人理。
    shout('MY BREAD!!', girlX - 10, 604, 118, lt - 9.9, { life: 1.5, rot: -.06 });
    shout('HELP!!', girlX - 46, 498, 168, lt - 11.7, { life: 2.3, rot: .04 });
    // 光必须**落在人身上**：每张嘴的受光边都朝火把（§42 的病根就是光只画在地上、角色不接光）
    const rimK = glowIn * (1 - .6 * leave);
    // 光落在人身上：受光边必须在**朝火把的那一侧**。三个人都是 flip:true（脸朝画面左），
    // 而火把在他们左边，所以偏移取负、dir 取 -1。
    // 第二十轮 R20-5：原来写的是 `tx + 58 … dir 1` —— 紫光打在**后脑勺**上，那团半透明的
    // litFace 正好糊住整张脸，成片里像每个人脸上贴了一只气泡（f00480 全分辨率裁切所见）。
    cast.forEach(([jn, tx, sc, ex, lane], i) => P.litFace(tx - 58 * sc, gy + lane - U * 5.9 * sc,
      U * 2.2 * sc, U * 2.6 * sc, VIOHOT, rimK * (i === 0 ? 2.2 : 1.5), -1));
    P.litFace(girlX + 34, girlG - gu * 6.1, gu * 2.7, gu * 3.1, VIOHOT, rimK * 2.5, 1);
    // 第二十四轮 R24-1：**clawd 从这一场彻底出镜**。
    // 第十七轮为了"他躲在石头后面"调过三次朝向和遮挡（右唇→左翼→镜头收到 .92 才装得下他），
    // 每一版都还有新问题。用户给的解法是把"偷看"交还给**镜头**：偷看是开场那一拍
    // （`peekBeat`，背影 + 掩体 + 缺口里的紫光），本拍之后观众和他一起被推进现场，
    // 于是"他在不在掩体后面、露没露腿、有没有朝向错"这类问题**不再存在**。
    // 石头仍然是布景（雪、坡、光都靠它交代），只是不再当道具用的掩体。
    rock(ROCK_X, gy - 8, ROCK_W, 168, {});
    // 出画预叙：左远方亮起一串深蓝色的灯（比紫光"体面"，所以更冷）
    const blueAhead = ease(seg(lt, 17.4, 20.4));
    for (let i = 0; i < 3; i++) horizonLight(1180 + i * 124, gy - 252 - i * 12, 74 * blueAhead, BLU, blueAhead * (1 - i * .2));
    camEnd();
    F.wipeIn(lt, ['#2A3560', '#1B2140']);
    F.wipeOut(lt, dur, ['#3A3462', '#252C50']);
  }

  // ============================================================ A3 · 35.85–63.97 · 蓝灯笼（奸商队）
  // §71 P1#3 —— 这一场原来有八个问题，逐条落地：
  //   (a) 奸商与村民**必须面对面**：村民从左来、朝右；奸商在车右、flip:true 朝左。交易要有两个人。
  //   (b) 奸商一伙不能凭空出现：开场四秒是**旧 Clawd 被蓝光拽过去**（望→倾身→走过来）。
  //   (c) "躲在墙后"用 FILM.behind() 贴掩体侧唇，不再把人往下沉（2D 里没有"底下"）。
  //   (d) 蜡烛车必须一眼读出"一整横车**红色杆烛**"。
  //   (e) 奸商手里那盏蓝提灯放大到半人高，蓝光用 airGlow 夸大。
  //   (f) 村民一律压成灰扑扑的素色，并且**在抖、在饿光**（EMO.shiver + feel('shiver')）。
  //   (g) 村里**没有路灯**：原来那根高杆蓝灯笼是一盏市政路灯，删掉，蓝光只来自奸商手里。
  //   (h) 加对话云，戏才立起来。
  function sBlue(t, lt, dur) {
    // 第十七轮 6：蜡烛车要放在**远离村民的一侧**，否则观众看不见车、只看见后脑勺。
    // 原来的排布是 村民(934~1240) → 车(1330) → 奸商(1596)，车被夹在中间。
    // 现在：村民在左、奸商在中间朝左谈价、车在最右 —— 车前面再没有别的东西挡着。
    const t0 = B[2], gy = 878, cartX = 1720, huckX = 1478;
    // 第二十四轮 R24-1：这一场的开场同样是**偷看那一拍**，但掩体换成**一丛类圆灌木**
    // （用户点名"三个偷看clawd的掩体不能完全一样"）：A2 是两块巨岩之间的竖缝、
    // A3 是灌木围出的圆洞、A4 是倒木与雪堆之间的横缝。吸引他的是奸商手里那盏**蓝**提灯。
    const PEEK = 5.0;
    if (lt < PEEK) { peekBeat(t, lt, PEEK, { x: 1310, y: 700, gw: 430, gh: 400, style: 'bush', col: BLU, hot: BLUHOT }); return; }
    // L7（第九轮 C）：开场先给**整个冷掉的村口**（.86，三座黑屋 + 一车蜡烛都在画面里），
    // 然后一边讲价一边推到 1.12 —— 镜头本身在表演，不是固定机位看人晃。
    camBegin(kf(lt, [[0, 1140], [9, 1210], [28.1, 1246]]), 570, lerp(.86, 1.12, ease(seg(lt, 0, 13.2))));
    F.sky(mixCol(F.SKY, BLU, .03));
    F.skyBand(198, 1080, 138, mixCol(F.SKYLO, '#1B2A4A', .5), .72);
    treeline(1900, gy - 90, 7, E.fir * .42, { span: 1500, rows: 1, snowK: .3 });
    F.ground(gy - 22, F.snow, F.snowSh, { horizon: gy - 150 });
    F.haze(gy - 22, .5);
    // 三座小屋：窗全黑、烟囱不冒烟（村子是冷的）；屋檐冰凌偶尔滴一声
    [[430, E.cabin * .92], [880, E.cabin], [2130, E.cabin * .86]].forEach(([hx, hm], i) => {
      P.cabin(hx, gy - 20, hm, { lit: 0, smoke: 0 });
      EV.icicleDrip(t0 + 6.2 + i * 3.4, hx + 76, gy - 108, U * .55, { y0: -U * 1.5 });
    });
    P.bench(700, gy - 16, .9, {});
    // 村口的蜡烛车：一整横车**躺倒的红杆烛**（P1#3d）。旁边不再有任何路灯。
    candleCart(cartX, gy - 6, E.cart * 1.15, BLU, t);
    F.grade(.52);
    // 蓝光：车上一盏 + 奸商手上一盏。地面光斑 380px、空气 240px —— 冷光也要"夸大"。
    P.lightPatch(cartX + 30, gy + 4, 380, BLUHOT, .62);
    P.cat(cartX - 66, gy - 118, U * .7);                            // 蹲在车上取暖的猫：连猫都缩成一团
    // 一家三口捧着全部家当走向车 —— **面朝右**，看着奸商
    // 第二十轮 R20-3：原来三人的落点是 `1116 + i*62`，而一个身体宽 10u≈210px —— 间距只有身宽的
    // 30%，三顶帽子叠成一顶，成片里是"三头一身"（f01080 全分辨率裁切所见）。和第二部 S4 的病根
    // 一模一样：**一排等高、等距、同尺寸**。
    // 这里不能靠"把 x 拉开"解决（左边没有那么多空间，奸商在 1478），所以给每人一条**进深**：
    // 远的小而高、近的大而低；**数组顺序 = 远→近**，遮挡关系因此天然正确。
    // 第二十四轮 R24-2：clawd 退场之后，村民**不再挤成一团**。和奸商交易的只留一个大人 + 一个孩子
    // （他们走到车前），其余三个分散在左右两边远远围观 —— 用户："其他的村民可以放远一点围观
    // （左右两边都可以）"。数组顺序 = 远→近（lane 递增），遮挡关系因此天然正确。
    //
    // 顺带修掉一处**静默失效**（和子代理在第二部发现的同一类病）：`lit` 原来写的是
    // `seg(lt, dieAt[i] - t0, dieAt[i] - t0 + 1.15)`，而 dieAt 本来就是**场内秒数**
    // （24.2 ≈ 全片 60.05 s 的那个"屏息处"）；再减一次 t0 就变成负数，seg 恒为 1、lit 恒为 0，
    // 于是剧本里"一盏、一盏、一盏，熄了"这一拍**从来没演过**，村民全程不带暖光。
    const toCart = ease(seg(lt, 1.2, 6.6));
    //        名字        起点   终点  进深  尺寸  熄灯(场内秒) 朝向
    // 第二十六轮 R26-1a：用户"村民太多了……现在完全挤在一起，都看不清脸了"。
    //   ① 从 5 人减到 4 人（去掉 640 那个纯站桩的）；
    //   ② 谈价的两个人**拉开和奸商的距离**：原来成人买家站在 1290，而奸商在 1478 ——
    //      只差 188px，比一个身宽（10u≈210）还近，所以两片帽子叠成一顶、谁都看不见脸。
    //      现在买家 1216、孩子 1046，和奸商之间留出 262 / 432px（≥1.2 个身宽，
    //      和 S4/S9/A2 同一把尺子）；
    //   ③ 顺手把下面那块**已经没用的雪墙**删了（原来它是 clawd 的掩体，R24-1 之后他不是
    //      躲在这儿看的）—— 墙留在原地既讲不通，又正好挡着村民往左展开的路。
    const fam = [['villager', 430, 430, -34, .80, 23.6, 1],
      ['kid', 934, 1046, -14, .58, 25.6, 1],
      ['villager', 2010, 2010, -8, .84, 26.6, -1],
      ['villager', 1096, 1216, 14, 1.05, 27.6, 1]];
    fam.forEach(([jn, fx0, dest, lane, sc, die, lk], i) => {
      // R27-2：原来这里是 `lerp(...) - 700 * gone`，而 `gone` 在收尾 0.9 s 里从 0 爬到 1 ——
      // 四个人一起向左平移 700px，也就是**每帧 30px**。用户："奸商片段末尾村民瞬移走了，改成不动。"
      const px = lerp(fx0, dest, toCart);
      const kid = jn === 'kid', buying = dest === 1046 || dest === 1216;
      const lit = 1 - ease(seg(lt, die, die + 1.15));
      clawd(px, gy + lane, U * sc, job(jn, t, {
        view: 'q', flip: lk < 0, boilKey: 'fam' + i, ...POOR,
        expr: kid ? 'reach' : 'shiver', tint: 'blue', tintK: .42, gloom: .3,
        aL: kid ? 1.2 : -.9, aR: kid ? 1.15 : -.86,
        dy: -Math.abs(Math.sin(bpOf(t) * Math.PI + i * .8)) * (toCart < 1 && buying ? .4 : 0),
        lookX: lk * .8, lookY: kid ? -.25 : .1, light: lit * .15, sq: .1,
        // 袋子挂在**成年买家**手上。原来写的是 `i === 4`（数组下标），而 R26-1a 把五个人
        // 减成四个、下标全变了 —— 按下标写"谁拿什么东西"，下次增删一个人就会静默拿错。
        ...(buying && !kid ? { armR: uu => PROP.sack(1.15 * uu, 0, uu * .78, {}) } : {}),
      }));
      if (lit > .02) P.lightPatch(px, gy + lane + 4, 44 * lit, WARM, .5 * lit);
    });
    // 称蜡烛：铜币一枚一枚上秤，每上一枚秤杆沉一下；第八枚奸商用两指拨回一半
    // 第二十轮 R20-2：秤原来挂在 `gy-78`，而秤盘在锚点下方约 29px → 盘底正好压在价签第一行的
    // 字面上（f01080 高倍裁切：`$99` 被读成 `$39`）。用户点名的东西被道具挡住了，等于没写。
    // 秤是**立在车斗上**的，把它整体抬到 `gy-120`：盘底回到 gy-91，车帮上沿在 gy-77，让开 14px。
    const weigh = seg(lt, 6.6, 14.4), nCoin = Math.min(8, Math.floor(weigh * 8.6));
    P.scale(cartX + 118, gy - 120, U * .95, { tilt: clamp(.34 - .03 * nCoin, -.25, .5) });
    for (let i = 0; i < nCoin; i++) P.coin(cartX + 118 - U * 1.38, gy - 120 - U * .9 + i * 2.6, U * .5, { stack: 1 });
    // 奸商：在车的**右侧、面朝左**，和村民正对正。手里那盏蓝提灯放大、举在两人之间。
    clawd(huckX, gy, U * 1.08, job('huckster', t, {
      view: 'q', flip: true, expr: lt > 13.2 ? 'sneer' : 'numb', boilKey: 'huck3', ...GANG,
      aR: lerp(.45, 1, ease(seg(lt, 13.2, 14.8))) - .35 * ease(seg(lt, 15.8, 16.6)),
      aL: -.18 + .55 * ease(seg(lt, 11.6, 12.4)) * (1 - ease(seg(lt, 13, 13.6))),
      lookX: -.82, lookY: .05, light: .1, lightCol: BLU, tint: 'blue', tintK: .3,
      draw: (uu, sw) => gangKit(uu, sw, .2),
    }));
    // 那盏蓝提灯：画在所有人之上（P1#3e —— 原来它只有巴掌大，还被人盖住）。
    // 灯是**挂在掌下的**：PROP.lantern 的灯体在锚点上方 2.6s 处，所以锚点要按 s 折算回手掌下面。
    const la = -.18 + .55 * ease(seg(lt, 11.6, 12.4)) * (1 - ease(seg(lt, 13, 13.6)));
    const lu = U * 2.1, ls = lu * 1.5;
    const [lx0, ly0] = handPt(huckX, gy, U * 1.08, la, 1, { flip: true });
    // 第二十四轮 R24-3：奸商那盏蓝提灯原来只有 `lightPatch 260 / airGlow ls*1.9 / halo ls*2.4`，
    // 而盗贼火把是 `560 / tu*5.2 / tu*3.8` —— 用户说的"蓝光没有大光晕"就是这个量级差。
    // 另外**外圈一律用 hot（近白）会让蓝光读成一盏白灯**（和偷看那一拍同一个病），
    // 所以外圈改用饱和的 BLU，只有小核心留 hot。
    // 第二十六轮 R26-1b：**用户第二次点名"蓝灯还是没有大光晕"**。上一轮我只把数值从
    // 260/1.9/2.4 提到 520/3.4/4.2，成片里仍然读不出来 —— 因为病根不是半径，是**层数**：
    // A2 那支火把之所以"大"，是 lightPatch + airGlow + **两层** halo（外圈饱和、内圈 hot）
    // 叠出来的一个有核心的光团；一盏灯只有一层 halo，再大也只是一片均匀的雾。
    // 所以这次照 R24-1 偷看那一拍已经验过的配比补成四层，并且**外圈一律用饱和的 BLU**、
    // 只有最小的核心留 BLUHOT（全用近白就会读成一盏白灯，这是同一轮里踩过的第二个坑）。
    // 地面那团光**不能跟着一起放大**：lightPatch 是一个有硬边的盘，半径超过 ~600 之后
    // 它的边缘会在雪地上画出一圈可辨的圆环（t=48 复核所见 —— 用户会读成"地上有个泡泡"）。
    // "大"这件事交给上面三层 halo 去做，地面只负责"灯把雪照亮了"。
    // ⚠ 光晕的**圆心**必须是灯芯，不是手掌。PROP.lantern 的灯体从锚点上方 2.6s 起、高 1.1s，
    // 锚点已经按 2.6s 折算到掌下，所以灯芯在 `ly0 + .55*ls`。原来这里写的是 `ly0 + 1.6*ls`
    // —— 那是灯体**下沿之外**，于是光晕画成一团飘在灯下面的白球，用户看到的"没有大光晕"
    // 有一半是这个（另一半才是层数）。
    const lcy = ly0 + .55 * ls;
    // 和 A2 火把对照过（t=28 那一帧）：光团直径约是这盏灯的两倍、而且一眼就"亮"。
    // 差在**不透明度**不在半径 —— airGlow 每层只有 ~15α，铺得再大也是一层哈气。
    // 所以这里把 k 抬到火把的量级，颜色用 .55~.72 的 hot 配比：再白就读成一盏白灯，
    // 再饱和就沉回夜色里看不见（R24-3 那一版就是这个病）。
    P.lightPatch(lx0, gy + 6, 540, mixCol(BLU, BLUHOT, .22), .7);
    P.airGlow(lx0, lcy, ls * 5.2, mixCol(BLU, BLUHOT, .55), 2.3);
    P.halo(lx0, lcy, ls * 7.0, mixCol(BLU, BLUHOT, .5), 1.9);
    P.halo(lx0, lcy, ls * 3.4, mixCol(BLU, BLUHOT, .72), 1.5);
    P.halo(lx0, lcy, ls * 1.2, BLUHOT, 1.0);
    // 灯体**最后**画：它原来在光晕之前，于是四层光糊在纸面上，看不出"有一盏灯在那里"。
    P.lantern(lx0, ly0 + 2.6 * ls, lu, { col: mixCol(BLU, BLUHOT, .4), pool: false });
    // 光落在脸上：受光边必须**朝向光源**，所以取号由"人在灯的哪一边"决定 ——
    // 第二十四轮 R24-2 把围观村民放到了左右两边，右边那位的蓝光就该打在他的左脸上。
    fam.forEach(([jn, fx0, dest, lane, sc, die, lk], i) => {
      const px = lerp(fx0, dest, toCart), sgn = px < lx0 ? 1 : -1;
      // R27-2：这里原来乘了 `(1 - gone)`，人既然不走了，蓝光也就不必跟着淡出。
      P.litFace(px + 40 * sgn, gy + lane - U * sc * 5.4, U * 2.8 * sc, U * 3.2 * sc, BLUHOT, .55, sgn);
    });
    P.litFace(huckX - 46, gy - U * 5.6, U * 3, U * 3.4, BLUHOT, .7, -1);
    // 台词（P1#3h：原来"完全没有交互，只是角色在晃"）
    // 第二十四轮 R24-3：车帮上的 `$99 FOR ONE CANDLE` 观众在景深里读不清，
    // 用户明确说"不用动它，直接在对话里加一句" —— 于是这句话由**奸商自己**报出来，
    // 比任何字牌都响，而且顺手把"他就是在抢"这件事说清楚了。
    // 第二十六轮 R26-1c：**这两句的先后颠倒了**（用户："$99 for one candle 和 How much
    // 顺序颠倒了"）。原来报价在 t0+6.6、问价在 t0+10.4 —— 奸商先报了价，村民才问"多少钱"，
    // 因果倒了。正确的对话是**先问后答**，所以只换时间、不换各人的气泡位置：
    // 问价的还是村民那边（x≈1150），报价的还是奸商那边（x≈1560）。
    F.say(t, t0 + 6.6, 1150, gy - U * 9.6, 'How much?', { dur: F.bt(6), size: 40, tailX: 1130 });
    F.say(t, t0 + 10.4, 1560, gy - U * 10.4, '$99 for one candle', { dur: F.bt(6), size: 40, tailX: 1520 });
    F.say(t, t0 + 13.4, 1180, gy - U * 9.6, 'Too expensive...', { dur: F.bt(7), size: 40, tailX: 1150 });
    F.say(t, t0 + 16.4, 1560, gy - U * 10.4, "It's only wax.", { dur: F.bt(7), size: 40, tailX: 1600 });
    F.say(t, t0 + 19.4, 1160, gy - U * 9.6, 'Last coin.', { dur: F.bt(6), size: 40, tailX: 1140 });
    // 老人把半支蜡烛插在门口的雪里，没有点（舍不得）
    if (lt > 18.8) { P.candle(946, gy - 12, U * .85, { half: true }); P.lightPatch(946, gy - 6, 30, BLU, .12); }
    if (lt > 18.8) P.wheelRut(cartX - 10, gy + 12, 640 * ease(seg(lt, 18.8, 27.4)), U * 1.15, 1);   // 车辙蜿蜒出画
    // 旧 Clawd：**先被蓝光拽过去**（望→倾身→走过来），再贴到矮墙的侧唇后探头。
    // 第二十四轮 R24-1/2：**clawd 不再出现在这一场里**。原来他走到雪墙后探头
    // （`walkChain` + `F.behind` + `wallShow` 那一整套遮挡计算），每一版都还要处理
    // "他有没有被墙挡住 / 他站在谁的后面 / 他的朝向对不对"。现在偷看是**开场那一拍**，
    // 本拍只剩"奸商和村民谈价"这件事本身 —— 也正因为他退场了，R24-2 要的
    // "村民不用挤在一起互相遮挡"才有地方摆：谈价的只留一个大人 + 一个孩子，
    // 其余村民分散到左右两边围观。雪墙保留，它是村口布景，不再是掩体。
    // R26-1a：这块雪墙删掉了。它原来是 clawd 的掩体（他躲在后面探头），而 R24-1 把"偷看"
    // 挪到开场的独立一拍之后，掩体是那一拍里的**灌木丛**，不是这里 —— 于是这块 352×116 的
    // 灰板变成一块"没用了但还杵着"的东西，用户直接点名"那个石头已经没用了可以去掉了"。
    // 它挡的正是村民往左展开的位置，去掉之后 R26-1a 要的"分开站"才有地方摆。
    // （L7 第 3 条的另一面：**道具不能因为"当初为它写的代码删了"就自己留在画面里**。）
    // 出画预叙（声音预叙的视觉版）：后山林线震落一团雪，惊起两只鸟
    EV.rimeShake(t0 + 26.5, 2160, gy - 210, U * 1.6);
    EV.birdsStartle(t0 + 26.8, 2200, gy - 258, U * 2.4, { n: 3 });
    F.snowfall(t, 42, snowK(t), snowWind(t));   // L6：这一场原来**一整场没有雪**，
    // 于是 A2→A3 是"骤停"、A3→A4 是"骤起"，28 秒的空白比任何跳变都刺眼。
    camEnd();
    F.wipeIn(lt, ['#3A3462', '#252C50']);
    F.wipeOut(lt, dur, ['#2E4258', '#22304A']);
  }

  // ============================================================ A4 · 63.97–95.85 · 绿提灯（伐木工团）
  // §71 P1#4 —— 四条：
  //   ① 人不能飘。原来 slopeY() 是一条**和 F.slope 画出来的坡对不上**的直线（差 80px），
  //     所以三个人都悬在坡面上方。现在 slopeY 就是那条折线本身，人、树、桩、车辙全用同一个函数。
  //   ② 看不出来在砍。斧子改用 PROP.axe 的 swing（整记"举过头→卡拍劈下"+斧风弧），一斧两拍；
  //     命中那一拍在树干上崩木屑、震落一树雪、坡面抖一下，并且**每棵树根部画一个咬口的楔子**。
  //   ③ 树太小。立着的树一律 PROP.giantTree(m≈7)：这个尺度下树冠和顶枝都在画面外，
  //     观众只看见**一根两人抱不过来的树干 + 上方两三根压雪的枝梢** —— 这正是用户要的比例。
  //   ④ 桩子必须和被砍的那棵树咬合：stumpOf(m) 由 giantTree 的干宽倒推，A4/A11 共用同一个公式。
  function sGreen(t, lt, dur) {
    const t0 = B[3], ridgeY = 802;
    // 第二十四轮 R24-1：这一场的开场同样是偷看，掩体是第三样 —— **倒木压上、雪堆压下**的
    // 一条横缝（A2 竖缝、A3 圆洞、A4 横缝，用户点名三处不能一样）。吸引他的是**绿**光。
    const PEEK = 5.0;
    if (lt < PEEK) { peekBeat(t, lt, PEEK, { x: 1180, y: 700, gw: 620, gh: 300, style: 'log', col: GRN, hot: GRNHOT }); return; }
    // R24-4：机震原来三棵小树只有 6、老树 11，用户说"震动感不够"。
    // 一棵几十米高的树砸到坡上，观众要靠**画面本身抖一下**才信它的重量，
    // 所以幅度按倒下的树粗细给（老树最重），并且让衰减拖得更久一点。
    const shakeA = (lt > 27.4 && lt < 31.2 ? Math.exp(-(lt - 27.4) * .95) * 24 : 0)
      + (lt > 7.1 && lt < 9.2 ? Math.exp(-(lt - 7.1) * 2.0) * 13 : 0)
      + (lt > 14.2 && lt < 16.3 ? Math.exp(-(lt - 14.2) * 2.0) * 14 : 0)
      + (lt > 21.6 && lt < 23.8 ? Math.exp(-(lt - 21.6) * 2.0) * 15 : 0);
    const sh = shakeXY(t, shakeA);
    camBegin(kf(lt, [[0, 780], [6, 860], [10, 1250], [16, 1900], [20, 2250], [24, 2820], [28, 3460], [31.9, 3620]]) + sh[0], kf(lt, [[0, 496], [10, 484], [31.9, 452]]) + sh[1],
      1.06 + .016 * ease(seg(lt, 0, 31.9)) - .2 * ease(seg(lt, 24.6, 29.4)));   // L7：老树开工那一刻**松镜头**，让它把整面坡占满
    F.sky(F.SKY);
    F.skyBand(176, 1140, 152, mixCol(F.SKYLO, GRN, .06), .8);
    // 坡面：一条从 200 到 2500 的连续折线，**slopeY() 就是它的解析式**（下面定义）。
    // 右端封到 x=5800 / y=1500：F.slope 的轮廓是闭合的，封口必须落在最远镜头之外（同 A2/A9）。
    F.slope([[-1200, 1500], [-1200, 956], [860, 884], [1520, 706], [2300, 632], [3300, 596], [4600, 574], [5800, 570], [5800, 1500]]);
    // 一整面山坡的森林——"这曾经是森林"：后层密、雾凇重得压弯枝条（全部剪影版）
    treeline(700, 690, 11, E.fir * .58, { span: 2100, rows: 2, snowK: .95 });
    treeline(1180, 640, 8, E.fir * .44, { span: 1500, rows: 1, snowK: .8 });
    // 三棵被砍的树 + 最右边那棵老树。
    // 第十九轮：原来为了回应 P1#4③"树还是太小"，把树吹到 m=8.5~11.5（1430~1930px，
    // 比第二部那棵 5.2 的"大树"还高一倍，也比大多数楼高）。后果是**树冠整块被画面顶切掉**，
    // 观众只看见一根两人抱不过来的光树干在倒下 —— 一块读不出是什么的深色板
    // （复验 t=80 看到的正是这个，它占了画面右边 40%）。
    // 第九轮早就给过答案：**大小用镜头距离表达，不用像素表达**。所以这里把树收回到
    // 和第二部同量级（5.6~6.4，老树 8.2），"要显得大就把机位压低、贴过去"由相机去做。
    // 干宽 ≈ .351·PX(m)，间距仍要 ≥1100px，否则三棵树糊成一堵棕色的墙。
    // ⚠ 树是**环境**，必须画在 grade() 之前：原来在 grade 之后，一整片树冠没被夜色压过，
    //   在夜里亮成四块柠檬绿的墙（§58 的病灶，也是"看不出在砍"的原因之一）。
    const falls = [[1000, 7.1, 9.6, 5.6], [2100, 14.2, 16.6, 6.0], [3200, 21.6, 24.0, 6.4]];
    const bigX = 4300, bigM = 8.2, bigF = seg(lt, 24.6, 27.9);
    // 每个人守着自己那一棵砍 3.4 秒（≈7 拍、3 斧半），然后那一棵在 a 拍倒下。
    const chopK = i => (lt > falls[i][1] - 3.4 && lt < falls[i][1]) ? 1 : 0;
    const hitT = () => OFF + (2 * Math.floor(bpOf(t) / 2) + .87) * BEAT;   // 这一记斧子砸中的那一刻
    const recoil = ease(seg(lt, 19.5, 21.2)) * (1 - ease(seg(lt, 28.4, 30.6)));
    // 老树必须画在三棵被砍的树**之前**：它在更深的坡上，近处的树要能盖住它（§55 图层序=进深序）。
    if (bigF < 1) {
      push(); translate(bigX, slopeY(bigX) + 4); rotate(easeIn(clamp(bigF * 1.1)) * 1.47);
      // R26-2b：一旦开砍（bigF>0）干上就不该再有板根 —— 底部属于留在地上的那个墩。
      P.giantTree(0, 0, bigM, { heart: 0, noBase: bigF > 0 ? 1 : 0 }); pop();
    }
    // R26-2b：树墩原来要等树**完全躺平**（bigF>=1）才出现，于是倒下那 3 秒里既没有墩、
    // 干底又还带着板根 —— 断口凭空消失。墩是"锯断"那一瞬间留下的，不是"躺平"之后才有的。
    if (bigF > 0) stumpOfTree(bigX, slopeY(bigX) + 6, bigM, { seed: 9 });
    falls.forEach(([tx, a, b, m], i) => {
      const f = seg(lt, a, b), gy = slopeY(tx) + 4;
      if (f <= 0) {                                            // 还没倒：等待中挨一斧就整体抖一下
        const jt = chopK(i) ? Math.abs(Math.sin(bpOf(t) * Math.PI * 2)) * 4 : 0;
        push(); translate(tx + jt, gy); rotate(jt * .0016); P.giantTree(0, 0, m, { heart: 0 }); pop();
      } else {
        // 第二十四轮 R24-4：**树倒下后就躺在那儿，不再自己滑出画面。**
        // 原来倒下之后还有一段 `haul` 把它平移 2600px，理由是"一根巨木一直躺着会把后面的画面
        // 糊成一堵墙"。但没有任何东西在拖它 —— 一棵被砍断的树在画面里**匀速平移**，
        // 观众读到的是"它自己走了"，这是比构图问题更严重的一级 bug（连续性/物理）。
        // 腾地面是**镜头**该解决的事，不是道具该自己消失的事。
        push(); translate(tx, gy); rotate(f < 1 ? ease(f) * 1.47 : 1.47);
        // R26-2b：倒下之后干底是**平的断口**，板根留在树墩上（见 PROP.giantTree 的 noBase）
        P.giantTree(0, 0, m, { heart: 0, noBase: 1 }); pop();
        stumpOfTree(tx, gy + 2, m, { seed: i});   // 桩子从砍断那一刻就在，被倒下的树压在自己根部
      }
    });
    F.grade(.45);
    // 倒下之后才升起的"光的灵魂"与惊飞的鸟：它们属于**事件**，画在夜色层之后
    falls.forEach(([tx, a, b, m], i) => {
      const f = seg(lt, a, b), gy = slopeY(tx) + 4;
      if (f > .25 && f < 1.3) P.greenSoul(tx, gy, m, (f - .25) * 1.25, GRN);
      EV.birdsStartle(t0 + a + 1.3, tx + 130, gy - 250, U * 2.3, { n: 3 + i * 2 });
      EV.rimeShake(t0 + a + .8, tx - 110, gy - 130, U * 1.5);
      if (f >= 1 && f < 1.6) EV.stepPuff(t0 + b + .1, tx + 200, gy, U * 2.4);   // 砸进雪里那一蓬
    });
    // 绿光：一盏挂在坡下的高杆灯 + 一片压在干活那片雪地上的绿斑（"绿光的诱惑"必须看得见）
    P.lantern(360, slopeY(360) + 20, U * 1.3, { col: GRNHOT, pole: true, poolR: 3.6 });
    P.airGlow(360, slopeY(360) - U * 4.4, U * 4.8, GRNHOT, 1.15);
    falls.forEach(([tx, , , m], i) => { if (lt > falls[Math.max(0, i - 1)][1] - 4) P.lightPatch(tx - giantHalf(m) - 120, slopeY(tx) + 20, 460, GRNHOT, .7); });
    // 伐木工：一斧两拍，斧声卡拍。三个人各守自己那一棵（站在树的左侧、面朝右），
    // 斧子正好落在那棵的根部（§44 咬合）。老树开工时全体后撤 —— 后撤是**害怕**，不是休息。
    const crew = [[629, .96, 0, 'angry'], [1720, 1.04, 1, 'numb'], [2811, .9, 2, 'bored']];
    crew.forEach(([lx, sc, i, ex]) => {
      const gy = slopeY(lx) + 6, u = U * 1.04 * sc;
      const swing = chopK(i) ? frac(bpOf(t) / 2) : .06 + .05 * Math.sin(T * 2 + i);
      const hit = swing > .84 ? (swing - .84) / .16 : 0;
      clawd(lx - 130 * recoil * (1 - i * .18), gy, u, job('lumberjack', t, {
        view: 'q', flip: false, expr: recoil > .2 ? 'scared' : ex, boilKey: 'log' + i, ...GANG,
        tint: 'green', tintK: .22,
        aR: lerp(.6, 1.05, swing) - .5 * recoil,
        armR: (uu, sw) => PROP.axe(1.1 * uu, .08 * uu, uu * 1.15, {
          swing, spark: hit, chip: chopK(i) ? hit : 0,
        }),
        aL: -.5 - .5 * recoil, dy: -Math.abs(Math.sin(bpOf(t) * Math.PI + i * 1.3)) * .18 + .45 * recoil,
        lookX: .62 - 1.15 * recoil, rot: -.1 * recoil + .06 * (1 - clamp(swing * 2)), light: .08, lightCol: GRN,
        draw: (uu, sw) => gangKit(uu, sw, .25),
      }));
      // R26-2a：**三个樵夫手里都要有一盏大光晕绿灯**（用户："而且三个樵夫都要有，不能只有
      // 第一个才有"）。原来整场只有一盏**钉在坡下杆子上的**灯（下面 P.lantern(..., pole:true)），
      // 人手里什么都没有 —— 可 A2 的盗贼是**举着**火把的。三场"诱惑"的语法必须一致：
      // 光是坏人**拿在手里**带过来的，不是路边装好的。
      // 右手被斧子占了，所以灯挂**左手**掌下：先按 aL 同一个角度算掌点，再按 PROP.lantern
      // 的锚点补偿把灯体垂下去（和奸商那盏蓝提灯完全同一套算法，见 sBlue）。
      const la = -.5 - .5 * recoil;
      // 灯要**和斧子一样有存在感**。第一版给的是 u*.82，而奸商那盏蓝提灯是 U*2.1 ——
      // 结果它挂在手里像一颗绿豆（t=78 复核所见）。提到 u*1.9，光晕半径全部跟着 ls 走。
      const lgu = u * 1.9, lgs = lgu * 1.5;
      const [ghx, ghy] = handPt(lx - 130 * recoil * (1 - i * .18), gy, u, la, -1, {});
      // 和奸商那盏灯同一个坑：光晕圆心取的是灯芯 `ghy + .55*lgs`，不是 `+1.6*lgs`（那在灯体下沿之外）。
      const lcy = ghy + .55 * lgs;
      // 同奸商那盏蓝灯：半径够、不透明度不够，所以"没有大光晕"。量级对齐 A2 火把。
      // 但 hot 配比要比蓝灯克制 —— GRNHOT 偏黄白，抬到 .55 之后整团光读成一颗白球、
      // 只剩灯芯是绿的（t=78 复核所见）。蓝灯那侧 BLUHOT 本身就是浅蓝，可以吃到 .55~.72。
      P.lightPatch(ghx, gy + 8, 430, mixCol(GRN, GRNHOT, .3), .62);
      P.airGlow(ghx, lcy, lgs * 4.6, mixCol(GRN, GRNHOT, .34), 2.15);
      P.halo(ghx, lcy, lgs * 6.2, mixCol(GRN, GRNHOT, .28), 1.8);
      P.halo(ghx, lcy, lgs * 3.0, mixCol(GRN, GRNHOT, .5), 1.45);
      P.halo(ghx, lcy, lgs * 1.05, GRNHOT, 1.0);
      P.lantern(ghx, ghy + 2.6 * lgs, lgu, { col: mixCol(GRN, GRNHOT, .4), pool: false });
      // 咬口的楔子：树干上被砍出来的白茬，斧斧加深（P1#4②"看不出来在砍"）
      if (chopK(i)) {
        const bite = clamp((lt - (falls[i][1] - 3.4)) / 3.4), tw = giantHalf(falls[i][3]);
        const bx = falls[i][0] - tw + 6, by = slopeY(falls[i][0]) - U * 3.4;
        boilSeed('bite' + i);
        paint([[bx, by - 30 * bite], [bx - 34 * bite, by], [bx, by + 30 * bite]],
          { wash: dim(C.crumbLt, .52), fill: C.crumb, fillOp: 65, bleed: .12, tex: .6, ink: PAL.ink, sw: P.swOf(13) });
        if (hit > .1) EV.stepPuff(hitT() - .04, bx - 14, by + 16, U * .9);
      }
    });
    // 锯末混在雪里：白里带木色的斑驳 —— 污染的第一课
    for (let i = 0; i < 12; i++) { boilSeed('dust' + i); const dx = falls[i % 3][0] - giantHalf(falls[i % 3][3]) - 40 + (hash(i) - .5) * 260;
      paint(ellPts(dx, slopeY(dx) + 16 + hash(i + 3) * 22, 5 + 6 * hash(i + 7), 2.4, 7), { wash: mixCol(F.snowLit, C.crumb, .5), washOp: 130, ink: null }); }
    // 第二十四轮 R24-1/4：**clawd 不在这一场里走动了**。他的"看见树一棵棵倒下"的反应链
    // 现在完全由开场的偷看那一拍承担（横缝 + 绿光），本拍只剩伐木队、树和坡 ——
    // 于是"他从画外走进来 / 他站在谁的前面 / 他朝向对不对"这些又要各修一轮的问题不再存在。
    F.snowfall(t, 40, snowK(t), snowWind(t));
    camEnd();
    // R24-4：绿光"没有一直出现"的真正原因不是亮度 —— 它挂在世界 x=360，而本场的镜头
    // 从 780 一路平移到 3620，也就是说它**几乎整场都在画外**。
    // 绿光是"绿光的诱惑"这条主线的主角，所以改成**钉在屏幕上的远方光源**：
    // 画在 camEnd 之后 = 不参与视差，等价于在地平线之外，镜头怎么移它都在。
    // 量级对齐盗贼火把（外圈用饱和的 GRN，只有很小的核心留 GRNHOT）。
    const gk = .5 + .5 * ease(seg(lt, 0, 5.5));
    P.airGlow(1648, 452, 330 * gk, mixCol(GRN, GRNHOT, .40), 1.3);
    P.halo(1648, 452, 205 * gk, mixCol(GRN, GRNHOT, .58), 1.05);
    P.halo(1648, 452, 78 * gk, GRNHOT, 1.0);
    F.wipeIn(lt, ['#2E4258', '#22304A']);
    F.wipeOut(lt, dur, ['#20304E', '#182242']);
  }
  // 坡面高度 = 上面那条 F.slope 折线的解析式（P1#4①：原来两者差 80px，于是所有人都飘在坡上方）
  function slopeY(x) {
    if (x <= 860) return lerp(956, 884, clamp((x + 1200) / 2060));
    if (x <= 1520) return lerp(884, 706, (x - 860) / 660);
    if (x <= 2300) return lerp(706, 632, (x - 1520) / 780);
    if (x <= 3300) return lerp(632, 596, (x - 2300) / 1000);
    return lerp(596, 574, clamp((x - 3300) / 1300));
  }

  // ============================================================ A5 · 95.85–127.72 · 黑湖三张脸
  // §19 的原始事故："倒影是正着的，而且没有那三个坏人的样貌"。
  // §74 A5 重做（用户批准的方案）：**这一场彻底不画倒影了**，一条都不画。
  // 为什么整个换掉：clawd 是一团块状剪影 —— "他的倒影"和"他本人"是同一个形状，于是 P1#5 那一串
  // "没反过来 / 手里没灯 / 湖太小"在"倒影"这条路上根本修不完（每修一条都要在翻转+打碎+对齐里再找
  // 一次平衡，找不齐就是用户"看不了"的那一堆 bug）。现在把这个问题**删掉**：切到他的主观视角，
  // 画面就是一块往**下**看的冰 —— 主观视角里没有任何东西需要翻转。
  //   【0–8.2】  客观镜头：他走到冰湖边、站住、低头；镜头顺着他的视线往冰面压下去。
  //   【8.2】    一眨眼长的黑闪（F.dip，纯 lt 的函数）= 剪辑点。之后整场是他的主观视角。
  //   【8.7–13.7】冰里先**只有他自己**那张吓白的脸（胸口那粒光是这一帧里唯一的暖，而且快熄了）。
  //   【13.6–26.2】三张坏脸按 A2/A3/A4 的出现顺序浮上来，**前一张不退场**（accumulate）→ 到 22.4
  //                三张全在冰里：紫火把 → 蓝灯笼 → 绿灯笼。每人举着**当时诱过他的那盏光**，
  //                光大过脸（用户："这里的光太小"）；表情用 §73 新造的 malice / leer / menace
  //                （慢、低头抬眼看、重心往下沉）—— 是"坏"，不是"不高兴"。
  //   【26.2–28.2】三张一起被冰重新盖住。
  //   【28.0–31.4】回来的只有他自己的难过 → 冰里浮出 Light = Evil。
  // "这是往**下**看一块冰、不是三张脸飘在天上"由六件事一起负责（①②③ 是 PROP.iceLook 自带的）：
  //   ① 冰面开口的弧线压着画面顶；② 冻在冰里的气泡串；③ 落在冰面上**停住**的雪 + 各自的接触影
  //      （只 3+4 片 —— 用户警告过：多了整片湖发白，什么都看不见）；
  //   ④ 画面顶一条**压扁的远岸**（天→星→林线→雪线，一共两百来像素）：地平线被推到顶上 = 镜头
  //      朝下压；并且主观视角里**一片还在飘的雪都没有**（雪全停在冰面上，只有最底下那层霜在动）；
  //   ⑤ 三个主体是**躺在一个平面里**的：竖向着压到 .93，越靠画面底的越大、越完整，最近的那张脚被
  //      画面底截掉（POV 里"我自己的脚下"）；冰皮的气泡与折光压在脸**前面** → 脸在气泡后面 = 深处；
  //   ⑥ 比三张脸**更深**的地方还有一小群鱼（剧本：第一部的湖也有光）—— 冰下有东西在动，冰才有厚度。
  // 顺序仍是"环境 → grade → 光 → 角色 → 粒子"，但这一场的光必须画在脸**之上**（P1#2 的教训：
  // 光源压在角色身上才压得住画面）；"粒子"层就是 povIceSkin —— 冰皮在最上面，所以全都关在冰里。
  // A5 专用①：把冰中之物重新**盖回冰里**。这就是本场的淡入淡出 —— p5.brush 不认 globalAlpha，
  // 于是"淡出"一律画成"冰长回来把它埋掉"（三层递减的冷 wash，边缘洇开，越埋越厚）。
  function iceVeil(x, y, w, h, k = 1) {
    if (k <= .01) return;
    boilSeed('iceveil' + Math.round(x / 9) + '_' + Math.round(y / 9));
    for (let i = 0; i < 3; i++) {
      const q = 1 - i * .16;
      paint(ellPts(x, y - h * .12 * i, w * q, h * q, 22, w * .012),
        { wash: mixCol('#0A1024', '#2E4C86', .22 + i * .28), washOp: (126 + i * 42) * clamp(k), bleed: .44, tex: .85, ink: null });
    }
  }
  // A5 专用②：画在所有冰中之物**之上**的那层冰皮：冰内横向折光 + 压在脸前的气泡 + 停住的雪
  //（越靠画面底越大）+ 他自己的呼气在冰上结的霜。和 iceLook 分工：iceLook 是**那块冰**，
  // 这一层是"这些东西在冰**里**"。
  // 第十七轮 10：能证明"这是冰湖面"最省力的一个元素，是**月亮掉在冰里**。
  // 它常驻（不按节拍出现/消失，否则又成了"闪现"），而且必须是**被冰揉过**的样子：
  // 盘缘糊掉、外面一圈蒙蒙的华光、月面上横着几道被折光撕开的裂口 —— 天空里的月亮是圆的，
  // 冰里的月亮是"一片"。
  function iceMoon(cx, cy, rx, ry, k = 1) {
    // R27-3：月亮原来被**刻意放在右上角空着的那一角**（`cx + rx*.46, cy - ry*.56` → 世界 1627,540），
    // 当时的理由是"三张脸在左/中/右，月亮只能待在右上"。用户这一轮要的正相反 ——
    // 樵夫（x=800、脚 y=1200、u=56 → 头顶约 752）应该**挡住月亮**。
    // 所以把它挪到他头顶上方，让两个圆重叠；重叠关系见下面调用处的 `k`。
    // （这条注释记录的是**已被取代**的决定，不是要恢复它。）
    const mx = cx - rx * .11, my = cy - ry * .26, r = Math.min(rx, ry) * .23;
    boilSeed('icemoon');
    P.halo(mx, my, r * 3.1, '#BFD8F2', .16 * k);
    // 盘缘糊掉：同一只盘子画三遍，半径递增、alpha 递减，边缘就不是一条干净的弧。
    for (let i = 0; i < 3; i++)
      paint(ellPts(mx, my, r * (1 + i * .09), r * (.98 + i * .1), 40, 0),
        { wash: mixCol('#9FC0E4', '#E8F2FF', .3), washOp: (74 - i * 22) * k, bleed: .55, tex: .95, ink: null });
    paint(ellPts(mx - r * .18, my - r * .14, r * .5, r * .44, 26, 0), { wash: '#EAF4FF', washOp: 44 * k, bleed: .4, tex: .8, ink: null });
    // 冰把月亮撕成几道横片 —— **片必须比盘子窄**。
    // 第二十轮 R20-6：上一版每条 `rectPts` 宽 `r*2.24`，而盘径只有 `2r` —— 四条直条两头都探出
    // 盘缘、等距、几乎不洇（bleed .3），于是"被折光撕开的月面"在成片里读成"圆盘压了个条形码"
    // （f02612 裁切）。现在半宽最多 .76r，缩在盘里，位置/厚度都不等。
    for (let i = 0; i < 3; i++) {
      const half = r * (.42 + .34 * hash(i * 5.7));
      const yy = my - r * .5 + hash(i * 3.1) * r * .95;
      paint(rectPts(mx - half, yy, half * 2, r * (.09 + .07 * hash(i + 9)), r * .04),
        { wash: mixCol('#0C1330', '#243056', .3), washOp: (54 + i * 12) * k, bleed: .42, tex: .7, ink: null }); }
  }
  function povIceSkin(cx, cy, rx, ry, k = 1) {
    if (k <= .02) return;
    const ice = mixCol('#0C1330', '#9FC4E8', .36);
    boilSeed('povskin');
    // R27-3：冰皮是**最上面一层**（"全都关在冰里"），所以月亮画在樵夫身上。
    // 但这是倒影，不是前景挡后景 —— 不能全遮挡，于是把 k 压到 .6：
    // 他的头从月盘里透出来，月盘也还在他头上留着一圈，两层叠在一起。
    iceMoon(cx, cy, rx, ry, k * .6);                     // 月亮在冰里，气泡和雪在它前面
    for (let i = 0; i < 3; i++) {                        // 横折光：横纹 = 一层平面，不是天空
      const yy = cy - ry * .3 + i * ry * .44;
      paint(ellPts(cx + (hash(i * 3.3 + 1) - .5) * rx * .6, yy, rx * (.44 + .26 * hash(i * 2.1)), ry * .03, 20, 1),
        { wash: ice, washOp: 30 * k, bleed: .34, tex: .85, ink: null });
    }
    for (let i = 0; i < 7; i++) {                        // 气泡串压在脸前面 → 脸在气泡后面 → 脸在深处
      const a = hash(i * 4.7 + 3) * TAU, rr = .14 + .6 * hash(i * 6.3 + 5);
      const bx = cx + Math.cos(a) * rx * rr, by = cy + Math.sin(a) * ry * rr, r = 2 + 3.2 * hash(i * 2.7 + 9);
      paint(ellPts(bx, by, r, r * .9, 7), { wash: mixCol(ice, '#FFFFFF', .35), washOp: 82 * k, ink: null });
    }
    for (let i = 0; i < 4; i++) {                        // 停住的雪：越靠画面底越大 = 近大远小
      const fy = cy + (.1 + .84 * hash(i * 9.1 + 2)) * ry, fx = cx + (hash(i * 7.3 + 4) - .5) * rx * 1.5;
      const r = (7 + 11 * hash(i * 2.3 + 6)) * (.5 + 1.1 * clamp((fy - cy + ry) / (ry * 2)));
      paint(ellPts(fx, fy + r * .2, r * 1.6, r * .48, 12), { wash: mixCol('#0A0F22', '#4E627E', .5), washOp: 74 * k, bleed: .3, ink: null });
      paint(ellPts(fx, fy, r, r * .8, 9), { wash: '#E9F1FA', washOp: 210 * k, fill: '#FFFFFF', fillOp: 120 * k, bleed: .1, ink: null });
    }
    const br = .3 + .7 * (.5 + .5 * Math.sin(T * 1.02)); // 一收一放：只有站在湖边低头的人才呼得着冰面
    for (let i = 0; i < 3; i++) paint(ellPts(cx + (i - 1) * 84, cy + ry * (.5 + i * .1), rx * (.26 + i * .07), ry * (.13 + i * .04), 18, 3),
      { wash: mixCol('#CFE0F0', '#0C1330', .42), washOp: (20 + i * 9) * k * br, bleed: .42, tex: .8, ink: null });
  }
  // A5 专用③：一盏**大而匀**的冷光。props.js 的 airGlow / halo 在半径上千像素时会露出多边形的
  // 直边（它们的顶点数是照"一个人举着的灯"定的，§57 只在灯那么大的尺度上成立），而这一场要的是
  // "三盏淹掉半幅画的诱"。所以本地叠五层 54 顶点 + 大 bleed 的 wash：中心最亮、往外连续褪，
  // 数不出边。flat=true 时压成横椭圆 —— 光是**铺在冰层里**的一层平面，不是空气里的一个球。
  function iceGlow(x, y, r, col, k = 1, flat = false) {
    if (k <= .02 || r < 8) return;
    boilSeed('iceglow' + Math.round(x / 11) + '_' + Math.round(y / 11) + (flat ? 'f' : 'r'));
    const hot = P.hotOf(col);
    for (let i = 0; i < 5; i++) {
      const q = 1 - i * .19;
      paint(ellPts(x, y - r * .015 * i, r * q, r * q * (flat ? .3 : 1), 54, r * .028),
        { wash: mixCol(mixCol(col, hot, .16 + i * .17), '#060A18', flat ? .12 : .3), washOp: 255 * k * (.13 + i * .1), bleed: .85, tex: .9, ink: null });
    }
  }
  function sLake(t, lt, dur) {
    const t0 = B[4], CUT = 8.2;                          // CUT：下摇到底 + 一眨眼 = 切到主观视角
    const shoreY = 592, iceY = 742;
    const blink = clamp(1 - Math.abs(lt - CUT) / .24);
    if (lt < CUT) {
      // ---------------- 客观镜头：走到湖边、站住、低头，镜头顺着视线往冰面压下去
      const walk = F.walkTo(t, t0, t0 + 5.4, 700, 962, U, 'walk', 'side');
      const down = ease(seg(lt, 5.4, 7.0)), push = ease(seg(lt, 5.8, CUT));
      const litL = .26 - .17 * ease(seg(lt, 4.6, 7.9));  // 他那盏灯越来越小
      camBegin(lerp(walk.x + 130, 992, push) + 7 * Math.sin(lt * .4), lerp(604, 880, push), lerp(1.05, 2.15, push));
      F.sky(mixCol(F.SKY, '#141A34', .5));
      F.skyBand(150, 1180, 128, mixCol(F.SKYLO, '#141A34', .5), .7);
      F.stars(5, 52, 200);
      F.ground(shoreY, F.snow, F.snowSh, { horizon: shoreY - 34, top: 40, lit: false });
      treeline(-140, shoreY - 4, 15, E.fir * .42, { span: 3300, rows: 1, snowK: .35, tone: mixCol(C.sapDk, F.SKY, .76) });
      // 一整片冻湖：从对岸雪线一直铺到画面底以外（P1#5③"湖太小"→ 现在它铺满下半个画面）
      F.ground(1500, mixCol('#26325C', F.snowSh, .28), mixCol('#16204A', F.INK, .3), { horizon: shoreY + 2, top: 300, lit: false });
      F.water(960, shoreY + 700, 3400, 780, '#1B2444', .55);
      // 风刮出的冰纹。第二十轮 R20-7：原来这 4 条**等距（`shoreY+120+i*110`）、几乎水平
      // （整条只起伏 14px）、横穿 1660px** —— 三条"长、直、等距"占全了，于是这一拍在成片里是
      // "画在横线纸上的一个盒子"（f02400）。冰纹是**断的、斜的、粗细不匀的**：
      // 每条只走一小段、纵向有起伏、彼此间距由 hash 决定。
      for (let i = 0; i < 6; i++) {
        boilSeed('istreak' + i);
        const x0 = 90 + hash(i * 1.7) * (W - 900), L = 320 + hash(i * 2.3) * 620;
        const yy = shoreY + 90 + hash(i * 4.1) * 460, slope = (hash(i * 5.9) - .5) * .1;
        const pts = []; for (let q = 0; q <= 5; q++) pts.push([x0 + L * q / 5, yy + L * slope * q / 5 + (hash(i * 7 + q) - .5) * 15]);
        inkLine(pts, .8 + .9 * hash(i + 11), mixCol(C.ice, '#FFFFFF', .2 + .3 * hash(i + 13)), 'inkfine', .35);
      }
      P.iceCrack(700, iceY + 96, 900, U * .95, seg(lt, 3.4, 7.4));   // 一道裂缝从他脚边慢慢爬过（轻轻的"咔"）
      F.grade(.5);
      P.lightPatch(walk.x, iceY + 34, 250, WARM, .5 * clamp(litL * 3.4));
      beatTrail(t, t0, t0 + 5.4, 700, 962, iceY + 2, U * 1.15, { life: 8 });   // 岸到湖心的脚印，越来越乱
      F.hero(walk.x, iceY, U, t, {
        ...walk, cold: .86, light: litL * (.7 + .3 * Math.sin(t * 3.1)),
        gloom: .2 * down, boilKey: 'hero5',
        // 第二十四轮 R24-5：低头那一拍原来给的是 `wide + open` —— 那是**惊讶**，
        // 用户："不够惊恐，那个只是惊讶"。
        // ⚠ 第一次提交写的是 `expr:'panic'`，那是**死代码**：`expr` 由 jobs.js 的 `job()` 解析，
        //   clawd() 根本不读这个键，所以 F.hero(..., {expr}) 什么也不会发生（A5 那版"修好了"
        //   其实一帧都没变）。这里把 EMO.panic 的字段摊平写出来 —— 瞪到最大却没有瞳孔的眼睛、
        //   O 形嘴、失色的脸、重心后缩 + 高频抖、手臂甩起来。
        ...(down > .35
          ? { eyes: 'scared', mouth: 'O', tint: 'pale', tintK: .8,
              lookX: .55 * Math.sign(Math.sin(t * 3.7)), lookY: -.15,
              dx: -.34 + .06 * Math.sin(t * TAU * .9), sq: .12 + .05 * Math.abs(Math.sin(t * TAU * 27)),
              rot: -.12, aL: 1.15 + .12 * Math.sin(t * TAU * 27), aR: 1.2 - .12 * Math.sin(t * TAU * 27) }
          : { eyes: 'narrow', mouth: 'flat', lookX: 0, lookY: lerp(.18, 1, down),
              sq: .06 + .04 * Math.sin(t * 2), aL: -.94, aR: -.9 }),
      });
      onBeatBreath(t0 + 5.6, walk.x + 26, iceY, U * .9, 6);
      F.snowfall(t, 20, F.snowWeather(t, t0, t0 + 6.2, 2, .72), -14);   // 无风的慢雪，连续褪（§E / L6）
      camEnd();
    } else {
      // ---------------- 主观视角：一整块往下看的冰（这里没有任何东西需要翻转）
      const cx = 960, cy = 820, rx = 1450, ry = 500;     // 冰面开口的椭圆：顶弧 = 湖的对岸
      camBegin(cx + 6 * Math.sin(lt * .27), 620 + 8 * Math.sin(lt * .19), 1 + .035 * ease(seg(lt, CUT, 30.6)) + .012 * Math.sin(lt * .8));
      // ④ 画面顶：压扁的远岸（天 / 星 / 林线 / 雪线）—— 地平线在顶上，镜头就是朝下压的
      F.sky(mixCol(F.SKY, '#10162E', .55));
      F.stars(3, 104, 196);
      F.ground(360, mixCol(F.snowSh, F.SKY, .5), mixCol(F.snowDeep, F.INK, .4), { horizon: 250, top: 60, lit: false });
      treeline(-200, 262, 16, E.fir * .19, { span: 3200, rows: 1, snowK: .18, tone: mixCol(C.sapDk, '#0E1526', .87) });
      // ①② 那块冰本体：体积渐变 + 冻气泡 + 冰内折光 + 开口的边 + 停住的雪
      P.iceLook(cx, cy, rx, ry, 1, { flakes: 3, deep: '#050A16', top: '#1A2447' });
      // 冰下缓慢移动的暗流纹理（剧本：中景）。它同时负责把 iceLook 那四层同心渐变**揉开** ——
      // 不揉的话中心读起来是一个弹坑底，而不是一层有厚度的冰。
      for (let i = 0; i < 9; i++) {
        boilSeed('current' + i);
        const qy = cy - ry * .78 + i * ry * .23, drift = Math.sin(t * .12 + i * 1.7) * rx * .07;
        paint(ellPts(cx + drift + (hash(i * 3.1) - .5) * rx * .7, qy, rx * (.34 + .24 * hash(i * 2.7)), ry * (.06 + .03 * hash(i)), 22, 2),
          { wash: mixCol('#121B38', '#2C3B67', .4 + .55 * hash(i * 5.3)), washOp: 42, bleed: .6, tex: .9, ink: null });
      }
      // 再压一层均匀的中间调把同心环**冲淡**，然后用两笔大 bleed 的软心把深度找回来。
      // 根因：iceLook 那四层是 30 个顶点、半径 1450px 的多边形 —— 一条"边"就有 300px 长，
      // 摆在主观视角正中间就是看得见的直边（§57：数得出边就变成"一个东西"，不是"一层体积"）。
      boilSeed('iceflat');
      paint(ellPts(cx, cy, rx * .99, ry * .99, 44, rx * .02), { wash: '#18224A', washOp: 118, bleed: .8, tex: 1, ink: null });
      paint(ellPts(cx, cy + ry * .04, rx * .58, ry * .6, 40, rx * .03), { wash: '#0C1430', washOp: 130, bleed: .85, tex: 1, ink: null });
      paint(ellPts(cx, cy + ry * .1, rx * .3, ry * .33, 34, rx * .03), { wash: '#070C1E', washOp: 115, bleed: .9, tex: 1, ink: null });
      // 冻在冰里的旧裂纹：几条从开口边一路爬过去的白线，它们**切断**那四层同心渐变，于是
      // "弹坑"被读成"一层有厚度的冰"（剧本：一道裂缝从他脚边慢慢爬过 —— 这里是他低头看见的、
      // 冰里早就冻着的那几条）。
      // R20-6 的同一族病：原来每条 x 单调前进约 780px 而 y 只抖 ±65px，三条又等距起头 ——
      // 长、直、等距，读成横穿冰面的 ruled lines，不是裂纹。裂纹是**斜着走**的：
      // 给它一个净方向，纵向位移和横向同量级，三条各自起头。
      for (let i = 0; i < 3; i++) {
        boilSeed('povcrack' + i);
        const x0 = cx - rx * .82 + i * rx * .5 + hash(i * 9.1) * rx * .16;
        const y0 = cy - ry * .46 + hash(i * 4.3) * ry * .95;
        const dir = hash(i * 2.7) > .5 ? 1 : -1, dy = ry * (.09 + .11 * hash(i * 6.3));
        const pts = [[x0, y0]];
        for (let k = 1; k <= 9; k++) pts.push([x0 + k * rx * (.02 + .022 * hash(i * 3 + k)),
          y0 + k * dy * dir + (hash(i * 5.1 + k * 3) - .5) * ry * .3]);
        inkLine(pts, .95, mixCol(C.ice, '#16204A', .6), 'inkfine', .1);
        const bx = x0 + rx * .1, by = y0 + dy * 4 * dir;
        inkLine([[bx, by], [bx + rx * .07, by + ry * .22 * dir], [bx + rx * .02, by + ry * .42 * dir]], .75, mixCol(C.ice, '#16204A', .7), 'inkfine', .1);
      }
      F.grade(.24);                                      // 主观视角里夜只压一点：冰自己就是黑的
      // ⑥ 比三张脸更深的一小群鱼：它们的灯还亮着（剧本：第一部的湖也有光，和第二部的河呼应）
      for (let i = 0; i < 3; i++) P.fish(cx - 780 + i * 130 + Math.sin(t * .28 + i * 2.1) * 110, 418 + i * 26, U * .44, { lit: .34, dir: -1 });
      iceVeil(cx - 320, 424, rx * .46, ry * .2, .42);    // 盖厚：鱼在很下面
      // 冰里先只有他自己 —— 吓白的脸，从深处慢慢长上来
      const meK = ease(seg(lt, 8.7, 11.0)) * (1 - ease(seg(lt, 12.4, 13.7)));
      if (meK > .015) {
        const my = 1168, mu = 42 + 30 * meK;
        push(); translate(960, my); scale(1, .93); translate(-960, -my);
        F.hero(960, my, mu, t, { ...feel('scared', t), view: 'front', cold: .9, light: .13 * (1 - ease(seg(lt, 11.6, 13.6))), gloom: .3, boilKey: 'heropov', noShadow: true });
        pop();
        iceVeil(960, my - mu * 5.2, mu * 6.8, mu * 6.4, .3 + .7 * (1 - meK));
        P.halo(960, my - mu * 3.3, mu * 1.5, WARM, .55 * meK);
        P.lightPatch(960, my + mu * .3, mu * 4.2, WARM, .3 * meK);
      }
      // 三张坏脸：按出现顺序浮上来，**前一张不退场**；每人举着当时诱过他的那盏光。
      // [工种, 表情, 光的颜色, 灯, x, 脚y, u, 举哪只手, 那只手的高度, 起, 满]
      // —— 越靠画面底的越大 = 越近；手一律压得低低的，光从下往上打脸（恐怖片最狠的打光）。
      // 光的颜色必须是**发光档**：FILM 色板里的 VIO/BLU/GRN 是材质档（TONE.warm=.58，暗），
      // 直接拿去做光就成一团灰雾。这里按同一色相往前提一档（§71 的办法），绝不往奶油白混（§52）。
      // 第十七轮 1：冰里浮出来的也是**同一伙人**，所以三顶帽子同一款；
      // 认人靠"紫火把 / 蓝灯笼 / 绿灯笼"和帽带上的记号，不靠貂皮帽和安全帽。
      // 第二十四轮 R24-6：冰湖影像里**三张脸原来全是 `thief`** —— 用户一眼看出"奸商被画成盗贼了"。
      // 这三张脸是"三伙坏人"的浓缩：紫火把=盗贼、蓝提灯=奸商、绿灯=樵夫。
      // ⚠ 只改 job 名不够：`...GANG` + `gangKit()` 是**盗贼团共用的斗篷/围巾/帽带**，
      //    套在奸商和樵夫身上会把他俩也刷成同一伙人（第十七轮 1 刚为此把三个人统一过）。
      //    所以最后那个字段 `kit` = 只有盗贼才穿团服。
      const CAST = [
        ['thief', 'malice', '#A76BE0', 'torch', 430, 780, 40, 1, -.45, 13.6, 15.8, 1],
        ['huckster', 'leer', '#4E82E8', 'lantern', 1472, 860, 44, 1, -.45, 16.8, 19.0, 0],
        ['lumberjack', 'menace', '#6FCB62', 'lantern', 800, 1200, 56, 1, .15, 20.2, 22.4, 0],
      ];
      const sink = ease(seg(lt, 26.0, 27.6));            // 一起被冰重新盖住
      const lamps = [];
      for (let i = 0; i < CAST.length; i++) {
        const [jn, ex0, col, kind, fx, fy, fbu, side, ah, tIn, tFull, kit] = CAST[i];
        const up = ease(seg(lt, tIn, tFull)), k = up * (1 - sink);
        if (k <= .015) continue;
        const u = fbu * lerp(.62, 1, up), ex = feel(ex0, t);   // 举灯那只手压得低低的：光从下往上打脸
        push(); translate(fx, fy); scale(1, .93); translate(-fx, -fy);     // ⑤ 躺在冰面这个平面里
        clawd(fx, fy, u, job(jn, t, {
          view: 'front', boilKey: 'povface' + i, expr: ex0, gloom: .42, light: .05, lightCol: col,
          noShadow: true, armL: null, armR: null, aR: side > 0 ? ah : ex.aR, aL: side < 0 ? ah : ex.aL,
          ...(kit ? { ...GANG, draw: (uu, sw) => gangKit(uu, sw, .18, i) } : {}),
        }));
        pop();
        // 就算浮到最满也永远留着三分被埋的量 —— 那三分冰就是"他在冰**里**"的证据
        iceVeil(fx, fy - u * 4.8, u * 6.6, u * 6.2, .22 + .78 * (1 - k));
        lamps.push([fx, fy, u, ah, side, col, kind, k, ex]);
      }
      for (const [fx, fy, u, ah, side, col, kind, k, ex] of lamps) {
        // 掌心那一点 = handPt() 的逆换算，再按表情自己的 rot/dx/dy 转过去，灯才真的在手里
        const [hx0, hy0] = handPt(fx, fy, u, ah, side);
        const rr = ex.rot || 0, dxx = (ex.dx || 0) * u, dyy = (ex.dy || 0) * u;
        const ox = hx0 - fx, oy = hy0 - fy - dyy;
        const hx = fx + dxx + ox * Math.cos(rr) - oy * Math.sin(rr);
        const hy = fy + dyy + ox * Math.sin(rr) + oy * Math.cos(rr);
        const fl = 1 + .07 * Math.sin(t * 6.3 + hx * .01);
        const lu = kind === 'torch' ? u * 2.2 : u * 2, s = kind === 'torch' ? lu * 2.1 : lu * 1.5;
        const gy0 = kind === 'torch' ? hy - s * 2.1 : hy + s * .55;      // 火苗的中段 / 灯芯
        // **光大过脸**（用户："这里的光太小"）。三层：空气里的一团（两笔 iceGlow）+ 一颗热芯
        // （P.halo，半径小、露不出边）+ 铺在冰层里的两摊平面光（flat iceGlow —— 横椭圆才是在**平面**
        // 里散开，圆的是天上的灯）。色一律用 CAST 里的**发光档**材质色：halo / iceGlow / flame 内部
        // 各自还要 hotOf 在自己的色相里提一次亮；传 FILM 的 VIO/BLU/GRN（材质档 .58）= 一团灰雾，
        // 传 VIOHOT = 提两次 = 一滩白（§52 的老病灶：紫火把照出一滩米灰）。
        iceGlow(hx, gy0, s * 2.6 * fl, col, .42 * k);
        iceGlow(hx, gy0, s * 1.8 * fl, col, .5 * k);
        iceGlow(hx, gy0 + s * 1.3, s * 5.6 * fl, col, .58 * k, true);
        iceGlow(hx, fy + u * .5, s * 8.5 * fl, col, .26 * k, true);
        P.halo(hx, gy0, s * .8 * fl, col, 1.05 * k);
        P.halo(hx, gy0, s * .36 * fl, col, .85 * k);
        // 灯**最后**画：先铺光再落灯体，否则灯壳被自己的光晕洗成一个认不出来的圆球 ——
        // 观众必须认出"这是一支火把 / 这是一盏提灯"，那是诱过他的三样东西。
        if (kind === 'torch') P.torch(hx, hy, lu, { col, pool: false });
        else P.lantern(hx, hy + s * 2.6, lu, { col, pool: false });       // 灯体挂在掌心下面
        P.litFace(fx + side * u * 1.6, fy - u * 5.6, u * 8.6, u * 5.8, col, 1.05 * k, side);
        iceVeil(hx, gy0 + s * .3, s * 4.6, s * 3.8, clamp(1 - k * 1.2));   // 灯也一起被冰埋回去
      }
      // 三张脸沉回去以后，回来的只有他自己的难过
      const sadK = ease(seg(lt, 27.0, 29.2));
      if (sadK > .015) {
        const sy = 1210, su = 42 + 26 * sadK;
        push(); translate(960, sy); scale(1, .93); translate(-960, -sy);
        F.hero(960, sy, su, t, { ...feel('sad', t), view: 'front', cold: .96, light: .06, gloom: .34, emote: null, boilKey: 'heropov2', noShadow: true });
        pop();
        iceVeil(960, sy - su * 5, su * 6.8, su * 6.2, .3 + .7 * (1 - sadK));
        P.halo(960, sy - su * 3.2, su * 1.1, WARM, .28 * sadK);            // 只剩一针那么大的暖
      }
      // 冰里浮出来的字：先一道往冰里洇的冷色刻痕底，再落字（可读的手写体，和片名同一支笔的路子）
      const wordK = ease(seg(lt, 29.2, 30.4)) * (1 - ease(seg(lt, 31.1, 31.6)));
      if (wordK > .02) {
        boilSeed('wordplate');
        paint(ellPts(cx, 506, 470, 74, 24, 3), { wash: mixCol('#9FC4E8', '#0C1330', .45), washOp: 56 * wordK, bleed: .46, tex: .8, ink: null });
        // 第十七轮 11：字样改成 `LIGHT? EVIL?`（两个问句比一个等式更疼 —— 他不是在下结论，是在问）。
        // 顺带修掉第十一轮的漏网：这里曾硬写着 Patrick Hand，把全片统一的 Caveat 破掉了。
        letter('LIGHT? EVIL?', cx, 500, 116, mixCol('#DCEAF8', '#8FB4D8', .45), { font: F.HAND(116), alpha: .84 * wordK, rot: -.014 });
      }
      povIceSkin(cx, cy, rx, ry, 1);                   // ⑤ 冰皮在最上面：折光、气泡、停住的雪、眼前的霜
      camEnd();
    }
    F.dip(blink * .9, '#060A16');                      // 一眨眼长的黑闪 = 那个剪辑点本身
    F.wipeIn(lt, ['#20304E', '#182242']);
    F.wipeOut(lt, dur, ['#181F3C', '#12182F']);
  }

  // ============================================================ A6 · 127.72–142.72 · 谷底
  function sBottom(t, lt, dur) {
    const t0 = B[5], x = 830, gy = 812;
    // L7：这一场是"世界压在他头上"。镜头从 1.18 一路顶到 1.62 —— 树桩的影子因此真的盖过来，
    // 而不是一个固定机位看人蜷着。
    camBegin(x + 10 * Math.sin(lt * .4), 620, lerp(1.18, 1.62, ease(seg(lt, 0, 15))));
    F.sky('#12182F');
    F.ground(gy + 6, mixCol(F.snow, '#8E9CBC', .55), F.snowDeep, { lit: false });
    // 一个树桩的影子恰好罩着他：世界压在他头上（A4 的罪行延伸到这里）
    P.stump(1210, gy + 12, stumpOf(7.4)[0], { wide: STUMP_WIDE, snow: true, seed: 3 });   // 第十七轮 7：原来用 E.stumpGiant*.95=1.71，比 clawd 高 1.7 倍
    F.grade(.52);
    boilSeed('stumpShadow');
    paint(ellPts(960, gy + 26, 330, 46, 20, 6), { wash: mixCol(F.snowDeep, F.INK, .5), washOp: 80, ink: null });
    // 一路蜿蜒到这里的乱脚印：来时的挣扎全写在雪上（L5：原来 u=21 → 一只坑 9px，等于没有）
    printRow(280, gy + 14, 16, 74, U * 3.3, { dir: 1, fade: .85 });
    // 从跪到蜷：把自己收成一团，额头抵着雪
    const curl = ease(seg(lt, .5, 2.6)), lit = .12 * (1 - .62 * ease(seg(lt, 3.4, 9.6)));
    F.hero(x, gy, U, t, {
      view: 'front', cold: .86, light: lit * (.6 + .3 * Math.sin(T * 1.3)),
      eyes: 'closed', mouth: null, sq: .16 + .18 * curl, dy: 2.5 * curl, rot: .1 * curl,
      aL: -1.26, aR: -1.26, gloom: .36, emote: null, boilKey: 'hero6',
    });
    // 雪在他背上一片片积起来；呼气越来越小、间隔越来越长
    const topY = gy + 2.5 * U * curl - 8 * U * (1 - (.16 + .18 * curl) * .6);
    for (let i = 0; i < 3; i++) { boilSeed('set' + i); paint(ellPts(x + (i - 1) * 36, topY + i * U * .8, U * (.56 - i * .12) * curl, U * .12 * curl, 10, 1.5), { wash: F.snowLit, washOp: 165 * curl, ink: null }); }
    const br = 1 - ease(seg(lt, 4, 10));
    if (br > .05) for (let i = 0; i < 2; i++) P.breathFog(x + 32, gy - 5 * U + 2.2 * U * curl, U * (.7 + .5 * br) * br, frac(lt * (.2 + .12 * br) + i * .5));
    // 黑暗里右上角出现一粒暖黄，有节奏地一明一灭（呼吸式的闪法，和雪不同）
    [[1520, 498, 10.4], [400, 556, 11.5], [1190, 466, 12.6]].forEach(([fx, fy, at], i) => {
      const a = seg(lt, at, at + 2.6);
      if (a <= 0) return;
      P.firefly(lerp(fx, x + (i - 1) * 66 + 24, ease(a)), lerp(fy, gy - 4.6 * U + i * 13, ease(a)), U * 1.2, { k: .92 });
    });
    F.snowfall(t, 34, snowK(t, { peak: 1.5 }), snowWind(t));   // 安眠雪：很慢很大的雪片
    camEnd();
    F.wipeIn(lt, ['#1A2440', '#20283E']);
    if (lt > dur - .8) F.irisOut(W * .5, H * .5, seg(lt, dur - .8, dur - .06));
    else if (lt < .5) F.irisIn(W * .5, H * .5, lt / .5);
  }

  // ============================================================ A7 · 142.72–178.35 · 萤火虫
  // 前三盏光都是"把他拽去看真相"，这一盏是**请他走**。所以这一段是全片第一次他主动跟着光跑。
  // 转场 in = 从他的眼睛特写拉开（A6 的 iris 收在黑湖里，这里从同一只眼睛里睁开）。
  // §71 P1#6 —— 他原来在飘：位置由一条 kf() 管、步态由另一条 walkTo 管，两套时钟一不同步
  // （kf 在 6.2–12.4 和 31–35.6 这两段明明在位移，walk 却是 null）= 滑行。
  // 现在位移与步态**同源**：整条路是一条 walkChain，每一段都自己决定 x、朝向、步态、起伏。
  function sFireflies(t, lt, dur) {
    const t0 = B[6], gy = 856;
    const open = ease(seg(lt, 0, 5.4));                        // 5.4 秒从"一只眼睛"退到"一条林子"
    const lead = ease(seg(lt, 6.2, 12.4));                     // 0=围着他，1=排成一条往深处的路
    const mv = walkChain(t, [
      [t0 + 6.2, t0 + 12.4, 780, 'walk'], [t0 + 12.4, t0 + 19.4, 1150, 'run'],
      [t0 + 19.4, t0 + 22.8, 1188, 'walk'], [t0 + 22.8, t0 + 31, 1690, 'run'], [t0 + 31, t0 + 35.6, 1850, 'walk'],
    ], 596, U, 'side');
    const hx = mv.x;
    camBegin(hx + 34 * Math.sin(lt * .3), kf(lt, [[0, 742], [5.4, 736], [12.4, 706], [22.8, 700], [35.6, 676]]), lerp(5.6, 1.05, open) + .012 * Math.sin(lt * .5));
    // 天：雪云散了一角。不是日出 —— 是"世界从纯黑退回深蓝"
    const lift = ease(seg(lt, 2, 26));
    F.sky(mixCol('#0B1024', '#1B2544', lift));
    F.skyBand(206, 1520, 152, mixCol(F.SKYLO, '#3B4C78', .42), .45 + .3 * lift);
    if (lift > .3) F.stars(6, 74, 300);
    moon(1560, 246, 60, .34 - .3 * lift);
    treeline(120, gy - 116, 12, E.fir * .52, { span: 2600, rows: 2, snowK: .92, tone: mixCol(C.sapDk, '#22305A', .45 + .3 * lift) });
    treeline(420, gy - 176, 7, E.fir * .34, { span: 2100, rows: 1, snowK: .7, tone: mixCol(C.sapDk, '#2A3A62', .62) });
    F.ground(gy + 16, F.snow, F.snowSh, { horizon: gy - 192, top: 250 });
    P.fir(2140, gy + 6, E.firOld * .8, { seed: 12, old: true, snowK: 1, wind: .3 });
    F.haze(gy + 16, .3);
    F.grade(.5 - .13 * lift);
    // L5：脚印一律画在夜色层**之后**（前面"有人"走过的一条被踩实的浅路 —— 不解释是谁，
    // 萤火虫认识这条路），并且每一拍一只、拖在身后、被落雪一寸寸填平
    printRow(300, gy + 10, 24, 76, U * 3.3, { dir: 1, fade: .42 });
    beatTrail(t, t0 + 6.2, t0 + 35.6, 596, 1850, gy + 12, U * 1.05, { life: 8, keep: 26 });
    // R24-7：2:45–2:55（场内 lt 22.3–32.3）雪地上出现一路驯鹿蹄印，往**右前方**去 ——
    // 观众先看见"有鹿往这边走过"，再在 2:55 看见那团越来越完整的黄光，
    // 于是"快见到圣诞老人了"是**被推出来的结论**，不是字幕给的。
    deerTrackLine(1240, 2240, gy + 16, U * .72, ease(seg(lt, 20.6, 30.4)));
    // 萤火：12 粒。围住他 → 排成一条歪歪扭扭的线；最前面那两只倒飞回来等他
    const head = lerp(hx + 90, 2120, lead);
    for (let i = 0; i < 12; i++) {
      const ph = T * (.4 + .3 * hash(i)) + hash(i + 5) * TAU, q = (i + .5) / 12;
      const cx = hx + (hash(i + 2) - .5) * 300, cy = gy - 3.1 * U - hash(i + 3) * 2.8 * U;
      const lx = lerp(hx + 60, head, q), ly = gy - 4.4 * U - 66 * Math.sin(q * 3.1 + T * .35);
      const fx = lerp(cx, lx, lead) + Math.cos(ph) * 34, fy = lerp(cy, ly, lead) + Math.sin(ph * 1.35) * 26;
      P.firefly(fx, fy, U * (1.5 + .9 * hash(i + 7)), { col: WARM, dir: lead > .5 ? 1 : -1, k: .95 });
      if (i % 4 === 0) P.lightPatch(fx, gy + 12, 165, WARM, .4);     // 全片第一次：雪地是暖的
    }
    // 他抬起手，一只停在指尖（特写那一拍半：光映在他眼里）
    const raise = ease(seg(lt, 1.6, 3.2)) * (1 - ease(seg(lt, 5.6, 6.6)));
    // 跌倒：雪很软，爬起来继续 —— 这一跤是"他愿意跟"的代价
    const trip = seg(lt, 19.4, 22.8), fall = ease(trip) * (1 - ease(seg(lt, 21.6, 22.8)));
    F.hero(hx, gy + 2, U, t, {
      view: lt < 6.2 ? 'front' : mv.view, flip: mv.flip, walk: mv.walk,
      cold: lerp(.62, .42, lift), light: .3 + .22 * ease(seg(lt, 7.4, 9.6)) + .1 * Math.sin(T * 2.4),
      // 第十七轮 4：A7 在拿到袋子**之前**，所以这里不许是 happy/smile。
      // 他跟着光走的情绪是"小心翼翼的一点点指望"，不是高兴 —— 眼睛睁大、嘴抿着、身体还在缩。
      eyes: lt < 1.6 ? 'closed' : 'wide', mouth: lt < 6.2 ? 'open' : 'flat',
      lookX: lt < 6.2 ? .1 : .8, lookY: lt < 6.2 ? -.1 : -.28,
      sq: .06 + .3 * fall, dy: mv.dy + 3.1 * fall, rot: .2 * fall,
      aL: -.9 - .3 * raise, aR: lerp(-.85, 1.02, raise) + .35 * (1 - fall) * (mv.walk != null ? Math.sin(mv.walk * TAU) : 0),
      wind: .2 + .5 * (mv.moving ? 1 : 0), gloom: 0, boilKey: 'hero7',
      ...(raise > .3 ? { armR: uu => P.firefly(1.15 * uu, -.12 * uu, uu * .95, { col: WARM, k: 1 }) } : {}),
    });
    // 雪堆里冬眠的刺猬探了一下头又缩回去（非 Clawd 物种：世界不是只围着角色转）
    if (lt > 8 && lt < 12.4) {
      const up = ease(seg(lt, 8.4, 9.6)) * (1 - ease(seg(lt, 10.9, 12.1)));
      P.hedgehog(880, gy + 6, U * (.5 + .85 * up));
      paint(ellPts(880, gy + 12, U * 1.5, U * .42, 14, 2), { wash: F.snowLit, fill: C.snowLt, fillOp: 70, bleed: .18, ink: null });
    }
    F.snowfall(t, 30, snowK(t), snowWind(t));
    // 坡后透出跳动的橙红 —— 篝火是"跳"的，萤火虫是"静"的（A8 的预叙）
    const fire = ease(seg(lt, 27.4, 32.4)), fk = fire * (.8 + .2 * Math.sin(T * 11) + .1 * Math.sin(T * 27));
    if (fk > .02) {
      paint(ellPts(2260, gy - 190, 260 * fk, 150 * fk, 20, 8), { wash: mixCol(C.warm, C.warmLt, .4), washOp: 60 * fk, bleed: .34, tex: .7, ink: null });
      P.halo(2260, gy - 200, 150 * fk, C.warm, .9 * fk);
    }
    // R24-7：2:55–2:58（场内 lt 32.3–35.3）画面**右侧**升起一团大黄光 = 圣诞老人营地的光。
    // 它钉在世界 x=2620，而他这一场最终只跑到 1850 —— 所以它**开场只有左半边探进画面**，
    // 镜头一路右移，它越来越完整。"走近"这件事由相对位置自己完成，不需要给光本身做动画。
    const santa = ease(seg(lt, 31.6, 35.4));
    if (santa > .02) {
      P.lightPatch(2620, gy + 6, 520 * santa, '#FFD86A', .8 * santa);
      P.airGlow(2620, gy - 250, 330 * santa, '#FFE486', 1.25 * santa);
      P.halo(2620, gy - 250, 215 * santa, '#FFF0B4', 1.05 * santa);
      P.halo(2620, gy - 250, 86 * santa, '#FFFDF0', 1.0);
    }
    camEnd();
    F.wipeIn(lt, ['#1A2440', '#20283E']);
    F.wipeOut(lt, dur, ['#2A2438', '#1E2A44']);
  }

  // ============================================================ A8 · 178.35–206.47 · 圣诞老人
  // 光圈就是"世界的边界"：圈内白天，圈外骤黑。他出圈那一瞬色温必须掉一拍。
  function sSanta(t, lt, dur) {
    const t0 = B[7], gy = 862, fx = 1180;                       // fx = 篝火心
    camBegin(kf(lt, [[0, 1120], [9, 1250], [20, 1310], [28.1, 1380]]), kf(lt, [[0, 648], [9, 634], [20, 628], [28.1, 656]]), .95 + .02 * Math.sin(lt * .34));
    F.sky('#141C38');
    F.skyBand(196, 1700, 160, mixCol(F.SKYLO, '#465A8C', .5), .78);
    F.stars(11, 52, 320, '#D6E2F6');                            // 全片星星最多的一帧
    moon(300, 214, 56, 0);
    treeline(160, gy - 150, 11, E.fir * .5, { span: 2500, rows: 2, snowK: .9, tone: mixCol(C.sapDk, '#243158', .5) });
    F.ground(gy + 18, F.snow, F.snowSh, { horizon: gy - 162, top: 240 });
    // 雪岭 + 停在大冷杉下的雪橇（橇上礼物堆成小山，剪影）
    P.fir(1980, gy + 8, E.firOld * .86, { seed: 21, old: true, snowK: 1 });
    P.sled(1900, gy + 10, E.sled * 1.15, { glow: lt > 9.5 });
    for (let i = 0; i < 2; i++) {
      const rx = 2210 + i * 130, chew = .5 + .5 * Math.sin(T * 1.1 + i * 2.2);
      P.reindeer(rx, gy + 6, E.reindeer * (1 + i * .06), { dir: -1 });
      if (chew > .78) P.breathFog(rx - E.reindeer * 168 * .5, gy - E.reindeer * 168 * .82, U * .9, frac(T * .3 + i * .5), C.snowLt);
    }
    F.haze(gy + 18, .26);
    F.grade(.66);                                               // 压到最黑：圈外必须真的黑，光才有"边界"
    P.campfire(fx, gy + 8, U * 2.1, { poolR: 5.6 });            // 三层火焰 + 压平的雪圈 + 落地光斑。§59 "方圆两米照成白天"→ 火必须比人高
    for (let i = 0; i < 3; i++) P.lightPatch(fx + (i - 1) * 210, gy + 12, 300, C.warm, .3);
    P.sack(1420, gy + 6, U * .95, { big: true });               // 斜靠着的礼物袋：缝里漏光
    EV.emberRise(t0 + 2.6, fx, gy - 40, U * 1.4, { n: 2 });
    EV.emberRise(t0 + 12.4, fx, gy - 40, U * 1.4, { n: 2 });
    // 圣诞老人：先一愣，然后眼睛弯起来
    const turn = ease(seg(lt, 1.2, 2.6)), wave = ease(seg(lt, 5.4, 6.6)) * (1 - ease(seg(lt, 9.4, 10.6)));
    clawd(1330, gy + 4, U * 1.16, job('santa', t, {
      view: 'q', flip: true, boilKey: 'santa',
      expr: lt < 1.2 ? 'numb' : lt < 3.4 ? 'surprised' : 'happy',
      aR: lerp(-.7, 1.16, wave), aL: -.5 + .3 * turn,
      lookX: lerp(-.2, -.86, turn), lookY: -.1, dy: -Math.abs(Math.sin(bpOf(t) * Math.PI)) * .06,
      light: .55 + .1 * Math.sin(T * 2.1), rot: -.03 * turn,
      ...(lt > 9.6 && lt < 15.4 ? { armL: uu => P.sack(1.05 * uu, .1 * uu, uu * .74, { big: true, pool: false }) } : {}),
    }));
    // 他：从画面**左边外面走进来**（P1#7 / L7：不能凭空出现）→ 停在光圈边缘（不敢进）→
    // 一步、一步踩在拍上进来 → 被袋子压得晃一下 → 探头看。位移与步态同源于 walkChain。
    // 起点 -160：这一场开场左边缘在 110，原来他从 300 开始 = 切进来就站在画里。
    const enter = ease(seg(lt, 6.2, 10.2)), take = ease(seg(lt, 10.6, 13.4)), peer = ease(seg(lt, 14.2, 16.4));
    const mv = walkChain(t, [[t0 + .4, t0 + 6.2, 830, 'walk'], [t0 + 6.2, t0 + 10.2, 1006, 'walk'],
      [t0 + 24.6, t0 + 28, 936, 'walk']], -160, U, 'side');
    const bx = mv.x;
    const inRing = clamp(1 - Math.abs(bx - fx) / 350);
    F.hero(bx, gy + 2, U, t, {
      view: mv.view === 'front' ? 'q' : mv.view, flip: lt < 24.6 ? (fx < bx) : mv.flip, walk: mv.walk,
      cold: lerp(.7, .3, inRing * (.4 + .6 * clamp(seg(lt, .4, 10.2)))), light: .46 + .18 * take + .1 * Math.sin(T * 2.6),
      // 第十七轮 4：**拿到袋子之前不许笑**。原来 lt<14.2 一律 happy/smile，
      // 而 `take` 到 13.4 才完成 —— 等于他还没接到礼物就已经在乐了。
      // 现在：靠近光的时候是"被暖到但还不敢信"（wide + flat），**take 之后**才允许笑。
      eyes: take > .55 ? 'happy' : 'wide', mouth: take > .55 ? 'smile' : 'flat',
      lookX: lerp(.2, -.55, peer), lookY: -.5 * peer,
      sq: .05 + .2 * take * (1 - take) * 4 * .25 + .06 * Math.sin(bpOf(t) * Math.PI),
      dy: mv.dy + 1.15 * take, aL: -1.05 - .3 * take, aR: -1.02 - .3 * take,
      wind: .2, gloom: 0, boilKey: 'hero8',
    });
    // 袋子：他接过之后**拖在地上走**（P1#7："举在身前就盖住脸"）。袋底坐在雪里、在他身后，
    // 前面拖出一道雪沟；缝里漏的光仍然有，但那是"拖着一整年的礼物"的剪影。
    if (take > .04) dragSack(bx, gy + 4, U * .92, mv.flip ? -1 : 1, t);
    // 袋口涌出一小团金光，但**镜头不给观众看袋里**（§45c：只给他猛然睁大的眼睛）
    if (peer > .05) {
      paint(ellPts(bx + 26, gy - U * 6.4, U * 1.5 * peer, U * 1.1 * peer, 16, 3), { wash: mixCol(C.warm, C.warmLt, .5), washOp: 120 * peer, bleed: .3, tex: .6, ink: null });
      P.halo(bx + 26, gy - U * 6.6, U * 2.1 * peer, C.warm, .8 * peer);
    }
    // 老人指指山谷，再指指他的胸口 —— 把"给谁"交给他自己
    const point = seg(lt, 18.4, 20.2), pointChest = seg(lt, 20.6, 22.4);
    if (point > .02) clawd(1330, gy + 4, U * 1.16, job('santa', t, { view: 'q', flip: true, boilKey: 'santa2', expr: 'happy', aR: lerp(1.16, -.4, point), aL: -.5, lookX: -.8, light: .55, draw: () => { } }));
    // 出光圈的一瞬间世界变冷：色温骤降一拍
    const out = ease(seg(lt, 24.6, 27.4));
    if (out > .02) { F.dip(.16 * out * (1 - out) * 4); }
    // 萤火虫列队往坡下引路
    for (let i = 0; i < 7; i++) {
      const q = (i + .5) / 7, k = ease(seg(lt, 23 + i * .3, 25 + i * .3));
      if (k < .02) continue;
      P.firefly(lerp(fx + 120, 2160, q * k), gy - 3.4 * U - 60 * Math.sin(q * 2.6), U * 1.2, { col: WARM, dir: 1, k });
    }
    F.snowfall(t, 26, snowK(t), snowWind(t));
    camEnd();
    F.wipeIn(lt, ['#2A2438', '#1E2A44']);
    F.wipeOut(lt, dur, ['#2E2B4A', '#232A4C']);
  }

  // ============================================================ A9 · 206.47–228.97 · 面包 · 小女孩
  // A2 的原场景，但空了。她还坐在原来的位置 —— 时间对她停了。
  // §71 P1#7 —— 三条：
  //   ① 进场不能靠"切进去"：他是**从画面右边跑进来、跑过整条街、跑到她面前停住**（walkChain，步态同源）。
  //   ② 袋子拖在地上（dragSack），不是抱在怀里。
  //   ③ 还面包那一下原来看不见：面包画在**她之前**、位置正好压在她身上 → 被她的身体盖掉。
  //      现在两人之间留出一段空档，面包举在空档里、画在两个人**之后**，并且带自己的光。
  function sBread(t, lt, dur) {
    const t0 = B[8], gy = 856;
    const girlX = 1512, girlG = gy + 8, gu = U * .62;
    camBegin(kf(lt, [[0, 1720], [3.4, 1560], [8.6, 1424], [16, 1400], [22.5, 1386]]), kf(lt, [[0, 660], [8.6, 648], [22.5, 636]]), 1.15 - .06 * ease(seg(lt, 8.6, 16)));
    F.sky(mixCol('#141C38', '#1B2544', .4));
    F.skyBand(206, 1500, 150, mixCol(F.SKYLO, '#3B4C78', .4), .6);
    F.stars(5, 70, 290);
    treeline(300, gy - 60, 9, E.fir * .5, { span: 2600, rows: 2, snowK: .3 });
    F.ground(gy - 24, F.snow, F.snowSh, { horizon: gy - 74 });
    F.slope([[200, 1500], [200, 806], [900, 748], [2300, 700], [3100, 706], [3100, 1500]]);   // 封口全部推到画外（同 A2）
    rock(2380, gy - 6, 330, 156, {});
    rock(1120, gy - 10, 300, 150, {});
    P.fallenTrunk(1760, gy - 16, E.fir * .5, { dir: 1, snowK: .55 });
    // 盗贼的脚印还在，被雪填了一半（上一场的伤没有消失，只是被盖住）
    F.grade(.56);
    printRow(1500, gy - 2, 12, 58, U * 3.3, { dir: -1, fade: .3 });
    // 狂奔进场 → 跪下 → 掏袋子 → 举面包 → 摆手 → 退开 → 转身走。全程一条路，脚踩拍。
    // L7 第 1 条：起点 2760 在**画外**（这一场开场右边缘 2555），原来 2060 就在画面里 = 凭空出现。
    const mv = walkChain(t, [[t0, t0 + 8.2, 1318, 'run'], [t0 + 25.4, t0 + 27.4, 1300, 'walk']], 2760, U, 'side');
    const kneel = ease(seg(lt, 8.2, 10.2)), pull = ease(seg(lt, 10.2, 12.2));
    const hx = mv.x;
    // 第十七轮 8：**朝向必须由两个人的实际位置算出来**，不能写死。
    // 原来他从画外（2760）向左狂奔到 1318 —— 而小女孩在 1512，也就是他已经**跑过她了**，
    // 却仍然保持奔跑时的"朝左"，于是"他把背对着女孩"。跑过、停住、回身，本来就是一次更好的表演。
    const turned = lt >= 8.2;
    F.hero(hx, gy - 20, U, t, {
      ...mv, view: lt < 8.2 || lt > 25.4 ? 'side' : 'q', flip: turned ? girlX < hx : mv.flip,
      walk: mv.moving && !turned ? mv.walk : null, cold: .46, light: .62 + .12 * Math.sin(T * 2.6),
      eyes: 'wide', mouth: lt < 16 ? 'open' : 'smile',
      lookX: turned ? (girlX < hx ? -.62 : .62) : mv.flip ? -.62 : .62, lookY: .12,
      sq: .06 + .16 * kneel, dy: mv.dy + 1.8 * kneel, rot: -.05 * kneel,
      aL: lerp(-.9, -1.3, kneel), aR: lerp(-.85, -1.25, kneel), wind: mv.moving ? .9 : .2, boilKey: 'hero9',
    });
    // 袋子：跑的时候被拖在身后，跪下后仍然在地上（P1#7②）
    dragSack(hx, gy - 16, U * .88, mv.flip ? -1 : 1, t, { k: .86 });
    if (lt > 1.2 && lt < 9) P.lightPatch(hx + 34, gy + 2, 190, C.warm, .5);
    // 她：还坐在 A2 的位置，抱着膝盖，膝上留着那半块没吃的
    const lift2 = ease(seg(lt, 12.4, 14.2)), bite = ease(seg(lt, 16.4, 17.6)), stand = ease(seg(lt, 21.4, 23.4));
    const relight = ease(seg(lt, 17.6, 18.6));
    clawd(girlX, girlG, gu, job('girl', t, {
      view: 'q', flip: true, boilKey: 'girl9',
      expr: lt < 12.4 ? 'weary' : lt < 17.6 ? 'hesitate' : 'joytear',
      sq: .18 * (1 - stand) + .05, dy: 2.2 * (1 - stand), rot: -.02 * (1 - stand),
      aL: lt < 12.4 ? -1.2 : lerp(-1.2, 1.15, lift2) - .5 * stand, aR: lt < 12.4 ? -1.24 : lerp(-1.24, 1.1, lift2) - .5 * stand,
      lookX: lt < 14.2 ? -.5 : .3, lookY: lt < 12.4 ? .3 : -.3,
      light: .04 + .84 * relight,
      ...(lt > 17.6 ? { armR: uu => P.bread(1.15 * uu, .1 * uu, uu * .8, { half: lt > 20.4, steam: true }) } : {}),
    }));
    if (lt < 17.6) P.bread(girlX + 6, girlG - 2, gu * 1.15, { half: true, glow: false });
    // 第十八轮 R18-2：分发物品那几场要有"Thank you!"。这一句**必须留气泡**——
    // 它是"她终于肯对他说一句话"的转折点，尾巴指着她，观众才知道声音是谁发的；
    // 呼救那种情绪爆发才用无框白字。A10 已经有一句，这里补上她自己的这一句。
    // 第二十四轮 R24-8：气泡在 `girlX-30`、尾巴落在 `girlX-70` —— 都是往**左**偏，
    // 而这一拍 clawd 正好在她左边（他狂奔到 1318，她在 1512），于是尾巴指到了他脸上。
    // 说话的是女孩，气泡就必须**压在她身上**：往右挪到她头顶上方，尾巴垂回她自己。
    F.say(t, t0 + 18.2, girlX + 34, girlG - U * 10.6, 'Thank you!', { dur: F.bt(7), size: 42, tailX: girlX + 14 });
    // 掏出**一整块**冒热气的面包（比被抢的那块大），举在两人之间的空档里，画在两个人之后
    const bx0 = lerp(hx + 60, (hx + girlX) * .5 + 26, pull), by0 = gy - 20 - U * 4.4 * pull;
    if (pull > .05 && lt < 18.4) {
      P.bread(bx0, by0, U * 1.7, { steam: true, glow: true });
      P.halo(bx0, by0 - U * 1.1, U * 3.4 * pull, C.warm, .9 * pull);
      P.airGlow(bx0, by0 - U, U * 2.2 * pull, C.warm, 1.1);
      P.lightPatch(bx0, gy + 4, 250 * pull, C.warm, .62 * pull);
    }
    // 她抬头 —— 不认识他。她看面包、看他、再看他身后的萤火虫（**信任是要重新挣的**）
    for (let i = 0; i < 5; i++) {
      const k = ease(seg(lt, 13 + i * .4, 15 + i * .4));
      if (k < .02) continue;
      P.firefly(lerp(1780, 1600, k) + (hash(i) - .5) * 190, gy - 4.2 * U - 70 * Math.sin(i * 1.7 + T * .4), U * 1.05, { col: WARM, dir: -1, k });
    }
    if (relight > .05) { P.halo(girlX, girlG - gu * 5.2, gu * 5 * relight, C.warm, .8 * relight); P.lightPatch(girlX, girlG + 6, 260 * relight, C.warm, .6 * relight); }
    // 她掰一半回赠 —— 他摆手（不吃，指指她）；她站起来挥手，他回头挥手（**同一个他**，不再叠第二个）
    const refuse = ease(seg(lt, 20.4, 21.6)) * (1 - ease(seg(lt, 23.4, 24.4)));
    const bye = ease(seg(lt, 24.8, 26.2)) * (1 - ease(seg(lt, 28.4, 29.6)));
    if (refuse > .02) F.litOn(hx, gy - 20, U, C.warm, .5, -1);
    F.snowfall(t, 30, snowK(t, { peak: 1.15 }), snowWind(t));
    F.gusts(t, .5 * ease(seg(lt, 4, 12)), -1, 5);
    camEnd();
    F.wipeIn(lt, ['#2E2B4A', '#232A4C']);
    F.wipeOut(lt, dur, ['#26365E', '#1C2A4A']);
  }

  // ============================================================ A10 · 228.97–256.8 · 蜡烛 · 村民
  // A3 的村子，但**更大**（一直有没入画的邻居）。窗光一朵一朵开，开一朵地上就多一片光斑。
  function sCandles(t, lt, dur) {
    const t0 = B[9], gy = 878;
    const aerial = ease(seg(lt, 13.6, 15.6)) * (1 - ease(seg(lt, 20.4, 22.6)));
    // L7（第九轮 C）：开场是**贴着他跑的特写**（2.05），一路退到 1.06 才把村子交出来，
    // 中段再升到 .52 的航拍 —— "村子比 A3 大"这件事靠镜头距离说，不靠把房子画大。
    camBegin(kf(lt, [[0, 1180], [8, 1260], [15.6, 1240], [22.6, 1300], [27.8, 1420]]),
      lerp(kf(lt, [[0, 640], [8, 626], [27.8, 636]]), 300, aerial),
      lerp(2.05, 1.06, ease(seg(lt, 0, 7.4))) * lerp(1, .49, aerial));
    F.sky(mixCol('#141C38', '#1E2C50', .5));
    // L4：航拍那几拍 zoom=.52，一屏 3700px 宽，F.skyBand/F.haze 的 rx1500 椭圆两头会露出来
    wideBand(198, 1080, 240, mixCol(F.SKYLO, '#2B3E6C', .5), .16);
    F.stars(4, 60, 240);
    treeline(1900, gy - 90, 7, E.fir * .42, { span: 1500, rows: 1, snowK: .3 });
    F.ground(gy - 22, F.snow, F.snowSh, { horizon: gy - 104 });
    wideHaze(gy - 22, .4);
    // 村子比 A3 大：三座近屋 + 四户远邻
    const huts = [[430, E.cabin * .92], [880, E.cabin], [2130, E.cabin * .86], [1580, E.cabin * .7], [2500, E.cabin * .62], [120, E.cabin * .58], [2760, E.cabin * .5]];
    // 窗光时刻表：每拍一朵，亮一朵地上就多一片光斑（他走出来的路线是一条光的笔画）
    const litAt = [1.2, 2.4, 3.6, 4.8, 6.0, 7.2, 8.4, 9.6, 11.0, 12.4, 13.8, 15.4];
    const hutLit = huts.map(([cx, cm], hi) => ({
      cx, cm, lit: clamp(ease(seg(lt, litAt[hi * 2] ?? 1e9, (litAt[hi * 2] ?? 1e9) + .9)) * .5
        + ease(seg(lt, litAt[hi * 2 + 1] ?? 1e9, (litAt[hi * 2 + 1] ?? 1e9) + .9)) * .5),
    }));
    huts.forEach(([cx, cm], hi) => {
      P.cabin(cx, gy - 20, cm, { lit: hutLit[hi].lit, smoke: lt > 3 + hi ? .6 : 0, seed: hi });
    });
    F.grade(.5);                                    // §58 夜色层必须在**所有环境之后**：写在房子之前，屋顶就没被夜色压过，白成一块纸板
    // R28-1g：窗光**必须在 grade 之后**。原来光斑和光晕和房子一起画在 grade 前面（1710–1715），
    // 于是 `.5` 的夜色层把 `#FFD96A` 整个压平 —— 用户看到的"窗户亮黄度不够"其实是**灰绿**。
    // 房子本体该被夜色压（它就是环境），发光的窗不该。
    // 顺带修掉一处**静默死代码**：原来 `const k = clamp(1 - .34 * hi * 0)`，`* 0` 让 k 恒等于 1，
    // 远屋的光斑从来没有真的按进深衰减过。现在衰减是算出来的，不是写死的。
    hutLit.forEach(({ cx, cm, lit }, hi) => {
      if (lit < .05) return;
      const h = cm * 168, w = h * .95, gy0 = gy - 20;
      const wx = cx + w * .27, wy = gy0 - h * .38, deep = 1 - .07 * hi;
      paint(rectPts(cx + w * .16, gy0 - h * .48, w * .22, h * .2, h * .015),
        { wash: mixCol(F.WARM, '#FFF6D8', .5), washOp: 255, bleed: 0, tex: 0, border: 0, ink: null });
      P.halo(wx, wy, w * .95 * lit, F.WARM, .85 * lit * deep);
      P.halo(wx, wy, w * .34 * lit, '#FFF6D8', .8 * lit * deep);
      P.lightPatch(wx, gy + 2, w * 1.5 * lit, F.WARM, .62 * lit * deep);
    });
    // 第二十四轮 R24-9b：**删掉这 12 朵瞬态窗光**。它按 `gy - 150 - i*6` 在不同高度反复闪现
    // 1.1 秒再消失，用户看到的"亮窗户一直在到处乱闪乱飞"就是它。
    // 而上面的 `anyLit` 已经是**单调锁存**的（亮过就一直亮），那正是用户要的
    // "clawd 走过后房子的窗户都亮起黄光"。瞬态那层不是补充，是盖在它上面的噪点。
    // §71 P1#3g/P1#7 —— 村里**没有路灯**：原来那根高杆暖色灯笼是一盏市政路灯，删掉；
    // 这个村子后来是自己把灯点起来的（窗光 + 人手里的烛），不靠一根公杆。
    // 也**不再有 A3 那辆蜡烛车**：奸商早走了，车不该还停在村口。
    P.bench(700, gy - 16, .9, {});
    // **回收 A3**：那半支没点的蜡烛还插在老门口的雪里。他经过时把它拾起来点上 —— 半支也是光
    const pick = ease(seg(lt, 4.2, 5.6));
    if (pick < .96) P.candle(946, gy - 26, U * .8, { half: true, lit: 0, pool: false });
    if (pick > .3) { P.candle(946 + 40 * pick, gy - 26 - 120 * pick, U * .8, { half: true, lit: 1, pool: false }); P.halo(946 + 40 * pick, gy - 26 - 128 * pick, U * 1.6, C.warm, .8 * pick); }
    // 猫跟着他（连猫都被光引着）
    const catFollow = clamp((lt - 6.4) * .5);
    P.cat(lerp(1224, 1100, catFollow), gy - 104 + 96 * ease(seg(lt, 6.4, 7.4)) * (1 - ease(seg(lt, 7.4, 8.4))), U * .7);
    if (lt > 6.2 && lt < 8.6) EV.catLeap(t0 + 6.4, 1224, gy - 8, U * .8);
    // 老村民一家：递上一整支蜡烛，老人双手接；幼崽最后亮、最亮
    // 第二十四轮 R24-9a：领蜡烛的三个人原来挤在 946/1010/1096（间距 50~86px，而一个身体
    // 宽 10u≈210px）—— 和 A3 一家三口、第二部 S4 病号是同一个病：**一排等高、等距、同尺寸**。
    // ⚠ 那条注释写着"拉开到 240px 一档"，**代码里从来没有这个数**（原来是 1400/1250/1120，
    // 间距 150 和 130）。第二十八轮 R28-1b 复核 t=239 才发现：改了说明没改数。
    // 现在真的拉开：620 / 906 / 1180，最小一档间距 274px > 1.2 个身宽。
    // R28-1d：孩子原来排在中间那一档，被最后画、尺寸最大的大村民整个盖住（成片里根本看不见他）。
    // 现在给他**最大的进深 lane**（数组顺序 = 远→近 = 绘制顺序），他站在最前面、最后画，谁也挡不住他。
    // R28-1c：三个人不再共用同一个 `view/flip/lookX` 和同一张 `'shiver'` 苦脸 ——
    // 三个人都**朝右看着他**（原来是一起朝左、背对着他），但视线高低各不同：
    // 远的仰头看他、中的低头看自己那只**将要有蜡烛**的手、孩子最急、直直仰着脸。
    //        名字        x      尺寸  进深 朝向 拿到之前的表情   他递出去的先后
    const fam = [['villager', 620, .80, -16, 1, 'solemn', 10.9],
      ['villager', 906, 1.02, 6, 1, 'freezing', 9.3],
      ['kid', 1180, .62, 30, 1, 'hopeful', 8.7]];
    fam.forEach(([jn, px, sc, lane, lk, ex, at], i) => {
      const kid = jn === 'kid';
      const reach = ease(seg(lt, at - .7, at));            // 伸手要
      const got = ease(seg(lt, at, at + .8));              // 烛落进掌心
      const hold = ease(seg(lt, at + 1.2, at + 2.4));      // 收回来护在胸口
      clawd(px, gy + 2 + lane, U * sc, job(jn, t, {
        view: kid ? 'q' : 'side', flip: lk < 0, boilKey: 'vil' + i, ...POOR,
        expr: got > .55 ? (kid ? 'excited' : 'relieved') : ex, tint: 'blue', tintK: got > .55 ? .1 : .42,
        // 左臂是**接烛的那只**：先伸出去，拿到之后慢慢收回胸口。
        // 原来三个人只有 `aL/aR` 跟着同一个 `give` 一起抬起来 —— 那是"举手"，不是"接东西"。
        aL: lerp(lerp(-.85, 1.16, reach), .34, hold), aR: -.8,
        lookX: lk * .72, lookY: i === 0 ? -.42 : (i === 1 ? lerp(.1, .62, got) : -.58),
        light: .06 + .95 * got, sq: .06,
        // R28-1f：**蜡烛必须在手上**。原来全场只有一朵 `P.candleBunch(1160, …)` 悬在世界坐标里，
        // 谁都没有东西，所以"接到手"这件事从来没被画出来过。
        ...(got > .4 ? { armL: uu => P.candle(1.0 * uu, -.06 * uu, uu * .62, { lit: 1, pool: false }) } : {}),
      }));
      if (got > .05) {
        P.halo(px - 20 * lk, gy + lane - 5 * U * sc, U * 4 * got, F.WARM, .7 * got);
        P.lightPatch(px, gy + lane + 8, 200 * got, F.WARM, .5 * got);
      }
    });
    // 他手里那一束：**从进场就有**，一支一支少下去 —— 原来它是 `give > .5` 才冒出来的，
    // 于是"发"这个动作在画面上等于"空中变出一把蜡烛"（R28-1a）。
    P.candleBunch(1408, gy - 4.6 * U, U * .8, { lit: 1 - .28 * clamp(ease(seg(lt, 8.7, 11.4))) });
    F.say(t, t0 + 12.2, 1230, gy - U * 9.8, 'Thank you.', { dur: F.bt(6), size: 40, tailX: 1190 });
    // 他：窗前跑向窗前，舞蹈式的不停顿；最后跑到村口回头看。
    // §71 P1#7 —— 原来这条"跑位"是手搓的：`hf=false` 把 walkTo 算出来的 flip 丢掉了，
    // 于是往左跑的那几段他是**倒着滑**的；而且每一跳之间位置瞬移 = 凭空出现。
    // 现在 hops 直接喂给 walkChain，位移/朝向/步态同源。
    // L7 第 1 条 —— 起点 1560 在画面里（这一场开场右边缘 1648），等于切进去就站在那儿。
    // 现在他从 1900（**画外**）跑进来，第一拍就在动。
    const hops = [[1560, 0, 1.4], [1240, 1.6, 3.2], [900, 3.4, 5.2], [1120, 5.4, 6.8], [1560, 7.0, 8.0],
      [1420, 8.2, 8.9], [1500, 11.9, 13.4], [1780, 15.8, 19.4], [2060, 19.6, 24.4], [2320, 24.6, 27.8], [2620, 27.8, 27.82]];
    const mv = walkChain(t, hops.map(([px, a, b]) => [t0 + (a === b ? b - .02 : a), t0 + b, px, 'run']), 1900, U, 'side');
    let hx = mv.x, hv = mv.view, hf = mv.flip, hw = mv.walk;
    // R28-1e「转身速度太快」：朝向原来直接取 `mv.flip`，于是在 8.2 那一帧**硬翻** ——
    // 1/24 秒里从"朝右跑"变成"朝左站"。现在让他在 7.9–9.1 这 1.2 秒里**经过四分之三侧面**转过去，
    // flip 只在中间那一拍换，两头都有 q 挡着，所以读起来是"转过身"而不是"人物做了镜像"。
    // 步态**不关**：`hw = null` 会变成溜冰（L7 第 1 条），他这 1.2 秒里确实还在往左挪。
    const tn = seg(lt, 7.9, 9.1);
    if (tn > 0 && tn < 1) { hv = 'q'; hf = tn < .5; }
    // R28-1a：他在 8.9 就**站定了**，一直到 11.9 才走 —— 这三秒就是"发蜡烛"这件事本身。
    // 原来他 7.8–10.6 一路从 1060 跑到 1350，发蜡烛的三拍（8.7/9.3/10.9）全发生在他**跑过**的路上，
    // 所以画面上看不出他在给东西，只看见三个人突然举手。
    const lean = ease(seg(lt, 8.6, 9.4)) * (1 - ease(seg(lt, 11.3, 11.9)));
    // 第二十四轮 R24-9c：俯拍那 9 秒（aerial 13.6~22.6 = 绝对 242.6~251.6 s ≈ 4:02–4:11）里，
    // 原来把他强制成**背影 + walk:null** —— 用户："走的时候是背着的，应该是侧着朝右的"。
    // 两重错：① 镜头从上面拉远，不需要角色转身；一条**侧身朝右**的小东西比一块后背更能说明
    // "他在往哪去"。② `hw = null` 把步态整个关掉，于是他是**溜冰**着出去的（连续性一级 bug 类）。
    if (aerial > .3) { hv = 'side'; hf = false; }
    const lookBack = ease(seg(lt, 24.6, 26.2)) * (1 - ease(seg(lt, 27, 28.2)));
    F.hero(hx, gy - 2, U, t, {
      view: hv, flip: hf, walk: hw, cold: .4, light: .72 + .12 * Math.sin(T * 2.8),
      eyes: 'happy', mouth: 'smile', lookX: lerp(.7, -.85, lookBack), lookY: -.1,
      // R28-1a：站着的那三秒里，他的**左臂一支一支往前送**、上身跟着往前倾 ——
      // 这样"递"这件事在剪影上就读得出来，而不是"他站在那儿，别人举手"。
      aL: -.95 - .35 * (hw ? Math.sin(hw * TAU) * .5 : 0) - .52 * lean,
      aR: -.9 + .35 * (hw ? Math.sin(hw * TAU) * .5 : 0),
      rot: -.09 * lean,
      sq: .05, dy: mv.dy, wind: .55, boilKey: 'hero10',
      ...(pick > .4 ? { armR: uu => P.candle(1.05 * uu, -.1 * uu, uu * .7, { half: true, lit: 1, pool: false }) } : {}),
    });
    // L7 第 3 条 —— 袋子从 A8 拿到之后**一直**在地上跟着他：原来写的是 `if (mv.moving)`，
    // 于是他在窗边停一拍袋子就凭空消失、下一拍又冒出来。停下来的时候袋子就留在脚边。
    dragSack(hx, gy, U * .86, mv.flip ? -1 : 1, t, { k: .8 });
    // 萤火虫在前方雪坡上排成**箭头**：还有最后一站
    const arrow = ease(seg(lt, 21.4, 24.4));
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3), col = i % 3;
      const ax = lerp(2400, 2620, row * .5) + col * 46 * (row === 0 ? 1 : .5), ay = gy - 3 * U - (1 - row) * 90;
      if (arrow > .02) P.firefly(ax, ay, U * 1.15, { col: WARM, dir: 1, k: arrow });
    }
    F.snowfall(t, 22, snowK(t), snowWind(t));
    camEnd();
    F.wipeIn(lt, ['#26365E', '#1C2A4A']);
    F.wipeOut(lt, dur, ['#1A2038', '#141A2E']);
  }

  // ============================================================ A11 · 256.8–279.6 · 种子 · 树桩地
  // A4 的罪行摊开在这里：几十个树桩延到天边，每个桩面积着雪，像一片石化的森林。
  // §71 P1#8 —— 六条：
  //   ① 同框两个 Clawd：原来 `hold` 那一段为了"手里有种子"又画了一个完整的 hero（hero11a）。
  //      删掉。种子改由**同一只右手**举着（armR 钩子），亮暗仍和心跳同频。
  //   ② 他站着发呆太久：整场排满 —— 拖着袋子进场 → 环顾桩地 → 跪 → 三斧挖 → 放 → 覆 → 拍两下
  //      → 挪到桩边坐下 → 睡。每一段都有拍点。
  //   ③④ 桩子尺度：主桩 ≈ 一个 Clawd 高（m≈1.05），远处那些不再是牙签；两者共用 stumpOf()。
  //   ⑤ 远景桩"悬在天上"：雪原现在从**地平线 556** 一路铺到画面底，每个远桩的 y 都由
  //      FILM.depthY(horizon, gy, d) 算出来，永远落在 horizon 与近地面之间。
  //   ⑥ 袋子从进场就在他身后被拖着，最后停在右手边 —— 不是凭空出现。
  function sSeed(t, lt, dur) {
    const t0 = B[10], gy = 880, HOR = 556, holeX = SEED_SPOT.x, stumpX = SEED_SPOT.stump;
    // L7（第九轮 C）：开场**不给人**——先是一片空桩地，镜头从右往左摇，把他"找"出来
    // （原来 cx 一开始就停在 1180，而他从 640 起步 —— 640 在画面里，等于切进来就站在那儿）。
    // 第二十四轮 R24-10：镜头要在**中景**就推成特写（用户："等画面稳定后镜头拉进给特写，
    // 大概让 clawd 的高度占满整个屏幕高度"），因为这一场的戏是**种子和萤火虫**在干活，
    // 不在特写里就看不清那粒种子。原来直到 lt 20.2 才推镜，前面 20 秒都是中景。
    // ⚠ 特写的三个数是一起解出来的，不能各自调：
    //   ① 竖直方向要装下"他的头顶 gy-164 → 坑的底边 gy+78"共 242px → cy = gy-43、zoom ≤ 4.4；
    //   ② 水平方向要装下"坑 884..1032 → 他的脸 1150..1290"共 406px → zoom ≤ 4.7。
    //   取 **4.2**：他 8U = 706 屏幕像素（画高 65%，就是用户要的"占满整个屏幕高度"），
    //   种子 84px + 光晕 200px，形状看得清；他的身体右半被画面右缘裁掉 —— 特写里裁边是常态。
    //   原来 4.2× 而间距只有 130px 时，他的身体正好横在坑和镜头之间，整幅画就是一块粉色矩形；
    //   再上一版 cy 给到 742，等于把画面中心放在他胸口，头和脚一起被裁掉。
    camBegin(kf(lt, [[0, 1900], [3.0, 1180], [6, 1140], [10, 1077], [18.6, 1077], [20.6, 1090], [22.8, 1100]]),
      kf(lt, [[0, 620], [6, 640], [7.6, 742], [10, gy - 43], [18.6, gy - 43], [20.6, 828], [22.8, 840]]),
      kf(lt, [[0, 1.02], [4.4, 1.06], [7.6, 4.2], [18.6, 4.2], [20.6, 3.1], [22.8, 2.5]]));
    F.sky('#101632');
    F.skyBand(214, 1900, 150, mixCol(F.SKYLO, '#2A3560', .6), .5);
    F.stars(7, 60, 300);
    // 天边极深处一丝灰蓝：不是黎明，是"夜在变老"
    paint(rectPts(-60, 470, W + 120, 96), { wash: mixCol('#243050', '#3A4A74', .5), washOp: 60, ink: null });
    farFirs(HOR + 24, E.fir * .3, { tone: mixCol(C.sapDk, '#1A2340', .73) });
    F.ground(gy + 20, mixCol(F.snow, '#8E9CBC', .4), F.snowSh, { horizon: HOR, top: 300 });   // ← 从地平线铺下来
    F.haze(HOR + 30, .5);
    snowDepth();
    // 几十个树桩：按进深排。y 一律 depthY(horizon, gy, d) —— 永远在地平线与近地面之间（P1#8⑤）
    stumpField(gy, HOR);
    stumpOfTree(stumpX, gy + 22, 7.4, { seed: 7 });                 // 主桩：三个人抱不过来，他靠着正好
    F.grade(.5);                                      // §58 环境之后才压夜色
    // 第二十四轮 R24-10：**clawd 不再挖土**（用户："这样就不用去描绘很难表现的 clawd 挖土的场景了"）。
    // 换成一条清楚的因果链：种子**自己从袋子里飞出来** → 萤火虫托着它 → 另一些萤火虫在
    // 一小块地上空来回飞（= 在挖，省掉复杂动作）→ 那块地**雪白 → 灰 → 棕褐**渐变 →
    // 挖的让到左右两边等 → 托着的也左右分开 → 种子**自己落进棕褐土里** → 他开心地笑。
    const holeY = gy + SEED_SPOT.dy;
    // R28-2a/2b：原来 `flyOut = ease(seg(lt, 2.8, 4.6))` —— 可他要到 **lt 3.4 才停住**，
    // 于是"他还在跑，种子已经离袋"，而且袋子全程毫无反应（不亮、不动），
    // 观众看不到出口在哪，就只能读成"凭空出现"。
    // 现在按用户给的因果链重排四拍：**停 → 袋发黄光 → 种子从袋口飞出 → 袋子暗回去**。
    const glow = ease(seg(lt, 4.6, 5.6)) * (1 - ease(seg(lt, 7.4, 8.6)));   // 袋子亮起来、又回到原来的颜色
    const flyOut = ease(seg(lt, 6.0, 8.0));                   // 种子离袋（在袋口最亮之后才出来）
    const digK = seg(lt, 7.6, 13.2);                         // 萤火虫"挖"的进度
    const part = ease(seg(lt, 13.2, 15.0));                  // 挖的让开、托着的分开
    const drop = ease(seg(lt, 15.0, 16.6));                  // 种子自己落进土里
    const dig = digK, place = clamp(digK * 1.2), pat = drop;
    // 那一小块地分两段变色：**先化雪（白→灰），再露冻土（灰→棕褐）**。
    // 一步到位会读成"这块地本来就是黑的"，两段才像"雪被扒开、土被翻开"。
    if (digK > .02) {
      const w = clamp(.35 + digK * .65) * (1 - .12 * drop);
      const ash = mixCol(F.snowLit, '#8A8F96', clamp(digK * 2.2));
      const dirt = mixCol(ash, mixCol(C.bark, '#6B4A2C', .55), clamp((digK - .34) * 1.9));
      paint(ellPts(holeX, holeY, 74 * w, 26 * w, 16, 3), { fill: dirt, fillOp: 215 * clamp(digK * 1.6), bleed: .18, tex: .6, border: .3, ink: null });
      for (let i = 0; i < 3; i++) inkLine([[holeX - 70 * w + i * 62 * w, holeY - 6], [holeX - 46 * w + i * 62 * w, holeY + 12]], P.swOf(9), mixCol(C.snowSh, C.ink, .3), 'inkfine', .3);
    }
    // 心跳同频：种子亮暗的周期 = 他胸口光的周期（"这是他自己的一部分"）
    const beat = .72 + .28 * Math.pow(Math.max(0, Math.sin(T * 3.1)), 6);
    // 一条路：拖袋进场 → 停在坑边 → **看萤火虫干活** → 开心 → 靠着桩边睡。
    const mv = walkChain(t, [[t0, t0 + 3.4, SEED_SPOT.hero - 40, 'walk']], 640, U, 'side');
    const look = ease(seg(lt, 2.6, 4.4));
    const sit = ease(seg(lt, 17.4, 19.0)), sleep = ease(seg(lt, 19.6, 21.6));
    const hx11 = lerp(SEED_SPOT.hero - 40, SEED_SPOT.hero, sit);
    // R24-10：挖土交给萤火虫之后，他这一场**只剩反应，没有操作** ——
    // 惊讶（种子飞出来 / 萤火虫在挖）→ 开心（种子自己落进土里）→ 睡着。
    // 手不再动，所以手臂固定在怀里；坑在 958、他在 1196（相距 238），特写里一左一右，
    // 正好是用户要的"画面右侧露出 clawd 惊讶"。
    F.hero(hx11, gy + 4, U, t, {
      // R24-10：镜头开始推的那一拍让他**转过头来**（side → q）。1:1 复核过：4.2× 的正侧脸
      // 只有一颗眼睛，那颗白点加旁边的深色竖板读成"一扇门"，不是"惊讶"；三分之四视角才有
      // 两只眼和嘴。用 clawd.js 的 turn() 而不是硬换 view —— 它按八分之一格踩关键视角、
      // 中间那一格带 smear，所以是"转过身"，不是"人物突然变宽 60%"。
      ...turn(t, t0 + 4.4, t0 + 5.0, .75, .875),
      walk: mv.walk,
      cold: lerp(.5, .34, sit), light: (.34 + .3 * beat) * (1 - .45 * sleep),
      ...(sleep > .4 ? { eyes: 'closed', mouth: null }
        : drop > .5 ? { eyes: 'happy', mouth: 'smile' }
          : { eyes: 'wide', mouth: 'open' }),
      sq: .1 + .2 * sit + .06 * Math.sin(bpOf(t) * Math.PI) * (1 - sit),
      dy: mv.dy * (1 - sit) + 2.4 * sit, rot: -.06 * sit + .16 * sit,
      aL: -.92 - .1 * look, aR: -.86 - .1 * look,
      lookX: -.42, lookY: .5 - .35 * sit, gloom: .1 * sit, boilKey: 'hero11',
    });
    // 用户："这里添加上 ZZZ 更清楚能让观众知道在睡觉"。三颗 Z 依次升起、淡出。
    if (sleep > .25) for (let i = 0; i < 3; i++) {
      const ph = frac(T * .26 + i / 3), k = sleep * (1 - ph * .5);
      letter('Z', hx11 + 44 + i * 22 + ph * 14, gy - U * 6.4 - i * 27 - ph * 30, 26 + i * 9,
        mixCol('#EFE6D2', C.warmLt, .3), { font: F.HAND(26 + i * 9), alpha: k * .92, rot: -.16 - i * .05, ink: false });
    }
    // 萤火虫**挖土**：四粒贴着那一小块地来回低飞，每扫一趟掀一蓬雪雾。
    // 用户要的就是这个："用来回飞表示在挖，但省掉复杂的动作"。
    for (let i = 0; i < 4; i++) {
      const at = 7.6 + i * 1.4, k = ease(seg(lt, at - .8, at + .8)) * (1 - part);
      if (k < .02) continue;
      const sw = Math.sin((lt - at) * 3.4 + i);
      const fx = holeX - 44 + sw * 56, fy = holeY - 15 - Math.abs(Math.cos((lt - at) * 3.4 + i)) * 15;
      P.firefly(fx, fy, U * 1.05, { col: WARM, dir: sw > 0 ? 1 : -1, k });
      EV.stepPuff(t0 + at + .3, fx, holeY - 4, U * .5, { y0: -U * .22 });
    }
    // 种子的一生：**自己从袋子里飞出来**（抛物线）→ 被萤火虫托着 → **自己落进棕褐的土里**。
    // 全程没有一只手碰过它，这正是用户说的"让种子能够被看清楚形状"的前提。
    const seedT = clamp(flyOut);
    // 袋子的**当前位置**：它挂在他**身后**，从头到尾都在他身边。
    // R27-4：原来这一行用的是 `mv.x`，可人画的是 `hx11` —— 而 `hx11` 里的 `sit` 要到 lt 17.4
    // 才开始动，所以整场前 17 秒他**钉在 1250**，`mv.x` 却从 640 一路走到 1250。
    // 结果 t=258 那一帧人在 1250、袋子在 927，它自己滑过整片雪地向他靠过去
    // （用户："那个麻袋自己漂移到clawd身边了，应该一开始就在clawd身后才对"）。
    // 证据：`out/check/r27sack/sack_3up.png` —— 258/260/262 三帧同一比例竖拼，袋→人 400px→60px→60px。
    // 终点仍然是 `SEED_SPOT.sack`，所以 A12 / A13 那两处 `P.sack(SEED_SPOT.sack, …)` 不用动。
    const sackX = lerp(hx11 + U * .86 * 3.4, SEED_SPOT.sack, sit);
    // R28-2b：出口必须是**袋口**，而且要在画面上看得见它亮起来。
    // 原来起点是 `sackX + 58` 一个凭空的几何偏移，袋子本身毫无反应，所以种子像从空气里长出来的。
    const mouthX = sackX + U * 1.5, mouthY = gy - U * 1.5;
    const arcX = lerp(mouthX, holeX, seedT), arcY = lerp(mouthY, gy - U * 5.2, seedT) - Math.sin(seedT * Math.PI) * U * 2.4;
    // R28-2a：`lt < 4.6` 那个魔数是跟着**旧的** flyOut(2.8–4.6) 写的；现在离袋改成 6.0–8.0，
    // 再留着它，种子会在还在抛物线中途就被硬拽到坑上。改成由 seedT 自己判，不再挂绝对秒。
    const seedX = seedT < 1 ? arcX : holeX;
    const seedY = seedT < 1 ? arcY : lerp(gy - U * 5.2, holeY - 10, drop) + 5 * Math.sin(T * 1.8);
    // 托着种子的三粒：始终在种子的**两侧偏上**，`part` 之后左右分开让出落点。
    // 不越过中心线 = 不穿模（用户："不要穿模"）。
    const holdK = ease(seg(lt, 6.8, 8.2)) * (1 - .45 * drop);
    if (holdK > .02) for (let i = 0; i < 3; i++) {
      const side = i === 0 ? -1 : i === 1 ? 1 : 0, spread = lerp(.38, 1.7, part);
      P.firefly(seedX + side * U * 1.2 * spread, seedY - U * (.5 + (i === 2 ? .55 : 0)) + 6 * Math.sin(T * 2 + i),
        U * 1.1, { col: WARM, dir: 1, k: holdK });
    }
    P.seed(seedX, seedY, U * .95, { pool: true, k: 1 });
    // 落进土里那一拍：土面轻轻合拢一下（覆土也是萤火虫做的）
    if (pat > .05 && pat < 1) paint(ellPts(holeX, holeY - 4, 70, 22, 14, 2), { wash: F.snowLit, fill: C.snowLt, fillOp: 120 * (1 - Math.abs(pat - .5) * 2), bleed: .2, ink: null });
    // 袋子：进场时被一路拖到这里（L7 第 3 条：原来写死在 1088，他还在 640 呢袋子就先到了坑边），
    // 之后一直停在他右手边 —— 不是凭空出现。
    if (sit < .5) dragSack(hx11, gy + 6, U * .86, -1, t, { k: .8 });
    else P.sack(sackX, gy + 10, U * .62, { big: true, pool: false, rot: 1.44 });
    // R28-2b：**袋子发黄光晕 → 种子出 → 回到原来的颜色**。glow 是一条先起后落的包络，
    // 所以同一只袋子会经历 暗 → 亮 → 暗；三层里只有最里那一粒用近白，其余用 WARM，
    // 全用近白就又是一盏白灯（R26 那一轮刚记过这个坑）。
    if (glow > .02) {
      P.lightPatch(mouthX - U * .4, gy + 10, U * 6.2 * glow, F.WARM, .55 * glow);
      P.halo(mouthX - U * .4, gy - U * 1.1, U * 4.4 * glow, F.WARM, .8 * glow);
      P.halo(mouthX, mouthY, U * 1.5 * glow, '#FFF6D8', .9 * glow);
    }
    // R28-2c：三粒萤火虫**从这一镜第一帧就在我们身边**，先绕着他，再漂到坑边待命。
    // 原来本镜前 4 秒一只都没有，等到 lt 6.8 才冒出来挖土、lt 6.8 才冒出来托种子 ——
    // 用户说的"像是凭空出现"就是这个：**做事的那几个必须先有来源**。
    const esc = ease(seg(lt, 3.6, 6.6));
    for (let i = 0; i < 3; i++) {
      const ph = frac(T * .17 + i / 3);
      const ex = lerp(hx11 + U * 2.4, holeX + (i - 1) * U * 1.9, esc);
      const ey = lerp(gy - U * 4.8, holeY - U * 2.2, esc) + Math.sin(ph * TAU * 1.5 + i * 2.1) * U * .85;
      P.firefly(ex + Math.cos(ph * TAU) * U * 1.5, ey, U * 1.0, { col: WARM, dir: Math.cos(ph * TAU) > 0 ? 1 : -1, k: .95 });
    }
    // 萤火虫一粒一粒落在他肩、围巾、头上（在场见证）
    for (let i = 0; i < 8; i++) {
      const at = 14.8 + i * .7, k = ease(seg(lt, at, at + 2.2));
      if (k < .02) continue;
      const tx = hx11 - 34 + (hash(i * 3.3) - .5) * 2.6 * U, ty = gy - 4 * U - hash(i * 1.9) * 3 * U;
      P.firefly(lerp(tx + 340 * (hash(i) - .5), tx, k), lerp(ty - 220, ty, k), U * 1.15, { col: WARM, dir: 1, k: 1 - .3 * k });
    }
    F.snowfall(t, 16, snowK(t), snowWind(t));   // 雪几乎停了：只剩零星几片（§A11）
    // A11→A12→A13 是**一镜到底**：三场都取同一条全片天气曲线，中间没有"关掉再开"。
    // 超近景：一片雪落在他肩头（安静到能听见雪粒落地）
    if (lt > 17.4 && lt < 19.6) { const a = seg(lt, 17.4, 18.6); paint(ellPts(hx11 - 62, gy - 5.6 * U + 30 * ease(a), 7, 5, 8), { wash: C.snowLt, washOp: 220 * (1 - ease(seg(lt, 18.6, 19.6))), ink: null }); }
    camEnd();
    F.wipeIn(lt, ['#1A2038', '#141A2E']);
    // A11→A12 不切：直接推到土堆特写（转场 out = 物体承载）
  }
  // 桩地：A11→A12→A13 是**一镜到底**（转场不切），所以同一片树桩必须一份不落地画满三场。
  // 原来 A11 画 19 个、A12 一个不画、A13 又换成另一批 13 个 —— 镜头没动，整片桩地却在两拍之间
  // 消失又出现，正是 L7 第 3 条"道具不能这一拍有、下一拍没"。（主桩三场本来就是同一个 seed:7。）
  function stumpField(gy, HOR) {
    // ① 尺度封顶后，远处那些一律小于主桩；② 特写里只留身边几根，镜头拉远才把整片桩地
    // 摊开（用户："在 clawd 特写镜头的视角镜头里不需要那么多树墩出现，等镜头拉远再显露"）；
    // ③ 必须**按进深从远到近**画 —— 原来循环顺序和进深无关，于是近处的桩被后画的远处桩
    // 盖住，观众读作"后面的反倒压住前面的"。
    const [ms, wd] = stumpOf(7.4), z = CAM ? CAM.zoom : 1;
    const cx = CAM ? CAM.cx : 960, cy = CAM ? CAM.cy : 540, hw = 1000 / z + 320, hh = 600 / z + 160;
    const keep = clamp(.2 + .45 / Math.max(.35, z), .2, 1);
    // 特写里"身边那几根"会渲染成三四米高的垃圾桶 —— 它们本来只有一人高，是镜头放大的。
    // 结果它们正好挡在主角和坑之间，观众只看得见一堆黑罐子。所以镜头越近，允许的**进深上限**
    // 越小：z≥3 只留 d≤.55 的中远景桩（它们仍然小），镜头一拉远就按同一个公式把它们交回来，
    // 不是硬阈值，避免 A13 拉远途中"整片桩地突然多出来"。
    const dmax = lerp(.55, 1.0, clamp((2.65 - z) / 1.35));
    const rows = [];
    for (let i = 0; i < 26; i++) {
      const d = .05 + .9 * hash(i * 1.7), sx = 120 + ((i * 337) % 2500), sy = F.depthY(HOR, gy + 14, d);
      if (sx < cx - hw || sx > cx + hw || sy < cy - hh || sy > cy + hh) continue;
      if (d > dmax || hash(i * 3.1) > keep) continue;
      rows.push([d, sx, sy, ms * (.26 + .40 * d)]);
    }
    rows.sort((a, b) => a[0] - b[0]);
    for (const [, sx, sy, sm] of rows) stumpOfTree2(sx, sy, sm, wd, Math.round(sx));
  }
  // 远景桩：同一个公式，但按进深缩尺寸（stumpOf 给的是"这棵树留下的桩"的原尺寸）
  function stumpOfTree2(x, gy, ms, wd, seed) { P.stump(x, gy, ms, { wide: wd, snow: true, seed }); }

  // ============================================================ A12 · 279.6–299.85 · 破土（与 A11/A13 一镜到底）
  function sSprout(t, lt, dur) {
    const t0 = B[11], gy = 880, HOR = 556, holeX = SEED_SPOT.x, holeY = gy + SEED_SPOT.dy, sproutBase = holeY - 4;
    // 一镜到底：这一场的**首帧必须等于 A11 的末帧**（1100 / 840 / 2.5），末帧必须等于 A13 的
    // 首帧（1070 / 845 / 2.2）。原来 A11 收在 cy 820、A12 却从 726 起 —— 中间没有黑场，
    // 镜头凭空跳了 94 世界像素，正是用户最不能忍的"连续性一级 bug"。
    // cy 从 790 抬到 840：这一场的全部内容（芽 784..928、坑底 958）都在画面下半，
    // 上面空掉 200 世界像素 —— 把镜头对准内容，而不是对准原来的地平线构图。
    camBegin(kf(lt, [[0, 1100], [8, 1082], [20.2, 1070]]), kf(lt, [[0, 840], [8, 846], [20.2, 845]]), kf(lt, [[0, 2.5], [8, 2.6], [16, 2.4], [20.2, 2.2]]));
    F.sky('#101632');
    // 一镜到底：A11 的远杉林线和整片树桩**不能**在这一场整片消失（原来 A12 只画了主桩）
    farFirs(HOR + 24, E.fir * .3, { tone: mixCol(C.sapDk, '#1A2340', .73) });
    F.ground(gy + 20, mixCol(F.snow, '#8E9CBC', .4), F.snowSh, { horizon: HOR, top: 300 });
    snowDepth();                                        // 与 A11/A13 同一层地面明度阶梯
    stumpField(gy, HOR);
    stumpOfTree(SEED_SPOT.stump, gy + 22, 7.4, { seed: 7 });   // 主桩：必须和 A11/A13 一样画在夜色层**之前**，
    F.grade(.48);                                     // 否则它在 A12 里是棕的、在 A11 里是灰的（一镜到底会跳色）
    paint(ellPts(holeX, holeY, 74, 26, 16, 3), { fill: mixCol(C.bark, C.ink, .45), fillOp: 210, bleed: .2, tex: .6, border: .3, ink: null });
    // 破土三段：拱（雪粒滚落）→ 直腰（停一拍）→ 展叶，叶尖亮
    const k = ease(seg(lt, 1.6, 15.4));
    P.sprout(holeX, sproutBase, U * 4.2, { k, pool: k > .55 });
    for (let i = 0; i < 5; i++) {
      const ph = clamp((k - .1 - i * .07) * 2.4); if (ph <= 0 || ph >= 1) continue;
      paint(ellPts(holeX + (hash(i) - .5) * 90 + (hash(i + 4) - .5) * 60 * ph, holeY - 20 - 26 * ph + 34 * ph * ph, 5, 4, 7), { wash: C.snowLt, washOp: 210 * (1 - ph), ink: null });
    }
    // 远处：睡着的小小一团，靠着他刚埋下种子的那棵桩
    // 袋子画在他**之前**：它躺在他身后右侧，画在后面才会被他的身体挡住一部分。
    // 原来画在 F.hero 之后，1:1 复核时米色的袋子正好糊住他的头和胸口。
    P.sack(SEED_SPOT.sack, gy + 10, U * .62, { big: true, pool: false, rot: 1.44 });
    F.hero(SEED_SPOT.hero, gy + 4, U, t, {
      view: 'side', flip: true, cold: .34, light: .2 * (.6 + .4 * Math.pow(Math.max(0, Math.sin(T * 1.05)), 2)),
      eyes: 'closed', mouth: null, sq: .32, dy: 2.4, rot: .17, aL: -1.15, aR: -1.2, lookX: -.3, lookY: .5, gloom: .12, boilKey: 'hero12',
    });
    P.breathFog(SEED_SPOT.hero - 88, gy - 2 * U, U * .5, frac(T * .17), C.snowLt);
    // 他的梦：嘴角动了一下（他知道了）
    if (lt > 16.6 && lt < 18.4) paint(ellPts(SEED_SPOT.hero - 80, gy - 2.5 * U, 5, 2.5, 8), { wash: mixCol(C.bark, C.warmLt, .4), washOp: 150, ink: null });
    // 萤火虫从他身上起飞，绕芽一周，把光留给它
    const circle = seg(lt, 12.4, 20.2);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + circle * 3.4, rr = lerp(30, 150, ease(circle));
      const fx = holeX + Math.cos(a) * rr, fy = sproutBase - U * 1.9 + Math.sin(a) * rr * .5;
      P.firefly(fx, fy, U * 1.15, { col: WARM, dir: Math.cos(a) > 0 ? 1 : -1, k: .95 * (1 - ease(seg(lt, 19, 20.2)) * .5) });
    }
    F.snowfall(t, 12, snowK(t), snowWind(t));
    camEnd();
    // A12→A13 不切：镜头直接开始拉远
  }

  // ============================================================ A13 · 299.85–331.29 · 拉远 · 弱收
  // 一镜到底的匀速拉远+升起：从特写到极远，最后画面里只剩三个点。
  // §71 P1#9 / **L4** —— 结尾背景"破了"。地基矩形（FILM 已按最远镜头留了 3400px 余量）这次没问题，
  // 破的是**两条固定世界尺寸的椭圆**：F.skyBand(rx 1500) 与 F.haze(rx 1500)。
  // 镜头一拉到 zoom<.62，一屏装下的世界就比 3000px 宽，椭圆的**左右端点落进画面**，
  // 于是天空里出现一条两头收口的透镜形亮带、地平线上出现一块断了边的亮皮 —— 用户看到的
  // "撕破的黄带子"。这里全部换成按当前镜头宽度铺满的 wideBand / wideHaze（只有竖向过渡）。
  // 另外 grade() 的"上半屏更黑"那一层是一条固定到 y=626 的矩形，拉到 .34 时它的下边缘正好
  // 落在地平线下方 23px，读成一道缝 —— 所以压完夜色还要在地平线上补一条软光把它糊过去。
  function sPull(t, lt, dur) {
    const t0 = B[12], gy = 880, HOR = 556, holeX = SEED_SPOT.x, holeY = gy + SEED_SPOT.dy, sproutBase = holeY - 4;
    const back = ease(clamp(lt / (dur - 6.4)));
    camBegin(lerp(1070, 1120, back), lerp(845, 648, back), lerp(2.2, .34, back));   // 起点= A12 的终点：一镜到底不许跳
    F.sky(mixCol('#101632', '#16204A', .5 + .5 * back));        // 云散了，星全出来了
    wideBand(196, 1500, 300, mixCol(F.SKYLO, '#33456F', .6), (.06 + .07 * back));
    wideStars(Math.round(6 + 14 * back), 20, 470, '#DCE8FA');
    // 远景林线 + 桩地：与 A11/A12 **同一批**（一镜到底不许换布景）。farFirs 按世界网格排，
    // 拉到 .34 时自动铺满 5600px 宽的地平线，不再出现"林子只占中间一条、两头凭空没了"。
    farFirs(HOR + 24, E.fir * .3, { tone: mixCol(C.sapDk, '#1A2340', .73) });
    F.ground(gy + 20, mixCol(F.snow, '#8E9CBC', .45), F.snowSh, { horizon: HOR, top: 300 });
    snowDepth();                                        // 与 A11/A12 同一层地面明度阶梯
    wideHaze(HOR + 26, .45);
    stumpField(gy, HOR);                                    // 与 A11/A12 同一批桩：一镜到底不许换
    stumpOfTree(SEED_SPOT.stump, gy + 22, 7.4, { seed: 7 });
    F.grade(.46 + .1 * back);                             // §58 环境之后才压夜色
    wideBand(648, 1500, 190, mixCol(F.SKY, '#05070F', .3), .1);   // 把 grade 那条 y=626 的硬边糊掉
    wideHaze(HOR + 34, .5 * (1 - .4 * back));
    paint(ellPts(holeX, holeY, 74, 26, 16, 3), { fill: mixCol(C.bark, C.ink, .45), fillOp: 210, bleed: .2, tex: .6, border: .3, ink: null });
    P.sprout(holeX, sproutBase, U * 4.2, { k: 1, pool: true });
    P.sack(SEED_SPOT.sack, gy + 10, U * .62, { big: true, pool: false, rot: 1.44 });   // 同 A12：在他之前画
    F.hero(SEED_SPOT.hero, gy + 4, U, t, {
      view: 'side', flip: true, cold: .34, light: .2 * (.6 + .4 * Math.pow(Math.max(0, Math.sin(T * 1.05)), 2)),
      eyes: 'closed', mouth: null, sq: .32, dy: 2.4, rot: .17, aL: -1.15, aR: -1.2, lookX: -.3, lookY: .5, gloom: .12, boilKey: 'hero13',
    });
    // 芽的最后一点微光（画在镜头**里面**：原来它写在 camEnd 之后，于是它钉在屏幕上，
    // 拉远之后和芽完全不是同一个位置）
    const dark = ease(seg(lt, dur - 6.2, dur - 2.4));
    if (dark > .05 && dark < .98) P.halo(holeX, holeY - 70, 60 * (1 - dark), C.warm, .9 * (1 - dark));
    // 最高处一颗星，和芽**同频**闪一下（天与地呼应一拍）
    const beat = .72 + .28 * Math.pow(Math.max(0, Math.sin(T * 3.1)), 6);
    const sync = ease(seg(lt, 24.6, 26.2)) * (1 - ease(seg(lt, 27.4, 28.8)));
    if (sync > .02) {
      const sx = 1180, sy = 132;
      P.halo(sx, sy, 46 * (1 + .5 * sync * beat), '#EAF2FF', .9 * sync);
      paint(ellPts(sx, sy, 5, 5, 8), { wash: '#FFFFFF', washOp: 240 * sync, ink: null });
      inkLine([[sx - 26, sy], [sx + 26, sy]], P.swOf(24), '#EAF2FF', 'inkfine', 0);
      inkLine([[sx, sy - 26], [sx, sy + 26]], P.swOf(24), '#EAF2FF', 'inkfine', 0);
    }
    F.snowfall(t, 10, snowK(t), snowWind(t));   // 到这里已经快停了（§A11「雪几乎停了」）
    camEnd();
    // R25-1：一边拉远一边旧掉。镜头在 lt 25.04 冻结，所以毛刺在 lt 21 走满、24.5 起退，
    // 正好把"消失"这件事交给下面那道洗黑的 dip —— 毛刺负责"旧"，dip 负责"没了"。
    memGlitch(.85 * ease(seg(lt, 7, 21)) * (1 - ease(seg(lt, 25, 28))), t);
    // 洗黑：全黑 → 芽的微光最后熄一下
    F.dip(dark * .92);
    // §A13 结尾承诺的是"画面几乎全黑，只有三个点：芽的微光、他胸口的灯、最高处一颗星"。
    // 原来这三个点**画在 dip 之前**，于是和场景一起被压进 92% 的黑里 —— 成片最后 2.4 秒
    // 是纯黑屏（拿改动前的旧帧逐帧比过：这是一直如此，不是本轮改坏的）。
    // 现在反过来：黑压满之后再把三个点画在黑上面，dip 越满它们越清楚，而**芽熄在最后**。
    // 镜头在 lt 25.04 就冻结了（back=1），所以画在屏幕上和钉在世界里此刻等价，不会漂。
    const dots = ease(seg(lt, dur - 5.0, dur - 3.2)) * (1 - ease(seg(lt, dur - 1.0, dur - .05)));
    // 星和他胸口的灯**先熄**，芽留到最后 —— 剧本写的是"芽的微光最后熄一下"，
    // 顺序倒了就变成"树比人先放弃"，这一场的全部意思就在这一下。
    const gone = dots * (1 - ease(seg(lt, dur - 2.6, dur - .9)));
    if (dots > .01) {
      const [sx, sy] = toScreen(1180, 132, LAST_CAM);                        // 最高处一颗星
      const [bx, by] = toScreen(holeX, sproutBase - U * 1.63, LAST_CAM);     // 芽尖
      const [hx, hy] = toScreen(SEED_SPOT.hero - 20, gy - 4 * U, LAST_CAM);  // 他胸口的灯
      const pulse = .78 + .22 * Math.pow(Math.max(0, Math.sin(T * 3.1)), 6); // 星与芽同频
      P.halo(sx, sy, 30 * pulse, '#EAF2FF', .5 * gone);
      paint(ellPts(sx, sy, 3.2, 3.2, 8), { wash: '#FFFFFF', washOp: 250 * gone, ink: null });
      P.halo(hx, hy, 22, C.warm, .42 * gone * (.6 + .4 * Math.pow(Math.max(0, Math.sin(T * 1.05)), 2)));
      paint(ellPts(hx, hy, 2.6, 2.6, 8), { wash: C.warmLt, washOp: 230 * gone, ink: null });
      P.halo(bx, by, 26 * pulse, C.warm, .5 * dots);
      paint(ellPts(bx, by, 3, 2.6, 8), { wash: C.warmLt, washOp: 245 * dots, ink: null });
    }
  }

  // ============================================================ 卡 · 331.29–335.1 · 「many years later...」
  // 第一部与第二部之间的 3.8 秒静默。手写体，和转场同一支笔。
  function sCard(t, lt, dur) {
    F.dip(1);
    const a = ease(seg(lt, .5, 1.5)) * (1 - ease(seg(lt, 2.9, 3.8)));
    if (a > .01) letter('many years later...', W * .5, H * .52, 74, mixCol('#EFE6D2', C.warmLt, .25), { font: F.HAND(74), alpha: a, rot: -.012, ink: false });
  }

  shots(B.slice(0, -1).map((b, i) => [b, [sAlone, sViolet, sBlue, sGreen, sLake, sBottom,
    sFireflies, sSanta, sBread, sCandles, sSeed, sSprout, sPull, sCard][i]]));
})();
