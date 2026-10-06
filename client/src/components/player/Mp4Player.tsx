import { useEffect, useRef } from 'react';
import type { LiveMode } from '../../types/liveRoom';

type IProps = {
    url: string;
    mode: LiveMode;
    startedAt?: string;
}

const Mp4Player = (props: IProps) => {
    const {url, mode, startedAt} = props;
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        const video = videoRef.current;
        if (!url || !video || mode !== 'pseudo') {
            return;
        }
        if (video.readyState >= 1) {
            syncToRoomTime();
        }
        document.addEventListener('visibilitychange', handleVisibilityChange);
        video.addEventListener('loadedmetadata', syncToRoomTime);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            video.removeEventListener('loadedmetadata', syncToRoomTime);
        }
    }, [url, mode, startedAt]);

    const syncToRoomTime = () => {
        const video = videoRef.current;
        if (!video || mode !== 'pseudo' || !startedAt) {
            return;
        }

        const startTime = Date.parse(startedAt);
        const duration = video.duration;

        if (!Number.isFinite(startTime) || !Number.isFinite(duration) || duration <= 0) {
            return;
        }

        const elapsed = (Date.now() - startTime) / 1000;

        if (elapsed < 0) {
            return;
        }

        video.currentTime = elapsed % duration;
    }

    const handleVisibilityChange= () => {
        const video = videoRef.current;
        if (document.visibilityState !== 'visible' || !video) {
            return;
        }
        syncToRoomTime();

        video.play().catch(error => {
            console.error('failed to resume pseudo-live playback', error);
        });
    } 



    return (
        <video
            key={`${url}-${mode}-${startedAt ?? ''}`}
            ref={videoRef}
            src={url}
            autoPlay
            muted
            playsInline
            loop={mode === 'pseudo'}
            className="live-player-video"
        />
    )
} 

export default Mp4Player;
