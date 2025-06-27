import { SocketConfig, WAConnectionState, WASocket } from '@whiskeysockets/baileys';
import { ConnectionType } from './Connection';

export type SessionStatusType = WAConnectionState;

export type CreateSessionOptionsType = object;

export type LoggerLevel = 'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type SockConfig = SocketConfig & {
    disableQRRetry?: boolean;
    qrMaxWaitMs?: number;
    printQR?: boolean;
};

export type SessionStoreType = {
    sock: WASocket | null;
    status: SessionStatusType;
    metadata: MetaSessionStoreType;
    scanned?: boolean;
};

export type MetaSessionStoreType = {
    connectionType: ConnectionType;
    socketConfig: Partial<SockConfig>;
    options?: CreateSessionOptionsType;
};
