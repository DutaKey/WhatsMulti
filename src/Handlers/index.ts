import { WASocket } from '@whiskeysockets/baileys';
import { events } from '../Stores';
import { EventMap, EventMapKey } from '../Types/Event';

type ProcessCallback<K extends EventMapKey = EventMapKey> = (
    data: EventMap[K],
    eventKey: K,
    sessionId: string,
    sock: WASocket
) => void | Promise<void>;

export const processCallbacks: ProcessCallback[] = [];

export const on = <K extends EventMapKey>(
    eventKey: K,
    e: (data: EventMap[K], sessionId: string, sock: WASocket) => void
) => {
    events.set(eventKey, e);
};

export const process = <K extends EventMapKey>(
    cb: (events: EventMap[K], eventKey: K, sessionId: string, sock: WASocket) => void | Promise<void>
) => {
    processCallbacks.push(cb);
};
