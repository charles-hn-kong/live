import type { LiveRoom } from "../types/liveRoom";

export const rooms: LiveRoom[] = [
  {
    id: "1",
    title: "Charles Live",
    anchorName: "Charles",
    coverUrl: "/covers/charles.jpg",
    viewerCount: 126,
    status: "live",
    mode: "live",
    sourceType: "hls",

    // 后面重新启动 OBS + MediaMTX 后，这个地址就是真直播地址
    playUrl: "http://localhost:8888/live/demo/index.m3u8",
  },

  {
    id: "2",
    title: "Game Live",
    anchorName: "Justin",
    coverUrl: "/covers/game.jpg",
    viewerCount: 88,
    status: "live",
    mode: "pseudo",
    sourceType: "mp4",
    playUrl: "/videos/game.mp4",

    // 伪直播以后会根据这个时间计算当前应该播放到第几秒
    startedAt: "2026-09-29T10:00:00+08:00",
  },

  {
    id: "3",
    title: "Travel Live",
    anchorName: "Amy",
    coverUrl: "/covers/travel.jpg",
    viewerCount: 63,
    status: "live",
    mode: "pseudo",
    sourceType: "mp4",
    playUrl: "/videos/travel.mp4",
    startedAt: "2026-09-29T10:00:00+08:00",
  },

  {
    id: "4",
    title: "Music Live",
    anchorName: "Jack",
    coverUrl: "/covers/music.jpg",
    viewerCount: 35,
    status: "live",
    mode: "pseudo",
    sourceType: "mp4",
    playUrl: "/videos/music.mp4",
    startedAt: "2026-09-29T10:00:00+08:00",
  },
];