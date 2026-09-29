import Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';

type IProps = {
    url: string;
}

const HlsPlayer = (props: IProps) => {
    const MAX_LIVE_DELAY = 5;
    const {url} = props;
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!url || !video) {
            return;
        }

        if (!Hls.isSupported()) {
            setError('current brower does not support Hls');
            return;
        }

        setError(null);

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
                setError('live stream playback failed');
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
                controls
                autoPlay
                muted
                playsInline
                style={{
                    width: '100%',
                    background: '#000000'
                }}
            />
            {error && <p>{error}</p>}
        </div>
    )
}

export default HlsPlayer;