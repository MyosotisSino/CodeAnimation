// config.js — 两部片子共用一个仓库，PART 由入口 html 决定：studio.html = 第一部，studio2.html = 第二部。
// 时长/拍速/首拍/音频都在这里，场景文件不再各自假设。
const PART = window.PART || 1;
const PROJECT = PART === 1
  ? { duration: 335.1, bpm: 128, offset: .25, audio: 'assets/sacred_padded.m4a' }   // 《雪夜灯火》5:35
  : { duration: 153.75, bpm: 120, offset: .25, audio: 'assets/song.mp3' };           // 《最后一棵树》2:34
