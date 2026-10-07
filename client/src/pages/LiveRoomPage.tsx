import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { LiveRoom, RoomComment, RoomGift } from "../types/liveRoom";
import DanmakuLayer from "../components/danmaku/DanmakuLayer";

import LivePlayer from "../components/player/LivePlayer";
import { getLiveRoom } from "../services/liveApi";
import { connectToRoom, disconnectFromRoom, sendRoomComment, sendRoomLike } from "../services/roomSocket";
import GiftPanel from "../components/gift/GiftPanel";
import "./LiveRoomPage.css";

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 10000]

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
    const pendingLikesRef = useRef<number>(0);
    const likeTimerRef = useRef<number | null>(null);
    const [likeCount, setLikeCount] = useState<number | null>(null);
    const [likeError, setLikeError] = useState<string | null>(null);
    const [giftQueue, setGiftQueue] = useState<RoomGift[]>([]);
    const reconnectTimerRef = useRef<number | null>(null);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'recconnecting'>('connecting');

    const handleGift = useCallback((gift: RoomGift) => {
        setGiftQueue((previous: RoomGift[]) => {
            if (previous.some((item: RoomGift) => item.id === gift.id)) {
                return previous;
            }
            return [...previous, gift];
        });
    }, []);

    const flushLikes = useCallback(() => {
        if (likeTimerRef.current !== null) {
            window.clearTimeout(likeTimerRef.current);
            likeTimerRef.current = null;
        }
        const count = pendingLikesRef.current;
        pendingLikesRef.current = 0;
        if (count === 0) {
            return;
        }
        const socket = socketRef.current;
        if (!socket) {
            setLikeError('the socket have been closed, try enter agin');
            return;
        }
        try {
            sendRoomLike(socket, count);
        } catch (error) {
            if (error instanceof Error) {
                setLikeError(error.message);
            } else {
                setLikeError('send like fail');
            }
        }
    }, []);

    const handleLike = () => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN || likeCount === null) {
            setLikeError('room have not ready, try agin');
            return;
        }
        setLikeError(null);
        pendingLikesRef.current += 1;
        if (pendingLikesRef.current >= 100) {
            flushLikes();
            return;
        }

        if (likeTimerRef.current !== null) {
            return;
        }

        likeTimerRef.current = window.setTimeout(flushLikes, 500);
    }

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
        if (reconnectTimerRef.current !== null) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (likeTimerRef.current !== null) {
            window.clearTimeout(likeTimerRef.current);
            likeTimerRef.current = null;
        }
        pendingLikesRef.current = 0;
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


    const handleRoomJoined = useCallback((socket: WebSocket) => {
        if (socketRef.current !== socket) {
            return;
        }
        setReconnectAttempt(0);
        setConnectionStatus('connected')
    }, []);

    const handleRoomClose = useCallback((socket: WebSocket) => {
        if (socketRef.current !== socket) {
            return;
        }
        socketRef.current = null;
        if (likeTimerRef.current !== null) {
            window.clearTimeout(likeTimerRef.current)
            likeTimerRef.current = null;
        }
        pendingLikesRef.current = 0;
        setConnectionStatus('recconnecting');
        setReconnectAttempt((previos) => previos + 1)
    }, []);

    const openRoomConnection = useCallback(() => {
        if (!room || room.id !== id || socketRef.current !== null) {
            return;
        }
        setConnectionStatus('connecting');
        socketRef.current = connectToRoom(
            room.id,
            setViewerCount,
            handleComment,
            setLikeCount,
            handleGift,
            handleRoomJoined,
            handleRoomClose
        );
    }, [id, room, handleComment, handleGift]);

    useEffect(() => {
        if (!room || room.id !== id) {
            return;
        }

        setViewerCount(null);
        setComments([]);
        setCommentContent('');
        setCommentError(null);
        setLikeCount(null);
        setLikeError(null);
        setGiftQueue([]);
        setReconnectAttempt(0);

        openRoomConnection();

        return () => {
            closeRoomConnection();
        }
    }, [id, room, openRoomConnection, closeRoomConnection]);

    useEffect(() => {
        const liveController = new AbortController();
        loadRoom(liveController.signal);
        return () => {
            liveController.abort();
        }
    }, [loadRoom]);

    useEffect(() => {
        if (
            connectionStatus !== 'recconnecting' ||
            reconnectAttempt === 0 ||
            !room ||
            room.id !== id
        ) {
            return;
        }

        const index = Math.min(
            reconnectAttempt - 1,
            RECONNECT_DELAYS.length - 1
        );
        const delay = RECONNECT_DELAYS[index];
        const timer = window.setTimeout(openRoomConnection, delay);
        reconnectTimerRef.current = timer;
        return () => {
            window.clearInterval(timer);
            if (reconnectTimerRef.current === timer) {
                reconnectTimerRef.current = null;
            }
        }
    }, [connectionStatus, reconnectAttempt, id, room, openRoomConnection]);

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
            <p>UP: {room.anchorName}</p>
            <p>Line: {viewerCount ?? '-'}</p>
            <p>Chat: {connectionStatus}</p>
            <div className="live-player-stage">
                <LivePlayer
                    type={room.sourceType}
                    url={room.playUrl}
                    mode={room.mode}
                    startedAt={room.startedAt}
                />
                <DanmakuLayer key={room.id} comments={comments} />
            </div>
            <div className="room-nickname">
                <label className="room-nickname-field">
                    <span>Nickname</span>
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
                <span className="room-nickname-hint">For chat and gifts</span>
            </div>
            <GiftPanel
                key={room.id}
                roomId={room.id}
                nickname={nickname}
                connected={connectionStatus === 'connected'} 
            />

            <section className="room-gift-list">
                <h2>Gift list</h2>
                <ul>
                    {giftQueue.length === 0 ? (
                        <li className="room-gift-empty">No gifts</li>
                    ) : giftQueue.map((gift) => (
                        <li key={gift.id}>
                            {gift.giftIcon} {gift.nickname} sent {gift.giftName}
                        </li>
                    ))}
                </ul>
            </section>
            <section>
                <p>Likes: {likeCount ?? '-'}</p>
                <button type='button' onClick={handleLike} disabled={connectionStatus !== 'connected' || likeCount === null}>
                    like
                </button>
                {likeError && (
                    <p role='alert'>{likeError}</p>
                )}
            </section>
            <section>
                <h2>Comment</h2>

                <div>
                    <label>
                        comment:
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
                        disabled={connectionStatus !== 'connected'}
                    >
                        Send
                    </button>
                </div>

                {commentError && (
                    <p role="alert">{commentError}</p>
                )}

                {comments.length === 0 && <p>not comment</p>}

                <ul>
                    {comments.map((comment) => (
                        <li key={comment.id}>
                            <span>{comment.nickname}: </span>
                            <span>{comment.content}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    )
}


export default LiveRoomPage;
