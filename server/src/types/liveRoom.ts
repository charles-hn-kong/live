export type LiveMode = 'live' | 'pseudo';

export type LiveSourceType = 'hls' | 'mp4';

export type LiveStatus = 'live' | 'offline';

export type LiveRoom = {
    id: string;
    title: string;
    anchorName: string;
    coverUrl: string;
    viewerCount: number;
    status: LiveStatus;
    mode: LiveMode;
    sourceType: LiveSourceType;
    playUrl: string;
    startedAt?: string;
}

export type LiveRoomSummary = Omit<LiveRoom, 'playUrl' | 'startedAt'>;