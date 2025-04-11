import QRCode from 'qrcode';
import { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { EventHandlerType, EventMapKey } from '../Types/Event';
import { events, sessions } from '../Stores';
import { createSession, deleteSession } from '../Services/sessions';
import { SessionStatusType } from '../Types/Session';

export const handleSocketEvents = ({ sessionId, eventMap, sock, saveCreds }: EventHandlerType) => {
    Object.entries(eventMap).forEach(([key, data]) => {
        events.get(key as EventMapKey)?.(data, sessionId, sock);
        eventHandlers[key]?.({ eventValue: data, sessionId, sock, saveCreds });
    });
};

const handleConnectionUpdate = ({ eventValue, sessionId }): void => {
    const { connection, lastDisconnect, qr } = eventValue;
    const session = sessions.get(sessionId);

    if (qr) {
        QRCode.toDataURL(qr).then((qrUrl: String) => {
            events.get('qr')?.({ image: qrUrl, qr }, sessionId);
        });
    } else if (connection) {
        updateSessionStatus(sessionId, connection as SessionStatusType);

        const isLoggedOut = (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.loggedOut;
        if (connection === 'close') {
            if (!isLoggedOut && session) {
                createSession(sessionId, session.connectionType, session.meta.socketConfig, session.meta.options);
            } else {
                deleteSession(sessionId);
                events.get('disconnected')?.({}, sessionId);
            }
        } else if (connection === 'connecting') {
            events.get('connecting')?.({}, sessionId);
        } else if (connection === 'open') {
            events.get('connected')?.({}, sessionId);
        }
    }
};

const handleCredsUpdate = ({ saveCreds }) => {
    saveCreds();
};

const eventHandlers: { [key: string]: Function } = {
    'creds.update': handleCredsUpdate,
    'connection.update': handleConnectionUpdate,
};

const updateSessionStatus = (sessionId: string, status: SessionStatusType): void => {
    const session = sessions.get(sessionId);
    if (session) {
        session.status = status;
    }
};
