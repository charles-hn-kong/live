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

### Day 05

- 点赞按 500ms 合并发送，单批最多 100 次，服务端累计并广播。
- 接入 Flower、Heart、Rocket 三种礼物，HTTP 提交后通过 WebSocket 按房间广播，页面展示礼物记录。
- 评论和礼物共用昵称，输入框移到播放器下方，界面提示统一为英文。
- 播放器适配手机和桌面，限制最大尺寸；调整礼物区布局，发送时保持位置稳定。

### Day 06

- 增加服务器时间接口，伪直播按服务器时间校准进度。
- 补偿请求耗时，切回前台重新校时，退出时取消请求。

### Day 07

- WebSocket 断线后按 1、2、4、8、10 秒间隔重连，加入成功后恢复互动。
- 增加前后端心跳检测和加入超时，清理失效连接并触发重连。
- 退出房间时取消重连、心跳和点赞定时任务。

## 项目结构

```text
CharlesLive/
├── client/                 # React + Vite 前端
│   └── src/
│       ├── components/player/  # HLS / MP4 播放器
│       ├── components/danmaku/ # 弹幕层与样式
│       ├── components/gift/    # 礼物面板与样式
│       ├── pages/              # 列表页、直播间页
│       └── services/           # HTTP 请求、WebSocket 连接与地址配置
├── server/                 # Express 后端
│   └── src/
│       ├── data/               # 临时直播间数据、礼物列表
│       ├── routes/             # HTTP 路由
│       └── services/           # 房间查询、连接管理与互动消息广播
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
| `GET /api/time` | 获取服务器时间，校准伪直播进度 |
| `GET /api/rooms` | 获取直播间摘要列表 |
| `GET /api/rooms?id=1` | 获取某个直播间的完整信息（含播放地址） |
| `GET /api/gifts` | 获取礼物列表 |
| `POST /api/gifts` | 提交礼物并广播房间消息 |

WebSocket：`ws://localhost:3000/ws`。支持 `join`、`comment`、`like` 消息，服务端返回加入结果，并向同房间广播人数、评论、点赞数和礼物。前端发送 `ping` 检测连接，服务端回复 `pong`。

## 下一步

H5 部分先告一段落，不再增加功能。

下一阶段用 Swift + SwiftUI 做 iOS 原生推流端，先完成相机、麦克风权限、画面预览和开始／停止推流，复用现有 MediaMTX 播放链路。
