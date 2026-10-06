import { API_BASE_URL } from "./config";
import type { GiftItem } from "../types/liveRoom";

export const getGifts = async (signal?: AbortSignal): Promise<GiftItem[]> => {
    const response = await fetch(`${API_BASE_URL}/gifts`, { signal });
    const data = await response.json() as GiftItem[];
    return data;
}

export const sendRoomGift = async (
    roomId: string,
    nickname: string,
    giftId: string,
    signal?: AbortSignal
): Promise<void> => {
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length === 0 || trimmedNickname.length > 20) {
        throw new Error('nickname must be to 1-20 char');
    }
    const response = await fetch(`${API_BASE_URL}/gifts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            roomId,
            nickname: trimmedNickname,
            giftId
        }),
        signal
    });

    if (!response.ok) {
        const data: unknown = await response.json();
        if (
            typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            typeof data.message === 'string'
        ) {
            throw new Error(data.message);
        }
        throw new Error(`failed to send gift: ${response.status}`);
    }
}