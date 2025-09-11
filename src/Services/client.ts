import { sessions } from '../Stores';
import {
    ConfigType,
    ConnectionType,
    MessageContentType,
    MessageOptionsType,
    MessageType,
    SessionInstance,
    SockConfig,
    SocketType,
} from '../Types';
import { getAllExistingSessions, createLogger, validateSessionId } from '../Utils';
import { Session } from './sessions';
import { WMEventEmitter } from './event';
import { MessageService } from './messages';

export class WhatsMulti extends WMEventEmitter {
    private sessions = sessions;
    public message: MessageService;
    private logger: ReturnType<typeof createLogger>;
    private config: ConfigType;

    constructor(config: ConfigType = {}) {
        super();
        this.config = config;
        this.logger = createLogger(config.LoggerLevel || 'info');
        this.message = new MessageService(this);
    }

    private getSessionOrThrow(sessionId: string): Session {
        const s = this.sessions.get(sessionId);
        if (!s) throw new Error(`Session not found: ${sessionId}`);
        return s;
    }

    private getSocket(sessionId: string): SocketType | undefined {
        const s = this.getSessionOrThrow(sessionId);
        return s.socket;
    }

    async createSession(
        id: string,
        connectionType: ConnectionType = 'local',
        socketConfig?: Partial<SockConfig>
    ): Promise<void> {
        if (!validateSessionId(id)) throw new Error('Invalid session id');
        if (this.sessions.has(id)) throw new Error('Session exists');
        const session = new Session(
            id,
            connectionType,
            socketConfig,
            this.config,
            (event, data, { sessionId, socket }) => {
                this.emit(event, data, {
                    sessionId,
                    socket,
                });
            }
        );
        await session.init();
        this.sessions.set(id, session);

        if (this.config.startWhenSessionCreated) {
            await session.start();
        }
    }
    async startSession(id: string) {
        return this.getSessionOrThrow(id).start();
    }

    async stopSession(id: string) {
        return this.getSessionOrThrow(id).stop();
    }

    async restartSession(id: string) {
        return this.getSessionOrThrow(id).restart();
    }

    async logoutSession(id: string) {
        return this.getSessionOrThrow(id).logout();
    }

    async deleteSession(id: string) {
        const s = this.getSessionOrThrow(id);
        await s.logout();
        this.sessions.delete(id);
    }

    async getSession(id: string): Promise<SessionInstance | undefined> {
        const s = this.sessions.get(id);
        if (!s) return undefined;
        return {
            id: s.id,
            connectionType: s.connectionType,
            status: s.status,
            sessionStartTime: s.sessionStartTime,
            lastDisconnectTime: s.lastDisconnectTime,
            qr: s.qr,
        };
    }

    async getSessions(): Promise<SessionInstance[]> {
        return Array.from(this.sessions.values()).map((s) => ({
            id: s.id,
            connectionType: s.connectionType,
            sessionStartTime: s.sessionStartTime,
            lastDisconnectTime: s.lastDisconnectTime,
            status: s.status,
        }));
    }

    async getQr(id: string): Promise<{ image: string; qr: string } | undefined> {
        const s = this.sessions.get(id);
        if (!s) throw new Error('Session not found');
        return s.qr;
    }

    async loadSessions() {
        const sessionIds = await getAllExistingSessions(this.config);
        const results = await Promise.allSettled(
            sessionIds.map(({ id, connectionType }) => this.createSession(id, connectionType))
        );

        results.forEach((res, idx) => {
            if (res.status === 'rejected') {
                const { id } = sessionIds[idx];
                this.logger.error(`Failed to create session ${id}:`, res.reason);
            }
        });
    }

    async sendMessage(
        sessionId: string,
        recipient: string | MessageType,
        content: MessageContentType,
        options?: MessageOptionsType
    ) {
        return await this.message.send(sessionId, recipient, content, options);
    }
}
