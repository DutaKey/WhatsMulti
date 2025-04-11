import makeWASocket, { fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { authState, deleteSessionOnLocal, deleteSessionOnMongo, isSessionExist, isSessionRunning } from '../Utils';
import { baileysLogger, logger } from '../Utils/logger';
import { Configs, sessions } from '../Stores';
import { handleSocketEvents } from '../Handlers/socket';
import { EventMap } from '../Types/Event';
import { ConnectionType } from '../Types/Connection';
import { CreateSessionOptionsType, SockConfig } from '../Types/Session';
import { connectToMongo, isMongoDBConnected } from '../Utils/mongo-client';

export const createSession = async (
    sessionId: string,
    connectionType: ConnectionType,
    socketConfig: Partial<SockConfig> = {},
    options?: CreateSessionOptionsType
) => {
    try {
        if (isSessionExist(sessionId) && isSessionRunning(sessionId))
            return logger.warn(`Session ${sessionId} is already running`);
        if (connectionType === 'mongodb' && !Configs.getValue('mongoUri'))
            return logger.error('Mongo URI is not defined');

        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await authState({
            sessionId,
            connectionType,
        });

        const sock = makeWASocket({
            version,
            auth: state,
            logger: baileysLogger(socketConfig.loggerLevel ?? 'silent'),
            printQRInTerminal: socketConfig.printQRInTerminal ?? true,
            connectTimeoutMs: socketConfig.connectTimeoutMs ?? 30000,
            keepAliveIntervalMs: socketConfig.keepAliveIntervalMs ?? 60000,
            emitOwnEvents: socketConfig.emitOwnEvents ?? true,
            fireInitQueries: socketConfig.fireInitQueries ?? true,
            qrTimeout: socketConfig.qrTimeout ?? 60000,
            ...socketConfig,
        });

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

        sock.ev.process(async (events: EventMap) => {
            handleSocketEvents({
                sessionId,
                eventMap: events,
                sock,
                saveCreds,
            });
        });
    } catch (e) {
        logger.error(e);
    }
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
