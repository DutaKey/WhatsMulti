import { LoggerLevel } from './Session';

export type ConnectionType = 'local' | 'mongodb';

export type AuthStateType = {
    sessionId: string;
    connectionType: ConnectionType;
};
export type ConfigType = {
    defaultConnectionType?: ConnectionType;
    localConnectionPath?: string;
    LoggerLevel?: LoggerLevel;
    mongoUri?: string;
};
