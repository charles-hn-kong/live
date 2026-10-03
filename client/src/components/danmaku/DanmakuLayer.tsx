import { useCallback, useEffect, useRef } from "react";
import type { RoomComment } from "../../types/liveRoom";
import './DanmakuLayer.css';

type IProps = {
    comments: RoomComment[];
}

type DanmakuSlot = {
    element: HTMLSpanElement | null;
    x: number;
    width: number;
    active: boolean;
}

const TRACK_COUNT = 3;
const MAX_PENDING_COUNT = 20;
const MOVE_SPEED = 120;

const DanmakuLayer = (props: IProps) => {
    const { comments } = props;

    const layerRef = useRef<HTMLDivElement>(null);
    const pendingRef = useRef<RoomComment[]>([]);
    const lastCommentIdRef = useRef<string>(null);
    const frameRef = useRef<number>(null);
    const lastFrameTimeRef = useRef<number>(null);
    const slotsRef = useRef<DanmakuSlot[]>(Array.from(
        { length: TRACK_COUNT },
        () => ({
            element: null,
            x: 0,
            width: 0,
            active: false
        })
    ));

    const collectComents = useCallback(() => {
        if (comments.length === 0) {
            pendingRef.current = [];
            lastCommentIdRef.current = null;
            return;
        }
        const lastIndex = comments.findIndex((comment: RoomComment) => {
            return comment.id === lastCommentIdRef.current;
        });
        const newComments = comments.slice(lastIndex + 1);
        console.log(2000, 1, newComments);
        pendingRef.current = [...pendingRef.current, ...newComments].slice(-MAX_PENDING_COUNT);
        lastCommentIdRef.current = comments[comments.length - 1].id;
    }, [comments]);

    const moveDanmaku = useCallback((timestamp: number) => {
        const layer = layerRef.current;
        if (!layer) {
            return;
        }
        const previousTime = lastFrameTimeRef.current ?? timestamp;
        const elapsedSeconds = Math.min(
            timestamp - previousTime,
            50
        ) / 1000;
        lastFrameTimeRef.current = timestamp;

        const layerWith = layer.clientWidth;

        for (const slot of slotsRef.current) {
            const element = slot.element;
            if (!element) {
                continue;
            }
            if (slot.active) {
                slot.x -= MOVE_SPEED * elapsedSeconds;
                if (slot.x + slot.width <= 0) {
                    slot.active = false;
                    element.style.visibility = 'hidden';
                    element.textContent = '';
                }
            }
            if (!slot.active && layerWith > 0) {
                const comment = pendingRef.current.shift();
                if (!comment) {
                    continue;
                }
                element.textContent = `${comment.nickname}: ${comment.content}`
                slot.width = element.offsetWidth;
                slot.x = layerWith;
                slot.active = true;
                element.style.visibility = 'visible';
            }

            if (slot.active) {
                element.style.transform = `translateX(${slot.x}px)`;
            }
        }
        frameRef.current = requestAnimationFrame(moveDanmaku);
    }, []);

    useEffect(() => {
        collectComents();
    }, [comments])

    useEffect(() => {
        frameRef.current = requestAnimationFrame(moveDanmaku);
        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
            }
            frameRef.current = null;
            lastFrameTimeRef.current = null;
        }
    }, [moveDanmaku]);

    return (
        <div
            ref={layerRef}
            className='danmaku-layer'
        >
            {slotsRef.current.map((_, index) => {
                return (
                    <span
                        key={index}
                        ref={(element) => {
                            slotsRef.current[index].element = element;
                        }}
                        className="danmaku-item"
                        style={{
                            top: `${12 + index * 20}%`
                        }}
                    />
                )
            })}
        </div>
    )
}

export default DanmakuLayer;