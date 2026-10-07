import { useCallback, useEffect, useRef, useState } from 'react';
import type { LiveMode } from '../../types/liveRoom';
import { getServerClock, type ServerClock } from '../../services/timeApi';

type IProps = {
    url: string;
    mode: LiveMode;
    startedAt?: string;
}

const Mp4Player = (props: IProps) => {
    const { url, mode, startedAt } = props;
    const videoRef = useRef<HTMLVideoElement>(null);
    const serverClockRef = useRef<ServerClock | null>(null);
    const timeControllerRef = useRef<AbortController | null>(null);
    const [syncError, SetSyncError] = useState<string | null>(null);

    const syncToRoomTime = useCallback(() => {
        const video = videoRef.current;
        const clock = serverClockRef.current;

        if (!video || !clock || mode !== 'pseudo' || !startedAt) {
            return;
        }

        const startTime = Date.parse(startedAt);
        const duration = video.duration;

        if (!Number.isFinite(startTime) || !Number.isFinite(duration) || duration <= 0) {
            return;
        }

        const passedMs = performance.now() - clock.measuredAt;
        const serverNow = clock.serverTime + passedMs;
        const elapsed = (serverNow - startTime) / 1000;

        if (elapsed < 0) {
            return;
        }

        video.currentTime = elapsed % duration;
    }, [mode, startedAt]);

    const loadServerClock = useCallback(async () => {
        timeControllerRef.current?.abort();
        const controller = new AbortController();
        timeControllerRef.current = controller;
        serverClockRef.current = null;
        SetSyncError(null);
        try {
            const clock = await getServerClock(controller.signal);
            if (controller.signal.aborted) {
                return;
            }
            serverClockRef.current = clock;
            syncToRoomTime();
            ;
        } catch (error) {
            if (controller.signal.aborted) {
                return;
            }
            SetSyncError(error instanceof Error ? error.message : 'time sync failed');
        } finally {
            if (timeControllerRef.current === controller) {
                timeControllerRef.current = null
            }
        }
    }, [syncToRoomTime]);

    const handleVisibilityChange = useCallback(() => {
        const video = videoRef.current;
        if (document.visibilityState !== 'visible' || !video) {
            return;
        }

        loadServerClock();

        video.play().catch(error => {
            console.error('failed to resume pseudo-live playback', error);
        });
    }, [loadServerClock]);


    useEffect(() => {
        const video = videoRef.current;
        if (!url || !video || mode !== 'pseudo') {
            return;
        }
        video.addEventListener('loadedmetadata', syncToRoomTime);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        loadServerClock();
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            video.removeEventListener('loadedmetadata', syncToRoomTime);
            timeControllerRef.current?.abort();
            timeControllerRef.current = null;
            serverClockRef.current = null;
        }
    }, [url, mode, syncToRoomTime, loadServerClock, handleVisibilityChange]);

    return (
        <>
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
            {syncError && (
                <div className="player-status">
                    <p role="alert">{syncError}</p>
                </div>
            )}
        </>
    );
}

export default Mp4Player;
