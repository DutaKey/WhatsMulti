import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import {
    authState,
    deleteSessionOnLocal,
    deleteSessionOnMongo,
    isSessionExist,
    isSessionRunning,
    updateSessionStatus,
} from '../Utils';
import { baileysLogger, logger } from '../Utils/logger';
import { Configs, events, sessions } from '../Stores';
import { handleSocketEvents } from '../Handlers/socket';
import { EventMap } from '../Types/Event';
import { ConnectionType } from '../Types/Connection';
import { CreateSessionOptionsType, SessionStatusType, SockConfig } from '../Types/Session';
import { getSocketConfig } from '../Utils/socket';

export const createSession = async (
    sessionId: string,
    connectionType: ConnectionType = Configs.getValue('defaultConnectionType') || 'local',
    socketConfig: Partial<SockConfig> = {},
    options?: CreateSessionOptionsType
) => {
    if ((await isSessionExist(sessionId)) && isSessionRunning(sessionId))
        return logger.warn(`Session ${sessionId} is already running`);
    if (connectionType === 'mongodb' && !Configs.getValue('mongoUri')) return logger.error('Mongo URI is not defined');

    const startSocket = async () => {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await authState({
            sessionId,
            connectionType,
        });
        socketConfig = getSocketConfig(socketConfig);

        const sock = makeWASocket({
            version,
            auth: state,
            logger: baileysLogger,
            ...socketConfig,
        });

        // Set session to sessions map
        sessions.set(sessionId, {
            sock,
            status: 'connecting',
            connectionType,
            meta: {
                socketConfig,
                options,
                createdAt: new Date(),
            },
        });

        // Handle socket events
        sock.ev.process(async (events: EventMap) => {
            handleSocketEvents({
                sessionId,
                eventMap: events,
                sock,
            });
        });

        // Handle manual events creds and connection updates
        sock.ev.on('creds.update', async () => {
            await saveCreds();
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
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
                        startSocket();
                    } else {
                        deleteSession(sessionId);
                        events.get('disconnected')?.({ connection }, sessionId);
                    }
                } else if (connection === 'connecting') {
                    events.get('connecting')?.({ connection }, sessionId);
                } else if (connection === 'open') {
                    events.get('connected')?.({ connection }, sessionId);
                }
            }
        });

        // Timeout for QR code
        const timeout = socketConfig.disableQRRetry ? socketConfig.qrTimeout : socketConfig.qrMaxWaitMs;
        setTimeout(async () => {
            const session = getSession(sessionId);
            if (session?.status === 'connecting') {
                updateSessionStatus(sessionId, 'close');
                session.force_close = true;
                logger.error(`Session ${sessionId} timed out after ${timeout}ms`);
                return await sock.ws.close();
            }
            if (session) delete session.force_close;
        }, timeout);
    };

    startSocket();
};

export const getSession = (sessionId: string) => sessions.get(sessionId);

export const getSessions = () => Array.from(sessions.keys());

export const getSessionStatus = (sessionId: string) => getSession(sessionId)?.status;

export const deleteSession = async (sessionId: string) => {
    try {
        const session = getSession(sessionId);
        if (isSessionRunning(sessionId)) {
            await session?.sock.logout().catch(() => {});
        }
        if (!isSessionExist(sessionId)) return logger.error(`Session ${sessionId} does not exist`);

        switch (session?.connectionType) {
            case 'local':
                deleteSessionOnLocal(sessionId);
                break;
            case 'mongodb':
                await deleteSessionOnMongo(sessionId);
        }
    } catch (error) {
        logger.error(error);
    }
};
