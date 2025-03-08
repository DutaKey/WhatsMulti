import { BaileysEventMap, WASocket } from "@whiskeysockets/baileys"

export type EventMap = BaileysEventMap & {
    'qr': { image: Buffer, qr: string };
    'connected': {};
    'disconnected': {};
    'connecting': {};
}

export type EventMapKey = keyof EventMap

export type EventHandlerType = {
    sessionId: string,
    eventMap: EventMap,
    sock: WASocket,
    saveCreds: () => void
}
