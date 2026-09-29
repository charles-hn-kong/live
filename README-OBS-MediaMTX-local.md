# OBS + MediaMTX 本地直播部署

这份说明用于把 OBS 的画面推到本机 MediaMTX，并让 CharlesLive 通过 HLS 播放。当前项目中直播间 `id=1` 的播放地址已经指向：

```text
http://localhost:8888/live/demo/index.m3u8
```

## 1. 启动 MediaMTX

最省事的方式是 Docker。先确认 Docker Desktop 正在运行，再执行：

```bash
docker run --rm -it \
  -p 1935:1935 \
  -p 8888:8888 \
  -p 8889:8889 \
  bluenviron/mediamtx:latest
```

端口用途：

| 端口 | 协议 | 用途 |
| --- | --- | --- |
| `1935` | RTMP | OBS 推流入口 |
| `8888` | HLS | 浏览器播放入口 |
| `8889` | WebRTC | 可选的低延迟播放入口 |

终端保持运行，看到 MediaMTX 的启动日志后继续下一步。

## 2. 配置 OBS

在 OBS 中打开“设置 → 直播”，填写：

| 字段 | 值 |
| --- | --- |
| 服务 | 自定义… |
| 服务器 | `rtmp://localhost:1935/live` |
| 串流密钥 | `demo` |

保存后点击“开始直播”。此时完整推流地址等价于：

```text
rtmp://localhost:1935/live/demo
```

## 3. 验证 HLS 输出

OBS 开播几秒后，浏览器打开：

```text
http://localhost:8888/live/demo/index.m3u8
```

看到播放清单文本或被播放器识别，说明 MediaMTX 已收到推流。然后启动 CharlesLive 的前后端，在列表中进入 `Charles Live` 房间即可播放。

## 常见问题

### 页面提示无法播放 HLS

1. 确认 MediaMTX 终端没有报错，且 OBS 状态栏显示正在直播。
2. 确认 OBS 的服务器是 `rtmp://localhost:1935/live`，串流密钥是 `demo`。
3. 直接打开 HLS 地址，确认路径中的 `live/demo` 与推流路径一致。
4. 确认前端播放器地址仍是 `http://localhost:8888/live/demo/index.m3u8`。

### Docker 端口已被占用

检查并停止占用 `1935`、`8888` 或 `8889` 端口的程序，再重新执行启动命令。若改用了其他端口，也要同步修改 OBS 推流地址和 `server/src/data/rooms.ts` 中的 `playUrl`。

### 浏览器播放时有一点延迟

HLS 会以稳定性换取一定延迟。项目播放器会在延迟超过 5 秒时跳回直播边缘；若后续需要更低延迟，可考虑使用 MediaMTX 的 WebRTC 输出。

## 停止服务

- 在 OBS 点击“停止直播”。
- 在 MediaMTX 的终端按 `Ctrl + C`；使用上面的 `--rm` 参数时，容器会自动移除。
