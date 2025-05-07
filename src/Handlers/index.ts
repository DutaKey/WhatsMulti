import { WASocket } from '@whiskeysockets/baileys';
import { events } from '../Stores';
import { EventMap, EventMapKey } from '../Types/Event';

export const processCallbacks: Array<(events: EventMap, sessionId: string, sock: WASocket) => void | Promise<void>> =
    [];

export const on = <K extends EventMapKey>(
    eventKey: K,
    e: (data: EventMap[K], sessionId: string, sock: WASocket) => void
) => {
    events.set(eventKey, e);
};

export const process = (cb: (events: EventMap, sessionId: string, sock: WASocket) => void | Promise<void>) => {
    processCallbacks.push(cb);
};
