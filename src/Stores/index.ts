import { WASocket } from "@whiskeysockets/baileys";
import { EventMap, EventMapKey } from "../Types/Event";
import { SessionStoreType } from "../Types/Session";

export const sessions: Map<String, SessionStoreType> = new Map();

export const events: Map<EventMapKey, (data: EventMap[EventMapKey], sessionId: string, sock?: WASocket) => any> = new Map();
