import { useCallback, useEffect, useRef, useState } from 'react';
import { getGifts, sendRoomGift } from '../../services/giftApi';
import type { GiftItem } from '../../types/liveRoom';
import './GiftPanel.css';

type IProps = {
    roomId: string;
    nickname: string;
    connected: boolean;
};

const GiftPanel = (props: IProps) => {
    const { roomId, nickname, connected } = props;
    const [giftItems, setGiftItems] = useState<GiftItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>();
    const sendControllerRef = useRef<AbortController | null>(null);

    const loadGifts = useCallback(async (signal: AbortSignal) => {
        setLoading(true);
        setError(null);
        try {
            if (!signal.aborted) {
                const data = await getGifts(signal);
                setGiftItems(data);
            }
        } catch (error) {
            if (signal.aborted) {
                return;
            }
            setError(
                error instanceof Error ? error.message : 'gift load fail'
            );
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    }, []);

    const handleSendGift = async (giftId: string) => {
        if (!connected) {
            setError('room have not ready, try agin');
            return;
        }
        if (sendControllerRef.current !== null) {
            return;
        }
        const controller = new AbortController();
        sendControllerRef.current = controller;
        setSending(true);
        setError(null);
        try {
            await sendRoomGift(
                roomId,
                nickname,
                giftId,
                controller.signal
            );
        } catch (error) {
            if (controller.signal.aborted) {
                return;
            }
            setError(
                error instanceof Error
                    ? error.message
                    : 'Gift send failed'
            );
        } finally {
            sendControllerRef.current = null;
            if (!controller.signal.aborted) {
                setSending(false);
            }
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        loadGifts(controller.signal);
        return () => {
            controller.abort();
            if (sendControllerRef.current !== null) {
                sendControllerRef.current.abort();
            }
        }
    }, [loadGifts]);

    return (
        <section className="gift-panel" data-sending={sending}>
            <h2>Gift</h2>

            <div className="gift-panel-actions">
                {giftItems.map((gift) => (
                    <button
                        key={gift.id}
                        type="button"
                        disabled={loading || sending || !connected}
                        onClick={() => {
                            handleSendGift(gift.id);
                        }}
                    >
                        {gift.icon} {gift.name}
                    </button>
                ))}
            </div>

            <p
                className={`gift-panel-status${error ? ' gift-panel-error' : ''}`}
                role={error ? 'alert' : 'status'}
            >
                {error ?? (loading ? 'Loading gift...' : sending ? 'Sending...' : '')}
            </p>
        </section>
    );
}

export default GiftPanel;
