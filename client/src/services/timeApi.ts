import { API_BASE_URL } from "./config";

export type ServerClock = {
    serverTime: number;
    measuredAt: number;
}

export const getServerClock = async (signal: AbortSignal): Promise<ServerClock> => {
    const requestedAt = performance.now();

    const response = await fetch(`${API_BASE_URL}/time`, {
        signal,
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`time request failed ${response.status}`);
    }

    const data: unknown = await response.json();
    const receivedAt = performance.now();

    if (
        typeof data !== 'object' ||
        data === null ||
        !('serverTime' in data) ||
        typeof data.serverTime !== 'number' ||
        !Number.isFinite(data.serverTime)
    ) {
        throw new Error('invalid server time');
    }

    const halfRoundTrip = (receivedAt - requestedAt) / 2;
    return {
        serverTime: data.serverTime + halfRoundTrip,
        measuredAt: receivedAt
    }
}
