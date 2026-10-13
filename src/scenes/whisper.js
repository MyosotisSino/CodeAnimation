// whisper.js — "Whisper Of Hope", a Clawd MV for the song (153.75 s, 120 BPM, first downbeat 0.25 s).
// Three movements, one palette arc (indigo rain-night → teal thaw → ochre dawn), one motif (the ripple):
//   I   the cold:  A alone in the rain · the ember drifts in · the chase · it gutters in the gusts ·
//                  the storm · shelter on a rock.          (shots A–F)
//   II  the whisper: the hush — Clawd breathes warmth into the spark; it wakes, lifts, leads; the moss
//                  puffs join; the company climbs the hill.            (shots G–J)
//   III the dawn:  the ember leaps and bursts into the sun; the world floods warm; the dance; and in the
//                  quiet after, Clawd sends a spark of its own toward the one corner still grey.  (shots K–M)
// Every cut sits on a bar line (0.25 + 2k). No text anywhere — the story is acted, not written.
(() => {
  // ---------- music grid & the colour of the whole film ----------
  const BARS = [[0, 14.25], [14.25, 26.25], [26.25, 38.25], [38.25, 50.25], [50.25, 60.25], [60.25, 70.25],
    [70.25, 74.25], [74.25, 86.25], [86.25, 98.25], [98.25, 110.25], [110.25, 118.25], [118.25, 134.25], [134.25, 153.75]];
  const CH = 74.25, HUSH = 70.25, LAUNCH = 110.75, BURST = 114.25, OUT0 = 134.25;
  // world warmth: 0 = rain night, 1 = full dawn. The hush starts the thaw; the burst floods it.
  const skyMix = t => kf(t, [[0, 0], [50, 0], [HUSH, .3], [CH, .34], [98.25, .5], [110.25, .58], [BURST, .66], [115.8, .88], [117.2, 1], [154, 1]]);
  const skyCol = t => { const k = skyMix(t); return k < .55 ? mixCol('#262B50', '#3A6874', k / .55) : mixCol('#3A6874', '#EFB45C', (k - .55) / .45); };
  const groundMix = t => kf(t, [[0, 0], [50, 0], [HUSH, .22], [CH, .28], [98.25, .45], [117.5, 1], [154, 1]]);
  const groundCol = t => { const k = groundMix(t); return k < .5 ? mixCol('#31465F', '#4A6B5E', k * 2) : mixCol('#4A6B5E', '#6E9F58', (k - .5) * 2); };
  const rainK = t => kf(t, [[0, .85], [50.25, 1.15], [62, 1.05], [66, .7], [69.8, .45], [70.6, 0], [74.6, .3], [80, .3], [86.25, .15], [88.25, 0], [154, 0]]);
  const windK = t => kf(t, [[0, .3], [38.25, .5], [40.25, 1], [41.2, 1.05], [46.25, 1.2], [47.2, 1.05], [50.25, 1.3], [60.25, 1.2], [64, .7], [68, .3], [70.25, 0], [74.25, 0], [154, 0]]);
  // Clawd's body warms a little at the whisper, fully at the dawn.
  const cw = t => { const k = kf(t, [[HUSH, 0], [86.25, .4], [110.25, .6], [117.5, 1], [154, 1]]);
    return { col: mixCol('#8E7FA0', PAL.clay, k), dk: mixCol('#565279', PAL.clayDk, k), lt: mixCol('#ABA2C0', '#F2A283', k) }; };
  const wipeOut = (lt, dur, cols) => { boilSeed('wipe'); if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, cols); };
  const wipeIn = (lt, cols) => { boilSeed('wipe'); if (lt < .3) brushWipe(.5 + lt / .6, cols); };

  // ---------- the world's props ----------
  // the ember: a small round light that flickers like a whisper. bright 0..1; awake = it has eyes.
  function ember(x, y, r, bright, o = {}) {
    boilSeed('ember');
    const br = clamp(bright), fl = 1 + .08 * Math.sin(T * 11 + 1) * (.3 + br) + .05 * Math.sin(T * 4.7);
    glow(x, y, r * (2.4 + 2.8 * br) * fl, '#FFD96A', .26 + .74 * br);
    paint(ellPts(x, y, r * fl, r * (1 + .1 * Math.sin(T * 9)) * fl, 14), { wash: mixCol('#9A8C74', '#FFE9A8', clamp(br * 1.5)), fill: PAL.cream, fillOp: 30 + 80 * br, ink: br > .22 ? PAL.ink : null, sw: clamp(r / 28, .4, 1.1) });
    if (o.awake && r > 11) {
      const e = r * .24;
      for (const s of [-1, 1]) {
        if (o.sleep) inkLine([[x + s * e - e * .4, y - e * .2], [x + s * e + e * .4, y - e * .05]], clamp(r / 30, .4, .9), PAL.ink, 'ink', 0);
        else paint(ellPts(x + s * e, y - e * .2, e * .36, e * .52, 8), { wash: PAL.ink, ink: null });
      }
      if (o.smile) inkLine([[x - e * .8, y + e * .8], [x, y + e * 1.25], [x + e * .8, y + e * .8]], clamp(r / 34, .35, .8), PAL.ink, 'ink', .5);
    }
  }
  // moss puffs: round grey-green critters with a sprout; each bounces on its own clock (seed).
  function puff(x, y, u, t, seed, o = {}) {
    boilSeed('puff' + seed);
    const bp = bpOf(t) + seed * .41, hop = Math.abs(Math.sin(bp * Math.PI)), dy = -(o.hop ?? 1) * hop * u * .16, sq = .09 * Math.max(0, 1 - frac(bp) * 3.2);
    const sw = clamp(u / 12, .5, 1.6);
    paint(ellPts(x, y + u * .12, u * 1.25, u * .22, 16), { fill: PAL.ink, fillOp: 55 * (1 - hop * .5), bleed: .25, tex: .3, border: .1, ink: null });
    push(); translate(x, y + dy); scale(1 + sq * .5, 1 - sq);
    const col = o.col || mixCol('#8A9A8C', PAL.sap, .25 + .45 * groundMix(T));
    paint(ellPts(0, -1.45 * u, 1.65 * u, 1.4 * u, 18, u * .07), { wash: col, fill: mixCol(col, PAL.ink, .22), fillOp: 55, bleed: .15, tex: .6, ink: PAL.ink, sw });
    inkLine([[0, -2.8 * u], [.12 * u, -3.3 * u], [.3 * u + wob(t, .5, seed) * .06 * u, -3.7 * u]], sw * .7, mixCol(col, PAL.cream, .25), 'ink', .3);
    paint(ellPts(.42 * u, -3.85 * u, .48 * u, .3 * u, 8, u * .05, -.45), { wash: mixCol(col, PAL.cream, .5), ink: PAL.ink, sw: sw * .55 });
    const ex = (o.lookX || 0) * .3 * u;
    for (const s of [-1, 1]) {
      if (o.sleep) inkLine([[s * .6 * u - .17 * u, -1.55 * u], [s * .6 * u + .17 * u, -1.5 * u]], sw * .6, PAL.ink, 'ink', 0);
      else paint(ellPts(s * .6 * u + ex, -1.55 * u, .2 * u, .3 * u, 8), { wash: PAL.ink, ink: null });
    }
    if (o.smile) inkLine([[-.26 * u, -.75 * u], [0, -.52 * u], [.26 * u, -.75 * u]], sw * .55, PAL.ink, 'ink', .5);
    if (o.blush) for (const s of [-1, 1]) paint(ellPts(s * .95 * u, -.95 * u, .28 * u, .15 * u, 8), { fill: PAL.rose, fillOp: 130, bleed: .2, ink: null });
    pop();
  }
  // fir silhouettes; sway bends the top in the wind.
  function fir(x, gy, h, col, sway = 0) {
    boilSeed('fir' + Math.round(x));
    const s = y => sway * (gy - y) / h;
    paint([[x - h * .34 + s(gy - h * .05) * .3, gy], [x - h * .2 + s(gy - h * .3), gy - h * .3], [x - h * .33 + s(gy - h * .28), gy - h * .28],
      [x - h * .11 + s(gy - h * .55), gy - h * .55], [x - h * .2 + s(gy - h * .52), gy - h * .52], [x + s(gy - h), gy - h],
      [x + h * .2 + s(gy - h * .52), gy - h * .52], [x + h * .11 + s(gy - h * .55), gy - h * .55],
      [x + h * .33 + s(gy - h * .28), gy - h * .28], [x + h * .2 + s(gy - h * .3), gy - h * .3], [x + h * .34 + s(gy - h * .05) * .3, gy]],
      { wash: col, ink: null, curv: .25 });
    paint(rectPts(x - h * .045, gy - h * .1, h * .09, h * .12), { wash: mixCol(col, PAL.ink, .3), ink: null });
  }
  function rain(t, k, slant = .22, n = 40) {
    if (k <= .02) return;
    const col = mixCol('#8FA6C8', skyCol(t), .3);
    for (let i = 0; i < n; i++) {
      boilSeed('rain' + i);
      const sp = 650 + 500 * hash(i + 40);
      const x0 = frac(hash(i) * 7 + t * slant * .25) * (W + 300) - 150;
      const y0 = frac(hash(i + 90) * 5 + t * sp / 1100) * (H + 160) - 80, l = (34 + 30 * hash(i + 7)) * Math.min(1, k);
      inkLine([[x0, y0], [x0 + l * slant, y0 + l]], .75, mixCol(col, skyCol(t), .2 + .3 * hash(i + 3)), 'ink', 0);
    }
  }
  function puddle(x, y, w, t, cold = 1) {
    boilSeed('puddle' + Math.round(x));
    const col = mixCol(skyCol(T), groundCol(T), .45);
    paint(ellPts(x, y, w, w * .16, 20), { wash: mixCol(col, '#DFF0F6', .12 * cold), ink: null });
    for (let k = 0; k < 2; k++) {
      const p = frac(t * .4 + k * .5 + hash(Math.round(x))), r = w * (.22 + .68 * p);
      inkLine(ellPts(x, y, r, r * .16, 22), .7, mixCol(col, PAL.cream, .55 * (1 - p)), 'inkfine', 0);
    }
  }
  function splash(x, y, age, s = 1) {
    if (age < 0 || age > .5) return;
    boilSeed('splash' + Math.round(x) + Math.floor(age * 14));
    const k = age / .5;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * .55, r0 = 8 * s, r1 = (26 - 18 * k) * s;
      inkLine([[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1 - 6 * s * k]], 1, mixCol('#AFC4E2', PAL.paper, .2 + k * .5), 'inkfine', 0);
    }
    for (let i = 0; i < 3; i++) {
      const p = arcPt([x, y - 6 * s], [x + (i - 1) * 34 * s, y - 2 * s], 26 * s, clamp(k * 1.3 - i * .08));
      paint(ellPts(p[0], p[1], 2.6 * s * (1 - k * .5), 3.4 * s * (1 - k * .5), 6), { wash: '#AFC4E2', ink: null });
    }
  }
  function windStreaks(t, k, dir = -1, n = 12) {
    if (k <= .02) return;
    for (let i = 0; i < n; i++) {
      boilSeed('wind' + i);
      const y0 = 60 + hash(i + 3) * (H - 160), sp = 500 + 700 * hash(i + 11);
      const x0 = frac(hash(i) * 3 + t * sp / 2400) * (W + 600) - 300;
      const l = (120 + 140 * hash(i + 5)) * k, yy = y0 + Math.sin(x0 * .008 + i * 2) * 10;
      inkLine([[x0, yy], [x0 + l * .5 * dir, yy - l * .06], [x0 + l * dir, yy + l * .04]], 1.1, mixCol('#9FB2D6', skyCol(T), .35), 'inkfine', .4);
    }
  }
  function ring(x, y, r0, r1, k, col = '#FFE9A8', sw = 1.2) {
    if (k <= 0 || k >= 1) return;
    const r = lerp(r0, r1, easeOut(k));
    inkLine(ellPts(x, y, r, r * .94, 34), sw, mixCol(col, skyCol(T), clamp(k * .9)), 'ink', 0);
  }
  const sparkle = (x, y, r, k, rot = 0) => { if (k > 0 && k < 1) paint(starPts(x, y, r * backOut(k) * (1 - k * .5), .3, 4, rot), { wash: PAL.cream, washOp: 255 * (1 - k * k), ink: null }); };
  function sunStar(x, y, r, t) {
    glow(x, y, r * 3.4, '#FFD96A', .95);
    boilSeed('sun');
    paint(ellPts(x, y, r, r, 26), { wash: '#FFE9A8', fill: '#FFD96A', fillOp: 80, ink: null });
    for (let i = 0; i < 12; i++) {
      boilSeed('ray' + i);
      const a = i / 12 * TAU + .04 * Math.sin(t * .7 + i), l = r * (1.5 + .5 * hash(i)) * (1 + .06 * Math.sin(t * 2 + i));
      inkLine([[x + Math.cos(a) * r * 1.12, y + Math.sin(a) * r * 1.12], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 2, mixCol('#FFD96A', PAL.paper, .25), 'ink', 0);
    }
  }
  // the big leaf shelter (x, y) = stem base on the ground, s = size
  function leaf(x, y, s, warm = 0) {
    boilSeed('leaf' + Math.round(x));
    inkLine([[x, y], [x + .1 * s, y - .45 * s], [x + .28 * s, y - .9 * s]], 3.4, mixCol('#3A4E42', PAL.sap, warm), 'ink', .3);
    push(); translate(x + .5 * s, y - 1.12 * s); rotate(-.16);
    const P = [], Q = [];
    for (let i = 0; i <= 10; i++) P.push([lerp(-s * .62, s * .62, i / 10), -Math.sin(i / 10 * Math.PI) * s * .3]);
    for (let i = 0; i <= 10; i++) Q.push([lerp(s * .62, -s * .62, i / 10), Math.sin(i / 10 * Math.PI) * s * .12]);
    paint(P.concat(Q), { wash: mixCol('#2E5248', PAL.sap, warm), fill: mixCol('#3A6874', PAL.sap, warm), fillOp: 70, bleed: .12, tex: .5, ink: PAL.ink, sw: 1.1, curv: .4 });
    inkLine([[-s * .62, 0], [s * .62, 0]], .7, mixCol(PAL.ink, PAL.sap, .4), 'inkfine', 0);
    pop();
  }
  const chestAt = (x, gy, u, dy = 0, sq = 0) => [x, gy + dy * u - 2.6 * u * (1 - sq)];   // the belly, clear of the mouth
  // cloud banks for the night sky
  function clouds(t, k = 1) {
    for (let i = 0; i < 2; i++) {
      boilSeed('cloud' + i);
      const x = W * (.3 + .45 * i) + wob(t, .05, i * 2) * 60, y = 130 + 150 * i + wob(t, .04, i) * 14;
      paint(ellPts(x, y, 480 + 140 * hash(i + 9), 90 + 30 * hash(i + 4), 26, 8), { fill: mixCol('#1B2038', skyCol(T), .4), fillOp: 110 * k, bleed: .3, tex: .5, border: 0, ink: null });
    }
  }

  // ============================================================ A · 0–14.25 · alone in the rain
  const HILL = { cx: 1250, cy: 1330, rx: 1500, ry: 480 };
  const hillY = x => HILL.cy - HILL.ry * Math.sqrt(Math.max(0, 1 - ((x - HILL.cx) / HILL.rx) ** 2));
  function hillWorld(t, warm) {   // the A–B–M world: sky, clouds, firs, the hill, puddles
    boilSeed('sky');
    paint(rectPts(-500, -300, W + 1000, H + 700), { wash: skyCol(t), ink: null });
    clouds(t, 1 - warm * .7);
    const w = windK(t);
    fir(-140, hillY(-140) + 6, 240, mixCol('#22304E', '#2E4A44', warm), -w * 18);
    fir(60, hillY(60) + 6, 300, mixCol('#22304E', '#2E4A44', warm), -w * 14);
    fir(1520, hillY(1520) + 6, 330, mixCol('#22304E', '#2E4A44', warm), -w * 16);
    fir(1730, hillY(1730) + 6, 260, mixCol('#22304E', '#2E4A44', warm), -w * 20);
    boilSeed('hill');
    paint(ellPts(HILL.cx, HILL.cy, HILL.rx, HILL.ry, 44, 3), { wash: groundCol(t), fill: mixCol(groundCol(t), PAL.ink, .3), fillOp: 80, bleed: .1, tex: .55, ink: mixCol(PAL.ink, skyCol(t), .35), sw: 1 });
    puddle(950, 928, 120, t); puddle(430, 975, 150, t);
  }
  function sAlone(t, lt, dur) {   // A
    camBegin(920 + 14 * Math.sin(t * .22), 560, 1 + .012 * t);
    hillWorld(t, 0);
    rain(t, rainK(t), .22, 42);
    windStreaks(t, windK(t) * .5, -1, 8);
    leaf(540, hillY(540), 300, 0);
    const gy = hillY(700), u = 21;
    const mood = emotions(t, [[0, 'sad'], [9.5, 'thinking', { lookY: -.7 }], [12.4, 'thinking', { lookX: .6, lookY: -.3 }]]);
    clawd(700, gy, u, { ...mood, ...cw(t), aL: -.75, aR: -.8 });
    camEnd();
    const eye = toScreen(700, gy - 4 * u);
    if (lt < .9) iris(...eye, lerp(0, 1700, easeIn(lt / .9)));
    wipeOut(lt, dur, [PAL.indigo, PAL.night]);
  }

  // ============================================================ B · 14.25–26.25 · the whisper arrives
  function sWhisper(t, lt, dur) {
    camBegin(880 + 30 * ease(seg(lt, 10, 12)), 555, 1.26 + .01 * Math.sin(lt * .5));
    hillWorld(t, 0);
    rain(t, rainK(t) * .9, .2, 34);
    leaf(540, hillY(540), 300, 0);
    const gy = hillY(700), u = 26;
    const ek = easeOut(seg(lt, .8, 4.2));
    const ex = lerp(1840, 1075, ek) + wob(lt, .5) * 12, ey = lerp(450, 590, ek) + Math.sin(lt * 2.2) * 14;
    const br = .3 + .1 * Math.sin(T * 1.3) - .12 * ease(seg(lt, 5, 12));   // it sags a little, tired
    ember(ex, ey, 17, br, { awake: lt > 6 });
    const mood = emotions(lt, [[0, 'bored'], [2.1, 'surprised', { lookX: .9 }], [3.6, 'thinking'], [6.2, 'hopeful', { lookY: -.1 }]]);
    const reach = ease(seg(lt, 10.2, 11.9));
    clawd(700, gy, u, { ...mood, ...cw(t), lookX: clamp((ex - 700) / 420, -1, 1), lookY: clamp((ey - (gy - 5 * u)) / 300, -1, 1) * .8,
      aL: lerp(mood.aL ?? .2, .55, reach), aR: lerp(mood.aR ?? .2, .95, reach) });
    camEnd();
    wipeIn(lt, [PAL.indigo, PAL.night]);
    wipeOut(lt, dur, ['#2E3A66', '#3E6874']);
  }

  // ============================================================ C · 26.25–38.25 · the chase (forest travel)
  function forestWorld(t, panX, warm = 0, dens = 1) {   // C–F world: flat floor y 880, parallax firs
    boilSeed('sky');
    paint(rectPts(-500, -300, W + 1000, H + 700), { wash: skyCol(t), ink: null });
    clouds(t, 1 - warm * .7);
    const w = windK(t);
    for (let i = 0; i < 6; i++) { const bx = 150 + i * 430 + (panX - 1000) * .55; fir(bx, 880, 300 + 90 * hash(i + 2), mixCol('#243252', '#2E4A44', warm), -w * (16 + 8 * hash(i))); }
    for (let i = 0; i < 5; i++) { const bx = -80 + i * 520 + (panX - 1000) * .18; fir(bx, 900, 380 + 120 * hash(i + 7), mixCol('#1B2540', '#27423C', warm), -w * (22 + 8 * hash(i + 1))); }
    boilSeed('floor');
    paint(rectPts(-400, 878, W + 800, 420, 3), { wash: groundCol(t), fill: mixCol(groundCol(t), PAL.ink, .3), fillOp: 90, bleed: .05, tex: .55, ink: mixCol(PAL.ink, skyCol(t), .35), sw: 1 });
    inkLine([[-400, 880], [W / 2, 876], [W + 400, 882]], 1, mixCol(PAL.ink, skyCol(t), .3), 'ink', .5);
    if (dens) { puddle(860, 912, 110, t); puddle(1300, 948, 90, t); }
  }
  function sFollow(t, lt, dur) {   // C
    const u = 24, st = stroll(lt, .1, 11.5, 500, 1500, u), x = st.x, gy = 902;
    camBegin(x + 130, 610, 1.3);
    forestWorld(t, x);
    rain(t, rainK(t), .22, 34);
    const dip = ease(seg(lt, 8, 11.5));
    const ex = x + 160 + wob(lt, .8) * 10, ey = 645 + Math.sin(lt * 2.4) * 18 + 110 * dip;
    ember(ex, ey, 17, .42 - .14 * dip, { awake: true });
    const jp = jump(lt, 4.3, 5.05, 2.6);
    const f = feel('hopeful', lt, { lookX: .9, lookY: dip * .5 });
    clawd(x, gy, u, { ...f, ...cw(t), view: 'side', walk: st.walk, dy: st.dy + jp.dy, sq: (f.sq || 0) * .4 + jp.sq });
    splash(860, 900, lt - 5.05, 1.1);
    camEnd();
    wipeIn(lt, ['#2E3A66', '#3E6874']);
    wipeOut(lt, dur, ['#3E6874', '#2E3A66']);
  }

  // ============================================================ D · 38.25–50.25 · the guttering
  function sGutter(t, lt, dur) {
    const u = 26;
    const x = lerp(700, 830, ease(seg(lt, .2, 2))) + lerp(0, 130, ease(seg(lt, 10.2, 11.9)));
    camBegin(x + 70, 590, kf(lt, [[0, 1.3], [12, 1.36]]));
    forestWorld(t, x, 0, 0);
    const g1 = Math.exp(-Math.max(0, lt - 2) * 1.4) * (lt > 2 ? 1 : 0), g2 = Math.exp(-Math.max(0, lt - 8) * 1.2) * (lt > 8 ? 1 : 0);
    rain(t, rainK(t), .22 + .3 * (g1 + g2), 40);
    windStreaks(t, windK(t) * (0.6 + g1 + g2), -1, 14);
    const mood = emotions(lt, [[0, 'hopeful', { lookX: .9 }], [2.05, 'surprised', { lookX: .9, lookY: .3 }], [3.3, 'scared', { lookY: .5 }],
      [4.7, 'determined', { lookY: .6 }], [8, 'determined', { lookY: .7 }], [10.6, 'determined', { lookY: -.3 }]]);
    let view = 'q', extra = {};
    if (lt < 2.7) { extra = { view: 'q', walk: stroll(lt, .2, 2, 700, 830, u).walk, dy: stroll(lt, .2, 2, 700, 830, u).dy }; }
    else if (lt < 10.2) { const tn = turn(lt, 2.7, 2.95, .25, 0); view = tn.view; extra = { ...tn, sq: .12 + .05 * Math.sin(t * 2.4), rot: .05 }; }
    else { const tn = turn(lt, 10.2, 10.45, 0, .25); view = tn.view; const w2 = stroll(lt, 10.45, 12, 830, 960, u); extra = { ...tn, view: w2.view, walk: w2.walk, dy: w2.dy }; }
    clawd(x, 902, u, { ...mood, ...extra, ...cw(t), aL: lerp(.2, .3, ease(seg(lt, 3.4, 4.6))), aR: lerp(.2, .35, ease(seg(lt, 3.4, 4.6))) });
    // the ember: ahead → gutters to the ground → carried at the chest → dim pinprick
    const chest = chestAt(x, 902, u, (extra.dy || 0) * .6, .12);
    if (lt < 3.4) {
      const k = ease(seg(lt, 2, 3.4));
      ember(lerp(x + 160, x + 70, k), lerp(645, 780, k) + Math.sin(lt * 3) * 8 * (1 - k), lerp(17, 12, k), .42 - .16 * k, {});
    } else if (lt < 4.2) {
      const k = ease(seg(lt, 3.4, 4.2)), p = arcPt([x + 70, 780], chest, 60, k);
      ember(p[0], p[1], 12, .26 + .06 * k, {});
    } else ember(...chest, lerp(12, 9, ease(seg(lt, 8, 9.5))), .3 - .12 * ease(seg(lt, 8, 9.5)), {});
    camEnd();
    wipeIn(lt, ['#3E6874', '#2E3A66']);
    wipeOut(lt, dur, ['#2E3A66', '#243B5E']);
  }

  // ============================================================ E · 50.25–60.25 · into the wind
  function sStorm(t, lt, dur) {
    const u = 24;
    let x = lerp(480, 1050, ease(seg(lt, .3, 9.4)));
    x -= 62 * (spring(lt, 3.25, 4, 5) + spring(lt, 7.25, 4, 5));   // staggered back by the gusts
    camBegin(x + 60, 600, 1.1);
    forestWorld(t, x, 0, 0);
    rain(t, rainK(t), -.45, 44);
    windStreaks(t, windK(t), -1, 16);
    const gy = 902, st = stroll(lt, .3, 9.4, 480, 1050, u);
    const mood = emotions(lt, [[0, 'determined'], [3.25, 'determined', { lookY: .4 }], [7.25, 'determined', { lookY: .5 }]]);
    clawd(x, gy, u, { ...mood, ...cw(t), view: 'side', walk: st.walk, dy: st.dy, rot: .14 + .05 * spring(lt, 3.25, 3, 4) + .05 * spring(lt, 7.25, 3, 4), sq: .1, aL: -.4 });
    ember(...chestAt(x, gy, u, st.dy * .4, .1), 10, .3 - .08 * Math.abs(Math.sin(lt * 2.6)), {});
    camEnd();
    wipeIn(lt, ['#2E3A66', '#243B5E']);
    wipeOut(lt, dur, ['#243B5E', '#3E6874']);
  }

  // ============================================================ F · 60.25–70.25 · shelter
  function sShelter(t, lt, dur) {
    const u = 25;
    const st = stroll(lt, 0, 1.1, 800, 1020, u);
    const jp = jump(lt, 1.2, 2.1, 1.8);
    const x = lt < 1.2 ? st.x : lt < 2.1 ? lerp(1020, 1150, ease(seg(lt, 1.2, 2.1))) : 1150;
    const gy = lt < 2.1 ? lerp(902, 700, ease(seg(lt, 1.2, 2.1))) : 700;
    camBegin(x + 80, kf(lt, [[0, 620], [4, 600], [9.5, 585]]), kf(lt, [[0, 1.12], [4, 1.2], [9.5, 1.32]]));
    forestWorld(t, x, 0, 0);
    boilSeed('rock');
    paint(rrPts(1020, 700, 320, 220, 60, 4), { wash: mixCol('#3A4A66', '#4E5E6E', groundMix(t)), fill: PAL.ink, fillOp: 60, bleed: .1, tex: .6, ink: mixCol(PAL.ink, skyCol(t), .3), sw: 1.1 });
    paint(ellPts(1180, 706, 150, 26, 20, 2), { wash: mixCol('#4E5E74', '#6E7E72', groundMix(t)), ink: null });
    rain(t, rainK(t), -.3, 34);
    windStreaks(t, windK(t), -1, 10);
    const mood = emotions(lt, [[0, 'determined'], [2.3, 'determined', { lookY: .55 }], [7.4, 'sad', { lookY: .8, emote: null }]]);
    const dy = lt < 1.2 ? st.dy : jp.dy;
    clawd(x, gy, u, { ...mood, ...cw(t), view: lt < 2.1 ? 'side' : 'front', walk: lt < 1.2 ? st.walk : null, dy, sq: lt >= 2.1 ? .12 : jp.sq,
      rot: lt >= 2.1 ? .04 : 0, aL: lt >= 2.1 ? -.55 : -.3, aR: lt >= 2.1 ? -.5 : -.3 });
    ember(...chestAt(x, gy, u, dy * .5, .12), 10, .26 + .03 * Math.sin(T * 2.2), {});
    const eye = toScreen(x, gy - 4.3 * u);
    camEnd();
    wipeIn(lt, ['#243B5E', '#3E6874']);
    if (lt > 9.25) iris(...eye, lerp(1500, 0, easeIn(seg(lt, 9.25, 9.95))));
  }

  // ============================================================ G · 70.25–74.25 · the hush (the whisper)
  function sHush(t, lt, dur) {
    const u = 62;
    camBegin(960, 700, 1.18 + .05 * ease(seg(lt, 0, 3.9)));
    boilSeed('hushbg');
    paint(rectPts(-500, -300, W + 1000, H + 700), { wash: mixCol(skyCol(t), '#141830', .35), ink: null });
    const lean = lt > 1.05 ? .03 * Math.sin(Math.PI * seg(lt, 1.05, 2.2)) : 0;   // leans in to whisper
    const mood = emotions(lt, [[0, 'sad', { lookY: .85, emote: null }], [1.05, 'hopeful', { lookY: .8 }], [2.35, 'happy', { lookY: .75, eyes: 'shine' }]]);
    const breath = .5 + .5 * Math.sin(Math.PI * clamp(seg(lt, 1.1, 2.2)));
    const dy = -1 + .8 * breath;
    const chest = chestAt(960, 1150, u, dy, .05);
    clawd(960, 1150, u, { ...mood, ...cw(t), noLegs: true, noShadow: true, view: 'front', rot: lean, sq: .05 + .015 * Math.sin(t * 2.2), aL: -.6, aR: -.6, dy });
    if (lt > 1.1 && lt < 2.5) glow(960, chest[1] - 90, 90 + 130 * breath, '#FFD9A0', .5 * breath);   // the whisper
    const ans = backOut(seg(lt, 2.3, 3));
    ember(...chest, lerp(13, 30, ans), .2 + .6 * ans, { awake: lt > 2.4, smile: lt > 2.9 });
    ring(chest[0], chest[1], 20, 150, seg(lt, 2.45, 3.2), '#FFE9A8', 1.1);
    camEnd();
    if (lt > 3.6) flash(seg(lt, 3.6, 4.05) * .98, '#FFF3D8');   // the flare whites out into the chorus
  }

  // ============================================================ H · 74.25–86.25 · the revival
  function sRevive(t, lt, dur) {
    const u = 26, gy = hillY(720);
    camBegin(930 + 20 * Math.sin(lt * .5), 560, 1.2);
    hillWorld(t, skyMix(t));
    rain(t, rainK(t), .18, 12);
    const chest = chestAt(720, gy, u, 0, .05);
    // the ember: flare on the chord → lifts from the cupped arms → hovers overhead → tugs right
    let ex, ey, ebr = 1, awake = true, trail = null;
    if (lt < 3) {
      const k = easeOut(seg(lt, .5, 3));
      const p = arcPt(chest, [860, gy - 10.4 * u], 110, k);
      ex = p[0]; ey = p[1]; ebr = lerp(1.1, .85, k);
      ring(...chest, 20, 320, seg(lt, 0, .9));
    } else if (lt < 5.5) { ex = 860 + wob(lt, .7) * 10; ey = gy - 10.4 * u + Math.sin(lt * 2.1) * 10; ebr = .85; }
    else {
      const k = ease(seg(lt, 5.5, 11.5));
      ex = lerp(860, 1280, k) + wob(lt, .8) * 12; ey = gy - 10 * u - 60 * k + Math.sin(lt * 2.3) * 12; ebr = .8 + .1 * k;
      trail = k;
    }
    if (trail !== null) {   // a faint trail as it tugs away
      const P = []; for (let i = 6; i >= 1; i--) { const k2 = ease(seg(lt - i * .05, 5.5, 11.5)); P.push([lerp(860, 1280, k2) + wob(lt - i * .05, .8) * 12, gy - 10 * u - 60 * k2]); }
      paint(ribbon(P, 3, 14), { wash: mixCol('#FFE9A8', skyCol(t), .5), ink: null });
    }
    ember(ex, ey, lerp(19, 24, ease(seg(lt, 5.5, 8))), ebr, { awake, smile: lt > 2.5 });
    const lift = ease(seg(lt, .5, 3));
    const mood = emotions(lt, [[0, 'starstruck'], [3.4, 'happy'], [5.6, 'laugh']]);
    let pose;
    if (lt < 6.2) pose = { aL: lerp(-.5, 1.2, lift), aR: lerp(-.5, 1.2, lift) };
    else if (lt < 6.5) { const tn = turn(lt, 6.2, 6.45, 0, .25); pose = { ...tn, aL: .4, aR: .8 }; }
    else { const run = stroll(lt, 6.5, 11.9, 720, 1180, u); pose = { view: run.view, flip: run.flip, walk: run.walk, dy: run.dy, aL: .5, aR: .9 }; }
    clawd(720, gy, u, { ...mood, ...pose, ...cw(t) });
    camEnd();
    if (lt < .5) flash(1 - lt / .5, '#FFF3D8');
    wipeOut(lt, dur, [PAL.teal, PAL.sap]);
  }

  // ============================================================ I · 86.25–98.25 · the moss puffs wake
  function sFriends(t, lt, dur) {
    const u = 24, gy = 902;
    const x = lerp(500, 1450, ease(seg(lt, .2, 11.6)));
    camBegin(x + 110, 610, 1.12);
    forestWorld(t, x, groundMix(t), 0);
    boilSeed('props');
    paint(ellPts(1000, 892, 130, 46, 20, 3), { wash: mixCol(groundCol(t), PAL.ink, .25), ink: mixCol(PAL.ink, skyCol(t), .3), sw: 1 });   // the burrow mound
    paint(ellPts(1000, 878, 34, 22, 14, 2), { wash: '#1A2030', ink: null });
    paint(rrPts(1430, 810, 240, 78, 26, 3), { wash: mixCol('#4E5E6E', '#5E7258', groundMix(t)), fill: PAL.ink, fillOp: 50, bleed: .1, tex: .6, ink: mixCol(PAL.ink, skyCol(t), .3), sw: 1 });   // the log
    paint(ellPts(1440, 806, 26, 36, 12, 2), { wash: mixCol('#5E6E7E', '#6E8262', groundMix(t)), ink: mixCol(PAL.ink, skyCol(t), .3), sw: 1 });
    rain(t, rainK(t), .15, 8);
    const ex = x + 235 + wob(lt, .8) * 12, ey = 560 + Math.sin(lt * 2.2) * 14;
    ember(ex, ey, 24, .85, { awake: true, smile: true });
    // the parade: ember leads, Clawd runs, puffs trail (each wakes on its own bar)
    const homes = [[1000, 878, 210, 2, 3.5], [1490, 830, 285, 4, 5.5], [1640, 872, 360, 6, 7.5]];   // [x, y, follow offset, pop t, join t]
    homes.forEach(([hx, hy, off, tp, tj], i) => {
      const popped = lt > tp, joined = lt > tj;
      if (!popped) return;   // still underground
      let px = hx, py = hy;
      if (!joined) { const k = backOut(seg(lt, tp, tp + .5)); py = hy - 26 * k; px = hx + 14 * k; }
      if (joined) { const k = ease(seg(lt, tj, tj + 1.3)); px = lerp(hx + 14, x - off, k) + wob(lt, 1.1, i) * 6; py = lerp(hy, gy + 2, ease(seg(lt, tj, tj + .8))); }
      if (lt < tp + .9) { boilSeed('pe' + i); emote('!', px + 26, py - 44, 15, seg(lt, tp + .1, tp + .4), lt - tp); }
      puff(px, py, 13, t, i * 1.7 + 1, { smile: joined, blush: groundMix(t) > .3, lookX: joined ? .7 : 0 });
    });
    const mood = emotions(lt, [[0, 'excited'], [8, 'laugh']]);
    const run = stroll(lt, .2, 11.6, 500, 1450, u);
    const wave = lt > 8 && lt < 10.5 ? 1.1 + .5 * Math.sin(bpOf(t) * TAU * 2) : .5;
    clawd(x, gy, u, { ...mood, ...cw(t), view: 'side', walk: run.walk, dy: run.dy, aL: lt > 8 && lt < 10.5 ? wave : -.3, aR: .9 });
    camEnd();
    wipeIn(lt, [PAL.teal, PAL.sap]);
    wipeOut(lt, dur, [PAL.sap, PAL.teal]);
  }

  // ============================================================ J · 98.25–110.25 · the climb
  const slopeY = x => lerp(980, 430, (x + 200) / 2320);
  function sClimb(t, lt, dur) {
    const u = 24, st = stroll(lt, .2, 10.6, 450, 1350, u), x = st.x, gy = slopeY(x) + 22;
    camBegin(x + 150, kf(lt, [[0, 590], [8, 550], [10.6, 470], [12, 390]]), 1.12);
    boilSeed('sky');
    paint(rectPts(-500, -300, W + 1000, H + 700), { wash: skyCol(t), ink: null });
    clouds(t, .4);
    glow(1800, 560, 480, '#E8AA38', .3 * ease(seg(lt, 4, 10)));   // the horizon remembers the sun
    boilSeed('slope');
    paint([[-300, 1010], [-300, 980], [W + 200, 430], [W + 200, 470], [-100, 1010]], { wash: groundCol(t), fill: mixCol(groundCol(t), PAL.ink, .25), fillOp: 80, bleed: .08, tex: .55, ink: mixCol(PAL.ink, skyCol(t), .3), sw: 1 });
    for (let i = 0; i < 4; i++) fir(-200 + i * 560 + (x - 900) * .3, slopeY(-200 + i * 560 + (x - 900) * .3) + 30, 260 + 70 * hash(i), mixCol('#2E4A44', PAL.sap, groundMix(t)), -windK(t) * 10);
    rain(t, rainK(t), .12, 8);
    // the ember pulls up-ahead, then comes back to hover between Clawd's raised hands for the launch
    const kUp = ease(seg(lt, 4, 10.6)), back = ease(seg(lt, 10.6, 11.5));
    const ex = lerp(lerp(x + 235, x + 295, kUp), x + 40, back);
    const ey = lerp(lerp(gy - 320, gy - 510, kUp), gy - 8.7 * u, back) + (1 - back) * Math.sin(lt * 2.4) * 10 + (back >= 1 ? jit(2) : 0);
    ember(ex, ey, 26, 1, { awake: true, smile: true });
    const reach = ease(seg(lt, 8.25, 9.2));
    const mood = emotions(lt, [[0, 'determined'], [10.7, 'hopeful', { lookY: -.8 }]]);
    let pose;
    if (lt < 10.6) pose = { view: 'side', walk: st.walk, dy: st.dy, aR: lerp(.4, 1.5, reach), aL: -.3 };
    else pose = { aL: lerp(-.3, 1.35, ease(seg(lt, 10.6, 11.4))), aR: 1.5, lookY: -.8 };
    const sl = (slopeY(x + 40) - slopeY(x - 40)) / 80;
    clawd(x, gy, u, { ...mood, ...pose, ...cw(t), rot: (pose.rot || 0) + Math.atan(sl) * .8 });
    [[90, 1], [175, 2], [255, 3]].forEach(([off, sd], i) => {
      const px = x - off, py = slopeY(px) + 16;
      puff(px, py, 12, t, sd, { smile: true, blush: groundMix(t) > .4 });
    });
    camEnd();
    wipeIn(lt, [PAL.sap, PAL.teal]);
  }

  // ============================================================ K · 110.25–118.25 · the launch and the burst
  function sBurst(t, lt, dur) {
    const u = 22, gy = 800;
    camBegin(1050, kf(lt, [[0, 340], [3.2, 300], [3.9, 470], [5.2, 560], [8, 545]]), kf(lt, [[0, 1.06], [4, 1.02], [8, 1.08]]));
    boilSeed('sky');
    paint(rectPts(-500, -300, W + 1000, H + 700), { wash: skyCol(t), ink: null });
    boilSeed('crest');
    paint(rectPts(-400, gy - 10, W + 800, 500, 3), { wash: groundCol(t), fill: mixCol(groundCol(t), PAL.ink, .25), fillOp: 80, bleed: .06, tex: .55, ink: mixCol(PAL.ink, skyCol(t), .3), sw: 1 });
    // the ember climbs from Clawd's hands, then IS the sun
    const sx = 1150, sy = 165;
    if (lt < 4) {
      const k = easeIn(seg(lt, .5, 3.25)), p = arcPt([920, gy - 9.8 * u], [sx, sy], -60, k);
      const P = []; for (let i = 5; i >= 1; i--) { const k2 = easeIn(seg(lt - i * .05, .5, 3.25)); P.push(arcPt([920, gy - 9.8 * u], [sx, sy], -60, k2)); }
      paint(ribbon(P, 2, 16), { wash: mixCol('#FFE9A8', skyCol(t), .4), ink: null });
      ember(p[0], p[1], lerp(24, 30, k), 1.1, { awake: true, smile: true });
      for (let i = 0; i < 3; i++) sparkle(p[0] + jit(26), p[1] + 30 + i * 26, 12 - i * 2, frac(lt * 2 + i / 3));
    } else {
      const bk = seg(lt, 4, 6);
      sunStar(sx, sy, lerp(52, 88, easeOut(bk)), t);
      ring(sx, sy, 30, 560, seg(lt, 4, 5.4), '#FFE9A8', 2);
      ring(sx, sy, 20, 850, seg(lt, 4.15, 6), '#FFD96A', 1.2);
      const flood = seg(lt, 4.1, 6.6);
      if (flood > 0 && flood < 1) paint(ellPts(sx, sy, 1900 * easeOut(flood), 1500 * easeOut(flood), 30), { wash: '#E8AA38', washOp: 60 * (1 - flood), ink: null });
    }
    // the company below
    const mood = emotions(lt, [[0, 'hopeful', { lookY: -.8 }], [4.1, 'starstruck'], [5.6, 'excited']]);
    const cheer = lt > 5.4;
    const mv = cheer ? move('bounce', t) : {};
    clawd(900, gy, u, { ...mood, ...cw(t), ...(cheer ? mv : { dy: -.5 * pulse(t), aL: 1.45, aR: 1.45 }), view: cheer ? 'front' : 'q', lookY: cheer ? 0 : -.8 });
    [[-180, 1.3], [240, 2.6], [330, 3.9]].forEach(([off, sd]) => {
      puff(900 + off, gy + 2, 12, t, sd, { smile: true, blush: true, hop: cheer ? 1.6 : .35, lookX: cheer ? 0 : -.6 });
    });
    camEnd();
    if (lt > 3.95) flash((lt < 4.05 ? seg(lt, 3.95, 4.05) : clamp(1 - (lt - 4.05) / 1.1)) * .72, '#FFF3D8');
    wipeOut(lt, dur, ['#E8AA38', '#F3EBDC']);
  }

  // ============================================================ L · 118.25–134.25 · golden
  function sGolden(t, lt, dur) {
    const gy = 840;
    camBegin(950 + 20 * Math.sin(lt * .5), 560, 1.14);
    boilSeed('sky');
    paint(rectPts(-500, -300, W + 1000, H + 700), { wash: skyCol(t), ink: null });
    boilSeed('cloudw');
    paint(ellPts(500, 200, 420, 80, 24, 8), { fill: mixCol('#F3D9A8', '#FFF', .2), fillOp: 90, bleed: .3, tex: .4, border: 0, ink: null });
    sunStar(1480, 205, 80, t);
    ring(1480, 205, 100, 1100, frac(lt / 14), '#FFD96A', .8);   // the motif, one slow ripple
    boilSeed('top');
    paint(rectPts(-400, gy - 12, W + 800, 460, 3), { wash: groundCol(t), fill: mixCol(groundCol(t), PAL.ochre, .3), fillOp: 70, bleed: .08, tex: .55, ink: mixCol(PAL.ink, PAL.ochre, .4), sw: 1 });
    for (let i = 0; i < 3; i++) fir(160 + i * 760, gy + 6, 210 + 40 * hash(i), mixCol('#2E4A44', PAL.sap, .8), 0);
    // long morning shadows
    boilSeed('shad');
    paint(ellPts(700, gy + 10, 150, 14, 16), { fill: PAL.ink, fillOp: 45, bleed: .3, ink: null });
    paint(ellPts(1000, gy + 10, 90, 10, 14), { fill: PAL.ink, fillOp: 40, bleed: .3, ink: null });
    const settle = seg(lt, 12, 14.5);
    const style = lt < 4 ? 'bounce' : lt < 8 ? 'sway' : 'spin';
    const mv = lt < 12 ? move(style, t) : move('idle', t);
    const mood = emotions(lt, [[0, 'excited'], [8.2, 'laugh'], [12.6, 'happy', { lookY: -.5 }], [14.8, 'relieved']]);
    const tn = lt > 12.4 ? turn(lt, 12.4, 12.65, .25, .125) : {};
    clawd(780, gy, 26, { ...mood, ...mv, ...tn, ...cw(t), rot: (mv.rot || 0) + (tn.rot || 0) });
    [[1000, 1.3, 'hop'], [1130, 2.6, 'bounce'], [600, 3.9, 'shimmy']].forEach(([px, sd, sty], i) => {
      const big = i === 1 && lt > 8 && lt < 9.6 ? 1.9 : 1;
      puff(px, gy + 2, 12, t, sd, { smile: true, blush: true, hop: big, lookX: lt > 12 ? .8 : 0 });
    });
    for (let i = 0; i < 3; i++) { boilSeed('mote' + i); const p = frac(lt / 9 + i / 3); sparkle(400 + hash(i) * 1100, 700 - p * 300, 10, p * 1.6 - .3, i * 2); }
    camEnd();
    wipeIn(lt, ['#E8AA38', '#F3EBDC']);
    wipeOut(lt, dur, ['#F3EBDC', '#E8B05C']);
  }

  // ============================================================ M · 134.25–153.75 · passing it on
  function sPassOn(t, lt, dur) {
    camBegin(920 + 14 * Math.sin(t * .22), 560, 1 + .012 * lt);   // the opening drift, rhymed
    hillWorld(t, 1);
    sunStar(1480, 205, 66, t);   // the ember, home in the sky
    sunGlint();
    leaf(540, hillY(540), 300, 1);
    const gy = hillY(700), u = 21;
    // the far grey corner: one hill that the dawn has not reached
    boilSeed('grey');
    paint(ellPts(40, 745, 250, 110, 24, 3), { wash: mixCol('#31465F', '#4A6B5E', .25), fill: '#2A3054', fillOp: 80, bleed: .18, tex: .5, border: 0, ink: mixCol(PAL.ink, '#262B50', .5), sw: .9 });
    // the puffs: two awake, one dozing under the leaf (the leaf now shelters someone else)
    puff(475, gy + 4, 12, t, 1.3, { smile: true, blush: true });
    puff(920, gy + 8, 12, t, 2.6, { smile: true, blush: true, lookX: lt > 6 ? -0.9 : 0 });
    puff(585, gy + 8, 12, t, 3.9, { sleep: lt < 13, smile: lt > 13.6, lookX: lt > 13.6 ? -.8 : 0 });
    // Clawd notices the grey, grows a spark of its own, and sends it
    const mood = emotions(lt, [[0, 'happy'], [5.2, 'thinking', { lookX: -.9, emote: 'dots' }], [7.6, 'hopeful', { lookX: -.7 }],
      [13.4, 'love'], [16.5, 'hopeful', { lookX: -.9 }]]);
    const handUp = ease(seg(lt, 7.6, 8.6)), present = ease(seg(lt, 10.8, 11.8)), waving = lt > 13.2;
    let aR = lerp(lerp(mood.aR ?? .2, -1.25, handUp), .85, present), aL = lerp(mood.aL ?? .2, .8, present);
    if (waving) { aL = 1.15 + .45 * Math.sin(bpOf(t) * TAU * 2); aR = .85; }
    clawd(700, gy, u, { ...mood, ...cw(t), aL, aR });
    if (lt < 13) { boilSeed('zzz'); emote('zzz', 545, gy - 6 * u, 15, 1, lt); }   // the dozing puff's zzz, clear of Clawd
    // the new spark: born at the chest on 141+, tossed left on the bar at 147.25, lands ~150
    const born = backOut(seg(lt, 8.6, 10.8));
    const chest = chestAt(700, gy, u, 0, 0);
    const hover = [chest[0] - 230 * born, chest[1] - 90 * born];
    let sp = null;
    if (lt > 8.6 && lt < 13) { sp = hover; ember(sp[0], sp[1], lerp(6, 11, born), .55 * born + .1 * Math.sin(T * 3), { awake: lt > 10.5 }); }
    else if (lt >= 13 && lt < 16.4) {
      const k = ease(seg(lt, 13, 16.2)), p = arcPt(hover, [110, 700], 160, k);
      sp = p;
      const P = []; for (let i = 5; i >= 1; i--) P.push(arcPt(hover, [110, 700], 160, ease(seg(lt - i * .06, 13, 16.2))));
      paint(ribbon(P, 2, 8), { wash: mixCol('#FFE9A8', skyCol(t), .55), ink: null });
      ember(p[0], p[1], lerp(11, 5, k), .6 - .15 * k, { awake: true });
    } else if (lt >= 16.4) {
      const k = seg(lt, 16.4, 17.4);
      glow(110, 700, 30 + 60 * k, '#FFD96A', .8 * k);
      ember(110, 700, 5 + 2 * k, .5 + .2 * k, { awake: true, smile: k > .5 });
      paint(ellPts(40, 745, 250 * (1 + k * .2), 110, 24, 3), { wash: mixCol('#31465F', '#C9903F', .18 * k), fill: mixCol('#2A3054', '#E8AA38', .2 * k), fillOp: 80 * (1 - k * .5), bleed: .18, tex: .5, border: 0, ink: null });
    }
    function sunGlint() { const p = frac(lt / 3.1); sparkle(1480 - 200 * Math.sin(lt * .4), 240, 12, p * 1.4 - .2, lt); }
    camEnd();
    wipeIn(lt, ['#F3EBDC', '#E8B05C']);
    const eye = toScreen(110, 700);
    if (lt > 17.8) {
      const r = lt < 18.7 ? lerp(1500, 200, ease(seg(lt, 17.8, 18.7))) : lt < 19.15 ? 200 : lerp(200, 0, easeIn(seg(lt, 19.15, 19.42)));
      iris(...eye, r);
    }
  }

  shots(BARS.map((b, i) => [b[0], [sAlone, sWhisper, sFollow, sGutter, sStorm, sShelter, sHush, sRevive, sFriends, sClimb, sBurst, sGolden, sPassOn][i]]));
})();
