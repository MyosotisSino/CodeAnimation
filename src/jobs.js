// jobs.js: Clawd job variants. Eleven professions painted from the PUBLIC clawd() hooks only (draw / armL / armR), so
// src/clawd.js stays untouched.
//
//   clawd(x, y, u, job('thief', t))                                  front view: its own face, kit and attitude
//   clawd(x, y, u, job('santa', t, { view: 'q' }))                   any of the five key views
//   clawd(x, y, u, job('girl', t, { expr: 'cry' }))                  an EMO or EXPR face instead of the resting one
//   clawd(x, y, u, { ...job('villager', t), ...move('walk', t) })    walking, with the kit on
//   clawd(x, y, u, job('kid', t, { light: 0 }))                      胸口的光 out; light: 1 is a furnace
//
// Where the clothes can go. The box is head AND body: the eyes own y -7u..-5u and the mouth y -4.9u..-3.9u, so a
// costume only has three clean regions — a collar band along the TOP edge (-8.2u..-6.5u, dipping at the middle where
// there is no eye), a garment band along the BOTTOM (-4.0u..-2.0u), and whatever hangs below the box in front of the
// legs (-2.0u..-0.2u). Anything else lands on a face. head() and feat() put you in the same two spaces clawd's own
// hat() and eyes() use, so a piece lands right in every view; reEyes() and reMouth() repaint a feature over whatever
// just covered it (a mask over the eyes, a beard over the mouth). Both call their own feat(), so never nest them.
//
// The three crooked ones lean, squint and never look at you straight. The honest ones stand square.
//
// Cast sheet:  node render.mjs --loop=jobs --sheet=1 --cols=1 --w=1920 --out=docs/jobs.jpg
// One card per job (faces, turns and the beats SCRIPT_DRAFT.md asks it to hit):
//              node render.mjs --loop=job_thief --sheet=1 --cols=1 --w=1920 --out=docs/card_thief.jpg
//              (job_thief, job_huckster, job_lumberjack, job_santa, job_girl, job_villager, job_kid,
//               job_cityman, job_citywoman, job_citykid, job_baby)
(() => {
  // ---------- cloth, leather, wood and steel: PAL's watercolour range, extended ----------
  // 亮度预算见 props.js 的 PROP.TONE / docs/props_tone.jpg（§48）：衣服、毛皮、金属、草帽都**不发光**，
  // 所以一律压在 edge(.68) 以下。雪白雪在片子里最容易越界——它是"暖"，不是"光"。
  const CP = {
    night: '#33304E', mask: '#2A2740', shade: '#221E33',
    leather: '#5A4632', hide: '#43331F', wood: '#6B5138', woodLt: '#8A6A45',
    steel: '#9AA3AE', steelLt: '#A6AFB9', steelDk: '#69737F',
    gold: '#AF8E2C', ochre: PAL.ochre, red: '#C8324A', redDk: '#8E2233', wine: '#7A2A3C',
    plum: '#5B3F7A', silk: PAL.violet, linen: '#B8AC94', snow: '#BCAD93', snowDk: '#9E9078',
    hair: '#4A3324', straw: '#8C7A55', strawDk: '#5C4E36', sap: PAL.sap, teal: PAL.teal, rose: '#E2476E',
    // 第十七轮 3/6：草帽原来是 #B98D2F —— 夜里看是一顶亮黄帽子，用户判为"太鲜明、不像穷人"。
    // 全部往**暗淡土褐**压。rag 是小女孩那身洗到发白的粗布。
    rag: '#7E6A5E', ragDk: '#4E4038', ragLt: '#96806F',
    slate: '#4A5468', slateDk: '#333B4C', suit: '#3F4A63', hairSlate: '#3A3F4E', denim: '#54708F',
    auburn: '#7A3A2A', mustard: '#C89A36', emerald: '#2F7A63', lilac: '#B49AD0',
  };

  // ---------- shared bits ----------
  const P = (u, pts) => pts.map(([a, b]) => [a * u, b * u]);
  // the top half of an ellipse, left edge to right edge; paint() closes it into a dome (as clawd's own 'hard' hat does)
  const arc = (cx, cy, rx, ry, n = 16) => { const p = []; for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; };
  // a lobed blob (beard, fur trim, pompom). topK < 1 flattens the crown so the shape sits under a feature.
  const blob = (cx, cy, rx, ry, lobes, bump, n = 34, topK = 1, ph = 0) => {
    const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, s = Math.sin(a), k = 1 + bump * Math.sin((a + ph) * lobes); p.push([cx + Math.cos(a) * rx * k, cy + s * ry * (s < 0 ? topK : 1) * k]); } return p;
  };
  const head = (V, u, fn) => { push(); translate(V.hat * u, 0); scale(V.hw, 1); fn(); pop(); };
  const feat = (V, u, fn) => { if (!V.face) return; push(); translate(V.face.cx * u, 0); scale(V.face.fw, 1); fn(V.face); pop(); };
  const reEyes = (V, u, sw, p) => { if (!V.face) return; boilSeed((p.boilKey || 'j') + ' eyes2'); feat(V, u, F => eyes(u, p, sw, F.sides, 0)); };
  const reMouth = (V, u, sw, p) => { if (!V.face || !p.mouth) return; boilSeed((p.boilKey || 'j') + ' mouth2'); feat(V, u, F => { push(); translate(F.mx * u, 0); mouth(u, p.mouth, sw); pop(); }); };
  // a strap of cloth or leather: one tapered closed shape, so nothing looks glued on
  const strap = (u, pts, w0, w1, col, sw, o = {}) => paint(ribbon(P(u, pts), w0 * u, (w1 ?? w0) * u), { wash: col, ink: PAL.ink, sw: sw * .55, ...o });
  // a garment band across the bottom of the box, inset from the silhouette so it fits every view
  const band = (V, u, y0, y1, in0 = .1) => rectPts((V.L + in0) * u, y0 * u, (V.R - V.L - 2 * in0) * u, (y1 - y0) * u, u * .06);
  // a hem that hangs past the box in front of the legs, with a scalloped bottom edge
  const hem = (V, u, top, bot, flare, lobes = 3) => {
    const p = [[V.L - flare * .3, top], [V.R + flare * .3, top], [V.R + flare, bot - .35]];
    for (let i = 0; i <= 12; i++) { const x = lerp(V.R + flare, V.L - flare, i / 12); p.push([x, bot + Math.sin(i / 12 * lobes * Math.PI) * .42]); }
    p.push([V.L - flare, bot - .35]);
    return p.map(([a, b]) => [a * u, b * u]);
  };

  // furniture that only exists on the FRONT of a garment — a bib, an apron panel, a buttoned placket. A back view of
  // the same coat should show plain cloth, so these are skipped when the model sheet turns around.
  const det = (V, fn) => { if (!V.back) fn(); };

  // ---------- held props: drawn at the arm TIP, +x runs outward along the arm ----------
  function dagger(u, sw) {
    boilSeed('prop dagger');
    paint(P(u, [[.05, .3], [.95, .16], [.95, -.22], [.05, -.36]]), { wash: CP.hide, ink: PAL.ink, sw: sw * .5, curv: .3 });
    paint(P(u, [[-.2, .5], [.16, .55], [.22, -.5], [-.14, -.45]]), { wash: CP.gold, ink: PAL.ink, sw: sw * .5, curv: .25 });
    paint(P(u, [[.24, -.18], [2.35, -.02], [2.55, .1], [.24, .22]]), { wash: CP.steel, ink: PAL.ink, sw: sw * .55, curv: .2 });
    inkLine(P(u, [[.55, .02], [2.2, .06]]), sw * .3, CP.steelDk, 'inkfine', 0);
  }
  function lootSack(u, sw) {
    boilSeed('prop sack');
    paint(blob(1.2 * u, 1.05 * u, 1.2 * u, 1.15 * u, 5, .1, 22), { wash: CP.leather, fill: CP.hide, fillOp: 70, bleed: .1, tex: .6, border: .5, ink: PAL.ink, sw: sw * .6 });
    paint(P(u, [[.6, .15], [1.8, .15], [1.55, -.3], [.85, -.3]]), { wash: CP.leather, ink: PAL.ink, sw: sw * .6, curv: .3 });
    for (const [cx, cy] of [[1.7, 1.85], [2.25, 1.4]]) paint(ellPts(cx * u, cy * u, .3 * u, .3 * u, 10), { wash: CP.gold, ink: PAL.ink, sw: sw * .4 });
  }
  // a balance he is not using honestly: the coin pan hangs low, the goods pan rides high
  const panPts = (cx, cy, r) => { const p = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * .4]); } return p; };
  // a balance he is not using honestly: the pan with his coins hangs heavy, the goods ride up
  function scaleProp(u, sw) {
    boilSeed('prop scale');
    inkLine(P(u, [[0, .4], [0, -1.7]]), sw * 1.2, CP.gold, 'ink', 0);
    paint(ellPts(0, -1.86 * u, .26 * u, .26 * u, 10), { wash: CP.gold, ink: PAL.ink, sw: sw * .45 });
    inkLine(P(u, [[-1.35, -1.5], [1.35, -2.2]]), sw * 1.0, CP.wood, 'ink', 0);
    for (const [px, py, k] of [[-1.3, -1.52, 1], [1.3, -2.16, .42]]) {
      inkLine(P(u, [[px, py], [px - .46, py + .82 * k]]), sw * .32, CP.wood, 'inkfine', 0);
      inkLine(P(u, [[px, py], [px + .46, py + .82 * k]]), sw * .32, CP.wood, 'inkfine', 0);
      paint(P(u, panPts(px, py + .88 * k, .8 * (.55 + .45 * k))), { wash: CP.steelDk, ink: PAL.ink, sw: sw * .55 });
    }
    for (let i = 0; i < 3; i++) paint(ellPts((-1.52 + i * .22) * u, -.5 * u, .26 * u, .26 * u, 10), { wash: CP.gold, ink: PAL.ink, sw: sw * .4 });
  }
  function ledger(u, sw) {
    boilSeed('prop book');
    paint(P(u, [[.2, -.5], [1.7, -.75], [1.85, .6], [.35, .85]]), { wash: CP.wine, ink: PAL.ink, sw: sw * .6, curv: .2 });
    paint(P(u, [[.42, -.34], [1.6, -.55], [1.72, .44], [.55, .64]]), { wash: CP.linen, ink: PAL.ink, sw: sw * .45, curv: .2 });
    for (let i = 0; i < 3; i++) inkLine(P(u, [[.62, -.18 + i * .26], [1.52, -.34 + i * .26]]), sw * .3, CP.steelDk, 'inkfine', 0);
  }
  // §44：斧头太不明显。斧冠放大到原来的 ~1.7 倍（柄尾→斧冠外缘 ≈ 5.3u ≈ 0.66 个角色身高，
  // 从手臂尖再伸出去就压过一整个角色），刃口两笔打亮，锻造面留一道锻纹。樵夫的"邪恶"有一半靠这把斧子。
  // 场景里如果要更夸张，用 props.js 的 PROP.axe（全长 0.83 角色，带挥砍弧与崩屑）。
  function axeProp(u, sw) {
    boilSeed('prop axe');
    paint(ribbon(P(u, [[-.4, .3], [1.4, -.05], [2.9, -.36]]), .5 * u, .36 * u), { wash: CP.wood, ink: PAL.ink, sw: sw * .6 });
    for (let i = 0; i < 3; i++) inkLine(P(u, [[.55 + i * .48, -.12 + i * .05], [.8 + i * .48, .3 + i * .05]]), sw * .3, CP.snow, 'inkfine', 0);   // 缠绳
    paint(P(u, [[1.95, .72], [2.95, .42], [3.9, -.6], [4.3, -2.15], [3.4, -3.15], [2.2, -2.7], [1.8, -1.2]]),
      { wash: CP.steelDk, fill: CP.mask, fillOp: 55, bleed: .1, tex: .5, border: .45, ink: PAL.ink, sw: sw * .85, curv: .3 });
    inkLine(P(u, [[3.86, -.75], [4.26, -2.12], [3.36, -3.1], [2.3, -2.72]]), sw * 1.5, CP.snow, 'ink', .35);          // 亮刃口（斧身暗、刃才亮）
    inkLine(P(u, [[2.15, -2.2], [2.75, -1.2], [2.2, -.1]]), sw * .5, CP.steelDk, 'inkfine', .25);                     // 锻纹
    paint(P(u, [[1.6, -.15], [2.4, -.36], [2.5, .86], [1.7, .96]]), { wash: CP.steelDk, ink: PAL.ink, sw: sw * .55, curv: .3 });
  }
  function hoeProp(u, sw) {
    boilSeed('prop hoe');
    paint(ribbon(P(u, [[0, .15], [1.6, -.15], [3.2, -.55]]), .34 * u, .28 * u), { wash: CP.wood, ink: PAL.ink, sw: sw * .55 });
    paint(P(u, [[2.95, -1.05], [3.85, -.9], [3.9, -.1], [3.15, -.3]]), { wash: CP.steel, ink: PAL.ink, sw: sw * .6, curv: .3 });
  }
  function basketProp(u, sw) {
    boilSeed('prop basket');
    for (const [gx, gy, gr] of [[1.1, -1.2, .4], [1.65, -1.05, .36], [1.38, -1.42, .28]]) paint(ellPts(gx * u, gy * u, gr * u, gr * 1.3 * u, 10), { wash: CP.sap, ink: PAL.ink, sw: sw * .4 });
    paint(ellPts(1.9 * u, -1.1 * u, .32 * u, .32 * u, 10), { wash: CP.red, ink: PAL.ink, sw: sw * .4 });
    paint(P(u, [[.55, -.75], [2.2, -.75], [1.95, .8], [.8, .8]]), { wash: CP.straw, fill: CP.strawDk, fillOp: 70, bleed: .1, tex: .6, border: .4, ink: PAL.ink, sw: sw * .6, curv: .2 });
    for (let i = 0; i < 3; i++) inkLine(P(u, [[.68 + i * .05, -.45 + i * .38], [2.08 - i * .05, -.45 + i * .38]]), sw * .3, CP.strawDk, 'inkfine', 0);
  }
  function giftProp(u, sw) {
    boilSeed('prop gift');
    paint(rectPts(.35 * u, -.75 * u, 1.5 * u, 1.4 * u, u * .06), { wash: CP.red, fill: CP.wine, fillOp: 60, bleed: .1, tex: .5, border: .4, ink: PAL.ink, sw: sw * .6 });
    paint(rectPts(1.0 * u, -.75 * u, .26 * u, 1.4 * u), { wash: CP.snow, ink: null });
    paint(rectPts(.35 * u, -.16 * u, 1.5 * u, .26 * u), { wash: CP.snow, ink: null });
    for (const s of [-1, 1]) paint(ellPts((1.13 + s * .32) * u, -.88 * u, .3 * u, .22 * u, 10, 0, s * .5), { wash: CP.snow, ink: PAL.ink, sw: sw * .4 });
  }
  function daisyProp(u, sw) {
    boilSeed('prop daisy');
    inkLine(P(u, [[.1, .35], [.85, -.5], [1.1, -1.15]]), sw * .5, CP.sap, 'ink', .4);
    inkLine(P(u, [[.65, -.05], [.2, .15]]), sw * .45, CP.sap, 'ink', .4);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3; paint(ellPts((1.1 + Math.cos(a) * .4) * u, (-1.15 + Math.sin(a) * .4) * u, .25 * u, .25 * u, 9), { wash: CP.snow, ink: PAL.ink, sw: sw * .35 }); }
    paint(ellPts(1.1 * u, -1.15 * u, .21 * u, .21 * u, 9), { wash: CP.ochre, ink: PAL.ink, sw: sw * .35 });
  }
  function chickProp(u, sw) {
    boilSeed('prop chick');
    for (const dx of [.9, 1.15]) inkLine(P(u, [[dx, .35], [dx, .6]]), sw * .4, CP.ochre, 'inkfine', 0);
    paint(ellPts(1.0 * u, -.05 * u, .62 * u, .5 * u, 14), { wash: '#F7DC7E', ink: PAL.ink, sw: sw * .5 });
    paint(ellPts(1.45 * u, -.6 * u, .4 * u, .38 * u, 12), { wash: '#F7DC7E', ink: PAL.ink, sw: sw * .5 });
    paint(P(u, [[1.78, -.66], [2.12, -.56], [1.78, -.44]]), { wash: CP.ochre, ink: PAL.ink, sw: sw * .35, curv: .2 });
    paint(ellPts(1.52 * u, -.68 * u, .09 * u, .11 * u, 7), { wash: PAL.ink, ink: null });
    inkLine(P(u, [[.5, -.2], [.95, .12]]), sw * .4, '#E0BC55', 'inkfine', .4);
  }

  // ---------- light ----------
  // A painted halo: four soft washes rather than glow(), so nothing forces a brush flush mid-costume. On paper these
  // barely register (as light on a bright ground would), so anything that carries them also paints its own rays.
  // 衰减与 props.js 的 halo 同步收紧（§46）：能量集中在靠芯的两圈，外圈半径 .78r、透明度砍半——
  // "一大片淡黄"读作换背景，"一小团亮"才读作光。
  // 与 props.js 的 hotOf/halo 同规则（§52）：冷色光的**最热芯**必须留在自己的色相里，
  // 一律往奶油白提亮会把紫/蓝/绿胸口灯洗成米灰色，观众就分不清"哪种光是坏的"。
  function hotOf(col) {
    const v = parseInt(String(col).replace('#', ''), 16);
    const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    return (r >= g && r >= b) ? mixCol(col, '#FFF6DC', .55) : mixCol(col, '#FFFFFF', .45);
  }
  function halo(x, y, r, col, a = 1) {
    if (a <= .02 || r < 2) return;
    const hot = hotOf(col), c = mixCol(col, hot, .35);
    paint(ellPts(x, y, r * .86, r * .8, 34, r * .03), { wash: c, washOp: 7 * a, bleed: .48, tex: .95, ink: null });
    paint(ellPts(x, y, r * .54, r * .5, 26, r * .025), { wash: mixCol(c, hot, .45), washOp: 15 * a, bleed: .4, tex: .85, ink: null });
    paint(ellPts(x, y, r * .28, r * .26, 18, r * .015), { wash: mixCol(c, hot, .7), washOp: 40 * a, bleed: .26, tex: .5, ink: null });
    paint(ellPts(x, y, r * .12, r * .11, 12), { wash: mixCol(hot, '#FFFFFF', .45), washOp: 94 * a, bleed: .16, ink: null });
  }
  // short strokes around a flame: this is how a cold light says "I am lit" on a bright page
  function rays(x, y, r, col, n = 7, w = 1) {
    for (let i = 0; i < n; i++) { const a = i / n * TAU + .4, r0 = r * (1 + .18 * Math.sin(T * 6 + i)); inkLine([[x + Math.cos(a) * r0, y + Math.sin(a) * r0 * .9], [x + Math.cos(a) * r0 * 1.42, y + Math.sin(a) * r0 * 1.42 * .9]], w, col, 'inkfine', 0); }
  }
  // 胸口的光 — the film's moral language: every Clawd carries a lamp in its chest. Warm yellow = kindness;
  // violet / blue / green = light with no warmth. lvl 0 is an out ember, 1 is a small furnace. It sits on the garment
  // band and is painted last, so it shines THROUGH whatever the job is wearing.
  function chestLight(u, lvl, col = '#FFD96A') {
    const l = clamp(lvl), cy = -3.0 * u, fl = 1 + .09 * Math.sin(T * 8);
    if (l <= .02) {
      paint(ellPts(0, cy, .3 * u, .36 * u, 12), { wash: '#6E6577', fill: PAL.indigo, fillOp: 60, bleed: .1, ink: PAL.ink, sw: u / 26 });
      return;
    }
    halo(0, cy, u * (.95 + 2.0 * l) * fl, col, .55 + .45 * l);
    rays(0, cy, u * (.8 + .45 * l) * fl, mixCol(col, PAL.ochre, .55), 8, u / 22);
    paint(ellPts(0, cy, u * (.3 + .3 * l) * fl, u * (.36 + .38 * l) * fl, 14), { wash: mixCol(col, '#FFF2C0', .45), ink: PAL.ink, sw: u / 24 });
    paint(ellPts(-.09 * u, (cy / u - .11) * u, .1 * u, .13 * u, 8), { wash: '#FFFFFF', ink: null });
  }

  // ---------- more props ----------
  // a torch or a lamp that lights without warming: col is the colour of the cold light
  function torchProp(col) {
    return (u, sw) => {
      boilSeed('prop torch' + col);
      inkLine(P(u, [[.1, .1], [1.5, -.55]]), sw * 1.5, CP.wood, 'ink', 0);
      const fx = 1.75, fy = -1.05, fl = 1 + .15 * Math.sin(T * 13) + .06 * Math.sin(T * 29);
      halo(fx * u, fy * u, u * 3.6 * fl, col, .95);
      rays(fx * u, (fy - .7) * u, u * 1.5 * fl, col, 7, sw * .5);
      paint(P(u, [[fx - .8, fy + .3], [fx - .3, fy - .7 * fl], [fx + .02, fy - 2.2 * fl], [fx + .42, fy - .5 * fl], [fx + .8, fy + .3]]),
        { wash: mixCol(col, '#FFF6DC', .25), ink: null, curv: .5 });
      paint(P(u, [[fx - .3, fy + .22], [fx, fy - .9 * fl], [fx + .34, fy + .22]]), { wash: mixCol(col, '#FFFFFF', .55), ink: null, curv: .5 });
    };
  }
  function lampProp(col) {
    return (u, sw) => {
      boilSeed('prop lamp' + col);
      inkLine([[0, 0], [0, .7 * u]], sw * 1.2, CP.hide, 'ink', 0);
      const fl = 1 + .12 * Math.sin(T * 11);
      halo(0, 1.5 * u, u * 2.9 * fl, col, .95);
      rays(0, 1.5 * u, u * 1.15 * fl, col, 7, sw * .45);
      paint(rrPts(-.6 * u, .7 * u, 1.2 * u, 1.5 * u, .3 * u), { wash: mixCol(col, '#101830', .5), ink: PAL.ink, sw: sw * .6 });
      paint(ellPts(0, 1.5 * u, .36 * u * fl, .48 * u * fl, 9), { wash: mixCol(col, '#FFF6DC', .3), ink: null });
      inkLine([[-.6 * u, .7 * u], [.6 * u, .7 * u]], sw * .7, CP.hide, 'ink', 0);
    };
  }
  function candleProp(k = 1) {
    return (u, sw) => {
      boilSeed('prop candle');
      for (const [cx, h] of [[.75, 1.5], [1.25, 2.1], [1.75, 1.25]]) {
        paint(rectPts(cx * u, -h * u, .34 * u, (h + .5) * u, u * .04), { wash: CP.linen, fill: CP.snowDk, fillOp: 55, bleed: .1, tex: .6, ink: PAL.ink, sw: sw * .45 });
        const fl = 1 + .18 * Math.sin(T * 12 + cx * 4);
        halo((cx + .17) * u, (-h - .5) * u, u * .95 * k * fl, '#FFD96A', .9);
        rays((cx + .17) * u, (-h - .6) * u, u * .45 * k * fl, CP.ochre, 5, sw * .28);
        paint(P(u, [[cx + .17, -h - .95 * fl], [cx + .34, -h - .35], [cx, -h - .35]]), { wash: '#FFDD7A', ink: null, curv: .5 });
      }
    };
  }
  function coinProp(u, sw) {
    boilSeed('prop coins');
    for (let i = 0; i < 3; i++) paint(ellPts((.95 + i * .12) * u, (.25 - i * .34) * u, .42 * u, .42 * u, 12), { wash: CP.gold, fill: CP.ochre, fillOp: 60, ink: PAL.ink, sw: sw * .45 });
    inkLine(P(u, [[.9, -.55], [1.35, -.55]]), sw * .35, CP.wine, 'inkfine', 0);
  }
  function netBagProp(u, sw) {
    boilSeed('prop netbag');
    inkLine(P(u, [[.1, .1], [.85, -.95]]), sw * .5, CP.hide, 'ink', .3);
    paint(ellPts(1.05 * u, -.1 * u, .78 * u, .82 * u, 16, 0, .2), { wash: CP.linen, fill: CP.snowDk, fillOp: 45, bleed: .14, tex: .7, ink: PAL.ink, sw: sw * .55 });
    for (let i = 0; i < 3; i++) inkLine(P(u, [[.45 + i * .4, -.75 + i * .12], [.6 + i * .35, .72 - i * .1]]), sw * .28, CP.woodLt, 'inkfine', 0);
    paint(ellPts(1.0 * u, -.85 * u, .3 * u, .3 * u, 10), { wash: CP.red, ink: PAL.ink, sw: sw * .4 });
    paint(ellPts(1.42 * u, -.7 * u, .24 * u, .3 * u, 10, 0, .4), { wash: CP.sap, ink: PAL.ink, sw: sw * .35 });
  }
  function caseProp(u, sw) {
    boilSeed('prop case');
    inkLine(P(u, [[.75, -.62], [1.25, -.62]]), sw * .8, CP.hide, 'ink', .5);
    paint(rrPts(.25 * u, -.55 * u, 1.85 * u, 1.35 * u, .22 * u, u * .04), { wash: CP.hide, fill: '#2E2118', fillOp: 60, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .6 });
    inkLine(P(u, [[.3, .05], [2.05, .05]]), sw * .4, CP.woodLt, 'inkfine', 0);
    paint(rectPts(1.05 * u, -.12 * u, .35 * u, .34 * u, u * .03), { wash: CP.gold, ink: PAL.ink, sw: sw * .35 });
  }
  function balloonProp(col) {
    return (u, sw) => {
      boilSeed('prop balloon' + col);
      const bx = 1.9 * u, by = -4.1 * u + Math.sin(T * 1.6) * .35 * u, rx = 1.55 * u, ry = 1.8 * u;
      inkLine([[.15 * u, .15 * u], [bx + .12 * u, by + ry * .95]], sw * .35, CP.hide, 'inkfine', .4);
      paint(ellPts(bx, by, rx, ry, 22, u * .04), { wash: col, fill: mixCol(col, PAL.ink, .3), fillOp: 55, bleed: .14, tex: .6, border: .5, ink: PAL.ink, sw: sw * .6 });
      paint(P(u, [[bx / u - .48, by / u - .1], [bx / u - .16, by / u - .95], [bx / u + .04, by / u - .12]]), { wash: mixCol(col, '#FFFFFF', .55), ink: null, curv: .4 });
      paint(P(u, [[bx / u - .2, (by + ry * .96) / u], [bx / u + .2, (by + ry * .96) / u], [bx / u, (by + ry * 1.3) / u]]), { wash: col, ink: PAL.ink, sw: sw * .4 });
    };
  }
  function saplingProp(u, sw) {
    boilSeed('prop sapling');
    paint(P(u, [[.55, .95], [1.55, .95], [1.35, .15], [.75, .15]]), { wash: CP.wood, fill: CP.hide, fillOp: 60, bleed: .1, tex: .7, ink: PAL.ink, sw: sw * .55, curv: .2 });
    inkLine(P(u, [[1.05, .2], [1.05, -1.6]]), sw * .8, CP.woodLt, 'ink', 0);
    inkLine(P(u, [[1.05, -.7], [.5, -1.15]]), sw * .6, CP.woodLt, 'ink', 0);
    inkLine(P(u, [[1.05, -1.05], [1.6, -1.5]]), sw * .6, CP.woodLt, 'ink', 0);
    for (const [lx, ly, a] of [[.42, -1.2, -.6], [1.68, -1.55, .5], [1.05, -1.95, -.1]]) paint(ellPts(lx * u, ly * u, .42 * u, .24 * u, 12, 0, a), { wash: CP.sap, fill: mixCol(CP.sap, PAL.ink, .25), fillOp: 55, bleed: .12, ink: PAL.ink, sw: sw * .4 });
  }
  function purseProp(u, sw) {
    boilSeed('prop purse');
    inkLine(P(u, [[.6, -.5], [.85, -1.1], [1.5, -.55]]), sw * .5, CP.hide, 'ink', .4);
    paint(rrPts(.4 * u, -.55 * u, 1.5 * u, 1.15 * u, .35 * u, u * .04), { wash: CP.wine, fill: '#4A1A24', fillOp: 60, bleed: .12, tex: .6, border: .5, ink: PAL.ink, sw: sw * .55 });
    inkLine(P(u, [[.45, -.1], [1.85, -.1]]), sw * .4, CP.gold, 'inkfine', 0);
    paint(ellPts(1.15 * u, -.1 * u, .16 * u, .16 * u, 8), { wash: CP.gold, ink: PAL.ink, sw: sw * .3 });
  }
  function rattleProp(u, sw) {
    boilSeed('prop rattle');
    paint(ribbon(P(u, [[.2, .5], [.8, -.1], [1.1, -.5]]), .3 * u, .24 * u), { wash: CP.linen, ink: PAL.ink, sw: sw * .45 });
    paint(ellPts(1.35 * u, -.75 * u, .55 * u, .55 * u, 14), { wash: CP.teal, fill: PAL.sky, fillOp: 55, bleed: .12, tex: .6, ink: PAL.ink, sw: sw * .5 });
    paint(ellPts(1.2 * u, -.9 * u, .14 * u, .14 * u, 8), { wash: CP.snow, ink: null });
  }
  // a swaddled bundle held in the arm: a blanket cone, a bonnet, and a face the size of a crumb
  function cradleBundle(u, sw, cx, cy, s, mood = 'sleep') {
    boilSeed('prop bundle');
    paint(P(u, [[cx - 2.1 * s, cy + .1 * s], [cx - .3 * s, cy - 1.15 * s], [cx + 1.1 * s, cy - .85 * s], [cx + 1.25 * s, cy + .55 * s], [cx - 1.5 * s, cy + .95 * s]]),
      { wash: CP.linen, fill: CP.snowDk, fillOp: 55, bleed: .14, tex: .7, border: .5, ink: PAL.ink, sw: sw * .6, curv: .3 });
    for (let i = 0; i < 3; i++) inkLine(P(u, [[cx - 1.5 * s + i * .95 * s, cy + .9 * s], [cx - 1 * s + i * .95 * s, cy - .8 * s]]), sw * .3, CP.woodLt, 'inkfine', 0);
    const hx = cx + 1.15 * s, hy = cy - .95 * s, hr = .95 * s;
    paint(ellPts(hx * u, hy * u, hr * u, hr * .95 * u, 18), { wash: PAL.clay, ink: PAL.ink, sw: sw * .65 });
    paint(arc(hx * u, (hy - .18) * u, hr * 1.02 * u, hr * .95 * u, 12), { wash: CP.rose, fill: PAL.rose, fillOp: 55, bleed: .12, tex: .6, ink: PAL.ink, sw: sw * .55 });
    paint(ellPts(hx * u, (hy - hr * 1.05) * u, .2 * s * u, .2 * s * u, 8), { wash: CP.snow, ink: PAL.ink, sw: sw * .35 });
    for (const dx of [-.34, .34]) {
      if (mood === 'sleep') inkLine(P(u, [[hx + dx * s - .14 * s, hy + .18 * s], [hx + dx * s + .14 * s, hy + .24 * s]]), sw * .5, PAL.ink, 'inkfine', 0);
      else paint(ellPts((hx + dx * s) * u, (hy + .18 * s) * u, .13 * s * u, .17 * s * u, 8), { wash: PAL.ink, ink: null });
    }
    if (mood === 'cry') paint(ellPts(hx * u, (hy + .58 * s) * u, .2 * s * u, .24 * s * u, 9), { wash: '#4A1F2A', ink: null });
    else if (mood !== 'sleep') inkLine(P(u, [[hx - .18 * s, hy + .55 * s], [hx, hy + .68 * s], [hx + .18 * s, hy + .55 * s]]), sw * .45, PAL.ink, 'inkfine', .4);
  }

  // a straw hat, shared by the villager and the kid: k scales it, brim is where the bottom edge of the brim lands
  function hatStraw(u, sw, V, k = 1, brim = -7.0) {
    head(V, u, () => {
      const rx = 6.2 * k * u, ry = 1.15 * k * u, cy = brim * u - ry;
      paint(arc(0, cy - ry * .25, 4.0 * k * u, 2.6 * k * u), { wash: CP.straw, fill: CP.strawDk, fillOp: 55, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .8 });
      paint(ellPts(0, cy, rx, ry, 26, u * .05), { wash: CP.straw, fill: CP.strawDk, fillOp: 40, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .7 });
      inkLine([[-4.0 * k * u, cy - ry * .3], [4.0 * k * u, cy - ry * .3]], sw * .55, CP.hide, 'inkfine', 0);
      for (let i = 0; i < 5; i++) { const a = -Math.PI * (.14 + i * .18); inkLine([[Math.cos(a) * rx * .84, cy + Math.sin(a) * ry * .84], [Math.cos(a) * rx * 1.08, cy + Math.sin(a) * ry * 1.4]], sw * .32, CP.strawDk, 'inkfine', 0); }
    });
  }

  // ---------- the cast ----------
  // Each job: what it wears (costume), what it carries (armL / armR), how it holds itself (pose) and the face it never
  // stops making (face). emo names the EMO it breathes on, so it keeps living between frames.
  const JOBS = {

    // ---- 盗贼 THIEF: a night cap, a band over the eyes, a blade he keeps too sharp ----
    thief: {
      label: 'THIEF', emo: 'suspicious', col: mixCol(PAL.clay, PAL.indigo, .14),
      face: { eyes: 'narrow', mouth: 'smirk', tint: 'blue', tintK: .3, lookX: .5 },
      pose: t => { const b = _b(t); return { rot: -.05 + .02 * b.s1, dx: .3 * b.s1, dy: -.15 * b.ab, sq: .05, aL: -.4 - .1 * b.s1, aR: .6 + .12 * b.s1, lookX: .35 + .3 * Math.sin(t * 1.7) }; },
      costume(u, sw, V, p) {
        head(V, u, () => {   // a slouchy night-blue dome with a tail flopping out behind
          paint(arc(0, -7.9 * u, 4.85 * u, 3.1 * u), { wash: CP.night, fill: PAL.indigo, fillOp: 55, bleed: .12, tex: .6, border: .4, ink: PAL.ink, sw: sw * .8 });
          strap(u, [[-4.2, -9.5], [-6.4, -10.2], [-7.2, -8.6]], .95, .5, CP.night, sw, { curv: .5 });
          paint(ellPts(-7.3 * u, -8.5 * u, .55 * u, .55 * u, 12), { wash: CP.night, ink: PAL.ink, sw: sw * .55 });
          paint(rectPts(-5.15 * u, -8.55 * u, 10.3 * u, 1.15 * u, u * .05), { wash: CP.shade, fill: PAL.night, fillOp: 60, bleed: .1, tex: .5, border: .4, ink: PAL.ink, sw: sw * .7 });
        });
        feat(V, u, F => {   // the band: a dark mask with cream eye holes, then the eyes again on top of it
          paint(P(u, [[-5.35, -7.35], [-2.6, -7.8], [0, -7.2], [2.6, -7.8], [5.35, -7.35], [4.5, -5.15], [1.7, -5.4], [0, -6.2], [-1.7, -5.4], [-4.5, -5.15]]),
            { wash: CP.mask, fill: PAL.night, fillOp: 70, bleed: .1, tex: .5, border: .4, ink: PAL.ink, sw: sw * .7, curv: .25 });
          for (const s of F.sides) paint(ellPts(s * 2.5 * u, -6.05 * u, 1.05 * u, 1.3 * u, 14), { wash: CP.snow, ink: null });
        });
        reEyes(V, u, sw, p);
        // a cloak collar along the top edge, a low belt, and his take in coins
        paint(P(u, [[V.L, -8.15], [V.R, -8.15], [V.R, -7.25], [0, -6.5], [V.L, -7.25]]), { wash: CP.night, fill: PAL.night, fillOp: 55, bleed: .12, tex: .6, border: .5, ink: PAL.ink, sw: sw * .65, curv: .2 });
        strap(u, [[V.L + .8, -4.15], [0, -3.5], [V.R - .8, -2.6]], .8, .7, CP.leather, sw, { curv: .4 });
        paint(band(V, u, -3.35, -2.35, .05), { wash: CP.hide, ink: PAL.ink, sw: sw * .6 });
        paint(rectPts(-.8 * u, -3.6 * u, 1.6 * u, 1.5 * u, u * .06), { wash: CP.gold, fill: CP.ochre, fillOp: 60, ink: PAL.ink, sw: sw * .5 });
        paint(rectPts(-.36 * u, -3.2 * u, .72 * u, .7 * u, 0), { wash: CP.hide, ink: null });
        paint(P(u, [[V.R - 2.5, -3.1], [V.R - .6, -3.1], [V.R - .4, -1.85], [V.R - 2.7, -1.85]]), { wash: CP.leather, fill: CP.hide, fillOp: 60, bleed: .1, tex: .6, border: .4, ink: PAL.ink, sw: sw * .55, curv: .25 });
        inkLine(P(u, [[V.R - 2.55, -2.6], [V.R - .55, -2.6]]), sw * .4, CP.hide, 'inkfine', 0);
      },
      armL: lootSack, armR: dagger,
    },

    // ---- 奸商 HUCKSTER: a fur cap with his jewel in it, a waxed moustache, a scale that never balances ----
    huckster: {
      label: 'HUCKSTER', emo: 'smug',
      face: { eyes: 'narrow', mouth: 'smirk', tint: 'gold', tintK: .4, lookX: -.4 },
      pose: t => { const b = _b(t); return { sq: .1 + .02 * b.hit, dy: -.2 * b.ab, rot: .03 * b.s1, aL: .95 + .12 * b.s1, aR: -.2 - .1 * b.s1, lookX: -.35 - .25 * Math.sin(t * 1.1) }; },
      costume(u, sw, V, p) {
        head(V, u, () => {   // a fur-lined cap, too small for the head it sits on
          paint(arc(0, -8.1 * u, 3.9 * u, 2.9 * u), { wash: CP.plum, fill: PAL.violet, fillOp: 65, bleed: .14, tex: .7, border: .5, ink: PAL.ink, sw: sw * .8 });
          paint(blob(0, -8.15 * u, 4.7 * u, 1.1 * u, 7, .16, 30, .5), { wash: CP.snow, fill: CP.snowDk, fillOp: 55, bleed: .16, tex: .7, border: .5, ink: PAL.ink, sw: sw * .65 });
          paint(ellPts(0, -10.0 * u, .62 * u, .62 * u, 12), { wash: CP.red, fill: PAL.rose, fillOp: 80, ink: PAL.ink, sw: sw * .5 });
          paint(ellPts(-.2 * u, -10.15 * u, .2 * u, .15 * u, 8, 0, -.4), { wash: CP.snow, ink: null });
        });
        // silk robe: a collar at the top, a belly of gold at the bottom, jade at the waist
        paint(P(u, [[V.L, -8.15], [V.R, -8.15], [V.R, -7.3], [0, -6.55], [V.L, -7.3]]), { wash: CP.silk, fill: CP.plum, fillOp: 60, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .65, curv: .2 });
        paint(band(V, u, -3.95, -2.0, .02), { wash: CP.silk, fill: CP.plum, fillOp: 70, bleed: .14, tex: .8, border: .5, ink: PAL.ink, sw: sw * .65 });
        det(V, () => {
          paint(blob(0, -2.5 * u, 3.4 * u, 1.5 * u, 6, .05, 26, .45), { wash: CP.gold, fill: CP.ochre, fillOp: 70, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .6 });
          for (const k of [-.45, .45]) paint(ellPts(k * 3.2 * u, -2.6 * u, .3 * u, .3 * u, 9), { wash: CP.red, ink: PAL.ink, sw: sw * .35 });
        });
        paint(band(V, u, -3.5, -2.75, .0), { wash: CP.wine, fill: CP.redDk, fillOp: 60, bleed: .1, tex: .6, border: .4, ink: PAL.ink, sw: sw * .6 });
        paint(ellPts((V.R - 1.7) * u, -2.4 * u, .5 * u, .45 * u, 12), { wash: CP.teal, fill: PAL.sap, fillOp: 70, ink: PAL.ink, sw: sw * .45 });
        inkLine(P(u, [[V.R - 1.7, -2.9], [V.R - 1.7, -2.6]]), sw * .4, CP.gold, 'inkfine', 0);
        // the facial hair goes over the robe, and the smirk over the moustache
        for (const s of [-1, 1]) feat(V, u, () => strap(u, [[s * .35, -4.75], [s * 1.5, -5.0], [s * 2.7, -5.6]], .55, .16, CP.hair, sw, { curv: .5 }));
        reMouth(V, u, sw, p);
        feat(V, u, () => paint(P(u, [[-1.0, -2.9], [1.0, -2.9], [.6, -1.5], [0, -.55], [-.6, -1.5]]),
          { wash: CP.hair, fill: '#33231A', fillOp: 60, bleed: .1, tex: .7, border: .5, ink: PAL.ink, sw: sw * .5, curv: .35 }));
      },
      armL: ledger, armR: scaleProp,
    },

    // ---- 樵夫 LUMBERJACK: he has cut more than trees, and one eye remembers it ----
    lumberjack: {
      label: 'LUMBERJACK', emo: 'angry', col: mixCol(PAL.clay, PAL.clayDk, .35),
      face: { eyes: 'angry', mouth: 'teeth', tint: 'green', tintK: .28 },
      pose: t => { const b = _b(t); return { rot: -.04, sq: .04 + .05 * b.hit, dy: -.35 * b.ab, aL: -.25 - .1 * b.s1, aR: 1.1 + .28 * Math.sin(b.bp * Math.PI), lookX: -.2 }; },
      emote: 'steam',
      costume(u, sw, V, p) {
        head(V, u, () => {   // a hide cap, stitched, with a quill jammed in the brim
          paint(arc(0, -8.0 * u, 5.0 * u, 2.8 * u), { wash: CP.leather, fill: CP.hide, fillOp: 60, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .8 });
          for (let i = 0; i < 4; i++) inkLine(P(u, [[-2.7 + i * 1.8, -9.6], [-2.2 + i * 1.8, -8.8]]), sw * .4, CP.hide, 'inkfine', 0);
          paint(rectPts(-5.15 * u, -8.6 * u, 10.3 * u, .95 * u, u * .05), { wash: CP.hide, ink: PAL.ink, sw: sw * .65 });
          inkLine(P(u, [[-4.3, -8.15], [-2.9, -8.15]]), sw * .45, CP.woodLt, 'inkfine', 0);   // a bone pin through the brim
        });
        reEyes(V, u, sw, p);
        feat(V, u, F => {   // brows like beams, and the scar over his left eye
          for (const s of F.sides) inkLine(P(u, [[s * 3.8, -7.55], [s * 1.3, -6.95]]), sw * 1.7, CP.hair, 'ink', 0);
          inkLine(P(u, [[-3.4, -7.35], [-1.5, -5.0]]), sw * .55, mixCol(PAL.rose, PAL.clayDk, .35), 'ink', 0);
          for (const k of [.28, .52, .76]) { const x = lerp(-3.4, -1.5, k), y = lerp(-7.35, -5.0, k); inkLine(P(u, [[x - .3, y + .24], [x + .3, y - .24]]), sw * .35, PAL.ink, 'inkfine', 0); }
        });
        // a fur pauldron on the off shoulder, a rope belt, torn trousers
        paint(blob((V.L - .5) * u, -7.5 * u, 1.9 * u, 1.3 * u, 8, .11, 26, 1, .8), { wash: CP.woodLt, fill: CP.hide, fillOp: 55, bleed: .14, tex: .8, border: .5, ink: PAL.ink, sw: sw * .6 });
        paint(band(V, u, -3.9, -2.6, .02), { wash: mixCol(CP.wood, PAL.ink, .3), fill: CP.hide, fillOp: 60, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .6 });
        inkLine(P(u, [[V.L + .4, -3.2], [V.R - .4, -3.45]]), sw * .7, CP.wood, 'ink', 0);
        paint(ellPts((V.L + 1.4) * u, -3.35 * u, .4 * u, .36 * u, 10), { wash: CP.wood, ink: PAL.ink, sw: sw * .4 });
        for (const [px, py] of [[-2.9, -3.1], [1.5, -2.9]]) {
          paint(rectPts(px * u, py * u, 1.5 * u, .95 * u, u * .05), { wash: CP.woodLt, ink: PAL.ink, sw: sw * .4 });
          for (let i = 0; i < 3; i++) inkLine(P(u, [[px + .2 + i * .45, py + .12], [px + .45 + i * .45, py + .3]]), sw * .28, CP.hide, 'inkfine', 0);
        }
        feat(V, u, F => {   // a scraggly beard, hung below the mouth so he can still show his teeth
          paint(blob(0, -2.2 * u, 4.0 * u, 1.6 * u, 7, .2, 30, .2, 1.2), { wash: CP.hair, fill: '#33231A', fillOp: 60, bleed: .12, tex: .8, border: .5, ink: PAL.ink, sw: sw * .6 });
          for (const s of [-1, 1]) strap(u, [[s * 1.2, -4.5], [s * 2.7, -4.25], [s * 3.8, -3.5]], .6, .3, CP.hair, sw, { curv: .5 });
        });
      },
      armR: axeProp,
      armL: (u, sw) => { boilSeed('prop log'); paint(ellPts(1.15 * u, .15 * u, .95 * u, .78 * u, 14, 0, .1), { wash: CP.woodLt, ink: PAL.ink, sw: sw * .55 }); paint(ellPts(1.15 * u, .15 * u, .5 * u, .4 * u, 12, 0, .1), { wash: CP.wood, ink: PAL.ink, sw: sw * .35 }); },
    },

    // ---- 圣诞老人 SANTA: the whole box is the coat ----
    santa: {
      label: 'SANTA', emo: 'happy', col: CP.red, dk: CP.redDk, lt: '#E4697C',
      face: { eyes: 'happy', mouth: 'smile', blush: .55 },
      pose: t => { const b = _b(t); return { dy: -.9 * b.ab, sq: .07 * b.hit, rot: .02 * b.s1, aL: .5 + .12 * b.s1, aR: .95 - .12 * b.s1 }; },
      emote: 'spark',
      costume(u, sw, V, p) {
        head(V, u, () => {   // a red dome that flops over to one side, pompom on the end, fur band across the brow
          paint(arc(0, -8.1 * u, 4.7 * u, 3.0 * u), { wash: CP.red, fill: CP.redDk, fillOp: 55, bleed: .12, tex: .6, border: .4, ink: PAL.ink, sw: sw * .8 });
          strap(u, [[2.4, -9.8], [5.2, -10.6], [6.5, -9.1]], 1.5, 1.0, CP.red, sw, { curv: .5 });
          paint(ellPts(6.8 * u, -8.9 * u, .85 * u, .85 * u, 14), { wash: CP.snow, fill: CP.snowDk, fillOp: 65, bleed: .18, tex: .6, border: .5, ink: PAL.ink, sw: sw * .55 });
          paint(blob(0, -8.25 * u, 5.05 * u, 1.2 * u, 8, .14, 32, .5), { wash: CP.snow, fill: CP.snowDk, fillOp: 60, bleed: .18, tex: .7, border: .5, ink: PAL.ink, sw: sw * .65 });
        });
        // coat: a fur collar, a black belt with his buckle, a fur hem
        paint(P(u, [[V.L, -8.1], [V.R, -8.1], [V.R, -7.35], [0, -6.7], [V.L, -7.35]]), { wash: CP.snow, fill: CP.snowDk, fillOp: 60, bleed: .16, tex: .7, border: .5, ink: PAL.ink, sw: sw * .6, curv: .2 });
        paint(band(V, u, -3.3, -2.45, .02), { wash: CP.shade, fill: PAL.night, fillOp: 60, bleed: .1, tex: .5, border: .4, ink: PAL.ink, sw: sw * .6 });
        paint(rrPts(-.95 * u, -3.55 * u, 1.9 * u, 1.4 * u, .3 * u, u * .05), { wash: CP.gold, fill: CP.ochre, fillOp: 60, ink: PAL.ink, sw: sw * .5 });
        paint(rrPts(-.5 * u, -3.2 * u, 1.0 * u, .7 * u, .18 * u), { wash: CP.shade, ink: null });
        paint(hem(V, u, -2.5, -1.75, .5, 4), { wash: CP.snow, fill: CP.snowDk, fillOp: 55, bleed: .16, tex: .7, border: .5, ink: PAL.ink, sw: sw * .6, curv: .3 });
        // the beard over all of it, with a moustache lying on top and the smile between
        feat(V, u, F => {
          paint(blob(0, -3.4 * u, 4.15 * u, 1.75 * u, 7, .13, 32, .35, .9), { wash: CP.snow, fill: CP.snowDk, fillOp: 50, bleed: .16, tex: .7, border: .5, ink: PAL.ink, sw: sw * .65 });
          for (const s of [-1, 1]) strap(u, [[s * .3, -4.6], [s * 1.6, -4.35], [s * 2.6, -4.9]], .85, .4, CP.snow, sw, { curv: .5 });
        });
        reMouth(V, u, sw, p);
      },
      armL: lootSack, armR: giftProp,
    },

    // ---- 小女孩 GIRL: two pigtails, one dress, one daisy ----
    girl: {
      label: 'GIRL', emo: 'neutral',
      // 第十七轮 3：原来是"亮粉连衣裙 + 两只蝴蝶结 + 爱心 emote + shine 眼" —— 用户判为
      // "颜色太鲜明、穿着太现代且可爱，没有可怜的特质"。她是一个饿着肚子的战争年代小女孩，
      // 不是卡通萌物。所以：褪色打补丁的粗布裙、歪掉的一只辫子、没有蝴蝶结、
      // 脸上不是发亮的开心而是**小心翼翼的期待**。
      face: { eyes: 'normal', mouth: 'flat', blush: .12 },
      pose: t => { const b = _b(t); return { dy: -.55 * b.ab, sq: .05 * b.hit, rot: .02 * b.s2, aL: .85 + .2 * b.s1, aR: -.1 + .06 * b.s1 }; },
      costume(u, sw, V, p) {
        head(V, u, () => {   // 一顶剪得参差的头发，只有一只辫子，用一条布条扎着
          paint(arc(0, -7.6 * u, 5.15 * u, 3.2 * u), { wash: CP.hair, fill: '#2A1D15', fillOp: 65, bleed: .1, tex: .8, border: .5, ink: PAL.ink, sw: sw * .8 });
          for (let i = 0; i < 6; i++) paint(P(u, [[-4.6 + i * 1.9, -7.65], [-3.5 + i * 1.9, -7.65], [-4.05 + i * 1.9, -7.0 - .18 * (i % 2)]]), { wash: CP.hair, ink: PAL.ink, sw: sw * .4 });
          strap(u, [[-4.4, -7.85], [-6.1, -6.5], [-5.7, -4.4]], 1.4, .9, CP.hair, sw, { curv: .5 });
          paint(ellPts(-5.1 * u, -6.1 * u, .42 * u, .26 * u, 10, 0, -.5), { wash: CP.ragDk, ink: PAL.ink, sw: sw * .4 });   // 布条，不是蝴蝶结
          for (let i = 0; i < 3; i++) inkLine([[-4.9 * u + i * .3 * u, -7.2 * u], [(-5.4 + i * .5) * u, -8.1 * u]], sw * .3, CP.hair, 'inkfine', .3);
        });
        // 裙子：洗到发白的粗布，下摆一长一短，膝上两块补丁，腰上是一条绳
        paint(hem(V, u, -4.0, -1.15, 1.15, 5), { wash: CP.rag, fill: CP.ragDk, fillOp: 55, bleed: .16, tex: .85, border: .6, ink: PAL.ink, sw: sw * .7, curv: .25 });
        paint(band(V, u, -4.0, -3.5, .02), { wash: CP.ragDk, ink: PAL.ink, sw: sw * .55 });
        for (const [px, py, pw, ph] of [[-1.9, -2.9, 1.5, 1.15], [.9, -2.35, 1.25, .95]])
          paint(rectPts(px * u, py * u, pw * u, ph * u, u * .06), { wash: CP.ragLt, fill: CP.ragDk, fillOp: 40, bleed: .1, tex: .9, border: .8, ink: PAL.ink, sw: sw * .35 });
        for (let i = 0; i < 4; i++) inkLine([[(1.05 + i * .3) * u, -2.95 * u], [(1.05 + i * .3) * u, -2.05 * u]], sw * .22, PAL.ink, 'inkfine', 0);
        for (const k of [.24, .46, .68, .88]) paint(ellPts(lerp(V.L + .5, V.R - .5, k) * u, -2.6 * u, .2 * u, .2 * u, 8), { wash: CP.snow, ink: PAL.ink, sw: sw * .28 });
        for (const s of [-1, 1]) inkLine([[s * 1.15 * u, -1.2 * u], [s * 1.35 * u, -.55 * u]], sw * .3, PAL.ink, 'inkfine', .4);   // 磨破的线头
      },
      armR: daisyProp,
    },

    // ---- 村民 VILLAGER: straw hat, rope belt, an apron, nothing to hide ----
    villager: {
      label: 'VILLAGER', emo: 'neutral',
      face: { eyes: 'normal', mouth: 'smile', blush: .3 },
      pose: t => { const b = _b(t); return { dy: -.35 * b.ab, sq: .035 * b.hit, aL: -.3 - .08 * b.s1, aR: 1.0 + .1 * b.s1 }; },
      costume(u, sw, V, p) {
        hatStraw(u, sw, V, 1, -7.0);
        // a green tunic at the bottom of the box, a cream apron over it, rope at the waist
        paint(band(V, u, -3.95, -2.0, .02), { wash: CP.sap, fill: mixCol(CP.sap, PAL.ink, .3), fillOp: 60, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .65 });
        det(V, () => {
          paint(P(u, [[-2.3, -3.95], [2.3, -3.95], [2.75, -1.1], [1.3, -1.45], [0, -1.05], [-1.3, -1.45], [-2.75, -1.1]]), { wash: CP.linen, fill: CP.snowDk, fillOp: 60, bleed: .14, tex: .8, border: .5, ink: PAL.ink, sw: sw * .6, curv: .2 });
          for (let i = 0; i < 3; i++) inkLine(P(u, [[-2.3, -3.3 + i * .8], [2.3, -3.3 + i * .8]]), sw * .28, CP.woodLt, 'inkfine', 0);
        });
        inkLine(P(u, [[V.L + .4, -3.5], [V.R - .4, -3.7]]), sw * .65, CP.wood, 'ink', 0);
        paint(ellPts((V.L + 1.3) * u, -3.6 * u, .38 * u, .34 * u, 10), { wash: CP.wood, ink: PAL.ink, sw: sw * .4 });
        inkLine(P(u, [[V.L + 1.3, -3.6], [V.L + .5, -2.5]]), sw * .4, CP.wood, 'inkfine', .4);
        paint(rectPts((V.R - 3.2) * u, -3.6 * u, 1.6 * u, 1.15 * u, u * .05), { wash: mixCol(CP.sap, PAL.ink, .25), ink: PAL.ink, sw: sw * .45 });
        inkLine(P(u, [[V.R - 3.1, -3.35], [V.R - 1.7, -3.35]]), sw * .3, CP.linen, 'inkfine', 0);
        feat(V, u, F => { for (const s of F.sides) inkLine(P(u, [[s * 3.9, -5.0], [s * 4.6, -4.6]]), sw * .35, PAL.clayDk, 'inkfine', 0); });
      },
      armL: basketProp, armR: hoeProp,
    },

    // ---- 幼年村民 VILLAGE KID: his father's hat, and a duckling he is not giving back ----
    kid: {
      label: 'VILLAGE KID', emo: 'excited', scale: .72,
      face: { eyes: 'shine', mouth: 'cat', blush: .75 },
      pose: t => { const b = _b(t); return { dy: -1.5 * b.ab, sq: .12 * b.hit - .02 * b.ab, rot: .04 * b.s2, aL: .8 + .2 * b.s1, aR: .3 - .18 * b.s1 }; },
      emote: 'spark',
      costume(u, sw, V, p) {
        hatStraw(u, sw, V, 1.34, -6.72);   // far too big: the brim sits down in his eyes
        // an overall one size too big as well
        paint(band(V, u, -3.95, -2.0, .02), { wash: CP.teal, fill: mixCol(CP.teal, PAL.indigo, .3), fillOp: 60, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .65 });
        det(V, () => {
          paint(P(u, [[-2.1, -3.95], [2.1, -3.95], [2.45, -1.5], [1.1, -1.8], [0, -1.45], [-1.1, -1.8], [-2.45, -1.5]]), { wash: mixCol(CP.teal, PAL.ink, .3), ink: PAL.ink, sw: sw * .6, curv: .2 });
          for (const s of [-1, 1]) strap(u, [[s * 1.6, -3.95], [s * 2.9, -4.4], [s * 3.6, -4.8]], .75, .6, mixCol(CP.teal, PAL.ink, .3), sw, { curv: .4 });
          for (const s of [-1, 1]) paint(ellPts(s * 1.75 * u, -4.3 * u, .3 * u, .3 * u, 9), { wash: CP.gold, ink: PAL.ink, sw: sw * .35 });
          paint(rectPts(.5 * u, -3.4 * u, 1.25 * u, .95 * u, u * .05), { wash: CP.linen, ink: PAL.ink, sw: sw * .4 });
          for (let i = 0; i < 3; i++) inkLine(P(u, [[.6 + i * .4, -3.25], [.8 + i * .4, -3.05]]), sw * .3, CP.wood, 'inkfine', 0);
        });
      },
      armL: chickProp,
    },

    // ---- 城市男居民 CITY MAN: wire glasses, a good coat, groceries from the corner shop ----
    cityman: {
      label: 'CITY MAN', emo: 'neutral',
      face: { eyes: 'normal', mouth: 'flat' },
      pose: t => { const b = _b(t); return { dy: -.3 * b.ab, sq: .03 * b.hit, aL: -.25, aR: .15 }; },
      costume(u, sw, V, p) {
        head(V, u, () => {   // hair combed flat and side-parted — the one tidy thing left
          paint(arc(0, -7.75 * u, 5.05 * u, 2.6 * u), { wash: CP.hairSlate, fill: PAL.night, fillOp: 55, bleed: .1, tex: .7, border: .4, ink: PAL.ink, sw: sw * .8 });
          for (const s of [-1, 1]) paint(P(u, [[s * 5.05, -7.85], [s * 5.05, -6.2], [s * 4.25, -6.45], [s * 4.3, -7.85]]), { wash: CP.hairSlate, ink: PAL.ink, sw: sw * .5, curv: .3 });
          inkLine(P(u, [[.9, -7.95], [3.5, -8.7]]), sw * .45, PAL.night, 'inkfine', .3);
        });
        feat(V, u, F => {   // round wire glasses, sitting over whatever the eyes are doing
          for (const s of F.sides) paint(ellPts(s * 2.5 * u, -6 * u, 1.5 * u, 1.5 * u, 20), { ink: PAL.ink, sw: sw * .8 });
          if (F.sides.length > 1) inkLine(P(u, [[-1.05, -6.35], [0, -6.7], [1.05, -6.35]]), sw * .6, PAL.ink, 'ink', .3);
          for (const s of F.sides) {
            inkLine(P(u, [[s * 3.95, -6.3], [s * 5.15, -6.6]]), sw * .55, PAL.ink, 'ink', 0);
            inkLine(P(u, [[s * 2.05, -6.9], [s * 1.7, -6.1]]), sw * .45, CP.snow, 'inkfine', 0);
          }
        });
        // a city coat: a turned collar at the top, a buttoned front at the bottom, a pocket flap
        paint(P(u, [[V.L, -8.15], [V.R, -8.15], [V.R, -7.3], [.7, -6.6], [0, -7.15], [-.7, -6.6], [V.L, -7.3]]), { wash: CP.slate, fill: CP.slateDk, fillOp: 60, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .65, curv: .2 });
        paint(band(V, u, -3.95, -2.0, .02), { wash: CP.suit, fill: CP.slateDk, fillOp: 65, bleed: .12, tex: .8, border: .5, ink: PAL.ink, sw: sw * .65 });
        det(V, () => {
          paint(P(u, [[-.55, -3.95], [.55, -3.95], [.78, -2.0], [-.78, -2.0]]), { wash: CP.linen, ink: PAL.ink, sw: sw * .5 });
          for (const y of [-3.6, -3.1, -2.6]) paint(ellPts(0, y * u, .2 * u, .2 * u, 8), { wash: CP.slateDk, ink: PAL.ink, sw: sw * .3 });
        });
        paint(rectPts((V.L + .5) * u, -3.5 * u, 1.6 * u, .95 * u, u * .05), { wash: CP.slateDk, ink: PAL.ink, sw: sw * .45 });
      },
      armL: netBagProp, armR: caseProp,
    },

    // ---- 城市女居民 CITY WOMAN: a bob, a knitted scarf, a long coat, and the baby in one arm ----
    citywoman: {
      label: 'CITY WOMAN', emo: 'neutral',
      face: { eyes: 'normal', mouth: 'flat', blush: .25 },
      pose: t => { const b = _b(t); return { dy: -.35 * b.ab, sq: .04 * b.hit, aL: -.6, aR: -.1 }; },
      costume(u, sw, V, p) {
        head(V, u, () => {   // a bob: a cap of hair that comes down past the jaw on both sides
          paint(arc(0, -7.6 * u, 5.25 * u, 3.1 * u), { wash: CP.auburn, fill: '#3A1C14', fillOp: 55, bleed: .1, tex: .7, border: .4, ink: PAL.ink, sw: sw * .8 });
          for (const s of [-1, 1]) paint(P(u, [[s * 5.25, -7.95], [s * 5.3, -5.1], [s * 4.2, -4.8], [s * 4.05, -7.95]]), { wash: CP.auburn, fill: '#3A1C14', fillOp: 45, bleed: .1, tex: .7, ink: PAL.ink, sw: sw * .55, curv: .3 });
          inkLine(P(u, [[-1.7, -7.8], [1.9, -8.4]]), sw * .4, '#3A1C14', 'inkfine', .3);
        });
        // a scarf knotted at the throat with one end left hanging down the front. No collar band: at the top edge of the
        // box a full-width band reads as a headband under her hair, not as a scarf round her neck.
        strap(u, [[V.R - 1.5, -7.25], [V.R - 1.0, -5.4], [V.R - 1.8, -3.4]], 1.2, .85, CP.mustard, sw, { curv: .5 });
        paint(ellPts((V.R - 1.55) * u, -7.2 * u, .62 * u, .46 * u, 12, 0, .3), { wash: CP.mustard, fill: CP.ochre, fillOp: 55, bleed: .12, tex: .6, ink: PAL.ink, sw: sw * .5 });
        paint(band(V, u, -3.95, -2.0, .02), { wash: CP.emerald, fill: mixCol(CP.emerald, PAL.ink, .3), fillOp: 65, bleed: .12, tex: .8, border: .5, ink: PAL.ink, sw: sw * .65 });
        det(V, () => {
          paint(P(u, [[-.5, -3.95], [.5, -3.95], [.72, -2.0], [-.72, -2.0]]), { wash: CP.linen, ink: PAL.ink, sw: sw * .5 });
          for (const y of [-3.55, -3.05, -2.55]) paint(ellPts(0, y * u, .19 * u, .19 * u, 8), { wash: CP.ochre, ink: PAL.ink, sw: sw * .3 });
        });
        // the bundle, cradled, with the forearm drawn back over it so she is really holding it — and only from the
        // front: from behind the child is hidden by her own body
        if (V.face) {
          cradleBundle(u, sw, -1.7, -3.05, .95, p.bundle || 'sleep');
          strap(u, [[V.L + .25, -2.45], [-1.6, -1.7], [-.1, -1.55]], 1.1, .8, CP.emerald, sw, { curv: .4 });
        }
      },
      armR: purseProp,
    },

    // ---- 城市小孩 CITY KID: a bucket cap, a hoodie, a red balloon ----
    citykid: {
      label: 'CITY KID', emo: 'excited', scale: .72,
      face: { eyes: 'wide', mouth: 'smile', blush: .45 },
      pose: t => { const b = _b(t); return { dy: -1.3 * b.ab, sq: .1 * b.hit, rot: .03 * b.s2, aL: .5 + .15 * b.s1, aR: .45 }; },
      costume(u, sw, V, p) {
        head(V, u, () => {   // a bucket cap with a button badge, and a tuft of hair sticking out under it
          paint(arc(0, -8.0 * u, 4.6 * u, 2.3 * u), { wash: CP.denim, fill: mixCol(CP.denim, PAL.ink, .3), fillOp: 60, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .8 });
          paint(rectPts(-5.0 * u, -8.4 * u, 10.0 * u, .95 * u, u * .05), { wash: mixCol(CP.denim, PAL.ink, .35), ink: PAL.ink, sw: sw * .6 });
          paint(ellPts(-3.3 * u, -8.85 * u, .55 * u, .55 * u, 12), { wash: CP.teal, fill: PAL.sky, fillOp: 55, ink: PAL.ink, sw: sw * .45 });
          for (let i = 0; i < 4; i++) inkLine(P(u, [[-1.3 + i * .95, -9.15], [-1.0 + i * .95, -10.1]]), sw * .45, CP.hair, 'ink', 0);
        });
        // a hoodie: the hood lying at the nape, two drawstrings, a big front pocket
        paint(P(u, [[V.L, -8.1], [V.R, -8.1], [V.R, -7.15], [0, -6.4], [V.L, -7.15]]), { wash: CP.lilac, fill: PAL.violet, fillOp: 50, bleed: .12, tex: .7, border: .5, ink: PAL.ink, sw: sw * .6, curv: .2 });
        paint(blob(0, -8.4 * u, 4.3 * u, 1.45 * u, 5, .16, 26, .4), { wash: mixCol(CP.lilac, PAL.ink, .22), ink: PAL.ink, sw: sw * .55 });
        paint(band(V, u, -3.95, -2.0, .02), { wash: CP.lilac, fill: PAL.violet, fillOp: 55, bleed: .12, tex: .8, border: .5, ink: PAL.ink, sw: sw * .65 });
        for (const s of [-1, 1]) inkLine(P(u, [[s * .5, -3.9], [s * .85, -3.05]]), sw * .4, CP.snow, 'inkfine', .3);
        for (const s of [-1, 1]) paint(ellPts(s * .9 * u, -2.95 * u, .17 * u, .17 * u, 8), { wash: CP.snow, ink: PAL.ink, sw: sw * .3 });
        paint(rectPts((V.L + .7) * u, -3.35 * u, 2.1 * u, 1.05 * u, u * .18), { wash: mixCol(CP.lilac, PAL.ink, .25), ink: PAL.ink, sw: sw * .45 });
      },
      armR: balloonProp(CP.red),
    },

    // ---- 城市婴儿 BABY: a bonnet, a knitted swaddle, one rattle ----
    baby: {
      label: 'BABY', emo: 'coo', scale: .42,
      face: { eyes: 'wide', mouth: 'cat', blush: .8 },
      pose: t => { const b = _b(t); return { dy: -.5 * b.ab, sq: .06 * b.hit, rot: .05 * b.s1, aL: .85 + .25 * b.s1, aR: .85 - .25 * b.s1 }; },
      costume(u, sw, V, p) {
        head(V, u, () => {   // a bonnet with a frill, a knot on top and two ties under the chin
          paint(arc(0, -7.85 * u, 5.15 * u, 2.6 * u), { wash: CP.rose, fill: PAL.rose, fillOp: 55, bleed: .12, tex: .6, border: .4, ink: PAL.ink, sw: sw * .8 });
          paint(blob(0, -7.9 * u, 5.3 * u, 1.0 * u, 9, .17, 34, .45), { wash: CP.snow, fill: CP.snowDk, fillOp: 55, bleed: .16, tex: .7, border: .5, ink: PAL.ink, sw: sw * .6 });
          paint(ellPts(0, -10.4 * u, .5 * u, .5 * u, 12), { wash: CP.snow, ink: PAL.ink, sw: sw * .5 });
          for (const s of [-1, 1]) strap(u, [[s * 5.0, -7.5], [s * 4.5, -6.3], [s * 3.9, -5.2]], .3, .22, CP.snow, sw, { curv: .5 });
        });
        // one long wrap of knitted blanket, and a knot at the shoulder
        paint(band(V, u, -4.0, -2.0, .02), { wash: CP.linen, fill: CP.snowDk, fillOp: 60, bleed: .14, tex: .7, border: .5, ink: PAL.ink, sw: sw * .65 });
        for (let i = 0; i < 4; i++) inkLine(P(u, [[V.L + .7 + i * 2.25, -3.95], [V.L + 1.8 + i * 2.25, -2.05]]), sw * .3, CP.woodLt, 'inkfine', 0);
        paint(ellPts((V.L + 1.7) * u, -3.55 * u, .55 * u, .45 * u, 12, 0, .4), { wash: CP.rose, ink: PAL.ink, sw: sw * .45 });
      },
      armR: rattleProp,
    },
  };

  // ---------- expressions this story needs that EMO has not got ----------
  // Same shape as an EMO entry (a face plus a way of moving), kept here so docs/emotions.jpg stays the EMO reference.
  // Anything not found here falls through to feel(), so a card can mix freely: 'snarl' next to 'happy'.
  const EXPR = {
    snarl:    { eyes: 'angry', mouth: 'laugh', gloom: .22, tint: 'flush', tintK: .35, pose: t => { const b = _b(t); return { rot: -.07, sq: .07 + .05 * b.hit, dy: -.4 * b.ab, aL: .8 + .2 * b.s1, aR: -.5, lookX: -.35 }; } },
    sneer:    { eyes: 'narrow', mouth: 'smirk', tint: 'pale', tintK: .2, pose: t => { const b = _b(t); return { rot: -.1 + .02 * b.s1, dx: .3 * b.s1, sq: .05, aL: -.6, aR: .35 + .14 * Math.sin(t * TAU * 2), lookX: .55 }; } },
    numb:     { eyes: 'blank', mouth: 'flat', tint: 'pale', tintK: .5, pose: t => ({ dy: -.1 * Math.abs(Math.sin(t * .8)), sq: .03, rot: .02, aL: -.8, aR: -.8 }) },
    joytear:  { eyes: 'teary', mouth: 'smile', blush: .7, tint: 'rosy', tintK: .35, emote: 'spark', pose: t => { const b = _b(t); return { dy: -.8 * b.ab, sq: .05 * b.hit, aL: .9 + .15 * b.s1, aR: .9 - .15 * b.s1, lookY: -.55 }; } },
    cough:    { eyes: 'squeeze', mouth: 'wail', tint: 'pale', tintK: .35, gloom: .22, pose: t => { const ph = frac(t * .85), c = Math.exp(-ph * 4.5) * Math.sin(ph * 40); return { rot: .17 + .07 * c, dx: .35 + .12 * c, sq: .13 + .05 * c, dy: -.12 * Math.abs(c), aL: -.95, aR: -1.05, lookY: .6 }; } },
    weary:    { eyes: 'sleepy', mouth: 'flat', tint: 'blue', tintK: .25, pose: t => { const br = Math.sin(t * TAU * .25); return { sq: .1 + .03 * br, rot: .07, dy: -.06 * br, aL: -.95, aR: -.95, lookY: .5 }; } },
    coo:      { eyes: 'shine', mouth: 'cat', blush: .8, pose: t => { const b = _b(t); return { rot: .05 * b.s1, sq: .05 * b.hit, dy: -.3 * b.ab, aL: .6 + .2 * b.s1, aR: .6 - .2 * b.s1 }; } },
    asleep:   { eyes: 'closed', pose: t => ({ sq: .06 + .035 * Math.sin(t * TAU * .16), rot: .05, aL: -.9, aR: -.9 }) },
    gasp:     { eyes: 'wide', mouth: 'O', emote: '!', tint: 'pale', tintK: .25, pose: t => ({ sq: -.14, dy: -.5, aL: 1.15, aR: .25, lookX: .3, lookY: -.5 }) },
    hush:     { eyes: 'closed', mouth: 'pout', blush: .3, pose: t => { const b = _b(t); return { sq: .04 + .02 * b.ab, rot: -.03, aL: -1.05, aR: -1.05, lookY: .4 }; } },
    reach:    { eyes: 'look', mouth: 'open', pose: t => { const b = _b(t); return { dy: -.4 * b.ab, rot: -.09, dx: .5 * b.s1, aL: 1.35 + .15 * b.s1, aR: 1.3 - .15 * b.s1, lookX: .5, lookY: -.6 }; } },
    // §45b：三段式的第一拍"被光拽过去"。不是站着正面看——头先转过去，身体跟着倾，离光那只手抬起来，
    // 另一只手压回胸口（那粒光正在被外面的假光比下去）。lookX 拉满是这一拍的关键：眼睛已经不在观众这边。
    beckon:   { eyes: 'wide', mouth: 'open', pose: t => { const b = _b(t); return { rot: -.15, dx: .5 * b.s1, dy: -.28 * b.ab, sq: .05, aL: -.78, aR: 1.18 + .2 * b.s1, lookX: .85, lookY: -.28 }; } },
    trudge:   { eyes: 'narrow', mouth: 'flat', tint: 'blue', tintK: .3, pose: t => ({ dy: -.12 * Math.abs(Math.sin(t * 1.3)), sq: .09, rot: .09, aL: -.95, aR: -1.0, lookY: .7 }) },
  };
  function exprOf(name, t) {
    const X = EXPR[name];
    if (!X) return feel(name, t);
    const { pose, take, ...rest } = X;
    return { ...rest, ...(pose ? pose(t) : {}) };
  }

  // ---------- the one entry point ----------
  // Everything a job needs to spread into clawd(): its resting face, its kit, its attitude. Anything you pass in
  // `over` wins, so a shot can put a job in a view, a mood or a walk without touching the costume.
  //   job('girl', t)                            the resting face
  //   job('girl', t, { expr: 'cry' })           one of EMO's or EXPR's faces instead (the kit stays on)
  //   job('villager', t, { light: .2 })         胸口的光, 0 (out) .. 1 (a furnace); lightCol to change its colour
  function job(name, t, over = {}) {
    const J = JOBS[name] || JOBS.villager;
    const view = over.view || 'front', V = VIEWS[view] || VIEWS.front;
    const ex = over.expr;   // an expression takes the face and the body over entirely — the costume is not re-cast
    const p = { ...(J.col ? { col: J.col } : {}), ...(J.dk ? { dk: J.dk } : {}), ...(J.lt ? { lt: J.lt } : {}),
                ...exprOf(ex || J.emo, t),
                ...(ex ? {} : { ...(J.emote ? { emote: J.emote } : {}), ...(J.face || {}), ...(J.pose ? J.pose(t) : {}) }), ...over };
    p.view = view;
    if (!('hat' in p)) p.hat = null;   // the costume brings its own head gear
    // over.draw 追加在服装与胸口光**之后**，调用方才能往胸口再挂东西（挂牌、围巾）而不覆盖制服。
    p.draw = (u, sw) => { J.costume(u, sw, V, p); if (p.light != null) { boilSeed((p.boilKey || 'j') + ' light'); chestLight(u, p.light, p.lightCol); } if (over.draw) over.draw(u, sw); };
    for (const side of ['L', 'R']) {
      const prop = over['arm' + side] !== undefined ? over['arm' + side] : J['arm' + side];
      if (prop) p['arm' + side] = (u, sw) => { boilSeed((p.boilKey || 'j') + ' arm' + side); prop(u, sw, V, p); };
    }
    return p;
  }

  // ---------- one card per job: the faces and the views this story actually asks for, plus spare ----------
  // Chosen against SCRIPT_DRAFT.md — the beats each character has to hit, not a full grid of everything.
  //   exprs  front-view faces (EMO names and EXPR names, freely mixed)
  //   views  the model-sheet turns
  //   acts   the shot it appears in: a pose, a prop, a level of chest light
  // Render one:  node render.mjs --loop=job_thief --sheet=1 --cols=1 --w=1920 --out=docs/card_thief.jpg
  const CARDS = {
    thief: { scenes: 'S2 the purple torch · S5 the face under the ice',
      exprs: ['neutral', 'smug', 'mischief', 'snarl', 'laugh', 'furious', 'suspicious', 'scared'],
      views: ['q', 'side', 'qback', 'back'],
      acts: [
        ['S2 torch aloft', (x, gy, t, u) => clawd(x, gy, u, job('thief', t, { view: 'side', expr: 'snarl', armR: torchProp(PAL.violet), aR: 1.05, boilKey: 'a1' }))],
        ['S2 grab and run', (x, gy, t, u) => clawd(x, gy, u, job('thief', t, { view: 'q', expr: 'laugh', flip: true, armR: torchProp(PAL.violet), ...move('run', t), boilKey: 'a2' }))],
        ['S5 seen through the ice', (x, gy, t, u) => clawd(x, gy, u, job('thief', t, { expr: 'snarl', gloom: .85, tint: PAL.violet, tintK: .5, rot: .13, emote: null, boilKey: 'a3' }))],
      ] },
    huckster: { scenes: 'S3 the blue lantern · S5 the cold sneer',
      exprs: ['neutral', 'smug', 'sneer', 'proud', 'mischief', 'suspicious', 'disgusted', 'furious'],
      views: ['q', 'side', 'qback', 'back'],
      acts: [
        ['S3 weigh out the price', (x, gy, t, u) => clawd(x, gy, u, job('huckster', t, { view: 'q', expr: 'sneer', armR: coinProp, aR: .55, boilKey: 'a1' }))],
        ['S3 cry the price', (x, gy, t, u) => clawd(x, gy, u, job('huckster', t, { expr: 'laugh', aL: 1.5, aR: 1.4, emote: '!', boilKey: 'a2' }))],
        ['S3 the blue lamp on the cart', (x, gy, t, u) => clawd(x, gy, u, job('huckster', t, { view: 'side', expr: 'smug', armR: lampProp(PAL.indigo), aR: 1.3, boilKey: 'a3' }))],
      ] },
    lumberjack: { scenes: 'S4 the green lamps · S5 the dead face',
      exprs: ['neutral', 'determined', 'angry', 'furious', 'numb', 'bored', 'smug', 'ko'],
      views: ['q', 'side', 'qback', 'back'],
      acts: [
        ['S4 swing on the beat', (x, gy, t, u) => clawd(x, gy, u, job('lumberjack', t, { view: 'side', expr: 'angry', boilKey: 'a1' }))],
        ['S4 the green lamp', (x, gy, t, u) => clawd(x, gy, u, job('lumberjack', t, { view: 'q', expr: 'numb', armL: lampProp(PAL.sap), aL: -.5, armR: axeProp, boilKey: 'a2' }))],
        ['S5 the last tree down', (x, gy, t, u) => clawd(x, gy, u, job('lumberjack', t, { expr: 'numb', gloom: .5, tint: PAL.sap, tintK: .35, emote: null, boilKey: 'a3' }))],
      ] },
    santa: { scenes: 'S8 the fire, the sled, the sack',
      exprs: ['happy', 'laugh', 'proud', 'hopeful', 'love', 'relieved', 'idea', 'neutral'],
      views: ['q', 'side', 'qback', 'back'],
      acts: [
        ['S8 wave him over', (x, gy, t, u) => clawd(x, gy, u, job('santa', t, { view: 'q', expr: 'happy', ...move('wave', t), boilKey: 'a1' }))],
        ['S8 put the sack in his arms', (x, gy, t, u) => clawd(x, gy, u, job('santa', t, { view: 'side', expr: 'reach', light: 1, boilKey: 'a2' }))],
        ['S8 point up the valley', (x, gy, t, u) => clawd(x, gy, u, job('santa', t, { expr: 'proud', aL: 1.5, aR: .3, lookX: -.7, lookY: -.5, light: 1, boilKey: 'a3' }))],
      ] },
    girl: { scenes: 'S2 the bread taken · S9 the bread given back',
      exprs: ['happy', 'laugh', 'surprised', 'scared', 'sad', 'cry', 'dizzy', 'joytear'],
      views: ['q', 'side', 'qback', 'back'],
      acts: [
        ['S2 sit in the snow', (x, gy, t, u) => clawd(x, gy, u, job('girl', t, { view: 'q', expr: 'scared', sq: .2, dy: 1.1, rot: .1, aL: 1.2, aR: 1.2, boilKey: 'a1' }))],
        ['S2 the light goes out', (x, gy, t, u) => clawd(x, gy, u, job('girl', t, { expr: 'cry', light: 0, tint: 'blue', tintK: .5, emote: null, boilKey: 'a2' }))],
        ['S9 warm it back up', (x, gy, t, u) => clawd(x, gy, u, job('girl', t, { expr: 'joytear', light: 1, armR: (uu, s) => { boilSeed('bread'); paint(ellPts(1.1 * uu, -.1 * uu, .95 * uu, .72 * uu, 16, 0, .2), { wash: CP.ochre, fill: CP.gold, fillOp: 60, bleed: .12, tex: .6, ink: PAL.ink, sw: s * .55 }); halo(1.1 * uu, -.1 * uu, 2.2 * uu, '#FFD96A', .9); }, aR: .35, boilKey: 'a3' }))],
      ] },
    villager: { scenes: 'S3 counted to the last coin · S10 candle at the window',
      exprs: ['neutral', 'nervous', 'sad', 'cry', 'hopeless', 'relieved', 'hopeful', 'happy'],
      views: ['q', 'side', 'qback', 'back'],
      acts: [
        ['S3 empty the pocket', (x, gy, t, u) => clawd(x, gy, u, job('villager', t, { view: 'q', expr: 'nervous', armL: coinProp, aL: -.95, light: .3, boilKey: 'a1' }))],
        ['S3 the lights go out', (x, gy, t, u) => clawd(x, gy, u, job('villager', t, { expr: 'hopeless', light: 0, tint: 'blue', tintK: .5, gloom: .5, emote: null, boilKey: 'a2' }))],
        ['S10 one candle, back on', (x, gy, t, u) => clawd(x, gy, u, job('villager', t, { expr: 'hopeful', armR: candleProp(1), aR: 1.25, light: 1, boilKey: 'a3' }))],
      ] },
    kid: { scenes: 'S3 crying in its mother’s arms · S10 the last light to wake',
      exprs: ['happy', 'cry', 'scared', 'starstruck', 'excited', 'playful', 'sleepy', 'hopeful'],
      views: ['q', 'side', 'back'],
      acts: [
        ['S3 carried and crying', (x, gy, t, u) => clawd(x, gy, u, job('kid', t, { expr: 'cry', light: 0, tint: 'blue', tintK: .45, boilKey: 'a1' }))],
        ['S7 the fireflies come by', (x, gy, t, u) => clawd(x, gy, u, job('kid', t, { expr: 'starstruck', aL: 1.3, aR: 1.3, light: .5, boilKey: 'a2' }))],
        ['S10 the last one lit', (x, gy, t, u) => clawd(x, gy, u, job('kid', t, { expr: 'joytear', light: 1, boilKey: 'a3' }))],
      ] },
    cityman: { scenes: 'S1 walk the river · S4 the cough · S8 the first sapling',
      exprs: ['neutral', 'smug', 'weary', 'cough', 'gasp', 'relieved', 'hopeful', 'determined'],
      views: ['q', 'side', 'qback', 'back'],
      acts: [
        ['S1 along the water', (x, gy, t, u) => clawd(x, gy, u, job('cityman', t, { view: 'side', expr: 'neutral', ...move('walk', t), boilKey: 'a1' }))],
        ['S4 the city coughs', (x, gy, t, u) => clawd(x, gy, u, job('cityman', t, { expr: 'cough', light: .15, boilKey: 'a2' }))],
        ['S8 plant it', (x, gy, t, u) => clawd(x, gy, u, job('cityman', t, { expr: 'determined', view: 'q', armR: saplingProp, aR: .5, light: 1, boilKey: 'a3' }))],
      ] },
    citywoman: { scenes: 'S4 hurry him home · S6 his light comes back first',
      exprs: ['neutral', 'nervous', 'scared', 'weary', 'sad', 'gasp', 'hopeful', 'love'],
      views: ['q', 'side', 'qback', 'back'],
      acts: [
        ['S4 hurry him home', (x, gy, t, u) => clawd(x, gy, u, job('citywoman', t, { view: 'q', expr: 'nervous', bundle: 'cry', flip: true, ...move('walk', t), light: .2, boilKey: 'a1' }))],
        ['S4 his light is gone', (x, gy, t, u) => clawd(x, gy, u, job('citywoman', t, { expr: 'weary', bundle: 'sleep', light: .1, boilKey: 'a2' }))],
        ['S6 the first one lit', (x, gy, t, u) => clawd(x, gy, u, job('citywoman', t, { expr: 'joytear', bundle: 'coo', light: 1, boilKey: 'a3' }))],
      ] },
    citykid: { scenes: 'S1 the neon city · S6 the light dust · S8 planting',
      exprs: ['happy', 'confused', 'excited', 'laugh', 'mischief', 'sleepy', 'surprised', 'hopeful'],
      views: ['q', 'side', 'back'],
      acts: [
        ['S1 a balloon in the cold light', (x, gy, t, u) => clawd(x, gy, u, job('citykid', t, { view: 'q', expr: 'neutral', tint: PAL.violet, tintK: .3, boilKey: 'a1' }))],
        ['S6 the light dust lands', (x, gy, t, u) => clawd(x, gy, u, job('citykid', t, { expr: 'starstruck', aL: 1.3, aR: 1.3, light: 1, boilKey: 'a2' }))],
        ['S8 one more sapling', (x, gy, t, u) => clawd(x, gy, u, job('citykid', t, { expr: 'determined', armR: saplingProp, aR: .6, light: 1, boilKey: 'a3' }))],
      ] },
    baby: { scenes: 'S4 carried through the smog · S6 the first light back',
      exprs: ['coo', 'cry', 'asleep', 'surprised', 'starstruck', 'happy'],
      views: ['side', 'qback', 'back'],
      acts: [
        ['S4 the light goes out', (x, gy, t, u) => clawd(x, gy, u * .78, job('baby', t, { expr: 'cry', light: 0, tint: 'blue', tintK: .4, boilKey: 'a1' }))],
        ['S6 the first one lit', (x, gy, t, u) => clawd(x, gy, u * .78, job('baby', t, { expr: 'coo', light: 1, boilKey: 'a2' }))],
        ['S9 asleep under the tree', (x, gy, t, u) => clawd(x, gy, u * .78, job('baby', t, { expr: 'asleep', light: .8, boilKey: 'a3' }))],
      ] },
  };

  function card(name, t) {
    const C = CARDS[name]; if (!C) return;
    const rows = [
      (C.exprs || []).map((e, i) => [e, (x, gy, tt, u) => clawd(x, gy, u, job(name, tt, { expr: e, boilKey: 'c' + i }))]),
      (C.views || []).map((v, i) => [v, (x, gy, tt, u) => clawd(x, gy, u, job(name, tt, { view: v, boilKey: 'v' + i }))]),
      C.acts || [],
    ];
    label(JOBS[name].label, W / 2, 74, 30);
    if (C.scenes) label(C.scenes, W / 2, 106, 16);
    const floors = [400, 700, 1010];
    rows.forEach((row, r) => {
      if (!row.length) return;
      const gy = floors[r], cw = W / row.length, u = clamp(cw / 20, 8, 14);
      row.forEach(([lab, fn], i) => { const x = cw * i + cw / 2; fn(x, gy, t, u); label(lab, x, gy + u * 2.2 + 14, 15); });
      floor(gy);
    });
  }
  for (const n of Object.keys(CARDS)) { LOOPS['job_' + n] = t => card(n, t); LOOPS['job_' + n].len = 4; }

  // ---------- the lineup ----------
  const label = (txt, x, y, size = 20) => letter(txt, x, y, size, PAL.ink, { ink: false, alpha: .8 });
  const floor = (y, x0 = 0, x1 = W) => inkLine([[x0 + 40, y + 6], [W / 2, y + 4], [x1 - 40, y + 7]], .6, mixCol(PAL.paper, PAL.ink, .35), 'inkfine', .5);
  const NAMES = Object.keys(JOBS);

  LOOPS.jobs = t => {
    // two rows of the whole cast, front view, big enough to read a strap and a stitch. A job may ask to be drawn
    // smaller (scale) — the two children and the baby are children, not short adults.
    const uOf = name => 16 * (JOBS[name].scale || 1);
    const chunks = []; for (let i = 0; i < NAMES.length; i += 6) chunks.push(NAMES.slice(i, i + 6));
    chunks.forEach((row, r) => {
      const gy = 470 + r * 330, cw = W / row.length;
      row.forEach((name, i) => {
        const x = cw * i + cw / 2;
        clawd(x, gy, uOf(name), job(name, t, { boilKey: 'jobs' + name }));
        label(JOBS[name].label, x, gy + 34, 20);
      });
      floor(gy);
    });
    // last row: everyone in 3/4, stepping along, so the kits show from an angle
    const gy = 1040, cw = W / NAMES.length;
    NAMES.forEach((name, i) => {
      const x = cw * i + cw / 2;
      clawd(x, gy, uOf(name) * .46, job(name, t, { view: 'q', boilKey: 'jobq' + name, walk: frac(t * .5 + i * .17) }));
      label(JOBS[name].label, x, gy + 22, 11);
    });
    floor(gy);
  };
  LOOPS.jobs.len = 4;

  // §45b：三段式"被光吸引 → 靠近 → 真相大白"的样片带。剧本里三站（紫火把 / 蓝灯笼 / 绿灯）都是这个形状，
  // 视频里全部演成了"站着正面看"。第一拍的头和眼睛必须先离开观众；第三拍看清的同时，那粒光要跟着灭。
  LOOPS.beckon = t => {
    const cols = [PAL.violet, PAL.indigo, PAL.sap];
    const labs = ['1 被拽过去（头先转，身体跟着倾）', '2 走过去（眼睛还在光上）', '3 看清了（倒吸气 · 光同时灭）'];
    const cw = W / 3, gy = 820;
    label('§45b 三段式：每一站都是"被吸引 → 靠近 → 真相大白"，不是站着正面看', W / 2, 120, 22);
    label('冷光在纸色底上画不出来（glow 是叠加，白纸上等于没有）——所以这三格铺夜色，和片子里一样。', W / 2, 148, 15);
    for (let i = 0; i < 3; i++) {
      const x = cw * i + cw * .36, lx = cw * i + cw * .84, ly = gy - 210;
      paint(rrPts(cw * i + 18, gy - 470, cw - 36, 500, 16, 3), { wash: '#20264A', fill: '#141830', fillOp: 72, bleed: .1, tex: .5, border: .4, ink: null });
      for (let k = 0; k < 12; k++) paint(ellPts(cw * i + 40 + hash(k + i * 7) * (cw - 84), gy - 450 + hash(k + 3 + i * 5) * 260, 1.7, 1.7, 6),
        { wash: '#C9D6EC', washOp: 70 + 90 * hash(k + 11), ink: null });
      clawd(x, gy, 26, job('villager', t, {
        view: 'q', expr: ['beckon', 'reach', 'gasp'][i], armL: null, armR: null,
        light: i === 2 ? 0 : .8 - i * .18, gloom: i === 2 ? .4 : 0,
        ...(i === 1 ? move('walk', t) : {}), boilKey: 'bk' + i,
      }));
      // 一盏"亮但没有温度"的灯：位置在角色视线的前方，绝不在他手里
      paint(rrPts(lx - 22, ly - 30, 44, 62, 10, 2), { wash: mixCol(cols[i], CP.night, i === 2 ? .78 : .5), fill: CP.night, fillOp: 62, bleed: .1, tex: .5, ink: PAL.ink, sw: 1.4 });
      inkLine([[lx, ly + 32], [lx, gy]], 2.4, CP.leather, 'inkfine', 0);
      if (i < 2) {
        glow(lx, ly, 150, cols[i], .6);
        halo(lx, ly, 62, cols[i], .95);
        rays(lx, ly, 44, cols[i], 9, 1.4);
        paint(ellPts(lx, ly, 10, 13, 10), { wash: mixCol(cols[i], '#FFFFFF', .6), ink: null });
      } else label('灯芯已经空了', lx, ly + 62, 13);
      label(labs[i], cw * i + cw / 2, gy + 46, 16);
      floor(gy, cw * i, cw * (i + 1));
    }
  };
  LOOPS.beckon.len = 4;

  window.JOBS = JOBS; window.job = job; window.chestLight = chestLight;   // 主角不穿制服，但胸口那粒光是一样的
})();
