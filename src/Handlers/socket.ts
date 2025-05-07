import QRCode from 'qrcode';
import { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { EventHandlerType, EventMapKey } from '../Types/Event';
import { events, sessions } from '../Stores';
import { createSession, deleteSession } from '../Services/sessions';
import { SessionStatusType } from '../Types/Session';
import { updateSessionStatus } from '../Utils';
import { logger } from '../Utils/logger';
import { processCallbacks } from '.';

export const handleSocketEvents = ({ sessionId, eventMap, sock, saveCreds }: EventHandlerType) => {
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
        eventHandlers[key]?.({ eventValue: data, sessionId, sock, saveCreds });
    });
};

const handleConnectionUpdate = ({ eventValue, sessionId }): void => {
    const { connection, lastDisconnect, qr } = eventValue;
    const session = sessions.get(sessionId);

    if (qr) {
        QRCode.toDataURL(qr).then((qrUrl: string) => {
            events.get('qr')?.({ image: qrUrl, qr }, sessionId);
        });
    } else if (connection) {
        updateSessionStatus(sessionId, connection as SessionStatusType);

        const isLoggedOut = (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.loggedOut;
        if (connection === 'close') {
            if (!session?.force_close && !isLoggedOut && session) {
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

const eventHandlers = {
    'creds.update': handleCredsUpdate,
    'connection.update': handleConnectionUpdate,
};
