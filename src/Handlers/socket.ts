import { DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from '@hapi/boom';
import { EventHandlerType, EventMapKey } from "../Types/Event";
import { events, sessions } from "../Stores";
import { createSession, deleteSession } from "../Services";
import { SessionStatusType } from "../Types/Session";

export const handleSocketEvents = ({ sessionId, eventMap, sock, saveCreds }: EventHandlerType) => {
    Object.entries(eventMap).forEach(([key, value]) => {
        events.get(key as EventMapKey)?.(value, sessionId, sock);
        eventHandlers[key]?.({ eventValue: value, sessionId, sock, saveCreds });
    });
};


const handleConnectionUpdate = ({ eventValue, sessionId }): void => {
    const { connection, lastDisconnect, qr } = eventValue;
    const sessionData = sessions.get(sessionId);

    if (qr) {
        events.get("qr")?.(qr, sessionId);
    } else if(connection) {
        updateSessionStatus(sessionId, connection as SessionStatusType);
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect && sessionData) {
                const args = { sessionId, connectionType: sessionData.connectionType, options: sessionData.options }
                createSession(args)
            } else {
                deleteSession(sessionId);
                events.get('disconnected')?.({}, sessionId);
            }
        } else if(connection === 'connecting') {
            events.get('connecting')?.({}, sessionId);
        }
         else if (connection === 'open') {
            events.get('connected')?.({}, sessionId);
        }
    }
}

const handleCredsUpdate = ({ saveCreds }) => {
    saveCreds();
}

const eventHandlers: { [key: string]: Function } = {
    "creds.update": handleCredsUpdate,
    "connection.update": handleConnectionUpdate,
};

const updateSessionStatus = (sessionId: string, status: SessionStatusType): void => {
    const session = sessions.get(sessionId);
    if (session) {
        session.status = status;
    }
}
