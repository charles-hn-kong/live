import type { LiveRoom, LiveRoomSummary } from '../types/liveRoom';
import { API_BASE_URL } from './config';

const request = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new Error(
            `Request failed: ${response.status} ${response.statusText}`
        );
    }
    const data = await response.json() as T;
    return data;
}

export const getLiveRooms = (): Promise<LiveRoomSummary[]> => {
    return request<LiveRoomSummary[]>(`${API_BASE_URL}/rooms`);
}


export const getLiveRoom = (id: string, signal?: AbortSignal): Promise<LiveRoom> => {
    const query = new URLSearchParams({ id });

    return request<LiveRoom>(`${API_BASE_URL}/rooms?${query.toString()}`, signal);
}