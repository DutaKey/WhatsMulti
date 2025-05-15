import { EventHandlerType, EventMapKey } from '../Types/Event';
import { events } from '../Stores';
import { logger } from '../Utils/logger';
import { processCallbacks } from '.';

export const handleSocketEvents = ({ sessionId, eventMap, sock }: EventHandlerType) => {
    for (const cb of processCallbacks) {
        try {
            const res = cb(eventMap, sessionId, sock);
            if (res && typeof (res as Promise<void>).catch === 'function') {
                (res as Promise<void>).catch(logger.error);
            }
        } catch (err) {
            logger.error(err);
        }
    }

    Object.entries(eventMap).forEach(([key, data]) => {
        events.get(key as EventMapKey)?.(data, sessionId, sock);
    });
};
