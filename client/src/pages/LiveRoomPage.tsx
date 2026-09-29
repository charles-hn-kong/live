import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import LivePlayer from "../components/player/LivePlayer";
import { getLiveRoom } from "../services/liveApi";
import type { LiveRoom } from "../types/liveRoom";

const LiveRoomPage = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    const [room, setRoom] = useState<LiveRoom | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadRoom();
    }, [id]);

    const loadRoom = async () => {
        if (!id) {
            setError('Missing room id');
            setLoading(false);
            return;
        }
        try {
            const data = await getLiveRoom(id);
            setRoom(data);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to load room');
            }
        } finally {
            setLoading(false);
        }
    }

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
            />
        </main>
    )
}


export default LiveRoomPage;