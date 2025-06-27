import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, WASocket } from '@whiskeysockets/baileys';
import { authState, logger } from '../Utils';
import { AuthStateType, ConnectionType } from '../Types/Connection';
import { SessionStatusType, SockConfig } from '../Types/Session';
import { getSocketConfig } from '../Utils/socket';
import { EventMap, EventMapKey, MetaEventCallbackType } from '../Types';

export class Session {
    readonly id: string;
    readonly connectionType: ConnectionType;
    status: SessionStatusType = 'close';
    qr?: EventMap['qr'];
    socket?: WASocket;
    private auth!: AuthStateType;
    private logger;
    private forceStop = false;
    private eventCallbacks: <K extends EventMapKey>(event: K, data: EventMap[K], meta: MetaEventCallbackType) => void =
        () => {};

    constructor(
        id: string,
        connectionType: ConnectionType,
        eventCallbacks: <K extends EventMapKey>(
            event: K,
            data: EventMap[K],
            meta: MetaEventCallbackType
        ) => void = () => {}
    ) {
        this.id = id;
        this.connectionType = connectionType;
        this.logger = logger.child({ sessionId: id });
        this.eventCallbacks = eventCallbacks;
    }

    async init() {
        const auth = await authState({
            sessionId: this.id,
            connectionType: this.connectionType,
        });
        this.auth = auth;
    }

    private emit<K extends EventMapKey>(event: K, data: EventMap[K]) {
        this.eventCallbacks(event, data, {
            sessionId: this.id,
            socket: this.socket,
        });
    }

    private bindSocketEvents() {
        if (!this.socket) return;
        this.socket.ev.process(async (events: EventMap) => {
            const evKey = Object.keys(events)[0];
            const evData = events[evKey];

            // Emit the event to the event bus
            this.emit(evKey as EventMapKey, evData);

            switch (evKey) {
                case 'creds.update': {
                    await this.auth.saveCreds();
                    break;
                }

                case 'connection.update': {
                    if (evData.qr) {
                        const qrImage = await QRCode.toDataURL(evData.qr);
                        const qrData = {
                            image: qrImage,
                            qr: evData.qr,
                        };

                        this.qr = qrData;

                        // qr event
                        this.emit('qr', qrData);
                    }

                    // connection status event
                    this.emit(evData.connection, evData);

                    if (evData.connection === 'open') {
                        this.status = 'open';
                    } else if (evData.connection === 'close') {
                        this.status = 'close';
                        const code = (evData.lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
                        if (!this.forceStop && code !== DisconnectReason.loggedOut) {
                            this.logger.info({ code }, 'socket closed, restarting');
                            await this.start().catch((err) => this.logger.error({ err }, 'failed to restart'));
                        }
                    }
                    break;
                }
            }
        });
    }

    async start(socketConfig: Partial<SockConfig> = {}) {
        if (this.socket) return;
        this.forceStop = false;
        if (!this.auth) await this.init();
        const { version } = await fetchLatestBaileysVersion();
        const config = getSocketConfig(socketConfig);
        this.status = 'connecting';
        this.socket = makeWASocket({
            auth: this.auth.state,
            version,
            logger: this.logger,
            ...config,
        });
        this.bindSocketEvents();
    }

    async stop() {
        if (!this.socket) return;
        this.forceStop = true;
        this.socket.end(new Error('Manual stop'));
        this.socket = undefined;
        this.status = 'close';
    }

    async restart() {
        await this.stop();
        await this.start();
    }

    async logout() {
        if (!this.socket) return;
        await this.socket.logout();
        this.qr = undefined;
        this.status = 'close';
    }
}

// import { handleSocketEvents } from '../Handlers/socket';
// import { SessionEventBus } from '../Handlers';

// export const createSession = async (
//     sessionId: string,
//     connectionType: ConnectionType = Configs.getValue('defaultConnectionType') || 'local',
//     socketConfig: Partial<SockConfig> = {},
//     options?: CreateSessionOptionsType
// ) => {
//     if (isSessionRunning(sessionId)) return logger.warn(`Session ${sessionId} is already running`);
//     if (connectionType === 'mongodb' && !Configs.getValue('mongoUri')) return logger.error('Mongo URI is not defined');
//     if (isSessionInMemory(sessionId)) return;

//     const { setMeta } = await authState({
//         sessionId,
//         connectionType,
//     });

//     socketConfig = getSocketConfig(socketConfig);

//     const { version } = await fetchLatestBaileysVersion();
//     const { state } = await authState({ sessionId, connectionType });

//     const sock = makeWASocket({
//         version,
//         auth: state,
//         logger: baileysLogger,
//         ...socketConfig,
//     });

//     const metadata = {
//         connectionType,
//         socketConfig,
//         options,
//         timestamp: {
//             createdAt: new Date(),
//         },
//     };

//     // Set session metadata
//     setMeta(metadata);

//     // Set session to sessions map
//     sessions.set(sessionId, {
//         sock,
//         status: 'close',
//         metadata,
//     });

//     sock.ws.close();

//     console.log('Sock is closed:', sock.ws.isClosed);
//     console.log('Sock is open:', sock.ws.isOpen);
//     console.log('Sock is connecting:', sock.ws.isConnecting);
// };

// export const loginSession = async (sessionId: string) => {
//     if (!(await isSessionExist(sessionId))) return logger.error(`Session ${sessionId} does not exist`);
//     if (await isSessionRegistered(sessionId)) return logger.warn(`Session ${sessionId} is already registered`);

//     const session = getSession(sessionId);
//     if (!session) return logger.error(`Session ${sessionId} is not found`);

//     const { connectionType, socketConfig } = session.metadata;
//     const { saveCreds } = await authState({ sessionId, connectionType });
//     const { sock } = session;
//     if (!sock) return logger.error(`Session ${sessionId} has no active socket connection`);

//     sock.ev.on('creds.update', saveCreds);

//     let isScanned = false;
//     const cleanup = () => {
//         sock.ev.removeAllListeners('connection.update');
//     };

//     sock.ev.on('connection.update', async (update) => {
//         const { connection, lastDisconnect, qr } = update;

//         if (qr) {
//             if (socketConfig?.printQR) {
//                 const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
//                 console.log(`QR Code for session ${sessionId}:\n${qrString}`);
//             }
//         }

//         if (connection === 'open') {
//             cleanup();
//             await sock.ws.close();
//             isScanned = true;
//         } else if (connection === 'close') {
//             const isLoggedOut = (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.loggedOut;

//             if (!isLoggedOut && !isScanned) {
//                 cleanup();
//                 logger.info(`Session ${sessionId} is not scanned, login again`);
//                 await loginSession(sessionId);
//             } else {
//                 cleanup();
//                 logger.info(`Session ${sessionId} is closed`);
//                 updateSessionStatus(sessionId, 'close');
//             }
//         }
//     });
// };

// export const startSession = async (sessionId: string) => {
//     if (!isSessionExist(sessionId)) return logger.error(`Session ${sessionId} does not exist`);
//     if (isSessionRunning(sessionId)) return logger.warn(`Session ${sessionId} is already running`);
//     if (!(await isSessionRegistered(sessionId))) return logger.warn(`Session ${sessionId} is not registered`);

//     const start = async () => {
//         try {
//             const session = getSession(sessionId);
//             if (!session) return logger.error(`Session ${sessionId} is not found`);
//             const { sock } = session;
//             if (!sock) return logger.error(`Session ${sessionId} has no active socket connection`);

//             sock.ev.process(async (events: EventMap) => {
//                 handleSocketEvents({
//                     sessionId,
//                     eventMap: events,
//                     sock,
//                 });
//             });

//             sock.ev.on('connection.update', async (update) => {
//                 const { connection, lastDisconnect } = update;
//                 const session = sessions.get(sessionId);

//                 if (connection) {
//                     const isLoggedOut =
//                         (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.loggedOut;
//                     if (connection === 'close') {
//                         if (!isLoggedOut && session) {
//                             start();
//                         } else {
//                             deleteSession(sessionId);
//                         }
//                     }
//                 }
//             });
//         } catch {
//             logger.error(`Failed to start session ${sessionId}`);
//             updateSessionStatus(sessionId, 'close');
//         }
//     };

//     return await start();
// };

// export const stopSession = async (sessionId: string) => {
//     if (!isSessionExist(sessionId)) return logger.error(`Session ${sessionId} does not exist`);
//     if (!isSessionRunning(sessionId)) return logger.warn(`Session ${sessionId} is not running`);
//     const session = getSession(sessionId);
//     if (!session) return logger.error(`Session ${sessionId} is not found`);
//     const { sock } = session;
//     if (sock) {
//         sock.ev.process(async (events: EventMap) => {
//             handleSocketEvents({
//                 sessionId,
//                 eventMap: events,
//                 sock,
//             });
//         });

//         try {
//             await sock.ws.close();
//         } catch (error) {
//             logger.error(`Failed to stop session ${sessionId}:`, error);
//         }
//     } else {
//         logger.warn(`Session ${sessionId} has no active socket connection`);
//     }
// };

// export const logoutSession = async (sessionId: string) => {
//     if (!isSessionExist(sessionId)) return logger.error(`Session ${sessionId} does not exist`);

//     const session = getSession(sessionId);
//     if (!session) return logger.error(`Session ${sessionId} is not found`);
//     const { sock } = session;
//     if (sock) {
//         sock.ev.process(async (events: EventMap) => {
//             handleSocketEvents({
//                 sessionId,
//                 eventMap: events,
//                 sock,
//             });
//         });

//         try {
//             await sock.logout();
//         } catch (error) {
//             logger.error(`Failed to stop session ${sessionId}:`, error);
//         }
//     } else {
//         logger.warn(`Session ${sessionId} has no active socket connection`);
//     }
// };

// export const getSession = (sessionId: string) => sessions.get(sessionId);

// export const getSessions = () =>
//     Array.from(sessions.entries()).map(([sessionId, session]) => ({
//         sessionId,
//         metadata: session.metadata,
//     }));

// export const getSessionStatus = (sessionId: string) => getSession(sessionId)?.status;

// export const deleteSession = async (sessionId: string) => {
//     try {
//         const session = getSession(sessionId);
//         if (isSessionRunning(sessionId)) {
//             await logoutSession(sessionId);
//         }
//         if (!isSessionExist(sessionId)) return logger.error(`Session ${sessionId} does not exist`);

//         switch (session?.metadata.connectionType) {
//             case 'local':
//                 deleteSessionOnLocal(sessionId);
//                 break;
//             case 'mongodb':
//                 await deleteSessionOnMongo(sessionId);
//         }
//     } catch (error) {
//         logger.error(error);
//     }
// };

// export const loadSessions = async () => {
//     const sessionIds = await getAllExistingSessions();
//     const sessionDataList: {
//         sessionId: string;
//         connectionType: ConnectionType;
//         metadata?: MetaSessionStoreType;
//     }[] = [];

//     for (const sessionId of sessionIds) {
//         try {
//             const connectionType = (await getConnectionType(sessionId)) || 'local';

//             const { getMeta } = await authState({ sessionId, connectionType });
//             const meta = (await getMeta()) || undefined;

//             sessionDataList.push({ sessionId, connectionType, metadata: meta });
//         } catch (err) {
//             logger.error(`Failed to get meta for session ${sessionId}:`, err);
//         }
//     }

//     const promises = sessionDataList.map(async ({ sessionId, connectionType, metadata }) => {
//         await createSession(sessionId, connectionType, metadata?.socketConfig);
//     });

//     await Promise.all(promises);
// };
