import type { LiveRoom, LiveRoomSummary } from '../types/liveRoom';

const API_BASE_URL = 'http://localhost:3000/api';

const request = async <T>(url: string):Promise<T> => {
    const response = await fetch(url);
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


export const getLiveRoom = (id: string): Promise<LiveRoom> => {
    const query = new URLSearchParams({id});

    return request<LiveRoom>(`${API_BASE_URL}/rooms?${query.toString()}`);
}