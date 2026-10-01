import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import LivePlayer from "../components/player/LivePlayer";
import { getLiveRoom } from "../services/liveApi";
import type { LiveRoom } from "../types/liveRoom";
import { connectToRoom, disconnectFromRoom } from "../services/roomSocket";

const LiveRoomPage = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    const socketRef = useRef<WebSocket | null>(null);
    const [room, setRoom] = useState<LiveRoom | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const closeRoomConnection = useCallback(() => {
        const socket = socketRef.current;
        if (!socket) {
            return;
        }
        disconnectFromRoom(socket);
        socketRef.current = null;
    }, []);

    const loadRoom = useCallback(async (signal: AbortSignal) => {
        if (!id) {
            setError('Missing room id');
            setLoading(false);
            return;
        }
        try {
            const data = await getLiveRoom(id, signal);
            if (!signal.aborted) {
                setRoom(data);
            }
        } catch (error) {
            if (signal.aborted) {
                return;
            }
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to load room');
            }
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    }, [id]);

    useEffect(() => {
        if (!room || room.id !== id) {
            return;
        }

        socketRef.current = connectToRoom(room.id);

        return () => {
            closeRoomConnection();
        }
    }, [id, room, closeRoomConnection]);

    useEffect(() => {
        const liveController = new AbortController();
        loadRoom(liveController.signal);
        return () => {
            liveController.abort();
        }
    }, [loadRoom]);

    if (loading) {
        return <div>Loading...</div>
    }

    if (error) {
        return <div>{error}</div>
    }

    if (!room) {
        return <div>Room not found</div>
    }

    return (
        <main>
            <h1>{room.title}</h1>
            <p>主播：{room.anchorName}</p>
            <p>在线：{room.viewerCount}</p>
            <LivePlayer
                type={room.sourceType}
                url={room.playUrl}
                mode={room.mode}
                startedAt={room.startedAt}
            />
        </main>
    )
}


export default LiveRoomPage;