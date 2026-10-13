# CodeAnimation

![Seed of The Light](stills/hero.jpg)

Hand-painted animation, drawn by code. No diffusion model, no image generator — every pixel on
screen is painted at render time by a p5.brush stroke engine.

The engine is separate from the films. A film is one scene file, one entry page and one config
row; the engine never learns what any of them are about.

## Seed of The Light

*a short film in two parts* · 8 min 09 s · 1920×1080 @ 24 fps · 11,732 frames

A light-bringer crosses a starving snow village and meets three men who sell light as bait — a
violet torch, a blue lantern, a green lamp. On the stump-field where the forest used to be, he
buries the one thing he has left. Years later, a city has grown up around the tree it became.

**Part One — Lanterns on a Snowy Night**

![Part One](stills/part-one.jpg)

**Part Two — The Last Tree**

![Part Two](stills/part-two.jpg)

Watch: <https://www.bilibili.com/video/BV1ahp96cEND/>

## How it works

**Every frame is a pure function of `t`.** That one rule implies the rest of the engine: frames
render out of order and in parallel, so `Math.random()` is banned outright — paper grain, stroke
wobble and body tremor all derive from `hash(floor(t*24))`. Any frame can be re-rendered alone,
which is why fixing one shot costs one shot and not one film.

The hand-drawn look is not a texture. p5.brush simulates pencil and watercolour edges, bleed and
grain, and outlines "boil" on the beat: animation tremor, not noise. Cuts land on bar lines and
walk cycles are locked to the music.

Light obeys one rule — every source goes through the same entry point and must fall on something.
No light in these films illuminates nothing.

## Layout

    src/
      core.js        stroke + fill primitives, paper texture, camera transform
      clawd.js       the character: 5 views, mouth/eye/posture/light layers, expression table, gait
      props.js       prop library: trees, lanterns, torches, snow, glows, face light
      jobs.js        costumes: one body, dressed as villager, huckster, thief, lumberjack, santa
      timeline.js    maps each shot on the time axis to a scene function
      config.js      per-film duration / bpm / first beat / audio
      scenes/
        film.js      film-agnostic helpers: sky, ground, snow, captions, transitions
        snow.js      Part One          tree.js      Part Two
    render.mjs       headless Chrome renderer: contact sheets, frame batches, encode
    templates/       the character and prop sheets every asset was checked against
    stills/          frames from the finished film

## Quick start

    npm install        # p5, p5.brush, puppeteer-core  (needs Chrome; ffmpeg on PATH to encode)

    node render.mjs --sheet=0,20,40,60 --out=out/sheet.jpg     # look at some moments
    node render.mjs --strip=239:240 --out=out/strip.jpg        # every frame in a stretch
    node render.mjs --frames --range=0:335.1 --workers=4       # render frames (resumable)
    node render.mjs --encode --out=out/part-one.mp4            # frames -> mp4

Pass `--studio=studio2.html` for Part Two, and `--audio=<file>` to `--encode` to mux sound.

## Making a new film

1. Write a scene file in `src/scenes/` and hook its shots up through `timeline.js`.
2. Copy an entry page, set `window.PART`, and load only your scene file.
3. Add a `{ duration, bpm, offset, audio }` row for that `PART` in `src/config.js`.

`core`, `clawd`, `props` and `jobs` stay untouched. If a new film needs a new prop or expression,
it goes into the library — the library is meant to grow.

## Docs

- `docs/ANIMATION_GUIDE.md` — the rule set: composition, light, scale, continuity, what counts as a bug
- `docs/MV_WORKFLOW.md` — the end-to-end process from a song to a finished film
- `docs/SCRIPT_V3.md` — shot-by-shot script of this film

## Credits

Animated by **Zhongzheng Bao**. The engine builds on
[ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) by John Heibel; both are
MIT licensed, see [LICENSE](LICENSE). Fonts are Caveat, Patrick Hand and Homemade Apple (SIL OFL),
in `assets/fonts/`.
