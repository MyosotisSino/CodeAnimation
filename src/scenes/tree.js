// tree.js — Part II "The Last Tree" (《最后一棵树》, 2:34, 120 BPM, first downbeat 0.25 s).
//
// 第九轮整部重写。和旧简报相比，三处根本差别塑造了下面每一行代码：
//   1. **白天。** 第二部主体是有太阳的白天，`F.grade()` 在日景里几乎关掉。污染之所以看得见，是因为被污染的
//      那个世界本来是干净的：河从管口开始发黑、天空被烟捂成土黄。人工光只允许出现在 B9 日夜更替的
//      **夜相**里，而且必须是黄光 —— 黄光回来 = 一切在变好。冷色霓虹不再是底色。
//   2. **尺度遵循事实，用镜头距离表达，不用像素表达。** 楼房 8~13 英雄高 > 大树 5.2 ≈ 挖掘机 3.6（臂展近 4）
//      >> 人物 1。要谁显得大就把镜头推到谁跟前（楼房只露低层）；要表现环境巨变就拉到 0.35~0.45
//      （人变成点、整条街和河湾全摊开）。护罩那棵树要**小**、废气要**大**，这个对比就是故事。
//   3. **连续存在。** 角色从画外走进来、或镜头先摇开再找到他；离开也一样。道具一场一场地存在着
//      （围挡、排污管、机器、种下的苗），不闪现、不瞬移、不跨场残留。
//
// 世界坐标（一部片一套，所有场次共用，这样机位一动世界还是同一个世界）：
//   FY=648 对岸街面（楼房站在这条线上，S4 的街道在这里）  FQ=672 对岸岸沿
//   水面带 676..876 —— 河和街面**共用一个地面**，向画面深处退上去，所以它不是"马路底下一层的下水道"
//   QUAY=876 近岸压顶石  GY=906 滨河步道（主角这一侧）     REND=2350 河尾（向右拐进绿地后面）
//   BX=2200 那棵树（第一部的种子长成的）  FX=2980 河对岸的工厂（gy=FY）
//
// 顺序硬规则：camBegin → 天/太阳 → 远景天际线 → 地面 → 中景建筑/河 → grade() → 光 → 角色 → 粒子 → camEnd → 叠加层。
(() => {
  const B = [0, 14.25, 26.25, 50.25, 70.25, 74.25, 86.25, 98.25, 110.25, 133, 153.75];
  const F = FILM, P = PROP, C = P.C, EV = P.EVENTS;
  const halo = P.halo, swOf = P.swOf;
  const WARM = F.WARM, HERO = P.HERO;

  // ---------------- 世界 ----------------
  const GY = 906, QUAY = 876, WTOP = 676, FY = 648, FQ = 672;
  const REND = 2350, TX = 1980, BX = TX + 220, FX = 2980;
  const TREEM = 5.2, EXCM = 3.6, FACM = 9;      // 大树 5.2、挖掘机 3.6、厂房 9 —— 树**没有**楼高
  const OX = 4800, OY = 3600;                   // 极广镜头（zoom .35 一屏装 5500px）要够用的底

  // ---------------- 白天色板（§48 的档位照夜戏定的；日景另起一套：白天所有东西都亮，黑才是主角）----------------
  const DAY = {
    sky: '#9CC0D8', skyLo: '#D2E4EC', cloud: '#E6EFF4',
    stone: '#C6B69E', brick: '#B08D74', slate: '#93A0A8', roof: '#6E6257', glass: '#59707F',
    grass: '#8FA873', grassDk: '#6F8A5A', paving: '#A9A292', quay: '#ADA492',
    water: '#6E9DB6', waterDk: '#4E7B95', iron: '#5E6470',
  };
  const DUST = '#7A6A4E';                        // 雾霾的本色：土黄，不是夜蓝
  const tone = (c, sm, nt) => mixCol(mixCol(c, mixCol(DUST, '#16140E', .5), Math.max(0, Math.min(1, sm)) * .82),
    '#252B4A', Math.max(0, Math.min(1, nt)) * .7);

  // ---------------- 全片的污染/复原曲线（都是 t 的纯函数）----------------
  const smother = t => kf(t, [[20, 0], [30, .12], [44, .45], [52, .72], [70, .86], [86, .9], [99, .7],
    [110, .42], [118, .18], [126, .04], [154, 0]]);
  const blackK = t => kf(t, [[26, 0], [31, .1], [40, .45], [48, .9], [52, 1], [108, 1], [116, .5], [123, .12], [128, 0], [154, 0]]);
  const smokeK = t => kf(t, [[15, 0], [20, .18], [27, .4], [36, .78], [50, .95], [88, 1], [94, .8], [101, .3], [110, .06], [154, 0]]);
  const litFish = t => {   // 黑水漫到哪一列鱼，哪一列的灯灭（灭之前挣扎闪三下）；复原时按顺序回来
    const die = [30, 34, 38.5, 43, 47, 51], born = [112, 115, 118, 121, 124, 127];
    return [0, 1, 2, 3, 4, 5].map(i => clamp(1 - seg(t, die[i], die[i] + 1.4)) * (t < 70 ? 1 : clamp(seg(t, born[i], born[i] + 1.4))));
  };
  const heartK = t => kf(t, [[0, .3], [26, .3], [50, .45], [70, .55], [74.25, 1], [154, 1]]);
  const domeK = t => kf(t, [[74.25, 0], [76.5, 470], [84, 500], [86.25, 505], [98, 520], [110, 620], [122, 700], [154, 700]]);

  // ---------------- 通用小工具 ----------------
  // 当前镜头装下的世界范围：远景按它剔除，广角不画细节、特写才画（性能 + 避免 §19 的彩色噪点）
  function vw() { const c = CAM || { cx: W / 2, cy: H / 2, zoom: 1 }; const hw = W / 2 / c.zoom, hh = H / 2 / c.zoom;
    return { x0: c.cx - hw, x1: c.cx + hw, y0: c.cy - hh, y1: c.cy + hh, z: c.zoom }; }
  const on = (x, hw = 0) => { const v = vw(); return x + hw > v.x0 - 260 && x - hw < v.x1 + 260; };

  // ---------- 天 ----------
  function skyDay(sm, nt) {
    boilSeed('sky2');
    paint(rectPts(-OX, -OY, W + OX * 2, FY + OY + 40), { wash: tone(DAY.sky, sm * .82, nt), ink: null });
    paint(ellPts(W * .5, FY - 40, 3800, 300, 26, 20), { wash: tone(DAY.skyLo, sm * .7, nt), washOp: 185, ink: null });
    if (nt > .35) {   // 只有夜相才有星（第九轮：星星的得失改到 B9 的夜里去表达）
      const n = Math.round(4 + 12 * clamp(nt));
      for (let i = 0; i < n; i++) {
        boilSeed('st' + i);
        const a = .4 + .6 * Math.sin(T * (.6 + hash(i) * .8) + i * 2.1);
        paint(ellPts(-800 + hash(i + 40) * 3800, 30 + hash(i + 9) * 420, 1.8 + 1.9 * a, 1.8 + 1.9 * a, 6), { wash: '#DCE6F4', washOp: 90 + 130 * a * nt, ink: null });
      }
      halo(-200, 130, 90, '#E9F0FA', .7 * nt); paint(ellPts(-200, 130, 32, 32, 16), { wash: '#EFF4FC', washOp: 220 * nt, ink: null });
    }
    if (nt < .6) {   // 太阳：干净白天是一枚烫白的盘；起霾之后被糊成一枚灰白盘、光芒全没了
      const sx = 700, sy = 190, k = 1 - sm * .9, kk = 1 - nt * 1.6;
      if (kk > .02) {
        boilSeed('sun2');
        halo(sx, sy, 250 + 200 * sm, mixCol('#FFF3C0', mixCol(DAY.cloud, DUST, .6), sm), (.32 + .34 * k) * kk);
        paint(ellPts(sx, sy, 58 + 30 * sm, 58 + 30 * sm, 20, 2), { wash: mixCol('#FFFBEC', mixCol('#CFC3A8', DUST, .5), sm * .85), washOp: 240 * kk, ink: null });
        if (k > .55) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + T * .02;
          inkLine([[sx + Math.cos(a) * 74, sy + Math.sin(a) * 74], [sx + Math.cos(a) * (118 + 26 * hash(i)), sy + Math.sin(a) * (118 + 26 * hash(i))]], 1.1, '#FFF6D2', 'inkfine', 0); }
      }
    }
    for (let i = 0; i < 4; i++) {   // 云：起霾之后变成压下来的两层，低层与高层反向漂（"天在闷"）
      boilSeed('cl' + i);
      const dir = i % 2 ? 1 : -1, sp = 8 + 5 * i;
      const cx2 = frac(hash(i) * 3 + T * sp / 26000) * (W + OX) - OX * .5, cy = 120 + i * 96 + hash(i + 4) * 40;
      paint(ellPts(cx2, cy, 460 + 240 * hash(i + 2), 52 + 22 * i, 20, 12), { wash: tone(DAY.cloud, sm * .5, nt), washOp: (80 - i * 12) * (1 + sm * .5), ink: null, curv: .4 });
      if (sm > .3) paint(ellPts(cx2 + dir * 300 * sm, cy + 34, 540, 62 + 20 * i, 18, 10), { wash: tone(mixCol(DUST, '#3A3226', .3), 0, nt), washOp: 74 * sm, ink: null, curv: .4 });
    }
  }

  // ---------- 窗：白天是暗玻璃；夜里只有夜相亮，而且**静止**，只有极少数几户以 6~11 秒的周期慢闪 ----------
  function winGrid(x0, y0, w, h, cols, rows, sm, nt, litK, off, glassy) {
    const cw = w / cols, rh = h / rows, ww = cw * .5, wh = rh * .44;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const sd = hash(r * 7.3 + c * 13.1 + off), wx = x0 + c * cw + cw * .25, wy = y0 + r * rh + rh * .28;
      let lamp = 0;
      if (litK > .02) {
        if (sd < .3) lamp = 1;
        else if (sd < .335) lamp = .35 + .65 * (.5 + .5 * Math.sin(T * (.55 + sd * 1.2) + sd * 90));   // 慢闪，不是频闪
        lamp *= litK;
      }
      if (lamp > .06) paint(rectPts(wx, wy, ww, wh, 2), { wash: mixCol(C.warm, C.warmLt, .4 * lamp), washOp: 245, ink: null });
      else paint(rectPts(wx, wy, ww, wh, 2), { wash: tone(glassy ? mixCol(DAY.glass, '#8FA6B4', .35) : '#6A6E74', sm, nt), washOp: 225, ink: null });
    }
  }
  // 一栋楼（日景版）。PROP.tenement / glassBlock 的墙体是按夜戏调的（暗紫），摆进白天会脏，
  // 所以这里本地画一版日光墙；亮灯仍按"整户"，不做 §19 的彩色噪点。
  const BLK = [
    [-2400, 3.1, 8.2, 0], [-1950, 2.5, 11.4, 1], [-1500, 3.4, 7.4, 0], [-1050, 2.3, 9.6, 0],
    [-620, 3.0, 13.2, 1], [-180, 3.5, 8.0, 0], [260, 3.0, 9.9, 0], [700, 2.6, 12.2, 1],
    [1120, 3.3, 7.6, 0], [1560, 2.7, 9.2, 0], [2000, 2.4, 8.4, 1],
  ];
  function dayBlock(x, w, h, kind, sm, nt, litK) {
    const hw = w * HERO * .5;
    if (!on(x, hw + 200)) return;
    const z = vw().z, top = FY - h * HERO, sw = swOf(w * HERO * .25);
    const wall = tone(kind ? DAY.slate : (hash(x * .3) < .5 ? DAY.stone : DAY.brick), sm, nt);
    boilSeed('blk' + Math.round(x));
    paint(rectPts(x - hw, top, hw * 2, h * HERO, w * .8), { wash: wall, fill: tone(kind ? '#7E8B94' : '#9A8570', sm, nt), fillOp: 40, bleed: .1, tex: .55, border: .4, ink: tone(DAY.roof, sm, nt), sw });
    paint(rectPts(x - hw - 7, top, hw * 2 + 14, 15 + h * 1.6, 3), { wash: tone(DAY.roof, sm, nt), ink: null });   // 檐口
    if (kind) {
      for (let i = 1; i < 5; i++) inkLine([[x - hw + hw * 2 * i / 5, top], [x - hw + hw * 2 * i / 5, FY]], sw * .45, tone('#8FA6B4', sm, nt), 'inkfine', 0);
      paint(ribbon([[x - hw * .7, FY - h * HERO * .18], [x, top + h * HERO * .45], [x + hw * .8, top + h * HERO * .12]], 26, 40), { wash: '#FFFFFF', washOp: 24 * (1 - sm), ink: null });
      if (z > .6) winGrid(x - hw * .92, top + 22, hw * 1.84, h * HERO * .92, 5, Math.round(h * 1.5), sm, nt, litK, x * .01, true);
    } else {
      const cols = Math.max(3, Math.round(w * 1.15)), rows = Math.max(5, Math.round(h * 1.15));
      if (z > .55) winGrid(x - hw * .88, top + 26, hw * 1.76, h * HERO * .9, cols, rows, sm, nt, litK, x * .01, false);
      else for (let r = 0; r < rows; r++) inkLine([[x - hw * .8, top + 26 + r * (h * HERO * .9 / rows)], [x + hw * .8, top + 26 + r * (h * HERO * .9 / rows)]], sw * .5, tone('#6A6E74', sm, nt), 'inkfine', 0);
      for (let i = 0; i < 3; i++) {   // 晾衣杆：老居民楼的标志，静止
        const py = top + h * HERO * (.26 + i * .3);
        inkLine([[x - hw * 1.02, py], [x + hw * 1.02, py + 5]], sw * .35, tone('#8A8070', sm, nt), 'inkfine', 0);
        for (let k = 0; k < 4; k++) { const q = hash(x + i * 7 + k), px = x - hw * .8 + q * hw * 1.6;
          if (q > .55) paint(rectPts(px, py + 4, 15 + q * 9, 26 + q * 12, 3), { wash: tone([DAY.paving, '#B78C7A', '#8FA0A8'][k % 3], sm, nt), washOp: 215, ink: null }); }
      }
    }
    if (litK > .35 && z > .5) P.airGlow(x, FY - h * HERO * .45, w * HERO * .5, C.warm, .45 * litK);   // 夜相：一条街一层暖黄空气光，比逐窗 halo 便宜且不糊屏
  }
  function skyline(sm, nt, litK) {
    if (vw().y0 < FY) {   // 最远一层剪影，把城市"托"起来
      boilSeed('farline');
      const p = [[-OX, FY - 120]];
      for (let i = 0; i <= 16; i++) p.push([-OX + i * (W + OX * 2) / 16, FY - 150 - 240 * hash(i + 2) - 120 * Math.sin(i * .8)]);
      p.push([W + OX, FY - 120], [W + OX, FY], [-OX, FY]);
      paint(p, { wash: tone('#A9BCC6', sm * 1.15, nt), washOp: 185, ink: null, curv: .3 });
    }
    for (const [bx, bw, bh, kind] of BLK) dayBlock(bx, bw, bh, kind, sm, nt, litK);
  }

  // ---------- 高架轻轨 + 每八拍过一列车 ----------
  function viaduct(sm, nt) {
    const y = 452, d = 24;
    boilSeed('via');
    paint(rectPts(-OX, y, W + OX * 2, d, 4), { wash: tone('#9E9686', sm, nt), fill: tone('#7E7666', sm, nt), fillOp: 45, bleed: .08, tex: .5, ink: tone(DAY.roof, sm, nt), sw: 1.1 });
    paint(rectPts(-OX, y + d, W + OX * 2, 7, 2), { wash: tone('#6E6656', sm, nt), ink: null });
    for (let i = 0; i < 20; i++) { const px = -2200 + i * 320; if (!on(px, 40)) continue;
      paint(rectPts(px - 17, y + d, 34, FY - y - d + 6, 3), { wash: tone('#8E8676', sm, nt), fill: tone('#6E6656', sm, nt), fillOp: 40, ink: tone(DAY.roof, sm, nt), sw: .9 });
      paint(rectPts(px - 30, y + d, 60, 12, 3), { wash: tone('#7E7666', sm, nt), ink: null }); }
    for (let i = 0; i < 46; i++) { const px = -2300 + i * 140; if (!on(px, 30)) continue;
      inkLine([[px, y - 2], [px, y - 30]], .8, tone('#7E8890', sm, nt), 'inkfine', 0); }
    inkLine([[-OX, y - 30], [W + OX, y - 30]], 1.1, tone('#7E8890', sm, nt), 'ink', 0);
  }
  function railTrain(t, sm, nt) {
    const ph = frac(bpOf(t) / 8); if (ph > .42) return;    // 八拍一列，跑三拍半
    const k = ph / .42, px = lerp(-2600, 4600, ease(k)), y = 452 - 26;
    if (!on(px, 900)) return;
    boilSeed('train');
    for (let i = 0; i < 3; i++) {
      const cx2 = px - i * 250, w = 236;
      paint(rrPts(cx2 - w / 2, y - 74, w, 74, 16, 2), { wash: tone('#C9C2B2', sm, nt), fill: tone('#8E9AA2', sm, nt), fillOp: 45, bleed: .08, tex: .5, ink: tone(DAY.roof, sm, nt), sw: 1.1 });
      for (let c = 0; c < 5; c++) paint(rectPts(cx2 - w / 2 + 18 + c * 44, y - 62, 34, 30, 4), { wash: tone('#5E7484', sm, nt), washOp: 235, ink: null });
      inkLine([[cx2 - w / 2 + 6, y - 12], [cx2 + w / 2 - 6, y - 12]], 1, tone('#7A7262', sm, nt), 'inkfine', 0);
    }
    if (nt > .4) for (let i = 0; i < 3; i++) P.airGlow(px - i * 250, y - 46, 120, C.warm, .5 * nt);
  }

  // ---------- 招牌：KTV 粉紫 + 酒吧暖橱窗（白天是招牌，夜里才发光）----------
  function ktvSign(t, sm, nt) {
    const x = 300, y = 372, w = 300, h = 108;
    if (!on(x, 260)) return;
    boilSeed('ktv');
    const glowK = clamp(nt * 1.2);
    paint(rrPts(x - w / 2, y - h / 2, w, h, 12, 2), { wash: tone('#4E4A58', sm, nt), fill: tone('#332E42', sm, nt), fillOp: 70, bleed: .1, tex: .5, ink: tone('#5A5464', sm, nt), sw: 1.1 });
    const blink = .55 + .45 * Math.sin(bpOf(t) * Math.PI);
    const col = mixCol(F.VIO, glowK > .1 ? '#FFFFFF' : tone('#6E6276', sm, nt), .3 * blink * Math.max(glowK, .18));
    brush.noWash(); brush.noFill(); brush.noHatch(); brush.set('ink', col, 2.2 + 1.4 * glowK);
    brush.beginShape(.5); for (const p of [[x - 108, y + 22], [x - 74, y - 26], [x - 40, y + 22], [x - 6, y - 26]]) brush.vertex(p[0], p[1]); brush.endShape(false);
    brush.beginShape(.5); for (const p of [[x + 26, y - 24], [x + 74, y - 24], [x + 40, y + 2], [x + 78, y + 2], [x + 30, y + 26]]) brush.vertex(p[0], p[1]); brush.endShape(false);
    inkLine([[x + 96, y - 30], [x + 116, y - 4]], 2.6, col, 'ink', 0);
    inkLine([[x + 116, y - 4], [x + 100, y + 2], [x + 122, y + 26]], 2.6, col, 'ink', 0);
    if (glowK > .1) halo(x, y, 240 * glowK, F.VIO, .7 * glowK * blink);
    for (const d of [-1, 1]) inkLine([[x + d * (w / 2 - 10), y + h / 2], [x + d * (w / 2 - 10), y + h / 2 + 26]], 1.4, tone('#5A5464', sm, nt), 'inkfine', 0);
  }
  function barWindow(t, sm, nt) {
    const x = -140, gy = FY, w = 250, h = 130;
    if (!on(x, 300)) return;
    boilSeed('bar');
    const litK = clamp(nt * 1.1);
    paint(rectPts(x - w / 2, gy - h, w, h, 3), { wash: tone('#6A6458', sm, nt), ink: tone('#6E6656', sm, nt), sw: 1.2 });
    paint(rectPts(x - w / 2 + 12, gy - h + 12, w - 24, h - 26, 2), { wash: litK > .1 ? mixCol(C.warm, C.warmLt, .3) : tone('#7E93A0', sm, nt), washOp: litK > .1 ? 235 : 200, ink: null });
    for (let i = 0; i < 2; i++) {   // 人影在窗里晃（"假暖"）：两条剪影各自来回，纯函数于 t
      const px = x - 46 + i * 92 + Math.sin(T * (.5 + i * .27) + i * 2) * 30, py = gy - 22;
      paint(ellPts(px, py - 46, 15, 15, 10), { wash: tone('#4A4038', sm, nt), washOp: 210, ink: null });
      paint([[px - 20, py], [px - 14, py - 38], [px + 14, py - 38], [px + 20, py]], { wash: tone('#4A4038', sm, nt), washOp: 210, ink: null, curv: .3 });
    }
    for (let i = 0; i < 4; i++) paint(rectPts(x - w / 2 + 18 + i * 58, gy - h + 8, 8, h - 18, 2), { wash: tone('#5E5648', sm, nt), ink: null });
    if (litK > .1) { halo(x, gy - h * .55, 200, C.warm, .65 * litK); P.lightPatch(x, gy + 2, 150, C.warm, .4 * litK); }
    paint([[x - w / 2 - 16, gy - h - 4], [x + w / 2 + 16, gy - h - 4], [x + w / 2, gy - h - 34], [x - w / 2, gy - h - 34]], { wash: tone('#8E5A4E', sm, nt), ink: tone(DAY.roof, sm, nt), sw: 1 });
  }

  // ---------- 地面 / 河 / 岸（同一层地面的三件事）----------
  // 第十四轮 M5：真实渲出来的帧里，地面是一条**光板**黄褐色带，S9/S10 的草地是一整块纯色。
  // 关卡缩略图看不出来，只有把 1920px 的帧裁开才看得见。修法不是"再叠一层颜色"，而是把
  // 这条带子还原成**一个有透视、有材质分区、有接缝的地面**：
  //   ① 岸沿压顶石：一条比步道亮的石带，接缝垂直于岸线（一块一块铺的）
  //   ② 滨河步道：透视行（行距向对岸挤）+ 错缝的短竖缝 —— 有了行，地面才向画面深处退
  //   ③ 材质分区：步道（灰）→ 更老的块石路（更暗更粗）→ 草地（S9/S10）
  //   ④ 颗粒：碎屑、裂缝、补过的补丁，全部按 vw() 剔除，广角只留分区不留噪点
  // 一条接缝。**必须给 spline 至少 4 个顶点**：p5.brush 的 spline 和 p5 的 spline() 一样，
  // 两点退化成控制点重合，什么都不画 —— 地面接缝前两版"完全没印上去"就是这个原因，
  // 而不是对比度不够。顺手让线带一点抖动，接缝才像手工铺的，不像尺规图。
  const ln = (x0, y0, x1, y1, sw, col, jit = 0) => {
    const p = [], n = 5, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    for (let i = 0; i < n; i++) { const q = i / (n - 1), w = (hash(x0 * .37 + y0 * .11 + i * 3.1) - .5) * jit;
      p.push([x0 + dx * q - dy / len * w, y0 + dy * q + dx / len * w]); }
    inkLine(p, sw, col, 'inkfine', .12);
  };
  // 横贯全画幅的接缝要**分小段画**：一条 11520px 的 spline 会被当成越界图元丢掉
  // （竖缝能出现、行线不能，就是这个差别）。分段还顺带让每条行线各自有点抖动。
  const lnx = (y, sw, col, jit, v) => {
    const xA = Math.max(-OX, v.x0 - 240), xB = Math.min(W + OX, v.x1 + 240);
    for (let sx = xA; sx < xB; sx += 620) ln(sx, y, Math.min(xB, sx + 620), y, sw, col, jit);
  };
  function groundAll(sm, nt, grassK = 0) {
    const v = vw(), z = v.z, gk = clamp(grassK);
    // 铺装本色压灰一点：#A9A292 太黄太亮，压成一条真正的城市路面
    const pave = tone(mixCol(DAY.paving, '#8C8A82', .34), sm, nt);
    // horizon = 对岸街面本身：地面从这条线往下铺满全屏，远景建筑（站在同一条件线上）才不会被地面盖掉
    F.ground(FY, pave, tone('#8A8474', sm, nt), { horizon: FY, top: 460, ink: tone('#7A7262', sm, nt), lit: false });
    if (gk > .02) {
      boilSeed('gr2');
      paint(rectPts(-OX, FY - 30, W + OX * 2, H + OY, 6), { wash: tone(mixCol(DAY.grass, DAY.grassDk, .3), sm, nt), washOp: 215 * gk, ink: null });
    }
    // 反差必须**在 tone() 之后**再算：tone 把所有颜色往同一个土黄里推（污染越重推得越狠），
    // 所以"先混色再调污"得到的接缝在 S4~S7 会被压成和地面同一个值 —— M5 第一版就是这么糊掉的。
    const seam = mixCol(pave, '#241F18', .34), hl = mixCol(pave, '#FFFFFF', .12);
    // 笔宽要**跟着 zoom 补**：inkfine 的基准只有 2.6，广角时一条接缝落到屏上不足 1px，
    // 于是 S4~S7 那种 0.5 的机位上地面又糊成一片（M5 第二版的病根）。目标：屏上 ≥2.4px。
    const swl = clamp(2.4 / (2.6 * z), .9, 2.6);
    // 铺装细节只在**硬质地面**上画：S9/S10 的草地盖住同一层地面，留着接缝就变成"草坪上砌砖"。
    const hard = 1 - clamp(gk * 1.6);
    // ① 压顶石：亮一档的石带 + 垂直接缝。岸沿和步道之间必须有一条**暗的落差线**，
    //    否则这两条带子糊成一片，地面就又回到"光板"。
    boilSeed('gh.kerb');
    paint(rectPts(-OX, QUAY, W + OX * 2, GY - QUAY, 2), { wash: mixCol(pave, hl, .55), fill: mixCol(pave, '#6E6A60', .35), fillOp: 42 * hard, bleed: .1, tex: .55, ink: null });
    if (hard > .25) {
      lnx(QUAY + 1, swl * 1.1, seam, 1.6, v);
      if (z > .5) for (let x = Math.floor(v.x0 / 96) * 96; x < v.x1 + 96; x += 96) {
        const j = (hash(x) - .5) * 9; ln(x + j, QUAY + 3, x + j, GY - 1, swl, seam, .8); } }
    // ② 透视行。**行距按几何级数长大**，而且第一条行的间距是按"屏上 40px"定的：
    //    上一版用 grow(q)=GY+1354*q^2.1，把 15 条行全压在地平线附近 150 个世界像素里，
    //    于是近处那半屏地面**一条缝都没有** —— 这才是 M5 一直修不掉的真正病根（不是反差，是分布）。
    //    砖缝也不能太密：一块步道石板约 1m ≈ 140 世界像素，行距小于这个数就是"砖墙"不是"步道"。
    const rows = []; { let y = GY, gap = 40 / clamp(z, .35, 1.6);
      while (y < v.y1 + 90 && rows.length < 20) { y += gap; gap *= 1.33; rows.push(y); } }
    for (let i = 0; i < rows.length && hard > .25; i++) {
      const y = rows[i], yPrev = i ? rows[i - 1] : GY; if (y < v.y0 - 30) continue;
      lnx(y, swl, seam, 1.8, v);
      lnx(y - swl * 3.4, swl * .8, hl, 1.4, v);
      const gap = (y - yPrev) * 1.5; if (gap < 46 || z < .42) continue;
      const off = (i % 2) * gap * .5;
      for (let x = Math.floor((v.x0 - off) / gap) * gap + off; x < v.x1 + gap; x += gap)
        ln(x, yPrev + 2, x, y - 1, swl * .8, seam, .9);
    }
    // ③ 更老的块石路：步道往里一档更暗的料，边界是一条不规则的换料线
    const yMix = rows.length > 5 ? rows[5] : GY + 900;
    if (yMix < v.y1) {
      boilSeed('gnd.zone');
      const p = [[-OX, H + OY]];
      for (let i = 0; i <= 22; i++) { const x = lerp(-OX, W + OX, i / 22); p.push([x, yMix + Math.sin(i * 1.9) * 12 + (hash(i + 5) - .5) * 26]); }
      p.push([W + OX, H + OY]);
      paint(p, { wash: mixCol(pave, '#4A463C', .42), washOp: 190 * (1 - gk * .85), bleed: .12, tex: .7, ink: null });
    }
    // ④ 颗粒：碎屑和裂缝。广角时地面本来就只有几十像素高，画了只会糊成噪点
    const yFar = rows.length ? rows[rows.length - 1] : GY + 1200;
    const bandY = f => GY + (yFar - GY) * f * f;              // 0=地平线 1=这一屏地面的最前缘
    if (z >= .45 && gk < .5) for (let i = 0; i < 26; i++) { boilSeed('gnd.sp' + i);
      const x = -900 + hash(i + 11) * 4200, y = bandY(.1 + hash(i + 31) * .9);
      if (!on(x, 60) || y < v.y0 || y > v.y1) continue;
      if (i % 3 === 0) ln(x, y, x + 16 + hash(i) * 26, y + (hash(i + 2) - .5) * 7, swl * .7, seam, 1.2);
      else paint(ellPts(x, y, 3 + hash(i + 7) * 5, 1.6 + hash(i + 9) * 2.4, 8, 0, hash(i) * TAU),
        { wash: mixCol(pave, '#3A362E', .55), washOp: 175, ink: null }); }
    // ⑤ 草地：割草的条纹（同样按透视长大）+ 草簇和野花，把纯色块变成一块草坪
    if (gk > .05) {
      const gT = tone(mixCol(DAY.grass, DAY.grassDk, .3), sm, nt);
      boilSeed('gnd.mow');
      for (let i = 0; i < 11; i++) { const y0 = bandY(i / 11), y1 = bandY((i + .55) / 11);
        if (y1 < v.y0 || y0 > v.y1) continue;
        paint(rectPts(-OX, y0, W + OX * 2, Math.max(5, y1 - y0), 3),
          { wash: i % 2 ? mixCol(gT, '#FFFFFF', .17) : mixCol(gT, '#22301A', .34), washOp: 118 * gk, bleed: .08, tex: .35, ink: null }); }
      for (let i = 0; gk > .45 && i < 40; i++) { boilSeed('gnd.tu' + i);
        const x = -700 + hash(i + 3) * 3900, f = .1 + hash(i + 17) * .9, y = bandY(f);
        if (!on(x, 40) || y < v.y0 || y > v.y1) continue;
        const s = (6 + f * 20) / Math.max(.45, Math.min(1.15, z)), fl = hash(i + 41) > .76;
        if (fl) paint(ellPts(x, y - s * .9, s * .17, s * .14, 8), { wash: tone(['#D8C46A', '#C6A0B8', '#E4E0D0'][i % 3], sm, nt), washOp: 225 * gk, ink: null });
        for (const d of [-.4, 0, .42]) ln(x + d * s, y, x + d * s * 1.7, y - s * (fl ? .8 : 1.15),
          clamp(s * .05, .5, 2.2), mixCol(gT, '#1B2814', .62), s * .12); }
    }
  }
  const waterPts = () => {
    const p = [], n = 26;   // 岸线用 26 段**直边**采样就够平滑（矢高 < 0.2px）；大形状带 curv 会让
    for (let i = 0; i <= n; i++) { const x = lerp(-OX, REND - 320, i / n); p.push([x, wRow(0, x)]); }   // 插值自交，整片填充被抵消掉（M3 第一版的真凶）
    p.push([REND - 60, WTOP + 44], [REND + 40, (WTOP + QUAY) / 2], [REND - 80, QUAY - 34], [REND - 340, QUAY]);
    for (let i = n; i >= 0; i--) p.push([lerp(-OX, REND - 340, i / n), QUAY]);
    return p;
  };
  // 右界：河在 REND 拐进绿地后面，所以**越近（y 越大）右界越靠左** —— 每条透视带都按它收口
  const WR = [[WTOP, REND - 320], [WTOP + 44, REND - 60], [(WTOP + QUAY) / 2, REND + 40], [QUAY - 34, REND - 80], [QUAY, REND - 340]];
  const waterRight = y => { for (let i = 1; i < WR.length; i++) if (y <= WR[i][0]) return lerp(WR[i - 1][1], WR[i][1], (y - WR[i - 1][0]) / (WR[i][0] - WR[i - 1][0])); return WR[WR.length - 1][1]; };
  // 第十二轮 M3 的正解：**两条完全平行的直线 = 一条色带；一条会拐弯的岸 = 一个水面。**
  // wave() 让对岸的水线在 4..42px 之间摆一个完整的弯（周期约 3300px，一屏正好一道河湾），
  // 只往下、不越过岸沿压顶石。整条河于是有了岸，也有了"同一个地面翻上去"的转折。
  const wave = x => 12 + 22 * (.5 + .5 * Math.sin(x * .0019 + 1.7)) + 8 * Math.sin(x * .00075 + .6);
  // 透视行：q=0 对岸 .. 1 堤岸脚下，**行距向对岸挤**（幂 1.55），而且每一行都跟着岸线一起起伏。
  const wRow = (q, x = 0) => { const w = wave(x), top = WTOP + w; return top + (QUAY - top) * Math.pow(clamp(q), 1.55); };
  // 一条透视带：上下两条边都按 wave 采样，所以它是一块**贴着岸形的**水面，不是一根横杆
  const bandPts = (q0, q1) => {
    const xEnd = Math.min(waterRight(wRow(q0, 0)), waterRight(wRow(q1, 0))), p = [], n = 18;
    for (let i = 0; i <= n; i++) p.push([lerp(-OX, xEnd, i / n), wRow(q0, lerp(-OX, xEnd, i / n))]);
    for (let i = n; i >= 0; i--) p.push([lerp(-OX, xEnd, i / n), wRow(q1, lerp(-OX, xEnd, i / n)) + 2]);
    return p;
  };
  // R24-13：污水里必须**看得见死鱼**。原来只把活鱼 `scale(1,-1)` 翻一下 —— 那在浑水里读不出
  // 一具尸体，只是一条更暗的鱼（而且和上面那层活鱼叠在一起）。这里画一条真正仰躺的死鱼：
  // 白肚皮朝天、背缘露出一圈黑边、尾鳍和胸鳍摊开、眼睛是个 X，身下压着一团水面的暗。
  function deadFish(x, y, s, tilt) {
    boilSeed('deadfish');
    push(); translate(x, y); rotate(tilt);
    paint(ellPts(0, s * .12, s * .62, s * .17, 12), { fill: '#0B120D', fillOp: 95, bleed: .34, ink: null });
    paint(ellPts(0, 0, s * .56, s * .21, 12, 1), { wash: '#28312A', ink: '#0E140F', sw: .9 });
    paint(ellPts(-s * .03, -s * .05, s * .42, s * .105, 12), { wash: mixCol('#D3D8C2', '#8E9482', .3), washOp: 235, ink: null });
    paint([[s * .46, -s * .03], [s * .8, -s * .21], [s * .68, 0], [s * .8, s * .19]], { wash: '#28312A', ink: '#0E140F', sw: .6, curv: .2 });
    for (const d of [-1, 1]) paint([[-s * .06, d * s * .04], [s * .1, d * s * .25], [s * .21, d * s * .05]],
      { wash: mixCol('#C3C8B2', '#28312A', .35), washOp: 205, ink: '#0E140F', sw: .45, curv: .2 });
    for (const d of [-1, 1]) inkLine([[-s * .36 + d * s * .05, -s * .065], [-s * .36 - d * s * .05, s * .025]], .9, '#E6EBD8', 'inkfine', 0);
    pop();
  }
  function river(t, sm, nt, black, fishLit, litK, jump) {
    boilSeed('riv');
    // 原来是一块等宽蓝带 + 上下两道硬描边 —— 读作**一堵蓝墙**。现在：不描边、按透视分行，
    // 紧贴对岸的那一两行掺天光（掠射角反射天空），往镜头来迅速沉到水的本体色并压一道近岸湿边。
    // 只叠三层 wash：p5.brush 的颜色是**像颜料一样**互相混的，叠六七层半透明蓝就糊成灰了（第一版踩过）。
    const far = mixCol(DAY.water, tone(DAY.skyLo, sm * .7, nt), .42), deep = tone(DAY.waterDk, sm * .4, nt);
    paint(waterPts(), { wash: tone(DAY.water, sm * .3, nt), fill: deep, fillOp: 80, bleed: .06, tex: .4, ink: null });
    paint(bandPts(0, .13), { wash: far, washOp: 130, ink: null });
    paint(bandPts(.13, .36), { wash: far, washOp: 66, ink: null });
    paint(bandPts(.74, 1), { wash: mixCol(deep, '#1E2A2E', .35), washOp: 120, ink: null });
    const bk = clamp(black);
    // R24-13 + R24-16 是**同一个**病根，而且就在下面这几行的填充方向上：
    // 前缘 `front` 从管口（REND-120）向左爬到 -2600 没错，错的是多边形从 front 一直封到画面最左
    // 的 -OX —— 于是 bk 越大、front 越往左，被涂黑的反而越少：观众看到的是"污水一出来就自己退了"
    // （R24-13），而 S9 复原时 bk 变小，黑水又漫开盖住半条河（R24-16「刚好弄反了」）。
    // 黑水应该铺在 front 的**右侧**（管口那一侧），前缘是它唯一在动的边：越长越黑、越留越久；
    // 树生效之后清水从上游推过来，front 右移，黑水整片被送出河的尾巴。
    const front = Math.min(REND - 120, lerp(REND - 120, -2600, ease(bk)));
    const blackAt = x => bk > .005 && x > front - 30;   // 这一列现在是污水
    if (bk > .005) {
      boilSeed('blk2');
      const yT = wRow(0, front) + 2, yN = QUAY - 2;
      const xF = q => Math.min(front + Math.sin(q * 7.2 + T * .5) * 90 * (1 - bk * .3) + 44 * Math.sin(q * 3.1 + bk),
        waterRight(lerp(yT, yN, q)) - 26, REND - 330);   // 前缘不许越过河的右界
      const p = [];
      for (let i = 0; i <= 14; i++) p.push([xF(i / 14), lerp(yT, yN, i / 14)]);                 // ① 前缘（指状）：对岸 → 近岸
      p.push([REND - 340, yN], [REND - 80, QUAY - 32], [REND + 30, (WTOP + QUAY) / 2], [REND - 60, WTOP + 44]);  // ② 近岸 → 河的尾巴（与 waterPts 同形）
      for (let i = 0; i <= 14; i++) { const x = lerp(REND - 320, xF(0) + 3, i / 14); p.push([x, wRow(0, x) + 2]); }  // ③ 顶边贴着对岸水线回到前缘
      // curv 必须是 0：这一片黑水是一个**横贯全图的**大形状，带 curv 的插值会在长直段上自交，
      // 整片填充直接被抵消掉（§313 那句"M3 第一版的真凶"在这里以另一种形式复现了一次：
      // 管口那一小团黑画得出来，前缘一旦爬到画面外，整片黑就没了 —— 于是 R24-13 看起来"修好了"
      // 其实什么都没修）。直边采样 14 段的矢高 <2px，肉眼看不出折角。
      paint(p, { wash: mixCol('#141812', '#0A0E0C', .4), fill: '#0D1210', fillOp: 96, bleed: .05, tex: .35, border: .3, ink: null, curv: 0 });
      for (let i = 0; i < 5; i++) {
        const fy = wRow(.18 + i * .2, front), fx = xF(.18 + i * .2) + Math.sin(i * 2.7 + T * .5) * 70;
        paint(ellPts(fx, fy, 46, 9, 12, 3), { wash: mixCol('#2A2E24', '#4A4A3C', .5), washOp: 130 * bk, ink: null });
      }
      // 死鱼（R24-13）：一列一列死过去，尸体就一条一条浮出来，只在**已经黑了的那段水面**上，
      // 顺水往河的尾巴那边漂；清水推回来时 front 越过它们，尸体跟着一起被送走。
      for (let i = 0; i < 7; i++) {
        const q = .1 + .115 * i, y = lerp(yT + 18, yN - 12, q);
        const xLo = xF(q) + 70, xHi = Math.max(xLo + 60, waterRight(y) - 110);
        const fx = lerp(xLo, xHi, frac(hash(i + 5) * 7 + t * (.008 + .01 * hash(i)))) + Math.sin(t * .3 + i * 2.1) * 24;
        if (!on(fx, 90) || fx < front - 10 || fx > xHi + 26) continue;
        const dy0 = [30, 34, 38.5, 43, 47, 51][i % 6];
        const k2 = clamp(seg(t, dy0 + .8, dy0 + 4.2)) * clamp(bk * 2.4);
        if (k2 < .06) continue;
        deadFish(fx, y + Math.sin(t * .8 + i) * 3, (30 + 13 * hash(i + 9)) * (.62 + .38 * k2),
          (hash(i + 3) - .5) * .5 + Math.sin(t * .25 + i) * .05);
      }
    }
    // 倒影**躺在面上**：每一列的横条按透视行落位，越远越短、越细、越挤（原来 4 条等距粗线 = 挂着的墙砖）
    for (let i = 0; i < 9; i++) {
      const rx = -1800 + i * 470 + Math.sin(t * .5 + i) * 26; if (!on(rx, 200)) continue;
      boilSeed('rf' + i);
      const wCol = litK > .25 ? mixCol(C.warm, DAY.water, .3) : tone('#D2E4EC', sm * .55, nt);
      for (let k = 0; k < 7; k++) {
        const q = .07 + k * .14, yy = wRow(q, rx), dep = .25 + .75 * q;
        const lw = (26 + 200 * dep) * (.82 + .3 * Math.sin(t * .9 + i + k));
        inkLine([[rx - lw / 2, yy], [rx + lw / 2, yy + 3 * dep]], .55 + 1.25 * dep, mixCol(wCol, blackAt(rx) ? '#10140E' : deep, .2 + .55 * (1 - dep)), 'inkfine', .4);
      }
    }
    // 对岸那排楼**躺平**在水面上：每栋三条横向短抹、向对岸挤 —— "水面=地面"最直接的证据
    if (vw().z > .5) for (const [bx, bw, bh, kind] of BLK) { if (!on(bx, bw * HERO * .5)) continue;
      for (let k = 0; k < 3; k++) { const q = .05 + k * .085, yy = wRow(q, bx), w2 = bw * HERO * (.46 - k * .08);
        inkLine([[bx - w2 / 2, yy], [bx + w2 / 2, yy + 2]], .5 + .7 * q, mixCol(tone(kind ? DAY.slate : DAY.brick, sm, nt), tone(DAY.water, sm * .5, nt), .45), 'inkfine', .3); } }
    for (let i = 0; i < 5; i++) { const fx = -900 + i * 520 + Math.sin(t * .3 + i * 2) * 40; if (!on(fx, 60) || !blackAt(fx)) continue;
      P.litter(fx, QUAY - 26 - i * 12, 22, { kind: i }); }   // 漂浮物：城市一直在丢，黑水漫到哪它就出现在哪
    for (let i = 0; i < 6; i++) {   // 鱼：也按透视行落位，它们才"在水里游"而不是"在色带上飘"
      const fx = -400 + i * 460 + Math.sin(t * .55 + i * 1.7) * 60, fy = wRow(.3 + (i % 3) * .26, fx);
      if (!on(fx, 90)) continue;
      let l2 = typeof fishLit === 'number' ? fishLit : fishLit[i];
      const dy0 = [30, 34, 38.5, 43, 47, 51][i];
      if (t > dy0 && t < dy0 + 1.4) l2 = Math.max(l2, .3 + .7 * Math.abs(Math.sin((t - dy0) * 22)));   // 灭之前挣扎三下
      let jy = 0, jk = 0;
      if (jump && jump.i === i) { jk = jump.k; jy = -190 * Math.sin(Math.PI * clamp(jk)); }
      // R24-13：死掉的鱼**不再画成一条翻肚皮的活鱼**（那只是同一条更暗的鱼），交给上面的死鱼层。
      if (l2 >= .04 || jk > 0) P.fish(fx, fy + jy, 30, { dir: i % 2 ? 1 : -1, lit: l2 });
    }
    // 近边：堤岸脚下压深一道湿石 + 几缕贴着岸的长横抹 —— 水面有**一条近边**，它才是一个面而不是一条色带
    boilSeed('shore');
    paint(bandPts(.93, 1), { wash: mixCol(deep, '#1E2A2E', .5), washOp: 150, ink: null });
    for (let i = 0; i < 16; i++) { const sx = -2000 + i * 300 + Math.sin(t * .4 + i) * 22; if (!on(sx, 130)) continue;
      inkLine([[sx - 74, QUAY - 10], [sx + 74, QUAY - 7]], 1, mixCol(tone('#D2E4EC', sm * .55, nt), deep, .3), 'inkfine', .3); }
    boilSeed('quay2');
    paint(rectPts(-OX, QUAY, W + OX * 2, 30, 3), { wash: tone(DAY.quay, sm, nt), fill: tone('#8E8676', sm, nt), fillOp: 45, bleed: .08, tex: .5, ink: tone('#6E6656', sm, nt), sw: 1.1 });
    inkLine([[-OX, QUAY + 2], [W + OX, QUAY + 2]], 1.4, tone('#5E5648', sm, nt), 'ink', 0);
    paint(rectPts(-OX, FQ - 12, W + OX * 2, 14, 2), { wash: tone('#9E9686', sm, nt), ink: tone('#6E6656', sm, nt), sw: .9 });
    // 对岸水线：一条**跟着岸形拐弯**的亮折痕，说清楚"地面在这里翻上去变成水面"
    { const e = []; for (let i = 0; i <= 26; i++) { const x = lerp(-OX, REND - 320, i / 26); e.push([x, wRow(0, x) + 1]); }
      e.push([REND - 58, WTOP + 45]); inkLine(e, 1.3, mixCol(far, '#FFFFFF', .5), 'inkfine', .25); }
    farQuay(t, sm, nt, litK);   // 对岸那条街：河有两岸，才不是一条蓝带子
  }
  // 对岸岸沿：灯柱 + 栏杆 + 三两个对岸的人。有了"对岸也有一条街"，河才读成河，
  // 而不是楼底下的一条蓝带子（P2#1 的"下水道"）。
  function farQuay(t, sm, nt, litK) {
    boilSeed('fq');
    for (const lx of [-900, -300, 300, 900, 1500]) {
      if (!on(lx, 120)) continue;
      const h = 190, col = tone(DAY.iron, sm, nt);
      paint(ribbon([[lx, FY], [lx, FY - h * .9], [lx + 16, FY - h]], 9, 6), { wash: col, ink: tone('#3A3E46', sm, nt), sw: .8 });
      paint(ellPts(lx + 20, FY - h + 4, 13, 9, 10), { wash: litK > .15 ? mixCol(C.warm, '#FFFFFF', .4) : tone('#7E8890', sm, nt), ink: tone('#3A3E46', sm, nt), sw: .7 });
      if (litK > .15) { halo(lx + 20, FY - h + 4, 60, C.warm, .8 * litK); P.lightPatch(lx + 20, FY + 2, 90, C.warm, .4 * litK); }
    }
    for (let i = 0; i < 26; i++) { const px = -2100 + i * 170; if (!on(px, 30)) continue;
      inkLine([[px, FQ + 2], [px, FQ - 30]], .9, tone(DAY.iron, sm, nt), 'inkfine', 0); }   // 栏杆立在岸上，不插进水里
    inkLine([[-OX, FQ - 24], [W + OX, FQ - 24]], 1.3, tone(DAY.iron, sm, nt), 'ink', 0);
    for (let i = 0; i < 5; i++) { const px = -700 + i * 520 + Math.sin(t * .25 + i) * 30;
      citSil(px, FY + 6, 13 + 2 * hash(i), ['cityman', 'citywoman', 'citykid'][i % 3], sm, nt, { lit: litK * .3 }); }
  }
  function railing(sm, nt) {   // 通透栏杆：说清楚"这是岸"，又不遮住河面
    const col = tone(DAY.iron, sm, nt);
    for (let i = 0; i < 46; i++) { const px = -2200 + i * 130; if (!on(px, 30)) continue;
      paint(rectPts(px - 4, QUAY - 74, 8, 76, 2), { wash: col, ink: null }); }
    for (const yy of [QUAY - 72, QUAY - 46]) inkLine([[-OX, yy], [W + OX, yy]], 2.1, col, 'ink', 0);
  }
  function lowWall(x0, x1, sm, nt) {
    if (!on((x0 + x1) / 2, (x1 - x0) / 2 + 60)) return;
    boilSeed('lw');
    paint(rectPts(x0, QUAY - 52, x1 - x0, 54, 4), { wash: tone('#A79E8E', sm, nt), fill: tone('#8A8070', sm, nt), fillOp: 45, bleed: .1, tex: .55, ink: tone('#6E6656', sm, nt), sw: 1.1 });
    paint(rectPts(x0 - 8, QUAY - 60, x1 - x0 + 16, 12, 3), { wash: tone('#B6AC9A', sm, nt), ink: tone('#6E6656', sm, nt), sw: .9 });
  }
  function steps(sm, nt) {   // 下到水边的三级石阶：有了它，河才和街**同层**
    boilSeed('st');
    for (let i = 0; i < 3; i++) paint(rectPts(660 - i * 8, QUAY + 4 + i * 12, 190 + i * 16, 14, 2), { wash: tone('#B6AC9A', sm, nt), fill: tone('#8A8070', sm, nt), fillOp: 40, ink: tone('#6E6656', sm, nt), sw: .9 });
  }
  // 拆下来的围挡板堆在原地：围挡不能"消失"，它得有个去处（连续性）
  function boardStack(sm, nt, k = 1) {
    if (k < .02 || !on(1620, 320)) return;
    boilSeed('boards');
    for (let i = 0; i < 5; i++) {
      const y = GY - 10 - i * 13 * k;
      paint(rectPts(1450 + i * 8, y - 13, 400 - i * 12, 14, 2), { wash: tone(i % 2 ? '#C9A85C' : '#B6924E', sm, nt), fill: tone('#7E5A32', sm, nt), fillOp: 35, ink: tone('#5A4A32', sm, nt), sw: .8 });
    }
  }
  function bin(x, sm, nt) {
    if (!on(x, 40)) return;
    boilSeed('bin'); const gy = GY - 2;
    paint(rrPts(x - 22, gy - 56, 44, 56, 6, 1.5), { wash: tone('#5E6E5A', sm, nt), fill: tone('#3E4A3C', sm, nt), fillOp: 45, bleed: .1, tex: .6, ink: tone('#2E3428', sm, nt), sw: 1 });
    paint(rectPts(x - 26, gy - 62, 52, 9, 3), { wash: tone('#4A5648', sm, nt), ink: tone('#2E3428', sm, nt), sw: .8 });
    for (let i = 0; i < 3; i++) inkLine([[x - 12 + i * 12, gy - 50], [x - 12 + i * 12, gy - 10]], .7, tone('#3E4A3C', sm, nt), 'inkfine', 0);
  }
  function streetFurniture(sm, nt, litK) {
    P.bench(-260, GY, 1.05, {}); P.bench(520, GY, 1.05, {}); P.bench(1180, GY, 1.05, {});
    bin(120, sm, nt); bin(940, sm, nt);
    for (const lx of [-620, 180, 820, 1460]) if (on(lx, 220)) P.streetLamp(lx, GY, 2.6, { lit: litK, cold: false });   // 只在夜相亮，而且是暖黄
  }
  function lighthouse(t, sm, nt, litK) {
    const x = -1180;
    if (!on(x, 500)) return;
    const beam = frac(bpOf(t) / 4);   // 每四拍扫过一次
    P.lighthouse(x, FY, 7.4, { beam, pool: litK > .2 });
    // 白天光束看不见，但灯室玻璃会把太阳闪回镜头一下 —— 扫过时全画面亮一瞬（保留这个标志动作）
    const sweep = Math.pow(Math.max(0, Math.cos(beam * TAU * 2)), 6);
    const k = nt > .35 ? sweep * nt : sweep * (1 - sm * .4) * .45;
    if (k > .06) {
      const h = 7.4 * HERO, bx = x, by = FY - h - h * .19, a = beam * TAU, far = 3200;
      paint([[bx, by], [bx + Math.cos(a) * far, by + Math.sin(a) * far * .16 - 70], [bx + Math.cos(a + .1) * far, by + Math.sin(a + .1) * far * .16 + 70]],
        { wash: nt > .35 ? mixCol(C.warm, '#FFFFFF', .3) : '#FFFDF0', washOp: (nt > .35 ? 44 : 20) * k, ink: null });
    }
  }

  // ---------- 树 ----------
  const FIR = mixCol(C.sapDk, '#6E9E58', .5);
  function fir(x, gy, m, o = {}) { if (!on(x, HERO * m * .62)) return; summerTree(x, gy, m, o); }   // §77 原来是 P.fir + snowK:0 = "没雪的雪松"；改派到夏季语汇，S9/S2 的调用点同时生效
  function firSil(x, gy, m, o = {}) { treeSil(x, gy, m, o.col || mixCol(C.sapDk, '#5E8A5A', .35), o.seed ?? x, o.leafy ?? .5); }
  // ---------- 夏季树（第十二轮 M1）----------
  // PROP.fir 的形状语言是"下垂的齿盘 + 沿上缘压一条雪壳"，那是**冬天**才成立的读法：传 snowK:0 只把白去掉，
  // 枝盘照样往下坠，于是日景的草地上站着一排"没雪的雪松"。夏天要换的是**剪影语汇**本身：
  //   阔叶 = 分叉的裸干 + 一团团**圆的**树冠（暗底一团、受光一团，边缘是瓣不是齿）；
  //   夏季针叶 = 直立的尖塔 + **向上挑**的轮枝（被雪压着才下垂），下段露出一截干净的干。
  // 物种与大小混着来：成年 2~5 个英雄高（尺度表 SCALE.env.fir=3.6 / firOld=6.2），一律矮于身后的楼（7.4~13.2）。
  const LEAF = ['#5E8A46', '#6E9A4E', '#7FA860', '#87A855', '#4E7A42'];
  const NEEDLE = ['#3F6B4A', '#4E7A55', '#35603F', '#578459'];
  function broadleaf(x, gy, m, o = {}) {
    if (!on(x, HERO * m * .62)) return;
    boilSeed('broad' + Math.round(o.seed ?? x));
    const h = HERO * m, sw = swOf(h * .12), sd = o.seed ?? x;
    const base = o.col || LEAF[Math.floor(hash(sd * .37) * LEAF.length)];
    const trunkH = h * (.42 + .1 * hash(x * .31)), sway = (o.wind ?? .12) * Math.sin(T * 1.15 + x * .017) * h * .02;
    const cy = gy - trunkH - h * .27, cr = h * (.2 + .05 * hash(x * .71));
    P.contact(x, gy, h * .17, .6);
    paint(ribbon([[x, gy], [x + sway * .35, gy - trunkH * .66], [x + sway, gy - trunkH]], h * .06, h * .022),
      { wash: C.bark, fill: C.woodDk, fillOp: 52, bleed: .1, tex: .8, ink: C.ink, sw: sw * .9 });
    for (const d of [-1, 1]) inkLine([[x + sway * .7, gy - trunkH * .72], [x + sway + d * cr * .44, cy + cr * .34]], sw * .8, C.bark, 'ink', .3);
    paint(P.blob(x + sway, cy, cr * 1.24, cr * .95, 7, .13, 26, .94, .4 + hash(sd) * 2),
      { wash: mixCol(base, C.night, .08), fill: mixCol(base, C.sapLt, .2), fillOp: 60, bleed: .15, tex: .74, border: .5, ink: C.ink, sw, curv: .5 });
    paint(P.blob(x + sway - cr * .3, cy + cr * .36, cr * .62, cr * .38, 5, .16, 18, .9, 2.2), { wash: mixCol(base, C.night, .34), washOp: 195, ink: null, curv: .5 });
    if (vw().z > .55) {
      paint(P.blob(x + sway + cr * .44, cy - cr * .44, cr * .5, cr * .34, 5, .15, 16, .95, 1.7), { wash: mixCol(base, C.sapLt, .5), washOp: 205, ink: null, curv: .5 });
      if (vw().z > .95) for (let i = 0; i < 5; i++) { const a = hash(i + 11) * TAU, q = .6 + .42 * hash(i + 5);
        inkLine([[x + sway + Math.cos(a) * cr * q, cy + Math.sin(a) * cr * q * .78], [x + sway + Math.cos(a) * cr * (q + .2), cy + Math.sin(a) * cr * (q + .2) * .78]], sw * .4, mixCol(base, C.night, .42), 'inkfine', 0); }
    }
  }
  function conifer(x, gy, m, o = {}) {
    if (!on(x, HERO * m * .42)) return;
    boilSeed('coni' + Math.round(o.seed ?? x));
    const h = HERO * m, sw = swOf(h * .12), sd = o.seed ?? x;
    const base = o.col || NEEDLE[Math.floor(hash(sd * .41) * NEEDLE.length)];
    const w = h * (.19 + .05 * hash(x * .43)), tiers = 6, bare = h * (.13 + .06 * hash(x * .9));
    const sway = (o.wind ?? .1) * Math.sin(T * 1.5 + x * .02) * h * .012, top = gy - h * 1.02, bot = gy - bare;
    P.contact(x, gy, h * .1, .5);
    paint(ribbon([[x, gy], [x + sway * .3, gy - bare * .8], [x + sway * .6, gy - bare]], h * .03, h * .014),
      { wash: C.bark, fill: C.woodDk, fillOp: 45, ink: C.ink, sw: sw * .5 });
    // 夏季针叶 = **一条收尖的连续轮廓**（不锯齿、不下垂）+ 几根向上挑的轮枝。
    // 齿盘是"雪压松枝"的读法：去掉雪还留着齿盘，观众看到的仍然是雪松 —— 所以形状语言要一起换掉。
    const spire = (cx, ww0) => {
      const p = [[cx + sway, top - h * .03]];
      for (let i = 0; i <= 12; i++) { const q = i / 12; p.push([cx + sway * (1 - q) + ww0 * (.07 + .93 * Math.pow(q, .7)), lerp(top, bot, q)]); }
      for (let i = 12; i >= 0; i--) { const q = i / 12; p.push([cx + sway * (1 - q) - ww0 * (.07 + .93 * Math.pow(q, .7)), lerp(top, bot, q)]); }
      return p;
    };
    paint(spire(x, w), { wash: mixCol(base, C.night, .1), fill: mixCol(base, C.sapLt, .12), fillOp: 58, bleed: .12, tex: .72, border: .5, ink: C.ink, sw, curv: .35 });
    if (vw().z > .6) for (let i = 1; i <= tiers; i++) {   // 轮枝：外端**高于**轴心 —— 没有雪压着
      const q = i / (tiers + 1), yy = lerp(top, bot, q), ww = w * (.07 + .93 * Math.pow(q, .7)) * .84, jx = x + sway * (1 - q);
      inkLine([[jx - ww, yy - h * .05], [jx, yy + h * .02], [jx + ww, yy - h * .05]], sw * .5, mixCol(base, C.night, .42), 'inkfine', .3); }
    if (vw().z > 1) paint(spire(x + w * .3, w * .48), { wash: mixCol(base, C.sapLt, .4), washOp: 145, ink: null, curv: .35 });
  }
  function summerTree(x, gy, m, o = {}) { (hash((o.seed ?? x) * 1.7) < (o.leafy ?? .5) ? broadleaf : conifer)(x, gy, m, o); }
  // 远景林线：一棵**一条轮廓**（阔叶 = 一团圆 + 一截干；针叶 = 一座上挑的尖塔），不描边、不挂雪。
  // 一片林子如果每棵都用 broadleaf（~8 条路径）就画不完，所以这里和 PROP.firSil 同一个取舍。
  function treeSil(x, gy, m, col, seed, leafy) {
    const h = HERO * m;
    if (leafy) {
      paint(ribbon([[x, gy], [x, gy - h * .52]], h * .05, h * .026), { wash: mixCol(col, C.night, .38), washOp: 240, ink: null });
      paint(P.blob(x, gy - h * .7, h * .25, h * .3, 6, .14, 18, .93, seed), { wash: col, washOp: 245, ink: null, curv: .5 });
    } else {
      const w = h * .2, top = gy - h, bot = gy - h * .16, p = [[x, top - h * .04]];
      for (let i = 0; i <= 7; i++) { const q = i / 7; p.push([x + w * (.08 + .92 * Math.pow(q, .7)), lerp(top, bot, q)]); }
      for (let i = 7; i >= 0; i--) { const q = i / 7; p.push([x - w * (.08 + .92 * Math.pow(q, .7)), lerp(top, bot, q)]); }
      paint(p, { wash: col, washOp: 245, ink: null, curv: .35 });
    }
  }
  function summerBand(x0, gy, n, m, o = {}) {
    const rows = o.rows ?? 3, span = o.span ?? HERO * m * rows * 1.5, rise = o.rise ?? HERO * m * .12;
    for (let r = rows - 1; r >= 0; r--) {
      const q = (rows - 1 - r) / Math.max(1, rows - 1), mm = m * (.5 + .62 * q), cnt = Math.max(2, Math.round(n / rows * (1.6 - .9 * q)));
      for (let i = 0; i < cnt; i++) {
        const gap = span / cnt, sd = r * 31 + i, px = x0 + (i + .5 + (hash(r * 7 + i * 3.7) - .5) * .6) * gap;
        if (!on(px, HERO * mm)) continue;
        treeSil(px, gy - (1 - q) * rise, mm * (.9 + .28 * hash(sd)), mixCol(o.tone || FIR, C.night, .04 + .26 * (1 - q)), sd * .7, hash(sd * 1.7) < .5);
      }
    }
  }
  function bigTree(x, gy, m, heart, litK, sm, nt) {
    if (!on(x, HERO * m * .65)) return;
    P.giantTree(x, gy, m, { heart: clamp(heart) * (1 - .35 * clamp(sm)), lit: clamp(litK) });
    // giantTree 的冠是按夜戏压暗的（§48），白天必须补一层日光，否则是一棵黑树。
    // N6：这两层原来只有 washOp 130/118 —— 半透明的绿纱盖在树冠上，后景的窗户直接透出来，
    // 树读成一块绿网。日光补层必须是**实色**的叶子，不然它就不是"补亮"而是"蒙纱"。
    const h = HERO * m, cy = gy - h * 1.02, cr = h * .34;
    boilSeed('crown');
    paint(P.blob(x - cr * .12, cy - cr * .16, cr * 1.42, cr * .8, 7, .14, 34, .96, .6), { wash: tone('#7FA860', sm, nt), washOp: 232, ink: null, curv: .45 });
    paint(P.blob(x + cr * .34, cy + cr * .3, cr * 1.0, cr * .48, 6, .16, 26, .7, 1.2), { wash: tone('#4E7042', sm, nt), washOp: 210, ink: null, curv: .45 });
    if (vw().z > .8) for (let i = 0; i < 7; i++) { const a = -Math.PI * .9 + i * .3 + hash(i) * .2;
      inkLine([[x + Math.cos(a) * cr * .5, cy + Math.sin(a) * cr * .35], [x + Math.cos(a) * cr * 1.35, cy + Math.sin(a) * cr * .78]], 1.2, tone('#3E5A36', sm, nt), 'inkfine', .3); }
    // 光要**贴着冠形**给。原来 halo 半径 cr*2.1、lightPatch cr*1.9 —— 比树本身大一圈的 ADD 圆盘
    // 把半个画面糊成毛玻璃（第十六轮复核看到的"幽灵圆"）。
    if (litK > .05) { halo(x, cy, cr * .95, C.warm, .26 * litK); P.lightPatch(x, gy + 2, cr * 1.15, C.warm, .2 * litK); }
  }

  // ---------- 工厂 ----------
  // PROP.factory 的墙是夜戏的暗紫（#3A3A4C），摆进白天读不出"这是一座厂"（P2#3），
  // 而且它的体量只有一间厂房。这里本地画一版日光工厂：锯齿屋顶的厂房 + 两根高烟囱 +
  // 双曲线冷却塔 + 储油罐区 + 架空管廊 —— 体量与对岸的楼房同级（m=9），压迫感才成立。
  function factory(t, sm, nt, deadK, litK, x = FX, gy = FY, m = FACM) {
    if (!on(x, HERO * m * .95)) return;
    const h = HERO * m, sw = swOf(h * .16), dk = tone('#4E4A44', sm, nt);
    const body = tone('#B2AA9C', sm, nt), bodySh = tone('#8E8676', sm, nt), brick = tone('#A67C62', sm, nt);
    boilSeed('fac');
    // 厂房：长条 + 锯齿屋顶（每一格一面朝北的高窗，这是"工厂"最强的可读特征）
    const sh = h * .34, sx0 = x - h * .5, teeth = 7;
    paint(rectPts(sx0, gy - sh, h, sh, h * .008), { wash: body, fill: bodySh, fillOp: 42, bleed: .1, tex: .55, border: .4, ink: dk, sw });
    const tw = h / teeth;
    for (let i = 0; i < teeth; i++) {
      const tx = sx0 + i * tw;
      paint([[tx, gy - sh], [tx + tw * .34, gy - sh - h * .075], [tx + tw * .34, gy - sh], [tx + tw, gy - sh]], { wash: bodySh, ink: dk, sw: sw * .7 });
      paint([[tx + tw * .06, gy - sh - h * .062], [tx + tw * .32, gy - sh - h * .006], [tx + tw * .32, gy - sh - h * .062]], { wash: litK > .25 ? mixCol(C.warm, C.warmLt, .3) : tone('#7E93A0', sm, nt), washOp: 225, ink: dk, sw: sw * .4 });
    }
    for (let i = 0; i < 9; i++) {   // 厂房的长窗：整户亮，不做彩色噪点
      const wx = sx0 + h * .045 + i * h * .104, on2 = litK > .3 && hash(i * 3.7) < .45;
      paint(rectPts(wx, gy - sh * .78, h * .062, sh * .34, h * .004), { wash: on2 ? mixCol(C.warm, C.warmLt, .35) : tone('#6E7E88', sm, nt), washOp: 235, ink: dk, sw: sw * .45 });
      if (on2) halo(wx + h * .031, gy - sh * .61, h * .07, C.warm, .7 * litK);
    }
    paint(rectPts(x - h * .07, gy - sh * .52, h * .14, sh * .52, h * .006), { wash: tone('#6E6A62', sm, nt), fill: dk, fillOp: 40, ink: dk, sw: sw * .7 });   // 装卸口
    for (let i = 0; i < 4; i++) inkLine([[x - h * .06 + i * h * .035, gy - sh * .48], [x - h * .06 + i * h * .035, gy - sh * .06]], sw * .4, dk, 'inkfine', 0);
    inkLine([[sx0, gy - sh * .12], [sx0 + h, gy - sh * .12]], sw * .6, dk, 'inkfine', 0);
    // 两根烟囱：下粗上细、顶部红白 band、帽檐、绿色警示灯
    for (const [cx, ch, cw] of [[x - h * .28, h, .062], [x + h * .2, h * .92, .056]]) {
      const wb = h * cw, wt = h * cw * .68;
      paint([[cx - wb, gy - sh * .2], [cx - wt, gy - ch], [cx + wt, gy - ch], [cx + wb, gy - sh * .2]], { wash: brick, fill: tone('#7E5A46', sm, nt), fillOp: 40, bleed: .1, tex: .6, border: .4, ink: dk, sw });
      for (let i = 0; i < 3; i++) paint(rectPts(cx - wb, gy - ch + i * h * .055, wb * 2, h * .022, 1), { wash: i === 1 ? tone('#C05A4A', sm, nt) : tone('#E2DACB', sm, nt), ink: null });
      paint(rectPts(cx - wt * 1.25, gy - ch - h * .016, wt * 2.5, h * .018, 2), { wash: tone('#5A564E', sm, nt), ink: dk, sw: sw * .6 });
      for (let i = 1; i < 5; i++) inkLine([[cx - wb + (wb * 2) * i / 5, gy - sh * .2], [cx - wt + (wt * 2) * i / 5, gy - ch]], sw * .3, dk, 'inkfine', 0);
      if (deadK < 1) { const onb = .35 + .65 * Math.max(0, Math.sin(T * 4 + cx)); halo(cx, gy - ch - h * .026, h * .03 * onb, PAL.sap, .9 * onb * (1 - deadK)); }
    }
    // 双曲线冷却塔（白汽）—— 只有厂在开工时才冒汽
    for (const tx of [x + h * .62, x + h * .84]) {
      const th = h * .42, wb = h * .085, wm = h * .058, wt = h * .072;
      paint([[tx - wb, gy], [tx - wm, gy - th * .55], [tx - wt, gy - th], [tx + wt, gy - th], [tx + wm, gy - th * .55], [tx + wb, gy]], { wash: tone('#C0BCB2', sm, nt), fill: bodySh, fillOp: 35, bleed: .1, tex: .5, ink: dk, sw: sw * .8 });
      inkLine([[tx - wm, gy - th * .55], [tx + wm, gy - th * .55]], sw * .4, dk, 'inkfine', 0);
      if (smokeK(t) > .05 && deadK < 1) for (let i = 0; i < 3; i++) { const ph = frac(T * .13 + i / 3), r = h * (.03 + ph * .05);
        paint(ellPts(tx + Math.sin(ph * 4) * h * .03, gy - th - ph * h * .22, r, r * .9, 10), { wash: tone('#E8EEF2', sm, nt), washOp: 130 * (1 - ph) * (1 - deadK), ink: null }); }
    }
    // 储油罐区 + 架空管廊
    for (let i = 0; i < 3; i++) { const tx = x - h * (.66 + i * .16);
      paint(rrPts(tx - h * .055, gy - h * .17, h * .11, h * .17, h * .02, h * .004), { wash: tone('#A8A49A', sm, nt), fill: bodySh, fillOp: 35, ink: dk, sw: sw * .6 });
      inkLine([[tx - h * .055, gy - h * .09], [tx + h * .055, gy - h * .09]], sw * .35, dk, 'inkfine', 0); }
    inkLine([[x - h * .95, gy - h * .26], [x + h * .55, gy - h * .26]], sw * 1.5, tone('#8E8A82', sm, nt), 'ink', 0);
    for (let i = 0; i < 8; i++) { const px = x - h * (.92 - i * .19); inkLine([[px, gy - h * .26], [px, gy - sh * .05]], sw * .5, tone('#6E6A62', sm, nt), 'inkfine', 0); }
    if (litK > .3) P.airGlow(x, gy - sh, h * .5, C.warm, .5 * litK);
    if (deadK > .05) {   // 停产：烟囱口封上（B8 的"翻篇"）
      paint(rectPts(x - h * .34, gy - h * .995, h * .12, h * .022, 3), { wash: tone('#8E8676', sm, nt), washOp: 235 * deadK, ink: dk, sw: sw * .5 });
      paint(rectPts(x + h * .14, gy - h * .918, h * .12, h * .022, 3), { wash: tone('#8E8676', sm, nt), washOp: 235 * deadK, ink: dk, sw: sw * .5 });
    }
  }
  // 排污管：从厂区沿对岸过来、管口伸进水里。它**一直在那儿**（S3~S7），拆掉之后才消失。
  function outfall(t, sm, nt, pipeK) {
    if (pipeK <= .02 || !on(2500, 1000)) return;
    boilSeed('pipe2');
    const x0 = FX - 640, x1 = REND - 150, y = FY + 14;
    paint(ribbon([[x0, y - 26], [x0 + 320, y + 8], [x1 + 70, WTOP + 40], [x1, WTOP + 62]], 62, 46), { wash: tone('#7E7A72', sm, nt), fill: tone('#4E4A44', sm, nt), fillOp: 55, bleed: .1, tex: .6, ink: tone('#33302E', sm, nt), sw: 1.4, curv: .35 });
    for (let i = 0; i < 5; i++) { const px = x0 + 60 + i * 250; if (!on(px, 40)) continue; paint(rectPts(px, y + 26, 26, 46, 3), { wash: tone('#6E6A62', sm, nt), ink: tone('#33302E', sm, nt), sw: .8 }); }
    const mx = x1 + 30, my = WTOP + 52;
    paint(ellPts(mx, my, 40, 26, 14, 2), { wash: tone('#5A564E', sm, nt), ink: tone('#2A2824', sm, nt), sw: 1.2 });
    for (let i = 0; i < 4; i++) {   // 管口吐黑：一团一团有呼吸地涨
      const ph = frac(T * .17 + i * .25), r = (26 + 96 * ph) * pipeK;
      paint(ellPts(mx - 30 - ph * 190, my + 12 + Math.sin(ph * 5 + i) * 16, r, r * .58, 14, 4), { wash: mixCol('#171B14', '#2A2E22', ph * .6), washOp: 200 * pipeK * (1 - ph * .55), ink: null, curv: .4 });
    }
    if (pipeK > .3) paint(ellPts(mx - 12, my + 6, 34, 20, 12), { wash: '#0D1210', washOp: 230 * pipeK, ink: null });
  }
  // 烟：贴地的高层与低层反向压过来，**每一团都比那棵树大**（小树抵御大废气，对比才成立）
  function smoke(t, sm, nt) {
    // R24-14 的真正病根不在 alpha，在**跟着哪条曲线**：这一函数原来整段只乘 `sm`（=smother，
    // 整片天空被捂脏的程度）。可 S3 开场那几拍工厂已经开足马力（smokeK .4→.78），sm 才 .1，
    // 于是烟只有 10% 不透明度 —— 两根 9 英雄高的大烟囱什么也不排（t=28 全分辨率所见：烟囱后面
    // 是干净的蓝天）。霾跟 sm，**烟囱口的烟跟工厂自己的油门**。
    const k = clamp(sm * 1.1), fk = clamp(Math.max(sm * 1.1, smokeK(t) * .95));
    if (k < .03 && fk < .03) return;
    boilSeed('sm');
    for (let i = 0; i < 7; i++) {
      const dir = i % 2 ? -1 : 1;
      const cx2 = frac(hash(i) * 4 + T * (.02 + i * .002) * dir) * (W + OX * 1.6) - OX * .8;
      const cy = 300 + i * 118 + Math.sin(T * .1 + i) * 40, r = 300 + 260 * hash(i + 3);
      if (!on(cx2, r)) continue;
      paint(ellPts(cx2, cy, r, r * .34, 22, 14), { wash: mixCol('#2A2419', '#06070B', .3 + .55 * (i / 7)), washOp: (96 + 62 * hash(i)) * k, ink: null, curv: .45 });
    }
    for (const [cx, ctop] of [[FX - HERO * FACM * .28, FY - HERO * FACM], [FX + HERO * FACM * .2, FY - HERO * FACM * .92]]) {
      if (!on(cx, 1400)) continue;
      // 烟囱口在 h=9 英雄高的位置，几乎就是画面上沿 —— 原来烟一出生就往上飘出画外，
      // 于是"两根大烟囱什么也不排"（N1）。剧本写的是"天空被烟**捂**成土黄"：
      // 这是逆温层下**又冷又重**的烟，它先在烟囱口堆成一顶低压的帽子、压过屋顶，
      // 然后才慢慢散开。所以轨迹先小幅上拱、随即横向滚开并**往下沉**，半径长得比位移快。
      for (let i = 0; i < 8; i++) {
        const ph = frac(T * .07 + i / 8), rise = Math.sin(clamp(ph * 1.5) * Math.PI * .5);
        const r = 175 + 590 * ph, dx = (i % 2 ? -1 : 1) * 210 * ph + 340 * ph * ph;
        paint(ellPts(cx + dx, ctop + 90 * rise - 120 * (1 - rise) + 430 * ph * ph, r, r * .5, 20, 9),
          { wash: mixCol('#1B1812', '#04050A', .3 + .6 * ph), washOp: 245 * fk * (1 - ph * .3), ink: null, curv: .45 }); }
      // R24-14：烟囱口那一坨必须是**实心的黑**。原来烟一出生就是半透明的，读者只看到"天空脏了
      // 一点"，看不到"这座厂在往天上倒东西"。给出生点压一顶不透明的黑帽（带下限：厂子在开工，
      // 管口就不许是透的），往下沉、往两边滚。
      paint(ellPts(cx, ctop + 26, 190, 96, 16, 6), { wash: '#08090C', washOp: 240 * Math.max(.62, fk), ink: null, curv: .4 });
      paint(ellPts(cx - 40, ctop + 92, 150, 74, 14, 5), { wash: '#0E0D0B', washOp: 200 * Math.max(.55, fk), ink: null, curv: .4 });
    }
  }

  // ---------- 穹顶：会**凹陷并在拍子上弹回**的那一层（PROP.dome 半径固定、不能凹，所以本地画一版）----------
  // 第十二轮 M2：PROP.dome 在极小 k 下只剩底圈那一道描边，细白椭圆读作**铁丝**而不是光罩。
  // 这里的顺序反过来 —— 罩子**首先是一团有厚度的光**（四层同心填充穹面 + 空气光 + 地面光池 + 冠顶），
  // 底圈描边要等罩子真的强起来（k > .68）才允许出现，出现时也是压在体积上的高光，不是轮廓线。
  function dome(x, gy, r, k, dents = [], col = C.warm) {
    if (k < .02 || r < 24) return;
    boilSeed('dm' + Math.round(r / 6));
    const f = 1 + .014 * Math.sin(T * 2.1), R = r * f, kk = clamp(k);
    const rad = (a, q) => { let m = 1; for (const d of dents) { const da = Math.atan2(Math.sin(a - d.a), Math.cos(a - d.a)); m -= d.k * Math.exp(-da * da / (2 * .36 * .36)); } return R * q * m; };
    const ring = q => { const p = []; for (let j = 0; j <= 46; j++) { const a = Math.PI + j / 46 * Math.PI, ri = rad(a, q); p.push([x + Math.cos(a) * ri, gy + Math.sin(a) * ri * .84]); } return p; };
    const cap = q => { const p = ring(q); p.push([x + rad(0, q), gy], [x - rad(Math.PI, q), gy]); return p; };
    // ① 体积：四层同心**填充**穹面（不是四条线）。k 再小它也得自己撑得住，所以底不乘 kk、只压一点。
    for (let i = 0; i < 4; i++) { const q = 1 - i * .21;
      paint(cap(q), { wash: mixCol(col, C.warmLt, .2 + i * .17), washOp: (20 + i * 9) * (kk * .5 + .5), ink: null, curv: .5 }); }
    // ② 壳边：三条有厚度的带子，中间那条最亮 —— 这是罩子的"表面"，宽度跟着半径走
    for (let i = 0; i < 3; i++) { const q = ring(1 - i * .055);
      paint(ribbon(q, r * (.055 - i * .012), r * (.055 - i * .012)), { wash: mixCol(col, '#FFFFFF', .1 + i * .2), washOp: (86 + i * 40) * kk, ink: null, curv: .6 }); }
    // ②b 亮边内侧一道**暗唇**。S6 复核（t=78 全分辨率）：白天的天空本身就比暖光更亮，
    // 所以壳面**不可能靠"更亮"被看见** —— 四层体积加起来才 washOp 20~47，直接融进天空。
    // 透明的壳在动画里从来不是靠自身亮度成立的，是靠"边缘挡住了一点背景"这道反差成立的。
    paint(ribbon(ring(.955), r * .03, r * .03), { wash: mixCol(col, '#0A0E18', .66), washOp: 74 * kk, ink: null, curv: .6 });
    // 经线只留几根、而且压到边缘：铺满整球的经线就是 §41 说的那把"伞骨"
    if (vw().z > .55) for (let i = 1; i < 6; i++) { const a = Math.PI + (i < 3 ? i / 18 : 1 - i / 18) * Math.PI;
      inkLine([[x + Math.cos(a) * rad(a, 1), gy + Math.sin(a) * rad(a, 1) * .84], [x + Math.cos(a) * rad(a, .72), gy + Math.sin(a) * rad(a, .72) * .6]], swOf(r * .04), mixCol(P.hotOf(col), col, .5), 'inkfine', .4); }
    // ③ 底：光压在草地上的一圈**池**（浅填充椭圆）。它替代描边去交代"罩子的底在哪"，
    //    而且它是面、不是线 —— 所以 k 掉下去的时候画面不会塌成一圈铁丝。
    paint(ellPts(x, gy, R * .99, R * .17, 40), { wash: mixCol(col, C.warmLt, .34), washOp: 50 * (kk * .55 + .45), ink: null });
    const rimK = clamp((kk - .68) / .32);
    if (rimK > .02) paint(ellPts(x, gy, R, R * .18, 40), { ink: mixCol(col, '#FFFFFF', .12), sw: clamp(r / 460, .6, 1.6) * rimK, wash: null });
    for (let i = 0; i < 16; i++) { const ph = frac(T * .11 + hash(i)), a = Math.PI + hash(i + 7) * Math.PI, rd = R * (.3 + .6 * hash(i + 3));
      paint(ellPts(x + Math.cos(a) * rd, gy + Math.sin(a) * rd * .84 - ph * r * .14, r * .014, r * .014, 6), { wash: C.warmLt, washOp: 200 * kk * (1 - ph), ink: null }); }
    // ④ 白天里"光"必须比环境更亮才看得见：ADD 的 halo 是唯一能做到的笔，冠顶再点一颗。
    halo(x, gy - r * .5, r * .62, col, (.3 + .14 * (1 - kk)) * kk);
    halo(x, gy - r * .8, r * .3, C.warmLt, .34 * kk);
    P.lightPatch(x, gy + 2, r * (.6 + .28 * (1 - kk)), col, (.34 + .26 * (1 - kk)) * kk);
    P.airGlow(x, gy - r * .46, r * .42, col, (.42 + .3 * (1 - kk)) * kk);
  }
  // 接触面：金与黑绞成絮状（穹顶"在用力"的最小单位）
  function grind(x, y, r, k, seed) {
    if (k < .03) return;
    boilSeed('gr' + Math.round(seed));
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * .5 + (hash(i + seed) - .5) * 1.9, rr = r * (.5 + hash(i + 3) * .8);
      const px = x + Math.cos(a) * rr * .3, py = y + Math.sin(a) * rr * .5;
      const w = r * (.1 + .12 * hash(i + 9)), fl = Math.sin(T * 3 + i * 2.1);
      paint(ribbon([[px - w * 2, py + w * fl], [px, py - w * .4 * fl], [px + w * 2.2, py + w * fl * .6]], w * .9, w * .3),
        { wash: i % 2 ? mixCol(C.warmLt, '#FFFFFF', .2) : mixCol('#1A1610', '#3A3226', hash(i + 5)), washOp: 190 * k, ink: null, curv: .4 });
    }
    halo(x, y, r * .9, C.warm, .45 * k);
  }

  // ---------- 角色 ----------
  const U = 21;
  function NC(x, gy, u, t, o = {}) { F.newClawd(x, gy, u, t, { cold: 0, light: .8, badge: .9, ...o }); }
  // 远景群众：**不是方块**，但也不能长出"另一颗头"（Clawd 的头就是身体方块的上半，P2#4 那个
  // "黑色伪影"正是一颗椭圆头压在方块上）。所以这里沿用 clawd 的剪影语汇：9.2×5.4 的圆角身体 +
  // 四条腿 + 两只手，再按职业在**方块顶上**加帽檐 / 头发 / 绒球，一眼认得出是谁。
  function citSil(x, gy, u, kind, sm, nt, o = {}) {
    if (!on(x, u * 6)) return;
    boilSeed('cs' + Math.round(x) + '_' + Math.round(gy) + kind);
    const base = o.col || tone('#9AA0A8', sm * .55, nt), dk = tone('#5A5F6A', sm * .55, nt);
    const bent = o.bent || 0;
    paint(ellPts(x, gy + 1, u * 1.3, u * .16, 10), { fill: dk, fillOp: 40, bleed: .22, ink: null });
    push(); translate(x, gy + (o.dy || 0) * u); scale(1 + bent * .1, 1 - bent * .12); rotate(o.rot || 0);
    const hip = -2.3 * u, top = -7.6 * u;
    paint(rectPts(-4.5 * u, top, 9 * u, hip - top, u * .3), { wash: base, ink: dk, sw: clamp(u / 18, .5, 1.2) });
    for (const [lx, f] of [[-3.2, 1], [-1.2, 0], [1.2, 0], [3.2, 1]]) paint(rectPts(lx * u - .55 * u, hip, 1.15 * u, -hip, u * .12), { wash: f ? mixCol(base, dk, .4) : base, ink: null });
    for (const sd of [-1, 1]) paint(rectPts(sd * 2.6 * u - .5 * u, top + .7 * u, u, 2 * u, u * .08), { wash: dk, ink: null });   // 两只手
    if (kind === 'cityman') { paint(rectPts(-5.1 * u, top - .55 * u, 10.2 * u, .8 * u, u * .12), { wash: dk, ink: null });      // 帽檐
      paint(rectPts(-2.9 * u, top - 1.9 * u, 5.8 * u, 1.5 * u, u * .2), { wash: dk, ink: null }); }                              // 帽冠
    else if (kind === 'citywoman') { paint(rectPts(-4.7 * u, top - 1.1 * u, 9.4 * u, 2.6 * u, u * .9), { wash: dk, ink: null }); // 短发（压在方块顶上）
      paint([[4.4 * u, top + .6 * u], [5.6 * u, top + 2.4 * u], [4.4 * u, top + 2.6 * u]], { wash: dk, ink: null }); }            // 一缕头发
    else if (kind === 'citykid') { paint(rectPts(-3.6 * u, top - 1.1 * u, 7.2 * u, 1.4 * u, u * .3), { wash: dk, ink: null });    // 水桶帽
      paint(ellPts(0, top - 1.6 * u, .7 * u, .7 * u, 8), { wash: mixCol(dk, C.warm, .4), ink: null }); }                          // 绒球
    if (o.lit > .02) { P.halo(0, hip - 1.4 * u, u * 1.1 * o.lit, C.warm, .45 * o.lit); paint(ellPts(0, hip - 1.4 * u, u * .2, u * .24, 8), { wash: C.warmLt, ink: null }); }
    pop();
  }
  function coughPuff(x, gy, u, ph) {   // 咳嗽喷出的那团尘气：废气致病的**可见证据**
    if (ph <= 0 || ph >= 1) return;
    boilSeed('cph');
    for (let i = 0; i < 3; i++) { const q = frac(ph * 1.2 + i / 3), r = u * (.1 + q * .5);
      paint(ellPts(x + u * 2.2 + q * u * 2.6, gy - u * 5.2 - q * u * .5, r, r * .8, 8), { wash: mixCol('#8A8272', '#4A4436', .4), washOp: 115 * (1 - q) * (1 - ph), ink: null }); }
  }
  function ring2(x, y, r0, r1, k, col) {
    if (k <= 0 || k >= 1) return;
    const r = lerp(r0, r1, easeOut(k));
    inkLine(ellPts(x, y, r, r * .95, 26), swOf(r * .12), mixCol(col, '#20283E', clamp(k * .9)), 'ink', 0);
  }

  // ---------- 回忆：第一部的**真实原帧**半透明重放（用户点名 P2#6；剪影 vignette 那一版被否掉）----------
  // 图源是第一部**渲好的原帧**（24fps；A11=279.6~299.9s、A12=299.9~319.9s），已经拷进 assets/memory 常驻：
  // out/ 是会被清的（R11-5 一次清掉 261MB），走马灯不能建在会被删掉的目录上。
  // 每张给一个取景框 (sx,sy,sw,sh)：径向羽化只保住画面中心，所以取景必须把那一拍的主体摆到中心 ——
  // 原来直接铺整帧，f06912 的中心是一片空夜空，重放出来就"看不见任何东西"（第十二轮 M4 的真正病灶）。
  const MEM_RAW = {}, MEM_G = {};
  // 第二十二轮之后**重新截过**：旧的两张是 10-08 18:05 的截图，而第十七~二十二轮全部落在
  // 10-09 01:19–07:05 —— 素材比观众刚看完的第一部旧了八小时，中间隔着 11 条镜头级修改、
  // 冷光色相和 camera-aware 全屏填充。"回忆必须重放第一部真实原帧"这条约束下，
  // 放旧图出去 = 观众看到的"当年"和他们两分钟前看到的不是同一张画，而且**不会报任何错**。
  // 取景框 (sx,sy,sw,sh) 是照着**新**构图量的：径向羽化只保住中心，主体必须摆到中心。
  // 第二十四轮 R24-17：两张原帧已经换成**本轮重渲后的**第一部帧（旧帧留在
  // out/frames_p1_r23 供对照）。⚠ 换帧必须同时换裁剪框 —— 框是按画面内容量的，
  // 而 A11/A12/A13 这一轮整体改过构图（clawd 挪到 1290、坑挪到他前下方、A13 补了土堆），
  // 沿用旧框会裁掉刚改好的那部分。两个框都保持 16:9（回忆窗口是 16:9 的）。
  const MEM_SRC = [
    { url: 'assets/memory/p1_a11_seed_sprout.jpg', sx: 360, sy: 300, sw: 1320, sh: 742 },   // 第一部 f06708 = 279.5s：睡熟的 clawd + 那一小块棕土里的种子
    { url: 'assets/memory/p1_a12_sprout_wide.jpg', sx: 150, sy: 150, sw: 1620, sh: 911 },     // 第一部 f07488 = 312.0s：树桩地里那一点绿（A13 拉远，林线和桩地都在框里）
  ];
  function loadMem(i, url) {
    try { loadImage(url, img => { MEM_RAW[i] = img; }); }
    catch (e) { const im = new Image(); im.onload = () => { MEM_RAW[i] = im; }; im.src = url; }
  }
  (function tryLoad() { if (window.ready) MEM_SRC.forEach((u, i) => loadMem(i, u.url)); else setTimeout(tryLoad, 200); })();
  function memG(i) {
    if (MEM_G[i]) return MEM_G[i];
    const src = MEM_RAW[i]; if (!src) return null;
    const el = src.elt || src.canvas || src;
    if (!el || !el.width) return null;
    const g = createGraphics(W, H); g.pixelDensity(1);
    const c = g.drawingContext, s = MEM_SRC[i], kw = el.width / 1920, kh = el.height / 1080;
    c.clearRect(0, 0, W, H);
    try { c.drawImage(el, s.sx * kw, s.sy * kh, s.sw * kw, s.sh * kh, 0, 0, W, H); } catch (e) { return null; }
    // 第一部的帧是夜空，压在同为夜色里的第二部上几乎看不出来 —— 先给自己提一档亮（同一帧
    // 以 lighter 再叠一遍，只提 32%），这样 58% 的半透明重放仍然读得出"那是第一部"。
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = .32;
    try { c.drawImage(el, s.sx * kw, s.sy * kh, s.sw * kw, s.sh * kh, 0, 0, W, H); } catch (e) { }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.globalCompositeOperation = 'destination-in';   // 径向羽化：中间实、四周化掉
    c.save(); c.translate(W / 2, H / 2); c.scale(W / 2, H / 2);   // 内切椭圆，四条边都化到 0
    const gr = c.createRadialGradient(0, 0, .14, 0, 0, 1);
    [[0, 'rgba(0,0,0,1)'], [.6, 'rgba(0,0,0,.95)'], [.85, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']].forEach(([q, a]) => gr.addColorStop(q, a));
    c.fillStyle = gr; c.fillRect(-1, -1, 2, 2); c.restore();
    c.globalCompositeOperation = 'source-over';
    MEM_G[i] = g; return g;
  }
  // 暗底与收口都用**真正的径向渐变**画在离屏图上：paint(ellPts(...)) 出来是个多边形，
  // 一圈直边会把"回忆"读成一块盾牌，而不是一个羽化窗口（M4 复核时看到的就是这个）。
  let MEM_MAT = null, MEM_RIM = null;
  function memRad(rOut, stops, rIn = .08) {
    const g = createGraphics(W, H); g.pixelDensity(1); const c = g.drawingContext;
    // 椭圆必须**内切**缓冲。圆形径向渐变在 16:9 的缓冲里，上下边还没化到 0 就已经出界，
    // 贴成窗口之后那两条直边就是把"回忆"读成一块盾牌的病根（第十六轮 N8 复核所见）。
    c.save(); c.translate(W / 2, H / 2); c.scale(W / 2, H / 2);
    const gr = c.createRadialGradient(0, 0, rIn / rOut, 0, 0, 1);
    stops.forEach(([q, a]) => gr.addColorStop(q, `rgba(10,12,20,${a})`));
    c.fillStyle = gr; c.fillRect(-1, -1, 2, 2); c.restore(); return g;
  }
  function memory(i, a) {
    a = clamp(a * 1.35); if (a < .02) return;
    const g = memG(i);
    // 底衬：第一部的帧本身是夜空，压在第二部的夜色上几乎没有差 —— 垫一层暗，原帧才"浮"出来。
    // 只垫到 .42：重放仍然是**半透明**的，观众同时看得见"此刻的树"和"当年的芽"。
    if (!MEM_MAT) MEM_MAT = memRad(.82, [[0, .42], [.62, .4], [.86, .2], [1, 0]]);
    // 第十六轮 N8：重放本身没问题（确实是第一部的原帧），问题是它**铺满整屏**，
    // 而 S9 这一拍的构图里恰好也有"一棵苗 + 一条长凳 + 一只瓶子"—— 两层几乎同构图
    // 半透明叠在一起，观众读不出"那是回忆"，只读出"画面糊了"。
    // 换思路（第十八轮的升级阶梯：先换取景，别调参数）：回忆改成一块**有边的窗口**，
    // 停在画面左上，占不到半屏；窗口之外的现实仍然清楚，并且窗口出现时现实整体压暗一档。
    const MW = W * .50, MH = MW * (H / W), MX = W * .045, MY = H * .045;
    // 第二部 S9 是**白天**，而重放的是第一部的**夜空**。一块半透明的深色矩形压在亮背景上，
    // 观众读到的不是"回忆"，是"脏东西"（t=127 全分辨率复核所见：一团墨渍）。
    // 出路不是把它调亮（那会毁掉"这是当年的原帧"），而是把**现实压得更狠**、把原帧抬成主体、
    // 并且给窗口一圈足够亮的暖光 —— 边界成立，"一块别处的时间"才成立。
    F.dip(.3 * a, '#080A12');
    push(); tint(255, 255 * a); image(MEM_MAT, MX, MY, MW, MH); noTint(); pop();
    if (g) { push(); tint(255, 255 * .82 * a); image(g, MX, MY, MW, MH); noTint(); pop(); }   // 82%：原帧是**主体**，不是质感垫底
    else {   // 拿不到原帧的兜底：把同一拍**手绘重演**一遍（树桩 + 破土的芽 + 一团 clawd），而不是糊一团雾
      boilSeed('memre');
      push(); translate(W / 2, H * .6); scale(1.6);
      P.stump(-170, 6, 1.05, { snow: 0 }); P.stump(200, -14, .8, { snow: 0 }); P.stump(60, 16, .6, { snow: 0 });
      P.sapling(0, 0, 2.6, { k: 1, lit: .85 });
      paint(rectPts(-26, -58, 92, 58, 12), { wash: mixCol(C.crumb, C.night, .3), ink: C.ink, sw: 1 });
      pop();
    }
    // 收口：一圈暖的**羽化**边（渐变画的，不是描边 —— 细白椭圆和 M2 那圈铁丝是同一种病）
    if (!MEM_RIM) {
      const rg = createGraphics(W, H); rg.pixelDensity(1); const rc = rg.drawingContext;
      rc.save(); rc.translate(W / 2, H / 2); rc.scale(W / 2, H / 2);   // 与羽化同一个内切椭圆，收口才贴边
      const gr = rc.createRadialGradient(0, 0, 0, 0, 0, 1);
      [[0, 'rgba(255,236,180,0)'], [.78, 'rgba(255,236,180,0)'], [.93, 'rgba(255,236,180,.72)'], [.99, 'rgba(255,236,180,.3)'], [1, 'rgba(255,236,180,0)']].forEach(([q, col]) => gr.addColorStop(q, col));
      rc.fillStyle = gr; rc.fillRect(-1, -1, 2, 2); rc.restore(); MEM_RIM = rg;
    }
    push(); tint(255, 255 * a * .85); image(MEM_RIM, MX, MY, MW, MH); noTint(); pop();
  }

  const wipeOut = (lt, dur, cols) => { boilSeed('wipe'); if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, cols); };
  const wipeIn = (lt, cols) => { boilSeed('wipe'); if (lt < .3) brushWipe(.5 + lt / .6, cols); };

  // =====================================================================
  // S1 · 0–14.25 · 白天的大城（B1）：极广开场 → 推到主角身上
  // =====================================================================
  function sCity(t, lt, dur) {
    const sm = smother(t) * .1, nt = 0, litK = 0;
    const z = kf(lt, [[0, .42], [4.5, .5], [7, 1.15], [11, 1.5], [14.25, 1.55]]);
    const cx = kf(lt, [[0, 900], [5, 1000], [8.5, 1120], [14.25, 1240]]);
    const cy = kf(lt, [[0, 470], [5, 500], [8.5, 640], [14.25, 700]]);
    camBegin(cx + 8 * Math.sin(lt * .32), cy, z);
    skyDay(sm, nt);
    lighthouse(t, sm, nt, litK);
    skyline(sm, nt, litK);
    viaduct(sm, nt); railTrain(t, sm, nt);
    ktvSign(t, sm, nt); barWindow(t, sm, nt);
    groundAll(sm, nt);
    river(t, sm, nt, blackK(t), litFish(t), litK, null);
    steps(sm, nt); railing(sm, nt); lowWall(1240, 1720, sm, nt);
    streetFurniture(sm, nt, litK);
    F.grade(.02, '#2A2E38');
    // 一对牵手的情侣从画外走进来、走过去（城市有生活，带过即可）
    const cp = ease(seg(lt, 1.5, 12.5));
    if (cp > 0 && cp < 1) { const px = lerp(1700, 260, cp);
      citSil(px, GY + 6, 20, 'cityman', sm, nt, { lit: .1 }); citSil(px + 168, GY + 16, 18, 'citywoman', sm, nt, { lit: .1 }); }
    // 主角：从画外走进来，沿步道向右，停在栏杆边看河
    const w = F.walkTo(lt, .6, 9.4, 300, 1120, U);
    const lean = seg(lt, 9.4, 10.4) * (1 - seg(lt, 13.2, 14.25));
    NC(w.x, GY, U, t, { ...emotions(lt, [[0, 'neutral'], [9.6, 'thinking', { lookY: .2 }], [12.2, 'hopeful', { lookY: -.1 }]]),
      view: w.walk === null ? 'q' : w.view, flip: w.flip, walk: w.walk, dy: w.dy,
      aL: lerp(-.3, -1.15, lean), aR: lerp(.2, -.9, lean), lookX: .5, light: .5 });
    // 一条鱼跃出水面，他的目光跟着它 —— 这一眼是后面所有心疼的定金
    const jk = seg(lt, 11.2, 12.2);
    if (jk > 0 && jk < 1) { const fx0 = -400 + 3 * 460, fy0 = WTOP + 60 + 0 * 62;
      push(); translate(fx0 + 80 * jk, fy0 - 190 * Math.sin(Math.PI * clamp(jk))); rotate(-1.1 + 2.2 * clamp(jk));
      P.fish(0, 0, 34, { dir: 1, lit: 1 }); pop(); }
    if (jk > .1) EV.rippleCross(lt - 11.4, 960, WTOP + 130, 40);
    const bk2 = seg(lt, 5.2, 7.6);
    if (bk2 > 0 && bk2 < 1) { const bx2 = lerp(-600, 1500, bk2), by2 = WTOP + 40 + Math.sin(bk2 * 5) * 22;
      inkLine([[bx2 - 26, by2], [bx2 - 8, by2 - 12], [bx2, by2], [bx2 + 8, by2 - 12], [bx2 + 26, by2]], 1.6, tone('#5E6E78', sm, nt), 'ink', .3); }
    // 第二十四轮 R24-11 把这句从 lt 6.4 挪到鱼落地之后（11.2 跃起 → 12.2 落回 → 12.15 开口），
    // 修的是"台词跑在证据前面"。**但用户第二十六轮 R26-4 指出更深的一层：这时候河根本还没脏。**
    // blackK(t) 要到 t=26 才开始上色，litFish 的六列鱼灯是 t=30~51 才一盏盏灭的 ——
    // 也就是说 t=12 这条河是**完好**的，鱼一直都在，"back（回来了）"这三个字没有所指。
    // 所以这句不是挪时间，是**挪场**：留在这里的只有"一条鱼跃出、他的目光跟着它"这件事
    // （剧本说这一眼是"后面所有心疼的定金"—— 那就必须先让观众看见它好端端地活着）。
    // 台词本体放到 S10 第一次鱼跃之后，见 sForest。
    camEnd();
    if (lt < .7) F.irisIn(W / 2, H / 2, ease(seg(lt, 0, .7)));
    wipeOut(lt, dur, ['#8E9AA6', '#6E7C8A']);
  }

  // =====================================================================
  // S2 · 14.25–26.25 · 工厂接管小树林（B2）
  // 挖掘机 ≈ 大树：低机位特写只露它的履带和车身，它就比一切都大；拉远才看得见整条街。
  // =====================================================================
  function sGrove(t, lt, dur) {
    const sm = smother(t), nt = 0;
    const z = kf(lt, [[0, .62], [2.6, 1.9], [4.6, 1.5], [7.6, .95], [12, .5], [17, .46], [21, 1.15], [24, 1.2]]);
    const cx = kf(lt, [[0, 1720], [2.6, 1560], [4.6, 1660], [7.6, 1800], [12, 1900], [17, 1980], [21, 1900], [24, 1860]]);
    const cy = kf(lt, [[0, 620], [2.6, 760], [4.6, 700], [7.6, 640], [12, 520], [17, 500], [21, 640], [24, 660]]);
    camBegin(cx, cy, z);
    skyDay(sm, nt);
    skyline(sm, nt, 0);
    groundAll(sm, nt);
    river(t, sm, nt, blackK(t), litFish(t), 0, null);
    railing(sm, nt);
    fir(1560, GY + 4, 3.4, { cheap: true }); fir(1660, GY, 3.8, { wind: .2 });
    fir(2400, GY + 8, 3.2, {}); fir(2530, GY + 4, 3.6, { cheap: true });
    bigTree(BX, GY, TREEM, heartK(t), 0, sm, nt);
    // 树冠里的鸟窝：一只成鸟还站着，没走（它不搬）
    if (vw().z > .5) { const nx = BX - 20, ny = GY - HERO * TREEM * 1.06;
      paint(ellPts(nx, ny + 6, 22, 9, 12), { wash: tone('#8A7A5E', sm, nt), ink: tone('#5A4A32', sm, nt), sw: .9 });
      if (lt < 20) { paint(ellPts(nx + 6, ny - 8, 6, 5, 8), { wash: tone('#5E5848', sm, nt), ink: null });
        inkLine([[nx + 12, ny - 10], [nx + 22, ny - 8]], 1.2, tone('#8A7A4E', sm, nt), 'inkfine', 0); } }
    P.hoarding(1420, GY, 1.7, {});   // 围挡（图形化工厂标志）
    felled(1740, seg(lt, 2.5, 4.5), -1, 3.6, sm, nt);
    felled(1880, seg(lt, 6.5, 8.5), -1, 3.2, sm, nt);
    felled(2160, seg(lt, 9.5, 11.5), 1, 3.9, sm, nt);
    // 挖掘机：从画外开进来，一路向右吃掉林子，最后在那棵大树前**自己熄了火**
    const exX = kf(lt, [[0, 1360], [3, 1620], [7, 1800], [11, 2060], [14, 2130], [19, 2130], [22.5, 2050], [24, 2010]]);
    const armA = kf(lt, [[2.0, .35], [3.2, 1.15], [4.6, .5], [6.4, 1.2], [8.4, .45], [9.6, 1.25], [11.4, .6], [13.6, .3], [24, .3]]);
    const dying = seg(lt, 14, 16);
    P.excavator(exX, GY, EXCM, { dir: 1, armA, stick: -.95 - .35 * dying, beacon: 1 - dying, pool: 0 });
    if (dying > .2) { boilSeed('exsmoke'); for (let i = 0; i < 3; i++) { const ph = frac(T * .3 + i / 3);
      paint(ellPts(exX + 60 - ph * 40, GY - EXCM * HERO - ph * 60, 12 + ph * 26, 10 + ph * 20, 10), { wash: tone('#6E6A62', sm, nt), washOp: 110 * (1 - ph) * dying, ink: null }); } }
    // 施工队：安全帽走 clawd 的 hat:'hard'（真正的圆顶 + 帽檐，不是原来那只倒扣的盆）
    const crew = [[1520, 20], [1600, 19], [1664, 21]];
    crew.forEach(([bx0, bu], i) => {
      const wx = bx0 + (exX - 1620) * .1 + ease(seg(lt, 14, 20)) * 60 * (i + 1);
      const walking = lt > 14 && lt < 22, g = walking ? F.gait(t) : null;
      clawd(wx, GY + 4 + i * 3, bu, { ...job('cityman', t, { hat: 'hard', armL: null, armR: null, view: 'q', flip: true,
        expr: lt > 15 ? 'solemn' : (i === 0 ? 'angry' : 'neutral'), light: .28, walk: g, dy: g ? -Math.abs(Math.sin(g * TAU)) * .26 : 0,
        aL: lt > 16 ? -1.25 : -.3, aR: lt > 16 ? -1.1 : .2, lookX: lt > 14 ? -.85 : .8 }) });
    });
    // 围挡外的市民：整条街的人都来了。全部留在围挡（x≥1420）**之外**。
    // N4：原来注释写着"间距 ≥ 一个半身体"，实际给的却是 44px —— 而一具身体有 9u ≈ 160px 宽，
    // 于是九个人糊成一个六条腿的宽块。**重叠本身不是错，同一深度上的重叠才是错**：
    // 现在每人占一条自己的进深线（y 与 u 一起变），近的大而低、远的小而高，
    // 叠在一起读作"一街的人"，不是"一个怪物"。
    // N4 的**另一半**：上一版只把"聚拢之后"的间距改对了，`gather=0` 的开场那一端仍然是 46px
    // 一格 —— 于是这一场的前 11 拍照样糊成一坨（复验 t=25 看到的就是这个）。
    // 两端都要 ≥ 一个身体宽；进深线（lane）让近大远小、低高错开。
    const gather = ease(seg(lt, 11, 15));
    for (let i = 0; i < 9; i++) {
      const lane = i % 4, bx0 = lerp(700 + i * 138 - lane * 26, 940 + i * 168 - lane * 30, gather);
      citSil(bx0, GY + 2 + lane * 24, 14.5 + lane * 2.6 + 2 * hash(i), ['cityman', 'citywoman', 'citykid'][i % 3], sm, nt, { lit: .1 });
    }
    if (lt > 13) clawd(1330, GY + 14, 22, { ...job('citywoman', t, { view: 'q', expr: 'nervous', light: .28, bundle: 'cry', lookX: .9 }) });
    // 主角在围挡外，手指抠着围挡板
    const ncX = kf(lt, [[0, 1240], [6, 1330], [12, 1400], [24, 1424]]);
    const grab = seg(lt, 6, 8) * (1 - seg(lt, 12, 13));
    NC(ncX, GY, U, t, { ...emotions(lt, [[0, 'neutral'], [3, 'surprised'], [7, 'nervous'], [12.5, 'heartache', { lookY: -.3 }], [19, 'hopeful', { lookY: -.4 }]]),
      view: 'q', flip: true, aL: lerp(-.3, -1.5, grab), aR: -.35, lookX: .85, light: .5 });
    F.say(t, 17.6, 1560, GY - 214, 'Hold the machine.', { dur: 2.4, size: 38, tailX: 1600 });
    F.say(t, 21.4, 2010, GY - 250, '...Not this one.', { dur: 2.6, size: 38, tailX: 2040 });
    F.grade(.03 + sm * .05, '#3A3226');
    camEnd();
    wipeIn(lt, ['#8E9AA6', '#6E7C8A']);
    wipeOut(lt, dur, ['#7E8878', '#5E6A5E']);
  }
  // 一棵被放倒的树：站着 → 转 → 躺倒（比人大）→ 树桩 + 绿光灵魂（和 A4 同构）
  function felled(x, k, dir, m, sm, nt) {
    if (k <= 0) { fir(x, GY, m, { wind: .3 }); return; }
    if (k < 1) {
      push(); translate(x, GY); rotate(ease(k) * 1.42 * dir); P.fir(0, 0, m, { snowK: 0, tone: FIR }); pop();
      if (k > .8) { const q = (k - .8) / .2; boilSeed('dust'); for (let i = 0; i < 6; i++) { const a = hash(i) * TAU;
        paint(ellPts(x + dir * m * HERO * .3 * q + Math.cos(a) * 46 * q, GY - 20 + Math.sin(a) * 22 * q, 16 * (1 - q) + 4, 8 * (1 - q) + 3, 8), { wash: tone('#8A7A5E', sm, nt), washOp: 150 * (1 - q), ink: null }); } }
      return;
    }
    P.fallenTrunk(x - dir * 40, GY, m, { dir, snowK: 0, lift: .5 });
    P.stump(x, GY, .55, { snow: false, wide: .9 });
    P.greenSoul(x, GY, m * .8, clamp((k - 1) * 1.5), PAL.sap);
  }

  // =====================================================================
  // S3 · 26.25–50.25 · 黑水（B3）：极广摊开厂区全貌；他走到哪黑到哪
  // =====================================================================
  function sPollute(t, lt, dur) {
    const sm = smother(t), nt = 0, bk = blackK(t);
    const z = kf(lt, [[0, .4], [6, .44], [12, .55], [18, 1.05], [24, 1.5], [30, 1.15], [38, .62], [44, 1.25], [48, 1.4]]);
    const cx = kf(lt, [[0, 2100], [6, 2000], [12, 1700], [18, 1200], [24, 900], [30, 900], [38, 1000], [44, 1500], [48, 1780]]);
    const cy = kf(lt, [[0, 300], [6, 340], [12, 470], [18, 620], [24, 700], [30, 700], [38, 560], [44, 520], [48, 470]]);
    camBegin(cx + 10 * Math.sin(lt * .28), cy, z);
    skyDay(sm, nt);
    skyline(sm, nt, 0);
    groundAll(sm, nt);
    river(t, sm, nt, bk, litFish(t), 0, null);
    steps(sm, nt); railing(sm, nt); lowWall(1240, 1720, sm, nt);
    P.hoarding(1420, GY, 1.7, {});   // 围挡还在：它要到 B8 行军之后才被拆走（道具跨场连续存在）
    streetFurniture(sm, nt, 0);
    factory(t, sm, nt, 0, 0);
    outfall(t, sm, nt, ease(seg(lt, .5, 3.5)));
    smoke(t, sm, nt);
    // R24-12：这一场**不画那棵树**。它站在 BX=2200、gy=906，正好把排污管的管口
    // （mx=2230, my=728）和那一团一团吐出来的黑水整个挡住（t=34 全分辨率所见：管子从右边伸过来，
    // 断在树干后面，观众根本不知道黑水是从哪儿来的）。而这一场的主角就是那根管子和那条河，
    // 树不是它的戏 —— 一棵"希望之树"提前出现，还把因果挡住了。
    // S2 保留（挖掘机在那棵树前熄火，它就是主体），S4 本来就没画树，S5（70.25 起）才是它的**第一次
    // 露脸**：穹顶之前的整段污染里，观众只看得见 lt>40 那团暖光（下面那行 halo），
    // 和 S4 结尾"他抬头看见暖黄"是同一套语言 —— 先看见光，再看见树。
    F.grade(.03 + sm * .16, '#2E2A20');
    // 一只水鸟落在水面，站了一会儿，飞走了（连鸟都不肯留下）
    if (lt > 6 && lt < 13) {
      const bx0 = 640, by0 = WTOP + 130, fly = seg(lt, 10.5, 13);
      if (fly <= 0) {
        paint(ellPts(bx0, by0 - 12, 12, 7, 10), { wash: tone('#5A5E58', sm, nt), ink: null });
        paint(ellPts(bx0 + 12, by0 - 24, 5, 5, 8), { wash: tone('#5A5E58', sm, nt), ink: null });
        inkLine([[bx0 + 16, by0 - 26], [bx0 + 27, by0 - 24]], 1.2, tone('#8A7A4E', sm, nt), 'inkfine', 0);
        inkLine([[bx0 - 22, by0], [bx0 - 4, by0 - 8], [bx0 + 14, by0 - 2]], 1.6, tone('#4A4E48', sm, nt), 'ink', .3);
      } else { const fx = lerp(bx0, bx0 - 700, ease(fly)), fy = lerp(by0 - 20, by0 - 320, ease(fly));
        inkLine([[fx - 26, fy + 8], [fx - 8, fy - 10], [fx, fy], [fx + 8, fy - 10], [fx + 26, fy + 8]], 1.8, tone('#4A4E48', sm, nt), 'ink', .3); }
    }
    // 主角沿河走 → 蹲下伸手探水 → 缩回来看着指尖的黑
    const w = F.walkTo(lt, 12, 22, 1500, 760, U, 'walk', 'side');
    const crouch = ease(seg(lt, 22, 24)) * (1 - ease(seg(lt, 30, 32)));
    const touch = seg(lt, 24.5, 26) * (1 - seg(lt, 27, 28.2));
    if (lt < 32.5) {
      NC(w.x, GY, U, t, { ...emotions(lt, [[12, 'heartache'], [20, 'sad'], [26.5, 'disgusted'], [33, 'heartache'], [40, 'hopeful', { lookY: -.6 }]]),
        view: 'side', flip: true, walk: crouch > .3 ? null : w.walk, dy: crouch > .3 ? 0 : w.dy,
        sq: .5 * crouch, rot: .1 * crouch, aR: lerp(-.2, 1.4, touch), aL: -.4 - .5 * crouch, lookY: lerp(.1, .8, crouch), light: .45 });
      if (touch > .3) { paint(ellPts(w.x - 104, GY - 44, 7, 5, 8), { wash: '#141812', washOp: 230 * touch, ink: null }); }
    }
    if (lt >= 32.5) {   // 他站起来往城里走（背影），镜头跟着
      const w2 = F.walkTo(lt, 32.5, 44, 760, 300, U, 'walk', 'qback');
      NC(w2.x, GY, U, t, { ...emotions(lt, [[32.5, 'sad'], [40, 'determined', { lookX: -.6 }]]), view: 'qback', flip: true, walk: w2.walk, dy: w2.dy, aL: -.5, aR: -.45, light: .45 });
    }
    if (lt > 40) { const k2 = ease(seg(lt, 40, 42)); halo(BX, GY - HERO * TREEM * .46, 130 * k2, C.warm, .5 * k2); }
    if (lt > 15.5 && lt < 16.6) EV.fishJump(lt - 15.5, 1180, WTOP + 140, 34, { dir: -1 });
    camEnd();
    wipeIn(lt, ['#7E8878', '#5E6A5E']);
    wipeOut(lt, dur, ['#5A5648', '#46423A']);
  }

  // =====================================================================
  // S4 · 50.25–70.25 · 咳嗽的城市（B4）
  // 街在对岸：楼就在人物背后、同一层地面。人群**摊开**、每人一个动作；咳嗽看得见。
  // =====================================================================
  function sCough(t, lt, dur) {
    const sm = smother(t), nt = 0;
    const z = kf(lt, [[0, .55], [4, .95], [10, 1.25], [14, 1.05], [20, .8], [28, 1.35], [34, 1.05], [40, .46]]);
    const cx = kf(lt, [[0, 200], [4, 340], [10, 480], [14, 560], [20, 620], [28, 700], [34, 760], [40, 1100]]);
    const cy = kf(lt, [[0, 560], [4, 660], [10, 700], [14, 700], [20, 680], [28, 660], [34, 660], [40, 520]]);
    camBegin(cx + 6 * Math.sin(lt * .3), cy, z);
    skyDay(sm, nt);
    lighthouse(t, sm, nt, 0);
    skyline(sm, nt, 0);
    viaduct(sm, nt); railTrain(t, sm, nt);
    ktvSign(t, sm, nt); barWindow(t, sm, nt);
    groundAll(sm, nt);
    river(t, sm, nt, blackK(t), litFish(t), 0, null);
    smoke(t, sm, nt);
    // 街具都在，只是没精神：斑马线、站牌、灯箱 —— 全部在**步道上**（gy>QUAY），不是在水里
    boilSeed('zebra');
    for (let i = 0; i < 7; i++) paint(rectPts(120 + i * 90, GY + 90, 52, 150, 3), { wash: tone('#C6C0B0', sm, nt), washOp: 145, ink: null });
    paint(rectPts(880, GY - 120, 12, 140, 2), { wash: tone(DAY.iron, sm, nt), ink: null });
    paint(rrPts(826, GY - 178, 120, 60, 8, 2), { wash: tone('#8E9AA2', sm, nt), fill: tone('#5E6A72', sm, nt), fillOp: 50, ink: tone('#3E464C', sm, nt), sw: 1 });
    lowWall(1240, 1720, sm, nt);
    F.grade(.03 + sm * .2, '#2E2A20');
    // 图层序 = 进深序：远排先画（更小、更高、更淡），否则它会盖在近排角色头上变成"黑色伪影"（P2#4）
    for (let i = 0; i < 10; i++) citSil(-500 + i * 260 + Math.sin(t * .3 + i) * 12, GY + 4 + (i % 3) * 8, 14 + 2.5 * hash(i),
      ['cityman', 'citywoman', 'citykid'][i % 3], sm, nt, { lit: .05, bent: .3 + .3 * hash(i + 5) });
    if (lt > 28) { const m = ease(seg(lt, 28, 40));
      for (let i = 0; i < 12; i++) citSil(lerp(-200 + i * 190, 1500 + i * 92, m), GY + 10 + (i % 4) * 10, 16 + 3 * hash(i),
        ['cityman', 'citywoman', 'citykid', 'cityman'][i % 4], sm, nt, { lit: .1, bent: .18 }); }
    // 咳嗽的群像：前排 4 个真角色（间距 300~360 > 一个身体宽 210），绝不挤成一团
    // P2G-4（t=60 全分辨率复核）：四个人原来同 y(GY+46)、同尺寸(22)、几乎等距 —— 一排等高就是传送带，
    // 读不出"东倒西歪的病号"。给他们进深：靠镜头的画大画低，远的画小画高，间距也拉开。
    // **数组顺序 = 进深（远→近）**，这样近的人盖住远的，遮挡关系不会再反过来。
    const A = [[1010, 'citywoman', 'cough', 1.05, 22, 18], [300, 'citywoman', 'cough', .35, 32, 20],
      [-40, 'cityman', 'cough', 0, 56, 25], [660, 'cityman', 'weary', .7, 64, 26]];
    for (const [x0, kind, ex, ph, dy, pu] of A) {
      const appear = ease(seg(lt, .5 + ph * 4, 2.5 + ph * 4));
      if (appear < .02) continue;
      const x = x0 + lerp(-280, 0, appear);
      clawd(x, GY + dy, pu, { ...job(kind, t, { view: 'q', expr: ex, light: .2, flip: x0 > 500, lookX: x0 > 500 ? -.6 : .5 }) });
      const cp = frac((lt + ph * 1.3) * .85); coughPuff(x + 22, GY + dy, pu, cp < .5 ? cp * 2 : 0);
    }
    const mom = ease(seg(lt, 3, 9));
    if (mom > .01 && mom < 1) { const mx = lerp(-320, 700, mom);
      clawd(mx, GY + 54, 23, { ...job('citywoman', t, { view: 'q', expr: 'scared', bundle: 'cry', light: .16, walk: F.gait(t, 'run'), flip: false }) }); }
    const catK = seg(lt, 12, 15.5);
    if (catK > 0 && catK < 1) P.cat(lerp(1200, 200, catK), GY + 62, 26, { col: tone('#8A8278', sm, nt) });
    // 主角：咳嗽、撑墙、滑坐 —— 坐下的一瞬抬头看见暖黄
    const ncX = kf(lt, [[0, 1400], [8, 1120], [12, 1040], [20, 1040], [28, 1120], [40, 1500]]);
    const fall = ease(seg(lt, 10, 12)) * (1 - ease(seg(lt, 15.5, 17.5)));
    const find = ease(seg(lt, 12.5, 14)), point = seg(lt, 17, 18.5) * (1 - seg(lt, 21, 22.5));
    // R24-14（后半）：这一场里"唯一一个不咳嗽"的就是**主角自己**，而病根不在构图，在键名：
    // emotions()/feel() 只查 clawd.js 的 EMO 表，'cough' 是 jobs.js 里 EXPR 的键（只有 job()/exprOf()
    // 走得到），所以 `[[0,'cough']]` 一路 fall through 到 EMO.neutral —— 正常眼、**没有嘴**、还跟着
    // 拍子一下一下地弹（t=60 全分辨率所见：四个弯腰咳的人旁边站着一个 blanks 脸蹦跶的，读作"他挺开心"）。
    // 改派 EMO 里真实存在的 'shiver'（窄眼 + wobble 嘴 + 发白 + 全身高频发抖 + 往前咳），再给他一团
    // 和群像同款的咳尘。真正的解法是往 EMO 里补一个 cough —— 那是共享文件，已按规则上报未动。
    NC(ncX, GY + 44, U, t, { ...emotions(lt, [[0, 'shiver'], [10, 'weary'], [13, 'surprised', { lookY: -.7 }], [16.5, 'determined'], [24, 'hopeful'], [34, 'happy']]),
      view: 'q', sq: .5 * fall, rot: .1 * fall, aL: lerp(-.9, -1.5, fall), aR: lerp(-.8, lerp(.2, 1.5, point), find),
      lookX: lerp(.2, .9, find), lookY: lerp(.5, -.6, find), light: .32 });
    const hcp = frac(lt * .85);
    if (lt < 10.5) coughPuff(ncX + 22, GY + 44, U, hcp < .5 ? hcp * 2 : 0);
    if (lt > 17) clawd(ncX + 300, GY + 48, 22, { ...job('cityman', t, { view: 'q', expr: 'surprised', light: .2, aR: 1.45, lookX: .6, lookY: -.6 }) });
    if (lt > 21) {
      clawd(ncX + 600, GY + 42, 15, { ...job('citykid', t, { view: 'q', expr: 'starstruck', light: .2, aR: 1.5, lookY: -.7 }) });
      citSil(ncX + 800, GY + 50, 22, 'citywoman', sm, nt, { lit: .2, rot: -.1 });
    }
    F.say(t, 18.2, ncX + 120, GY - 70, 'Look.', { dur: 2.2, size: 40, tailX: ncX + 40 });
    F.say(t, 24.5, 1180, GY - 66, 'The water is dead.', { dur: 3.2, size: 38, tailX: 1120 });
    if (find > 0) halo(BX, GY - HERO * TREEM * .46, 170 * find, C.warm, .45 * find);
    camEnd();
    wipeIn(lt, ['#5A5648', '#46423A']);
    if (lt > dur - .9) F.irisOut(...toScreen(BX, GY - HERO * TREEM * .46), ease(seg(lt, dur - .9, dur - .12)));
  }

  // =====================================================================
  // S5 · 70.25–74.25 · 树下（B5）—— 全片最静的四秒
  // =====================================================================
  function sUnder(t, lt, dur) {
    const sm = smother(t), nt = 0;
    camBegin(BX + 6 * Math.sin(lt * .4), GY - HERO * TREEM * .5, kf(lt, [[0, 1.45], [4, 1.7]]));
    skyDay(sm, nt);
    skyline(sm, nt, 0);
    groundAll(sm, nt);
    river(t, sm, nt, blackK(t), litFish(t), 0, null);
    P.hoarding(1420, GY, 1.7, {});
    bigTree(BX, GY, TREEM, .3 + .05 * Math.sin(T * 2.2), 0, sm, nt);
    F.grade(.05 + sm * .18, '#2A2620');
    // 远排先画（更小、更高），近排真角色后画：图层序=进深序
    for (const [ox, k] of [[-620, 'cityman'], [-450, 'citywoman'], [-280, 'cityman'], [-110, 'citywoman'], [60, 'citykid'], [230, 'cityman'], [400, 'citywoman']])
      citSil(BX + ox, GY - 10 + (Math.abs(ox) % 3) * 5, 17.5, k, sm, nt, { lit: .1, bent: -.12 });
    clawd(BX - 360, GY + 18, 21, { ...job('cityman', t, { view: 'front', expr: 'holdbreath', light: .14, lookY: -.9 }) });
    clawd(BX - 150, GY + 24, 22, { ...job('citywoman', t, { view: 'front', expr: 'nervous', light: .14, lookY: -.9, bundle: 'sleep' }) });
    clawd(BX + 300, GY + 20, 15, { ...job('citykid', t, { view: 'front', expr: 'holdbreath', light: .14, lookY: -.9 }) });
    NC(BX + 60, GY + 32, U, t, { ...emotions(lt, [[0, 'hopeful', { lookY: -.85 }], [2.6, 'holdbreath', { lookY: -.9 }]]), view: 'front', aL: -.4, aR: -.35, light: .35 });
    if (lt > 2.4 && lt < 2.9) {   // 叶子 tremble 一次（两拍）
      const q = Math.sin((lt - 2.4) * 22) * (1 - (lt - 2.4) / .5);
      boilSeed('trem');
      for (let i = 0; i < 8; i++) { const a = hash(i) * TAU;
        paint(ellPts(BX + Math.cos(a) * 210, GY - HERO * TREEM * 1.02 + Math.sin(a) * 120 + q * 22, 6, 4, 8), { wash: tone('#7FA860', sm, nt), washOp: 150 * Math.abs(q), ink: null }); } }
    camEnd();
    if (lt < .5) F.irisIn(...toScreen(BX, GY - HERO * TREEM * .46), ease(seg(lt, 0, .5)));
  }

  // =====================================================================
  // S6 · 74.25–86.25 · 光之穹顶（B6）：树小、罩小，罩外的废气是**大**的
  // 里面的人先是**怕**，然后胸口灯逐拍复燃（每拍一个、位置错开、亮时头顶一圈光环）
  // =====================================================================
  function sDome(t, lt, dur) {
    const sm = smother(t), nt = 0, r = domeK(t);
    const z = kf(lt, [[0, 1.6], [1.5, .8], [6, .62], [12, .95], [18, 1.25], [24, 1.3]]);
    const cx = kf(lt, [[0, BX - 40], [1.5, BX - 260], [6, BX - 320], [12, BX - 260], [18, BX - 160], [24, BX - 100]]);
    camBegin(cx + 10 * Math.sin(lt * .3), kf(lt, [[0, 560], [6, 500], [18, 560]]), z);
    skyDay(sm, nt);
    skyline(sm, nt, 0);
    groundAll(sm, nt, .18);
    river(t, sm, nt, blackK(t), litFish(t), 0, null);
    P.hoarding(1420, GY, 1.7, {});
    bigTree(BX, GY, TREEM, 1, clamp(seg(lt, 1, 5)), sm, nt);
    F.grade(.05 + sm * .14, '#2A2620');
    // 这块"点亮"闪光原来写死在世界坐标 (-60,-60,W+120,H+120)。S6 开场机位是 zoom 1.6、
    // cx=BX-40，于是这块"整屏"只盖住画面左边约 35%，留下一条**边缘笔直的米色方块**
    // —— 就是第十六轮 N11 看到的那个伪影。整屏的图元必须按当前相机算。
    if (lt < .5) { boilSeed('fl'); const q = camRect(); paint(rectPts(q[0], q[1], q[2], q[3]), { wash: '#FFF6DC', washOp: 185 * (1 - lt / .5), ink: null }); }
    // P2#5「要表现抵御废气」：罩子必须**被顶出形**。S7 早就有 dents + grind 这套语言，
    // S6 之前却是 `dome(..., [], ...)`（永远不凹）+ 一团半径 r+140 起跳、**从没碰到罩子**的雾。
    // 现在三个压点跟着鼓点交替用力：凹下去 → 弹回 → 换一个方向再压。
    const press = [];
    for (let i = 0; i < 3; i++) {
      const a = Math.PI * 1.1 + i * .44;
      const w = .5 + .5 * Math.sin(bpOf(t) * Math.PI * (i === 1 ? .5 : 1) + i * 2.1);
      press.push({ a, k: (.17 + .06 * i) * sm * clamp(seg(lt, 1.2, 3.6)) * (.45 + .55 * w) });
    }
    // R24-15：这一层原来**根本看不见**，三处叠在一起：团太小（240~380 宽，罩子半径 470~520，
    // 观众只看到壳边糊了一点）、颜色太土（#3A3428 就是霾的土黄，等于没上反差）、washOp 只有
    // 115*sm*(1-ph*.6) ≈ 60~100 —— 半透明的一层纱。现在它是**一堵墙**：八团、每团比罩子还大、
    // 近黑、几乎不透明。气墙画在罩子**后面**（先画），壳面那层暖光才压得住它；被顶回去的那一层
    // 凹进壳面，凹点仍由 press 给，接触面照旧磨金黑的絮、甩出被弹开的尘 —— 语言不变，只是看得见了。
    const gas = [];
    for (let i = 0; i < 8; i++) {
      const ph = frac(T * .07 + i * .125), a = Math.PI * 1.02 + i * .21;
      const pk = press.reduce((m, d) => Math.max(m, d.k * Math.exp(-Math.pow((Math.atan2(Math.sin(a - d.a), Math.cos(a - d.a))) / .5, 2))), 0);
      const rx0 = 330 + 215 * ph, ry0 = 205 + 135 * ph;
      const rr = r + rx0 * .72 + 140 * ph - 560 * pk;   // 内缘咬进壳面一点点：那是被顶回去的一层
      gas.push({ a, ph, pk, rx0, ry0, px: BX + Math.cos(a) * rr, py: GY + 10 + Math.sin(a) * rr * .8 });
    }
    boilSeed('dm.gas');
    for (const g of gas) {
      paint(ellPts(g.px, g.py, g.rx0, g.ry0, 18, 11), { wash: mixCol('#191612', '#05070C', .2 + .6 * g.ph), washOp: 238 * sm * (1 - g.ph * .28), ink: null, curv: .45 });
      paint(ellPts(g.px - 34, g.py + 16, g.rx0 * .54, g.ry0 * .48, 14, 8), { wash: '#04050A', washOp: 195 * sm * (1 - g.ph * .4), ink: null, curv: .4 });
    }
    if (r > 30) dome(BX, GY + 10, r, clamp(seg(lt, .6, 2.6)), press, C.warm);
    for (const g of gas) {   // 接触面磨出金黑的絮，并沿壳边甩出几缕被弹开的尘
      if (g.pk <= .03) continue;
      grind(BX + Math.cos(g.a) * r * .96, GY + 10 + Math.sin(g.a) * r * .8, 110 + 90 * g.pk * 10, clamp(g.pk * 11), g.a * 7);
      for (let j = 0; j < 4; j++) { const da = (j - 1.5) * .16;
        paint(ellPts(BX + Math.cos(g.a + da) * (r + 30), GY + 10 + Math.sin(g.a + da) * (r + 30) * .82, 32, 16, 8, 3, g.a + da),
          { wash: mixCol('#241F18', '#0A0C0E', g.ph), washOp: 210 * sm * g.pk * 10, ink: null }); } }
    const relight = [2, 4, 6, 8, 10, 12];
    const crowd = [[-430, 12, 15, 'citykid', 'scared'], [-330, 8, 22, 'citywoman', 'scared'], [-215, 14, 21, 'cityman', 'nervous'],
      [150, 10, 22, 'cityman', 'nervous'], [265, 16, 20, 'citywoman', 'holdbreath'], [390, 8, 15, 'citykid', 'scared']];
    crowd.forEach(([ox, dy, pu, kind, ex0], i) => {
      const rl = seg(lt, relight[i], relight[i] + 1.2);
      const x = BX + ox, gy = GY + dy;
      // 第十六轮 N3：复燃之后原来是 'relieved'/'hopeful' —— hopeful 是**星星眼**，
      // 一群三秒前还在发抖的人突然冒出卡通闪光眼，读作"兴奋"而不是"劫后余生"。
      // 改成 relieved / solemn / comfort：松了一口气、被安抚、说不出话。三种轮着来。
      clawd(x, gy, pu, { ...job(kind, t, { view: 'front', expr: rl >= 1 ? ['relieved', 'solemn', 'hopeful'][i % 3] : ex0,
        light: .14 + .76 * rl, lookY: -.5 + .3 * rl, bundle: kind === 'citywoman' ? 'cry' : undefined }) });
      if (rl > 0 && rl < 1) { ring2(x, gy - 3.4 * pu, 14, 90, rl, C.warm); P.lightPatch(x, gy + 2, 120, C.warm, .45 * rl); }
    });
    const bk = seg(lt, 2, 3);   // 妈妈怀里的孩子第一个亮（新生）
    if (bk > 0) { clawd(BX - 120, GY + 18, 9, { ...job('baby', t, { view: 'q', expr: bk >= 1 ? 'coo' : 'surprised', light: .2 + .8 * bk }) });
      if (bk < 1) ring2(BX - 120, GY + 18 - 3.4 * 9, 10, 70, bk, C.warm); }
    const ck = seg(lt, 5, 8);   // 猫回来了，从画外走进光圈
    if (ck > 0 && ck < 1) P.cat(lerp(BX + 400, BX + 120, ease(ck)), GY + 12, 26, { col: tone('#7A6E5E', sm, nt) });
    const ncX = BX - r * .62, back = ease(seg(lt, 18, 21));
    NC(ncX, GY + 14, U, t, { ...emotions(lt, [[0, 'starstruck'], [4, 'hopeful'], [12, 'happy'], [18, 'nervous', { lookX: -1 }]]),
      view: 'front', aL: -.45, aR: -.4, lookX: back > 0 ? -.9 : .1, lookY: -.2, light: .9 });
    if (back > 0) smoke(t, Math.min(1, sm + back * .25), nt);
    if (lt > 13) {   // 有人跪在树根下捧起一把发光的种子：planting starts here
      const k2 = ease(seg(lt, 13, 15));
      clawd(BX + 140, GY + 22, 21, { ...job('cityman', t, { view: 'q', expr: 'solemn', light: .8, armL: null, armR: null, aL: 1.1, aR: 1.05, sq: .3 * k2, dy: 1.1 * k2 }) });
      P.seed(BX + 178, GY - 4, 26); halo(BX + 178, GY - 12, 60 * k2, C.warm, .75 * k2);
    }
    camEnd();
    wipeOut(lt, dur, ['#46423A', '#3A3630']);
  }

  // =====================================================================
  // S7 · 86.25–98.25 · 工厂反扑 / 穹顶顶住（B7）
  // 广角同时装下工厂与穹顶：废气**大**、树与罩**小**。受击点凹陷、在拍子上弹回。
  // =====================================================================
  function sFight(t, lt, dur) {
    const sm = smother(t), nt = 0, r = domeK(t);
    const z = kf(lt, [[0, .5], [4, .58], [8, .95], [12, 1.3], [16, .8], [20, .62], [24, .68]]);
    const cx = kf(lt, [[0, 2260], [4, 2180], [8, 2060], [12, 1980], [16, 1900], [20, 1700], [24, 1500]]);
    const cy = kf(lt, [[0, 420], [4, 460], [8, 560], [12, 620], [16, 540], [20, 480], [24, 500]]);
    camBegin(cx, cy, z);
    skyDay(sm, nt);
    skyline(sm, nt, 0);
    groundAll(sm, nt, .1);
    river(t, sm, nt, blackK(t), litFish(t), 0, null);
    P.hoarding(1420, GY, 1.7, {});
    factory(t, sm, nt, ease(seg(lt, 12, 15)), 0);
    outfall(t, sm, nt, 1 - ease(seg(lt, 12, 16)));
    bigTree(BX, GY, TREEM, 1, .7, sm, nt);
    F.grade(.05 + sm * .16, '#2A2620');
    // 冲击：每两拍一次、一次比一次重；穹顶凹一拍、spring 弹回。废气从**右边**（厂区那边）压过来
    const hits = [2, 4, 6, 8, 10, 12], dents = [];
    let lastHit = 0, brace = 0;
    for (let i = 0; i < hits.length; i++) {
      const h0 = hits[i], w8 = .12 + i * .07, s = spring(lt, h0, 5.5, 12);
      if (lt >= h0) lastHit = h0;
      if (lt > h0 - .35 && lt < h0 + 1.8) { dents.push({ a: Math.PI * 1.72, k: Math.max(0, w8 + s * .5) }); brace = Math.max(brace, w8); }
    }
    dome(BX, GY + 10, r, 1, dents, C.warm);
    const stopK = ease(seg(lt, 12, 16));
    // R24-15（S7 这一半）：原来 `edge` 最远只推到 2772，而壳面右缘在 BX+r=2488 —— 中间空着 280px，
    // 于是 `hit` 全程 ≈ 0，"烟墙压在穹顶上"这件事**一次也没有真的发生过**，接触磨擦和凹口全被乘成 0。
    // 现在墙真的推到了壳面上（lt 12 咬到 2470），hit 才有值，下面那套 deflect/grind 语言才看得见。
    const edge = kf(lt, [[0, 3240], [2, 2960], [8, 2680], [12, 2470], [16, 2620], [20, 2900], [24, 3320]]);
    const hit = clamp(1 - (edge - (BX + r * .95)) / 240);      // 1 = 烟墙已经压在穹顶上
    boilSeed('adv');
    for (let i = 0; i < 9; i++) {   // 一整堵**黑墙**压过来（R24-15：原来 7 团土黄、washOp 只有 150*sm，读作"远处有霾"）
      const ph = frac(T * .1 + i * .111), rx0 = 380 + 200 * ph, ry0 = 210 + 110 * ph;
      const px = edge + rx0 * .62 + i * 165 + ph * 170, py = 240 + i * 80 + Math.sin(ph * TAU + i) * 40;
      paint(ellPts(px, py - 46 * hit * (9 - i) / 9, rx0, ry0, 18, 12),
        { wash: mixCol('#191612', '#05070C', .25 + .55 * ph), washOp: 240 * sm * (1 - ph * .3) * (1 - stopK), ink: null, curv: .45 });
    }
    if (hit > .35) paint(ellPts(BX + r * .92, GY + 10 - r * .38, 250 * hit, 165 * hit, 16, 8), { wash: '#0A0C10', washOp: 215 * sm * hit * (1 - stopK), ink: null, curv: .4 });
    grind(BX + r * .78, GY + 10 - r * .34, 200, (.3 + .7 * pulse(t, 5)) * hit * (1 - stopK) * sm, lastHit);
    const crowd = [[-380, 20, 'cityman'], [-250, 22, 'citywoman'], [-110, 21, 'cityman'], [180, 22, 'citywoman'], [320, 15, 'citykid']];
    crowd.forEach(([ox, pu, kind], i) => {   // 全部朝受击面倾斜 —— 人墙的隐喻
      clawd(BX + ox, GY + 12 + (i % 2) * 6, pu, { ...job(kind, t, { view: 'front', expr: lt > 14 ? 'determined' : 'holdbreath',
        light: .85, rot: -.1 * brace, sq: .05 + .12 * brace, aL: -.6 - .5 * brace, aR: -.55 - .45 * brace, lookX: .55, bundle: kind === 'citywoman' ? 'sleep' : undefined }) });
      if (i % 2 === 1 && lt > 6 + i * 2) P.sapling(BX + ox + 74, GY + 18, .9 + .1 * i, { k: clamp(seg(lt, 6 + i * 2, 9 + i * 2)), lit: .45 });   // 种树就是加固城墙
    });
    NC(BX + r * .5, GY + 16, U, t, { ...emotions(lt, [[0, 'defiant'], [12, 'determined'], [16, 'hopeful']]),
      view: 'front', aL: 1.45, aR: 1.42, rot: -.09, lookX: .6, light: .95 });
    F.say(t, 89.6, BX + 620, GY - 210, 'Not here.', { dur: 2.4, size: 42, tailX: BX + 560 });
    const pushIn = ease(seg(lt, 1, 4)), quit = seg(lt, 11, 13.5);
    P.excavator(3320 - 300 * pushIn, GY, EXCM, { dir: -1, armA: .5 + .5 * Math.sin(bpOf(t) * Math.PI) * (1 - quit), stick: -1.1, beacon: 1 - quit, pool: 0 });
    const def = ease(seg(lt, 12, 17));
    if (lt > 11) for (let i = 0; i < 2; i++) {   // 工人从机器上爬下来，步行走向光（倒戈不解释）
      const wx = lerp(3060 - i * 76, BX + 250 + i * 66, def);
      clawd(wx, GY + 6 + i * 5, 20 + i, { ...job('cityman', t, { hat: 'hard', armL: null, armR: null, view: def > .02 && def < .98 ? 'side' : 'q', flip: true,
        expr: def > .6 ? 'hopeful' : 'weary', light: .3 + .5 * def, walk: def > .02 && def < .98 ? F.gait(t) : null, lookX: -1 }) });
    }
    if (lt > 13 && lt < 15.5) { boilSeed('puff'); for (let i = 0; i < 4; i++) { const ph = frac((lt - 13) / 2.5 + i / 4);   // 烟囱的火苗"噗"地熄了
      paint(ellPts(FX - HERO * FACM * .28 - ph * 70, FY - HERO * FACM - ph * 130, 30 + ph * 70, 26 + ph * 56, 10), { wash: mixCol('#8A8278', '#2A2820', ph), washOp: 140 * (1 - ph), ink: null }); } }
    camEnd();
    wipeIn(lt, ['#46423A', '#3A3630']);
    wipeOut(lt, dur, ['#3A3630', '#46506A']);
  }

  // =====================================================================
  // S8 · 98.25–110.25 · 光走向全城（B8）：行军向左，逆着灾难来的方向
  // =====================================================================
  function sChain(t, lt, dur) {
    const sm = smother(t), nt = 0, r = domeK(t);
    const z = kf(lt, [[0, .68], [6, .6], [12, .52], [18, .8], [24, .95]]);
    const cx = kf(lt, [[0, 1760], [6, 1360], [12, 960], [18, 760], [24, 700]]);
    const cy = kf(lt, [[0, 520], [6, 540], [12, 560], [18, 500], [24, 400]]);
    camBegin(cx, cy, z);
    skyDay(sm, nt);
    skyline(sm, nt, 0);
    viaduct(sm, nt);
    groundAll(sm, nt, .34);
    river(t, sm, nt, blackK(t), litFish(t), 0, null);
    railing(sm, nt); lowWall(1240, 1720, sm, nt);
    if (lt < 3) P.hoarding(1420, GY, 1.7, {}); else boardStack(sm, nt, ease(seg(lt, 3, 5)));   // 围挡撤除：拆下来的板子堆在原地
    factory(t, sm, nt, 1, 0);
    if (lt > 8) { const sk = ease(seg(lt, 8, 11));   // 最后一缕烟散尽，烟囱被脚手架围起：拆除开始（翻篇，不表现对抗）
      paint(rectPts(2480, FY - 40, 900, 40, 6), { wash: tone(DAY.grass, sm, nt), washOp: 200 * sk, ink: null });
      P.scaffolding(2560, FY, 6, {}); P.crane(3260, FY, 8.4, { ang: -.2 + .12 * Math.sin(bpOf(t) * Math.PI), hoist: .42 }); }
    bigTree(BX, GY, TREEM, 1, .6, sm, nt);
    dome(BX, GY + 10, r, .9, [], C.warm);
    F.grade(.03 + sm * .1, '#2A2620');
    const march = ease(seg(lt, 1, 13)) * 640;
    for (let i = 0; i < 8; i++)   // 队列后段：市民捧苗、工人扛锹、孩子抱水桶（剪影）
      citSil(BX - 260 - i * 168 - march, GY + 8 + (i % 3) * 8, [20, 19, 15][i % 3], ['cityman', 'citywoman', 'citykid'][i % 3], sm, nt, { lit: .3, rot: .02 });
    const line = [[0, 'citywoman', 22], [3, 'cityman', 21], [6, 'citykid', 15]];
    line.forEach(([ph, kind, pu], i) => {   // 前排三个真角色，每人捧着一棵苗
      const x = BX - 340 - i * 214 - march, walking = lt > 1 && lt < 14;
      clawd(x, GY + 10 + i * 6, pu, { ...job(kind, t, { view: 'side', flip: true, expr: 'happy', light: .85,
        walk: walking ? F.gait(t) : null, aL: 1.05, aR: .95, armL: null, armR: null }) });
      P.sapling(x - 46, GY + 16 + i * 6, .9, { k: .8, lit: .45 });
    });
    for (let k = 0; k < 6; k++) {   // 每两拍一棵苗落土：土坑、培土、苗心的光当夜灯
      const px = BX - 460 - k * 210, pk = seg(lt, 2 + k * 2, 2.6 + k * 2);
      if (pk > 0) { boilSeed('hole'); paint(ellPts(px, GY + 20, 26, 8, 12), { fill: tone('#6E5A42', sm, nt), fillOp: 150, bleed: .16, ink: null });
        P.sapling(px, GY + 18, .95, { k: ease(pk), lit: .5 * pk }); }
      if (pk > 0 && pk < 1) ring2(px, GY + 6, 10, 62, pk, C.warm);
    }
    for (const lx of [-620, 180, 820, 1460]) {   // 路灯一盏盏重新亮起（暖色 —— 城市的光在换血）
      const t0 = 3 + (lx + 620) / 420;
      if (on(lx, 220)) P.streetLamp(lx, GY, 2.6, { lit: clamp(seg(lt, t0, t0 + 2)), cold: false });
    }
    if (vw().z > .5) for (let i = 0; i < 4; i++) {   // 居民推开窗、举起自家的花盆探出来（城里的人不是等救的，他们是兵）
      const wx = -180 + i * 470, wy = FY - 620 - i * 90, kk = seg(lt, 4 + i * 2, 5.4 + i * 2);
      if (kk <= 0 || !on(wx, 90)) continue;
      paint(rectPts(wx - 34, wy - 30, 68, 60, 4), { wash: mixCol(C.warm, C.warmLt, .3), washOp: 230 * kk, ink: tone('#5A4A38', sm, nt), sw: 1 });
      paint(rectPts(wx - 30, wy + 26, 60, 12, 3), { wash: tone('#8E7A5E', sm, nt), ink: tone('#5A4A38', sm, nt), sw: .8 });
      paint(ellPts(wx + 8, wy + 22, 16, 12, 10), { wash: tone('#6E9E58', sm, nt), ink: null });
      paint(ellPts(wx - 4, wy - 6, 12, 14, 10), { wash: tone('#4A4436', sm, nt), washOp: 220 * kk, ink: null });
    }
    const ncX = BX - 400 - march - 130;
    const plant = seg(lt, 10.5, 11.75);
    NC(ncX, GY + 18, U, t, { ...emotions(lt, [[0, 'determined'], [10.4, 'hopeful', { lookY: .4 }], [16, 'happy']]),
      view: 'side', flip: true, walk: lt < 14 ? F.gait(t) : null, sq: .1 * plant,
      aL: 1.05, aR: .9, lookY: plant > 0 ? .35 : -.1, light: .95 });
    F.say(t, 104.5, ncX + 200, GY - 200, 'Then we plant.', { dur: 2.6, size: 40, tailX: ncX + 130 });
    if (lt > 22) { const a = seg(lt, 22, 23.5);   // 第一颗星在工厂正上方 —— 那颗星是给工厂的
      halo(3000, FY - 1560, 90 * a, '#EAF2FA', .8 * a);
      paint(ellPts(3000, FY - 1560, 4 + 4 * a, 4 + 4 * a, 6), { wash: '#FFFFFF', washOp: 220 * a, ink: null }); }
    camEnd();
    wipeIn(lt, ['#3A3630', '#46506A']);
    wipeOut(lt, dur, ['#46506A', '#5A6478']);
  }

  // =====================================================================
  // S9 · 110.25–133 · 拆厂 · 日夜更替 · 走马灯（B9）
  // 夜相是全片唯一允许人工光出现的地方，而且必须是黄光。回忆 = 第一部的真实原帧半透明重放。
  // =====================================================================
  function sCycles(t, lt, dur) {
    const cyc = frac(lt / 3);                       // 一个日夜 3 秒（6 拍）：够快看出"过了很多年"，又不至于频闪
    const amp = 1 - ease(seg(lt, 17, 21.5));        // 越到后面白天越长、夜里越短，最后停在晨光里
    const night = clamp((.5 + .5 * Math.cos(cyc * TAU)) * amp * 1.4);
    const heal = seg(lt, 0, 20);
    const sm = smother(t), litK = night;
    const z = kf(lt, [[0, .46], [6, .5], [12, .62], [18, .8], [22.75, .95]]);
    const cx = kf(lt, [[0, 2100], [6, 1900], [12, 1700], [18, 1600], [22.75, 1650]]);
    const cy = kf(lt, [[0, 430], [6, 470], [12, 520], [18, 540], [22.75, 560]]);
    camBegin(cx + 8 * Math.sin(lt * .25), cy, z);
    skyDay(sm, night);
    lighthouse(t, sm, night, litK);
    skyline(sm, night, litK);
    viaduct(sm, night);
    groundAll(sm, night, .3 + .5 * heal);
    river(t, sm, night, blackK(t), litFish(t), litK, null);
    railing(sm, night);
    // 拆厂：围挡撤除、厂房放平、渣土上铺草皮（时间在画面里流动）
    const dem = seg(lt, 2, 7);
    if (dem < 1) {
      push(); translate(FX, FY); scale(1, 1 - .5 * ease(dem)); rotate(-.2 * ease(dem)); translate(-FX, -FY); factory(t, sm, night, 1, 0); pop();
      if (dem > .15 && dem < .95) { boilSeed('fall'); for (let i = 0; i < 4; i++) { const q = clamp((dem - .15 - i * .08) / .5);
        paint(ellPts(FX - 500 + i * 300, FY - 60 - q * 40, 120 * (1 - q * .6), 30, 12, 6), { wash: tone('#8A8272', sm, night), washOp: 130 * (1 - q) * q, ink: null }); } }
    } else {
      boilSeed('rubble');
      for (let i = 0; i < 6; i++) { const rx = FX - 620 + i * 250; if (!on(rx, 160)) continue;
        paint(rrPts(rx - 110, FY - 46, 220, 46, 12, 3), { wash: tone('#9A9286', sm, night), fill: tone('#6E6A62', sm, night), fillOp: 45, bleed: .12, tex: .6, ink: tone('#4E4A44', sm, night), sw: 1 }); }
    }
    P.scaffolding(2560, FY, 6, {});
    const craneA = .5 + .45 * Math.sin(bpOf(t) * Math.PI);
    P.crane(3260, FY, 8.4, { ang: -.34 + .5 * craneA, hoist: .3 + .12 * craneA });
    boardStack(sm, night, 1);   // 围挡早就拆了，板子还堆在这儿
    bigTree(BX, GY, TREEM, 1, .55, sm, night);
    dome(BX, GY + 10, domeK(t), .5, [], C.warm);
    F.grade(.03 + sm * .1 + night * .34, night > .3 ? '#141830' : '#2A2620');
    // 每个日夜循环，苗长高一截（时间流动）；黑水退去是"涨潮式"的：清水从上游一浪一浪推着黑水走
    const step = 1 + .1 * Math.floor(lt / 3);
    for (let i = 0; i < 7; i++) {
      const gx = BX - 900 + i * 260;
      if (i % 2) P.sapling(gx, GY + 18, Math.min(2.6, (.9 + .12 * i) * step), { k: 1, lit: night * .7 });
      else fir(gx, GY + 16, Math.min(3.4, 1.2 * step), { seed: i });
    }
    // 走马灯：每个夜相半透明重放第一部的真实画面（第 2、3 个夜相）
    const mem1 = seg(lt, 4.5, 6) * (1 - seg(lt, 10, 11.6));
    const mem2 = seg(lt, 13.5, 15) * (1 - seg(lt, 18.6, 20.2));
    // 主角抬头；胸前叶子挂牌与画面里的芽尖同频发光
    const ncX = BX - 620;
    NC(ncX, GY + 18, U, t, { ...emotions(lt, [[0, 'hopeful'], [5, 'love', { lookY: -.7 }], [14, 'heartache', { lookY: -.7 }], [20, 'hopeful']]),
      view: 'q', aL: -.35, aR: -.3, lookY: mem1 + mem2 > .3 ? -.75 : -.2, light: .95 });
    if (mem1 + mem2 > .4) halo(ncX - 2, GY + 18 - 2.1 * U, 34, WARM, .8 * clamp(mem1 + mem2));
    // 市民在楼下聚拢鼓掌（拍子跟音乐走）。
    // 第二十二轮：原来 `i*190` 配 u=21~22 → 身体宽 210~220px，**间距小于一个身宽**，
    // 四个人在 t=127 全分辨率下糊成"一头多身"。这和第一部 A3 一家三口、第二部 S4 病号、
    // A2 盗贼是同一个根：一排等高、等距、同尺寸。间距抬到 262（>1.2 个身宽），
    // 进深按 16px 分档错开，才数得清是四个人。
    if (lt > 16) for (let i = 0; i < 4; i++)
      clawd(BX - 330 + i * 262, GY + 6 + (i % 3) * 16, [21, 22, 15, 20][i], { ...job(['cityman', 'citywoman', 'citykid', 'cityman'][i], t,
        { view: 'front', expr: 'happy', light: .9, bundle: i === 1 ? 'sleep' : undefined }) });
    if (lt > 19) P.fireflies(BX - 200, GY - 420, 8, 320, 26, { k: ease(seg(lt, 19, 22)) });
    camEnd();
    wipeIn(lt, ['#46506A', '#5A6478']);
    if (mem1 > .02) memory(0, mem1);
    if (mem2 > .02) memory(1, mem2);
    if (lt > dur - 1.6) F.dip(0, '#000');   // 不黑屏：最后一个循环的日出**不再落回黑夜**，停在晨光里接 S10
  }

  // =====================================================================
  // S10 · 133–153.75 · 森林回来了（B10）：晨光 + 真正的树（PROP.fir / sapling + 尺度表）
  // =====================================================================
  function sForest(t, lt, dur) {
    const sm = smother(t), night = 0;
    const grow = ease(seg(lt, 0, 11));
    const z = kf(lt, [[0, .42], [8, .55], [14, 1.05], [20.75, .38]]);
    const cx = kf(lt, [[0, 2000], [8, 1900], [14, BX - 60], [20.75, 1750]]);
    const cy = kf(lt, [[0, 430], [8, 470], [14, 620], [20.75, 400]]);
    camBegin(cx, cy, z);
    skyDay(sm, night);
    lighthouse(t, sm, night, 0);
    skyline(sm, night, 0);
    viaduct(sm, night);
    groundAll(sm, night, .95);
    river(t, sm, night, blackK(t), litFish(t), 0, null);
    railing(sm, night);
    // 厂子已经不在了：渣土上铺满草皮，只剩一圈地基的痕迹（不跨场残留）
    boilSeed('gone');
    for (let i = 0; i < 5; i++) { const rx = FX - 560 + i * 280; if (!on(rx, 180)) continue;
      paint(ellPts(rx, FY - 12, 150, 26, 16, 4), { wash: tone(mixCol(DAY.grass, DAY.grassDk, .5), sm, night), washOp: 150, ink: null }); }
    // 林子（M1）：夏季语汇 —— 阔叶与上挑针叶混种、一律不挂雪，远排走一条轮廓的剪影版；
    // 全部按尺度表（成年 2~5 英雄高，最大那棵 4.8，仍矮于身后 7.4~13.2 的楼）。
    // 行道树的 x 与 S8 的落土点一一对应 —— 种下的苗长回来了，不是凭空冒出来的
    summerBand(-420, GY + 26, 22, 3.2, { rows: 3, span: 4700, rise: 22, tone: mixCol(FIR, '#5E7A8A', .22) });
    const plantX = [1740, 1530, 1320, 1110, 900, 690];
    for (let i = 0; i < 6; i++) summerTree(plantX[i], GY + 8 + (i % 2) * 8, (1.6 + 2.2 * grow) * (.85 + .3 * hash(i)), { seed: i, wind: .12 });
    summerTree(BX - 320, GY + 14, 4.8 * (.62 + .38 * grow), { seed: 21, wind: .08, leafy: 1 });
    summerTree(BX + 520, GY + 10, 4.2 * (.62 + .38 * grow), { seed: 22, wind: .1, leafy: 0 });
    bigTree(BX, GY, TREEM, 1, .8, sm, night);
    F.grade(.02, '#2A2E38');
    // 晨光 + 萤火虫归位 + 鱼灯如当年
    P.fireflies(BX, GY - HERO * TREEM * .9, 12, 420, 26, { k: ease(seg(lt, 2, 6)) });
    if (lt > 3 && lt < 4) EV.fishJump(lt - 3, 500, WTOP + 140, 34, { dir: 1 });
    // R26-4：这句是从 S1 搬来的。搬到这里才有意义 —— blackK 在 t=128 已经归零、
    // litFish 的六列鱼灯在 t=112~127 一盏盏重新亮起，鱼是真的**回来了**；
    // 而且它落在第一次鱼跃（lt 3~4）刚结束那一拍，台词跟在证据后面。
    // ⚠ F.say 的第 2 个参数是**全片绝对秒**，不是场内 lt（这个坑本轮又踩过一次，见问题文档）。
    F.say(t, 137.15, BX - 520, GY - U * 11.2, 'Fish are back.', { dur: 2.2, size: 40, tailX: BX - 640 });
    if (lt > 8 && lt < 9) EV.fishJump(lt - 8, 1420, WTOP + 120, 34, { dir: -1 });
    // 树根处那个被磨光的浅坑（几十年来有人常坐）—— 不解释
    if (vw().z > .7) { boilSeed('pit');
      paint(ellPts(BX + 60, GY + 20, 62, 15, 16, 2), { wash: tone('#9A8A6E', sm, night), fill: tone('#7A6A50', sm, night), fillOp: 50, bleed: .16, tex: .6, ink: tone('#5A4A32', sm, night), sw: 1 });
      paint(ellPts(BX + 60, GY + 16, 44, 9, 14), { wash: tone('#B6A886', sm, night), washOp: 150, ink: null }); }
    // 市民散步、孩子追逐（活跃段，绝不发呆）
    const st = [[-760, 'citywoman', 22], [420, 'cityman', 21]];
    st.forEach(([ox, kind, pu], i) => {
      const x = BX + ox + Math.sin(t * .4 + i * 2) * 40;
      clawd(x, GY + 12 + i * 8, pu, { ...job(kind, t, { view: 'q', expr: 'happy', light: .9, flip: i === 0, bundle: i === 0 ? 'sleep' : undefined }) });
    });
    const run = frac(lt / 4);
    for (let i = 0; i < 2; i++) {
      const kx = BX - 300 + Math.sin((run + i * .5) * TAU) * 420;
      clawd(kx, GY + 20 + Math.cos((run + i * .5) * TAU) * 12, 15, { ...job('citykid', t, { view: 'side', expr: 'excited', light: .9,
        flip: Math.cos((run + i * .5) * TAU) < 0, walk: F.gait(t, 'run'), rot: .06 * Math.sin((run + i * .5) * TAU) }) });
    }
    // 主角走向巨树，靠着坐下 —— 和当年旧 Clawd 同一个姿势
    const w = F.walkTo(lt, 12, 15.5, BX - 700, BX + 96, U);
    const settle = ease(seg(lt, 15.5, 17));
    const nx = lt < 15.5 ? w.x : BX + 96;
    NC(nx, GY + 22, U, t, { ...emotions(lt, [[0, 'happy'], [12, 'happy'], [16, 'sleepy']]),
      view: lt < 15.5 ? w.view : 'q', flip: true, walk: lt < 15.5 ? w.walk : null, dy: lt < 15.5 ? w.dy : 0,
      sq: .42 * settle, rot: .1 * settle, aL: -.5 - .7 * settle, aR: -.45 - .7 * settle,
      eyes: settle > .9 ? 'closed' : undefined, mouth: settle > .9 ? null : undefined, light: .9 });
    if (settle > .5) P.litFace(nx, GY + 22 - 3 * U, 5 * U, 4 * U, WARM, .35 * settle);
    if (lt > 19 && lt < 20.75) { const c2 = seg(lt, 19, 20.2); if (c2 > 0) { boilSeed('badge'); halo(BX + 96, GY + 22 - 2.1 * U, 40 * c2, WARM, .9 * c2); } }   // 挂牌特写一拍
    // 落叶（不是雪）：夏天的林子有东西在飘
    for (let i = 0; i < 12; i++) { boilSeed('lf' + i);
      const y = frac(hash(i + 90) * 7 + t * .03) * (H + 200) - 100, x = frac(hash(i) * 5 + t * .012 + Math.sin(t * .3 + i) * .02) * (W + OX) - OX * .5;
      paint(ellPts(x, y, 5 + 3 * hash(i + 4), 3 + 2 * hash(i + 6), 8, 0, hash(i + 2) * TAU + t), { wash: tone(['#9CB86E', '#C6A85E', '#7FA860'][i % 3], sm, night), washOp: 175, ink: null }); }
    camEnd();
    if (lt > dur - 2.2) F.irisOut(...toScreen(BX, GY - HERO * TREEM * .46), ease(seg(lt, dur - 2.2, dur - .15)));
    // 剧本写"无结尾字幕"，但用户点名要 The End —— 以用户为准，让它从收拢的那点暖黄里浮出来。
    F.theEnd(ease(seg(lt, dur - 1.4, dur - .6)) * (1 - ease(seg(lt, dur - .2, dur))));
  }

  shots(B.slice(0, -1).map((b, i) => [b, [sCity, sGrove, sPollute, sCough, sUnder, sDome, sFight, sChain, sCycles, sForest][i]]));
})();
