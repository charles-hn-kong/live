import { rooms } from '../data/rooms';

import type { LiveRoom, LiveRoomSummary } from '../types/liveRoom';

export const getRooms = (): LiveRoomSummary[] => {
    return rooms.map(({playUrl: _playUrl, startedAt: _startedAt, ...room}) => room);
}

export const getRoomById = (id: string): LiveRoom | undefined => {
    return rooms.find((room: LiveRoom) => room.id === id);
}