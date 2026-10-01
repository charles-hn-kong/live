import Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';

type IProps = {
    url: string;
}

type PlayerStatus = 'loading' | 'playing' | 'buffering' | 'paused' | 'error';

const HlsPlayer = (props: IProps) => {
    const MAX_LIVE_DELAY = 5;
    const {url} = props;
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<PlayerStatus>('loading');

    useEffect(() => {
        const video = videoRef.current;
        if (!url || !video) {
            return;
        }

        if (!Hls.isSupported()) {
            setStatus('error');
            setError('current brower does not support Hls');
            return;
        }

        setError(null);
        setStatus('loading');

        const hls = new Hls({
            liveSyncDuration: 3,
            liveMaxLatencyDuration: 8
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
                hls.destroy();
                setStatus('error');
                setError('live stream playback failed');
                // VS Code 内置浏览器曾出现 mediaSourceRequiresReset 致命错误，Chrome 播放正常；记录详情用于排查媒体兼容性及后续恢复处理。
                // Observed a fatal mediaSourceRequiresReset error in VS Code's integrated browser while playback worked in Chrome; log details to investigate media compatibility and recovery.
                console.error('Hls Play error', {
                    type: data.type,
                    details: data.details,
                    fatal: data.fatal,
                    reason: data.reason,
                    error: data.error
                })
            }
        });
        hls.on(Hls.Events.LEVEL_UPDATED, handleLevelUpdated);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
            hls.off(Hls.Events.LEVEL_UPDATED, handleLevelUpdated);
            hls.destroy();
            hlsRef.current = null;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            video.removeEventListener('timeupdate', handleTimeUpdate);
        }
    }, [url]);

    const syncToLiveEdge = () => {
        const video = videoRef.current;
        if (!hlsRef.current || !video) return;
        const livePosition = hlsRef.current.liveSyncPosition;
        if (livePosition === null) {
            return;
        }
        
        if (hlsRef.current.latency > MAX_LIVE_DELAY) {
            video.currentTime = livePosition;
        }
    }

    const handleVisibilityChange = () => {
        if (!hlsRef.current || !videoRef.current) {
            return;
        }

        if (document.visibilityState !== 'visible') {
            return;
        }
        syncToLiveEdge();

        videoRef.current.play();
    }

    const handleTimeUpdate = () => {
        syncToLiveEdge();
    }

    const handleLevelUpdated = () => {
        syncToLiveEdge();
    };

    return (
        <div>
            <video 
                ref={videoRef} 
                autoPlay
                muted
                playsInline
                style={{
                    width: '100%',
                    background: '#000000'
                }}
                onPlaying={() => {
                    setStatus('playing');
                }}
                onWaiting={() => {
                    if (!error) {
                        setStatus('buffering');
                    }
                }}
                onPause={() => {
                    if (!error) {
                        setStatus('paused');
                    }
                }}
            />
            <div>
                {status === 'loading' && <p>直播加载中。。。</p>}
                {status === 'buffering' && <p>正在缓冲。。。</p>}
                {status === 'paused' && <p>播放已暂停</p>}
                {status === 'error' && error && <p>{error}</p>}
                
            </div>
        </div>
    )
}

export default HlsPlayer;