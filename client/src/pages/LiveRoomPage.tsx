import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { LiveRoom, RoomComment } from "../types/liveRoom";
import DanmakuLayer from "../components/danmaku/DanmakuLayer";

import LivePlayer from "../components/player/LivePlayer";
import { getLiveRoom } from "../services/liveApi";
import { connectToRoom, disconnectFromRoom, sendRoomComment } from "../services/roomSocket";

const LiveRoomPage = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    const socketRef = useRef<WebSocket | null>(null);
    const [room, setRoom] = useState<LiveRoom | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewerCount, setViewerCount] = useState<number | null>(null);
    const [comments, setComments] = useState<RoomComment[]>([]);;
    const [nickname, setNickname] = useState('');
    const [commentContent, setCommentContent] = useState('');
    const [commentError, setCommentError] = useState<string | null>(null);

    const handleSendComment = () => {
        setCommentError(null);
        const socket = socketRef.current;
        if (!socket) {
            setCommentContent('not connection room, try agin');
            return;
        }

        try {
            sendRoomComment(socket, nickname, commentContent);
            setCommentContent('');
        } catch (error) {
            if (error instanceof Error) {
                setCommentError(error.message);
            } else {
                setCommentError('comment send fail');
            }
        }
    }

    const handleComment = useCallback((comment: RoomComment) => {
        setComments((previous) => [...previous, comment].slice(-100));
    }, [])

    const closeRoomConnection = useCallback(() => {
        const socket = socketRef.current;
        if (!socket) {
            return;
        }
        disconnectFromRoom(socket);
        socketRef.current = null;
    }, []);

    const loadRoom = useCallback(async (signal: AbortSignal) => {
        setError(null);
        setLoading(true);
        setRoom(null);

        if (!id) {
            setError('Missing room id');
            setLoading(false);
            setRoom(null);
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

        setComments([]);
        setCommentContent('');
        setCommentError(null);


        socketRef.current = connectToRoom(room.id, setViewerCount, handleComment);

        return () => {
            closeRoomConnection();
        }
    }, [id, room, closeRoomConnection, handleComment]);

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
            <p>UP：{room.anchorName}</p>
            <p>Line：{viewerCount ?? '-'}</p>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                <LivePlayer
                    type={room.sourceType}
                    url={room.playUrl}
                    mode={room.mode}
                    startedAt={room.startedAt}
                />
                <DanmakuLayer key={room.id} comments={comments} />
            </div>
            <section>
                <h2>Commentz</h2>

                <div>
                    <label>
                        nickname：
                        <input
                            type="text"
                            value={nickname}
                            maxLength={20}
                            placeholder="enter nickname"
                            onChange={(event) => {
                                setNickname(event.target.value);
                            }}
                        />
                    </label>
                </div>

                <div>
                    <label>
                        comment：
                        <input
                            type="text"
                            value={commentContent}
                            maxLength={200}
                            placeholder="speak something"
                            onChange={(event) => {
                                setCommentContent(event.target.value);
                            }}
                        />
                    </label>

                    <button
                        type="button"
                        onClick={handleSendComment}
                    >
                        发送
                    </button>
                </div>

                {commentError && (
                    <p role="alert">{commentError}</p>
                )}

                {comments.length === 0 && <p>not comment</p>}

                <ul>
                    {comments.map((comment) => (
                        <li key={comment.id}>
                            <span>{comment.nickname}：</span>
                            <span>{comment.content}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    )
}


export default LiveRoomPage;