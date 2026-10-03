# CharlesLive

为求职准备，重新梳理直播播放、伪直播同步和实时互动的实现。前端 React + TypeScript + Vite，后端 Express + TypeScript + ws。

## 开发进度

### Day 01

- 完成直播间列表、详情页和对应接口。
- 接通 OBS → RTMP → MediaMTX → HLS 播放。
- 加入直播延迟校准，切回前台后追赶直播进度。

### Day 02

- 增加播放器加载、缓冲和错误提示。
- 接入游戏、旅行、音乐三个 MP4 房间。
- 按 `startedAt` 同步伪直播进度，支持循环播放和返回前台校准。
- 接入 WebSocket，支持加入、切换房间和断开清理。
- 完成服务端房间连接数统计与人数广播，双标签验证人数变化。
- 集中管理接口地址，切换房间时取消旧请求。

### Day 03

- 页面接入实时在线人数，连接断开时清空显示。
- 增加昵称、评论输入和发送，复用房间 WebSocket。
- 前后端校验评论，服务端按房间广播，页面实时更新列表。
- 页面保留最近 100 条评论，换房时清空评论、正文和发送提示。

### Day 04

- 复用评论消息，在播放器上显示滚动弹幕。
- 使用 `requestAnimationFrame` 驱动三条固定轨道，从右向左播放。
- 复用弹幕节点，待播队列最多保留 20 条。
- 换房时重建弹幕层，退出时取消动画任务。

## 项目结构

```text
CharlesLive/
├── client/                 # React + Vite 前端
│   └── src/
│       ├── components/player/  # HLS / MP4 播放器
│       ├── components/danmaku/ # 弹幕层与样式
│       ├── pages/              # 列表页、直播间页
│       └── services/           # HTTP 请求、WebSocket 连接与地址配置
├── server/                 # Express 后端
│   └── src/
│       ├── data/               # 临时直播间数据
│       ├── routes/             # HTTP 路由
│       └── services/           # 房间查询、连接管理、人数与评论广播
└── README-OBS-MediaMTX-local.md  # OBS + MediaMTX 本地推流说明
```

## 本地启动

Node.js 20.19+（20.x）或 22.12+。

先启动后端：

```bash
cd server
npm install
npm run dev
```

再开一个终端启动前端：

```bash
cd client
npm install
npm run dev
```

前端默认打开 Vite 显示的地址；后端默认监听 `http://localhost:3000`。

MP4 素材放在 `client/public/videos/`，文件名为 `game.mp4`、`travel.mp4`、`music.mp4`。

真实直播的推流配置见 [OBS + MediaMTX 本地部署](README-OBS-MediaMTX-local.md)。

## 接口

| 接口 | 用途 |
| --- | --- |
| `GET /api/health` | 健康检查 |
| `GET /api/rooms` | 获取直播间摘要列表 |
| `GET /api/rooms?id=1` | 获取某个直播间的完整信息（含播放地址） |

WebSocket：`ws://localhost:3000/ws`。支持 `join`、`comment` 消息，服务端返回加入结果，并向同房间广播人数和评论。

## 下一步

- 点赞聚合、礼物。
- 使用服务器时间校准伪直播进度。
- 断线重连、播放恢复与异常场景测试。
