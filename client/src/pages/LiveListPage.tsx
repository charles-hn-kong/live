import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getLiveRooms } from '../services/liveApi';
import type { LiveRoomSummary } from '../types/liveRoom';

const LiveListPage = () => {
    const [rooms, setRooms] = useState<LiveRoomSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getLiveRooms();
            setRooms(data);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>
    }

    return (
        <main>
            <h1>CharlesLive</h1>
            {rooms.length === 0 ? (
                <p>No live rooms</p>
            ) : (
                <div>
                    {rooms.map((room: LiveRoomSummary) => {
                        return <Link key={room.id} to={`/live?id=${room.id}`}>
                            <article>
                                <h2>{room.title}</h2>
                                <p>{room.anchorName}</p>
                                <p>{room.status === 'live' ? 'LIVE' : 'OFFLINE'}</p>
                                <p>{room.mode === 'live' ? 'Live' : 'Pseudo Live'}</p>
                            </article>
                        </Link>
                    })}
                </div>
            )}
        </main>
    )
}

export default LiveListPage;