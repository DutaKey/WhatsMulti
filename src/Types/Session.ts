import { SocketConfig, WAConnectionState, WASocket } from '@whiskeysockets/baileys';
import { ConnectionType } from './Connection';

export type SessionStatusType = WAConnectionState;

export type CreateSessionOptionsType = object;

export type LoggerLevel = 'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type SockConfig = SocketConfig & {
    disableQRRetry?: boolean;
    qrMaxWaitMs?: number;
};

export type SessionStoreType = {
    sock: WASocket;
    status: SessionStatusType | 'close';
    connectionType: ConnectionType;
    meta: MetaSessionStoreType;
    force_close?: boolean;
};

type MetaSessionStoreType = {
    socketConfig?: Partial<SockConfig>;
    options?: CreateSessionOptionsType;
    createdAt?: Date;
};
