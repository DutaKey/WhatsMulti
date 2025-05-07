import * as sessions from './sessions';
import * as messages from './messages';
import * as events from '../Handlers';
import { ConfigType, ConnectionType } from '../Types/Connection';
import { CreateSessionOptionsType, SockConfig } from '../Types/Session';
import { AnyMessageContent, MiscMessageGenerationOptions, WAMessage, WASocket } from '@whiskeysockets/baileys';
import { EventMap, EventMapKey } from '../Types/Event';
import { Configs } from '../Stores';

class WhatsMulti {
    constructor(config: ConfigType = {}) {
        Configs.set(config);
    }

    // Sessions Function

    async createSession(
        sessionId: string,
        connectionType?: ConnectionType,
        socketConfig: Partial<SockConfig> = {},
        options?: CreateSessionOptionsType
    ) {
        return await sessions.createSession(sessionId, connectionType, socketConfig, options);
    }

    getSession = (sessionId: string) => sessions.getSession(sessionId);

    getSessions = () => sessions.getSessions();

    getSessionStatus = (sessionId: string) => sessions.getSessionStatus(sessionId);

    deleteSession = (sessionId: string) => sessions.deleteSession(sessionId);

    // Message Function

    sendMessage = (
        sessionId: string,
        recipient: string | WAMessage,
        message: AnyMessageContent,
        options?: MiscMessageGenerationOptions
    ) => messages.sendMessage(sessionId, recipient, message, options);

    // Events Function

    on = <K extends EventMapKey>(eventKey: K, e: (data: EventMap[K], sessionId: string, sock: WASocket) => void) =>
        events.on(eventKey, e);

    process = (cb: (events: EventMap, sessionId: string, sock: WASocket) => void | Promise<void>) => events.process(cb);
}

export { WhatsMulti };
