import { SockConfig } from '../Types/Session';

export const LOCAL_CONNECTION_PATH = 'whatsmulti_session';

export const DEFAULT_CONNECTION_TYPE = 'local';

export const DEFAULT_SOCKET_CONFIG: Partial<SockConfig> = {
    connectTimeoutMs: 30000,
    keepAliveIntervalMs: 60000,
    emitOwnEvents: true,
    fireInitQueries: true,
    qrTimeout: 60000,
    qrMaxWaitMs: 180000,
};
