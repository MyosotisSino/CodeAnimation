// film.js — 两部片子共用的地基：夜空、雪原、星、雪粒、走位、群众、倒影、片名与片尾。
//
// 它存在的理由就是 §43/§51 的诊断：以前每一个镜头都要在场景里现场编一遍天空和地面、现场编一遍"往哪边脸"，
// 编漏了就剩下"人在发呆"和"倒着走路"。把这些固定下来之后，场景里只剩表演。
//
// 三条硬规则（每一条都是问题文档教育出来的）：
//   1. 不用 glow()。一次 glow 强制整块 mask 合成，实测约 1s/帧；全片的光一律是画出来的
//      PROP.halo / PROP.lightPatch / PROP.litFace（§46 收紧过的衰减）。
//   2. 非光的东西不能比光亮。颜色从 PROP.C 取；要更暗就 PROP.dim(col, PROP.TONE.某档)。
//      亮度是面积乘出来的，大面积涂装面压到 mid（§48）。
//   3. 往左走必须 flip:true。VIEWS 里所有视角都朝右，用 kf 让 x 递减而不翻面 = 倒着走（§23 原始事故）。
//      所以场景里不要手搓 walk，用 FILM.walkTo()，它从位移的符号推出朝向。
//
// 顺序：config → core → clawd → timeline → sheets → jobs → props → **film** → scenes/*.js
(() => {
  const C = PROP.C, TONE = PROP.TONE, dim = PROP.dim, E = PROP.SCALE.env;

  // ---------- 全片色板（夜色与三种"没有温度的光"）----------
  const F = {
    SKY: '#14182E', SKYLO: '#20264A', INK: '#1E2238',
    snow: dim('#DCE6F2', .5), snowLit: dim('#EAF0F8', .56), snowSh: dim('#8FA2C0', .34), snowDeep: dim('#6C7FA2', .26),
    grass: dim('#8FA98E', .34), grassDk: dim('#5E7262', .26),
    city: dim('#565E76', .3), cityDk: dim('#3E445C', .22),
    rock: dim('#5E5A72', .3), iron: '#4A505C',
    VIO: dim('#8A5CB8', TONE.warm), BLU: dim('#3A5CA8', TONE.warm), GRN: dim('#5E9E5A', TONE.warm),
    // §75 上面三个是**材质级**（给衣服、墙、雪染色调用），拿来画光就太暗 —— A5 的子代理只能自己在场景里造一份。
    // 这三个是**发光级**（TONE.light/hot 档），场景里画冷色的光请直接用它们，不要再手抄 hex。
    VIOHOT: '#C79BF0', BLUHOT: '#8FB6F2', GRNHOT: '#A6E88F', WARMHOT: '#FFE9A8',
    WARM: C.warm, warmLt: C.warmLt,
    hero: { col: '#D97757', dk: '#A84D33', lt: '#F2A283' },        // 主角保持暖色，越到后面越冷（cold 参数插值）
  };
  const cold = k => ({ col: mixCol(F.hero.col, '#5E6488', k), dk: mixCol(F.hero.dk, '#3A4060', k), lt: mixCol(F.hero.lt, '#9EA0B8', k) });

  // ---------- 天地 ----------
  // 天空只用 wash + 一条地平 ink，水彩 fill 是贵操作（MV_WORKFLOW §3）。矩形一律向四周超出画面 3400px：
  // §71 A13 的结尾拉到 zoom .34，一屏装下的世界是 1920/.34 ≈ 5600px 宽，
  // 原来"四周 +900"的矩形当场就不够用了 —— 于是纸色底从天空两侧露出来，skyBand 那条椭圆
  // 压在纸上变成一条**撕破的黄带子**（用户 P1#9："背景破了"）。
  const OX = 3400, OY = 2600;
  function sky(col = F.SKY, k = 1) {
    boilSeed('f.sky');
    paint(rectPts(-OX, -OY, W + OX * 2, H + OY * 2), { wash: col, washOp: 255 * clamp(k), ink: null });
  }
  // 地平线以上的一条低云/夜色带：给天空一点重量，不然像贴纸
  // 把横向要覆盖多少世界像素换算成当前相机下真的能盖住画面的值。
  const wide = (w) => Math.max(w, (CAM ? W / Math.max(.08, CAM.zoom) : W) * .75);
  function skyBand(y = 240, w = 1000, h = 130, col = F.SKYLO, a = .55) {
    w = wide(w);                                   // §78 跟着相机走，否则拉远时端点入画 = 撕裂带
    boilSeed('f.band');
    paint(ellPts(W * .5, y, w, h, 22, 8), { wash: col, washOp: 150 * a, ink: null });
  }
  function stars(n = 7, y0 = 60, y1 = 300, col = '#C9D6EC') {
    for (let i = 0; i < n; i++) {
      boilSeed('f.star' + i);
      const a = .45 + .55 * Math.sin(T * (.8 + hash(i)) + i * 2.3);
      paint(ellPts(hash(i + 40) * W, y0 + hash(i + 9) * (y1 - y0), 1.6 + 2 * a, 1.6 + 2 * a, 6), { wash: col, washOp: 110 + 120 * a, ink: null });
    }
  }
  // 雪原：一条地平 ink + 上表面提亮 + 三道远雪坎。gy = 地平线（脚踩的那条线）。
  function ground(gy = 830, col = F.snow, sh = F.snowSh, opts = {}) {
    boilSeed('f.gnd');
    const top = opts.top === undefined ? 520 : opts.top;
    // §70 地面必须**从地平线一路铺到画面底**。原来只从 gy 往下画，于是任何放在 gy 以上的远景物件
    // （A11/A13 的远处树墩）都等于放在天上 —— 用户："那些远景的树墩像是悬空一样"。
    // 传 horizon = 地平线的 y，地面矩形就从 horizon 开始；再配合 depthY() 摆远景。
    const y0 = opts.horizon === undefined ? gy : Math.min(gy, opts.horizon);
    paint(rectPts(-OX, y0, W + OX * 2, gy - y0 + top + OY, 4), { wash: col, fill: sh, fillOp: 60, bleed: .08, tex: .5, ink: opts.ink || mixCol(F.INK, col, .35), sw: 1 });
    if (opts.lit !== false) for (let i = 0; i < 3; i++) {
      boilSeed('f.drift' + i);
      paint(ellPts(hash(i + 3) * W, gy + 26 + i * 44, 260 + 190 * hash(i), 12 + 6 * i, 16, 3), { wash: F.snowLit, washOp: 44, ink: null });
    }
  }
  // 进深 → 这条地面带里的 y。d=0 贴地平线（最远、最小、最暗），d=1 到近地面 gy。
  // 铁律：**任何物件的 y 都不能小于 horizon**，否则它就在地面之外 = 悬空。
  const depthY = (horizon, gy, d) => lerp(horizon, gy, ease(clamp(d)));
  // §70 2D 动画里的"躲在……后面"：不能把角色压到掩体底下（那是 3D 的遮挡语义，结果就是角色消失，
  // 用户 P1#3："应该不是真的表现在底部，而是另一侧"）。正确做法是**贴掩体的侧边缘**，
  // 身体仍可见、被掩体咬住一部分。behind() 算出这个 x：掩体右唇外（或左唇外）露出多少。
  const behind = (coverX, coverHalfW, u, show = .42, side = 1) => coverX + side * (coverHalfW - u * (10 - 10 * show) * .5);
  // 一段坡地（A4/B2 的伐木坡）：三点折线，比矩形更像一个"世界有起伏"
  function slope(pts, col = F.snow, sh = F.snowSh) {
    boilSeed('f.slope');
    paint(pts, { wash: col, fill: sh, fillOp: 68, bleed: .08, tex: .5, border: 0, ink: mixCol(F.INK, col, .3), sw: 1, curv: .25 });
  }
  // 水面/冰面：深色椭圆 + 几条冷反光。reflections() 负责真正的倒影。
  function water(cx, cy, rx, ry, col = '#22305A', dark = 0) {
    boilSeed('f.water');
    paint(ellPts(cx, cy, rx, ry, 38, 4), { wash: mixCol(col, '#0E1420', dark), fill: mixCol(col, '#0A0F1C', dark), fillOp: 88, bleed: .06, tex: .4, ink: mixCol(F.INK, col, .4), sw: 1.2 });
  }
  // 倒影：把一段世界坐标的画法沿 y=gy 翻下去，再用横向雪线把它打碎。
  // §19 的原始事故是"倒影是正着的"——这里从机制上保证它是反的。
  function reflection(gy, drawFn, k = 1, col = null) {
    if (k <= .03) return;
    push(); translate(0, 2 * gy); scale(1, -1);
    drawingContext.globalAlpha = 1;
    drawFn();
    pop();
    for (let i = 0; i < 5; i++) {   // 水面横纹：把倒影切断成"水里的东西"
      boilSeed('f.rip' + i);
      const yy = gy + 14 + i * 26 * k;
      inkLine([[W * .5 - 620 + Math.sin(T * .7 + i) * 22, yy], [W * .5 + 620 + Math.cos(T * .6 + i) * 22, yy + 3]], 1.1 + i * .2, col || mixCol(F.snowSh, '#0E1420', .35), 'inkfine', .5);
    }
  }

  // ---------- 夜色层（§48 的落地方式）----------
  // 道具库里的白布、蜡、钢、木是照着检查表的纸色底画的，直接摆进夜里就会亮过光——那正是 §48 的原始抱怨。
  // 逐件改暗会毁掉检查表的可读性（也毁掉白天镜头），所以统一在"环境画完、光还没画"的那一刻压一层冷黑：
  // 传统手绘动画处理夜戏就是这个办法（先在白纸上画好，再整体罩一层夜色）。
  // 顺序因此固定：stage → 建筑/树/道具 → **grade()** → 光斑与光源 → 角色 → 雪与事件。
  function grade(k = .46, col = '#0E1424') {
    if (k <= .01) return;
    boilSeed('f.grade');
    paint(rectPts(-OX, -OY, W + OX * 2, H + OY * 2), { wash: col, washOp: 255 * clamp(k), ink: null });
    paint(rectPts(-OX, -OY, W + OX * 2, H * .58 + OY), { wash: mixCol(col, '#05070F', .4), washOp: 120 * clamp(k), ink: null });
  }
  // 空气透视：越远越糊进夜色里。地平线那条带子提一点亮，雪原才有"延伸到很远"的感觉。
  function haze(gy, k = 1, col = F.snowSh) {
    if (k <= .02) return;
    const hw = wide(1500);
    boilSeed('f.haze');
    for (let i = 0; i < 3; i++) paint(ellPts(W * .5, gy - 6 - i * 9, hw, 26 + i * 12, 22, 6), { wash: col, washOp: 34 * k * (1 - i * .22), ink: null });
  }

  // ---------- 天气 ----------
  // §72 用户："雪骤停"、"雪下得太小"。
  // 骤停的根因：场景里把 k 当开关用（`if (lt > x) snowfall(...)` 或 k 从 1 直接跳 0）。
  //   → 现在 k **同时**驱动"哪些片子还在"（逐片阈值）和"每片多大多淡"，所以 k 连续下降时
  //     雪是**越下越稀、越下越小**地褪掉，而不是整屏一起消失。场景侧请用 `snowFade()` 拿 k。
  // 太小的根因：原来只有 1/6 算"近片"、半径 2.2~5.6px，且没给 washOp，落在雪地上几乎看不见。
  //   → 改成**三层景深**：远（细密、慢、淡）/ 中 / 近（大颗、快、带风向拖尾）。
  function snowfall(t, n = 40, k = 1, wind = -60) {
    k = clamp(k); if (k <= .02 || n <= 0) return;
    for (let i = 0; i < n; i++) {
      if (hash(i + 71) > k * 1.08) continue;                     // 逐片阈值：k 越小越少，但是连续地少
      boilSeed('f.sn' + i);
      const band = i % 3, far = band === 0, near = band === 2;
      const sp = (26 + 54 * hash(i + 13)) * (near ? 2.2 : far ? .55 : 1);
      const drift = wind * (.4 + hash(i + 7) * (near ? 1.5 : .6)) + Math.sin(t * (.5 + hash(i) * .5) + i) * 22;
      const x = frac(hash(i) * 9 + t * drift / 900) * (W + 320) - 160;
      const y = frac(hash(i + 90) * 7 + t * sp / 620) * (H + 160) - 80;
      const r = (far ? 2.6 : near ? 9.5 : 5.4) * (.75 + .5 * hash(i + 31)) * (.55 + .45 * k);
      const op = (far ? 95 : near ? 235 : 175) * (.35 + .65 * k);
      paint(ellPts(x, y, r, r * (.82 + .18 * hash(i + 5)), near ? 9 : 7), { wash: mixCol(F.snowLit, F.snowSh, hash(i + 3) * (near ? .25 : .6)), washOp: op, ink: null });
      if (near && Math.abs(wind) > 40) inkLine([[x, y], [x - wind * .075, y - sp * .09]], .45, F.snowLit, 'inkfine', 0);   // 近片被风拉出短拖尾
    }
  }
  // 雪况曲线：从 t0 起 `down` 秒内落到满量、在 t1..t1+out 之间**连续**褪到 0。
  // 场景里一律用它算 k，不要写 `lt > x ? 1 : 0` —— 那就是用户说的"雪骤停"。
  function snowWeather(t, t0, t1, out = 4, peak = 1) {
    return peak * ease(seg(t, t0, t0 + 3.5)) * (1 - ease(seg(t, t1, t1 + out)));
  }
  function gusts(t, k, dir = -1, n = 6) {
    if (k <= .02) return;
    for (let i = 0; i < n; i++) {
      boilSeed('f.gu' + i);
      const y0 = 80 + hash(i + 3) * (H - 220), sp = 400 + 600 * hash(i + 11);
      const x0 = frac(hash(i) * 3 + t * sp / 2400) * (W + 600) - 300, l = (100 + 160 * hash(i + 5)) * k;
      inkLine([[x0, y0], [x0 + l * .5 * dir, y0 - l * .05], [x0 + l * dir, y0 + l * .04]], .9, mixCol(F.snowLit, F.SKY, .5), 'inkfine', .4);
    }
  }
  // 贴地横漂的远景雪幕（§10）
  function snowVeil(y, h, k = 1) { PROP.snowVeil(y, h, k, T); }

  // ---------- 走位：从位移符号推朝向 ----------
  // 返回可直接 spread 进 clawd()/job() 的 {x, view, flip, walk, dy}。
  // style 'walk'|'run' 决定步频与起伏；pause 让它在到位后自然站定转正面。
  // §66 步态必须由**拍**驱动，不能由秒驱动：原来 walk = frac(t * 1.55) 是一个自由时钟，
  // 所以角色走得再久也没有一步踩在鼓点上（用户："步伐没有和音乐节奏对上"）。
  // 现在：走 = 两拍一个完整步态周期（每拍落一只脚），跑 = 一拍一周期（每半拍落一只脚）。
  // 位置仍由关键帧决定（保证按时到达），只有**节奏**锁拍 —— 轻微滑步远好过漂浮+错位。
  const gait = (t, style) => frac(bpOf(t) * (style === 'run' ? 1 : .5));
  function walkTo(t, t0, t1, x0, x1, u, style = 'walk', view = 'side') {
    const k = ease(seg(t, t0, t1)), x = lerp(x0, x1, k), moving = t > t0 && t < t1;
    const bob = style === 'run' ? .5 : .26, ph = gait(t, style);
    // 起伏锁在同一个相位上：|sin| 在落拍的瞬间过零（脚踩实、身体最低），在迈步中途到达顶点。
    return { x, view: moving ? view : 'front', flip: x1 < x0, walk: moving ? ph : null, dy: moving ? -Math.abs(Math.sin(ph * TAU)) * bob : 0 };
  }
  // 原地踏步（已经在路上、但 x 由 kf 管）：只给步态与起伏，朝向由调用方给。
  function step(t, u, style = 'walk', ph = 0) {
    const p = frac(gait(t, style) + ph);
    return { walk: p, dy: -Math.abs(Math.sin(p * TAU)) * (style === 'run' ? .5 : .26) };
  }

  // ---------- 角色 ----------
  // 旧 Clawd（第一部主角）：没有职业装，只有一条大了两号的破围巾和胸口那粒光。
  function hero(x, gy, u, t, o = {}) {
    const lvl = o.light === undefined ? .5 : o.light;
    const { light, draw, ...rest } = o;
    return clawd(x, gy, u, {
      ...F.hero, ...cold(o.cold === undefined ? .72 : o.cold), ...rest,
      draw: (uu, sw) => {
        PROP.scarf(uu, { wind: o.wind === undefined ? .3 : o.wind, col: o.scarfCol || C.scarf });
        chestLight(uu, lvl * (o.beatPulse ? (.82 + .18 * pulse(t, 5)) : 1), o.lightCol || C.warm);
        if (draw) draw(uu, sw);
      },
    });
  }
  // 新 Clawd（第二部主角）：同一条围巾的残片 + 叶子挂牌。挂牌亮 = 心里那件事还记得。
  function newClawd(x, gy, u, t, o = {}) {
    const lvl = o.light === undefined ? .8 : o.light;
    const { light, draw, ...rest } = o;
    return clawd(x, gy, u, {
      ...F.hero, ...cold(o.cold === undefined ? .18 : o.cold), ...rest,
      draw: (uu, sw) => {
        chestLight(uu, lvl, o.lightCol || C.warm);
        PROP.leafBadge(0, 0, uu, { lit: o.badge === undefined ? .85 : o.badge });
        if (draw) draw(uu, sw);
      },
    });
  }
  // 背景群众：几笔剪影。一帧里真 clawd 不超过 5 个，其余全部走这里（MV_WORKFLOW §3 性能铁律）。
  function sil(x, gy, u, col, lit = 0, bent = 0, o = {}) {
    boilSeed('f.sil' + Math.round(x) + '_' + Math.round(gy));
    const dk = o.ink || F.INK;
    paint(ellPts(x, gy + 2, u * 1.4, u * .18, 10), { fill: dk, fillOp: 50, bleed: .25, ink: null });
    push(); translate(x, gy); scale(1 + bent * .08, 1 - bent * .1);
    paint(rectPts(-4.6 * u, -7.6 * u, 9.2 * u, 5.4 * u, u * .3), { wash: col, ink: mixCol(dk, '#101630', .3), sw: clamp(u / 16, .5, 1.1) });
    paint(rectPts(-4 * u, -2.3 * u, u, 2.3 * u, u * .15), { wash: mixCol(col, dk, .35), ink: null });
    paint(rectPts(2.6 * u, -2.3 * u, u, 2.3 * u, u * .15), { wash: mixCol(col, dk, .35), ink: null });
    for (const sd of [-1, 1]) paint(rectPts(sd * 2.5 * u - .5 * u, -6.9 * u, u, 2 * u, u * .08), { wash: dk, ink: null });
    if (lit > 0) { PROP.halo(0, -3.2 * u, u * 1.5 * lit, C.warm, lit); paint(ellPts(0, -3.2 * u, u * .26, u * .32, 8), { wash: C.warmLt, ink: null }); }
    pop();
  }
  // 一排群众：身高、间距、冷暖、亮灯各自错开。§30 的"同色同形"就是缺这个抖动。
  function crowd(x0, gy, n, step_, u, o = {}) {
    for (let i = 0; i < n; i++) {
      const k = hash(i * 5.7 + (o.seed || 0));
      sil(x0 + i * step_ * (.85 + .3 * k), gy + (k - .5) * u * 1.4, u * (.78 + .42 * k),
        mixCol(o.col || dim('#8E86A0', .34), o.dk || F.cityDk, .25 + .5 * hash(i + 3)),
        (o.lit === undefined ? .5 : o.lit) * (.35 + .65 * hash(i + 11)), (o.bent || 0) * (.5 + hash(i + 7)), { ink: o.ink });
    }
  }

  // ---------- 光落到东西上（§21/§42/§46 的统一入口）----------
  // 每个光源都必须调用它一次：光斑落在地面，观众才知道光从哪来、照亮了谁。
  function lamp(x, gy, r, col, k = 1) { PROP.lightPatch(x, gy, r, col, k); }
  // 一整个"被照亮的人"：给角色身上叠一层贴面光（在角色**之后**画）
  function litOn(x, gy, u, col, k = 1, dir = 0) { PROP.litFace(x, gy - 4.4 * u, 6.4 * u, 5.2 * u, col, k, dir); }

  // ---------- 片名 / 片尾 ----------
  // 用户要求：片名直接浮在画面上约 3 秒，不要单独黑屏报幕；字体与转场字幕一致（Homemade Apple 手写体）。
  const HAND = px => `600 ${px}px "Caveat", cursive`;   // §65 原来是 Homemade Apple：连笔太密，OCR 与肉眼都认不出。Patrick Hand 仍是手写体但字形分开、小字号也读得清。
  function title(a) {
    a = clamp(a); if (a <= .01) return;
    const ink = mixCol('#F6EFDF', '#FFF6DC', .35);
    // 浮在天空区域：画面里角色在下半，字在上三分之一，不压表演
    letter('Seed of The Light', W * .5, H * .27, 112, ink, { font: HAND(112), alpha: a, rot: -.014, ink: false });
    letter('by Zhongzheng Bao', W * .5, H * .27 + 96, 40, mixCol(ink, F.snowLit, .45), { font: HAND(40), alpha: a * .88, rot: -.014, ink: false });
  }
  function theEnd(a) {
    a = clamp(a); if (a <= .01) return;
    letter('The End', W * .5, H * .46, 104, mixCol('#F6EFDF', C.warmLt, .3), { font: HAND(104), alpha: a, rot: -.014, ink: false });
  }

  // ---------- 转场 ----------
  const wipeOut = (lt, dur, cols) => { boilSeed('wipe'); if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, cols); };
  const wipeIn = (lt, cols) => { boilSeed('wipe'); if (lt < .3) brushWipe(.5 + lt / .6, cols); };
  // 淡入淡出到某个纯色（比 brushWipe 安静，用在"呼吸点"和段落收束上）
  function dip(k, col = '#191D33') { if (k > .005) { boilSeed('dip'); const r = camRect(); paint(rectPts(r[0], r[1], r[2], r[3]), { wash: col, washOp: 255 * clamp(k), ink: null }); } }
  // 开场/收场的圆形光圈（在屏幕空间调用）
  const irisIn = (sx, sy, k) => { if (k < 1) iris(sx, sy, lerp(0, 1750, easeIn(k))); };
  const irisOut = (sx, sy, k) => { if (k > 0) iris(sx, sy, lerp(1750, 0, easeIn(k))); };

  // ---------- 对话云 ----------
  // §67 用户："交互完全没有，纯粹是角色在反复摇晃，我觉得可以加一些对话云"。
  // 剧本里很多节拍没有台词就立不起来（奸商讨价还价、樵夫呵斥、老人郑重接过蜡烛）。
  // 硬规则：仍然是 **t 的纯函数** —— 入/出场由 t0 与 dur 算 alpha，不许有跨帧状态（帧是乱序并行渲的）。
  // 气泡用 brush 画（所以它排在画面里），文字用 letter()（合成在最上层）—— 顺序天然正确。
  function say(t, t0, x, y, txt, o = {}) {
    const dur = o.dur || 2.4, a = clamp(ease(seg(t, t0, t0 + .2)) * (1 - ease(seg(t, t0 + dur - .35, t0 + dur))));
    if (a <= .02) return false;
    const size = o.size || 58, font = HAND(size), pop = .86 + .14 * backOut(clamp((t - t0) / .26));
    const c = letG.drawingContext; c.save(); c.font = font; const tw = c.measureText(txt).width; c.restore();
    const w = (tw + size * 1.6) * pop, h = size * 1.75 * pop;
    // 云**不许挂在画面外**（第二十二轮 R22-1）：A9 的 `Thank you!` 中心 x 离画面右缘太近，
    // 整朵云的右侧被切掉，观众读到的是"一只被裁了一半的对话框"（f05160 裁切）——
    // 用户点名要的那句谢，形式上反而废了。视野用 camRect（和 flash/iris 同一套算法），
    // 而且**只在真的会出界时**才平移，所以其它镜头一个像素都不动。
    const vq = camRect(20), hw = w * .56;
    x = clamp(x, vq[0] + hw, vq[0] + vq[2] - hw);
    // 第十七轮 3：圆角矩形"太机械"。对话云要**真的像一朵云** —— 轮廓是一串鼓包，
    // 用按角度调制半径的闭合曲线画（和火苗同一套办法）。尾巴也不是尖 V，
    // 而是**由大到小的三个圆团**一路引到说话者头顶：经典漫画语法，
    // 而且尖角和气泡边缘相接处一定会露缝（§68 踩过，那时只能改成不填色）。
    const cy0 = y - h * .5, seed = x * .013 + y * .007;
    const cloud = [], nc = 34, lobes = 7;
    for (let i = 0; i <= nc; i++) {
      const a = -Math.PI / 2 + i / nc * Math.PI * 2;
      const lobe = 1 + .115 * Math.sin(a * lobes + seed) + .05 * Math.sin(a * (lobes + 3) - seed * 2.1);
      cloud.push([x + Math.cos(a) * w * .5 * lobe, cy0 + Math.sin(a) * h * .5 * (a > 0 ? 1.05 : 1) * lobe]);
    }
    paint(cloud, { fill: o.fill || '#F3ECDC', fillOp: 250 * a, tex: .3, border: .28, ink: mixCol(PAL.ink, '#4A4560', .25),
      sw: clamp(size / 26, .7, 1.9), wash: null, curv: .55 });
    if (o.tail !== false) {
      const tx = clamp(o.tailX ?? x + size, x - w * .45, x + w * .45), ty = y + (o.tailDrop || size * 2.0);
      for (let i = 0; i < 3; i++) {
        const q = i / 2, r = h * (.115 - .05 * q);
        paint(ellPts(lerp(x, tx, .45 + q * .55), lerp(y + h * .16, ty, .18 + q * .82), r * 1.3, r, 12, 0, .3),
          { fill: o.fill || '#F3ECDC', fillOp: 250 * a, tex: .3, border: .28, ink: mixCol(PAL.ink, '#4A4560', .25),
            sw: clamp(size / 36, .45, 1.4), wash: null });
      }
    }
    letter(txt, x, y - h * .5, size, o.col || PAL.ink, { font, alpha: a, align: 'center', ink: false });
    return true;
  }
  // 一句台词该占几拍：128BPM 下一拍 .469s，"How much?" 这种短促句给 3 拍，长句给 6-8 拍。
  const bt = (n) => n * 60 / (window.PROJECT ? PROJECT.bpm : 128);

  window.FILM = { ...F, C, TONE, E, dim, cold, sky, skyBand, stars, ground, slope, water, reflection,
    grade, haze, snowfall, snowWeather, gusts, snowVeil, depthY, behind, walkTo, step, gait, hero, newClawd, sil, crowd, lamp, litOn, title, theEnd,
    say, bt, wipeOut, wipeIn, dip, irisIn, irisOut, HAND, PROP, job };
})();
