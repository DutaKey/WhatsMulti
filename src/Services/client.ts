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

    /**
     * Creates a new WhatsApp session.
     *
     * @param sessionId The id of the session. This id is used to identify the session.
     * @param connectionType The type of connection to use. Defaults is 'local'.
     * @param socketConfig (optional) The config for the socket. Defaults to an empty object.
     * @param options (optional) Additional options. Defaults to an empty object.
     * @returns A promise that resolves with the session.
     *
     * @example
     * await client.createSession('session1', 'local');
     */
    async createSession(
        sessionId: string,
        connectionType?: ConnectionType,
        socketConfig: Partial<SockConfig> = {},
        options?: CreateSessionOptionsType
    ) {
        return await sessions.createSession(sessionId, connectionType, socketConfig, options);
    }

    /**
     * Returns a session.
     *
     * @param sessionId The id of the session. This id is used to identify the session.
     * @returns The session.
     *
     * @example
     * const session = client.getSession('session1');
     * console.log(session);
     */
    getSession(sessionId: string) {
        return sessions.getSession(sessionId);
    }
    /**
     * Gets all sessions.
     *
     * @returns All sessions.
     * '
     * @example
     * const sessions = client.getSessions();
     * console.log(sessions);
     */
    getSessions() {
        return sessions.getSessions();
    }
    /**
     * Gets the status of a session.
     *
     * @param sessionId The id of the session. This id is used to identify the session.
     * @returns The status of the session.
     *
     * @example
     * const status = client.getSessionStatus('session1');
     * console.log(status);
     */
    getSessionStatus(sessionId: string) {
        return sessions.getSessionStatus(sessionId);
    }
    /**
     * Deletes a session.
     *
     * @param sessionId The id of the session. This id is used to identify the session.
     *
     * @example
     * await client.deleteSession('session1');
     */
    deleteSession(sessionId: string) {
        return sessions.deleteSession(sessionId);
    }
    // Message Function

    /**
     * Sends a message.
     *
     * @param sessionId The id of the session. This id is used to identify the session.
     * @param recipient The recipient of the message. This can be a jid, number or a WAMessage.
     * @param message The message to send. This can be any message content.
     * @param options Additional options. Defaults to an empty object.
     * @returns A promise that resolves with the result of the message sending.
     *
     * @example
     * await client.sendMessage('session1', '628123456789', { text: 'Hello' });
     */
    sendMessage(
        sessionId: string,
        recipient: string | WAMessage,
        message: AnyMessageContent,
        options?: MiscMessageGenerationOptions
    ) {
        return messages.sendMessage(sessionId, recipient, message, options);
    }
    // Events Function

    /**
     * Registers a listener for a specific event based on the defined EventMap key.
     *
     * @template K - The type of the event key (EventMapKey)
     * @param {K} eventKey - The event name to listen for
     * @param {(data: EventMap[K], sessionId: string, sock: WASocket) => void} e - Callback function that will be triggered when the event is emitted
     *
     * @example
     * client.on('connected', (data, sessionId, sock) => {
     *   console.log(`${sessionId} is connected.`);
     * });
     */
    on = <K extends EventMapKey>(eventKey: K, e: (data: EventMap[K], sessionId: string, sock: WASocket) => void) =>
        events.on(eventKey, e);

    /**
     * Registers a global callback that will be triggered whenever any event is emitted,
     * without requiring knowledge of the specific event type.
     *
     * Useful for logging, analytics, or centralized event handling.
     *
     * @param {(events: EventMap, sessionId: string, sock: WASocket) => void | Promise<void>} cb - Callback function invoked with the complete event map, session ID, and socket
     *
     * @example
     * client.process((events, sessionId, sock) => {
     *   console.log(`Events from ${sessionId}:`, events);
     * });
     */
    process = (cb: (events: EventMap, sessionId: string, sock: WASocket) => void | Promise<void>) => events.process(cb);
}

export { WhatsMulti };
