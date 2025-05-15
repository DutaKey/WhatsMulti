import { BaileysEventMap, WASocket } from '@whiskeysockets/baileys';

export type EventMap = BaileysEventMap & {
    qr: { image: string; qr: string };
    connected: object;
    disconnected: object;
    connecting: object;
};

export type EventMapKey = keyof EventMap;

export type EventHandlerType = {
    sessionId: string;
    eventMap: EventMap;
    sock: WASocket;
};
