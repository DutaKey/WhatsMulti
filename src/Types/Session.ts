import { WAConnectionState, WASocket } from "@whiskeysockets/baileys";
import { ConnectionType } from "./Connection";

export type SessionStatusType = WAConnectionState;

type CreateSessionOptionsType = {
    printQrOnTerminal?: boolean
    baileysLoggerLevel?: "debug" | "silent"
}

export type CreateSessionType = {
    sessionId: string;
    connectionType: ConnectionType;
    options?: CreateSessionOptionsType
}

export interface SessionStoreType {
	sock: WASocket;
    status: SessionStatusType | "close";
	connectionType: ConnectionType;
    options?: CreateSessionOptionsType
}
