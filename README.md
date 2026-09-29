# CharlesLive · Day 01

Day 01 完成了一个直播网站的最小可运行版本：可以获取直播间列表、进入指定直播间，并按视频源类型播放 HLS 或 MP4 内容。

## 当前功能

- 服务端提供健康检查、直播间列表和直播间详情接口。
- 列表接口不会返回播放地址，避免在列表页暴露不需要的数据。
- 前端包含直播间列表页和直播间播放页。
- 使用 `hls.js` 播放 HLS 直播流，处理直播延迟过大及页面从后台回到前台时的追赶逻辑。
- 支持 MP4 伪直播数据模型，为后续根据 `startedAt` 计算播放进度做准备。

## 项目结构

```text
CharlesLive/
├── client/                 # React + Vite 前端
│   └── src/
│       ├── components/player/  # HLS / MP4 播放器
│       ├── pages/              # 列表页、直播间页
│       └── services/           # 后端接口请求
├── server/                 # Express 后端
│   └── src/
│       ├── data/               # 临时直播间数据
│       ├── routes/             # HTTP 路由
│       └── services/           # 直播间查询逻辑
└── README-OBS-MediaMTX-local.md  # OBS + MediaMTX 本地推流说明
```

## 本地启动

需要 Node.js 20 或更高版本。

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

## 接口

| 接口 | 用途 |
| --- | --- |
| `GET /api/health` | 健康检查 |
| `GET /api/rooms` | 获取直播间摘要列表 |
| `GET /api/rooms?id=1` | 获取某个直播间的完整信息（含播放地址） |

## 下一步

- 让 MP4 伪直播按 `startedAt` 自动跳到当前进度。
- 增加封面、列表样式和直播状态展示。
- 用数据库替代内存中的演示数据。
- 接入鉴权、开播/关播状态与真实在线人数。
