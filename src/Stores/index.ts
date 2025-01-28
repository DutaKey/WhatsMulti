import { EventMapKey } from "../Types/Event";
import { SessionStoreType } from "../Types/Session";

export const sessions: Map<String, SessionStoreType> = new Map();

export const events: Map<EventMapKey, Function> = new Map();
